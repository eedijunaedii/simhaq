/**
 * Seed data contoh untuk SIMHAQ.
 *
 * Data lembaga (nama, alamat, jumlah santri, daftar kampus, program, fasilitas)
 * mengikuti situs resmi https://www.ppmmh.site. Nama pengajar dan santri
 * sengaja dibuat fiktif sebagai data uji, dan harus diganti dengan data asli
 * pesantren sebelum dipakai secara nyata.
 *
 * Jalankan: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const pakaiPostgres = /^postgres(ql)?:\/\//i.test(url);

const adapter = pakaiPostgres
  ? new PrismaPg({ connectionString: url })
  : new PrismaBetterSqlite3({ url });

const prisma = new PrismaClient({ adapter });

// --- Acak yang dapat direproduksi -----------------------------------------

let benih = 20260817;
function acak() {
  benih |= 0;
  benih = (benih + 0x6d2b79f5) | 0;
  let t = Math.imul(benih ^ (benih >>> 15), 1 | benih);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const acakInt = (min: number, maks: number) => min + Math.floor(acak() * (maks - min + 1));
const pilih = <T,>(arr: readonly T[]) => arr[Math.floor(acak() * arr.length)];

// --- Kumpulan nama fiktif -------------------------------------------------

const DEPAN_PUTRA = [
  "Ahmad", "Muhammad", "Abdul", "Fauzan", "Rizky", "Hanif", "Ilham", "Yusuf",
  "Ridwan", "Farhan", "Zaki", "Naufal", "Aditya", "Bagas", "Dimas", "Iqbal",
  "Raihan", "Syahrul", "Taufik", "Umar", "Wildan", "Zulfikar", "Arif", "Bayu",
  "Candra", "Dzaki", "Fikri", "Galih", "Hafiz", "Irfan", "Luthfi", "Rafi",
];
const BELAKANG_PUTRA = [
  "Nugroho", "Ramadhan", "Saputra", "Hidayat", "Maulana", "Firdaus", "Kurniawan",
  "Wibowo", "Pratama", "Setiawan", "Anwar", "Fadhilah", "Gunawan", "Hakim",
  "Jauhari", "Kamil", "Mubarak", "Nashiruddin", "Prasetyo", "Rahman", "Siregar",
  "Utomo", "Wijaya", "Yudistira", "Zamzami", "Abdillah", "Baihaqi", "Cahyadi",
];
const DEPAN_PUTRI = [
  "Aisyah", "Fatimah", "Khadijah", "Zahra", "Nabila", "Salsabila", "Hafshah",
  "Maryam", "Aulia", "Nadia", "Rania", "Syifa", "Tsabita", "Wafa", "Yasmin",
  "Zahwa", "Alifa", "Citra", "Dinda", "Farah", "Ghina", "Husna", "Intan",
  "Jihan", "Karima", "Laila", "Mutiara", "Naila", "Qonita", "Rahma",
];
const BELAKANG_PUTRI = [
  "Azzahra", "Nurhaliza", "Rahmawati", "Kusuma", "Anggraini", "Fitriani",
  "Hasanah", "Jamilah", "Khairunnisa", "Lestari", "Maulida", "Nafisah",
  "Oktaviani", "Permata", "Ramadhani", "Safitri", "Tsuraya", "Utami",
  "Wulandari", "Yulianti", "Zulaikha", "Amalia", "Cahyani", "Dewanti",
];

const KAMPUS_JURUSAN: Record<string, string[]> = {
  ITB: ["Teknik Informatika", "Teknik Elektro", "Teknik Kimia", "Matematika"],
  UPI: ["Pendidikan Matematika", "Pendidikan Bahasa Arab", "Ilmu Komputer"],
  POLMAN: ["Teknik Manufaktur", "Teknik Perancangan Mekanik"],
  POLBAN: ["Teknik Informatika", "Akuntansi", "Teknik Sipil"],
  POLTEKKES: ["Keperawatan", "Gizi", "Kebidanan"],
  POLTEKESOS: ["Pekerjaan Sosial", "Rehabilitasi Sosial"],
  STTT: ["Teknik Tekstil", "Kimia Tekstil"],
  UNPAS: ["Manajemen", "Ilmu Hukum", "Teknik Industri"],
  UNISBA: ["Ilmu Komunikasi", "Syariah", "Psikologi"],
  ULBI: ["Logistik Bisnis", "Sistem Informasi"],
  ITENAS: ["Teknik Arsitektur", "Teknik Informatika"],
  UNIKOM: ["Teknik Informatika", "Sistem Informasi", "Desain Komunikasi Visual"],
  "USB YPKP": ["Akuntansi", "Manajemen"],
  UT: ["Manajemen", "Pendidikan Agama Islam"],
};
const DAFTAR_KAMPUS = Object.keys(KAMPUS_JURUSAN);

const DAERAH = [
  "Bandung", "Garut", "Tasikmalaya", "Cirebon", "Bekasi", "Bogor", "Sukabumi",
  "Karawang", "Jakarta", "Cimahi", "Sumedang", "Indramayu", "Subang", "Kuningan",
  "Purwakarta", "Banjar", "Ciamis", "Majalengka", "Serang", "Palembang",
  "Lampung", "Medan", "Padang", "Surabaya", "Semarang", "Yogyakarta",
];

// --- Utilitas -------------------------------------------------------------

function slugUsername(nama: string, urut: number) {
  const dasar = nama.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10);
  return `${dasar}${String(urut).padStart(3, "0")}`;
}

function tambahHari(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function padukanJam(tanggal: Date, jam: string) {
  const [h, m] = jam.split(":").map(Number);
  const x = new Date(tanggal);
  x.setHours(h, m, 0, 0);
  return x;
}

// --- Definisi data induk --------------------------------------------------

const GEDUNG = [
  { nama: "Asrama Al-Faruq", gender: "PUTRA", kamar: ["A-1", "A-2", "A-3", "A-4", "A-5", "A-6"] },
  { nama: "Asrama Ibnu Sina", gender: "PUTRA", kamar: ["B-1", "B-2", "B-3", "B-4", "B-5"] },
  { nama: "Asrama Khadijah", gender: "PUTRI", kamar: ["C-1", "C-2", "C-3", "C-4", "C-5"] },
  { nama: "Asrama Hafshah", gender: "PUTRI", kamar: ["D-1", "D-2", "D-3", "D-4"] },
  { nama: "Asrama Aisyah", gender: "PUTRI", kamar: ["E-1", "E-2", "E-3"] },
];

const PENGAJAR = [
  { nama: "K.H. Abdurrahman Fauzi", gelar: "Lc., M.A.", jabatan: "Pimpinan", bidang: "Tafsir & Ushul Fiqih", gender: "PUTRA", dewanGuru: true, role: "ADMIN", username: "pimpinan" },
  { nama: "Ustadz Muhammad Syakir", gelar: "Lc.", jabatan: "Dewan Guru", bidang: "Hadits & Sirah", gender: "PUTRA", dewanGuru: true, role: "MUSYRIF", username: "syakir" },
  { nama: "Ustadz Abdul Hakim Nasution", gelar: "S.Pd.I., M.Pd.", jabatan: "Dewan Guru", bidang: "Bahasa Arab", gender: "PUTRA", dewanGuru: true, role: "MUSYRIF", username: "hakim" },
  { nama: "Ustadz Ridwan Al-Bantani", gelar: "S.Ag.", jabatan: "Dewan Guru", bidang: "Fiqih Ibadah", gender: "PUTRA", dewanGuru: true, role: "MUSYRIF", username: "ridwan" },
  { nama: "Ustadz Hanif Mustaqim", gelar: "S.H.", jabatan: "Dewan Guru", bidang: "Tahsin & Tahfizh", gender: "PUTRA", dewanGuru: true, role: "MUSYRIF", username: "hanif" },
  { nama: "Ustadzah Aisyah Nurhalimah", gelar: "S.Pd.", jabatan: "Dewan Guru", bidang: "Tahsin & Tahfizh", gender: "PUTRI", dewanGuru: true, role: "MUSYRIF", username: "aisyah" },
  { nama: "Ustadzah Fatimah Az-Zahra", gelar: "Lc.", jabatan: "Dewan Guru", bidang: "Akhlak & Fiqih Nisa", gender: "PUTRI", dewanGuru: true, role: "MUSYRIF", username: "fatimah" },
  // Musyrif/musyrifah pendamping harian (bukan dewan guru)
  { nama: "Ustadz Naufal Ihsan", gelar: null, jabatan: "Musyrif", bidang: "Kepengasuhan Putra", gender: "PUTRA", dewanGuru: false, role: "MUSYRIF", username: "naufal" },
  { nama: "Ustadz Rafi Baihaqi", gelar: null, jabatan: "Musyrif", bidang: "Kepengasuhan Putra", gender: "PUTRA", dewanGuru: false, role: "MUSYRIF", username: "rafi" },
  { nama: "Ustadzah Salsabila Hanun", gelar: null, jabatan: "Musyrifah", bidang: "Kepengasuhan Putri", gender: "PUTRI", dewanGuru: false, role: "MUSYRIF", username: "salsabila" },
  { nama: "Ustadzah Khadijah Mumtaz", gelar: null, jabatan: "Musyrifah", bidang: "Kepengasuhan Putri", gender: "PUTRI", dewanGuru: false, role: "MUSYRIF", username: "khadijah" },
];

const HALAQAH = [
  { nama: "Halaqah Al-Fatih", gender: "PUTRA", musyrif: "hanif" },
  { nama: "Halaqah Al-Faruq", gender: "PUTRA", musyrif: "naufal" },
  { nama: "Halaqah Ibnu Sina", gender: "PUTRA", musyrif: "rafi" },
  { nama: "Halaqah Al-Ghazali", gender: "PUTRA", musyrif: "ridwan" },
  { nama: "Halaqah Khadijah", gender: "PUTRI", musyrif: "aisyah" },
  { nama: "Halaqah Hafshah", gender: "PUTRI", musyrif: "salsabila" },
  { nama: "Halaqah Ummu Salamah", gender: "PUTRI", musyrif: "khadijah" },
  { nama: "Halaqah Sumayyah", gender: "PUTRI", musyrif: "fatimah" },
];

type DefKegiatan = {
  kode: string;
  nama: string;
  kategori: string;
  gender: string;
  deskripsi: string;
  toleransi: number;
  pengampu: string | null;
  perHalaqah?: boolean;
  jadwal: { hari: number[]; jamMulai: string; jamSelesai: string; lokasi: string };
};

const KEGIATAN: DefKegiatan[] = [
  {
    kode: "SUBUH",
    nama: "Kajian Ba'da Subuh",
    kategori: "HARIAN",
    gender: "SEMUA",
    deskripsi: "Kajian Al-Qur'an dan Al-Hadits setiap pagi setelah shalat Subuh berjamaah.",
    toleransi: 10,
    pengampu: "syakir",
    jadwal: { hari: [0, 1, 2, 3, 4, 5, 6], jamMulai: "04:45", jamSelesai: "05:45", lokasi: "Masjid PPM Minhajul Haq" },
  },
  {
    kode: "TAHSIN",
    nama: "Halaqah Tahsin & Tahfizh",
    kategori: "HARIAN",
    gender: "SEMUA",
    deskripsi: "Setoran hafalan dan perbaikan bacaan bersama musyrif halaqah masing-masing.",
    toleransi: 10,
    pengampu: "hanif",
    perHalaqah: true,
    jadwal: { hari: [0, 1, 2, 3, 4, 6], jamMulai: "18:15", jamSelesai: "19:00", lokasi: "Ruang kelas halaqah" },
  },
  {
    kode: "ISYA",
    nama: "Kajian Ba'da Isya",
    kategori: "HARIAN",
    gender: "SEMUA",
    deskripsi: "Kajian kitab bersama dewan guru setelah shalat Isya berjamaah.",
    toleransi: 15,
    pengampu: "hakim",
    jadwal: { hari: [0, 1, 2, 3, 6], jamMulai: "19:30", jamSelesai: "20:30", lokasi: "Masjid PPM Minhajul Haq" },
  },
  {
    kode: "AHAD",
    nama: "Kajian Ahad Pagi",
    kategori: "MINGGUAN",
    gender: "SEMUA",
    deskripsi: "Kajian umum pekanan bersama pimpinan pesantren.",
    toleransi: 15,
    pengampu: "pimpinan",
    jadwal: { hari: [0], jamMulai: "07:00", jamSelesai: "09:00", lokasi: "Aula Utama" },
  },
  {
    kode: "MUHADHARAH",
    nama: "Muhadharah / Latihan Dakwah",
    kategori: "MINGGUAN",
    gender: "SEMUA",
    deskripsi: "Latihan khitabah dan dakwah untuk membentuk mubaligh yang sarjana.",
    toleransi: 10,
    pengampu: "ridwan",
    jadwal: { hari: [6], jamMulai: "20:00", jamSelesai: "21:30", lokasi: "Aula Utama" },
  },
  {
    kode: "RIAYAH",
    nama: "Ri'ayah & Kerja Bakti",
    kategori: "MINGGUAN",
    gender: "SEMUA",
    deskripsi: "Perawatan lingkungan asrama dan masjid bersama seluruh santri.",
    toleransi: 20,
    pengampu: null,
    jadwal: { hari: [5], jamMulai: "16:00", jamSelesai: "17:00", lokasi: "Area Pesantren" },
  },
  {
    kode: "MABIT",
    nama: "Mabit & Qiyamul Lail",
    kategori: "BULANAN",
    gender: "SEMUA",
    deskripsi: "Malam bina iman dan taqwa, diadakan sebulan sekali.",
    toleransi: 20,
    pengampu: "pimpinan",
    jadwal: { hari: [4], jamMulai: "21:00", jamSelesai: "23:00", lokasi: "Masjid PPM Minhajul Haq" },
  },
];

const ALASAN_IZIN: Record<string, string[]> = {
  KULIAH: [
    "Praktikum di laboratorium kampus sampai malam.",
    "Kuliah pengganti pada jam kegiatan pesantren.",
    "Responsi dan asistensi tugas besar di kampus.",
    "Jadwal ujian praktik sampai lewat maghrib.",
  ],
  KEGIATAN_KAMPUS: [
    "Kepanitiaan acara himpunan jurusan.",
    "Latihan untuk lomba tingkat nasional.",
    "Rapat organisasi kemahasiswaan.",
    "Studi ekskursi bersama program studi.",
  ],
  SAKIT: [
    "Demam dan istirahat di kamar.",
    "Sakit maag, sudah diperiksa ke klinik.",
    "Kontrol ke dokter di rumah sakit.",
  ],
  PULANG: [
    "Pulang ke rumah orang tua akhir pekan.",
    "Menghadiri acara keluarga di kampung halaman.",
  ],
  KELUARGA: [
    "Menjenguk keluarga yang sedang dirawat.",
    "Menghadiri pernikahan saudara.",
    "Dijemput orang tua untuk keperluan keluarga.",
  ],
  LAINNYA: ["Mengurus administrasi kependudukan.", "Keperluan mendesak di luar pesantren."],
};

// --- Proses seed ----------------------------------------------------------

async function bersihkan() {
  await prisma.auditLog.deleteMany();
  await prisma.flagPelanggaran.deleteMany();
  await prisma.presensi.deleteMany();
  await prisma.lampiranIzin.deleteMany();
  await prisma.izin.deleteMany();
  await prisma.sesiPresensi.deleteMany();
  await prisma.jadwalKegiatan.deleteMany();
  await prisma.kegiatan.deleteMany();
  await prisma.waliToken.deleteMany();
  await prisma.profilSantri.deleteMany();
  await prisma.profilPengajar.deleteMany();
  await prisma.halaqah.deleteMany();
  await prisma.kamar.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pengaturanSistem.deleteMany();
}

async function main() {
  console.log("Membersihkan data lama...");
  await bersihkan();

  const sandiAdmin = await bcrypt.hash("admin123", 10);
  const sandiMusyrif = await bcrypt.hash("musyrif123", 10);
  const sandiSantri = await bcrypt.hash("santri123", 10);

  // 1. Admin sistem -------------------------------------------------------
  console.log("Membuat akun pengurus...");
  const admin = await prisma.user.create({
    data: {
      nama: "Administrator SIMHAQ",
      username: "admin",
      passwordHash: sandiAdmin,
      role: "ADMIN",
      gender: "PUTRA",
      email: "ppmminhajulhaq@gmail.com",
      telepon: "+62 878-8982-7126",
    },
  });

  // 2. Pengajar & musyrif -------------------------------------------------
  const userPengajar: Record<string, { userId: string; pengajarId: string }> = {};
  for (const p of PENGAJAR) {
    const u = await prisma.user.create({
      data: {
        nama: p.nama,
        username: p.username,
        passwordHash: p.role === "ADMIN" ? sandiAdmin : sandiMusyrif,
        role: p.role,
        gender: p.gender,
        email: `${p.username}@ppmmh.site`,
      },
    });
    const prof = await prisma.profilPengajar.create({
      data: {
        userId: u.id,
        gelar: p.gelar,
        jabatan: p.jabatan,
        bidang: p.bidang,
        dewanGuru: p.dewanGuru,
      },
    });
    userPengajar[p.username] = { userId: u.id, pengajarId: prof.id };
  }

  // 3. Kamar --------------------------------------------------------------
  console.log("Membuat kamar & halaqah...");
  const kamarPutra: string[] = [];
  const kamarPutri: string[] = [];
  for (const g of GEDUNG) {
    for (const [i, nama] of g.kamar.entries()) {
      const k = await prisma.kamar.create({
        data: {
          nama,
          gedung: g.nama,
          gender: g.gender,
          kapasitas: 8,
          lantai: Math.floor(i / 3) + 1,
        },
      });
      (g.gender === "PUTRA" ? kamarPutra : kamarPutri).push(k.id);
    }
  }

  // 4. Halaqah ------------------------------------------------------------
  const halaqahRows: { id: string; nama: string; gender: string; musyrif: string }[] = [];
  for (const h of HALAQAH) {
    const row = await prisma.halaqah.create({
      data: {
        nama: h.nama,
        gender: h.gender,
        musyrifId: userPengajar[h.musyrif].userId,
        deskripsi: `Kelompok binaan ${h.nama} di bawah bimbingan ${
          PENGAJAR.find((p) => p.username === h.musyrif)?.nama
        }.`,
      },
    });
    halaqahRows.push({ id: row.id, nama: h.nama, gender: h.gender, musyrif: h.musyrif });
  }
  const halaqahPutra = halaqahRows.filter((h) => h.gender === "PUTRA").map((h) => h.id);
  const halaqahPutri = halaqahRows.filter((h) => h.gender === "PUTRI").map((h) => h.id);

  // 5. Santri (82 orang: 45 putra, 37 putri) ------------------------------
  console.log("Membuat 82 santri...");
  const dipakai = new Set<string>();
  function namaUnik(gender: string) {
    for (let i = 0; i < 500; i++) {
      const nama =
        gender === "PUTRA"
          ? `${pilih(DEPAN_PUTRA)} ${pilih(BELAKANG_PUTRA)}`
          : `${pilih(DEPAN_PUTRI)} ${pilih(BELAKANG_PUTRI)}`;
      if (!dipakai.has(nama)) {
        dipakai.add(nama);
        return nama;
      }
    }
    throw new Error("Kehabisan kombinasi nama");
  }

  type SantriSeed = {
    id: string;
    userId: string;
    nama: string;
    gender: string;
    halaqahId: string;
    disiplin: number;
  };
  const santriSemua: SantriSeed[] = [];
  let urut = 0;

  for (const gender of ["PUTRA", "PUTRI"] as const) {
    const jumlah = gender === "PUTRA" ? 45 : 37;
    const kamarPool = gender === "PUTRA" ? kamarPutra : kamarPutri;
    const halaqahPool = gender === "PUTRA" ? halaqahPutra : halaqahPutri;

    for (let i = 0; i < jumlah; i++) {
      urut++;
      const nama = namaUnik(gender);
      const kampus = pilih(DAFTAR_KAMPUS);
      const angkatan = acakInt(2022, 2025);
      const halaqahId = halaqahPool[i % halaqahPool.length];

      const u = await prisma.user.create({
        data: {
          nama,
          username: slugUsername(nama, urut),
          passwordHash: sandiSantri,
          role: "SANTRI",
          gender,
          telepon: `08${acakInt(11, 99)}${acakInt(10000000, 99999999)}`,
        },
      });

      const s = await prisma.profilSantri.create({
        data: {
          userId: u.id,
          nim: `${angkatan}${String(acakInt(10000, 99999))}`,
          kampus,
          jurusan: pilih(KAMPUS_JURUSAN[kampus]),
          angkatan,
          asalDaerah: pilih(DAERAH),
          tanggalMasuk: new Date(angkatan, 7, acakInt(1, 28)),
          status: "AKTIF",
          kamarId: kamarPool[i % kamarPool.length],
          halaqahId,
        },
      });

      santriSemua.push({
        id: s.id,
        userId: u.id,
        nama,
        gender,
        halaqahId,
        // Sebagian kecil santri sengaja dibuat berkehadiran rendah supaya
        // fitur "prioritas pembinaan" pada dasbor terlihat berfungsi.
        disiplin: acak() < 0.12 ? 0.45 + acak() * 0.2 : 0.82 + acak() * 0.17,
      });
    }
  }

  // 6. Kegiatan & jadwal ---------------------------------------------------
  console.log("Membuat kegiatan & jadwal...");
  const kegiatanRows: Record<string, { id: string; def: DefKegiatan }> = {};
  for (const k of KEGIATAN) {
    const row = await prisma.kegiatan.create({
      data: {
        kode: k.kode,
        nama: k.nama,
        kategori: k.kategori,
        deskripsi: k.deskripsi,
        gender: k.gender,
        wajib: true,
        toleransiTerlambatMenit: k.toleransi,
        pengampuId: k.pengampu ? userPengajar[k.pengampu].pengajarId : null,
      },
    });
    kegiatanRows[k.kode] = { id: row.id, def: k };
    await prisma.jadwalKegiatan.createMany({
      data: k.jadwal.hari.map((hari) => ({
        kegiatanId: row.id,
        hari,
        jamMulai: k.jadwal.jamMulai,
        jamSelesai: k.jadwal.jamSelesai,
        lokasi: k.jadwal.lokasi,
      })),
    });
  }

  // 7. Perizinan -----------------------------------------------------------
  console.log("Membuat riwayat perizinan...");
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);

  const izinTersimpan: {
    id: string;
    santriId: string;
    mulai: Date;
    selesai: Date;
    jenis: string;
  }[] = [];

  const jenisIzin = Object.keys(ALASAN_IZIN);
  let nomorIzin = 0;

  for (let i = 0; i < 55; i++) {
    const santri = pilih(santriSemua);
    const jenis = pilih(jenisIzin);
    const offsetHari = acakInt(-27, 4);
    const mulai = padukanJam(tambahHari(hariIni, offsetHari), `${acakInt(6, 16)}:00`);
    const durasiJam = jenis === "PULANG" ? acakInt(24, 60) : acakInt(3, 14);
    const selesai = new Date(mulai.getTime() + durasiJam * 3_600_000);

    // Izin masa lalu umumnya sudah selesai diproses; yang akan datang masih
    // menunggu keputusan musyrif.
    let status: string;
    if (offsetHari > 0) status = acak() < 0.55 ? "DIAJUKAN" : "DISETUJUI";
    else if (selesai < new Date()) status = acak() < 0.12 ? "DITOLAK" : "SELESAI";
    else status = acak() < 0.2 ? "DIPROSES" : "DISETUJUI";

    const disetujui = status === "DISETUJUI" || status === "SELESAI";
    const musyrifHalaqah = HALAQAH.find(
      (h) => h.gender === santri.gender
    )!.musyrif;

    nomorIzin++;
    const izin = await prisma.izin.create({
      data: {
        kode: `IZN-${new Date().getFullYear()}${String(nomorIzin).padStart(4, "0")}`,
        santriId: santri.id,
        jenis,
        mulai,
        selesai,
        alasan: pilih(ALASAN_IZIN[jenis]),
        tujuan: jenis === "PULANG" ? pilih(DAERAH) : jenis === "SAKIT" ? "Klinik / kamar" : "Kampus",
        status,
        diprosesOlehId:
          status === "DIAJUKAN" ? null : userPengajar[musyrifHalaqah].userId,
        waktuProses: status === "DIAJUKAN" ? null : new Date(mulai.getTime() - 3_600_000),
        catatanPengurus:
          status === "DITOLAK"
            ? "Alasan belum cukup jelas, silakan ajukan ulang dengan bukti pendukung."
            : disetujui
              ? "Disetujui. Mohon kembali tepat waktu."
              : null,
        waktuKembali: status === "SELESAI" ? new Date(selesai.getTime() + acakInt(-40, 90) * 60000) : null,
      },
    });

    if (disetujui) {
      izinTersimpan.push({ id: izin.id, santriId: santri.id, mulai, selesai, jenis });
    }
  }

  // Tandai izin yang kembalinya melewati batas.
  const izinSelesai = await prisma.izin.findMany({
    where: { status: "SELESAI", waktuKembali: { not: null } },
    select: { id: true, selesai: true, waktuKembali: true, santriId: true },
  });
  for (const z of izinSelesai) {
    if (z.waktuKembali && z.waktuKembali > z.selesai) {
      await prisma.izin.update({
        where: { id: z.id },
        data: { terlambatKembali: true },
      });
      await prisma.flagPelanggaran.create({
        data: {
          santriId: z.santriId,
          jenis: "TELAT_KEMBALI",
          keterangan: `Kembali ${Math.round(
            (z.waktuKembali.getTime() - z.selesai.getTime()) / 60000
          )} menit melewati batas izin.`,
          status: "BARU",
        },
      });
    }
  }

  // 8. Sesi presensi & riwayat kehadiran (28 hari terakhir) ----------------
  console.log("Membuat riwayat presensi 28 hari...");

  const santriPerGender = {
    PUTRA: santriSemua.filter((s) => s.gender === "PUTRA"),
    PUTRI: santriSemua.filter((s) => s.gender === "PUTRI"),
  };
  const santriPerHalaqah = new Map<string, SantriSeed[]>();
  for (const s of santriSemua) {
    const arr = santriPerHalaqah.get(s.halaqahId) ?? [];
    arr.push(s);
    santriPerHalaqah.set(s.halaqahId, arr);
  }

  const izinPerSantri = new Map<string, typeof izinTersimpan>();
  for (const z of izinTersimpan) {
    const arr = izinPerSantri.get(z.santriId) ?? [];
    arr.push(z);
    izinPerSantri.set(z.santriId, arr);
  }

  const sekarang = new Date();
  let totalPresensi = 0;

  for (let d = 28; d >= 0; d--) {
    const tanggal = tambahHari(hariIni, -d);
    const hari = tanggal.getDay();

    for (const kode of Object.keys(kegiatanRows)) {
      const { id: kegiatanId, def } = kegiatanRows[kode];
      if (!def.jadwal.hari.includes(hari)) continue;
      // Kegiatan bulanan hanya sekali dalam rentang.
      if (def.kategori === "BULANAN" && d > 7) continue;

      const mulai = padukanJam(tanggal, def.jadwal.jamMulai);
      const selesai = padukanJam(tanggal, def.jadwal.jamSelesai);
      if (mulai > sekarang) continue; // sesi yang belum waktunya tidak dibuat

      const kelompok: {
        gender: string;
        halaqahId: string | null;
        musyrif: string;
        peserta: SantriSeed[];
      }[] = def.perHalaqah
        ? halaqahRows.map((h) => ({
            gender: h.gender,
            halaqahId: h.id,
            musyrif: h.musyrif,
            peserta: santriPerHalaqah.get(h.id) ?? [],
          }))
        : (["PUTRA", "PUTRI"] as const).map((g) => ({
            gender: g,
            halaqahId: null,
            musyrif: halaqahRows.find((h) => h.gender === g)!.musyrif,
            peserta: santriPerGender[g],
          }));

      for (const kel of kelompok) {
        if (kel.peserta.length === 0) continue;
        const pembuka = userPengajar[kel.musyrif].userId;

        const sesi = await prisma.sesiPresensi.create({
          data: {
            kegiatanId,
            halaqahId: kel.halaqahId,
            gender: kel.gender,
            tanggal,
            waktuBuka: new Date(mulai.getTime() - 15 * 60000),
            waktuTutup: selesai,
            batasTerlambat: new Date(mulai.getTime() + def.toleransi * 60000),
            ditutupPada: selesai,
            status: "DITUTUP",
            secret: randomBytes(32).toString("hex"),
            rotasiDetik: 12,
            dibukaOlehId: pembuka,
            ditutupOlehId: pembuka,
          },
        });

        const baris = kel.peserta.map((s) => {
          const izin = (izinPerSantri.get(s.id) ?? []).find(
            (z) => z.mulai <= mulai && z.selesai >= mulai
          );
          if (izin) {
            return {
              sesiId: sesi.id,
              santriId: s.id,
              status: izin.jenis === "SAKIT" ? "SAKIT" : "IZIN",
              metode: "OTOMATIS_IZIN",
              izinId: izin.id,
              waktuScan: null as Date | null,
              catatan: null as string | null,
              dicatatOlehId: null as string | null,
            };
          }

          const p = acak();
          if (p < s.disiplin) {
            const terlambat = acak() < 0.1;
            return {
              sesiId: sesi.id,
              santriId: s.id,
              status: terlambat ? "TERLAMBAT" : "HADIR",
              metode: acak() < 0.06 ? "MANUAL" : "QR",
              izinId: null,
              waktuScan: new Date(
                mulai.getTime() +
                  (terlambat ? acakInt(def.toleransi + 1, def.toleransi + 20) : acakInt(-12, def.toleransi - 1)) *
                    60000
              ),
              catatan: null,
              dicatatOlehId: null,
            };
          }
          return {
            sesiId: sesi.id,
            santriId: s.id,
            status: "ALFA",
            metode: "MANUAL",
            izinId: null,
            waktuScan: null,
            catatan: null,
            dicatatOlehId: pembuka,
          };
        });

        // Lengkapi pencatat untuk presensi manual.
        for (const b of baris) {
          if (b.metode === "MANUAL" && !b.dicatatOlehId) {
            b.dicatatOlehId = pembuka;
            b.catatan = "Ponsel tidak tersedia, diinput musyrif.";
          }
        }

        await prisma.presensi.createMany({ data: baris });
        totalPresensi += baris.length;
      }
    }
  }

  // 9. Contoh flag pelanggaran perangkat ganda ----------------------------
  const contohFlag = santriSemua.slice(0, 2);
  for (const s of contohFlag) {
    await prisma.flagPelanggaran.create({
      data: {
        santriId: s.id,
        jenis: "PERANGKAT_GANDA",
        keterangan:
          "Dua akun santri memindai QR dari perangkat yang sama pada sesi Kajian Ba'da Subuh.",
        status: "BARU",
      },
    });
  }

  // 10. Token wali santri (contoh) ----------------------------------------
  for (const s of santriSemua.slice(0, 5)) {
    await prisma.waliToken.create({
      data: {
        token: randomBytes(16).toString("hex"),
        santriId: s.id,
        namaWali: `Orang tua ${s.nama.split(" ")[0]}`,
        hubungan: "Orang tua",
      },
    });
  }

  // 11. Pengaturan sistem --------------------------------------------------
  await prisma.pengaturanSistem.createMany({
    data: [
      { kunci: "ambang_pembinaan", nilai: "75" },
      { kunci: "lokasi_lat", nilai: "-6.893056" },
      { kunci: "lokasi_lng", nilai: "107.590278" },
      { kunci: "radius_meter", nilai: "150" },
      { kunci: "wajib_lokasi_default", nilai: "false" },
    ],
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      aksi: "SEED",
      entitas: "Sistem",
      detail: JSON.stringify({ santri: santriSemua.length, presensi: totalPresensi }),
    },
  });

  console.log(`
Seed selesai.
  Santri        : ${santriSemua.length}
  Pengajar      : ${PENGAJAR.length}
  Kegiatan      : ${KEGIATAN.length}
  Baris presensi: ${totalPresensi}
  Perizinan     : ${nomorIzin}

Akun uji:
  admin    / admin123     (Admin / Pimpinan)
  hanif    / musyrif123   (Musyrif putra - Halaqah Al-Fatih)
  aisyah   / musyrif123   (Musyrifah putri - Halaqah Khadijah)
  ${slugUsername(santriSemua[0].nama, 1)} / santri123 (Santri: ${santriSemua[0].nama})
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
