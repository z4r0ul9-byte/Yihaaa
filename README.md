# Hand Gesture — Fase D (Drag / Pan + Zoom)

Aplikasi ini sekarang mendukung interaksi **Pinch-to-Zoom** dan **Drag (Pan)** secara bersamaan. Pengguna bisa mencubit, menggeser tangan untuk memindahkan konten, dan menjauhkan/mendekatkan jari untuk mengubah skala.

## Fitur Fase D

1. **Palm Center Tracking**: Pergerakan telapak dihitung menggunakan rata-rata dari 5 landmark (0, 5, 9, 13, 17). Digunakan sebagai basis pergeseran (drag).
2. **Delta Smoothing**: Pergeseran tangan per frame dihaluskan dengan Exponential Moving Average (EMA) terpisah (alpha 0.4) supaya pergerakan tidak kaku.
3. **Kombinasi Transformasi**: Elemen target sekarang merespons perintah `translate()` dan `scale()` secara bersamaan. Skala tetap di-clamp (0.5x - 4.0x).
4. **Penamaan Modul**: `zoom.js` di-rename menjadi `transform.js` karena sekarang menangani zoom dan pan.

## Struktur Folder

```

hand-gesture-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js      # Tambahan konfigurasi PAN
│   ├── camera.js      # getUserMedia
│   ├── tracker.js     # HandLandmarker
│   ├── smoothing.js   # EMA filter
│   ├── cursor.js      # logika kursor & pemilihan tangan
│   ├── gesture.js     # [UPDATE] tambah perhitungan delta telapak
│   ├── transform.js   # [BARU] pengganti zoom.js, handle zoom + drag
│   └── main.js        # orkestrator
└── README.md

```

## Cara Coba

1. Serve lewat localhost atau GitHub Pages (HTTPS).
2. Buka kamera.
3. **Cubit** jempol dan telunjuk Anda.
4. Saat status berubah jadi **"Mencubit"**:
   - **Geser tangan** Anda ke kanan/kiri/atas/bawah untuk memindahkan kotak target.
   - **Jauhkan/dekatkan jari** untuk mengubah ukuran kotak.
5. Buka jari Anda untuk melepas mode interaksi.

## Troubleshooting

| Gejala | Solusi |
|---|---|
| Geseran terlalu sensitif (kotak langsung hilang) | Turunkan `PAN.EMA_ALPHA` ke `0.2` di `config.js` agar lebih lambat/halus. |
| Geseran terasa berat/lag | Naikkan `PAN.EMA_ALPHA` ke `0.6`. |
| Pergerakan tangan arah X terbalik | Pastikan Anda tidak mengubah kode mirror di `gesture.js`. |
| Zoom bagus tapi pan tidak jalan | Pastikan landmark 0, 5, 9, 13, 17 terdeteksi baik oleh kamera (tangan tidak terpotong frame). |

