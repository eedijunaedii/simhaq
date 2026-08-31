import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, Plus } from "lucide-react";
import {
  Kartu,
  Kosong,
  JudulHalaman,
  KartuStat,
  Lencana,
  TautanBaris,
  TautanTombol,
  Tabel,
  Td,
  Th,
  TrTautan,
} from "@/components/ui";
import {
  JENIS_IZIN_LABEL,
  ROLE,
  STATUS_IZIN_LABEL,
  STATUS_IZIN_STYLE,
} from "@/lib/constants";
import { redirect } from "next/navigation";
import { filterGender, wajibLogin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtTanggalJam, fmtTanggalPendek, selisihManusiawi } from "@/lib/tanggal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Perizinan" };
export const dynamic = "force-dynamic";

const TAB = [
  { kunci: "menunggu", label: "Menunggu", status: ["DIAJUKAN", "DIPROSES"] },
  { kunci: "berjalan", label: "Berjalan", status: ["DISETUJUI"] },
  { kunci: "selesai", label: "Selesai", status: ["SELESAI"] },
  { kunci: "ditolak", label: "Ditolak", status: ["DITOLAK", "DIBATALKAN"] },
  { kunci: "semua", label: "Semua", status: [] },
];

export default async function HalamanIzin(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sesi = await wajibLogin();
  // Petugas keamanan tidak berkepentingan dengan alasan izin santri; ia hanya
  // perlu tahu siapa yang sedang di luar dan sampai kapan.
  if (sesi.role === ROLE.PETUGAS) redirect("/gerbang");
  const { tab } = await props.searchParams;
  const { gender } = filterGender(sesi);
  const santri = sesi.role === ROLE.SANTRI;

  const aktif = TAB.find((t) => t.kunci === tab) ?? TAB[santri ? 4 : 0];

  const whereDasar = santri
    ? { santriId: sesi.santriId! }
    : gender
      ? { santri: { user: { gender } } }
      : {};

  const [daftar, hitung] = await Promise.all([
    prisma.izin.findMany({
      where: {
        ...whereDasar,
        ...(aktif.status.length > 0 ? { status: { in: aktif.status } } : {}),
      },
      select: {
        id: true,
        kode: true,
        jenis: true,
        mulai: true,
        selesai: true,
        status: true,
        alasan: true,
        terlambatKembali: true,
        waktuKembali: true,
        _count: { select: { lampiran: true } },
        santri: {
          select: {
            id: true,
            user: { select: { nama: true } },
            halaqah: { select: { nama: true } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    prisma.izin.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: whereDasar,
    }),
  ]);

  const perStatus: Record<string, number> = {};
  for (const h of hitung) perStatus[h.status] = h._count._all;

  const menunggu = (perStatus.DIAJUKAN ?? 0) + (perStatus.DIPROSES ?? 0);
  const berjalan = perStatus.DISETUJUI ?? 0;

  return (
    <>
      <JudulHalaman
        judul="Perizinan"
        keterangan={
          santri
            ? "Riwayat pengajuan izin Anda beserta status persetujuannya."
            : "Pengajuan izin santri binaan. Izin yang disetujui otomatis menutup sesi presensi pada rentang waktunya."
        }
        aksi={
          santri ? (
            <TautanTombol href="/izin/baru">
              <Plus size={16} />
              Ajukan izin
            </TautanTombol>
          ) : null
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat
          label="Menunggu keputusan"
          nilai={menunggu}
          nada={menunggu > 0 ? "waspada" : "netral"}
        />
        <KartuStat label="Sedang berjalan" nilai={berjalan} nada="netral" />
        <KartuStat label="Selesai" nilai={perStatus.SELESAI ?? 0} nada="baik" />
        <KartuStat
          label="Ditolak"
          nilai={perStatus.DITOLAK ?? 0}
          nada={(perStatus.DITOLAK ?? 0) > 0 ? "buruk" : "netral"}
        />
      </div>

      <Kartu>
        <div className="flex flex-wrap gap-1.5 border-b border-garis px-4 py-3">
          {TAB.map((t) => (
            <Link
              key={t.kunci}
              href={`/izin?tab=${t.kunci}`}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3.5 text-sm transition-colors duration-200",
                aktif.kunci === t.kunci
                  ? "bg-sukses/15 font-medium text-sukses"
                  : "text-redup hover:bg-lapis hover:text-teks"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {daftar.length === 0 ? (
          <Kosong
            judul="Tidak ada pengajuan"
            keterangan={
              santri
                ? "Ajukan izin bila Anda berhalangan mengikuti kegiatan wajib."
                : "Belum ada pengajuan izin pada kategori ini."
            }
            aksi={
              santri ? (
                <TautanTombol href="/izin/baru" ukuran="sm">
                  Ajukan izin
                </TautanTombol>
              ) : null
            }
          />
        ) : (
          <Tabel>
            <thead>
              <tr>
                {!santri ? <Th>Santri</Th> : null}
                <Th>Jenis & alasan</Th>
                <Th className="hidden md:table-cell">Rentang waktu</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((z) => (
                <TrTautan key={z.id}>
                  {/*
                    Satu tautan per baris, direntangkan menutupi seluruh baris.
                    Sebelumnya ada dua tautan menuju tujuan yang sama di baris
                    yang sama — membingungkan bagi pembaca layar — dan sisa
                    barisnya tidak dapat diklik sama sekali.
                  */}
                  {!santri ? (
                    <Td>
                      <TautanBaris
                        href={`/izin/${z.id}`}
                        aria-label={`Buka izin ${z.kode} atas nama ${z.santri.user.nama}`}
                        className="inline-block -my-1 py-1"
                      >
                        {z.santri.user.nama}
                      </TautanBaris>
                      <span className="block text-xs text-samar">
                        {z.santri.halaqah?.nama ?? "-"}
                      </span>
                    </Td>
                  ) : null}
                  <Td>
                    {santri ? (
                      <TautanBaris
                        href={`/izin/${z.id}`}
                        aria-label={`Buka izin ${z.kode}`}
                        className="block"
                      >
                        {JENIS_IZIN_LABEL[z.jenis]}
                      </TautanBaris>
                    ) : (
                      <span className="block font-medium text-teks">
                        {JENIS_IZIN_LABEL[z.jenis]}
                      </span>
                    )}
                    {z._count.lampiran > 0 ? (
                      <span className="text-xs font-normal text-aksen">
                        {z._count.lampiran} lampiran
                      </span>
                    ) : null}
                    <span className="line-clamp-1 block max-w-md text-xs text-redup">
                      {z.kode} · {z.alasan}
                    </span>
                  </Td>
                  <Td className="hidden text-xs text-redup md:table-cell">
                    {fmtTanggalPendek(z.mulai)} – {fmtTanggalPendek(z.selesai)}
                    <span className="block text-[11px] text-samar">
                      {z.status === "DISETUJUI"
                        ? `berakhir ${selisihManusiawi(z.selesai)}`
                        : fmtTanggalJam(z.mulai)}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <Lencana className={STATUS_IZIN_STYLE[z.status]}>
                      {STATUS_IZIN_LABEL[z.status]}
                    </Lencana>
                    {z.terlambatKembali ? (
                      <span className="mt-1 flex items-center justify-end gap-1 text-[11px] text-waspada">
                        <AlertTriangle size={11} />
                        Telat kembali
                      </span>
                    ) : null}
                  </Td>
                </TrTautan>
              ))}
            </tbody>
          </Tabel>
        )}
      </Kartu>

      {!santri ? (
        <Kartu className="mt-6 p-5">
          <p className="text-xs leading-relaxed text-redup">
            Izin yang batas waktunya sudah lewat namun kepulangannya belum
            dikonfirmasi petugas gerbang muncul sebagai daftar tugas pada halaman
            Pengawasan — bukan sebagai pelanggaran, karena belum tentu santrinya
            yang terlambat.
          </p>
        </Kartu>
      ) : null}
    </>
  );
}
