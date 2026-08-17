# Runbook deploy SIMHAQ ke Vercel

Status persiapan (sudah selesai, tidak perlu diulang):

- [x] Seluruh kode ter-commit di git (`9dfb74b`)
- [x] Skrip pengalih basis data `npm run db:postgres` / `npm run db:sqlite`
- [x] Build jalur PostgreSQL sudah diuji lolos dengan connection string dummy
- [x] `.env` dan `*.db` dipastikan tidak ikut ter-commit
- [x] `serverExternalPackages` disetel agar driver database tidak ikut dibundel

---

## Bagian A — yang perlu Anda kerjakan (butuh login)

### A1. Login Vercel

Jalankan di terminal, lalu selesaikan di browser yang terbuka:

```bash
npx vercel login
```

Verifikasi berhasil:

```bash
npx vercel whoami
```

### A2. Siapkan PostgreSQL

Pilih salah satu penyedia gratis. **Yang dibutuhkan adalah connection string biasa
berawalan `postgresql://`.**

| Penyedia | Cara |
| --- | --- |
| **Neon** (disarankan) | Daftar di [neon.tech](https://neon.tech) → buat project → region `Singapore (ap-southeast-1)` → salin connection string |
| **Supabase** | [supabase.com](https://supabase.com) → Project Settings → Database → **Connection pooling** (port 6543) |
| **Vercel Marketplace** | Dashboard Vercel → Storage → pilih **Neon** atau **Supabase** |

> **Hindari Prisma Postgres / Accelerate** untuk saat ini. Connection string-nya
> berbentuk `prisma+postgres://` dan memerlukan ekstensi Accelerate yang tidak
> dipakai aplikasi ini. Kalau tetap ingin memakainya, ambil connection string
> *direct* PostgreSQL-nya.

### A3. Tulis kredensial ke `.env` (berkas ini tidak ikut ter-commit)

Ganti isi `.env` di folder project menjadi:

```
DATABASE_URL="postgresql://...connection string dari langkah A2..."
AUTH_SECRET="c0384e7ff86cad149508b1c48a1613fa907b3d72a1f134d5c39d0cd908da604d"
ADMIN_LINTAS_GENDER="false"
```

`AUTH_SECRET` di atas sudah dibuat acak khusus untuk deploy ini — boleh dipakai
apa adanya, atau buat baru dengan:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### A4. Kabari saya

Cukup bilang "sudah login" — saya lanjutkan Bagian B. Saya membaca `DATABASE_URL`
langsung dari berkas `.env`, jadi **tidak perlu menempelkan connection string ke
percakapan**.

---

## Bagian B — yang saya kerjakan setelah itu

1. Alihkan skema ke PostgreSQL

   ```bash
   npm run db:postgres
   ```

2. Bangun tabel di database produksi

   ```bash
   npx prisma db push
   ```

3. Isi data awal (82 santri, 11 pengajar, 7 kegiatan, riwayat 28 hari)

   ```bash
   npm run db:seed
   ```

4. Tautkan project ke Vercel

   ```bash
   npx vercel link --yes
   ```

5. Daftarkan environment variable produksi dari `.env`

   ```bash
   npx vercel env add DATABASE_URL production
   ```

   ```bash
   npx vercel env add AUTH_SECRET production
   ```

6. Deploy produksi

   ```bash
   npx vercel deploy --prod
   ```

7. Uji hasil deploy: login tiga peran, buka sesi presensi, pindai QR dari ponsel,
   ajukan dan setujui izin, unduh rekap Excel/PDF.

---

## Setelah berhasil

### Kembali bekerja lokal dengan SQLite

```bash
npm run db:sqlite
```

Lalu kembalikan `DATABASE_URL="file:./dev.db"` pada `.env` dan jalankan
`npm run db:migrate`.

### Memakai subdomain pesantren

Di Vercel: **Settings → Domains** → tambahkan `presensi.ppmmh.site`, lalu buat
catatan `CNAME` ke `cname.vercel-dns.com` pada pengelola DNS `ppmmh.site`.

### Sebelum dipakai sungguhan

- Ganti seluruh nama pengajar dan santri fiktif di `prisma/seed.ts` dengan data
  asli pesantren.
- Atur ulang kata sandi seluruh akun (menu Pengaturan) — kata sandi seed seragam.
- Hapus blok "Akun uji coba" pada halaman login
  (`src/app/login/page.tsx`, konstanta `AKUN_UJI`).
