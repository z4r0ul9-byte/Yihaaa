/*
  block.js
  Tujuan     : Menggambar Balok 3D (Pseudo-Isometric) dengan efek Neon Glow + Depth Control.
  Dependensi : Tidak ada.
  Catatan    : Menerima parameter depthRatio untuk mengatur ketebalan (sumbu Z) secara dinamis.
*/

export class DimensionBlock {
  constructor() {
    this.ax = null; this.ay = null;
    this.bx = null; this.by = null;
    this.depthRatio = 1.0;
  }

  update(anchor1, anchor2, depthRatio = 1.0) {
    this.ax = anchor1 ? anchor1[0] : null;
    this.ay = anchor1 ? anchor1[1] : null;
    this.bx = anchor2 ? anchor2[0] : null;
    this.by = anchor2 ? anchor2[1] : null;
    
    // Smoothing sederhana untuk depth biar gak goyang
    this.depthRatio = this.depthRatio * 0.8 + depthRatio * 0.2;
  }

  draw(ctx) {
    if (this.ax === null || this.bx === null) return;

    const x1 = Math.min(this.ax, this.bx);
    const x2 = Math.max(this.ax, this.bx);
    const y1 = Math.min(this.ay, this.by);
    const y2 = Math.max(this.ay, this.by);
    
    const w = x2 - x1;
    const h = y2 - y1;
    
    // Hitung kedalaman (Z) berdasarkan ukuran balok dan rasio tangan
    const baseDepth = Math.max(w, h) * 0.3;
    const depth = Math.max(10, baseDepth * this.depthRatio);
    
    // Offset proyeksi isometrik
    const ox = -depth * 0.8;
    const oy = -depth * 0.6;

    // Warna berubah sesuai kedalaman:
    // Tipis (mundur) = Biru, Normal = Cyan, Tebal (maju) = Magenta
    let neonColor = '#00e5ff'; // Cyan
    if (this.depthRatio < 0.8) neonColor = '#4d6bfe'; // Biru (Mundur)
    if (this.depthRatio > 1.5) neonColor = '#ff00ff'; // Magenta (Maju)

    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = neonColor; 
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = 2;
    
    const line = (sx, sy, ex, ey) => {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    };

    // 1. Sisi Belakang (Back Face)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.rect(x1 + ox, y1 + oy, w, h);
    ctx.fill();
    ctx.stroke();

    // 2. Garis Penghubung (Depth Edges)
    line(x1, y1, x1 + ox, y1 + oy); 
    line(x2, y1, x2 + ox, y1 + oy); 
    line(x1, y2, x1 + ox, y2 + oy); 
    line(x2, y2, x2 + ox, y2 + oy); 

    // 3. Sisi Depan (Front Face)
    ctx.fillStyle = neonColor.replace(')', ', 0.15)').replace('rgb', 'rgba'); // Fallback transparan
    ctx.fillStyle = this.depthRatio > 1.5 ? 'rgba(255, 0, 255, 0.15)' : (this.depthRatio < 0.8 ? 'rgba(77, 107, 254, 0.15)' : 'rgba(0, 229, 255, 0.15)');
    ctx.beginPath();
    ctx.rect(x1, y1, w, h);
    ctx.fill();
    ctx.stroke();

    // 4. Tanda Sudut Depan (Corner Brackets)
    ctx.lineWidth = 4;
    const len = Math.min(20, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x1, y1 + len); ctx.lineTo(x1, y1); ctx.lineTo(x1 + len, y1);
    ctx.moveTo(x2 - len, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + len);
    ctx.moveTo(x2, y2 - len); ctx.lineTo(x2, y2); ctx.lineTo(x2 - len, y2);
    ctx.moveTo(x1 + len, y2); ctx.lineTo(x1, y2); ctx.lineTo(x1, y2 - len);
    ctx.stroke();

    // 5. Teks Indikator Z (Kedalaman)
    ctx.shadowBlur = 0; // Matikan shadow untuk teks
    ctx.fillStyle = neonColor;
    ctx.font = `bold 14px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    
    // Konversi balik X ke layar (karena canvas di-mirror via CSS)
    const centerX = (x1 + x2) / 2;
    ctx.fillText(`Z: ${this.depthRatio.toFixed(2)}x`, centerX, y2 + 25);

    ctx.restore();
  }
}
