"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";
import { Bidang, Input, Peringatan, Tombol } from "@/components/ui";
import { InputSandi } from "@/components/input-sandi";
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

      <InputSandi
        label="Kata sandi"
        name="kataSandi"
        autoComplete="current-password"
        placeholder="••••••••"
        required
      />

      <TombolKirim />
    </form>
  );
}
