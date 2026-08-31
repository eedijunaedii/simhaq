import Link from "next/link";
import type { Metadata } from "next";
import { Plus, QrCode } from "lucide-react";
import {
  Kartu,
  KepalaKartu,
  Kosong,
  JudulHalaman,
  Lencana,
  TautanTombol,
  Tabel,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { GENDER_LABEL, STATUS_SESI_LABEL } from "@/lib/constants";
import { genderYangBolehDiakses, wajibPengurus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tutupSesiKedaluwarsa } from "@/lib/presensi";
import { akhirHari, awalHari, fmtJam, fmtTanggal, fmtTanggalPendek } from "@/lib/tanggal";
import { cn, persen, warnaKehadiran } from "@/lib/utils";

export const metadata: Metadata = { title: "Sesi Presensi" };
export const dynamic = "force-dynamic";

export default async function HalamanPresensi() {
  const pengguna = await wajibPengurus();
  const genderBoleh = genderYangBolehDiakses(pengguna);

  // Sesi yang sudah lewat waktunya ditutup otomatis.
  await tutupSesiKedaluwarsa();

  const [terbuka, hariIni, riwayat] = await Promise.all([
    prisma.sesiPresensi.findMany({
      where: { status: "DIBUKA", gender: { in: genderBoleh } },
      select: pilihanSesi,
      orderBy: { waktuBuka: "desc" },
    }),
    prisma.sesiPresensi.findMany({
      where: {
        gender: { in: genderBoleh },
        tanggal: { gte: awalHari(), lte: akhirHari() },
        status: { not: "DIBUKA" },
      },
      select: pilihanSesi,
      orderBy: { waktuBuka: "desc" },
    }),
    prisma.sesiPresensi.findMany({
      where: {
        gender: { in: genderBoleh },
        tanggal: { lt: awalHari() },
      },
      select: pilihanSesi,
      orderBy: { waktuBuka: "desc" },
      take: 30,
    }),
  ]);

  return (
    <>
      <JudulHalaman
        judul="Sesi presensi"
        keterangan="Buka sesi untuk menampilkan QR dinamis, pantau kehadiran, lalu tutup sesi bila kegiatan selesai."
        aksi={
          <TautanTombol href="/presensi/buka">
            <Plus size={16} />
            Buka sesi
          </TautanTombol>
        }
      />

      <div className="space-y-6">
        <Kartu>
          <KepalaKartu
            judul="Sedang berlangsung"
            keterangan={
              terbuka.length > 0
                ? `${terbuka.length} sesi menerima pemindaian`
                : "Tidak ada sesi yang sedang dibuka"
            }
          />
          {terbuka.length === 0 ? (
            <Kosong
              judul="Belum ada sesi terbuka"
              keterangan="Buka sesi presensi untuk kegiatan yang sedang berlangsung."
              aksi={
                <TautanTombol href="/presensi/buka" ukuran="sm">
                  <QrCode size={15} />
                  Buka sesi
                </TautanTombol>
              }
            />
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {terbuka.map((s) => (
                <Link
                  key={s.id}
                  href={`/presensi/${s.id}`}
                  className="cursor-pointer rounded-2xl border border-aksen/30 bg-sukses/[0.07] p-5 transition-colors duration-200 hover:border-aksen/60 hover:bg-sukses/[0.13]"
                >
                  <div className="flex items-center gap-2 text-xs text-sukses">
                    <span className="denyut inline-block size-1.5 rounded-full bg-sukses" />
                    Sesi dibuka
                  </div>
                  <p className="mt-2.5 font-semibold text-teks">{s.kegiatan.nama}</p>
                  <p className="mt-0.5 text-xs text-redup">
                    {GENDER_LABEL[s.gender]}
                    {s.halaqah ? ` · ${s.halaqah.nama}` : ""}
                  </p>
                  <p className="mt-3 text-xs text-redup">
                    Tutup {fmtJam(s.waktuTutup)} · {s._count.presensi} tercatat
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Kartu>

        <BagianTabel judul="Sesi hari ini" keterangan={fmtTanggal(new Date())} data={hariIni} />
        <BagianTabel
          judul="Riwayat sesi"
          keterangan="30 sesi terakhir"
          data={riwayat}
          tampilkanTanggal
        />
      </div>
    </>
  );
}

const pilihanSesi = {
  id: true,
  gender: true,
  status: true,
  tanggal: true,
  waktuBuka: true,
  waktuTutup: true,
  kegiatan: { select: { nama: true } },
  halaqah: { select: { nama: true } },
  _count: { select: { presensi: true } },
  presensi: { select: { status: true } },
} as const;

type BarisSesi = {
  id: string;
  gender: string;
  status: string;
  tanggal: Date;
  waktuBuka: Date;
  waktuTutup: Date;
  kegiatan: { nama: string };
  halaqah: { nama: string } | null;
  _count: { presensi: number };
  presensi: { status: string }[];
};

function BagianTabel({
  judul,
  keterangan,
  data,
  tampilkanTanggal,
}: {
  judul: string;
  keterangan: string;
  data: BarisSesi[];
  tampilkanTanggal?: boolean;
}) {
  return (
    <Kartu>
      <KepalaKartu judul={judul} keterangan={keterangan} />
      {data.length === 0 ? (
        <Kosong judul="Belum ada sesi" />
      ) : (
        <Tabel>
          <thead>
            <tr>
              <Th>Kegiatan</Th>
              {tampilkanTanggal ? <Th className="hidden sm:table-cell">Tanggal</Th> : null}
              <Th className="hidden md:table-cell">Waktu</Th>
              <Th className="hidden lg:table-cell">Kelompok</Th>
              <Th className="text-center">Tercatat</Th>
              <Th className="text-right">Kehadiran</Th>
              <Th className="text-right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => {
              const hadir = s.presensi.filter(
                (p) => p.status === "HADIR" || p.status === "TERLAMBAT"
              ).length;
              const p = persen(hadir, s.presensi.length);
              return (
                <Tr key={s.id}>
                  <Td>
                    <Link
                      href={`/presensi/${s.id}`}
                      className="inline-block -my-1 py-1 font-medium text-teks transition-colors duration-150 hover:text-aksen"
                    >
                      {s.kegiatan.nama}
                    </Link>
                  </Td>
                  {tampilkanTanggal ? (
                    <Td className="hidden text-redup sm:table-cell">
                      {fmtTanggalPendek(s.tanggal)}
                    </Td>
                  ) : null}
                  <Td className="hidden text-redup md:table-cell">
                    {fmtJam(s.waktuBuka)} – {fmtJam(s.waktuTutup)}
                  </Td>
                  <Td className="hidden text-redup lg:table-cell">
                    {GENDER_LABEL[s.gender]}
                    {s.halaqah ? ` · ${s.halaqah.nama}` : ""}
                  </Td>
                  <Td className="text-center text-sekunder">
                    {s._count.presensi}
                  </Td>
                  <Td className="text-right">
                    <span className={cn("font-semibold", warnaKehadiran(p))}>
                      {s.presensi.length > 0 ? `${p}%` : "—"}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <Lencana
                      className={
                        s.status === "DIBUKA"
                          ? "bg-sukses/15 text-sukses ring-sukses/30"
                          : s.status === "DIBATALKAN"
                            ? "bg-bahaya/15 text-bahaya ring-bahaya/30"
                            : "bg-lapis-naik text-sekunder ring-garis"
                      }
                    >
                      {STATUS_SESI_LABEL[s.status]}
                    </Lencana>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Tabel>
      )}
    </Kartu>
  );
}
