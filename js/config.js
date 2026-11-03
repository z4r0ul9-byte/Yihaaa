/*
  config.js
  Tujuan     : Pusat konstanta & threshold.
  Dependensi : Tidak ada.
*/

export const CONFIG = {
  WASM_ROOT: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
  TASKS_VISION_ESM: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm',
  MODEL_URL: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',

  NUM_HANDS: 2,
  MIN_HAND_DETECTION_CONFIDENCE: 0.5,
  MIN_HAND_PRESENCE_CONFIDENCE: 0.5,
  MIN_TRACKING_CONFIDENCE: 0.5,

  CAMERA: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 60 }
  },

  CURSOR: {
    EMA_ALPHA: 0.5,
    HAND_SWITCH_HYSTERESIS: 0.15,
    RADIUS: 14,
    COLOR_OUTER: 'rgba(255, 255, 255, 0.85)',
    COLOR_INNER: '#4d6bfe'
  },

  // Konfigurasi Gestur Pinch (Fase C)
  GESTURE: {
    PINCH_IN: 0.25,   // Threshold masuk (cubit)
    PINCH_OUT: 0.35,  // Threshold keluar (lepas) -> Hysteresis
  },

  // Konfigurasi Zoom (Fase C)
  ZOOM: {
    MIN_SCALE: 0.5,
    MAX_SCALE: 4.0
  },

  HAND_CONNECTIONS: [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
  ],

  HAND_COLORS: [
    { bone: '#63f5a1', point: '#e6ffe9', label: '#0f6b38' },
    { bone: '#63b9f5', point: '#e6f3ff', label: '#0f4d6b' }
  ]
};

