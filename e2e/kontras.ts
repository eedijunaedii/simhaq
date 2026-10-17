import type { Page } from "@playwright/test";

/*
  Pengukur kontras teks (WCAG 1.4.3) yang dijalankan di dalam halaman.

  Latar belakang: pernah ada bug di mana saklar tema meninggalkan warna teks
  pada nilai tema sebelumnya, sehingga ratusan teks jatuh di bawah ambang
  kontras padahal muat bersih baik-baik saja. Pengukuran dilakukan lewat
  canvas (bukan mem-parse string warna) karena Tailwind v4 memancarkan
  warna dalam ruang oklab yang tidak bisa dibaca dengan regex angka.
*/

export type Pelanggaran = {
  rasio: number;
  ambang: number;
  tag: string;
  teks: string;
  kelas: string;
};

export async function ukurKontras(page: Page): Promise<Pelanggaran[]> {
  return page.evaluate(() => {
    const kanvas = document.createElement("canvas");
    kanvas.width = kanvas.height = 1;
    const ctx = kanvas.getContext("2d", { willReadFrequently: true })!;
    const simpan = new Map<string, number[]>();

    /* Serahkan penguraian warna ke browser: apa pun notasinya (oklab, color-mix,
       rgb) hasilnya tetap RGBA yang bisa dihitung. */
    const urai = (warna: string): number[] => {
      const ada = simpan.get(warna);
      if (ada) return ada;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = warna;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      const hasil = [d[0], d[1], d[2], d[3] / 255];
      simpan.set(warna, hasil);
      return hasil;
    };

    const lurus = (c: number) => {
      const n = c / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    };
    const luminansi = (c: number[]) =>
      0.2126 * lurus(c[0]) + 0.7152 * lurus(c[1]) + 0.0722 * lurus(c[2]);
    const rasioKontras = (a: number[], b: number[]) => {
      const [tinggi, rendah] = [luminansi(a), luminansi(b)].sort((x, y) => y - x);
      return (tinggi + 0.05) / (rendah + 0.05);
    };
    const campur = (depan: number[], alfa: number, belakang: number[]) =>
      depan.map((c, i) => c * alfa + belakang[i] * (1 - alfa));

    const [dr, dg, db] = urai(getComputedStyle(document.body).backgroundColor);
    const dasar = [dr, dg, db];

    /* Naik ke atas pohon menumpuk setiap latar semitransparan sampai menemukan
       yang pekat. Elemen di atas gradien dilewati: warna efektifnya berbeda di
       setiap piksel, jadi tidak bisa dinilai dengan satu angka. */
    const latar = (el: Element): number[] | null => {
      const tumpuk: [number[], number][] = [];
      let n: Element | null = el;
      while (n && n !== document.body) {
        const s = getComputedStyle(n);
        if (s.backgroundImage?.includes("gradient")) return null;
        const [r, g, b, a] = urai(s.backgroundColor);
        if (a > 0.001) {
          tumpuk.push([[r, g, b], a]);
          if (a >= 0.999) break;
        }
        n = n.parentElement;
      }
      let hasil = dasar;
      for (let i = tumpuk.length - 1; i >= 0; i--) {
        hasil = campur(tumpuk[i][0], tumpuk[i][1], hasil);
      }
      return hasil;
    };

    const jalan = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const sudah = new Set<Element>();
    const gagal: Pelanggaran[] = [];
    let node: Node | null;

    while ((node = jalan.nextNode())) {
      const teks = node.textContent?.trim() ?? "";
      if (teks.length < 2) continue;
      const el = node.parentElement;
      if (!el || sudah.has(el)) continue;
      sudah.add(el);

      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") continue;
      if (parseFloat(s.opacity) < 0.5) continue;

      const belakang = latar(el);
      if (!belakang) continue;

      const [fr, fg, fb, fa] = urai(s.color);
      const depan = fa >= 0.999 ? [fr, fg, fb] : campur([fr, fg, fb], fa, belakang);

      const px = parseFloat(s.fontSize);
      const tebal = parseInt(s.fontWeight, 10) >= 700;
      const ambang = px >= 24 || (px >= 18.66 && tebal) ? 3.0 : 4.5;
      const rasio = rasioKontras(depan, belakang);

      if (rasio < ambang) {
        gagal.push({
          rasio: Number(rasio.toFixed(2)),
          ambang,
          tag: el.tagName,
          teks: teks.slice(0, 40),
          kelas: String(el.className).slice(0, 60),
        });
      }
    }
    return gagal;
  }) as Promise<Pelanggaran[]>;
}

export function laporkan(gagal: Pelanggaran[]): string {
  return gagal
    .map((g) => `${g.rasio} < ${g.ambang} · <${g.tag}> "${g.teks}" · ${g.kelas}`)
    .join("\n");
}
