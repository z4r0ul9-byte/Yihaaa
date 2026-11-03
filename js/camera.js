/*
  camera.js
  Tujuan     : Lifecycle kamera depan via getUserMedia + mapping error yang jelas.
  Dependensi : config.js (via parameter CONFIG.CAMERA)
  Catatan    : - Wajib secure context (HTTPS / localhost). Chrome Android
                 mengecualikan http://localhost sebagai secure context.
               - Error dipetakan ke pesan manusiawi supaya tidak diam saja.
*/

/**
 * Cek apakah halaman berjalan di secure context.
 * @returns {boolean}
 */
export function isSecureContextOK() {
  return window.isSecureContext === true;
}

/**
 * Mulai kamera dan pasang stream ke elemen <video>.
 * @param {HTMLVideoElement} videoEl
 * @param {MediaTrackConstraints} videoConstraints
 * @returns {Promise<MediaStream>}
 */
export async function startCamera(videoEl, videoConstraints) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Browser tidak mendukung getUserMedia. Gunakan Chrome Android terbaru.'
    );
  }
  if (!isSecureContextOK()) {
    throw new Error(
      'Halaman bukan secure context. Kamera hanya bisa diakses via https:// atau http://localhost. ' +
      'Akses via IP LAN (mis. http://192.168.x.x) akan diblokir Chrome.'
    );
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: videoConstraints
    });
  } catch (err) {
    throw new Error(mapCameraError(err));
  }

  videoEl.srcObject = stream;
  videoEl.setAttribute('playsinline', '');
  videoEl.muted = true;

  // Tunggu metadata supaya videoWidth/videoHeight valid sebelum dipakai.
  await waitForMetadata(videoEl);

  try {
    await videoEl.play();
  } catch (_) {
    // Sebagian browser menolak autoplay tanpa gesture; startBtn sudah jadi gesture.
    // Kalau tetap gagal, error akan muncul dari loop saat first detect.
  }

  return stream;
}

/**
 * Hentikan semua track kamera.
 * @param {MediaStream|null} stream
 */
export function stopCamera(stream) {
  if (!stream) return;
  for (const track of stream.getTracks()) track.stop();
}

/**
 * Tunggu sampai video siap secara metadata.
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<void>}
 */
function waitForMetadata(videoEl) {
  return new Promise((resolve, reject) => {
    if (videoEl.readyState >= 1 && videoEl.videoWidth > 0) {
      resolve();
      return;
    }
    const onLoaded = () => {
      videoEl.removeEventListener('loadedmetadata', onLoaded);
      videoEl.removeEventListener('error', onError);
      resolve();
    };
    const onError = () => {
      videoEl.removeEventListener('loadedmetadata', onLoaded);
      videoEl.removeEventListener('error', onError);
      reject(new Error('Gagal memuat metadata video dari kamera.'));
    };
    videoEl.addEventListener('loadedmetadata', onLoaded, { once: true });
    videoEl.addEventListener('error', onError, { once: true });
  });
}

/**
 * Petakan DOMException kamera ke pesan bahasa manusia.
 * @param {unknown} err
 * @returns {string}
 */
function mapCameraError(err) {
  const name = err && err.name ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Izin kamera ditolak. Buka Setelan Chrome → Izin situs → Kamera → Izinkan, lalu muat ulang.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Kamera depan tidak ditemukan atau tidak memenuhi constraint. Coba perangkat lain / turunkan resolusi.';
    case 'NotReadableError':
      return 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu coba lagi.';
    case 'AbortError':
      return 'Akses kamera dibatalkan oleh sistem. Coba lagi.';
    default:
      return 'Gagal mengakses kamera: ' + (err && err.message ? err.message : String(err));
  }
}

