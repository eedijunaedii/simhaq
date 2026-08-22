import Link from "next/link";
import type { Metadata } from "next";
import { DoorOpen } from "lucide-react";
import {
  Kartu,
  KartuStat,
  KepalaKartu,
  Kosong,
  JudulHalaman,
  Lencana,
} from "@/components/ui";
import { GENDER_LABEL } from "@/lib/constants";
import { filterGender, wajibAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Kamar" };
export const dynamic = "force-dynamic";

export default async function HalamanKamar() {
  const pengguna = await wajibAdmin();
  const { gender } = filterGender(pengguna);

  const kamar = await prisma.kamar.findMany({
    where: gender ? { gender } : {},
    select: {
      id: true,
      nama: true,
      gedung: true,
      gender: true,
      kapasitas: true,
      lantai: true,
      santri: {
        select: { id: true, user: { select: { nama: true } } },
        orderBy: { user: { nama: "asc" } },
      },
    },
    orderBy: [{ gedung: "asc" }, { nama: "asc" }],
  });

  const perGedung = new Map<string, typeof kamar>();
  for (const k of kamar) {
    const arr = perGedung.get(k.gedung) ?? [];
    arr.push(k);
    perGedung.set(k.gedung, arr);
  }

  const totalHuni = kamar.reduce((s, k) => s + k.santri.length, 0);
  const totalKapasitas = kamar.reduce((s, k) => s + k.kapasitas, 0);

  return (
    <>
      <JudulHalaman
        judul="Kamar & asrama"
        keterangan="Pembagian kamar santri pada gedung asrama putra dan putri yang terpisah."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat label="Gedung asrama" nilai={perGedung.size} />
        <KartuStat label="Jumlah kamar" nilai={kamar.length} />
        <KartuStat label="Santri terhuni" nilai={totalHuni} />
        <KartuStat
          label="Daya tampung"
          nilai={totalKapasitas}
          keterangan={`Terisi ${
            totalKapasitas ? Math.round((totalHuni / totalKapasitas) * 100) : 0
          }%`}
        />
      </div>

      {kamar.length === 0 ? (
        <Kartu>
          <Kosong judul="Belum ada data kamar" />
        </Kartu>
      ) : (
        <div className="space-y-6">
          {[...perGedung.entries()].map(([gedung, daftar]) => (
            <Kartu key={gedung}>
              <KepalaKartu
                judul={gedung}
                keterangan={`${daftar.length} kamar · ${daftar.reduce(
                  (s, k) => s + k.santri.length,
                  0
                )} santri`}
                aksi={<Lencana>{GENDER_LABEL[daftar[0].gender]}</Lencana>}
              />
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {daftar.map((k) => (
                  <div
                    key={k.id}
                    className="rounded-xl border border-garis bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-medium text-white">
                        <DoorOpen size={15} className="text-emerald-300" />
                        {k.nama}
                      </span>
                      <span className="text-xs text-redup">
                        {k.santri.length}/{k.kapasitas}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-samar">
                      Lantai {k.lantai}
                    </p>
                    {k.santri.length === 0 ? (
                      <p className="mt-3 text-xs text-samar">Kosong</p>
                    ) : (
                      <ul className="mt-3 space-y-1">
                        {k.santri.map((s) => (
                          <li key={s.id}>
                            <Link
                              href={`/santri/${s.id}`}
                              className="inline-block -my-1 py-1 text-xs text-sekunder transition-colors duration-150 hover:text-aksen"
                            >
                              {s.user.nama}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Kartu>
          ))}
        </div>
      )}
    </>
  );
}
