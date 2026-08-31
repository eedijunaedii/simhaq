"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Paperclip, Send } from "lucide-react";
import { Bidang, Input, Peringatan, Select, Textarea, Tombol } from "@/components/ui";
import { JENIS_IZIN_LABEL } from "@/lib/constants";
import { nilaiDatetimeLocal } from "@/lib/tanggal";
import { ajukanIzin, type Hasil } from "../aksi";

const AWAL: Hasil = {};

function Kirim() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" ukuran="lg" disabled={pending} className="w-full">
      <Send size={16} />
      {pending ? "Mengirim..." : "Ajukan izin"}
    </Tombol>
  );
}

export function FormIzin() {
  const [status, aksi] = useActionState(ajukanIzin, AWAL);
  const [jenis, setJenis] = useState("KULIAH");
  const [namaBerkas, setNamaBerkas] = useState<string | null>(null);

  const sekarang = new Date();
  const nanti = new Date(sekarang.getTime() + 4 * 3_600_000);

  return (
    <form action={aksi} className="space-y-5">
      {status.galat ? <Peringatan nada="galat">{status.galat}</Peringatan> : null}

      <Bidang label="Jenis izin">
        <Select
          name="jenis"
          value={jenis}
          onChange={(e) => setJenis(e.target.value)}
          required
        >
          {Object.entries(JENIS_IZIN_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Bidang>

      <div className="grid gap-5 sm:grid-cols-2">
        <Bidang label="Mulai">
          <Input
            type="datetime-local"
            name="mulai"
            defaultValue={nilaiDatetimeLocal(sekarang)}
            required
          />
        </Bidang>
        <Bidang label="Selesai">
          <Input
            type="datetime-local"
            name="selesai"
            defaultValue={nilaiDatetimeLocal(nanti)}
            required
          />
        </Bidang>
      </div>

      <Bidang
        label="Tujuan / lokasi"
        petunjuk="Contoh: Laboratorium Teknik Kimia ITB, atau rumah orang tua di Garut."
      >
        <Input name="tujuan" placeholder="Ke mana Anda pergi?" />
      </Bidang>

      <Bidang
        label="Alasan"
        petunjuk="Jelaskan dengan ringkas dan jujur agar musyrif mudah menilai."
      >
        <Textarea
          name="alasan"
          rows={4}
          minLength={10}
          placeholder="Contoh: Praktikum Kimia Fisika sampai pukul 21.00, tidak dapat mengikuti kajian ba'da isya."
          required
        />
      </Bidang>

      <Bidang
        label="Lampiran bukti (opsional)"
        petunjuk="JPG, PNG, WebP, atau PDF. Maksimal 2 MB. Contoh: surat tugas, jadwal praktikum, surat dokter."
      >
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-kendali/60 bg-lapis px-4 py-3.5 text-sm text-sekunder transition hover:border-sukses/40 hover:bg-lapis">
          <Paperclip size={17} className="shrink-0 text-sukses" />
          <span className="truncate">{namaBerkas ?? "Pilih berkas..."}</span>
          <input
            type="file"
            name="lampiran"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => setNamaBerkas(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </Bidang>

      <Kirim />

      <p className="text-center text-xs leading-relaxed text-samar">
        Izin yang disetujui otomatis menutup seluruh sesi presensi pada rentang waktu
        tersebut, sehingga tidak lagi terhitung sebagai ketidakhadiran tanpa keterangan.
      </p>
    </form>
  );
}
