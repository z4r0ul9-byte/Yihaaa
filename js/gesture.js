/*
  gesture.js
  Tujuan     : Deteksi gestur pinch dengan normalisasi jarak dan state machine (hysteresis).
  Dependensi : config.js (via parameter)
  Catatan    : Normalisasi menggunakan jarak wrist (0) ke middle MCP (9) sebagai skala telapak.
*/

export class GestureDetector {
  constructor(config) {
    this.config = config;
    this.state = 'OPEN'; // 'OPEN' | 'PINCHED'
    this.startNormDist = 0;
  }

  /**
   * Update state berdasarkan landmark tangan primer.
   * @param {Array} landmarks - Array 21 landmark (dari satu tangan).
   * @returns {{ state: string, dNorm: number, scale: number }}
   */
  update(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      this.state = 'OPEN';
      return { state: 'OPEN', dNorm: 0, scale: 1 };
    }

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];

    // 1. Jarak Pinch (jempol ke telunjuk)
    const dPinch = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    
    // 2. Jarak Telapak (pergelangan ke pangkal jari tengah) - untuk normalisasi
    const dPalm = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y);

    // 3. Normalisasi (menghindari efek tangan maju/mundur dari kamera)
    const dNorm = dPalm > 0.01 ? dPinch / dPalm : 0;

    // 4. State Machine dengan Hysteresis
    let scaleFactor = 1;

    if (this.state === 'OPEN') {
      if (dNorm < this.config.PINCH_IN) {
        this.state = 'PINCHED';
        this.startNormDist = dNorm;
      }
    } else if (this.state === 'PINCHED') {
      if (dNorm > this.config.PINCH_OUT) {
        this.state = 'OPEN';
      } else {
        // Hitung rasio zoom selama PINCHED
        if (this.startNormDist > 0) {
          scaleFactor = dNorm / this.startNormDist;
        }
      }
    }

    return {
      state: this.state,
      dNorm: dNorm,
      scale: scaleFactor
    };
  }

  reset() {
    this.state = 'OPEN';
    this.startNormDist = 0;
  }
}

