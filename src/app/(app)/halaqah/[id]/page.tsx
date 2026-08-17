import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Avatar,
  Kartu,
  KartuStat,
  KepalaKartu,
  Kosong,
  JudulHalaman,
  Lencana,
  Tabel,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { AMBANG_PEMBINAAN, GENDER_LABEL } from "@/lib/constants";
import { genderYangBolehDiakses, wajibPengurus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rekapPerSantri } from "@/lib/rekap";
import { cn, persen, warnaKehadiran } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail Halaqah" };
export const dynamic = "force-dynamic";

export default async function HalamanDetailHalaqah(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const pengguna = await wajibPengurus();

  const halaqah = await prisma.halaqah.findUnique({
    where: { id },
    select: {
      id: true,
      nama: true,
      gender: true,
      deskripsi: true,
      musyrif: { select: { nama: true, telepon: true } },
      _count: { select: { santri: true, sesi: true } },
    },
  });

  if (!halaqah) notFound();
  if (!genderYangBolehDiakses(pengguna).includes(halaqah.gender)) redirect("/halaqah");

  const anggota = await rekapPerSantri({ halaqahId: halaqah.id });
  const totalHadir = anggota.reduce((s, a) => s + a.hadir + a.terlambat, 0);
  const totalCatatan = anggota.reduce((s, a) => s + a.total, 0);
  const rerata = persen(totalHadir, totalCatatan);
  const perlu = anggota.filter((a) => a.total > 0 && a.persen < AMBANG_PEMBINAAN);

  return (
    <>
      <Link
        href="/halaqah"
        className="mb-4 inline-flex items-center gap-2 text-sm text-emerald-100/55 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Halaqah
      </Link>

      <JudulHalaman
        judul={halaqah.nama}
        keterangan={
          halaqah.deskripsi ??
          `Kelompok binaan ${GENDER_LABEL[halaqah.gender]} bersama ${
            halaqah.musyrif?.nama ?? "musyrif"
          }.`
        }
        aksi={<Lencana>{GENDER_LABEL[halaqah.gender]}</Lencana>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat label="Anggota" nilai={halaqah._count.santri} />
        <KartuStat
          label="Rerata kehadiran"
          nilai={rerata}
          satuan="%"
          nada={rerata >= 90 ? "baik" : rerata >= AMBANG_PEMBINAAN ? "netral" : "waspada"}
        />
        <KartuStat label="Sesi halaqah" nilai={halaqah._count.sesi} />
        <KartuStat
          label="Perlu pembinaan"
          nilai={perlu.length}
          nada={perlu.length > 0 ? "buruk" : "baik"}
        />
      </div>

      <Kartu>
        <KepalaKartu
          judul="Anggota halaqah"
          keterangan={`Musyrif: ${halaqah.musyrif?.nama ?? "-"}${
            halaqah.musyrif?.telepon ? ` · ${halaqah.musyrif.telepon}` : ""
          }`}
        />
        {anggota.length === 0 ? (
          <Kosong judul="Belum ada anggota" />
        ) : (
          <Tabel>
            <thead>
              <tr>
                <Th>Santri</Th>
                <Th className="hidden md:table-cell">Kampus</Th>
                <Th className="text-center">Hadir</Th>
                <Th className="text-center">Izin</Th>
                <Th className="text-center">Alfa</Th>
                <Th className="text-right">Kehadiran</Th>
              </tr>
            </thead>
            <tbody>
              {[...anggota]
                .sort((a, b) => b.persen - a.persen)
                .map((a) => (
                  <Tr key={a.santriId}>
                    <Td>
                      <Link
                        href={`/santri/${a.santriId}`}
                        className="group flex items-center gap-3"
                      >
                        <Avatar nama={a.nama} ukuran={32} />
                        <span className="font-medium text-white group-hover:text-emerald-300">
                          {a.nama}
                        </span>
                      </Link>
                    </Td>
                    <Td className="hidden text-emerald-100/60 md:table-cell">
                      {a.kampus}
                    </Td>
                    <Td className="text-center text-emerald-100/70">
                      {a.hadir + a.terlambat}
                    </Td>
                    <Td className="text-center text-sky-300/80">{a.izin + a.sakit}</Td>
                    <Td className="text-center text-rose-300/80">{a.alfa}</Td>
                    <Td className="text-right">
                      <span className={cn("font-semibold", warnaKehadiran(a.persen))}>
                        {a.total > 0 ? `${a.persen}%` : "—"}
                      </span>
                    </Td>
                  </Tr>
                ))}
            </tbody>
          </Tabel>
        )}
      </Kartu>
    </>
  );
}
