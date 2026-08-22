"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Save } from "lucide-react";
import { Bidang, Input, Peringatan, Tombol } from "@/components/ui";
import { InputSandi } from "@/components/input-sandi";
import { ubahKataSandi, ubahKontak, type Hasil } from "./aksi";

const AWAL: Hasil = {};

function Kirim({ label, ikon }: { label: string; ikon: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending}>
      {ikon}
      {pending ? "Menyimpan..." : label}
    </Tombol>
  );
}

export function FormKontak({
  telepon,
  email,
}: {
  telepon: string | null;
  email: string | null;
}) {
  const [status, aksi] = useActionState(ubahKontak, AWAL);

  return (
    <form action={aksi} className="space-y-4 p-5">
      {status.galat ? <Peringatan nada="galat">{status.galat}</Peringatan> : null}
      {status.ok ? <Peringatan nada="sukses">{status.ok}</Peringatan> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang label="Nomor telepon">
          <Input name="telepon" defaultValue={telepon ?? ""} placeholder="08xxxxxxxxxx" />
        </Bidang>
        <Bidang label="Surel">
          <Input
            name="email"
            type="email"
            defaultValue={email ?? ""}
            placeholder="nama@contoh.com"
          />
        </Bidang>
      </div>

      <Kirim label="Simpan kontak" ikon={<Save size={16} />} />
    </form>
  );
}

export function FormKataSandi() {
  const [status, aksi] = useActionState(ubahKataSandi, AWAL);

  return (
    <form action={aksi} className="space-y-4 p-5">
      {status.galat ? <Peringatan nada="galat">{status.galat}</Peringatan> : null}
      {status.ok ? <Peringatan nada="sukses">{status.ok}</Peringatan> : null}

      <InputSandi
        label="Kata sandi lama"
        name="lama"
        autoComplete="current-password"
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputSandi
          label="Kata sandi baru"
          petunjuk="Minimal 8 karakter."
          name="baru"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <InputSandi
          label="Ulangi kata sandi baru"
          name="ulangi"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <Kirim label="Ubah kata sandi" ikon={<KeyRound size={16} />} />
    </form>
  );
}
