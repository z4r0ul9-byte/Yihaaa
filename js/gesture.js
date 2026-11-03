/*
  gesture.js
  Tujuan     : Deteksi gestur pinch & pergerakan telapak (drag) dengan hysteresis.
  Dependensi : Tidak ada.
*/

export class GestureDetector {
  constructor(config) {
    this.config = config;
    this.state = 'OPEN'; // 'OPEN' | 'PINCHED'
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

    // 1. Jarak Pinch (jempol ke telunjuk)
    const dPinch = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    // 2. Jarak Telapak (pergelangan ke pangkal jari tengah) - normalisasi
    const dPalm = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y);
    // 3. Normalisasi jarak (scale invariant)
    const dNorm = dPalm > 0.01 ? dPinch / dPalm : 0;

    // 4. Palm Center (rata-rata landmark 0, 5, 9, 13, 17) untuk drag
    const palmX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[13].x + landmarks[17].x) / 5;
    const palmY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 5;
    
    // Mirror correction for X
    const mirroredPalmX = 1 - palmX;
    const correctedPalmY = palmY;

    let scaleFactor = 1;
    let deltaX = 0;
    let deltaY = 0;

    if (this.state === 'OPEN') {
      if (dNorm < this.config.PINCH_IN) {
        this.state = 'PINCHED';
        this.startNormDist = dNorm;
        this.prevPalmX = mirroredPalmX;
        this.prevPalmY = correctedPalmY;
      }
    } else if (this.state === 'PINCHED') {
      if (dNorm > this.config.PINCH_OUT) {
        this.state = 'OPEN';
      } else {
        if (this.startNormDist > 0) {
          scaleFactor = dNorm / this.startNormDist;
        }
        
        // Hitung delta pergerakan telapak
        deltaX = mirroredPalmX - this.prevPalmX;
        deltaY = correctedPalmY - this.prevPalmY;
        
        this.prevPalmX = mirroredPalmX;
        this.prevPalmY = correctedPalmY;
      }
    }

    return {
      state: this.state,
      dNorm: dNorm,
      scale: scaleFactor,
      deltaX: deltaX,
      deltaY: deltaY
    };
  }

  reset() {
    this.state = 'OPEN';
    this.startNormDist = 0;
  }
}

