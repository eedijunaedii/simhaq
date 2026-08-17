import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Token QR dinamis.
 *
 * Isi QR = `sesiId.slot.tandaTangan`, di mana `slot` adalah nomor jendela
 * waktu (detik sekarang dibagi lama rotasi). Setiap sesi punya `secret`
 * sendiri, sehingga tangkapan layar QR kedaluwarsa dalam hitungan detik dan
 * QR sesi lain tidak bisa dipakai ulang.
 */

/**
 * Slot lampau yang masih diterima, untuk menyerap jeda antara kode tergambar
 * di layar dan pemindaian sampai ke server.
 *
 * Slot masa depan sengaja tidak diterima: token dibuat dan diverifikasi oleh
 * jam yang sama, sehingga slot pada token tidak pernah lebih besar daripada
 * slot saat verifikasi. Menerimanya hanya akan memperpanjang masa berlaku
 * tangkapan layar tanpa manfaat.
 */
const SLOT_LAMPAU_DITERIMA = 1;

export function buatSecretSesi() {
  return randomBytes(32).toString("hex");
}

export function slotSaatIni(rotasiDetik: number, waktu = Date.now()) {
  return Math.floor(waktu / 1000 / Math.max(1, rotasiDetik));
}

function tandaTangan(secret: string, sesiId: string, slot: number) {
  return createHmac("sha256", secret)
    .update(`${sesiId}:${slot}`)
    .digest("hex")
    .slice(0, 24);
}

export function buatTokenQr(sesiId: string, secret: string, rotasiDetik: number) {
  const slot = slotSaatIni(rotasiDetik);
  return {
    token: `${sesiId}.${slot}.${tandaTangan(secret, sesiId, slot)}`,
    slot,
    /** Sisa milidetik sebelum token berganti. */
    sisaMs: (slot + 1) * rotasiDetik * 1000 - Date.now(),
  };
}

export type HasilVerifikasi =
  | { ok: true; sesiId: string }
  | { ok: false; alasan: "FORMAT" | "TANDA_TANGAN" }
  | {
      ok: false;
      alasan: "KEDALUWARSA";
      /** Usia token dalam detik, dipakai membedakan jeda wajar dari tangkapan layar. */
      usiaDetik: number;
    };

export function verifikasiTokenQr(
  token: string,
  secret: string,
  rotasiDetik: number
): HasilVerifikasi {
  const bagian = token.trim().split(".");
  if (bagian.length !== 3) return { ok: false, alasan: "FORMAT" };

  const [sesiId, slotStr, sig] = bagian;
  const slot = Number(slotStr);
  if (!sesiId || !Number.isFinite(slot) || !sig) return { ok: false, alasan: "FORMAT" };

  const sekarang = slotSaatIni(rotasiDetik);
  const selisih = sekarang - slot;
  if (selisih > SLOT_LAMPAU_DITERIMA || selisih < 0) {
    return {
      ok: false,
      alasan: "KEDALUWARSA",
      usiaDetik: Math.max(0, selisih) * rotasiDetik,
    };
  }

  const harusnya = tandaTangan(secret, sesiId, slot);
  const a = Buffer.from(harusnya);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, alasan: "TANDA_TANGAN" };
  }
  return { ok: true, sesiId };
}

/** Ambil id sesi dari token tanpa memverifikasi (untuk mencari secret-nya). */
export function sesiIdDariToken(token: string) {
  const id = token.trim().split(".")[0];
  return id && id.length > 0 ? id : null;
}

/** Jarak dua titik koordinat dalam meter (rumus haversine). */
export function jarakMeter(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
