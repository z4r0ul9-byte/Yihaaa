/*
  smoothing.js
  Tujuan     : Implementasi Exponential Moving Average (EMA).
  Dependensi : Tidak ada.
  Catatan    : Ringan (O(1)), cocok untuk 30fps di HP.
*/

export class EMA {
  constructor(alpha) {
    this.alpha = alpha;
    this.initialized = false;
    this.x = 0;
    this.y = 0;
  }

  update(targetX, targetY) {
    if (!this.initialized) {
      this.x = targetX;
      this.y = targetY;
      this.initialized = true;
      return { x: this.x, y: this.y };
    }

    this.x = this.alpha * targetX + (1 - this.alpha) * this.x;
    this.y = this.alpha * targetY + (1 - this.alpha) * this.y;

    return { x: this.x, y: this.y };
  }

  reset() {
    this.initialized = false;
  }
}

