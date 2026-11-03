/*
  camera.js
  Tujuan     : Lifecycle kamera depan via getUserMedia + mapping error.
  Dependensi : Tidak ada.
*/

export function isSecureContextOK() {
  return window.isSecureContext === true;
}

export async function startCamera(videoEl, videoConstraints) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Browser tidak mendukung getUserMedia. Gunakan Chrome Android terbaru.');
  }
  if (!isSecureContextOK()) {
    throw new Error('Halaman bukan secure context. Kamera hanya bisa diakses via http://localhost atau https://.');
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

  await waitForMetadata(videoEl);
  try { await videoEl.play(); } catch (_) {}

  return stream;
}

export function stopCamera(stream) {
  if (!stream) return;
  for (const track of stream.getTracks()) track.stop();
}

function waitForMetadata(videoEl) {
  return new Promise((resolve, reject) => {
    if (videoEl.readyState >= 1 && videoEl.videoWidth > 0) return resolve();
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

function mapCameraError(err) {
  const name = err && err.name ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Izin kamera ditolak. Buka Setelan Chrome → Izin situs → Kamera → Izinkan, lalu muat ulang.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Kamera depan tidak ditemukan atau tidak memenuhi constraint.';
    case 'NotReadableError':
      return 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu coba lagi.';
    case 'AbortError':
      return 'Akses kamera dibatalkan oleh sistem. Coba lagi.';
    default:
      return 'Gagal mengakses kamera: ' + (err && err.message ? err.message : String(err));
  }
}

