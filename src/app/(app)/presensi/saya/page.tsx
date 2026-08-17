import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BatangProgres,
  Kartu,
  KepalaKartu,
  Kosong,
  JudulHalaman,
  KartuStat,
  Lencana,
  Tabel,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import {
  METODE_PRESENSI_LABEL,
  ROLE,
  STATUS_PRESENSI_LABEL,
  STATUS_PRESENSI_STYLE,
} from "@/lib/constants";
import { wajibLogin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rekapSantri } from "@/lib/rekap";
import { fmtJam, fmtTanggalPendek } from "@/lib/tanggal";
import { cn, warnaKehadiran } from "@/lib/utils";

export const metadata: Metadata = { title: "Presensi Saya" };
export const dynamic = "force-dynamic";

export default async function HalamanPresensiSaya() {
  const sesi = await wajibLogin();
  if (sesi.role !== ROLE.SANTRI || !sesi.santriId) redirect("/presensi");

  const [rekap, riwayat] = await Promise.all([
    rekapSantri(sesi.santriId),
    prisma.presensi.findMany({
      where: { santriId: sesi.santriId },
      select: {
        id: true,
        status: true,
        metode: true,
        waktuScan: true,
        catatan: true,
        izin: { select: { kode: true } },
        sesi: {
          select: {
            tanggal: true,
            waktuBuka: true,
            kegiatan: { select: { nama: true } },
            halaqah: { select: { nama: true } },
          },
        },
      },
      orderBy: [{ sesi: { waktuBuka: "desc" } }],
      take: 120,
    }),
  ]);

  return (
    <>
      <JudulHalaman
        judul="Presensi saya"
        keterangan="Riwayat kehadiran Anda pada kegiatan wajib pesantren, 30 hari terakhir dirangkum di bawah ini."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat
          label="Kehadiran 30 hari"
          nilai={rekap.persen}
          satuan="%"
          nada={rekap.persen >= 90 ? "baik" : rekap.persen >= 75 ? "netral" : "waspada"}
        />
        <KartuStat label="Hadir" nilai={rekap.perStatus.HADIR ?? 0} nada="baik" />
        <KartuStat
          label="Terlambat"
          nilai={rekap.perStatus.TERLAMBAT ?? 0}
          nada={(rekap.perStatus.TERLAMBAT ?? 0) > 3 ? "waspada" : "netral"}
        />
        <KartuStat
          label="Tanpa keterangan"
          nilai={rekap.perStatus.ALFA ?? 0}
          nada={(rekap.perStatus.ALFA ?? 0) > 0 ? "buruk" : "baik"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Kartu>
          <KepalaKartu
            judul="Riwayat presensi"
            keterangan={`${riwayat.length} catatan terakhir`}
          />
          {riwayat.length === 0 ? (
            <Kosong judul="Belum ada catatan presensi" />
          ) : (
            <Tabel>
              <thead>
                <tr>
                  <Th>Kegiatan</Th>
                  <Th className="hidden sm:table-cell">Tanggal</Th>
                  <Th className="hidden md:table-cell">Metode</Th>
                  <Th className="text-right">Status</Th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <span className="block font-medium text-white">
                        {p.sesi.kegiatan.nama}
                      </span>
                      {p.sesi.halaqah ? (
                        <span className="block text-xs text-emerald-100/40">
                          {p.sesi.halaqah.nama}
                        </span>
                      ) : null}
                    </Td>
                    <Td className="hidden text-emerald-100/60 sm:table-cell">
                      {fmtTanggalPendek(p.sesi.tanggal)}
                      {p.waktuScan ? (
                        <span className="block text-xs text-emerald-100/35">
                          {fmtJam(p.waktuScan)}
                        </span>
                      ) : null}
                    </Td>
                    <Td className="hidden text-xs text-emerald-100/50 md:table-cell">
                      {METODE_PRESENSI_LABEL[p.metode] ?? p.metode}
                      {p.izin ? (
                        <span className="block text-[11px] text-emerald-100/35">
                          {p.izin.kode}
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-right">
                      <Lencana className={STATUS_PRESENSI_STYLE[p.status]}>
                        {STATUS_PRESENSI_LABEL[p.status]}
                      </Lencana>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabel>
          )}
        </Kartu>

        <Kartu className="self-start">
          <KepalaKartu judul="Per kegiatan" keterangan="30 hari terakhir" />
          <div className="space-y-3.5 p-5">
            {rekap.perKegiatan.length === 0 ? (
              <p className="py-6 text-center text-sm text-emerald-100/40">
                Belum ada data.
              </p>
            ) : (
              rekap.perKegiatan.map((k) => (
                <div key={k.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-emerald-50/90">{k.nama}</span>
                    <span className={cn("font-semibold", warnaKehadiran(k.persen))}>
                      {k.persen}%
                    </span>
                  </div>
                  <BatangProgres nilai={k.persen} />
                  <p className="mt-1 text-[11px] text-emerald-100/35">
                    {k.hadir} dari {k.total}
                  </p>
                </div>
              ))
            )}
          </div>
        </Kartu>
      </div>
    </>
  );
}
