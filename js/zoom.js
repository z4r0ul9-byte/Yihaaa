/*
  zoom.js
  Tujuan     : Mengelola skala zoom pada elemen target DOM.
  Dependensi : config.js (via parameter)
  Catatan    : Skala di-clamp antara MIN dan MAX agar tidak over-zoom.
*/

export class ZoomController {
  constructor(element, config) {
    this.el = element;
    this.config = config;
    this.currentScale = 1.0;
    this.startScale = 1.0;
  }

  /**
   * Update skala berdasarkan data gestur.
   * @param {object} gestureData - Output dari GestureDetector.
   */
  update(gestureData) {
    if (gestureData.state === 'PINCHED') {
      // Saat baru mulai pinch, simpan skala awal
      if (this.startScale === 1.0 && gestureData.scale === 1) {
        this.startScale = this.currentScale;
      }

      // Kalkulasi skala baru: Skala Awal * Faktor Rasio
      let newScale = this.startScale * gestureData.scale;

      // Clamp
      newScale = Math.max(this.config.MIN_SCALE, Math.min(newScale, this.config.MAX_SCALE));
      this.currentScale = newScale;

      // Terapkan ke DOM
      this.applyScale();
    } else {
      // Jika state OPEN, reset startScale untuk pinch berikutnya
      this.startScale = this.currentScale;
    }
  }

  applyScale() {
    // Gunakan translate3d untuk memicu hardware acceleration di HP
    this.el.style.transform = `scale(${this.currentScale})`;
  }

  reset() {
    this.currentScale = 1.0;
    this.startScale = 1.0;
    this.applyScale();
  }
}

