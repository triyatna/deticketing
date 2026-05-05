# DeTicketing

Sistem manajemen tiket dan pendaftaran event berbasis Nuxt 3, Prisma, dan SQLite. Dirancang untuk memberikan solusi manajemen pendaftaran yang aman, fleksibel, dan mudah diimplementasikan.

<!-- logo -->
<p align="center">
<img src="public/logo.png" alt="Logo" width="200" height="200">
</p>

## Fitur Utama

### Manajemen Form & Penjadwalan

- **Pembangun Form Dinamis**: Mendukung berbagai tipe input mulai dari teks sederhana hingga unggahan file dan pilihan grid kompleks.
- **Fleksibilitas Penjadwalan**: Dukungan untuk event satu hari maupun event berdurasi panjang (multi-day) dengan penanganan tanggal selesai otomatis.
- **Checkout Rombongan (Multi-Ticket)**: Memungkinkan pendaftaran kolektif dalam satu pesanan (batch) dengan manajemen nama peserta tambahan secara dinamis.
- **Billing Summary Adaptif**: Kalkulasi biaya otomatis dengan tampilan ringkasan pembayaran yang profesional dan terstruktur untuk pesanan rombongan.
- **Detail Event Komprehensif**: Manajemen event yang mendalam melalui halaman detail khusus untuk peninjauan konfigurasi lengkap.

### Keamanan Data dan Privasi

- **Enkripsi File**: Semua dokumen sensitif dan bukti pembayaran disimpan dalam keadaan terenkripsi di sisi server.
- **Proteksi Anti-Spam**: Menggunakan mekanisme sidik jari perangkat (device fingerprinting) untuk memitigasi pendaftaran ganda yang tidak diinginkan.
- **Validasi Ketat**: Implementasi proteksi terhadap serangan XSS dan SQL Injection melalui penggunaan ORM yang aman dan prosedur sanitisasi input.

### Kontrol Akses Berbasis Peran (RBAC)

Mendukung pembagian tugas melalui peran Admin, Panitia, dan Petugas. Akses terhadap data event dan tiket dibatasi sesuai dengan tanggung jawab masing-masing staff yang telah ditetapkan.

### Notifikasi dan Automasi

- **E-Ticket Otomatis**: Peserta akan menerima tiket elektronik dengan QR Code unik segera setelah pendaftaran disetujui.
- **Notifikasi Staff**: Notifikasi otomatis dikirimkan ke email staff operasional saat terdapat pendaftaran baru yang memerlukan peninjauan.
- **Sinkronisasi Real-Time**: Monitoring pendaftaran dan perubahan status secara instan tanpa perlu memuat ulang halaman (Powered by WebSocket).

### Operasional Lapangan

- **Advanced QR Scanner**: Pemindai QR berbasis web yang mendukung pemilihan event spesifik, pencarian event, dan validasi ketat antar event.
- **Peringatan Audio-Visual**: Feedback suara dan visual real-time saat pemindaian berhasil atau gagal (termasuk peringatan salah event).
- **Pemantauan Multi-Day**: Grafik kehadiran yang mendukung event berdurasi panjang dengan akumulasi data per jam yang akurat.

## Teknologi Utama

- **Framework**: Nuxt 3 (Vue.js 3 & Nitro)
- **Real-Time**: WebSocket (Nitro/CrossWS)
- **ORM**: Prisma 7
- **Database**: SQLite (Default)
- **Keamanan**: JWT Authentication, SHA-256 Fingerprinting, AES-256 File Encryption
- **Email**: SMTP integration via Nodemailer

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
3. Lakukan inisialisasi basis data dan generate client Prisma:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

## Konfigurasi

Konfigurasi aplikasi dikelola melalui variabel lingkungan (environment variables). Secara default, aplikasi akan menggunakan SQLite lokal jika `DATABASE_URL` tidak didefinisikan.

Contoh konfigurasi pada file `.env`:

```env
NODE_ENV=production
PORT=1933
```

## Menjalankan Aplikasi

### Pengembangan (Development)

```bash
npm run dev
```

### Produksi (Production)

```bash
npm run build
npm run start
```

Untuk deployment menggunakan PM2, gunakan konfigurasi yang tersedia:

```bash
pm2 start ecosystem.config.cjs --env production
```

## Catatan Keamanan

- Kunci rahasia aplikasi (`APP_SECRET`) dikelola secara internal oleh server.
- Token QR Code bersifat unik per event dan dienkripsi untuk mencegah pemalsuan tiket.
- Seluruh file pendaftar tersimpan secara privat dan hanya dapat diakses melalui endpoint yang telah terautentikasi.

## Lisensi

MIT License — bebas digunakan, dan dimodifikasi untuk keperluan non-komersial
