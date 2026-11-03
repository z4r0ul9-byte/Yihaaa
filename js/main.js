/*
  main.js
  Tujuan     : Orkestrator Fase A — init kamera, init tracker, rAF loop,
               render skeleton 21 landmark + label kiri/kanan.
  Dependensi : config.js, camera.js, tracker.js
  Catatan    : - Tidak ada smoothing / gesture / cursor (fase berikutnya).
               - Mirroring x dilakukan saat draw (bukan CSS canvas) supaya
                 label teks "KANAN"/"KIRI" tidak terbalik.
*/

import { CONFIG } from './config.js';
import { startCamera, stopCamera } from './camera.js';
import { createHandTracker, detectHands } from './tracker.js';

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
  // Samakan aspect-ratio container dengan aspect-ratio video → object-fit:cover
  // menjadi exact fit, landmark tidak terdistorsi.
  stageEl.style.aspectRatio = `${w} / ${h}`;
}

// ---- Draw helpers ---------------------------------------------------------

/**
 * Konversi landmark (0..1, koordinat video raw) ke koordinat canvas.
 * Mirror x karena kamera depan: landmark x di video = kebalikan dari yang
 * dilihat user di layar (video di-mirror via CSS).
 * @param {{x:number,y:number}} lm
 * @returns {[number, number]}
 */
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

/**
 * Label tangan. Label MediaPipe diasumsikan untuk input mirror (selfie);
 * karena kita memberi frame video raw (belum mirror), label returned
 * terbalik relatif ke user. Kita swap supaya "KANAN"/"KIRI" sesuai tangan user.
 * @param {string} rawCategoryName 'Left' | 'Right'
 */
function labelForUser(rawCategoryName) {
  if (rawCategoryName === 'Left') return 'KANAN';
  if (rawCategoryName === 'Right') return 'KIRI';
  return rawCategoryName || '?';
}

function drawLabel(landmarks, text, color) {
  // Anchor: wrist (landmark 0), teks sedikit di atasnya.
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
  ctx.roundRect(boxX, boxY, boxW, boxH, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, boxX + padX, boxY + boxH - padY);
}

// ---- Render ---------------------------------------------------------------
function render(result) {
  // Clear frame sebelumnya.
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  const { landmarks, handedness } = result;
  if (!landmarks.length) return;

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

// ---- Detection loop -------------------------------------------------------
function loop(now) {
  if (!running) return;

  // Hanya proses frame baru (currentTime berubah). Menghemat komputasi.
  if (videoEl.readyState >= 2 && videoEl.currentTime !== lastVideoTime) {
    lastVideoTime = videoEl.currentTime;
    try {
      const result = detectHands(landmarker, videoEl, now);
      render(result);
    } catch (err) {
      // Hentikan loop dan laporkan sekali agar tidak spam error.
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
      'Siap. Deteksi tangan berjalan (delegate ' + created.delegate + ').',
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

// Re-sync canvas kalau video resize (rotasi layar / ganti constraint).
videoEl.addEventListener('resize', syncCanvasToVideo);

// Bersihkan resource saat tab ditinggalkan.
window.addEventListener('pagehide', () => {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  stopCamera(stream);
  stream = null;
});

// Cek secure context di awal supaya user tidak kaget setelah klik tombol.
if (!window.isSecureContext) {
  setStatus(
    'Halaman bukan secure context. Kamera hanya bisa diakses via http://localhost ' +
      'atau https://. Akses via IP LAN tidak akan berfungsi.',
    'error'
  );
  setStartBtn({ disabled: true, label: 'Butuh Secure Context' });
}

