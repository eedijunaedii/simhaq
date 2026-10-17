"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

/**
 * Menu navigasi halaman depan untuk layar sempit.
 *
 * Navigasi utama memakai `hidden md:flex`, sehingga di bawah 768px tautan
 * bagian (Fitur, Pengamanan, Pengguna) dan tautan ke situs pesantren tidak
 * bisa dijangkau sama sekali — padahal sebagian besar santri dan wali membuka
 * aplikasi ini dari ponsel.
 *
 * Panelnya ditutup saat tautan dipilih, saat Escape ditekan, dan saat pengguna
 * menyentuh di luar area menu. Tautannya tetap elemen <a> biasa agar gulir
 * halus bawaan (scroll-behavior) dan scroll-padding header tetap berlaku.
 */
export function MenuPonsel({
  tautan,
}: {
  tautan: { href: string; label: string; luar?: boolean }[];
}) {
  const [buka, setBuka] = useState(false);
  const idPanel = useId();
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;

    const saatTombol = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
    };
    const saatKlikLuar = (e: PointerEvent) => {
      if (!wadah.current?.contains(e.target as Node)) setBuka(false);
    };

    document.addEventListener("keydown", saatTombol);
    document.addEventListener("pointerdown", saatKlikLuar);
    return () => {
      document.removeEventListener("keydown", saatTombol);
      document.removeEventListener("pointerdown", saatKlikLuar);
    };
  }, [buka]);

  return (
    <div ref={wadah} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        aria-controls={idPanel}
        aria-label={buka ? "Tutup menu navigasi" : "Buka menu navigasi"}
        className="inline-grid size-11 cursor-pointer place-items-center rounded-xl text-sekunder transition-colors duration-200 hover:bg-lapis hover:text-teks"
      >
        {buka ? <X size={18} /> : <Menu size={18} />}
      </button>

      {buka ? (
        <div
          id={idPanel}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-2xl border border-garis bg-dasar-naik shadow-[var(--bayangan-kartu)]"
        >
          <nav className="flex flex-col py-1.5 text-sm">
            {tautan.map((t) => (
              <a
                key={t.href}
                href={t.href}
                onClick={() => setBuka(false)}
                {...(t.luar ? { target: "_blank", rel: "noreferrer" } : null)}
                className="px-4 py-3 text-sekunder transition-colors hover:bg-lapis hover:text-teks"
              >
                {t.label}
                {t.luar ? " ↗" : null}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
