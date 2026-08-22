"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FileSpreadsheet, FileText, Filter } from "lucide-react";
import { Bidang, Input, Select, Tombol } from "@/components/ui";

export function Penyaring({
  halaqah,
  kegiatan,
}: {
  halaqah: { id: string; nama: string }[];
  kegiatan: { id: string; nama: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const query = sp.toString();
  const hari = sp.get("hari") ?? "30";

  function terapkan(data: FormData) {
    const p = new URLSearchParams();
    const mulai = String(data.get("mulai") ?? "");
    const selesai = String(data.get("selesai") ?? "");
    const h = String(data.get("hari") ?? "");
    const halaqahId = String(data.get("halaqah") ?? "");
    const kegiatanId = String(data.get("kegiatan") ?? "");

    if (mulai && selesai) {
      p.set("mulai", mulai);
      p.set("selesai", selesai);
    } else if (h) {
      p.set("hari", h);
    }
    if (halaqahId) p.set("halaqah", halaqahId);
    if (kegiatanId) p.set("kegiatan", kegiatanId);

    router.push(`/laporan?${p.toString()}`);
  }

  return (
    <form action={terapkan} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-6">
      <Bidang label="Periode cepat" className="lg:col-span-1">
        <Select name="hari" defaultValue={hari}>
          <option value="7">7 hari</option>
          <option value="14">14 hari</option>
          <option value="30">30 hari</option>
          <option value="90">90 hari</option>
          <option value="180">6 bulan</option>
        </Select>
      </Bidang>

      <Bidang label="Dari tanggal">
        <Input type="date" name="mulai" defaultValue={sp.get("mulai") ?? ""} />
      </Bidang>
      <Bidang label="Sampai tanggal">
        <Input type="date" name="selesai" defaultValue={sp.get("selesai") ?? ""} />
      </Bidang>

      <Bidang label="Halaqah">
        <Select name="halaqah" defaultValue={sp.get("halaqah") ?? ""}>
          <option value="">Semua halaqah</option>
          {halaqah.map((h) => (
            <option key={h.id} value={h.id}>
              {h.nama}
            </option>
          ))}
        </Select>
      </Bidang>

      <Bidang label="Kegiatan">
        <Select name="kegiatan" defaultValue={sp.get("kegiatan") ?? ""}>
          <option value="">Semua kegiatan</option>
          {kegiatan.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </Select>
      </Bidang>

      <div className="flex items-end gap-2">
        <Tombol type="submit" className="w-full">
          <Filter size={15} />
          Terapkan
        </Tombol>
      </div>

      <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-6">
        <a
          href={`/api/laporan/excel?${query}`}
          className="inline-flex items-center gap-2 rounded-xl border border-kendali bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
        >
          <FileSpreadsheet size={15} />
          Unduh Excel
        </a>
        <a
          href={`/api/laporan/pdf?${query}`}
          className="inline-flex items-center gap-2 rounded-xl border border-kendali bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
        >
          <FileText size={15} />
          Unduh PDF
        </a>
      </div>
    </form>
  );
}
