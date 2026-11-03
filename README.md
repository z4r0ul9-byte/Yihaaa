# Hand Gesture — Fase C (Pinch-to-Zoom)

Aplikasi ini sekarang mendukung **Pinch-to-Zoom** menggunakan gestur tangan kosong.
Kursor virtual (Fase B) dan deteksi skeleton (Fase A) tetap berjalan beriringan.

## Fitur Fase C

1. **Normalisasi Jarak**: Deteksi pinch menggunakan rasio jarak jempol-telunjuk dibagi lebar telapak. Ini membuat gestur tetap konsisten meskipun tangan maju/mundur dari kamera.
2. **State Machine (Hysteresis)**: 
   - Masuk state `PINCHED` jika jarak `< 0.25`.
   - Keluar state `PINCHED` jika jarak `> 0.35`.
   - Mencegah efek "flicker" (zoom lompat-lompat) saat jari berada di ambang batas.
3. **Zoom Konten**: Terdapat kotak target di bawah kamera (kotak dengan background grid). Saat Anda mencubit dan menggeser jari, kotak tersebut akan membesar/mengecil.
4. **Clamp Skala**: Zoom dibatasi minimal `0.5x` dan maksimal `4.0x` agar UI tidak rusak.

## Struktur Folder

```

hand-gesture-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js      # threshold pinch & zoom
│   ├── camera.js      # getUserMedia
│   ├── tracker.js     # HandLandmarker
│   ├── smoothing.js   # EMA filter
│   ├── cursor.js      # logika kursor & pemilihan tangan
│   ├── gesture.js     # [BARU] state machine pinch
│   ├── zoom.js        # [BARU] logika scale target
│   └── main.js        # orkestrator
└── README.md

```

## Cara Coba

1. Serve lewat localhost atau GitHub Pages (pastikan HTTPS).
2. Buka kamera.
3. **Cubit** jempol dan telunjuk Anda ke arah kamera sampai status berubah menjadi **"Mencubit"**.
4. Jauhkan/dekatkan kedua jari tersebut. Kotak grid di bawah layar akan membesar/mengecil sesuai jarak cubitan.
5. Buka jari Anda untuk melepas mode zoom.

## Troubleshooting

| Gejala | Solusi |
|---|---|
| Status tidak berubah jadi "Mencubit" meskipun jari sudah rapat | Turunkan `GESTURE.PINCH_IN` di `config.js` (misal ke `0.20`). |
| Status tiba-tiba lepas sendiri saat sedang zoom | Naikkan `GESTURE.PINCH_OUT` (misal ke `0.40`). |
| Zoom terlalu sensitif / terlalu cepat membesar | Perlebar selisih antara `PINCH_IN` dan `PINCH_OUT`. |

