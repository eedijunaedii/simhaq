"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { Bidang, Input, Peringatan, Tombol } from "@/components/ui";
import { masuk, type StatusLogin } from "./aksi";

const AWAL: StatusLogin = {};

function TombolKirim() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" ukuran="lg" className="w-full" disabled={pending}>
      {pending ? (
        "Memeriksa..."
      ) : (
        <>
          <LogIn size={16} />
          Masuk
        </>
      )}
    </Tombol>
  );
}

export function FormLogin({ lanjut }: { lanjut: string }) {
  const [status, aksi] = useActionState(masuk, AWAL);
  const [lihat, setLihat] = useState(false);

  return (
    <form action={aksi} className="space-y-4">
      <input type="hidden" name="lanjut" value={lanjut} />

      {status.galat ? <Peringatan nada="galat">{status.galat}</Peringatan> : null}

      <Bidang label="Nama pengguna">
        <Input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="mis. hanif"
          required
        />
      </Bidang>

      <Bidang label="Kata sandi">
        <div className="relative">
          <Input
            name="kataSandi"
            type={lihat ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setLihat((v) => !v)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-redup transition hover:text-emerald-200"
            aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {lihat ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </Bidang>

      <TombolKirim />
    </form>
  );
}
