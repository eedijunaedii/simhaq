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
    const saatBerubah = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.dataset.tema = "gelap";
      } else {
        delete document.documentElement.dataset.tema;
      }
    };
    media.addEventListener("change", saatBerubah);
    return () => media.removeEventListener("change", saatBerubah);
  }, []);

  const alihkan = () => {
    const gelap = document.documentElement.dataset.tema === "gelap";
    if (gelap) {
      delete document.documentElement.dataset.tema;
    } else {
      document.documentElement.dataset.tema = "gelap";
    }
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
