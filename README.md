<!-- logo -->
<p align="center">
<img src="public/logo.png" alt="Logo" width="200" height="200">
</p>

# DeTicketing

Sistem manajemen tiket dan pendaftaran event berbasis Nuxt 3, Prisma, dan SQLite. Dirancang untuk memberikan solusi manajemen pendaftaran yang aman, fleksibel, dan mudah diimplementasikan.

## Fitur Utama

### Manajemen Form & Penjadwalan

- **Pembangun Form Dinamis**: Mendukung berbagai tipe input mulai dari teks sederhana hingga unggahan file dan pilihan grid kompleks.
- **Checkout Rombongan (Multi-Ticket)**: Memungkinkan pendaftaran kolektif dalam satu pesanan (batch) dengan manajemen nama peserta tambahan secara dinamis.
- **Sistem Promo & Diskon**: Dukungan promo "Beli X Gratis Y" atau potongan harga tetap berdasarkan jumlah tiket yang dibeli untuk mendorong pendaftaran rombongan.
- **Smart Promo Adjustment**: Batas maksimal tiket per pesanan otomatis menyesuaikan dengan kebutuhan promo agar pendaftar selalu dapat memanfaatkan penawaran (misal: Beli 5 Gratis 1 otomatis menaikkan batas order menjadi 6).
- **Fleksibilitas Penjadwalan**: Dukungan untuk event satu hari maupun event berdurasi panjang (multi-day) dengan penanganan tanggal selesai otomatis.
- **Billing Summary Adaptif**: Kalkulasi biaya otomatis dengan tampilan ringkasan pembayaran yang profesional, termasuk kalkulasi potongan promo secara real-time.
- **Pendaftaran Email Independen**: Opsi untuk membatasi pendaftaran email berulang kini bersifat opsional dan tidak lagi dipaksa aktif saat mode Multi-Ticket menyala.

### Pelaporan dan Analitik

- **Professional Reporting (Export)**: Ekspor daftar pendaftar ke format **PDF** dan **CSV** secara instan dengan sinkronisasi kolom dinamis.
- **Smart Report Logic**: Kolom status kehadiran otomatis disesuaikan (muncul/sembunyi) pada laporan berdasarkan waktu pelaksanaan event.
- **Advanced Dashboard Trend**: Visualisasi tren pendaftaran yang akurat (7 hari, 30 hari, 1 tahun) dengan dukungan data hari ini (_real-time_).
- **Sinkronisasi Real-Time**: Monitoring pendaftaran dan perubahan status secara instan tanpa perlu memuat ulang halaman.

### Notifikasi & Komunikasi

- **WhatsApp Gateway Integration**: Pengiriman notifikasi pendaftaran dan tiket langsung ke WhatsApp peserta.
- **WhatsApp Guard (Anti-Ban)**: Mekanisme pengiriman pesan berurutan dengan jeda waktu acak (Randomized Delay) untuk melindungi nomor pengirim dari blokir.
- **Automasi E-Ticket**: Pengiriman tiket elektronik secara otomatis (Email & WA) segera setelah pendaftaran disetujui.

### Keamanan & Manajemen Sistem (Admin Only)

- **Security Hardening (RBAC)**: Validasi JWT ketat dengan pengecekan role **OWNER** pada semua fungsi sensitif.
- **Database Management Suite**: 
  - **Manual Backup**: Buat salinan database kapan saja melalui satu klik.
  - **Auto-Backup**: Sistem otomatis mencadangkan database setiap kali melakukan pembaharuan kode.
  - **Restore Feature**: Pulihkan data dari daftar riwayat backup jika terjadi kesalahan sistem.
  - **Database Export**: Unduh file database (.db) langsung ke komputer lokal untuk arsip offline.
- **Zero-Downtime Update**: Proses pembaruan sistem yang mulus tanpa mengganggu pengguna aktif (Atomic Build Replacement).
- **Background Build Process**: Pembaruan sistem berjalan di latar belakang (Async) untuk mencegah timeout pada browser saat proses build berlangsung.
- **Safe Sync (Migrations)**: Menggunakan **Prisma Migrations** (`migrate deploy`) untuk sinkronisasi database yang aman tanpa risiko kehilangan data.

### Operasional Lapangan

- **Advanced QR Scanner**: Pemindai QR berbasis web dengan validasi ketat antar event dan feedback audio-visual _real-time_.
- **Pemantauan Multi-Day**: Grafik kehadiran yang mendukung event berdurasi panjang dengan akumulasi data per jam yang akurat.

## Teknologi Utama

- **Framework**: Nuxt 3 (Vue.js 3 & Nitro)
- **Real-Time**: WebSocket (Nitro/CrossWS)
- **ORM**: Prisma 7 (Migration-based workflow)
- **Database**: SQLite dengan LibSQL Adapter
- **Keamanan**: JWT Authentication, SHA-256 Fingerprinting, AES-256 File Encryption
- **Reporting**: jsPDF, AutoTable
- **Email**: SMTP integration via Nodemailer
- **WhatsApp**: REST API Integration with Randomized Guard Logic

## Instalasi

### Prasyarat

- Node.js versi 20 atau yang lebih baru
- npm versi 10 atau yang lebih baru

### Langkah-langkah

1. Clone repositori ini ke direktori lokal.
2. Jalankan instalasi dependensi:
   ```bash
   npm install
   ```
3. Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasinya.
4. Jalankan inisialisasi basis data menggunakan migrasi:
   ```bash
   npx prisma migrate deploy
   ```
5. Jalankan aplikasi dalam mode pengembangan:
   ```bash
   npm run dev
   ```

## Struktur Folder Penting

- `prisma/`: Berisi skema database dan file migrasi resmi.
- `data/backups/`: Tempat penyimpanan file cadangan database (Manual & Auto).
- `public/uploads/`: Folder penyimpanan gambar bukti pembayaran pendaftar.
- `server/api/admin/system/`: Endpoint manajemen inti (Backup, Restore, Update, Download).

## Lisensi

Proyek ini dilisensikan di bawah [Lisensi MIT](LICENSE).

---
© 2026 DeTicketing Platform - Advanced Event Management System.
