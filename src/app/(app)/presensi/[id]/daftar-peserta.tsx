"use client";

import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input, Lencana, Select, Tabel, Td, Th, Tr } from "@/components/ui";
import {
  METODE_PRESENSI_LABEL,
  STATUS_PRESENSI_LABEL,
  STATUS_PRESENSI_STYLE,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { setPresensiManual } from "../aksi";

export type BarisPeserta = {
  santriId: string;
  nama: string;
  nim: string;
  kampus: string;
  kelas: string | null;
  kamar: string | null;
  status: string | null;
  metode: string | null;
  waktuScan: string | null;
  catatan: string | null;
};

const PILIHAN = ["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "ALFA"];

export function DaftarPeserta({
  sesiId,
  peserta,
  bolehUbah,
}: {
  sesiId: string;
  peserta: BarisPeserta[];
  bolehUbah: boolean;
}) {
  const [cari, setCari] = useState("");
  const [saring, setSaring] = useState("SEMUA");
  const [menunggu, mulai] = useTransition();
  const [sedang, setSedang] = useState<string | null>(null);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return peserta.filter((p) => {
      const cocokCari =
        !q ||
        p.nama.toLowerCase().includes(q) ||
        p.nim.includes(q) ||
        p.kampus.toLowerCase().includes(q);
      const cocokSaring =
        saring === "SEMUA"
          ? true
          : saring === "BELUM"
            ? !p.status
            : p.status === saring;
      return cocokCari && cocokSaring;
    });
  }, [peserta, cari, saring]);

  function ubah(santriId: string, status: string) {
    setSedang(santriId);
    mulai(async () => {
      await setPresensiManual(sesiId, santriId, status);
      setSedang(null);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-garis px-5 py-4">
        <div className="relative min-w-52 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-samar"
          />
          <Input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama, NIM, atau kampus..."
            className="pl-10"
          />
        </div>
        <Select
          value={saring}
          onChange={(e) => setSaring(e.target.value)}
          className="w-auto min-w-40"
        >
          <option value="SEMUA">Semua status</option>
          <option value="BELUM">Belum tercatat</option>
          {PILIHAN.map((s) => (
            <option key={s} value={s}>
              {STATUS_PRESENSI_LABEL[s]}
            </option>
          ))}
        </Select>
        <span className="text-sm text-redup">
          {tampil.length} dari {peserta.length}
        </span>
      </div>

      <Tabel>
        <thead>
          <tr>
            <Th>Santri</Th>
            <Th className="hidden md:table-cell">Kelas / Kamar</Th>
            <Th className="hidden sm:table-cell">Metode</Th>
            <Th>Status</Th>
            {bolehUbah ? <Th className="text-right">Ubah</Th> : null}
          </tr>
        </thead>
        <tbody>
          {tampil.map((p) => (
            <Tr key={p.santriId} className={cn(sedang === p.santriId && "opacity-50")}>
              <Td>
                <span className="block font-medium text-teks">{p.nama}</span>
                <span className="block text-xs text-samar">
                  {p.nim} · {p.kampus}
                </span>
              </Td>
              <Td className="hidden text-xs text-redup md:table-cell">
                {p.kelas ?? "-"}
                {p.kamar ? ` · ${p.kamar}` : ""}
              </Td>
              <Td className="hidden text-xs text-redup sm:table-cell">
                {p.metode ? METODE_PRESENSI_LABEL[p.metode] : "—"}
                {p.waktuScan ? (
                  <span className="block text-[11px] text-samar">
                    {p.waktuScan}
                  </span>
                ) : null}
              </Td>
              <Td>
                {p.status ? (
                  <Lencana className={STATUS_PRESENSI_STYLE[p.status]}>
                    {STATUS_PRESENSI_LABEL[p.status]}
                  </Lencana>
                ) : (
                  <Lencana className="bg-lapis text-samar ring-garis">
                    Belum tercatat
                  </Lencana>
                )}
              </Td>
              {bolehUbah ? (
                <Td className="text-right">
                  <Select
                    value={p.status ?? ""}
                    disabled={menunggu}
                    onChange={(e) => ubah(p.santriId, e.target.value)}
                    className="ml-auto w-auto min-w-32 py-1.5 text-xs"
                  >
                    <option value="" disabled>
                      Pilih...
                    </option>
                    {PILIHAN.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_PRESENSI_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </Td>
              ) : null}
            </Tr>
          ))}
          {tampil.length === 0 ? (
            <tr>
              <td
                colSpan={bolehUbah ? 5 : 4}
                className="px-5 py-12 text-center text-sm text-samar"
              >
                Tidak ada santri yang cocok dengan penyaringan.
              </td>
            </tr>
          ) : null}
        </tbody>
      </Tabel>
    </div>
  );
}
