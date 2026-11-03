/*
  transform.js
  Tujuan     : Mengelola skala (zoom) & translasi (pan/drag) pada elemen target.
  Dependensi : smoothing.js
  Catatan    : Menggunakan EMA terpisah untuk pan agar pergerakan halus.
*/

import { EMA } from './smoothing.js';

export class TransformController {
  constructor(element, zoomConfig, panConfig) {
    this.el = element;
    this.zoomConfig = zoomConfig;
    this.panConfig = panConfig;
    
    this.currentScale = 1.0;
    this.startScale = 1.0;
    
    this.targetPanX = 0;
    this.targetPanY = 0;
    this.panX = 0;
    this.panY = 0;
    
    this.emaPan = new EMA(panConfig.EMA_ALPHA);
  }

  update(gestureData, canvasWidth, canvasHeight) {
    if (gestureData.state === 'PINCHED') {
      // 1. Update Zoom
      if (gestureData.scale === 1) {
        this.startScale = this.currentScale;
      }
      let newScale = this.startScale * gestureData.scale;
      newScale = Math.max(this.zoomConfig.MIN_SCALE, Math.min(newScale, this.zoomConfig.MAX_SCALE));
      this.currentScale = newScale;

      // 2. Update Pan (Drag)
      this.targetPanX += gestureData.deltaX * canvasWidth;
      this.targetPanY += gestureData.deltaY * canvasHeight;

      const smoothed = this.emaPan.update(this.targetPanX, this.targetPanY);
      this.panX = smoothed.x;
      this.panY = smoothed.y;

      this.applyTransform();
    } else {
      this.startScale = this.currentScale;
      // Sinkronisasi EMA saat idle agar tidak melompat saat pinch berikutnya
      const smoothed = this.emaPan.update(this.targetPanX, this.targetPanY);
      this.panX = smoothed.x;
      this.panY = smoothed.y;
    }
  }

  applyTransform() {
    // translate dulu baru scale, origin tetap di tengah
    this.el.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.currentScale})`;
  }

  reset() {
    this.currentScale = 1.0;
    this.startScale = 1.0;
    this.targetPanX = 0;
    this.targetPanY = 0;
    this.panX = 0;
    this.panY = 0;
    this.emaPan.reset();
    this.applyTransform();
  }
}

