"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, Label } from "@/components/ui";

/**
 * Kolom kata sandi dengan tombol perlihatkan/sembunyikan.
 *
 * Dipakai di semua tempat yang meminta kata sandi. Konsistensi ini bukan
 * sekadar rapi: peramban berbasis Chromium menambahkan tombol bukanya sendiri
 * lewat pseudo-elemen `::-ms-reveal`, yang disembunyikan pada globals.css agar
 * tidak muncul dua ikon mata bersebelahan. Karena bawaan itu dimatikan, setiap
 * kolom sandi wajib menyediakan tombolnya sendiri — dan itulah komponen ini.
 */
export function InputSandi({
  label,
  petunjuk,
  className,
  ...rest
}: React.ComponentProps<"input"> & { label: string; petunjuk?: string }) {
  const [lihat, setLihat] = useState(false);
  const id = useId();

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          {...rest}
          id={id}
          type={lihat ? "text" : "password"}
          className="pr-12"
        />
        <button
          type="button"
          onClick={() => setLihat((v) => !v)}
          aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          aria-pressed={lihat}
          className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center rounded-r-xl text-redup transition-colors duration-200 hover:text-aksen"
        >
          {lihat ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {petunjuk ? <p className="mt-1.5 text-xs text-redup">{petunjuk}</p> : null}
    </div>
  );
}
