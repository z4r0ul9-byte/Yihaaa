/*
  gesture.js
  Tujuan     : Deteksi gestur pinch & pergerakan telapak (drag) dengan hysteresis.
  Catatan    : Mirror correction (1-x) dihapus karena mirroring ditangani CSS.
*/

export class GestureDetector {
  constructor(config) {
    this.config = config;
    this.state = 'OPEN';
    this.startNormDist = 0;
    this.prevPalmX = 0;
    this.prevPalmY = 0;
  }

  update(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      this.state = 'OPEN';
      return { state: 'OPEN', dNorm: 0, scale: 1, deltaX: 0, deltaY: 0 };
    }

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];

    const dPinch = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const dPalm = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y);
    const dNorm = dPalm > 0.01 ? dPinch / dPalm : 0;

    const palmX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[13].x + landmarks[17].x) / 5;
    const palmY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 5;
    
    // CSS sudah handle mirror, jadi kita gak perlu ubah X
    const currentPalmX = palmX;
    const currentPalmY = palmY;

    let scaleFactor = 1;
    let deltaX = 0;
    let deltaY = 0;

    if (this.state === 'OPEN') {
      if (dNorm < this.config.PINCH_IN) {
        this.state = 'PINCHED';
        this.startNormDist = dNorm;
        this.prevPalmX = currentPalmX;
        this.prevPalmY = currentPalmY;
      }
    } else if (this.state === 'PINCHED') {
      if (dNorm > this.config.PINCH_OUT) {
        this.state = 'OPEN';
      } else {
        if (this.startNormDist > 0) scaleFactor = dNorm / this.startNormDist;
        deltaX = currentPalmX - this.prevPalmX;
        deltaY = currentPalmY - this.prevPalmY;
        this.prevPalmX = currentPalmX;
        this.prevPalmY = currentPalmY;
      }
    }

    return { state: this.state, dNorm, scale: scaleFactor, deltaX, deltaY };
  }

  reset() {
    this.state = 'OPEN';
    this.startNormDist = 0;
  }
}
