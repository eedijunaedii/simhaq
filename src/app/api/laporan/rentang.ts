import { akhirHari, awalHari, fmtTanggal, tambahHari } from "@/lib/tanggal";
import type { Rentang } from "@/lib/rekap";

/**
 * Baca rentang tanggal dari query string laporan.
 * Menerima `mulai`/`selesai` (YYYY-MM-DD) atau `hari` (jumlah hari ke belakang).
 */
export function bacaRentang(sp: URLSearchParams): { rentang: Rentang; label: string } {
  const mulaiStr = sp.get("mulai");
  const selesaiStr = sp.get("selesai");

  if (mulaiStr && selesaiStr) {
    const mulai = awalHari(new Date(mulaiStr));
    const selesai = akhirHari(new Date(selesaiStr));
    if (!Number.isNaN(mulai.getTime()) && !Number.isNaN(selesai.getTime())) {
      return {
        rentang: { mulai, selesai },
        label: `${fmtTanggal(mulai)} — ${fmtTanggal(selesai)}`,
      };
    }
  }

  const hari = Math.min(365, Math.max(1, Number(sp.get("hari") ?? 30)));
  const mulai = awalHari(tambahHari(new Date(), -(hari - 1)));
  const selesai = akhirHari();
  return {
    rentang: { mulai, selesai },
    label: `${hari} hari terakhir (${fmtTanggal(mulai)} — ${fmtTanggal(selesai)})`,
  };
}
