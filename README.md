# Hand Gesture — Dual Mode (Cloud vs Local)

Aplikasi hand-tracking dengan dua mode visual (Tali Karet & Balok 3D) serta opsi pengaturan sumber daya.

## Fitur Toggle
1. **Model Cloud / Local**: 
   - **Cloud** mengambil model AI dari server Google (butuh internet).
   - **Local** mengambil dari folder `models/hand_landmarker.task` di HP lu (100% offline).
2. **Cam Depan / Belakang**: Ganti sumber kamera (jika HP memiliki kamera ganda).
3. **Mode: Rope / Balok 3D**: Ganti visual interaktif.

## Cara Pakai Mode Local (Offline)
1. Download file model dari [Google Storage](https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task).
2. Buat folder `models` di dalam folder aplikasi.
3. Simpan file tersebut sebagai `models/hand_landmarker.task`.
4. Klik tombol **Model: Cloud** di aplikasi sampai berubah jadi **Model: Local**.

## Struktur Folder
```

hand-gesture-app/
├── index.html
├── css/style.css
├── js/
│   ├── main.js
│   ├── config.js
│   ├── block.js
│   ├── rope.js
│   └── (modul lain)
└── models/ (opsional, untuk local model)

```

