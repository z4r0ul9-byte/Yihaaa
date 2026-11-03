/*
  block.js
  Tujuan     : Menggambar Balok 3D dengan efek Neon Glow + Fix bug freeze & teks kebalik.
  Dependensi : Tidak ada.
*/

export class DimensionBlock {
  constructor() {
    this.ax = null; this.ay = null;
    this.bx = null; this.by = null;
    
    this.smoothAx = null; this.smoothAy = null;
    this.smoothBx = null; this.smoothBy = null;
    this.smoothDepth = 1.0;
    
    this.alphaPos = 0.3;
    this.alphaDepth = 0.1;
    
    // Flag untuk mencegah balok freeze saat tangan hilang
    this.active = false; 
  }

  update(anchor1, anchor2, depthRatio = 1.0) {
    // FIX BUG: Jika salah satu tangan tidak terdeteksi, matikan balok.
    if (!anchor1 || !anchor2) {
      this.active = false;
      return;
    }
    this.active = true;

    const targetAx = anchor1[0];
    const targetAy = anchor1[1];
    const targetBx = anchor2[0];
    const targetBy = anchor2[1];

    // Inisialisasi pertama kali
    if (this.smoothAx === null) {
      this.smoothAx = targetAx; this.smoothAy = targetAy;
      this.smoothBx = targetBx; this.smoothBy = targetBy;
      this.smoothDepth = depthRatio;
    }

    // EMA Smoothing
    this.smoothAx += (targetAx - this.smoothAx) * this.alphaPos;
    this.smoothAy += (targetAy - this.smoothAy) * this.alphaPos;
    this.smoothBx += (targetBx - this.smoothBx) * this.alphaPos;
    this.smoothBy += (targetBy - this.smoothBy) * this.alphaPos;
    
    this.smoothDepth += (depthRatio - this.smoothDepth) * this.alphaDepth;
    
    this.ax = this.smoothAx;
    this.ay = this.smoothAy;
    this.bx = this.smoothBx;
    this.by = this.smoothBy;
    this.depthRatio = this.smoothDepth;
  }

  draw(ctx) {
    // Jika balok tidak aktif, jangan digambar
    if (!this.active || this.ax === null || this.bx === null) return;

    const x1 = Math.min(this.ax, this.bx);
    const x2 = Math.max(this.ax, this.bx);
    const y1 = Math.min(this.ay, this.by);
    const y2 = Math.max(this.ay, this.by);
    
    const w = x2 - x1;
    const h = y2 - y1;
    
    const baseDepth = Math.max(w, h) * 0.3;
    const depth = Math.max(10, baseDepth * this.depthRatio);
    
    const ox = -depth * 0.8;
    const oy = -depth * 0.6;

    let neonColor = '#00e5ff'; 
    if (this.depthRatio < 0.8) neonColor = '#4d6bfe'; 
    if (this.depthRatio > 1.5) neonColor = '#ff00ff'; 

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

    // Back face
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.rect(x1 + ox, y1 + oy, w, h);
    ctx.fill();
    ctx.stroke();

    // Depth edges
    line(x1, y1, x1 + ox, y1 + oy); 
    line(x2, y1, x2 + ox, y1 + oy); 
    line(x1, y2, x1 + ox, y2 + oy); 
    line(x2, y2, x2 + ox, y2 + oy); 

    // Front face
    ctx.fillStyle = this.depthRatio > 1.5 ? 'rgba(255, 0, 255, 0.15)' : (this.depthRatio < 0.8 ? 'rgba(77, 107, 254, 0.15)' : 'rgba(0, 229, 255, 0.15)');
    ctx.beginPath();
    ctx.rect(x1, y1, w, h);
    ctx.fill();
    ctx.stroke();

    // Corner Brackets
    ctx.lineWidth = 4;
    const len = Math.min(20, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x1, y1 + len); ctx.lineTo(x1, y1); ctx.lineTo(x1 + len, y1);
    ctx.moveTo(x2 - len, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + len);
    ctx.moveTo(x2, y2 - len); ctx.lineTo(x2, y2); ctx.lineTo(x2 - len, y2);
    ctx.moveTo(x1 + len, y2); ctx.lineTo(x1, y2); ctx.lineTo(x1, y2 - len);
    ctx.stroke();

    // Teks Z
    ctx.shadowBlur = 0;
    ctx.fillStyle = neonColor;
    ctx.font = `bold 14px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    
    // FIX BUG: Teks harus di-un-mirror agar tidak kebalik
    const centerX = (x1 + x2) / 2;
    ctx.save();
    ctx.translate(centerX, y2 + 25);
    ctx.scale(-1, 1); // Flip horizontal
    ctx.fillText(`Z: ${this.depthRatio.toFixed(2)}x`, 0, 0);
    ctx.restore();

    ctx.restore();
  }
}
