/*
  smoothing.js
  Tujuan     : Implementasi Exponential Moving Average (EMA) untuk posisi kursor.
  Dependensi : Tidak ada.
  Catatan    : EMA dipilih karena ringan (O(1)) dan cocok untuk 30fps di HP.
               Rumus: S_t = alpha * X_t + (1 - alpha) * S_{t-1}
*/

export class EMA {
  /**
   * @param {number} alpha - Nilai 0..1. Semakin besar, semakin responsif (kurang halus).
   */
  constructor(alpha) {
    this.alpha = alpha;
    this.initialized = false;
    this.x = 0;
    this.y = 0;
  }

  /**
   * Update nilai dengan target baru.
   * @param {number} targetX
   * @param {number} targetY
   * @returns {{x: number, y: number}}
   */
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

  /**
   * Reset state (misal saat tangan hilang dari frame).
   */
  reset() {
    this.initialized = false;
  }
}

