/**
 * Menyamakan zona waktu runtime server dengan zona waktu pesantren.
 *
 * Seluruh perhitungan tanggal aplikasi (batas terlambat, rentang "hari ini",
 * pengelompokan rekap harian) memakai waktu lokal server. Di komputer pengurus
 * itu sudah WIB, tetapi runtime hosting umumnya berjalan pada UTC — sehingga
 * sesi presensi pukul 18.15 tersimpan sebagai 01.15 keesokan harinya.
 *
 * Vercel tidak mengizinkan variabel lingkungan bernama `TZ` (nama tersebut
 * dicadangkan), jadi nilainya disetel di sini saat server dinyalakan. Node
 * membaca ulang `process.env.TZ` untuk operasi Date berikutnya.
 *
 * Override lewat `ZONA_WAKTU` bila pesantren pindah zona waktu.
 */
export function register() {
  const zona = process.env.ZONA_WAKTU || "Asia/Jakarta";

  if (process.env.TZ !== zona) {
    process.env.TZ = zona;
  }
}
