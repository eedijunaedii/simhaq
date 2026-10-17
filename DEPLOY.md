# Deploy SIMHAQ — status & runbook

## Sudah tayang

| | |
| --- | --- |
| **URL** | <https://simhaq-ppmmh.vercel.app> |
| Alias lama | <https://simhaq-redesain.vercel.app> masih aktif dan menunjuk ke deployment yang sama |
| Project Vercel | `eedijunaediis-projects/simhaq-ppmmh` |
| Dashboard | <https://vercel.com/eedijunaediis-projects/simhaq-ppmmh> |
| Basis data | Neon PostgreSQL, region `ap-southeast-1` (Singapura) |
| Region fungsi | `sin1` (Singapura), disetel di `vercel.json` agar sejalur dengan basis data |
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

## Rotasi kata sandi basis data

Peran `neondb_owner` dipakai bersama oleh basis data produksi (`neondb`) dan
basis data pengujian (`simhaq_test`) pada endpoint yang sama. Satu rotasi
memutus keduanya sekaligus, jadi ketiga tempat di bawah harus diperbarui.

Selama jeda antara rotasi dan pembaruan env Vercel, produksi tidak bisa
mengakses basis data. Kerjakan berurutan tanpa jeda panjang.

**1. Rotasi di Neon.** Dasbor Neon → proyek **SIMHAQ** → **Roles** →
`neondb_owner` → **Reset password**. Salin kata sandi barunya.

**2. Susun kembali kedua string koneksi.** Hanya bagian kata sandi yang
berubah; sisanya tetap:

```
postgresql://neondb_owner:<SANDI-BARU>@ep-autumn-bird-b3j7z9xo.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full
postgresql://neondb_owner:<SANDI-BARU>@ep-autumn-bird-b3j7z9xo.c-4.ap-southeast-1.aws.neon.tech/simhaq_test?sslmode=verify-full
```

Kalau kata sandi mengandung `@`, `/`, `:`, `?`, `#` atau `%`, karakter itu
harus di-percent-encode (`@` → `%40`, `/` → `%2F`, `:` → `%3A`, `?` → `%3F`,
`#` → `%23`, `%` → `%25`). Paling aman: minta Neon membuat ulang sampai
sandinya hanya huruf dan angka.

**3. Perbarui tiga tempat.**

| Tempat | Nilai |
| --- | --- |
| `.env` | string `neondb` |
| `.env.test` | string `simhaq_test` |
| Vercel → Settings → Environment Variables → `DATABASE_URL` (Production) | string `neondb` |

Untuk Vercel bisa juga lewat CLI:

```
npx vercel env rm DATABASE_URL production
npx vercel env add DATABASE_URL production
```

**4. Verifikasi lokal.**

```
npm run cek:db
```

Keduanya harus `OK`. Kalau muncul "kata sandi ditolak", berkas itu belum
diperbarui atau sandinya perlu di-percent-encode.

**5. Deploy ulang.** Mengubah environment variable di Vercel tidak otomatis
menerapkannya ke deployment yang sedang berjalan:

```
npx vercel deploy --prod
```

**6. Verifikasi produksi.** Halaman berikut melakukan kueri basis data, jadi
harus membalas 200 dan menampilkan pesan "Tautan tidak berlaku", bukan galat:

```
curl -sS -o NUL -w "%{http_code}
" https://simhaq-ppmmh.vercel.app/wali/abc
```

**7. Jalankan ulang e2e** untuk memastikan basis data pengujian ikut pulih:

```
npm run test:e2e
```

## Catatan domain

Mengganti nama proyek di Vercel **tidak** ikut memindahkan domain `.vercel.app`-nya.
Setelah rename, `simhaq-ppmmh.vercel.app` harus didaftarkan sebagai domain proyek
(`vercel domains add simhaq-ppmmh.vercel.app simhaq-ppmmh`). Memasangnya sebagai
alias biasa saja tidak cukup: proteksi SSO proyek berlaku untuk semua URL kecuali
domain proyek, sehingga alias polos akan dialihkan ke halaman login Vercel.

`simhaq.vercel.app` bukan milik proyek ini — itu proyek `simhaq` lama yang terpisah.

## Perintah yang sering dipakai

| Kebutuhan | Perintah |
| --- | --- |
| Deploy ulang setelah mengubah kode | `npx vercel deploy --prod` |
| Lihat log runtime | `npx vercel logs https://simhaq-ppmmh.vercel.app` |
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
