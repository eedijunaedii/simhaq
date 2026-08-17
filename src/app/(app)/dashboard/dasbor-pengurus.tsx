import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  ClipboardList,
  QrCode,
  Users,
} from "lucide-react";
import { GrafikBatang, GrafikStatus, GrafikTren } from "@/components/grafik";
import {
  BatangProgres,
  Kartu,
  KartuStat,
  KepalaKartu,
  Kosong,
  Lencana,
  TautanTombol,
  Td,
  Th,
  Tabel,
  Tr,
} from "@/components/ui";
import {
  AMBANG_PEMBINAAN,
  GENDER_LABEL,
  JENIS_FLAG_LABEL,
  JENIS_IZIN_LABEL,
  STATUS_IZIN_STYLE,
  STATUS_IZIN_LABEL,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  rekapPerHalaqah,
  rekapPerKegiatan,
  rekapPerSantri,
  ringkasanDasbor,
  trenHarian,
} from "@/lib/rekap";
import { awalHari, akhirHari, fmtJam, fmtTanggal, fmtTanggalPendek } from "@/lib/tanggal";
import { cn, warnaKehadiran } from "@/lib/utils";
import type { Sesi } from "@/lib/session";

export async function DasborPengurus({
  sesi,
  gender,
}: {
  sesi: Sesi;
  gender?: string;
}) {
  const [ringkas, tren, perKegiatan, perHalaqah, sesiHariIni, izinMenunggu, flag, perSantri] =
    await Promise.all([
      ringkasanDasbor(gender),
      trenHarian({ gender, hari: 30 }),
      rekapPerKegiatan({ gender }),
      rekapPerHalaqah({ gender }),
      prisma.sesiPresensi.findMany({
        where: {
          tanggal: { gte: awalHari(), lte: akhirHari() },
          ...(gender ? { gender: { in: [gender, "SEMUA"] } } : {}),
        },
        select: {
          id: true,
          status: true,
          gender: true,
          waktuBuka: true,
          waktuTutup: true,
          kegiatan: { select: { nama: true } },
          halaqah: { select: { nama: true } },
          _count: { select: { presensi: true } },
        },
        orderBy: { waktuBuka: "asc" },
      }),
      prisma.izin.findMany({
        where: {
          status: { in: ["DIAJUKAN", "DIPROSES"] },
          ...(gender ? { santri: { user: { gender } } } : {}),
        },
        select: {
          id: true,
          kode: true,
          jenis: true,
          mulai: true,
          selesai: true,
          status: true,
          santri: { select: { user: { select: { nama: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.flagPelanggaran.findMany({
        where: {
          status: "BARU",
          ...(gender ? { santri: { user: { gender } } } : {}),
        },
        select: {
          id: true,
          jenis: true,
          keterangan: true,
          createdAt: true,
          santri: { select: { user: { select: { nama: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      rekapPerSantri({ gender }),
    ]);

  const prioritas = perSantri
    .filter((s) => s.total > 0 && s.persen < AMBANG_PEMBINAAN)
    .sort((a, b) => a.persen - b.persen)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat
          label="Santri aktif"
          nilai={ringkas.jumlahSantri}
          keterangan={gender ? `Data santri ${GENDER_LABEL[gender]}` : "Seluruh santri"}
          ikon={<Users size={18} />}
        />
        <KartuStat
          label="Kehadiran 30 hari"
          nilai={ringkas.persenKehadiran}
          satuan="%"
          keterangan={`${ringkas.totalPresensi.toLocaleString("id-ID")} catatan presensi`}
          nada={
            ringkas.persenKehadiran >= 90
              ? "baik"
              : ringkas.persenKehadiran >= 75
                ? "netral"
                : "waspada"
          }
          ikon={<CalendarClock size={18} />}
        />
        <KartuStat
          label="Izin menunggu"
          nilai={ringkas.izinMenunggu}
          keterangan={`${ringkas.izinBerjalan} izin sedang berjalan`}
          nada={ringkas.izinMenunggu > 0 ? "waspada" : "netral"}
          ikon={<ClipboardList size={18} />}
        />
        <KartuStat
          label="Sesi hari ini"
          nilai={ringkas.sesiHariIni}
          keterangan={
            ringkas.sesiTerbuka > 0
              ? `${ringkas.sesiTerbuka} sesi sedang dibuka`
              : "Tidak ada sesi terbuka"
          }
          nada={ringkas.sesiTerbuka > 0 ? "baik" : "netral"}
          ikon={<QrCode size={18} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Kartu>
          <KepalaKartu
            judul="Tren kehadiran 30 hari"
            keterangan={`${fmtTanggalPendek(ringkas.rentang.mulai)} — ${fmtTanggalPendek(
              ringkas.rentang.selesai
            )}`}
          />
          <div className="p-4">
            <GrafikTren data={tren} />
          </div>
        </Kartu>

        <Kartu>
          <KepalaKartu judul="Komposisi kehadiran" keterangan="30 hari terakhir" />
          <div className="p-4">
            <GrafikStatus perStatus={ringkas.perStatus} />
          </div>
        </Kartu>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Kartu>
          <KepalaKartu
            judul="Sesi presensi hari ini"
            keterangan={fmtTanggal(new Date())}
            aksi={
              <TautanTombol href="/presensi" gaya="kedua" ukuran="sm">
                Kelola
              </TautanTombol>
            }
          />
          {sesiHariIni.length === 0 ? (
            <Kosong
              judul="Belum ada sesi hari ini"
              keterangan="Buka sesi presensi untuk kegiatan yang sedang berlangsung."
              aksi={
                <TautanTombol href="/presensi/buka" ukuran="sm">
                  Buka sesi
                </TautanTombol>
              }
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {sesiHariIni.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/presensi/${s.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.04]"
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        s.status === "DIBUKA" ? "bg-emerald-400 denyut" : "bg-white/25"
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {s.kegiatan.nama}
                        {s.halaqah ? (
                          <span className="text-emerald-100/45"> · {s.halaqah.nama}</span>
                        ) : null}
                      </span>
                      <span className="block text-xs text-emerald-100/45">
                        {fmtJam(s.waktuBuka)} – {fmtJam(s.waktuTutup)} ·{" "}
                        {GENDER_LABEL[s.gender]}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold text-white">
                        {s._count.presensi}
                      </span>
                      <span className="block text-[11px] text-emerald-100/40">
                        tercatat
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kartu>

        <Kartu>
          <KepalaKartu
            judul="Izin menunggu keputusan"
            keterangan="Perlu ditinjau musyrif"
            aksi={
              <TautanTombol href="/izin" gaya="kedua" ukuran="sm">
                Semua izin
              </TautanTombol>
            }
          />
          {izinMenunggu.length === 0 ? (
            <Kosong
              judul="Tidak ada izin tertunda"
              keterangan="Semua pengajuan izin sudah diproses."
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {izinMenunggu.map((z) => (
                <li key={z.id}>
                  <Link
                    href={`/izin/${z.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.04]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {z.santri.user.nama}
                      </span>
                      <span className="block truncate text-xs text-emerald-100/45">
                        {JENIS_IZIN_LABEL[z.jenis]} · {fmtTanggalPendek(z.mulai)} –{" "}
                        {fmtTanggalPendek(z.selesai)}
                      </span>
                    </span>
                    <Lencana className={STATUS_IZIN_STYLE[z.status]}>
                      {STATUS_IZIN_LABEL[z.status]}
                    </Lencana>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Kartu>
          <KepalaKartu
            judul="Kehadiran per kegiatan"
            keterangan="Persentase 30 hari terakhir"
          />
          <div className="p-4">
            <GrafikBatang
              data={perKegiatan
                .filter((k) => k.total > 0)
                .map((k) => ({ nama: k.nama, persen: k.persen }))}
            />
          </div>
        </Kartu>

        <Kartu>
          <KepalaKartu
            judul="Kehadiran per halaqah"
            keterangan="Kelompok binaan musyrif"
            aksi={
              <TautanTombol href="/halaqah" gaya="kedua" ukuran="sm">
                Detail
              </TautanTombol>
            }
          />
          <div className="space-y-3.5 p-5">
            {perHalaqah.filter((h) => h.total > 0).length === 0 ? (
              <p className="py-8 text-center text-sm text-emerald-100/40">
                Belum ada data.
              </p>
            ) : (
              perHalaqah
                .filter((h) => h.total > 0)
                .map((h) => (
                  <div key={h.id}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate text-emerald-50/90">{h.nama}</span>
                      <span className={cn("font-semibold", warnaKehadiran(h.persen))}>
                        {h.persen}%
                      </span>
                    </div>
                    <BatangProgres nilai={h.persen} />
                    <p className="mt-1 text-[11px] text-emerald-100/35">
                      {h.jumlahSantri} santri · musyrif {h.musyrif}
                    </p>
                  </div>
                ))
            )}
          </div>
        </Kartu>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Kartu>
          <KepalaKartu
            judul="Prioritas pembinaan"
            keterangan={`Kehadiran di bawah ${AMBANG_PEMBINAAN}% dalam 30 hari terakhir`}
            aksi={
              <TautanTombol href="/laporan" gaya="kedua" ukuran="sm">
                Rekap penuh
                <ArrowUpRight size={14} />
              </TautanTombol>
            }
          />
          {prioritas.length === 0 ? (
            <Kosong
              judul="Tidak ada santri di bawah ambang"
              keterangan="Seluruh santri berada pada tingkat kehadiran yang baik."
            />
          ) : (
            <Tabel>
              <thead>
                <tr>
                  <Th>Santri</Th>
                  <Th className="hidden sm:table-cell">Halaqah</Th>
                  <Th className="text-center">Alfa</Th>
                  <Th className="text-right">Kehadiran</Th>
                </tr>
              </thead>
              <tbody>
                {prioritas.map((s) => (
                  <Tr key={s.santriId}>
                    <Td>
                      <Link
                        href={`/santri/${s.santriId}`}
                        className="font-medium text-white hover:text-emerald-300"
                      >
                        {s.nama}
                      </Link>
                      <span className="block text-xs text-emerald-100/40">{s.kampus}</span>
                    </Td>
                    <Td className="hidden text-emerald-100/60 sm:table-cell">
                      {s.halaqah ?? "-"}
                    </Td>
                    <Td className="text-center text-rose-300">{s.alfa}</Td>
                    <Td className="text-right">
                      <span className={cn("font-semibold", warnaKehadiran(s.persen))}>
                        {s.persen}%
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabel>
          )}
        </Kartu>

        <Kartu>
          <KepalaKartu
            judul="Perlu ditinjau"
            keterangan={`${ringkas.flagBaru} catatan pengawasan baru`}
            aksi={
              <TautanTombol href="/pengawasan" gaya="kedua" ukuran="sm">
                Lihat
              </TautanTombol>
            }
          />
          {flag.length === 0 ? (
            <Kosong
              judul="Tidak ada temuan"
              keterangan="Belum ada indikasi titip absen atau keterlambatan kembali."
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {flag.map((f) => (
                <li key={f.id} className="flex gap-3 px-5 py-3.5">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {f.santri.user.nama}
                    </p>
                    <p className="text-xs text-emerald-100/50">
                      {JENIS_FLAG_LABEL[f.jenis]}
                    </p>
                    <p className="mt-0.5 text-[11px] text-emerald-100/35">
                      {fmtTanggalPendek(f.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>

      <p className="text-center text-xs text-emerald-100/30">
        Masuk sebagai {sesi.nama} · {GENDER_LABEL[sesi.gender]}
        {gender ? " · akses dibatasi sesuai kebijakan hijab pesantren" : ""}
      </p>
    </div>
  );
}
