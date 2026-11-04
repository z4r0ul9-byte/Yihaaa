/*
  block.js
  Tujuan     : Menggambar Balok 3D dengan kontrol terpisah + responsivitas tinggi.
  Dependensi : Tidak ada.
*/

export class DimensionBlock {
  constructor() {
    this.x = null;
    this.y = null;
    this.w = 100;
    this.h = 100;
    
    this.targetW = 100;
    this.targetH = 100;
    
    this.isPinching = false;
    this.pinchStartX = 0;
    this.pinchStartY = 0;
    this.boxStartX = 0;
    this.boxStartY = 0;

    // Smoothing dipercepat biar tidak ketinggalan jauh dari tangan
    this.smoothDepth = 1.0;
    this.alphaPos = 0.6;  
    this.alphaSize = 0.25; 
  }

  update(anchor1, anchor2, isPinching, pinchPos, depthRatio = 1.0, canvasWidth = 640, canvasHeight = 480) {
    if (this.x === null) {
      this.x = canvasWidth / 2 - this.w / 2;
      this.y = canvasHeight / 2 - this.h / 2;
    }

    // 1. RESIZE (Lebar / Kecil)
    if (anchor1 && anchor2 && !this.isPinching) {
      const minX = Math.min(anchor1[0], anchor2[0]);
      const maxX = Math.max(anchor1[0], anchor2[0]);
      const minY = Math.min(anchor1[1], anchor2[1]);
      const maxY = Math.max(anchor1[1], anchor2[1]);
      
      this.targetW = Math.max(50, maxX - minX);
      this.targetH = Math.max(50, maxY - minY);
      
      const targetX = minX + (maxX - minX) / 2 - this.targetW / 2;
      const targetY = minY + (maxY - minY) / 2 - this.targetH / 2;

      this.w += (this.targetW - this.w) * this.alphaSize;
      this.h += (this.targetH - this.h) * this.alphaSize;
      this.x += (targetX - this.x) * this.alphaPos;
      this.y += (targetY - this.y) * this.alphaPos;
    }

    // 2. MOVE (Mindah) - Pakai Pinch
    if (isPinching && pinchPos) {
      if (!this.isPinching) {
        this.isPinching = true;
        this.pinchStartX = pinchPos[0];
        this.pinchStartY = pinchPos[1];
        this.boxStartX = this.x;
        this.boxStartY = this.y;
      } else {
        const dx = pinchPos[0] - this.pinchStartX;
        const dy = pinchPos[1] - this.pinchStartY;
        
        const targetX = this.boxStartX + dx;
        const targetY = this.boxStartY + dy;
        
        this.x += (targetX - this.x) * this.alphaPos;
        this.y += (targetY - this.y) * this.alphaPos;
      }
    } else {
      this.isPinching = false;
    }

    // 3. DEPTH (Z) - Sekarang pake data dari main.js yang udah di-invert
    this.smoothDepth += (depthRatio - this.smoothDepth) * 0.15;
    this.depthRatio = this.smoothDepth;
  }

  draw(ctx) {
    if (this.x === null) return;

    const x1 = this.x;
    const y1 = this.y;
    const w = this.w;
    const h = this.h;
    
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
    line(x1 + w, y1, x1 + w + ox, y1 + oy); 
    line(x1, y1 + h, x1 + ox, y1 + h + oy); 
    line(x1 + w, y1 + h, x1 + w + ox, y1 + h + oy); 

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
    ctx.moveTo(x1 + w - len, y1); ctx.lineTo(x1 + w, y1); ctx.lineTo(x1 + w, y1 + len);
    ctx.moveTo(x1 + w, y1 + h - len); ctx.lineTo(x1 + w, y1 + h); ctx.lineTo(x1 + w - len, y1 + h);
    ctx.moveTo(x1 + len, y1 + h); ctx.lineTo(x1, y1 + h); ctx.lineTo(x1, y1 + h - len);
    ctx.stroke();

    // Text
    ctx.shadowBlur = 0;
    ctx.fillStyle = neonColor;
    ctx.font = `bold 14px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    
    const centerX = x1 + w / 2;
    ctx.save();
    ctx.translate(centerX, y1 + h + 25);
    ctx.scale(-1, 1); 
    ctx.fillText(`Z: ${this.depthRatio.toFixed(2)}x`, 0, 0);
    ctx.restore();

    ctx.restore();
  }
}
