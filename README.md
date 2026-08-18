# SIMHAQ — Sistem Presensi & Perizinan Santri

Aplikasi internal **PPM Minhajul Haq** (Pondok Pesantren Mahasiswa Minhajul Haq,
Jl. Bijaksana 2 No. 8, Pasteur, Sukajadi, Kota Bandung) untuk mencatat kehadiran
santri pada kegiatan wajib melalui **QR Code dinamis**, sekaligus mengelola
**perizinan digital**. Keduanya terhubung dalam satu basis data, sehingga izin
yang telah disetujui otomatis tercatat pada rekap kehadiran dan tidak lagi
dihitung sebagai ketidakhadiran tanpa keterangan.

Aplikasi ini **terpisah** dari situs profil pesantren di
[ppmmh.site](https://www.ppmmh.site), namun memakai identitas visual yang sama
(palet hijau `#0a1f0d` / `#064e3b` / `#047857` / `#10b981` / `#34d399`, panel kaca,
tipografi Inter/Poppins).

> **Gagasan pokok:** di pesantren mahasiswa, ketidakhadiran belum tentu
> pelanggaran. Santri yang praktikum sampai malam dan santri yang tidak disiplin
> sama-sama tercatat "tidak hadir" pada buku absen manual. Sistem ini memberi
> pengurus data untuk membedakan keduanya.

---

## 1. Menjalankan di komputer sendiri

Prasyarat: **Node.js 20.9+** (diuji pada Node 25) dan npm.

```bash
npm install
```

```bash
cp .env.example .env
```

Isi `AUTH_SECRET` pada `.env` dengan string acak:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Siapkan basis data dan data contoh:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

Jalankan:

```bash
npm run dev
```

Buka <http://localhost:3000>.

### Akun uji coba

| Peran | Nama pengguna | Kata sandi |
| --- | --- | --- |
| Admin / Pimpinan | `admin` | `admin123` |
| Pimpinan pesantren | `pimpinan` | `admin123` |
| Musyrif putra (Halaqah Al-Fatih) | `hanif` | `musyrif123` |
| Petugas keamanan (pos gerbang) | `satpam` | `petugas123` |
| Musyrifah putri (Halaqah Khadijah) | `aisyah` | `musyrif123` |
| Santri | pola `namaXXX`, mis. `luthfiabdi001` | `santri123` |

Daftar nama pengguna santri selengkapnya ada pada menu **Santri** setelah masuk
sebagai pengurus.

> **Nama pengajar dan santri pada seed adalah data fiktif** untuk keperluan uji
> coba. Data lembaga (alamat, kontak, jumlah santri, daftar kampus asal, program,
> fasilitas) mengikuti situs resmi pesantren. Ganti seluruh data orang dengan data
> asli sebelum dipakai secara nyata.

---

## 2. Ruang lingkup fitur

### Modul A — Presensi kegiatan berbasis QR Code

- Musyrif membuka sesi presensi untuk kegiatan tertentu; layar menampilkan QR
  Code yang isinya berganti otomatis (bawaan 40 detik, dapat diatur 5–60 detik
  per sesi).
- Santri memindai QR dari ponsel masing-masing lewat peramban.
- Status otomatis: **hadir**, **terlambat**, **izin**, **sakit**, atau **tanpa
  keterangan**.
- Sesi menutup sendiri pada waktu yang ditentukan; saat ditutup, peserta yang
  belum tercatat otomatis ditandai tanpa keterangan.
- Presensi manual oleh musyrif sebagai cadangan, lengkap dengan catatan siapa
  yang menginput (terlihat di menu Pengawasan).

**Pengamanan terhadap titip absen**

| Lapis | Cara kerja |
| --- | --- |
| QR dinamis | Isi QR = `idSesi.slot.tandaTangan`. Tanda tangan HMAC-SHA256 memakai rahasia yang dibuat acak per sesi, dan `slot` berganti setiap 40 detik. Verifikasi menerima slot berjalan dan satu slot sebelumnya, sehingga masa berlaku efektif sebuah kode adalah 40–80 detik. |
| Keterikatan perangkat | Satu akun santri terikat pada satu perangkat (id disimpan di peramban). Bila dua akun memindai dari perangkat yang sama, sistem menolak dan menandainya untuk ditinjau pengurus. |
| Jendela waktu | Pemindaian hanya diterima selama sesi berstatus dibuka dan berada di antara waktu buka–tutup. |
| Pembatasan lokasi | Opsional per sesi. Radius diukur dari titik koordinat pesantren memakai rumus haversine. Dimatikan secara bawaan karena akurasi GPS di dalam bangunan tidak selalu stabil. |

Setiap penolakan yang mencurigakan (token kedaluwarsa, perangkat ganda, di luar
radius) dicatat sebagai temuan pada menu **Pengawasan**.

### Modul B — Perizinan digital

- Santri mengajukan izin: jenis (kuliah/praktikum, kegiatan kampus, sakit, pulang
  kampung, keperluan keluarga, lainnya), rentang waktu, tujuan, alasan, dan
  lampiran bukti (JPG/PNG/WebP/PDF, maks. 2 MB).
- Alur status: **diajukan → diproses → disetujui/ditolak → selesai**.
- Musyrif menyetujui atau menolak dari ponsel, dengan catatan untuk santri.
- Izin yang disetujui **otomatis menutup seluruh sesi presensi pada rentang
  waktunya** — termasuk sesi yang sudah berlalu — tanpa menimpa kehadiran yang
  benar-benar terjadi.
- **Kartu izin digital** berupa QR yang berguna dua arah:
  - **Saat keluar** — petugas memindainya untuk memeriksa keabsahan izin.
    Halaman `/verifikasi/<kode>` terbuka tanpa perlu akun.
  - **Saat kembali** — petugas yang sudah masuk memindai kartu yang sama, lalu
    menekan "Tandai sudah kembali". Santri tidak perlu memindai apa pun.
- Izin yang lewat batas dan belum dikonfirmasi muncul sebagai **daftar tugas**
  di halaman Pengawasan, bukan sebagai pelanggaran — belum dikonfirmasi belum
  tentu terlambat. Temuan pelanggaran baru dibuat bila ada yang mengonfirmasi
  kepulangan setelah batas waktu.

### Modul C — Rekapitulasi dan pelaporan

- Dasbor persentase kehadiran per santri, per halaqah, dan per jenis kegiatan.
- Grafik tren kehadiran harian (30 hari) dan bulanan (6 bulan).
- Daftar santri dengan kehadiran di bawah ambang tertentu sebagai prioritas
  pembinaan (bawaan 75%, dapat diubah di Pengaturan).
- Unduhan rekap **Excel** (4 lembar: ringkasan, per santri, per halaqah, per
  kegiatan) dan **PDF** berkop pesantren.

### Pengguna dan hak akses

| Pengguna | Kewenangan |
| --- | --- |
| Santri | Memindai QR, mengajukan izin beserta lampiran, melihat rekap kehadiran pribadi. |
| Musyrif / Musyrifah | Membuka & menutup sesi, menyetujui/menolak izin, presensi manual, melihat rekap santri binaan. |
| Admin / Pimpinan | Data induk santri, kamar, kegiatan & jadwal; dasbor keseluruhan; unduh laporan; pengaturan sistem. |
| Petugas Keamanan | Memeriksa kartu izin di gerbang dan mencatat kepulangan santri. Hak paling sempit di sistem: tidak dapat membuka data santri, rekap kehadiran, sesi presensi, maupun alasan dan lampiran izin. |
| Wali santri | Melihat rekap kehadiran anaknya lewat tautan bertoken `/wali/<token>`, tanpa perlu membuat akun. |

Hak akses dipisahkan berdasarkan gender sesuai kebijakan hijab pesantren:
pengurus putra hanya dapat mengakses data santri putra, demikian pula sebaliknya.
Petugas keamanan dikecualikan karena menjaga satu pintu untuk seluruh santri —
sebagai gantinya, data yang ditampilkan kepadanya dibatasi seminimal mungkin:
nama, jenis izin, dan batas waktu kembali saja.
Untuk membuka akses lintas gender bagi admin, setel `ADMIN_LINTAS_GENDER="true"`
pada `.env`.

---

## 3. Teknologi

| Komponen | Pilihan | Alasan |
| --- | --- | --- |
| Antarmuka | Next.js 16 (App Router) + React 19 + Tailwind CSS 4 | Selaras dengan situs pesantren yang sudah berjalan. |
| Basis data | SQLite (lokal) / PostgreSQL (produksi) via Prisma 7 | Gratis pada layanan terkelola, cukup untuk skala 82 santri. |
| Bentuk aplikasi | Progressive Web App | Cukup dibuka lewat peramban, tanpa unduh dari toko aplikasi. |
| Pemindai QR | `html5-qrcode` (kamera peramban) | Memakai kamera ponsel langsung dari halaman web. |
| Grafik | Recharts | Grafik tren dan komposisi kehadiran. |
| Laporan | ExcelJS + jsPDF | Unduhan rekap untuk rapat dan arsip. |

Skema Prisma sengaja **tidak memakai `enum` maupun tipe array**, sehingga file
yang sama berlaku untuk SQLite dan PostgreSQL. Nilai "enum" didefinisikan sebagai
konstanta TypeScript di [`src/lib/constants.ts`](src/lib/constants.ts).

### Struktur berkas penting

```
prisma/schema.prisma          skema basis data
prisma/seed.ts                data contoh (82 santri, 11 pengajar, 7 kegiatan)
src/proxy.ts                  pemeriksaan sesi awal (pengganti middleware di Next 16)
src/lib/qr-token.ts           pembuatan & verifikasi token QR dinamis + haversine
src/lib/presensi.ts           penerapan izin ke sesi, penandaan alfa, penutupan otomatis
src/lib/rekap.ts              seluruh agregasi untuk dasbor dan laporan
src/lib/auth.ts               sesi, peran, pembatasan gender, log audit
src/app/(app)/                halaman yang memerlukan login
src/app/verifikasi/[kode]/    verifikasi kartu izin (publik)
src/app/wali/[token]/         rekap untuk wali santri (publik, bertoken)
src/app/api/laporan/          unduhan Excel & PDF
src/app/api/sesi/[id]/token/  token QR aktif untuk layar presensi
```

---

## 4. Deploy gratis (Vercel + Neon)

Kombinasi ini gratis untuk skala pesantren: Vercel Hobby untuk aplikasi, Neon
Free untuk PostgreSQL. Keduanya menyediakan HTTPS otomatis — **wajib**, karena
kamera peramban hanya dapat diakses lewat HTTPS.

### a. Siapkan basis data

1. Daftar di [neon.tech](https://neon.tech), buat project baru (region terdekat:
   Singapore).
2. Salin connection string, bentuknya
   `postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.

### b. Ubah provider Prisma ke PostgreSQL

Pada `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}
```

Migrasi bawaan repositori ini ditulis untuk SQLite, jadi hapus dulu foldernya
lalu buat skema langsung di PostgreSQL:

```bash
rm -rf prisma/migrations
```

```bash
DATABASE_URL="postgresql://..." npx prisma db push
```

```bash
DATABASE_URL="postgresql://..." npm run db:seed
```

Pada PowerShell, setel dulu variabelnya: `$env:DATABASE_URL = "postgresql://..."`.

### c. Unggah ke GitHub

```bash
git add -A && git commit -m "SIMHAQ: sistem presensi & perizinan santri"
```

```bash
git remote add origin https://github.com/<akun>/simhaq.git && git push -u origin main
```

### d. Deploy di Vercel

1. Masuk ke [vercel.com](https://vercel.com) dengan akun GitHub, pilih **Add New
   → Project**, impor repositori ini.
2. Framework terdeteksi otomatis sebagai Next.js — biarkan pengaturan bawaan.
3. Tambahkan **Environment Variables**:

   | Nama | Nilai |
   | --- | --- |
   | `DATABASE_URL` | connection string Neon |
   | `AUTH_SECRET` | string acak 64 karakter |
   | `ADMIN_LINTAS_GENDER` | `false` |

4. Klik **Deploy**. Aplikasi akan tersedia di `https://<nama>.vercel.app`.

Untuk memakai subdomain pesantren (mis. `presensi.ppmmh.site`), tambahkan domain
di **Settings → Domains** pada Vercel, lalu buat catatan `CNAME` yang mengarah ke
`cname.vercel-dns.com` pada pengelola DNS `ppmmh.site`.

### Alternatif gratis lain

- **Railway / Render** — mendukung Next.js dan PostgreSQL, tetapi kuota gratisnya
  lebih terbatas.
- **Supabase** sebagai pengganti Neon untuk PostgreSQL (`DATABASE_URL` memakai
  connection pooler port 6543).

---

## 5. Catatan operasional

- **HTTPS wajib.** Pemindaian QR memakai `getUserMedia`, yang hanya tersedia pada
  `https://` atau `http://localhost`.
- **Zona waktu.** Perhitungan batas terlambat, rentang "hari ini", dan
  pengelompokan rekap harian memakai waktu lokal server. Runtime hosting umumnya
  berjalan pada UTC, jadi zona waktu disetel ke Asia/Jakarta lewat
  [`src/instrumentation.ts`](src/instrumentation.ts) — Vercel tidak mengizinkan
  variabel lingkungan bernama `TZ` karena nama itu dicadangkan. Untuk zona lain,
  setel `ZONA_WAKTU`.
- **Jaringan lemah.** Pemindaian yang gagal terkirim disimpan sementara di
  perangkat (localStorage) dan dikirim ulang otomatis setelah jaringan pulih.
- **Ganti ponsel.** Santri dapat melepas keterikatan perangkatnya sendiri dari
  menu Profil; musyrif juga dapat melepasnya dari halaman detail santri. Setiap
  pelepasan tercatat pada log audit.
- **Kata sandi awal.** Seluruh akun seed memakai kata sandi yang sama. Ganti
  melalui menu Profil, atau atur ulang massal dari menu Pengaturan sebelum
  aplikasi dipakai sungguhan.
- **Peringatan npm audit.** `exceljs` membawa `uuid` versi lama dengan advisory
  moderat yang hanya berlaku pada pemakaian `uuid` v3/v5/v6 dengan parameter
  buffer — jalur kode itu tidak dipakai aplikasi ini.

---

## 6. Di luar ruang lingkup tahap ini

Sesuai dokumen konsep, hal berikut belum termasuk dan dapat menjadi pengembangan
lanjutan: administrasi keuangan dan syahriah, penilaian hafalan Al-Qur'an,
pendaftaran santri baru, aplikasi Android/iOS native, serta perangkat biometrik
(sidik jari dan pengenalan wajah).

---

## 7. Perintah yang tersedia

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Jalankan server pengembangan |
| `npm run build` | Build produksi (menjalankan `prisma generate` lebih dulu) |
| `npm start` | Jalankan hasil build |
| `npm run lint` | Periksa gaya kode |
| `npm run db:migrate` | Buat & terapkan migrasi (SQLite lokal) |
| `npm run db:push` | Sinkronkan skema tanpa migrasi (dipakai untuk PostgreSQL) |
| `npm run db:seed` | Isi data contoh |
| `npm run db:studio` | Buka Prisma Studio untuk melihat isi basis data |
| `npm run db:reset` | Kosongkan dan bangun ulang basis data |
