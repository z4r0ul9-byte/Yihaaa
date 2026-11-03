/*
  calibration.js
  Tujuan     : Panel UI untuk mengatur threshold & menjalankan auto-calibration.
  Dependensi : config.js, smoothing.js
*/

import { saveConfigToStorage } from './config.js';

export class Calibration {
  constructor(config, cursor, gesture, transform) {
    this.config = config;
    this.cursor = cursor;
    this.gesture = gesture;
    this.transform = transform;

    this.panel = document.getElementById('cal-panel');
    this.btnToggle = document.getElementById('btn-toggle-cal');
    
    this.inPinchIn = document.getElementById('slider-pinch-in');
    this.inPinchOut = document.getElementById('slider-pinch-out');
    this.inCursorAlpha = document.getElementById('slider-cursor-alpha');
    this.inPanAlpha = document.getElementById('slider-pan-alpha');
    
    this.btnAuto = document.getElementById('btn-auto-cal');
    this.btnReset = document.getElementById('btn-reset-config');
    this.lblStatus = document.getElementById('lbl-auto-status');

    this.autoState = 'IDLE'; 
    this.autoStartTime = 0;
    this.autoDataOpen = [];
    this.autoDataPinch = [];

    this.init();
  }

  init() {
    this.inPinchIn.value = this.config.GESTURE.PINCH_IN;
    this.inPinchOut.value = this.config.GESTURE.PINCH_OUT;
    this.inCursorAlpha.value = this.config.CURSOR.EMA_ALPHA;
    this.inPanAlpha.value = this.config.PAN.EMA_ALPHA;
    this.updateLabels();

    this.btnToggle.addEventListener('click', () => {
      this.panel.classList.toggle('hidden');
      this.btnToggle.classList.toggle('btn-primary');
    });

    this.inPinchIn.addEventListener('input', () => {
      const val = parseFloat(this.inPinchIn.value);
      this.inPinchOut.min = (val + 0.05).toFixed(2);
      if (parseFloat(this.inPinchOut.value) < parseFloat(this.inPinchOut.min)) {
        this.inPinchOut.value = this.inPinchOut.min;
        this.config.GESTURE.PINCH_OUT = parseFloat(this.inPinchOut.value);
      }
      this.config.GESTURE.PINCH_IN = val;
      this.updateLabels();
      saveConfigToStorage();
    });

    this.inPinchOut.addEventListener('input', () => {
      const val = parseFloat(this.inPinchOut.value);
      this.config.GESTURE.PINCH_OUT = val;
      this.updateLabels();
      saveConfigToStorage();
    });

    this.inCursorAlpha.addEventListener('input', () => {
      const val = parseFloat(this.inCursorAlpha.value);
      this.config.CURSOR.EMA_ALPHA = val;
      this.cursor.ema.alpha = val;
      this.updateLabels();
      saveConfigToStorage();
    });

    this.inPanAlpha.addEventListener('input', () => {
      const val = parseFloat(this.inPanAlpha.value);
      this.config.PAN.EMA_ALPHA = val;
      this.transform.emaPan.alpha = val;
      this.updateLabels();
      saveConfigToStorage();
    });

    this.btnReset.addEventListener('click', () => {
      localStorage.removeItem('handGestureConfig');
      window.location.reload();
    });

    this.btnAuto.addEventListener('click', () => {
      if (this.autoState !== 'IDLE') return;
      this.startAutoCalibration();
    });
  }

  updateLabels() {
    document.getElementById('val-pinch-in').textContent = Number(this.inPinchIn.value).toFixed(2);
    document.getElementById('val-pinch-out').textContent = Number(this.inPinchOut.value).toFixed(2);
    document.getElementById('val-cursor-alpha').textContent = Number(this.inCursorAlpha.value).toFixed(2);
    document.getElementById('val-pan-alpha').textContent = Number(this.inPanAlpha.value).toFixed(2);
  }

  startAutoCalibration() {
    this.autoState = 'REC_OPEN';
    this.autoStartTime = performance.now();
    this.autoDataOpen = [];
    this.autoDataPinch = [];
    this.lblStatus.classList.remove('hidden');
    this.lblStatus.textContent = 'Fase 1/2: Tangan TERBUKA (3 detik)';
    this.btnAuto.disabled = true;
  }

  tick(now, gestureData) {
    if (this.autoState === 'IDLE') return;

    const elapsed = now - this.autoStartTime;

    if (this.autoState === 'REC_OPEN') {
      if (gestureData.dNorm > 0) this.autoDataOpen.push(gestureData.dNorm);
      
      if (elapsed >= 3000) {
        this.autoState = 'REC_PINCH';
        this.autoStartTime = now;
        this.lblStatus.textContent = 'Fase 2/2: Tangan MENCUBIT (3 detik)';
      }
    } else if (this.autoState === 'REC_PINCH') {
      if (gestureData.dNorm > 0) this.autoDataPinch.push(gestureData.dNorm);

      if (elapsed >= 3000) {
        this.finishAutoCalibration();
      }
    }
  }

  finishAutoCalibration() {
    this.autoState = 'IDLE';
    this.btnAuto.disabled = false;
    this.lblStatus.textContent = 'Kalibrasi selesai!';

    if (this.autoDataOpen.length === 0 || this.autoDataPinch.length === 0) {
      this.lblStatus.textContent = 'Kalibrasi GAGAL: tangan tidak terdeteksi.';
      setTimeout(() => this.lblStatus.classList.add('hidden'), 3000);
      return;
    }

    const avgOpen = this.autoDataOpen.reduce((a,b)=>a+b, 0) / this.autoDataOpen.length;
    const avgPinch = this.autoDataPinch.reduce((a,b)=>a+b, 0) / this.autoDataPinch.length;

    // Threshold: Tarik garis 20% dari nilai rata-rata menuju jarak berlawanan
    let pinchIn = avgPinch + (avgOpen - avgPinch) * 0.2;
    let pinchOut = avgOpen - (avgOpen - avgPinch) * 0.2;

    // Safety Clamp
    pinchIn = Math.max(0.10, Math.min(0.40, pinchIn));
    pinchOut = Math.max(0.30, Math.min(0.60, pinchOut));

    if (pinchIn >= pinchOut) {
      pinchIn = 0.25;
      pinchOut = 0.35;
    }

    this.inPinchIn.value = pinchIn;
    this.inPinchOut.value = pinchOut;
    
    this.config.GESTURE.PINCH_IN = pinchIn;
    this.config.GESTURE.PINCH_OUT = pinchOut;
    this.updateLabels();
    saveConfigToStorage();

    setTimeout(() => this.lblStatus.classList.add('hidden'), 3000);
  }
}

