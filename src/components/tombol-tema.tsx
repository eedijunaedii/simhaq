"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const KUNCI = "tema-simhaq";

/**
 * Saklar tema terang/gelap.
 *
 * Sengaja tanpa state React: status tema hidup pada atribut
 * <html data-tema> yang dipasang skrip awal di layout, dan ikonnya berganti
 * lewat varian dark:* murni CSS. Dengan begitu tidak ada ketidaksesuaian
 * hidrasi maupun render berantai, dan tombol tetap benar meski dirender
 * sebelum hidrasi selesai.
 *
 * Bila pengguna belum pernah memilih tema secara eksplisit, perubahan
 * preferensi sistem ikut diterapkan secara langsung.
 */

/**
 * Terapkan tema tanpa memicu transisi warna.
 *
 * Banyak elemen memakai utilitas `transition` yang ikut menganimasikan `color`
 * dan `background-color`. Saat tema berganti, nilai-nilai itu berasal dari
 * variabel @theme Tailwind yang terdaftar lewat @property; animasinya terbukti
 * tersangkut sehingga sebagian teks tetap memakai warna tema lama — pada mode
 * terang hasilnya teks terang di atas latar terang. Terukur: muat bersih 0
 * pelanggaran kontras, setelah menekan saklar menjadi 122.
 *
 * Karena itu transisi dimatikan sesaat, tema diterapkan, lalu transisi
 * dikembalikan pada frame berikutnya. Pergantian tema memang sebaiknya
 * seketika — menganimasikan seluruh halaman justru terasa lamban.
 */
function terapkanTema(gelap: boolean) {
  const html = document.documentElement;
  html.classList.add("tanpa-transisi");

  if (gelap) html.dataset.tema = "gelap";
  else delete html.dataset.tema;

  // Paksa perhitungan ulang gaya selagi transisi masih dimatikan.
  void html.offsetHeight;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => html.classList.remove("tanpa-transisi"));
  });
}

export function TombolTema({ className }: { className?: string }) {
  useEffect(() => {
    let tersimpan: string | null = null;
    try {
      tersimpan = localStorage.getItem(KUNCI);
    } catch {
      /* penyimpanan tidak tersedia — abaikan */
    }
    if (tersimpan) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const saatBerubah = (e: MediaQueryListEvent) => terapkanTema(e.matches);
    media.addEventListener("change", saatBerubah);
    return () => media.removeEventListener("change", saatBerubah);
  }, []);

  const alihkan = () => {
    const gelap = document.documentElement.dataset.tema === "gelap";
    terapkanTema(!gelap);
    try {
      localStorage.setItem(KUNCI, gelap ? "terang" : "gelap");
    } catch {
      /* penyimpanan tidak tersedia — tema tetap berlaku untuk sesi ini */
    }
  };

  return (
    <button
      type="button"
      onClick={alihkan}
      title="Ganti mode terang/gelap"
      aria-label="Ganti mode terang/gelap"
      className={
        className ??
        "inline-grid size-11 cursor-pointer place-items-center rounded-xl text-sekunder transition-colors duration-200 hover:bg-lapis hover:text-teks"
      }
    >
      <Moon size={18} className="dark:hidden" />
      <Sun size={18} className="hidden dark:block" />
    </button>
  );
}
