import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, Users } from "lucide-react";
import {
  BatangProgres,
  Kartu,
  Kosong,
  JudulHalaman,
  Lencana,
} from "@/components/ui";
import { GENDER_LABEL } from "@/lib/constants";
import { filterGender, wajibPengurus } from "@/lib/auth";
import { rekapPerHalaqah } from "@/lib/rekap";
import { cn, warnaKehadiran } from "@/lib/utils";

export const metadata: Metadata = { title: "Halaqah" };
export const dynamic = "force-dynamic";

export default async function HalamanHalaqah() {
  const pengguna = await wajibPengurus();
  const { gender } = filterGender(pengguna);
  const daftar = await rekapPerHalaqah({ gender });

  return (
    <>
      <JudulHalaman
        judul="Halaqah"
        keterangan="Kelompok binaan santri beserta musyrif pendampingnya. Persentase dihitung dari 30 hari terakhir."
      />

      {daftar.length === 0 ? (
        <Kartu>
          <Kosong
            judul="Belum ada halaqah"
            keterangan="Admin dapat menambahkan kelompok halaqah pada pengaturan data induk."
          />
        </Kartu>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {daftar.map((h) => (
            <Link key={h.id} href={`/halaqah/${h.id}`}>
              <Kartu className="h-full p-5 transition hover:bg-white/[0.09]">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
                    <BookOpen size={18} />
                  </span>
                  <Lencana>{GENDER_LABEL[h.gender]}</Lencana>
                </div>

                <h2 className="mt-3.5 font-semibold text-white">{h.nama}</h2>
                <p className="mt-0.5 text-sm text-redup">
                  Musyrif {h.musyrif}
                </p>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-redup">
                      <Users size={13} />
                      {h.jumlahSantri} santri
                    </span>
                    <span className={cn("font-semibold", warnaKehadiran(h.persen))}>
                      {h.total > 0 ? `${h.persen}%` : "—"}
                    </span>
                  </div>
                  <BatangProgres nilai={h.persen} />
                </div>

                <div className="mt-3 flex gap-4 text-xs text-samar">
                  <span>Hadir {h.hadir}</span>
                  <span>Izin {h.izin}</span>
                  <span>Alfa {h.alfa}</span>
                </div>
              </Kartu>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
