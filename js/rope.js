/*
  rope.js
  Tujuan     : Menggambar tali karet (slingshot) + fisika pegas (Hooke's Law).
  Dependensi : Tidak ada.
*/

export class RopeController {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    
    // Titik jangkar (kiri dan kanan)
    this.anchorY = 0;
    this.anchorLeftX = 0;
    this.anchorRightX = 0;

    // Posisi simpul (handle) saat ini
    this.hx = 0;
    this.hy = 0;

    // Target posisi (cursor)
    this.tx = 0;
    this.ty = 0;

    // Kecepatan (untuk fisika)
    this.vx = 0;
    this.vy = 0;

    // Konstanta fisika
    this.springK = 0.12;  // Kekakuan pegas
    this.damping = 0.82;  // Gesekan (semakin kecil semakin cepat berhenti)
    
    this.isPinching = false;
    this.initialized = false;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Sesuaikan resolusi canvas dengan ukuran layar fisik
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.anchorY = rect.height / 2;
    this.anchorLeftX = 0;
    this.anchorRightX = rect.width;

    if (!this.initialized) {
      this.hx = rect.width / 2;
      this.hy = rect.height / 2;
      this.tx = this.hx;
      this.ty = this.hy;
      this.initialized = true;
    }
  }

  /**
   * Update state dan jalankan fisika.
   * @param {boolean} isPinching 
   * @param {number} x - Koordinat X dari kursor (sudah di-map ke ukuran canvas ini).
   * @param {number} y - Koordinat Y dari kursor.
   */
  update(isPinching, x, y) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.isPinching = isPinching;

    if (this.isPinching) {
      // Saat dicubit, target = posisi kursor
      this.tx = x;
      this.ty = y;
    } else {
      // Saat dilepas, target = titik tengah (posisi diam)
      this.tx = rect.width / 2;
      this.ty = rect.height / 2;
    }

    // Hooke's Law: F = -k * x
    const ax = -this.springK * (this.hx - this.tx) - this.damping * this.vx;
    const ay = -this.springK * (this.hy - this.ty) - this.damping * this.vy;

    this.vx += ax;
    this.vy += ay;
    
    this.hx += this.vx;
    this.hy += this.vy;
  }

  draw() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. Gambar Tali Karet (Kurva Bezier)
    this.ctx.beginPath();
    this.ctx.moveTo(this.anchorLeftX, this.anchorY);
    this.ctx.quadraticCurveTo(this.hx, this.hy, this.anchorRightX, this.anchorY);
    
    // Style tali: warna merah/oranye khas karet
    this.ctx.strokeStyle = '#ff4b4b'; 
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Efek shadow di bawah tali biar kelihatan 3D
    this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    this.ctx.lineWidth = 6;
    this.ctx.stroke();

    // 2. Gambar Simpul di tengah
    this.ctx.beginPath();
    this.ctx.arc(this.hx, this.hy, this.isPinching ? 12 : 8, 0, Math.PI * 2);
    this.ctx.fillStyle = this.isPinching ? '#4d6bfe' : '#888888';
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.stroke();
  }
}
