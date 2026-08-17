-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "email" TEXT,
    "telepon" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProfilSantri" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "kampus" TEXT NOT NULL,
    "jurusan" TEXT NOT NULL,
    "angkatan" INTEGER NOT NULL,
    "asalDaerah" TEXT NOT NULL,
    "tanggalLahir" DATETIME,
    "tanggalMasuk" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "kamarId" TEXT,
    "halaqahId" TEXT,
    "deviceId" TEXT,
    "deviceLabel" TEXT,
    "deviceBoundAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfilSantri_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfilSantri_kamarId_fkey" FOREIGN KEY ("kamarId") REFERENCES "Kamar" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProfilSantri_halaqahId_fkey" FOREIGN KEY ("halaqahId") REFERENCES "Halaqah" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfilPengajar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gelar" TEXT,
    "jabatan" TEXT NOT NULL,
    "bidang" TEXT NOT NULL,
    "dewanGuru" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfilPengajar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kamar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "gedung" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "kapasitas" INTEGER NOT NULL DEFAULT 8,
    "lantai" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Halaqah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "deskripsi" TEXT,
    "musyrifId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Halaqah_musyrifId_fkey" FOREIGN KEY ("musyrifId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kegiatan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "deskripsi" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'SEMUA',
    "wajib" BOOLEAN NOT NULL DEFAULT true,
    "toleransiTerlambatMenit" INTEGER NOT NULL DEFAULT 10,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "pengampuId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kegiatan_pengampuId_fkey" FOREIGN KEY ("pengampuId") REFERENCES "ProfilPengajar" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JadwalKegiatan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kegiatanId" TEXT NOT NULL,
    "hari" INTEGER NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JadwalKegiatan_kegiatanId_fkey" FOREIGN KEY ("kegiatanId") REFERENCES "Kegiatan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SesiPresensi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kegiatanId" TEXT NOT NULL,
    "jadwalId" TEXT,
    "halaqahId" TEXT,
    "gender" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "waktuBuka" DATETIME NOT NULL,
    "waktuTutup" DATETIME NOT NULL,
    "batasTerlambat" DATETIME NOT NULL,
    "ditutupPada" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DIBUKA',
    "secret" TEXT NOT NULL,
    "rotasiDetik" INTEGER NOT NULL DEFAULT 12,
    "wajibLokasi" BOOLEAN NOT NULL DEFAULT false,
    "lokasiLat" REAL,
    "lokasiLng" REAL,
    "radiusMeter" INTEGER NOT NULL DEFAULT 150,
    "dibukaOlehId" TEXT NOT NULL,
    "ditutupOlehId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SesiPresensi_kegiatanId_fkey" FOREIGN KEY ("kegiatanId") REFERENCES "Kegiatan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SesiPresensi_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "JadwalKegiatan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SesiPresensi_halaqahId_fkey" FOREIGN KEY ("halaqahId") REFERENCES "Halaqah" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SesiPresensi_dibukaOlehId_fkey" FOREIGN KEY ("dibukaOlehId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SesiPresensi_ditutupOlehId_fkey" FOREIGN KEY ("ditutupOlehId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Presensi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sesiId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metode" TEXT NOT NULL,
    "waktuScan" DATETIME,
    "catatan" TEXT,
    "dicatatOlehId" TEXT,
    "izinId" TEXT,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Presensi_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiPresensi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Presensi_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "ProfilSantri" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Presensi_dicatatOlehId_fkey" FOREIGN KEY ("dicatatOlehId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Presensi_izinId_fkey" FOREIGN KEY ("izinId") REFERENCES "Izin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Izin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kode" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "mulai" DATETIME NOT NULL,
    "selesai" DATETIME NOT NULL,
    "alasan" TEXT NOT NULL,
    "tujuan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DIAJUKAN',
    "diprosesOlehId" TEXT,
    "waktuProses" DATETIME,
    "catatanPengurus" TEXT,
    "waktuKembali" DATETIME,
    "terlambatKembali" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Izin_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "ProfilSantri" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Izin_diprosesOlehId_fkey" FOREIGN KEY ("diprosesOlehId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LampiranIzin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "izinId" TEXT NOT NULL,
    "namaFile" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "ukuran" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LampiranIzin_izinId_fkey" FOREIGN KEY ("izinId") REFERENCES "Izin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlagPelanggaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "santriId" TEXT NOT NULL,
    "sesiId" TEXT,
    "jenis" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BARU',
    "ditanganiOlehId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FlagPelanggaran_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "ProfilSantri" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FlagPelanggaran_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiPresensi" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FlagPelanggaran_ditanganiOlehId_fkey" FOREIGN KEY ("ditanganiOlehId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitasId" TEXT,
    "detail" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaliToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "namaWali" TEXT NOT NULL,
    "hubungan" TEXT NOT NULL DEFAULT 'Orang tua',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "kadaluarsa" DATETIME,
    "terakhirDibuka" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaliToken_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "ProfilSantri" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PengaturanSistem" (
    "kunci" TEXT NOT NULL PRIMARY KEY,
    "nilai" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_gender_idx" ON "User"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilSantri_userId_key" ON "ProfilSantri"("userId");

-- CreateIndex
CREATE INDEX "ProfilSantri_kamarId_idx" ON "ProfilSantri"("kamarId");

-- CreateIndex
CREATE INDEX "ProfilSantri_halaqahId_idx" ON "ProfilSantri"("halaqahId");

-- CreateIndex
CREATE INDEX "ProfilSantri_status_idx" ON "ProfilSantri"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilPengajar_userId_key" ON "ProfilPengajar"("userId");

-- CreateIndex
CREATE INDEX "Kamar_gender_idx" ON "Kamar"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "Kamar_nama_gedung_key" ON "Kamar"("nama", "gedung");

-- CreateIndex
CREATE INDEX "Halaqah_gender_idx" ON "Halaqah"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "Halaqah_nama_key" ON "Halaqah"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Kegiatan_kode_key" ON "Kegiatan"("kode");

-- CreateIndex
CREATE INDEX "Kegiatan_kategori_idx" ON "Kegiatan"("kategori");

-- CreateIndex
CREATE INDEX "Kegiatan_aktif_idx" ON "Kegiatan"("aktif");

-- CreateIndex
CREATE INDEX "JadwalKegiatan_kegiatanId_hari_idx" ON "JadwalKegiatan"("kegiatanId", "hari");

-- CreateIndex
CREATE INDEX "SesiPresensi_status_idx" ON "SesiPresensi"("status");

-- CreateIndex
CREATE INDEX "SesiPresensi_tanggal_idx" ON "SesiPresensi"("tanggal");

-- CreateIndex
CREATE INDEX "SesiPresensi_kegiatanId_tanggal_idx" ON "SesiPresensi"("kegiatanId", "tanggal");

-- CreateIndex
CREATE INDEX "Presensi_santriId_status_idx" ON "Presensi"("santriId", "status");

-- CreateIndex
CREATE INDEX "Presensi_status_idx" ON "Presensi"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Presensi_sesiId_santriId_key" ON "Presensi"("sesiId", "santriId");

-- CreateIndex
CREATE UNIQUE INDEX "Izin_kode_key" ON "Izin"("kode");

-- CreateIndex
CREATE INDEX "Izin_santriId_status_idx" ON "Izin"("santriId", "status");

-- CreateIndex
CREATE INDEX "Izin_status_idx" ON "Izin"("status");

-- CreateIndex
CREATE INDEX "Izin_mulai_selesai_idx" ON "Izin"("mulai", "selesai");

-- CreateIndex
CREATE INDEX "FlagPelanggaran_status_idx" ON "FlagPelanggaran"("status");

-- CreateIndex
CREATE INDEX "FlagPelanggaran_santriId_idx" ON "FlagPelanggaran"("santriId");

-- CreateIndex
CREATE INDEX "AuditLog_entitas_entitasId_idx" ON "AuditLog"("entitas", "entitasId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaliToken_token_key" ON "WaliToken"("token");
