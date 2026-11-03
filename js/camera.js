/*
  camera.js
  Tujuan     : Lifecycle kamera depan, dengan penanganan autoplay yang lebih tangguh.
  Dependensi : Tidak ada.
*/

export function isSecureContextOK() {
  return window.isSecureContext === true;
}

export async function startCamera(videoEl, videoConstraints) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Browser tidak mendukung getUserMedia.');
  }
  if (!isSecureContextOK()) {
    throw new Error('Halaman bukan secure context. Gunakan http://localhost atau https://.');
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

  // Set atribut SEBELUM srcObject agar Android langsung mengenali ini video inline & mute
  videoEl.setAttribute('playsinline', 'true');
  videoEl.setAttribute('webkit-playsinline', 'true');
  videoEl.muted = true;
  videoEl.srcObject = stream;

  await waitForMetadata(videoEl);

  // FIX: Jangan ditelan mentah-mentah. Kalau gagal play, throw error biar user tau.
  try {
    await videoEl.play();
  } catch (err) {
    console.warn('Autoplay gagal, mencoba interaksi pengguna...', err);
    // Fallback: Pasang event listener sekali untuk play manual jika autoplay diblokir
    const playOnClick = () => { 
      videoEl.play(); 
      document.removeEventListener('click', playOnClick); 
    };
    document.addEventListener('click', playOnClick);
    throw new Error('Video kamera berhenti (Autoplay Policy). Ketuk layar untuk memutar ulang.');
  }

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
      reject(new Error('Gagal memuat metadata video.'));
    };
    videoEl.addEventListener('loadedmetadata', onLoaded, { once: true });
    videoEl.addEventListener('error', onError, { once: true });
  });
}

function mapCameraError(err) {
  const name = err && err.name ? err.name : '';
  switch (name) {
    case 'NotAllowedError': return 'Izin kamera ditolak.';
    case 'NotFoundError': return 'Kamera depan tidak ditemukan.';
    case 'NotReadableError': return 'Kamera sedang dipakai aplikasi lain.';
    default: return 'Gagal mengakses kamera: ' + (err && err.message ? err.message : String(err));
  }
}
