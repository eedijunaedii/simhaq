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

export const metadata: Metadata = { title: "Detail Kelas" };
export const dynamic = "force-dynamic";

export default async function HalamanDetailKelas(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const pengguna = await wajibPengurus();

  const kelas = await prisma.kelas.findUnique({
    where: { id },
    select: {
      id: true,
      nama: true,
      gender: true,
      deskripsi: true,
      pembina: { select: { nama: true, telepon: true } },
      _count: { select: { santri: true, sesi: true } },
    },
  });

  if (!kelas) notFound();
  if (!genderYangBolehDiakses(pengguna).includes(kelas.gender)) redirect("/kelas");

  const anggota = await rekapPerSantri({ kelasId: kelas.id });
  const totalHadir = anggota.reduce((s, a) => s + a.hadir + a.terlambat, 0);
  const totalCatatan = anggota.reduce((s, a) => s + a.total, 0);
  const rerata = persen(totalHadir, totalCatatan);
  const perlu = anggota.filter((a) => a.total > 0 && a.persen < AMBANG_PEMBINAAN);

  return (
    <>
      <Link
        href="/kelas"
        className="mb-4 inline-flex items-center gap-2 text-sm text-redup transition hover:text-teks"
      >
        <ArrowLeft size={16} />
        Kelas
      </Link>

      <JudulHalaman
        judul={kelas.nama}
        keterangan={
          kelas.deskripsi ??
          `Kelompok binaan ${GENDER_LABEL[kelas.gender]} bersama ${
            kelas.pembina?.nama ?? "pembina"
          }.`
        }
        aksi={<Lencana>{GENDER_LABEL[kelas.gender]}</Lencana>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat label="Anggota" nilai={kelas._count.santri} />
        <KartuStat
          label="Rerata kehadiran"
          nilai={rerata}
          satuan="%"
          nada={rerata >= 90 ? "baik" : rerata >= AMBANG_PEMBINAAN ? "netral" : "waspada"}
        />
        <KartuStat label="Sesi kelas" nilai={kelas._count.sesi} />
        <KartuStat
          label="Perlu pembinaan"
          nilai={perlu.length}
          nada={perlu.length > 0 ? "buruk" : "baik"}
        />
      </div>

      <Kartu>
        <KepalaKartu
          judul="Anggota kelas"
          keterangan={`Pembina: ${kelas.pembina?.nama ?? "-"}${
            kelas.pembina?.telepon ? ` · ${kelas.pembina.telepon}` : ""
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
                        <span className="font-medium text-teks group-hover:text-aksen">
                          {a.nama}
                        </span>
                      </Link>
                    </Td>
                    <Td className="hidden text-sekunder md:table-cell">
                      {a.kampus}
                    </Td>
                    <Td className="text-center text-sekunder">
                      {a.hadir + a.terlambat}
                    </Td>
                    <Td className="text-center text-info/80">{a.izin + a.sakit}</Td>
                    <Td className="text-center text-bahaya/80">{a.alfa}</Td>
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
