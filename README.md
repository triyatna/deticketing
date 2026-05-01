# DeTicketing

Sistem ticketing event berbasis Nuxt 3 + Prisma + SQLite, dengan panel admin, form builder, approval tiket, dan QR scanner.

## Stack

- Nuxt 3
- Prisma ORM 7
- SQLite (default)
- SweetAlert2
- PM2 (opsional untuk production)

## Persiapan

Pastikan tersedia:

- Node.js 20+
- npm 10+

## Instalasi

```bash
npm install
```

## Konfigurasi Environment

Project ini tetap bisa jalan meskipun `DATABASE_URL` tidak diisi:

- Jika `DATABASE_URL` kosong, sistem otomatis fallback ke `file:./prisma/dev.db`.
- Folder/file database SQLite akan dibuat otomatis saat `build` / `prisma:generate` / `prisma:push`.

Contoh `.env` minimal:

```env
NODE_ENV=production
PORT=1933
```

## Prisma (Penting)

Gunakan script npm berikut (jangan langsung `npx prisma ...`) agar pre-hook auto create database berjalan:

```bash
npm run prisma:generate
npm run prisma:push
```

## Development

```bash
npm run dev
```

## Build & Run Production

```bash
npm run build
npm run start
```

`start.mjs` default menggunakan port `1933` jika `PORT` tidak di-set.

## Menjalankan dengan PM2

File konfigurasi sudah disediakan:

- [`ecosystem.config.cjs`](/e:/DEV/laragon/www/htdocs/project/ticketing/ecosystem.config.cjs)

Perintah:

```bash
pm2 start ecosystem.config.cjs --env production
pm2 logs ticketing
```

## First Setup Owner

Saat pertama kali dijalankan dan akun owner belum ada:

- buka `/admin/login`
- sistem akan arahkan ke `/admin/setup-owner`
- setelah owner dibuat, halaman setup owner tidak dipakai lagi

## Catatan Keamanan

- `APP_SECRET` dikelola server (auto-generate saat kosong).
- Secret disimpan terenkripsi.
- Secret per-event untuk QR dibuat otomatis saat event baru dibuat.
- Endpoint form publik diberi header no-index.

## Troubleshooting

### Error `Cannot resolve environment variable: DATABASE_URL`

Gunakan:

```bash
npm run prisma:generate
```

bukan:

```bash
npx prisma generate
```

Karena script npm menjalankan pre-hook untuk memastikan file database SQLite sudah dibuat.

### Error Prisma v7 tentang `url` di `schema.prisma`

Project ini memakai Prisma 7. URL datasource dikonfigurasi di `prisma.config.ts`, bukan di `prisma/schema.prisma`.
