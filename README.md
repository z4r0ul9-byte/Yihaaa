# Hand Gesture — Fase F (Optimasi Performa & Offline Model)

Aplikasi kini dioptimasi secara menyeluruh agar berjalan mulus (≥ 20 FPS) di HP mid-range. Berbagai *bottleneck* seperti resolusi tinggi, DOM update berlebih, dan efek CSS berat telah dihilangkan.

## Fitur Fase F (Optimasi)

1. **Resolusi Kamera 480p**: Constraint diturunkan dari 720p ke 640x480. Ini meringankan beban *decode* video dan transfer memori ke GPU/CPU MediaPipe.
2. **Model Lite**: Menggunakan `hand_landmarker_lite.task` yang ukurannya lebih kecil dan komputasinya lebih ringan.
3. **Canvas `desynchronized` & No-Alpha**: `getContext('2d', { alpha: false, desynchronized: true })` membuat Chrome bisa me-render canvas lebih cepat tanpa nunggu sinkronisasi compositor, dan mematikan alpha channel menghemat VRAM.
4. **HUD Update Throttling**: HUD tidak lagi mengupdate teks DOM 60x per detik, melainkan dibatasi 10x per detik (100ms). Ini mencegah *layout thrashing*.
5. **Buang CSS Berat**: `backdrop-filter: blur()` di HUD dihapus total karena sangat membebani GPU saat overlay transparan.
6. **Auto-Fallback**: Jika GPU bermasalah, aplikasi tetap otomatis lari di CPU.

## Struktur Folder & Model Offline

```

hand-gesture-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js      # URL model lite & resolusi 480p
│   ├── ... (modul lain)
└── models/            # (Opsional) Folder untuk model offline
└── hand_landmarker_lite.task

```

### Cara Pakai Model Offline (Tanpa Internet)

Saat ini `config.js` mengambil model dari CDN Google. Jika ingin aplikasi berjalan 100% offline:

1. Download file model `hand_landmarker_lite.task` dari [URL ini](https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker_lite/float16/1/hand_landmarker_lite.task).
2. Buat folder `models` di dalam folder aplikasi Anda, lalu taruh file tersebut di dalamnya (`models/hand_landmarker_lite.task`).
3. Buka `js/config.js` dan ubah `MODEL_URL` menjadi:
   ```javascript
   MODEL_URL: './models/hand_landmarker_lite.task',
```

4. (Opsional) Untuk WASM MediaPipe yang offline, Anda harus mengunduh seluruh file di folder `wasm` dari `@mediapipe/tasks-vision` dan mengubah `WASM_ROOT` ke path lokal.

## Target Performa (Definition of Done)

- ☑  
FPS ≥ 20 di HP mid-range (720p sebelumnya, sekarang 480p agar tembus 30fps).
- ☑  
Tidak ada error `console.error` dari Canvas 2D.
- ☑  
Smoothing berjalan (EMA) di resolusi rendah.

