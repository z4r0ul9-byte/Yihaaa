/*
  cursor.js
  Tujuan     : Mengelola logika kursor virtual (posisi, smoothing, dan rendering).
  Dependensi : smoothing.js
  Catatan    : - Kursor mengikuti landmark 8 (index tip).
               - Mapping koordinat sudah dikoreksi mirror (1 - x).
               - Memilih satu "primary hand" dengan hysteresis agar tidak lari-lari.
*/

import { EMA } from './smoothing.js';

export class Cursor {
  /**
   * @param {object} config - CONFIG.CURSOR dari config.js
   */
  constructor(config) {
    this.config = config;
    this.ema = new EMA(config.EMA_ALPHA);
    this.active = false;
    this.primaryHandIndex = -1;
    this.x = 0;
    this.y = 0;
    this.opacity = 0;
  }

  /**
   * Update state kursor berdasarkan hasil deteksi.
   * @param {Array} landmarks - Array of landmark arrays
   * @param {Array} handedness - Array of handedness arrays (berisi score)
   * @param {number} width - Lebar canvas
   * @param {number} height - Tinggi canvas
   */
  update(landmarks, handedness, width, height) {
    if (!landmarks.length) {
      this._fadeOut();
      return;
    }

    // 1. Tentukan Primary Hand
    let bestIndex = -1;
    let bestScore = -1;

    for (let i = 0; i < handedness.length; i++) {
      const hn = handedness[i] && handedness[i][0];
      const score = hn ? hn.score : 0;

      // Hysteresis: Jika sudah ada primary hand, butuh skor yang jauh lebih tinggi
      // untuk mengambil alih. Mencegah kursor loncat antar tangan.
      if (this.primaryHandIndex !== -1 && i !== this.primaryHandIndex) {
        const currentPrimary = handedness[this.primaryHandIndex];
        const currentScore = currentPrimary && currentPrimary[0] ? currentPrimary[0].score : 0;
        if (score < currentScore + this.config.HAND_SWITCH_HYSTERESIS) {
          continue;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    // Jika tidak ada kandidat valid (misal skor terlalu rendah semua)
    if (bestIndex === -1 || !landmarks[bestIndex]) {
      this._fadeOut();
      return;
    }

    this.primaryHandIndex = bestIndex;
    const lms = landmarks[bestIndex];

    // 2. Ambil landmark 8 (Index Tip)
    const indexTip = lms[8];

    // 3. Mapping ke canvas + mirror correction
    const targetX = (1 - indexTip.x) * width;
    const targetY = indexTip.y * height;

    // 4. Smoothing
    const smoothed = this.ema.update(targetX, targetY);

    this.x = smoothed.x;
    this.y = smoothed.y;
    this.active = true;
    this.opacity = Math.min(1, this.opacity + 0.1); // Fade in cepat
  }

  _fadeOut() {
    this.opacity -= 0.05;
    if (this.opacity <= 0) {
      this.opacity = 0;
      this.active = false;
      this.primaryHandIndex = -1;
      this.ema.reset();
    }
  }

  /**
   * Render kursor ke canvas.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.active || this.opacity <= 0) return;

    const { RADIUS, COLOR_OUTER, COLOR_INNER } = this.config;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Lingkaran luar (putih)
    ctx.beginPath();
    ctx.arc(this.x, this.y, RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_OUTER;
    ctx.fill();

    // Lingkaran dalam (biru)
    ctx.beginPath();
    ctx.arc(this.x, this.y, RADIUS / 2.5, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_INNER;
    ctx.fill();

    ctx.restore();
  }
}

