/*
  block.js
  Tujuan     : Menggambar Balok 3D (Pseudo-Isometric) dengan efek Neon Glow.
  Dependensi : Tidak ada.
  Catatan    : Menggunakan proyeksi isometrik sederhana (offset X/Y) pada Canvas 2D
               untuk memberikan ilusi 3D tanpa perlu library WebGL.
*/

export class DimensionBlock {
  constructor() {
    this.ax = null; this.ay = null;
    this.bx = null; this.by = null;
  }

  update(anchor1, anchor2) {
    this.ax = anchor1 ? anchor1[0] : null;
    this.ay = anchor1 ? anchor1[1] : null;
    this.bx = anchor2 ? anchor2[0] : null;
    this.by = anchor2 ? anchor2[1] : null;
  }

  draw(ctx) {
    if (this.ax === null || this.bx === null) return;

    const x1 = Math.min(this.ax, this.bx);
    const x2 = Math.max(this.ax, this.bx);
    const y1 = Math.min(this.ay, this.by);
    const y2 = Math.max(this.ay, this.by);
    
    const w = x2 - x1;
    const h = y2 - y1;
    
    // Kalkulasi kedalaman (depth) 3D proporsional dengan ukuran balok
    // Semakin besar balok, semakin dalam efek 3D-nya
    const depth = Math.max(30, Math.min(w, h) * 0.4);
    
    // Offset proyeksi isometrik (ke arah kiri atas)
    const ox = -depth * 0.8;
    const oy = -depth * 0.6;

    ctx.save();
    
    // Set Style Neon
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00e5ff'; // Cyan
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    
    // Helper function gambar garis
    const line = (sx, sy, ex, ey) => {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    };

    // 1. Gambar Sisi Belakang (Back Face)
    ctx.fillStyle = 'rgba(0, 229, 255, 0.05)'; // Transparan gelap
    ctx.beginPath();
    ctx.rect(x1 + ox, y1 + oy, w, h);
    ctx.fill();
    ctx.stroke();

    // 2. Gambar Garis Penghubung (Depth Edges) dari depan ke belakang
    line(x1, y1, x1 + ox, y1 + oy); // Kiri Atas
    line(x2, y1, x2 + ox, y1 + oy); // Kanan Atas
    line(x1, y2, x1 + ox, y2 + oy); // Kiri Bawah
    line(x2, y2, x2 + ox, y2 + oy); // Kanan Bawah

    // 3. Gambar Sisi Depan (Front Face)
    ctx.fillStyle = 'rgba(0, 229, 255, 0.15)'; // Transparan lebih terang
    ctx.beginPath();
    ctx.rect(x1, y1, w, h);
    ctx.fill();
    ctx.stroke();

    // 4. Tanda Sudut Depan (Corner Brackets) biar HUD-nya makin futuristik
    ctx.lineWidth = 4;
    const len = Math.min(20, w/2, h/2);
    ctx.beginPath();
    // Kiri Atas
    ctx.moveTo(x1, y1 + len); ctx.lineTo(x1, y1); ctx.lineTo(x1 + len, y1);
    // Kanan Atas
    ctx.moveTo(x2 - len, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + len);
    // Kanan Bawah
    ctx.moveTo(x2, y2 - len); ctx.lineTo(x2, y2); ctx.lineTo(x2 - len, y2);
    // Kiri Bawah
    ctx.moveTo(x1 + len, y2); ctx.lineTo(x1, y2); ctx.lineTo(x1, y2 - len);
    ctx.stroke();

    // 5. Garis Diagonal Depan (X-cross) buat penanda dimensi
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    line(x1, y1, x2, y2);
    line(x2, y1, x1, y2);

    ctx.restore();
  }
}
