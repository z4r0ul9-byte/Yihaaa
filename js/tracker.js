/*
  tracker.js
  Tujuan     : Inisialisasi MediaPipe HandLandmarker (tasks-vision) dengan
               delegate GPU → fallback CPU, lalu expose satu fungsi detect().
  Dependensi : config.js (via parameter CONFIG)
  Catatan    : - Pakai API HandLandmarker (bukan Hands legacy).
               - runningMode: "VIDEO" + detectForVideo(video, timestampMs).
               - Timestamp WAJIB monoton naik. Caller bertanggung jawab.
*/

/**
 * Buat instance HandLandmarker.
 * @param {object} config  CONFIG dari config.js
 * @param {(msg: string) => void} [onProgress]
 * @returns {Promise<{ landmarker: object, delegate: 'GPU'|'CPU' }>}
 */
export async function createHandTracker(config, onProgress = () => {}) {
  onProgress('Memuat modul MediaPipe Tasks Vision…');

  let FilesetResolver, HandLandmarker;
  try {
    const mod = await import(config.TASKS_VISION_ESM);
    FilesetResolver = mod.FilesetResolver;
    HandLandmarker = mod.HandLandmarker;
  } catch (err) {
    throw new Error(
      'Gagal memuat modul MediaPipe dari CDN. Cek koneksi internet. Detail: ' +
        (err && err.message ? err.message : String(err))
    );
  }

  if (!FilesetResolver || !HandLandmarker) {
    throw new Error(
      'Modul MediaPipe termuat tetapi export yang diharapkan (FilesetResolver/HandLandmarker) tidak ada.'
    );
  }

  onProgress('Memuat WASM runtime…');
  let vision;
  try {
    vision = await FilesetResolver.forVisionTasks(config.WASM_ROOT);
  } catch (err) {
    throw new Error(
      'Gagal memuat WASM MediaPipe. Cek koneksi internet. Detail: ' +
        (err && err.message ? err.message : String(err))
    );
  }

  const baseOptions = {
    modelAssetPath: config.MODEL_URL
  };

  onProgress('Memuat model hand_landmarker.task (GPU)…');
  let landmarker = null;
  let delegate = 'GPU';

  try {
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { ...baseOptions, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: config.NUM_HANDS,
      minHandDetectionConfidence: config.MIN_HAND_DETECTION_CONFIDENCE,
      minHandPresenceConfidence: config.MIN_HAND_PRESENCE_CONFIDENCE,
      minTrackingConfidence: config.MIN_TRACKING_CONFIDENCE
    });
  } catch (gpuErr) {
    // GPU delegate bisa gagal di HP tertentu (WebGL context / driver).
    // Fallback ke CPU agar aplikasi tetap jalan, bukan diam saja.
    onProgress('GPU gagal, fallback ke CPU…');
    try {
      landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { ...baseOptions, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numHands: config.NUM_HANDS,
        minHandDetectionConfidence: config.MIN_HAND_DETECTION_CONFIDENCE,
        minHandPresenceConfidence: config.MIN_HAND_PRESENCE_CONFIDENCE,
        minTrackingConfidence: config.MIN_TRACKING_CONFIDENCE
      });
      delegate = 'CPU';
    } catch (cpuErr) {
      throw new Error(
        'Gagal membuat HandLandmarker (GPU & CPU). Detail GPU: ' +
          (gpuErr && gpuErr.message ? gpuErr.message : String(gpuErr)) +
          ' | Detail CPU: ' +
          (cpuErr && cpuErr.message ? cpuErr.message : String(cpuErr))
      );
    }
  }

  return { landmarker, delegate };
}

/**
 * Deteksi tangan untuk satu frame video.
 * @param {object} landmarker
 * @param {HTMLVideoElement} videoEl
 * @param {number} timestampMs  monoton naik (performance.now())
 * @returns {{landmarks: Array, handedness: Array}}
 */
export function detectHands(landmarker, videoEl, timestampMs) {
  const result = landmarker.detectForVideo(videoEl, timestampMs);
  return {
    landmarks: result.landmarks || [],
    handedness: result.handedness || []
  };
}

