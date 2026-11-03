/*
  tracker.js
  Tujuan     : Inisialisasi HandLandmarker (GPU→CPU) & fungsi detect.
  Dependensi : config.js
*/

export async function createHandTracker(config, onProgress = () => {}) {
  onProgress('Memuat modul MediaPipe Tasks Vision…');

  let FilesetResolver, HandLandmarker;
  try {
    const mod = await import(config.TASKS_VISION_ESM);
    FilesetResolver = mod.FilesetResolver;
    HandLandmarker = mod.HandLandmarker;
  } catch (err) {
    throw new Error('Gagal memuat modul MediaPipe dari CDN. Cek internet. Detail: ' + (err && err.message ? err.message : String(err)));
  }

  if (!FilesetResolver || !HandLandmarker) {
    throw new Error('Modul MediaPipe termuat tetapi export tidak ada.');
  }

  onProgress('Memuat WASM runtime…');
  let vision;
  try {
    vision = await FilesetResolver.forVisionTasks(config.WASM_ROOT);
  } catch (err) {
    throw new Error('Gagal memuat WASM MediaPipe. Cek internet. Detail: ' + (err && err.message ? err.message : String(err)));
  }

  const baseOptions = { modelAssetPath: config.MODEL_URL };

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
      throw new Error('Gagal membuat HandLandmarker (GPU & CPU). Detail GPU: ' + (gpuErr.message || gpuErr) + ' | CPU: ' + (cpuErr.message || cpuErr));
    }
  }

  return { landmarker, delegate };
}

export function detectHands(landmarker, videoEl, timestampMs) {
  const result = landmarker.detectForVideo(videoEl, timestampMs);
  return {
    landmarks: result.landmarks || [],
    handedness: result.handedness || []
  };
}

