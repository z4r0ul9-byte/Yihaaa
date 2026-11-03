/*
  rope.js
  Tujuan     : Fisika Tali Karet (Verlet Integration) antar dua tangan.
  Dependensi : Tidak ada.
  Catatan    : Rantai titik yang saling terhubung. Ujung kiri dan kanan bisa di-pin
               ke koordinat tangan. Gravitasi membuat tali melengkung ke bawah.
*/

export class Rope {
  constructor(numPoints = 15, segmentLength = 20) {
    this.points = [];
    this.segLen = segmentLength;
    
    // Inisialisasi titik di tengah layar
    for (let i = 0; i < numPoints; i++) {
      this.points.push({ x: 0, y: 0, oldX: 0, oldY: 0, pinned: false });
    }
    this.initialized = false;
  }

  /**
   * Update posisi tali.
   * @param {Array|null} anchor1 - [x, y] ujung kiri (tangan 1)
   * @param {Array|null} anchor2 - [x, y] ujung kanan (tangan 2)
   * @param {number} width - Lebar canvas
   * @param {number} height - Tinggi canvas
   */
  update(anchor1, anchor2, width, height) {
    if (!this.initialized && anchor1 && anchor2) {
      // Set posisi awal kalau baru pertama kali deteksi 2 tangan
      for (let i = 0; i < this.points.length; i++) {
        const t = i / (this.points.length - 1);
        const x = anchor1[0] + (anchor2[0] - anchor1[0]) * t;
        const y = anchor1[1] + (anchor2[1] - anchor1[1]) * t;
        this.points[i].x = x;
        this.points[i].y = y;
        this.points[i].oldX = x;
        this.points[i].oldY = y;
      }
      this.initialized = true;
    }

    const gravity = 0.5;
    const friction = 0.95;
    const numIterations = 5;

    // 1. Terapkan Gravitasi & Verlet Integration
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if (p.pinned) continue;

      const vx = (p.x - p.oldX) * friction;
      const vy = (p.y - p.oldY) * friction;

      p.oldX = p.x;
      p.oldY = p.y;

      p.x += vx;
      p.y += vy + gravity;
    }

    // 2. Pin Ujung Tali
    const first = this.points[0];
    const last = this.points[this.points.length - 1];

    if (anchor1) {
      first.x = anchor1[0]; first.y = anchor1[1];
      first.oldX = anchor1[0]; first.oldY = anchor1[1];
    } else {
      // Kalau tangan hilang, biarin jatuh ke bawah (ga di-pin)
      first.pinned = false;
    }

    if (anchor2) {
      last.x = anchor2[0]; last.y = anchor2[1];
      last.oldX = anchor2[0]; last.oldY = anchor2[1];
    } else {
      last.pinned = false;
    }

    // 3. Constraint Solving (biar panjang tali tetap)
    for (let iter = 0; iter < numIterations; iter++) {
      for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i + 1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist === 0) continue;

        const diff = (this.segLen - dist) / dist;
        const offsetX = dx * diff * 0.5;
        const offsetY = dy * diff * 0.5;

        // Cegah ujung yang di-pin ikut geser
        if (anchor1 || i > 0) {
          if (!(i === 0 && anchor1)) {
            p1.x -= offsetX; p1.y -= offsetY;
          }
        }
        if (anchor2 || i + 1 < this.points.length - 1) {
          if (!(i + 1 === this.points.length - 1 && anchor2)) {
            p2.x += offsetX; p2.y += offsetY;
          }
        }
      }
    }

    // 4. Clamp ke lantai (opsional, biar gak tembus bawah)
    for (let i = 0; i < this.points.length; i++) {
        const p = this.points[i];
        if (p.y > height) { p.y = height; }
        if (p.x < 0) { p.x = 0; }
        if (p.x > width) { p.x = width; }
    }
  }

  draw(ctx) {
    if (this.points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    // Gambar Shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Gambar Tali Utama (Merah Karet)
    ctx.strokeStyle = '#ff4b4b';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Titik-titik simpul (opsional, biar keliatan teknis)
    ctx.fillStyle = '#ff4b4b';
    for (let i = 1; i < this.points.length - 1; i += 3) {
      ctx.beginPath();
      ctx.arc(this.points[i].x, this.points[i].y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
