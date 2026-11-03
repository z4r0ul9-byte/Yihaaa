# Hand Gesture — Fase E (Panel Kalibrasi + Debug HUD)

Aplikasi kini dilengkapi dengan **Debug HUD** melayang di atas video dan **Panel Kalibrasi** interaktif yang bisa diakses langsung dari HP. Semua pengaturan disimpan di `localStorage` sehingga tetap tersimpan meski halaman di-refresh.

## Fitur Fase E

1. **Debug HUD**: Menampilkan FPS, jumlah tangan, state gestur, jarak pinch ternormalisasi (`dNorm`), dan skala zoom secara real-time. Bisa di-toggle ON/OFF.
2. **Panel Kalibrasi**: Mengatur `PINCH_IN`, `PINCH_OUT`, `Cursor Alpha`, dan `Pan Alpha` via slider.
3. **Auto-Calibration**: Fitur cerdas untuk menghitung threshold pinch secara otomatis.
   - Fase 1 (3 detik): Tangan **terbuka** (jari direntangkan).
   - Fase 2 (3 detik): Tangan **mencubit** (jempol & telunjuk rapat).
   - Sistem akan menghitung `avgOpen` dan `avgPinch`, lalu mencari titik tengah yang aman (20% margin) untuk mencegah *flicker*.
4. **LocalStorage**: Konfigurasi otomatis disimpan, dan ada tombol **Reset** untuk kembali ke pengaturan pabrik.

## Struktur Folder

```

hand-gesture-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js      # Konstanta & manajemen localStorage
│   ├── camera.js      # getUserMedia
│   ├── tracker.js     # HandLandmarker
│   ├── smoothing.js   # EMA filter
│   ├── cursor.js      # Kursor & pemilihan tangan
│   ├── gesture.js     # State machine pinch & pan
│   ├── transform.js   # Skala & translasi (zoom + drag)
│   ├── hud.js         # [BARU] Manajemen UI HUD
│   ├── calibration.js # [BARU] Logika slider & kalibrasi otomatis
│   └── main.js        # Orkestrator
└── README.md

```

## Cara Coba Auto-Calibration

1. Buka kamera dan pastikan tangan terdeteksi.
2. Buka panel **⚙️ Kalibrasi**.
3. Tekan tombol **Mulai Kalibrasi Otomatis**.
4. Ikuti instruksi di kotak kuning:
   - Selama 3 detik, buka tangan selebar mungkin (jangan goyang).
   - Selama 3 detik berikutnya, cubit jempol dan telunjuk Anda.
5. Setelah selesai, slider akan otomatis bergerak ke angka yang paling pas.

## Troubleshooting

| Gejala | Solusi |
|---|---|
| Kalibrasi otomatis gagal | Pastikan pencahayaan cukup dan tangan tidak keluar dari frame kamera selama proses 6 detik. |
| HUD menutupi wajah/tangan | Tekan tombol **HUD: ON** di bawah video untuk menyembunyikannya. |
| Pengaturan tidak tersimpan | Cek apakah mode Incognito/Private Browsing aktif (localStorage biasanya diblokir). |

