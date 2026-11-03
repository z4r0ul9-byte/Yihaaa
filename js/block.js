/*
  block.js
  Tujuan     : Menggambar Balok Dimensi dengan efek Neon Glow.
  Dependensi : Tidak ada.
  Catatan    : Menggunakan shadowBlur untuk efek glow yang dramatis.
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

    const x = Math.min(this.ax, this.bx);
    const y = Math.min(this.ay, this.by);
    const w = Math.abs(this.bx - this.ax);
    const h = Math.abs(this.by - this.ay);

    ctx.save();

    // 1. Gambar Garis Tengah (Diagonal)
    ctx.beginPath();
    ctx.moveTo(this.ax, this.ay);
    ctx.lineTo(this.bx, this.by);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Gambar Kotak Dimensi dengan Efek Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00e5ff'; // Cyan Neon
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();

    // 3. Tanda Sudut (Corner Brackets) biar makin futuristik
    ctx.beginPath();
    const len = 20;
    // Kiri Atas
    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
    // Kanan Atas
    ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
    // Kanan Bawah
    ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
    // Kiri Bawah
    ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.restore();
  }
}
