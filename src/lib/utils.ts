export function cn(...bagian: (string | false | null | undefined)[]) {
  return bagian.filter(Boolean).join(" ");
}

export function persen(pembilang: number, penyebut: number, desimal = 1) {
  if (!penyebut) return 0;
  return Number(((pembilang / penyebut) * 100).toFixed(desimal));
}

export function inisial(nama: string) {
  return nama
    .split(" ")
    .filter((k) => /^[A-Za-z]/.test(k))
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase())
    .join("");
}

export function angkaRingkas(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

/** Warna batang/teks berdasarkan persentase kehadiran. */
export function warnaKehadiran(p: number) {
  if (p >= 90) return "text-emerald-300";
  if (p >= 75) return "text-lime-300";
  if (p >= 60) return "text-amber-300";
  return "text-rose-300";
}

export function warnaBatang(p: number) {
  if (p >= 90) return "bg-emerald-400";
  if (p >= 75) return "bg-lime-400";
  if (p >= 60) return "bg-amber-400";
  return "bg-rose-400";
}
