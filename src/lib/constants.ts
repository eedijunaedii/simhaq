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
  PEMBINA: "PEMBINA",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export const ROLE_LABEL: Record<Role, string> = {
  SANTRI: "Santri",
  PEMBINA: "Pembina",
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
  HADIR: "bg-sukses/15 text-sukses ring-sukses/30",
  TERLAMBAT: "bg-waspada/15 text-waspada ring-waspada/30",
  IZIN: "bg-info/15 text-info ring-info/30",
  SAKIT: "bg-ungu/15 text-ungu ring-ungu/30",
  ALFA: "bg-bahaya/15 text-bahaya ring-bahaya/30",
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
  MANUAL: "Input pembina",
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
  DIAJUKAN: "bg-waspada/15 text-waspada ring-waspada/30",
  DIPROSES: "bg-info/15 text-info ring-info/30",
  DISETUJUI: "bg-sukses/15 text-sukses ring-sukses/30",
  DITOLAK: "bg-bahaya/15 text-bahaya ring-bahaya/30",
  SELESAI: "bg-lapis/15 text-redup ring-garis/30",
  DIBATALKAN: "bg-lapis/15 text-redup ring-garis/30",
};

// --- Pengawasan -----------------------------------------------------------

export const JENIS_FLAG = {
  PERANGKAT_GANDA: "PERANGKAT_GANDA",
  DILUAR_RADIUS: "DILUAR_RADIUS",
  TOKEN_KEDALUWARSA: "TOKEN_KEDALUWARSA",
} as const;

export const JENIS_FLAG_LABEL: Record<string, string> = {
  PERANGKAT_GANDA: "Perangkat dipakai dua akun",
  DILUAR_RADIUS: "Pemindaian di luar radius",
  TOKEN_KEDALUWARSA: "Token QR kedaluwarsa",
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

/** Kampus asal santri, lengkap dengan logo (diambil dari situs pesantren). */
export const KAMPUS: { singkatan: string; nama: string; logo: string }[] = [
  { singkatan: "ITB", nama: "Institut Teknologi Bandung", logo: "/kampus/ITB.png" },
  { singkatan: "UPI", nama: "Universitas Pendidikan Indonesia", logo: "/kampus/upi.png" },
  {
    singkatan: "POLMAN",
    nama: "Politeknik Manufaktur Negeri Bandung",
    logo: "/kampus/polman.png",
  },
  { singkatan: "POLBAN", nama: "Politeknik Negeri Bandung", logo: "/kampus/polban.png" },
  {
    singkatan: "POLTEKKES",
    nama: "Poltekkes Kemenkes Bandung",
    logo: "/kampus/poltekkes.png",
  },
  {
    singkatan: "POLTEKESOS",
    nama: "Politeknik Kesejahteraan Sosial",
    logo: "/kampus/poltekesos.png",
  },
  {
    singkatan: "STTT",
    nama: "Sekolah Tinggi Teknologi Tekstil",
    logo: "/kampus/sttt.png",
  },
  { singkatan: "UNPAS", nama: "Universitas Pasundan", logo: "/kampus/unpas.png" },
  { singkatan: "UNISBA", nama: "Universitas Islam Bandung", logo: "/kampus/unisba.png" },
  {
    singkatan: "ULBI",
    nama: "Universitas Logistik & Bisnis Indonesia",
    logo: "/kampus/ulbi.png",
  },
  {
    singkatan: "ITENAS",
    nama: "Institut Teknologi Nasional Bandung",
    logo: "/kampus/itenas.png",
  },
  {
    singkatan: "UNIKOM",
    nama: "Universitas Komputer Indonesia",
    logo: "/kampus/unikom.png",
  },
  {
    singkatan: "USB YPKP",
    nama: "Universitas Sangga Buana YPKP",
    logo: "/kampus/USB_YPKP_Logo.png",
  },
  { singkatan: "UT", nama: "Universitas Terbuka", logo: "/kampus/UT.png" },
];
