import type { Metadata } from "next";
import { ShieldQuestion } from "lucide-react";
import { LogoTeks } from "@/components/logo";
import {
  BatangProgres,
  Kartu,
  KartuStat,
  KepalaKartu,
  Kosong,
  Lencana,
} from "@/components/ui";
import {
  APP,
  JENIS_IZIN_LABEL,
  STATUS_IZIN_LABEL,
  STATUS_IZIN_STYLE,
  STATUS_PRESENSI_LABEL,
  STATUS_PRESENSI_STYLE,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { rekapSantri } from "@/lib/rekap";
import { fmtTanggal, fmtTanggalPendek } from "@/lib/tanggal";
import { cn, warnaKehadiran } from "@/lib/utils";

export const metadata: Metadata = { title: "Rekap Kehadiran Santri" };
export const dynamic = "force-dynamic";

/**
 * Halaman wali santri: rekap kehadiran anak, dibuka lewat tautan bertoken
 * tanpa perlu membuat akun. Hanya menampilkan data yang relevan bagi wali.
 */
export default async function HalamanWali(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;

  const akses = await prisma.waliToken.findUnique({
    where: { token },
    select: {
      id: true,
      namaWali: true,
      hubungan: true,
      aktif: true,
      kadaluarsa: true,
      santri: {
        select: {
          id: true,
          nim: true,
          kampus: true,
          jurusan: true,
          user: { select: { nama: true } },
          halaqah: { select: { nama: true, musyrif: { select: { nama: true } } } },
          kamar: { select: { nama: true, gedung: true } },
        },
      },
    },
  });

  const sah =
    akses?.aktif && (!akses.kadaluarsa || akses.kadaluarsa > new Date());

  if (!akses || !sah) {
    return (
      <div id="konten" className="flex min-h-dvh items-center justify-center px-5">
        <Kartu className="max-w-md p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-lapis-naik text-redup">
            <ShieldQuestion size={28} />
          </span>
          {/* Cabang ini sebelumnya tidak punya tajuk sama sekali, sementara
              cabang token yang sah punya — jadi halaman yang sama bisa tampil
              tanpa penanda tingkat teratas bagi pembaca layar. */}
          <h1 className="mt-4 text-lg font-semibold text-teks">
            Tautan tidak berlaku
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-redup">
            Tautan ini sudah dicabut atau tidak dikenali. Silakan hubungi pengurus{" "}
            {APP.lembaga} di {APP.telepon}.
          </p>
        </Kartu>
      </div>
    );
  }

  await prisma.waliToken.update({
    where: { id: akses.id },
    data: { terakhirDibuka: new Date() },
  });

  const santri = akses.santri;
  const [rekap, presensi, izin] = await Promise.all([
    rekapSantri(santri.id),
    prisma.presensi.findMany({
      where: { santriId: santri.id },
      select: {
        id: true,
        status: true,
        sesi: {
          select: { tanggal: true, kegiatan: { select: { nama: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.izin.findMany({
      where: { santriId: santri.id, status: { in: ["DISETUJUI", "SELESAI"] } },
      select: {
        id: true,
        jenis: true,
        status: true,
        mulai: true,
        selesai: true,
      },
      orderBy: { mulai: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div id="konten" className="min-h-dvh px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <LogoTeks ukuran={36} />
          <p className="text-sm text-redup">
            Assalamu&apos;alaikum, {akses.namaWali}
          </p>
        </div>

        <Kartu className="mb-6 p-6">
          <h1 className="text-2xl font-bold tracking-tight text-teks">
            {santri.user.nama}
          </h1>
          <p className="mt-1 text-sm text-redup">
            {santri.nim} · {santri.kampus} — {santri.jurusan}
          </p>
          <p className="mt-0.5 text-sm text-redup">
            {santri.halaqah?.nama ?? "-"}
            {santri.halaqah?.musyrif ? ` · Musyrif ${santri.halaqah.musyrif.nama}` : ""}
            {santri.kamar ? ` · Kamar ${santri.kamar.nama}, ${santri.kamar.gedung}` : ""}
          </p>
        </Kartu>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KartuStat
            label="Kehadiran 30 hari"
            nilai={rekap.persen}
            satuan="%"
            nada={rekap.persen >= 90 ? "baik" : rekap.persen >= 75 ? "netral" : "waspada"}
          />
          <KartuStat
            label="Hadir"
            nilai={(rekap.perStatus.HADIR ?? 0) + (rekap.perStatus.TERLAMBAT ?? 0)}
            nada="baik"
          />
          <KartuStat
            label="Izin & sakit"
            nilai={(rekap.perStatus.IZIN ?? 0) + (rekap.perStatus.SAKIT ?? 0)}
          />
          <KartuStat
            label="Tanpa keterangan"
            nilai={rekap.perStatus.ALFA ?? 0}
            nada={(rekap.perStatus.ALFA ?? 0) > 0 ? "buruk" : "baik"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Kartu>
            <KepalaKartu judul="Kehadiran per kegiatan" keterangan="30 hari terakhir" />
            <div className="space-y-3.5 p-5">
              {rekap.perKegiatan.length === 0 ? (
                <p className="py-6 text-center text-sm text-samar">
                  Belum ada data.
                </p>
              ) : (
                rekap.perKegiatan.map((k) => (
                  <div key={k.id}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate text-sekunder">{k.nama}</span>
                      <span className={cn("font-semibold", warnaKehadiran(k.persen))}>
                        {k.persen}%
                      </span>
                    </div>
                    <BatangProgres nilai={k.persen} />
                    <p className="mt-1 text-[11px] text-samar">
                      {k.hadir} dari {k.total} kegiatan
                    </p>
                  </div>
                ))
              )}
            </div>
          </Kartu>

          <div className="space-y-6">
            <Kartu>
              <KepalaKartu judul="Riwayat presensi terakhir" />
              {presensi.length === 0 ? (
                <Kosong judul="Belum ada catatan" />
              ) : (
                <ul className="divide-y divide-garis">
                  {presensi.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-5 py-3 text-sm"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sekunder">
                          {p.sesi.kegiatan.nama}
                        </span>
                        <span className="block text-xs text-samar">
                          {fmtTanggalPendek(p.sesi.tanggal)}
                        </span>
                      </span>
                      <Lencana className={STATUS_PRESENSI_STYLE[p.status]}>
                        {STATUS_PRESENSI_LABEL[p.status]}
                      </Lencana>
                    </li>
                  ))}
                </ul>
              )}
            </Kartu>

            <Kartu>
              <KepalaKartu judul="Izin yang disetujui" />
              {izin.length === 0 ? (
                <Kosong judul="Belum ada izin" />
              ) : (
                <ul className="divide-y divide-garis">
                  {izin.map((z) => (
                    <li
                      key={z.id}
                      className="flex items-center gap-3 px-5 py-3 text-sm"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sekunder">
                          {JENIS_IZIN_LABEL[z.jenis]}
                        </span>
                        <span className="block text-xs text-samar">
                          {fmtTanggalPendek(z.mulai)} – {fmtTanggalPendek(z.selesai)}
                        </span>
                      </span>
                      <Lencana className={STATUS_IZIN_STYLE[z.status]}>
                        {STATUS_IZIN_LABEL[z.status]}
                      </Lencana>
                    </li>
                  ))}
                </ul>
              )}
            </Kartu>
          </div>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-samar">
          Halaman ini dibuat khusus untuk wali santri {APP.lembagaPanjang}. Data per{" "}
          {fmtTanggal(new Date())}. Untuk pertanyaan, hubungi pengurus di {APP.telepon}.
        </p>
      </div>
    </div>
  );
}
