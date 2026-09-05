KARTU HAFALAN AL-QUR'AN - V1.5
===============================

Prototipe PWA offline-first.

File:
- index.html
- styles.css
- app.js
- manifest.webmanifest
- sw.js

Cara uji paling mudah:
1. Buka index.html di browser untuk uji fungsi dasar.
2. Untuk instal sebagai PWA/offline penuh, host folder ini pada HTTPS atau localhost.
3. Data disimpan di localStorage browser.
4. Backup/Restore menggunakan file JSON.

Catatan:
- Mode Jamaah dan Pembimbing benar-benar terpisah.
- Tidak ada sinkronisasi.
- Daftar surat mencakup Al-Fatihah + surat Juz 30 (78-114), mengikuti urutan pada formulir yang difoto.


V1.5: Tampilan tabel mobile diperbaiki agar kolom Ulang dan Lanjut selalu terlihat tanpa geser horizontal; menu Beranda di dalam mode dihilangkan.

V1.5: Data JAMAAH dan PEMBIMBING disimpan terpisah dan tetap tersimpan saat aplikasi dibuka kembali. Service worker diperbarui agar update aplikasi lebih cepat.


V1.5: Menambahkan fasilitas Tambah Surat melalui Pengaturan. Surat tambahan disimpan di perangkat dan muncul di kartu JAMAAH serta kartu JAMAAH pada mode PEMBIMBING di perangkat tersebut.
