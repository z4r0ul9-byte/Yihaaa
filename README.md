# Hand Gesture — Fase A (Kamera + Deteksi Tangan + Overlay Landmark)

Fondasi aplikasi hand-tracking yang berjalan **penuh di browser HP Android (Chrome)**.
Fase ini hanya fokus ke: kamera depan aktif, MediaPipe `HandLandmarker` mendeteksi
hingga 2 tangan, dan overlay skeleton 21 landmark tergambar realtime di atas video.

Fitur kursor virtual, pinch-zoom, drag, kalibrasi, dan HUD **belum** ada di fase ini —
itu fase B–E berikutnya.

## Struktur Folder

```

hand-gesture-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js      # konstanta & threshold terpusat
│   ├── camera.js      # getUserMedia + lifecycle + error mapping
│   ├── tracker.js     # init HandLandmarker (GPU→CPU fallback) + detect
│   └── main.js        # orkestrator: rAF loop + render skeleton
└── README.md

```

## Stack

- **HTML + CSS + Vanilla JS (ES modules)** — tanpa framework, tanpa bundler.
- **MediaPipe Tasks Vision** `@mediapipe/tasks-vision@0.10.14` via jsDelivr ESM.
- **API** `HandLandmarker` (bukan `Hands` legacy), `runningMode: "VIDEO"`,
  `delegate: "GPU"` dengan fallback otomatis ke `"CPU"`.
- **Model** `.task` di-fetch dari CDN resmi Google
  (`storage.googleapis.com/mediapipe-models/hand_landmarker/...`).
- **Loop** `requestAnimationFrame` + `detectForVideo(video, performance.now())`.

## Cara Serve di Termux

```bash
pkg update && pkg install -y python
cd hand-gesture-app
python -m http.server 8000
```

Lalu buka di **Chrome Android**:

```
http://localhost:8000
```

## Catatan Izin Kamera (PENTING)

Chrome memberlakukan aturan **secure context** untuk `getUserMedia`:

- ✅ `http://localhost` — **dikecualikan**, dianggap secure. Aman untuk dev lokal.
- ✅ `https://…` — secure.
- ❌ `http://192.168.x.x` atau `http://<IP-HP>` — **BUKAN** secure context.
Kamera akan diblokir. Ini bukan bug aplikasi.

Jadi: **jalankan server di HP yang sama** dan akses lewat `localhost`, jangan
lewat IP LAN.

## Alur Pemakaian

1. Buka `http://localhost:8000` di Chrome Android.
2. Tekan tombol **Mulai Kamera**.
3. Izinkan akses kamera saat diminta Chrome.
4. Angkat 1–2 tangan ke depan kamera depan.
5. Skeleton 21 titik + label `KANAN` / `KIRI` akan tergambar realtime.

## Catatan Label Kiri/Kanan

MediaPipe mengembalikan `handedness` dengan asumsi gambar input **sudah
di-mirror** (selfie). Kita memberi frame video **raw** (belum mirror; mirror
dilakukan via CSS hanya untuk tampilan). Akibatnya label mentah dari MediaPipe
**terbalik** relatif ke tangan fisik user. Kode di `main.js` men-swap label:

```
'Left'  (mentah)  →  'KANAN'  (tampil)
'Right' (mentah)  →  'KIRI'   (tampil)
```

Kalau di perangkatmu labelnya justru terasa kebalik, cukup tukar fungsi
`labelForUser()` di `main.js`.

## Troubleshooting

| Gejala ↕▾ | Penyebab umum ↕▾ | Solusi ↕▾ |
|---|---|---|
| −"Izin kamera ditolak" | Izin situs belum diberikan | Chrome → ikon gembok di address bar → Izin → Kamera → Izinkan → reload |
| "Halaman bukan secure context" | Diakses via IP LAN, bukan localhost | Pakai `http://localhost:8000` |
| "Kamera sedang dipakai aplikasi lain" | Aplikasi lain (video call, dsb.) memegang kamera | Tutup aplikasi tsb., reload halaman |
| "Gagal memuat modul MediaPipe dari CDN" | Tidak ada internet / CDN diblokir | Pastikan HP online; cek `cdn.jsdelivr.net` dapat diakses |
| "GPU gagal, fallback ke CPU…" (muncul di status) | WebGL/driver HP menolak delegate GPU | Normal — aplikasi lanjut di CPU, hanya sedikit lebih lambat |
| Status "Memuat…" lama sekali | Unduhan model `.task` (~7 MB) lambat | Tunggu; model di-cache oleh Chrome setelah load pertama |
| Video tampil tapi tidak ada skeleton | Tangan terlalu dekat/jauh, atau cahaya minim | Coba jarak 30–80 cm, pencahayaan cukup, telapak hadap kamera |
| Video tampak terbalik kiri-kanan | Ini memang mirror kamera depan (by design) | Biarkan — sesuai UX cermin; kalau tidak suka, hapus `transform: scaleX(-1)` di `css/style.css` |
⚙

## Acceptance Fase A

- ☑  
Buka via `localhost` → izin kamera muncul → video tampil.
- ☑  
Tangan terdeteksi → skeleton 21 landmark tergambar realtime.
- ☑  
Label `KANAN` / `KIRI` tampil, tidak terbalik.
- ☑  
Fallback CPU otomatis bila GPU delegate gagal.
- ☑  
Error kamera / model / secure-context ditampilkan jelas, tidak diam.

