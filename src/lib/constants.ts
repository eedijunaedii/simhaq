/**
 * Nilai "enum" aplikasi.
 *
 * Disimpan sebagai konstanta TypeScript (bukan enum Prisma) supaya skema
 * database tetap sama persis antara SQLite (dev) dan PostgreSQL (produksi).
 */

export const APP = {
  nama: "SIMHAQ",
  namaPanjang: "Sistem Presensi & Perizinan Santri",
  lembaga: "PPM Minhajul Haq",
  lembagaPanjang: "Pondok Pesantren Mahasiswa Minhajul Haq",
  motto: "Mencetak Generasi Madani: Sarjana yang Mubaligh, Mubaligh yang Sarjana",
  alamat: "Jl. Bijaksana 2 No. 8, Pasteur, Sukajadi, Kota Bandung, Jawa Barat",
  telepon: "+62 878-8982-7126",
  email: "ppmminhajulhaq@gmail.com",
  situsUtama: "https://www.ppmmh.site",
  youtube: "https://youtu.be/E0k9bXSnx58",
  zonaWaktu: "Asia/Jakarta",
} as const;

// --- Peran & gender -------------------------------------------------------

export const ROLE = {
  SANTRI: "SANTRI",
  MUSYRIF: "MUSYRIF",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export const ROLE_LABEL: Record<Role, string> = {
  SANTRI: "Santri",
  MUSYRIF: "Musyrif / Musyrifah",
  ADMIN: "Admin / Pimpinan",
};

export const GENDER = { PUTRA: "PUTRA", PUTRI: "PUTRI" } as const;
export type Gender = (typeof GENDER)[keyof typeof GENDER];

export const GENDER_LABEL: Record<string, string> = {
  PUTRA: "Putra",
  PUTRI: "Putri",
  SEMUA: "Putra & Putri",
};

// --- Presensi -------------------------------------------------------------

export const STATUS_PRESENSI = {
  HADIR: "HADIR",
  TERLAMBAT: "TERLAMBAT",
  IZIN: "IZIN",
  SAKIT: "SAKIT",
  ALFA: "ALFA",
} as const;
export type StatusPresensi = (typeof STATUS_PRESENSI)[keyof typeof STATUS_PRESENSI];

export const STATUS_PRESENSI_LABEL: Record<string, string> = {
  HADIR: "Hadir",
  TERLAMBAT: "Terlambat",
  IZIN: "Izin",
  SAKIT: "Sakit",
  ALFA: "Tanpa keterangan",
};

/** Warna badge per status presensi (kelas Tailwind). */
export const STATUS_PRESENSI_STYLE: Record<string, string> = {
  HADIR: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  TERLAMBAT: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  IZIN: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  SAKIT: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  ALFA: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

/** Status yang dihitung sebagai "hadir" pada rekap persentase. */
export const STATUS_DIHITUNG_HADIR = ["HADIR", "TERLAMBAT"];

export const METODE_PRESENSI = {
  QR: "QR",
  MANUAL: "MANUAL",
  OTOMATIS_IZIN: "OTOMATIS_IZIN",
} as const;

export const METODE_PRESENSI_LABEL: Record<string, string> = {
  QR: "Pindai QR",
  MANUAL: "Input musyrif",
  OTOMATIS_IZIN: "Otomatis dari izin",
};

// --- Sesi -----------------------------------------------------------------

export const STATUS_SESI = {
  DIBUKA: "DIBUKA",
  DITUTUP: "DITUTUP",
  DIBATALKAN: "DIBATALKAN",
} as const;

export const STATUS_SESI_LABEL: Record<string, string> = {
  DIBUKA: "Dibuka",
  DITUTUP: "Ditutup",
  DIBATALKAN: "Dibatalkan",
};

// --- Kegiatan -------------------------------------------------------------

export const KATEGORI_KEGIATAN = {
  HARIAN: "HARIAN",
  MINGGUAN: "MINGGUAN",
  BULANAN: "BULANAN",
  INSIDENTAL: "INSIDENTAL",
} as const;

export const KATEGORI_KEGIATAN_LABEL: Record<string, string> = {
  HARIAN: "Harian",
  MINGGUAN: "Mingguan",
  BULANAN: "Bulanan",
  INSIDENTAL: "Insidental",
};

// --- Izin -----------------------------------------------------------------

export const JENIS_IZIN = {
  KULIAH: "KULIAH",
  KEGIATAN_KAMPUS: "KEGIATAN_KAMPUS",
  SAKIT: "SAKIT",
  PULANG: "PULANG",
  KELUARGA: "KELUARGA",
  LAINNYA: "LAINNYA",
} as const;
export type JenisIzin = (typeof JENIS_IZIN)[keyof typeof JENIS_IZIN];

export const JENIS_IZIN_LABEL: Record<string, string> = {
  KULIAH: "Kuliah / Praktikum",
  KEGIATAN_KAMPUS: "Kegiatan Kampus",
  SAKIT: "Sakit",
  PULANG: "Pulang Kampung",
  KELUARGA: "Keperluan Keluarga",
  LAINNYA: "Lainnya",
};

/** Izin jenis SAKIT dicatat sebagai status presensi SAKIT, sisanya IZIN. */
export const STATUS_PRESENSI_DARI_IZIN: Record<string, string> = {
  SAKIT: "SAKIT",
};

export const STATUS_IZIN = {
  DIAJUKAN: "DIAJUKAN",
  DIPROSES: "DIPROSES",
  DISETUJUI: "DISETUJUI",
  DITOLAK: "DITOLAK",
  SELESAI: "SELESAI",
  DIBATALKAN: "DIBATALKAN",
} as const;
export type StatusIzin = (typeof STATUS_IZIN)[keyof typeof STATUS_IZIN];

export const STATUS_IZIN_LABEL: Record<string, string> = {
  DIAJUKAN: "Diajukan",
  DIPROSES: "Diproses",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export const STATUS_IZIN_STYLE: Record<string, string> = {
  DIAJUKAN: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  DIPROSES: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  DISETUJUI: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  DITOLAK: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  SELESAI: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  DIBATALKAN: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
};

// --- Pengawasan -----------------------------------------------------------

export const JENIS_FLAG = {
  PERANGKAT_GANDA: "PERANGKAT_GANDA",
  DILUAR_RADIUS: "DILUAR_RADIUS",
  TOKEN_KEDALUWARSA: "TOKEN_KEDALUWARSA",
  TELAT_KEMBALI: "TELAT_KEMBALI",
} as const;

export const JENIS_FLAG_LABEL: Record<string, string> = {
  PERANGKAT_GANDA: "Perangkat dipakai dua akun",
  DILUAR_RADIUS: "Pemindaian di luar radius",
  TOKEN_KEDALUWARSA: "Token QR kedaluwarsa",
  TELAT_KEMBALI: "Terlambat kembali dari izin",
};

export const STATUS_FLAG_LABEL: Record<string, string> = {
  BARU: "Baru",
  DITINJAU: "Ditinjau",
  SELESAI: "Selesai",
};

// --- Lain-lain ------------------------------------------------------------

export const HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Ambang kehadiran (persen) untuk menandai santri prioritas pembinaan. */
export const AMBANG_PEMBINAAN = 75;

/** Batas ukuran lampiran izin (byte). */
export const MAKS_LAMPIRAN = 2 * 1024 * 1024;

export const KAMPUS = [
  "ITB",
  "UPI",
  "POLMAN",
  "POLBAN",
  "POLTEKKES",
  "POLTEKESOS",
  "STTT",
  "UNPAS",
  "UNISBA",
  "ULBI",
  "ITENAS",
  "UNIKOM",
  "USB YPKP",
  "UT",
];
