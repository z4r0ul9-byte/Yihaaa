/*
  main.js
  Tujuan     : Orkestrator Fase B — init kamera, tracker, kursor, dan loop render.
  Dependensi : config.js, camera.js, tracker.js, cursor.js
  Catatan    : Kursor digambar setelah skeleton agar selalu berada di lapisan atas.
*/

import { CONFIG } from './config.js';
import { startCamera, stopCamera } from './camera.js';
import { createHandTracker, detectHands } from './tracker.js';
import { Cursor } from './cursor.js';

// ---- DOM refs -------------------------------------------------------------
const videoEl = document.getElementById('video');
const canvasEl = document.getElementById('overlay');
const stageEl = document.getElementById('stage');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const ctx = canvasEl.getContext('2d');

// ---- Runtime state --------------------------------------------------------
let stream = null;
let landmarker = null;
let rafId = 0;
let lastVideoTime = -1;
let running = false;

// ---- Modul Fase B ---------------------------------------------------------
const cursor = new Cursor(CONFIG.CURSOR);

// ---- UI helpers -----------------------------------------------------------
function setStatus(text, kind = '') {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ' ' + kind : '');
}

function setStartBtn({ disabled, label }) {
  startBtn.disabled = disabled;
  startBtn.textContent = label;
}

// ---- Canvas sizing --------------------------------------------------------
function syncCanvasToVideo() {
  const w = videoEl.videoWidth;
  const h = videoEl.videoHeight;
  if (!w || !h) return;
  canvasEl.width = w;
  canvasEl.height = h;
  stageEl.style.aspectRatio = `${w} / ${h}`;
}

// ---- Draw helpers ---------------------------------------------------------
function toCanvasXY(lm) {
  const x = (1 - lm.x) * canvasEl.width;
  const y = lm.y * canvasEl.height;
  return [x, y];
}

function strokeWidth() {
  return Math.max(3, Math.round(canvasEl.width * 0.004));
}

function pointRadius() {
  return Math.max(4, Math.round(canvasEl.width * 0.008));
}

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
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';

  const padX = Math.round(fontSize * 0.5);
  const padY = Math.round(fontSize * 0.3);
  const metrics = ctx.measureText(text);
  const boxW = metrics.width + padX * 2;
  const boxH = fontSize + padY * 2;

  const boxX = wx - boxW / 2;
  const boxY = wy - fontSize - padY * 2 - 6;

  ctx.fillStyle = color.label;
  ctx.beginPath();
  // Fallback jika ctx.roundRect tidak didukung (Chrome lama)
  if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxW, boxH, 6);
  } else {
      ctx.rect(boxX, boxY, boxW, boxH);
  }
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, boxX + padX, boxY + boxH - padY);
}

// ---- Render ---------------------------------------------------------------
function render(result) {
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  const { landmarks, handedness } = result;

  // 1. Gambar Skeleton
  if (landmarks.length > 0) {
    const lw = strokeWidth();
    const r = pointRadius();

    for (let i = 0; i < landmarks.length; i++) {
      const lms = landmarks[i];
      if (!lms || lms.length < 21) continue;

      const color = CONFIG.HAND_COLORS[i % CONFIG.HAND_COLORS.length];
      drawSkeleton(lms, CONFIG.HAND_CONNECTIONS, color, lw, r);

      const hn = handedness[i] && handedness[i][0];
      const rawName = hn && hn.categoryName ? hn.categoryName : '';
      drawLabel(lms, labelForUser(rawName), color);
    }
  }

  // 2. Update & Gambar Kursor
  cursor.update(landmarks, handedness, canvasEl.width, canvasEl.height);
  cursor.draw(ctx);
}

// ---- Detection loop -------------------------------------------------------
function loop(now) {
  if (!running) return;

  if (videoEl.readyState >= 2 && videoEl.currentTime !== lastVideoTime) {
    lastVideoTime = videoEl.currentTime;
    try {
      const result = detectHands(landmarker, videoEl, now);
      render(result);
    } catch (err) {
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
      setStatus(
        'Deteksi gagal saat runtime: ' +
          (err && err.message ? err.message : String(err)),
        'error'
      );
      setStartBtn({ disabled: false, label: 'Coba Lagi' });
      return;
    }
  }

  rafId = requestAnimationFrame(loop);
}

// ---- Boot sequence --------------------------------------------------------
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
  setStatus('Kamera aktif. Memuat model deteksi tangan…', 'warn');

  try {
    const created = await createHandTracker(CONFIG, (msg) => setStatus(msg, 'warn'));
    landmarker = created.landmarker;
    setStatus(
      'Siap. Deteksi berjalan (delegate ' + created.delegate + '). Kursor aktif.',
      'ok'
    );
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

// ---- Wiring ---------------------------------------------------------------
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
  setStatus(
    'Halaman bukan secure context. Kamera hanya bisa diakses via http://localhost atau https://.',
    'error'
  );
  setStartBtn({ disabled: true, label: 'Butuh Secure Context' });
}

