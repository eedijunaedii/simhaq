import { APP, HARI } from "./constants";

const ZONA = APP.zonaWaktu;

const fTanggal = new Intl.DateTimeFormat("id-ID", {
  timeZone: ZONA,
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const fTanggalPendek = new Intl.DateTimeFormat("id-ID", {
  timeZone: ZONA,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const fJam = new Intl.DateTimeFormat("id-ID", {
  timeZone: ZONA,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function fmtTanggal(d: Date | string) {
  return fTanggal.format(new Date(d));
}

export function fmtTanggalPendek(d: Date | string) {
  return fTanggalPendek.format(new Date(d));
}

export function fmtJam(d: Date | string) {
  return fJam.format(new Date(d)) + " WIB";
}

export function fmtTanggalJam(d: Date | string) {
  return `${fTanggalPendek.format(new Date(d))}, ${fJam.format(new Date(d))} WIB`;
}

export function namaHari(d: Date | string) {
  return HARI[new Date(d).getDay()];
}

/** Awal hari (00:00 waktu server). */
export function awalHari(d: Date | string = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function akhirHari(d: Date | string = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function tambahHari(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function tambahMenit(d: Date, n: number) {
  return new Date(d.getTime() + n * 60_000);
}

/** Gabungkan tanggal dengan jam berformat "HH:MM". */
export function padukanJam(tanggal: Date, jam: string) {
  const [h, m] = jam.split(":").map(Number);
  const x = new Date(tanggal);
  x.setHours(h ?? 0, m ?? 0, 0, 0);
  return x;
}

/** Nilai untuk <input type="datetime-local"> memakai waktu lokal. */
export function nilaiDatetimeLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

export function nilaiTanggalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "3 jam lagi", "2 hari lalu", dst. */
export function selisihManusiawi(d: Date | string, acuan = new Date()) {
  const ms = new Date(d).getTime() - acuan.getTime();
  const lampau = ms < 0;
  const abs = Math.abs(ms);
  const menit = Math.round(abs / 60000);
  const jam = Math.round(abs / 3_600_000);
  const hari = Math.round(abs / 86_400_000);

  let teks: string;
  if (menit < 1) teks = "beberapa detik";
  else if (menit < 60) teks = `${menit} menit`;
  else if (jam < 24) teks = `${jam} jam`;
  else teks = `${hari} hari`;

  return lampau ? `${teks} lalu` : `${teks} lagi`;
}

export function rentangBulan(tahun: number, bulan: number) {
  const mulai = new Date(tahun, bulan, 1, 0, 0, 0, 0);
  const selesai = new Date(tahun, bulan + 1, 0, 23, 59, 59, 999);
  return { mulai, selesai };
}

export const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
