# Hand Gesture — Rope / Slingshot

Aplikasi ini mendemonstrasikan interaksi **Tali Karet (Slingshot)** menggunakan hand-tracking di browser. Pengguna dapat mencubit simpul tali dan menariknya, lalu melepaskannya untuk melihat efek fisika pegas (mantul-mantul).

## Fitur
1. **Interaksi Pinch & Drag**: Simpul tali merespons cubitan tangan.
2. **Fisika Pegas (Hooke's Law)**: Tali memiliki kekakuan (`springK`) dan gesekan (`damping`) sehingga menghasilkan efek mantul yang natural saat dilepas.
3. **Kurva Bezier**: Tali digambar menggunakan `quadraticCurveTo` agar terlihat lentur.
4. **Optimasi Canvas**: Canvas tali berdiri sendiri, terpisah dari canvas video/skeleton, menjaga performa tetap tinggi.

## Cara Coba
1. Serve lewat localhost atau HTTPS.
2. Buka kamera.
3. **Cubit** jempol dan telunjuk, tarik simpul tali (titik biru) ke atas, bawah, kiri, atau kanan.
4. Buka cubitan (lepas jari), dan lihat talinya mantul kembali ke tengah.

## Tuning Fisika
Buka `js/rope.js` jika ingin mengubah sifat karet:
- `springK` (default `0.12`): Semakin besar, semakin kencang tarikannya.
- `damping` (default `0.82`): Semakin kecil, semakin lama getarannya (seperti jelly). Semakin besar, semakin cepat berhenti.
