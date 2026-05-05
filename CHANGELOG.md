# Changelog

Seluruh perubahan penting pada proyek DeTicketing akan dicatat dalam dokumen ini.

---

## [1.1.0] - 2026-05-05

### Added

- **Professional Reporting (Export)**: Fitur ekspor pendaftar ke format PDF dan CSV dengan sinkronisasi kolom dinamis.
- **Smart Report Logic**: Kolom "Status Kehadiran" pada laporan otomatis muncul hanya jika event telah dilaksanakan (berdasarkan `eventDate`).
- **Global API Interceptor**: Implementasi penanganan error 401/403 secara global untuk membersihkan sesi dan redirect otomatis ke login jika token tidak valid.
- **Multi-Ticket Checkout**: Pendaftar kini dapat membeli lebih dari 1 tiket dalam satu kali pengisian form (Checkout Rombongan).
- **Security Hardening (RBAC)**: Pengamanan ketat pada API sistem (Backup, Restore, Update, Download) yang kini hanya bisa diakses oleh role **OWNER**.
- **Database Management Suite**: Fitur Backup Manual, Restore dari riwayat, dan Unduh Database (.db) langsung dari dashboard Admin.
- **Automatic Protection**: Sistem kini otomatis melakukan backup database sebelum menjalankan proses update kode.
- **Safe Sync (Migrations)**: Implementasi **Prisma Migrations** untuk pembaharuan skema database yang aman tanpa risiko kehilangan data (Menggantikan `db push`).
- **Zero-Downtime & Async Update**: Alur build baru yang tidak menghapus file aktif saat proses berjalan dan berjalan di latar belakang (background) untuk mencegah browser timeout.
- **Prisma 7 Compatibility**: Pembersihan skema dan konfigurasi untuk mendukung fitur stabil di Prisma 7.

### Fixed

- **Sidebar Mobile**: Perbaikan tata letak sidebar pada perangkat mobile di mana tombol logout sempat tertutup (Menggunakan `100dvh`).
- **Auth Consistency**: Perbaikan bug "zombie sessions" dan redirect berulang pada middleware auth/guest.
- **Database Path Logic**: Penggunaan *Absolute Path* yang lebih konsisten untuk file SQLite guna mencegah database "hilang" saat server dijalankan dari direktori berbeda.
- **Update Downtime**: Menghilangkan error 500 (ENOENT) saat proses build update sedang berlangsung di server.n rombongan.
- **Unlimited Ticket Mode**: Dukungan pembelian tiket tanpa batas dalam satu pesanan jika nilai batas maksimal diatur ke `0`.
- **Konfigurasi Event**: Toggle "Izinkan Multi-Ticket" dan pengaturan "Maksimal Tiket Per Order" di halaman edit event.
- **Dynamic Form Logic**: Penambahan input nama otomatis sesuai jumlah tiket yang dipilih di form pendaftaran.
- **Batch Approval System**: Persetujuan otomatis untuk seluruh tiket dalam satu pesanan (order) sekaligus dari dashboard admin.
- **Anti-Spam Email Delivery**: Pengiriman e-ticket secara bertahap dengan delay 1.5 detik per email dan subjek email personal.

### Changed

- **Optimasi Dashboard Trend**: Perbaikan logika rentang waktu pada Tren Pendaftaran (7 hari, 30 hari, 1 tahun) agar selalu menyertakan data hari ini dan bulan berjalan secara akurat.
- **Security Hardening**: Penggunaan HttpOnly cookie untuk auth token dan SameSite: Strict untuk perlindungan maksimal terhadap CSRF.
- **Auth State Caching**: Penggunaan `useState` untuk menyimpan sesi di sisi klien guna mencegah logout acak saat navigasi antar halaman.
- **Mobile UI Optimization**: Perbaikan tinggi sidebar menggunakan `100dvh` agar tombol logout tidak tertutup oleh bar navigasi browser pada perangkat mobile.
- **CSP Updates**: Penyesuaian Content Security Policy untuk mendukung Cloudflare Insights secara aman.
- **Enhanced Admin UI**: Indikator "Multi-Ticket" pada daftar pendaftar dan visualisasi grup pesanan pada halaman detail tiket.
- **Sistem Real-Time WebSocket**: Migrasi penuh dari sistem polling/interval ke sinkronisasi instan berbasis WebSocket (Nitro/CrossWS). Perubahan mencakup Dashboard Admin, Daftar Event, dan Daftar Pendaftar.

---

## [1.0.5] - 2026-05-01

### Added

- **Event Detail View**: Halaman detail event khusus untuk meninjau seluruh konfigurasi dan metadata event secara mendalam.
- **Staff Filter Logic**: Implementasi filter pada API pendaftar sehingga Panitia/Petugas hanya dapat melihat data tiket dari event yang ditugaskan kepada mereka.
- **Event Assignment UI**: Integrasi sistem penugasan staff langsung di dalam form pembuatan/edit event dengan fitur pencarian dan multi-select.

### Changed

- **Role-Based Access Control**: Penguatan sistem keamanan di mana staff dengan role Panitia atau Petugas hanya dapat mengakses event yang secara spesifik ditugaskan kepada mereka.

---

## [1.0.0] - 2026-04-30

### Fitur Baru

- **Multi-Day Event Support**: Dukungan penuh untuk event berdurasi lebih dari satu hari. Penambahan field `eventEndDate` dan penyesuaian otomatis pada form pendaftaran publik serta dashboard pemantauan.
- **Scanner Event Selection**: Alur kerja baru pada scanner QR yang mewajibkan pemilihan event aktif sebelum melakukan pemindaian. Dilengkapi dengan filter otomatis untuk menyembunyikan event yang telah berakhir.
- **Voice & Visual Mismatch Alerts**: Implementasi peringatan suara (Text-to-Speech) dan peringatan visual (Red Alert) jika tiket yang discan tidak sesuai dengan event yang sedang diproses.
- **Scanner Search & Filter**: Fitur pencarian case-insensitive pada layar pemilihan event di scanner untuk memudahkan navigasi saat terdapat banyak event aktif.

### Perbaikan & Optimalisasi

- **Dashboard Performance**: Optimasi kueri database pada dashboard utama untuk penanganan data pendaftaran dalam jumlah besar.
- **UI Stability**: Perbaikan bug pada tampilan sidebar mobile dan transisi antar halaman admin.
