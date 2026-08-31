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
  if (p >= 90) return "text-sukses";
  if (p >= 75) return "text-limau";
  if (p >= 60) return "text-waspada";
  return "text-bahaya";
}

export function warnaBatang(p: number) {
  if (p >= 90) return "bg-sukses";
  if (p >= 75) return "bg-limau";
  if (p >= 60) return "bg-waspada";
  return "bg-bahaya";
}
