# Changelog

Seluruh perubahan penting pada proyek DeTicketing akan dicatat dalam dokumen ini.

---

## [1.1.0] - 2026-05-04 (pre-release)

### Added

- **Multi-Ticket Checkout**: Pendaftar kini dapat membeli lebih dari 1 tiket dalam satu kali pengisian form (Checkout Rombongan).
- **Group Purchase UI**: Toggle interaktif "Daftar untuk Rombongan?" dengan quantity stepper dan input nama dinamis.
- **Adaptive Billing Summary**: Redesain ringkasan pembayaran dengan tampilan profesional yang menyesuaikan antara mode individu dan rombongan.
- **Unlimited Ticket Mode**: Dukungan pembelian tiket tanpa batas dalam satu pesanan jika nilai batas maksimal diatur ke `0`.
- **Konfigurasi Event**: Toggle "Izinkan Multi-Ticket" dan pengaturan "Maksimal Tiket Per Order" di halaman edit event.
- **Dynamic Form Logic**: Penambahan input nama otomatis sesuai jumlah tiket yang dipilih di form pendaftaran.
- **Batch Approval System**: Persetujuan otomatis untuk seluruh tiket dalam satu pesanan (order) sekaligus dari dashboard admin.
- **Anti-Spam Email Delivery**: Pengiriman e-ticket secara bertahap dengan delay 1.5 detik per email dan subjek email personal.
- **Staff Notification Enrichment**: Notifikasi email untuk admin kini menyertakan daftar seluruh nama peserta dan total tiket untuk pesanan rombongan.
- **UI Refinement**: Penambahan padding dan perbaikan tata letak pada halaman detail tiket di dashboard admin untuk informasi tiket "bersaudara".

### Changed

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
