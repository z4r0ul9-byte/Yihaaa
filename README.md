# Hand Gesture — Rope 2 Tangan (Slingshot)

Aplikasi hand-tracking yang menyambungkan **tali karet (rubber band)** antar ujung jari telunjuk tangan kiri dan kanan secara real-time di layar kamera.

## Cara Main
1. Nyalakan kamera.
2. Tunjukkan **kedua tangan** (kiri dan kanan) ke arah kamera.
3. Tali karet merah akan otomatis muncul dan menyambung di ujung telunjuk lu.
4. Geser/jauhkan tangan lu, talinya akan melar. Deketin tangannya, talinya bakal melengkung ke bawah (karena gravitasi).

## Teknologi
- **Verlet Integration**: Simulasi rantai fisik tali yang di-pin di dua titik ujung (landmark 8 dari masing-masing tangan).
- **Gravitasi & Friction**: Memberikan efek jatuh bebas dan redaman agar pergerakan
