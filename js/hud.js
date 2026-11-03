/*
  hud.js
  Tujuan     : Menampilkan metrik performa dan deteksi.
  Dependensi : Tidak ada.
  Catatan    : Update DOM di-throttle maksimal 10x/detik agar tidak membebani main thread.
*/

export class HUD {
  constructor() {
    this.container = document.getElementById('debug-hud');
    this.elFps = document.getElementById('hud-fps');
    this.elHands = document.getElementById('hud-hands');
    this.elGesture = document.getElementById('hud-gesture');
    this.elPinch = document.getElementById('hud-pinch');
    this.elScale = document.getElementById('hud-scale');
    
    this.btnToggle = document.getElementById('btn-toggle-hud');
    this.isVisible = true;
    
    this.lastTime = performance.now();
    this.lastUpdate = performance.now();
    this.frames = 0;

    this.btnToggle.addEventListener('click', () => this.toggle());
  }

  toggle() {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.container.classList.remove('hidden');
      this.btnToggle.textContent = 'HUD: ON';
      this.btnToggle.classList.add('btn-primary');
    } else {
      this.container.classList.add('hidden');
      this.btnToggle.textContent = 'HUD: OFF';
      this.btnToggle.classList.remove('btn-primary');
    }
  }

  update(now, handsCount, gestureData, scale) {
    if (!this.isVisible) return;
    
    this.frames++;
    
    // Throttle DOM update tiap 100ms (10fps)
    if (now - this.lastUpdate >= 100) {
      const delta = now - this.lastTime;
      if (delta >= 1000) {
        this.elFps.textContent = Math.round((this.frames * 1000) / delta);
        this.frames = 0;
        this.lastTime = now;
      }

      this.elHands.textContent = handsCount;
      this.elGesture.textContent = gestureData.state;
      this.elPinch.textContent = gestureData.dNorm ? gestureData.dNorm.toFixed(3) : '-';
      this.elScale.textContent = scale.toFixed(2) + 'x';
      
      this.lastUpdate = now;
    }
  }
}

