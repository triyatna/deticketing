# Changelog

Seluruh perubahan penting pada proyek DeTicketing akan dicatat dalam dokumen ini.

---

## [1.0.96] - 2026-05-04

### Fitur Baru
- **Multi-Day Event Support**: Dukungan penuh untuk event berdurasi lebih dari satu hari. Penambahan field `eventEndDate` dan penyesuaian otomatis pada form pendaftaran publik serta dashboard pemantauan.
- **Scanner Event Selection**: Alur kerja baru pada scanner QR yang mewajibkan pemilihan event aktif sebelum melakukan pemindaian. Dilengkapi dengan filter otomatis untuk menyembunyikan event yang telah berakhir.
- **Voice & Visual Mismatch Alerts**: Implementasi peringatan suara (Text-to-Speech) dan peringatan visual (Red Alert) jika tiket yang discan tidak sesuai dengan event yang sedang diproses.
- **Scanner Search & Filter**: Fitur pencarian case-insensitive pada layar pemilihan event di scanner untuk memudahkan navigasi saat terdapat banyak event aktif.

### Antarmuka (UI/UX)
- **Scrollable Dashboard Lists**: Implementasi vertical scrolling pada daftar pendaftar terbaru di Dashboard Global dan Event guna menjaga layout tetap kompak.
- **Enhanced Attendance Chart**: Grafik tren kehadiran kini mendukung durasi multi-hari dengan fitur horizontal scrolling untuk keterbacaan data yang lebih baik.
- **Premium Scanner Cards**: Redesain layar pemilihan event dengan estetika premium, efek glassmorphism, dan indikator "Live" dinamis untuk event hari ini.
- **Layout Compaction**: Optimalisasi jarak, margin, dan padding pada seluruh panel administratif untuk efisiensi ruang kerja.

---

## [1.0.93] - 2026-05-04

### Fitur Baru
- **Role-Based Event Assignment**: Implementasi manajemen penugasan staff (Panitia/Petugas) ke event spesifik. Staff kini hanya memiliki akses ke event yang didelegasikan kepada mereka.
- **Notifikasi Pendaftaran Staff**: Sistem pengiriman notifikasi email otomatis kepada staff operasional saat terdapat pendaftaran peserta baru.
- **Dynamic Form Labels**: Fleksibilitas penamaan label pada komponen form pendaftaran dinamis.

### Keamanan
- **Hardening Form Submission**: Penguatan mekanisme sidik jari perangkat (device fingerprinting) untuk memitigasi pendaftaran ganda dan spam.
- **Sanitisasi XSS & SQLi**: Peningkatan prosedur filter karakter pada deskripsi event dan label form untuk mencegah serangan injeksi.
- **Kontrol Akses**: Pengetatan validasi izin akses melalui middleware `checkEventAccess` pada seluruh endpoint API administratif.

### Antarmuka (UI/UX)
- **Live Indicator**: Integrasi indikator pemantauan real-time pada dashboard pendaftar.
- **Standardisasi Desain**: Penyelarasan elemen header, gradien, dan transisi visual pada panel admin dan form publik.
- **Sinkronisasi Navigasi**: Perbaikan konsistensi status menu aktif pada perangkat mobile.

### Perbaikan dan Internal
- **Migrasi Prisma v7**: Pembaruan dependensi ke Prisma versi 7 untuk peningkatan stabilitas query.
- **Automasi AEO**: Integrasi generator dokumen `llms.txt` dan `llms-full.txt` pada alur build.
- **Pembersihan Peringatan**: Resolusi masalah *hydration mismatch* dan penggunaan properti lama pada komponen Vue.

---

## [1.0.0] - 2026-04-30
- Rilis produksi awal.
- Alur kerja utama tiket (Pendaftaran, Approval, Pemindaian).
- Dashboard administratif dasar.
