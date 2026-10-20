"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/**
 * Menampilkan tautan akses wali sebagai alamat lengkap yang dapat langsung
 * diklik dan disalin.
 *
 * Sebelumnya hanya jalur relatif (`/wali/…`) yang ditampilkan, sehingga
 * pengurus harus menyusun sendiri alamat lengkapnya sebelum dikirim ke wali
 * santri. Tombol salin disediakan karena tautan ini pada praktiknya dikirim
 * lewat pesan singkat.
 */
export function TautanWali({
  tautan,
  ukuran = "biasa",
}: {
  tautan: string;
  ukuran?: "biasa" | "kecil";
}) {
  const [tersalin, setTersalin] = useState(false);

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(tautan);
    } catch {
      /* Papan klip tidak tersedia (konteks tidak aman); tautan tetap dapat
         disorot dan disalin manual. */
      return;
    }
    setTersalin(true);
    window.setTimeout(() => setTersalin(false), 2000);
  };

  const kecil = ukuran === "kecil";

  return (
    <div className="flex items-start gap-1.5">
      <a
        href={tautan}
        target="_blank"
        rel="noreferrer"
        className={`min-w-0 flex-1 break-all rounded-lg bg-lapis-naik px-2.5 py-1.5 font-mono text-sukses transition-colors duration-150 hover:text-aksen ${
          kecil ? "text-[11px]" : "text-xs"
        }`}
        title="Buka tautan wali di tab baru"
      >
        {tautan}
        <ExternalLink size={11} className="ml-1 inline-block align-[-1px]" />
      </a>
      <button
        type="button"
        onClick={salin}
        aria-label={tersalin ? "Tautan tersalin" : "Salin tautan wali"}
        title={tersalin ? "Tersalin" : "Salin tautan"}
        className="inline-grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-sekunder transition-colors duration-200 hover:bg-lapis hover:text-teks"
      >
        {tersalin ? (
          <Check size={14} className="text-sukses" />
        ) : (
          <Copy size={14} />
        )}
      </button>
    </div>
  );
}
