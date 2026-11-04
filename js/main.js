/*
  main.js
  Tujuan     : Orkestrator Dual Mode (Rope & Balok 3D) + Fix Z-Axis.
*/

import { CONFIG, loadConfigFromStorage, saveConfigToStorage } from './config.js';
import { startCamera, stopCamera } from './camera.js';
import { createHandTracker, detectHands } from './tracker.js';
import { Cursor } from './cursor.js';
import { GestureDetector } from './gesture.js';
import { Rope } from './rope.js';
import { DimensionBlock } from './block.js';
import { HUD } from './hud.js';
import { Calibration } from './calibration.js';

loadConfigFromStorage();

const videoEl = document.getElementById('video');
const canvasEl = document.getElementById('overlay');
const stageEl = document.getElementById('stage');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const btnToggleMode = document.getElementById('btn-toggle-mode');
const btnToggleModel = document.getElementById('btn-toggle-model');
const btnToggleCam = document.getElementById('btn-toggle-cam');
const modeHint = document.getElementById('mode-hint');
const ctx = canvasEl.getContext('2d');

let stream = null;
let landmarker = null;
let rafId = 0;
let lastVideoTime = -1;
let running = false;

let currentMode = 'rope'; 
let isLocalModel = CONFIG.MODEL_URL === CONFIG.MODEL_URL_LOCAL;

const cursor = new Cursor(CONFIG.CURSOR);
const gesture = new GestureDetector(CONFIG.GESTURE);
const rope = new Rope(15, 20);
const block = new DimensionBlock();
const hud = new HUD();
const calibration = new Calibration(CONFIG, cursor, gesture);

btnToggleModel.textContent = isLocalModel ? 'Model: Local' : 'Model: Cloud';
if (isLocalModel) btnToggleModel.style.background = '#f0dc9a';
btnToggleCam.textContent = CONFIG.CAMERA.facingMode === 'user' ? 'Cam: Depan' : 'Cam: Belakang';

btnToggleMode.addEventListener('click', () => {
  if (currentMode === 'rope') {
    currentMode = 'block';
    btnToggleMode.textContent = 'Mode: Balok 3D';
    btnToggleMode.style.background = '#00e5ff';
    btnToggleMode.style.color = '#000';
    btnToggleMode.style.borderColor = '#00e5ff';
    modeHint.textContent = 'Cubit untuk MINDAH balok. Jauh-deketin DUA TANGAN untuk LEBAR/KECIL.';
  } else {
    currentMode = 'rope';
    btnToggleMode.textContent = 'Mode: Rope';
    btnToggleMode.style.background = '#8a2be2';
    btnToggleMode.style.color = '#fff';
    btnToggleMode.style.borderColor = '#8a2be2';
    modeHint.textContent = 'Tali karet aktif. Tunjukkan dua tangan untuk menyambung tali.';
  }
});

btnToggleModel.addEventListener('click', () => {
  isLocalModel = !isLocalModel;
  CONFIG.MODEL_URL = isLocalModel ? CONFIG.MODEL_URL_LOCAL : CONFIG.MODEL_URL_CLOUD;
  saveConfigToStorage({ USE_LOCAL_MODEL: isLocalModel });
  window.location.reload();
});

btnToggleCam.addEventListener('click', () => {
  const isFront = CONFIG.CAMERA.facingMode === 'user';
  CONFIG.CAMERA.facingMode = isFront ? 'environment' : 'user';
  saveConfigToStorage({ FACING_MODE: CONFIG.CAMERA.facingMode });
  window.location.reload();
});

function setStatus(text, kind = '') {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ' ' + kind : '');
}
function setStartBtn({ disabled, label }) {
  startBtn.disabled = disabled;
  startBtn.textContent = label;
}

function syncCanvasToVideo() {
  const w = videoEl.videoWidth;
  const h = videoEl.videoHeight;
  if (!w || !h) return;
  canvasEl.width = w;
  canvasEl.height = h;
  stageEl.style.aspectRatio = `${w} / ${h}`;
}

function toCanvasXY(lm) {
  return [lm.x * canvasEl.width, lm.y * canvasEl.height];
}

function strokeWidth() { return Math.max(3, Math.round(canvasEl.width * 0.004)); }
function pointRadius() { return Math.max(4, Math.round(canvasEl.width * 0.008)); }

function drawSkeleton(landmarks, connections, color, lw, r) {
  ctx.strokeStyle = color.bone;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [a, b] of connections) {
    const pa = toCanvasXY(landmarks[a]);
    const pb = toCanvasXY(landmarks[b]);
    ctx.beginPath();
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
    ctx.stroke();
  }

  ctx.fillStyle = color.point;
  for (let i = 0; i < landmarks.length; i++) {
    const [x, y] = toCanvasXY(landmarks[i]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function labelForUser(rawCategoryName) {
  if (rawCategoryName === 'Left') return 'KANAN';
  if (rawCategoryName === 'Right') return 'KIRI';
  return rawCategoryName || '?';
}

function drawLabel(landmarks, text, color) {
  const [wx, wy] = toCanvasXY(landmarks[0]);
  const fontSize = Math.max(12, Math.round(canvasEl.width * 0.024));
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const boxW = metrics.width + 20;
  const boxH = fontSize + 10;
  const boxX = wx - boxW / 2;
  const boxY = wy - fontSize - 10 - 6;

  ctx.fillStyle = color.label;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 6);
  else ctx.rect(boxX, boxY, boxW, boxH);
  ctx.fill();

  ctx.save();
  ctx.translate(wx, boxY + boxH / 2);
  ctx.scale(-1, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function render(result, now) {
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  const { landmarks, handedness } = result;

  const handTips = [];
  let depthRatio = 1.0;

  if (landmarks.length > 0) {
    const lw = strokeWidth();
    const r = pointRadius();
    let totalHandSize = 0;

    for (let i = 0; i < landmarks.length; i++) {
      const lms = landmarks[i];
      if (!lms || lms.length < 21) continue;
      
      handTips.push(toCanvasXY(lms[8]));
      totalHandSize += Math.hypot(lms[0].x - lms[9].x, lms[0].y - lms[9].y);

      const color = CONFIG.HAND_COLORS[i % CONFIG.HAND_COLORS.length];
      drawSkeleton(lms, CONFIG.HAND_CONNECTIONS, color, lw, r);

      const hn = handedness[i] && handedness[i][0];
      const rawName = hn && hn.categoryName ? hn.categoryName : '';
      drawLabel(lms, labelForUser(rawName), color);
    }

    const avgHandSize = totalHandSize / landmarks.length;
    
    // FIX: Balik ke rumus normal. Tangan deket (gede) -> Balok maju (nebal).
    depthRatio = avgHandSize / 0.15; 
    depthRatio = Math.max(0.4, Math.min(2.5, depthRatio)); 
  }

  cursor.update(landmarks, handedness, canvasEl.width, canvasEl.height);
  cursor.draw(ctx);

  let activeHandLandmarks = null;
  if (cursor.primaryHandIndex !== -1 && landmarks[cursor.primaryHandIndex]) {
    activeHandLandmarks = landmarks[cursor.primaryHandIndex];
  }
  const gestureData = gesture.update(activeHandLandmarks);
  const isPinching = gestureData.state === 'PINCHED';
  
  const pinchPos = cursor.active ? [cursor.x, cursor.y] : null;

  const t1 = handTips[0] || null;
  const t2 = handTips[1] || null;

  if (currentMode === 'rope') {
    rope.update(t1, t2, canvasEl.width, canvasEl.height);
    rope.draw(ctx);
  } else {
    block.update(t1, t2, isPinching, pinchPos, depthRatio, canvasEl.width, canvasEl.height);
    block.draw(ctx);
  }

  if (isPinching) {
    setStatus(`Mencubit`, 'pinch');
  } else if (running) {
    setStatus(`Siap. Mode: ${currentMode === 'rope' ? 'Tali Karet' : 'Balok 3D'}.`, 'ok');
  }

  hud.update(now, landmarks.length, gestureData);
  calibration.tick(now, gestureData);
}

function loop(now) {
  if (!running) return;
  if (videoEl.readyState >= 2 && videoEl.currentTime !== lastVideoTime) {
    lastVideoTime = videoEl.currentTime;
    try {
      const result = detectHands(landmarker, videoEl, now);
      render(result, now);
    } catch (err) {
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
      setStatus('Runtime Error: ' + err.message, 'error');
      setStartBtn({ disabled: false, label: 'Coba Lagi' });
      return;
    }
  }
  rafId = requestAnimationFrame(loop);
}

async function boot() {
  startBtn.disabled = true;
  setStartBtn({ disabled: true, label: 'Memuat…' });
  setStatus('Menyiapkan kamera…', 'warn');

  try {
    stream = await startCamera(videoEl, CONFIG.CAMERA);
  } catch (err) {
    setStatus(err.message, 'error');
    setStartBtn({ disabled: false, label: 'Coba Lagi' });
    return;
  }

  syncCanvasToVideo();
  setStatus(`Kamera aktif. Memuat model (${isLocalModel ? 'Local' : 'Cloud'})…`, 'warn');

  try {
    const created = await createHandTracker(CONFIG, (msg) => setStatus(msg, 'warn'));
    landmarker = created.landmarker;
    setStatus('Siap. Gunakan 2 tangan!', 'ok');
  } catch (err) {
    stopCamera(stream);
    stream = null;
    setStatus(err.message, 'error');
    setStartBtn({ disabled: false, label: 'Coba Lagi' });
    return;
  }

  running = true;
  lastVideoTime = -1;
  setStartBtn({ disabled: true, label: 'Berjalan' });
  rafId = requestAnimationFrame(loop);
}

startBtn.addEventListener('click', () => {
  if (running || startBtn.disabled) return;
  boot();
});

videoEl.addEventListener('resize', syncCanvasToVideo);

window.addEventListener('pagehide', () => {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  stopCamera(stream);
  stream = null;
});

if (!window.isSecureContext) {
  setStatus('Halaman bukan secure context.', 'error');
  setStartBtn({ disabled: true, label: 'Butuh Secure Context' });
}
