/*
  cursor.js
  Tujuan     : Logika kursor virtual (posisi, smoothing, render, primary hand lock).
  Dependensi : smoothing.js
*/

import { EMA } from './smoothing.js';

export class Cursor {
  constructor(config) {
    this.config = config;
    this.ema = new EMA(config.EMA_ALPHA);
    this.active = false;
    this.primaryHandIndex = -1;
    this.x = 0;
    this.y = 0;
    this.opacity = 0;
  }

  update(landmarks, handedness, width, height) {
    if (!landmarks.length) {
      this._fadeOut();
      return;
    }

    let bestIndex = -1;
    let bestScore = -1;

    for (let i = 0; i < handedness.length; i++) {
      const hn = handedness[i] && handedness[i][0];
      const score = hn ? hn.score : 0;

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

    if (bestIndex === -1 || !landmarks[bestIndex]) {
      this._fadeOut();
      return;
    }

    this.primaryHandIndex = bestIndex;
    const lms = landmarks[bestIndex];

    const indexTip = lms[8];
    const targetX = (1 - indexTip.x) * width;
    const targetY = indexTip.y * height;

    const smoothed = this.ema.update(targetX, targetY);

    this.x = smoothed.x;
    this.y = smoothed.y;
    this.active = true;
    this.opacity = Math.min(1, this.opacity + 0.1);
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

  draw(ctx) {
    if (!this.active || this.opacity <= 0) return;

    const { RADIUS, COLOR_OUTER, COLOR_INNER } = this.config;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    ctx.beginPath();
    ctx.arc(this.x, this.y, RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_OUTER;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, RADIUS / 2.5, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_INNER;
    ctx.fill();

    ctx.restore();
  }
}

