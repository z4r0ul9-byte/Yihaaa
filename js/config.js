/*
  config.js
  Tujuan     : Set NUM_HANDS: 2 agar bisa menyambung tali antar dua tangan.
*/

export const CONFIG = {
  WASM_ROOT: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
  TASKS_VISION_ESM: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm',
  MODEL_URL: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',

  // WAJIB 2 TANGAN untuk fitur tali karet
  NUM_HANDS: 2, 
  MIN_HAND_DETECTION_CONFIDENCE: 0.5,
  MIN_HAND_PRESENCE_CONFIDENCE: 0.5,
  MIN_TRACKING_CONFIDENCE: 0.5,

  CAMERA: {
    facingMode: 'user',
    width: { max: 640 },
    height: { max: 480 },
    frameRate: { max: 30 }
  },

  CURSOR: {
    EMA_ALPHA: 0.5,
    HAND_SWITCH_HYSTERESIS: 0.15,
    RADIUS: 14,
    COLOR_OUTER: 'rgba(255, 255, 255, 0.85)',
    COLOR_INNER: '#4d6bfe'
  },

  GESTURE: {
    PINCH_IN: 0.25,
    PINCH_OUT: 0.35,
  },

  HAND_CONNECTIONS: [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
  ],

  HAND_COLORS: [
    { bone: '#63f5a1', point: '#e6ffe9', label: '#0f6b38' },
    { bone: '#63b9f5', point: '#e6f3ff', label: '#0f4d6b' }
  ]
};

export function loadConfigFromStorage() {
  const raw = localStorage.getItem('handGestureConfig');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.GESTURE) Object.assign(CONFIG.GESTURE, data.GESTURE);
    if (data.CURSOR && data.CURSOR.EMA_ALPHA) CONFIG.CURSOR.EMA_ALPHA = data.CURSOR.EMA_ALPHA;
  } catch (e) {}
}

export function saveConfigToStorage() {
  const data = { GESTURE: CONFIG.GESTURE, CURSOR: { EMA_ALPHA: CONFIG.CURSOR.EMA_ALPHA } };
  localStorage.setItem('handGestureConfig', JSON.stringify(data));
}
