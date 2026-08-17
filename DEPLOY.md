# Deploy SIMHAQ — status & runbook

## Sudah tayang

| | |
| --- | --- |
| **URL** | <https://simhaq.vercel.app> |
| Project Vercel | `eedijunaediis-projects/simhaq` |
| Dashboard | <https://vercel.com/eedijunaediis-projects/simhaq> |
| Basis data | Neon PostgreSQL, region `ap-southeast-1` (Singapura) |
| Isi database | 82 santri · 11 pengajar · 7 kegiatan · 316 sesi · 7.052 presensi · 55 izin |

### Environment variable produksi

| Nama | Keterangan |
| --- | --- |
| `DATABASE_URL` | Connection string Neon, memakai `sslmode=verify-full` |
| `AUTH_SECRET` | Kunci penandatanganan sesi (64 karakter heksadesimal) |
| `ADMIN_LINTAS_GENDER` | `false` |

Zona waktu **tidak** disetel lewat environment variable — Vercel mencadangkan
nama `TZ`. Nilainya ditetapkan di `src/instrumentation.ts`, dengan override
lewat `ZONA_WAKTU`.

### Hasil pengujian di produksi

| Uji | Hasil |
| --- | --- |
| Landing page, login, manifest PWA | 200 |
| Login admin → dasbor dengan data Neon | 45 santri putra, kehadiran 84,9% |
| Buka sesi presensi | QR dinamis tergambar, rotasi 12 detik |
| API token QR | 200, token terbit, `sisaMs` menghitung mundur |
| Pindai QR sebagai santri | "kehadiran Anda tercatat", perangkat terikat |
| Batas terlambat (jadwal 19.30 + toleransi 15 menit) | 19.45 WIB — benar |
| Unduh Excel | 200, `PK..`, 12 KB |
| Unduh PDF | 200, `%PDF-`, 126 KB |
| Seluruh halaman pengurus | 200 |

Data uji (sesi percobaan, keterikatan perangkat, flag pengawasan) sudah
dibersihkan kembali setelah pengujian.

---

## Yang masih perlu Anda kerjakan

### 1. Rotasi kata sandi Neon — disarankan segera

Connection string sempat dikirim lewat percakapan, jadi sebaiknya diganti.

1. Neon → project → **Roles** → `neondb_owner` → **Reset password**
2. Salin connection string baru, tambahkan `?sslmode=verify-full` di akhir
3. Perbarui:

```bash
npx vercel env rm DATABASE_URL production --yes
```

```bash
npx vercel env add DATABASE_URL production
```

```bash
npx vercel deploy --prod
```

Jangan lupa perbarui juga `.env` lokal.

### 2. Sebelum dipakai sungguhan oleh pesantren

- Ganti seluruh nama pengajar dan santri fiktif di `prisma/seed.ts` dengan data
  asli, atau input lewat aplikasi.
- Atur ulang kata sandi seluruh akun — kata sandi seed masih seragam
  (`admin123` / `musyrif123` / `santri123`).
- Hapus blok "Akun uji coba" pada halaman login: konstanta `AKUN_UJI` di
  `src/app/login/page.tsx`.
- Pertimbangkan mengaktifkan **Deployment Protection** di Vercel selama masa uji
  coba, agar URL tidak terbuka untuk umum.

### 3. Subdomain pesantren (opsional)

Vercel → **Settings → Domains** → tambahkan `presensi.ppmmh.site`, lalu buat
catatan `CNAME` ke `cname.vercel-dns.com` pada pengelola DNS `ppmmh.site`.

---

## Perintah yang sering dipakai

| Kebutuhan | Perintah |
| --- | --- |
| Deploy ulang setelah mengubah kode | `npx vercel deploy --prod` |
| Lihat log runtime | `npx vercel logs https://simhaq.vercel.app` |
| Lihat environment variable | `npx vercel env ls production` |
| Terapkan perubahan skema ke Neon | `npx prisma db push` |
| Isi ulang data contoh | `npm run db:seed` |

## Kembali bekerja lokal dengan SQLite

```bash
npm run db:sqlite
```

Lalu kembalikan `DATABASE_URL="file:./dev.db"` pada `.env` dan jalankan
`npm run db:migrate`. Untuk kembali ke PostgreSQL: `npm run db:postgres`.
Kedua skrip menjalankan `prisma generate` sendiri.
