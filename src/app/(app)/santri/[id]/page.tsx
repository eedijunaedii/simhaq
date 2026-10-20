import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Link2Off, Smartphone } from "lucide-react";
import { QrTautan } from "@/components/qr-statis";
import { TautanWali } from "@/components/tautan-wali";
import {
  Avatar,
  BatangProgres,
  Kartu,
  KartuStat,
  KepalaKartu,
  Kosong,
  Lencana,
  Tombol,
  Tabel,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import {
  AMBANG_PEMBINAAN,
  GENDER_LABEL,
  JENIS_IZIN_LABEL,
  METODE_PRESENSI_LABEL,
  STATUS_IZIN_LABEL,
  STATUS_IZIN_STYLE,
  STATUS_PRESENSI_LABEL,
  STATUS_PRESENSI_STYLE,
} from "@/lib/constants";
import { genderYangBolehDiakses, wajibPengurus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rekapSantri } from "@/lib/rekap";
import { fmtJam, fmtTanggal, fmtTanggalPendek } from "@/lib/tanggal";
import { cn, warnaKehadiran } from "@/lib/utils";
import { asalSitus } from "@/lib/situs";
import { lepasPerangkat } from "../../presensi/aksi";

export const metadata: Metadata = { title: "Detail Santri" };
export const dynamic = "force-dynamic";

export default async function HalamanDetailSantri(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const pengguna = await wajibPengurus();

  const santri = await prisma.profilSantri.findUnique({
    where: { id },
    select: {
      id: true,
      nim: true,
      kampus: true,
      jurusan: true,
      angkatan: true,
      asalDaerah: true,
      status: true,
      tanggalMasuk: true,
      deviceId: true,
      deviceBoundAt: true,
      user: {
        select: { nama: true, username: true, gender: true, telepon: true, email: true },
      },
      kelas: { select: { id: true, nama: true, pembina: { select: { nama: true } } } },
      kamar: { select: { nama: true, gedung: true } },
      waliToken: { select: { token: true, namaWali: true, aktif: true } },
    },
  });

  if (!santri) notFound();
  if (!genderYangBolehDiakses(pengguna).includes(santri.user.gender)) redirect("/santri");

  const [rekap, presensi, izin, flag] = await Promise.all([
    rekapSantri(santri.id),
    prisma.presensi.findMany({
      where: { santriId: santri.id },
      select: {
        id: true,
        status: true,
        metode: true,
        waktuScan: true,
        catatan: true,
        sesi: {
          select: { tanggal: true, kegiatan: { select: { nama: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.izin.findMany({
      where: { santriId: santri.id },
      select: {
        id: true,
        jenis: true,
        status: true,
        mulai: true,
        selesai: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.flagPelanggaran.findMany({
      where: { santriId: santri.id },
      select: { id: true, jenis: true, keterangan: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const wali = santri.waliToken[0];
  const asal = await asalSitus();

  return (
    <>
      <Link
        href="/santri"
        className="mb-4 inline-flex items-center gap-2 text-sm text-redup transition hover:text-teks"
      >
        <ArrowLeft size={16} />
        Data santri
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar nama={santri.user.nama} ukuran={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-teks">
            {santri.user.nama}
          </h1>
          <p className="mt-0.5 text-sm text-redup">
            {santri.nim} · {santri.kampus} — {santri.jurusan} · Angkatan{" "}
            {santri.angkatan}
          </p>
        </div>
        <Lencana
          className={
            santri.status === "AKTIF"
              ? "bg-sukses/15 text-sukses ring-sukses/30"
              : "bg-lapis-naik text-sekunder ring-garis"
          }
        >
          {santri.status}
        </Lencana>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat
          label="Kehadiran 30 hari"
          nilai={rekap.persen}
          satuan="%"
          nada={
            rekap.persen >= 90
              ? "baik"
              : rekap.persen >= AMBANG_PEMBINAAN
                ? "netral"
                : "buruk"
          }
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

      <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="space-y-6">
          <Kartu>
            <KepalaKartu judul="Riwayat presensi" keterangan="30 catatan terakhir" />
            {presensi.length === 0 ? (
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
                  {presensi.map((p) => (
                    <Tr key={p.id}>
                      <Td className="text-sekunder">{p.sesi.kegiatan.nama}</Td>
                      <Td className="hidden text-redup sm:table-cell">
                        {fmtTanggalPendek(p.sesi.tanggal)}
                        {p.waktuScan ? (
                          <span className="block text-xs text-samar">
                            {fmtJam(p.waktuScan)}
                          </span>
                        ) : null}
                      </Td>
                      <Td className="hidden text-xs text-redup md:table-cell">
                        {METODE_PRESENSI_LABEL[p.metode] ?? p.metode}
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

          <Kartu>
            <KepalaKartu judul="Riwayat perizinan" />
            {izin.length === 0 ? (
              <Kosong judul="Belum pernah mengajukan izin" />
            ) : (
              <ul className="divide-y divide-garis">
                {izin.map((z) => (
                  <li key={z.id}>
                    <Link
                      href={`/izin/${z.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-200 hover:bg-lapis"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-teks">
                          {JENIS_IZIN_LABEL[z.jenis]}
                        </span>
                        <span className="block text-xs text-redup">
                          {fmtTanggalPendek(z.mulai)} –{" "}
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

          {flag.length > 0 ? (
            <Kartu>
              <KepalaKartu judul="Catatan pengawasan" />
              <ul className="divide-y divide-garis">
                {flag.map((f) => (
                  <li key={f.id} className="px-5 py-3.5">
                    <p className="text-sm text-sekunder">{f.keterangan}</p>
                    <p className="mt-0.5 text-xs text-samar">
                      {fmtTanggalPendek(f.createdAt)} · {f.status}
                    </p>
                  </li>
                ))}
              </ul>
            </Kartu>
          ) : null}
        </div>

        <div className="space-y-6">
          <Kartu>
            <KepalaKartu judul="Data pribadi" />
            <dl className="space-y-3 p-5 text-sm">
              <Baris label="Nama pengguna">{santri.user.username}</Baris>
              <Baris label="Gender">{GENDER_LABEL[santri.user.gender]}</Baris>
              <Baris label="Asal daerah">{santri.asalDaerah}</Baris>
              <Baris label="Telepon">{santri.user.telepon ?? "-"}</Baris>
              <Baris label="Kelas">
                {santri.kelas ? (
                  <Link href={`/kelas/${santri.kelas.id}`} className="tautan-halus">
                    {santri.kelas.nama}
                  </Link>
                ) : (
                  "-"
                )}
              </Baris>
              <Baris label="Pembina">{santri.kelas?.pembina?.nama ?? "-"}</Baris>
              <Baris label="Kamar">
                {santri.kamar ? `${santri.kamar.nama}, ${santri.kamar.gedung}` : "-"}
              </Baris>
              <Baris label="Masuk pesantren">{fmtTanggal(santri.tanggalMasuk)}</Baris>
            </dl>
          </Kartu>

          <Kartu>
            <KepalaKartu judul="Keterikatan perangkat" />
            <div className="p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-lapis text-sukses">
                  <Smartphone size={17} />
                </span>
                <div className="min-w-0 text-sm">
                  {santri.deviceId ? (
                    <>
                      <p className="text-sekunder">Terikat pada satu perangkat</p>
                      <p className="mt-0.5 break-all font-mono text-[11px] text-samar">
                        {santri.deviceId.slice(0, 18)}…
                      </p>
                      {santri.deviceBoundAt ? (
                        <p className="mt-1 text-xs text-samar">
                          Sejak {fmtTanggal(santri.deviceBoundAt)}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sekunder">
                      Belum ada perangkat terdaftar. Perangkat akan terikat otomatis pada
                      pemindaian pertama.
                    </p>
                  )}
                </div>
              </div>

              {santri.deviceId ? (
                <form
                  action={async () => {
                    "use server";
                    await lepasPerangkat(santri.id);
                  }}
                  className="mt-4"
                >
                  <Tombol type="submit" gaya="kedua" ukuran="sm" className="w-full">
                    <Link2Off size={15} />
                    Lepas keterikatan perangkat
                  </Tombol>
                </form>
              ) : null}
            </div>
          </Kartu>

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
                  </div>
                ))
              )}
            </div>
          </Kartu>

          {wali ? (
            <Kartu>
              <KepalaKartu
                judul="Akses wali santri"
                keterangan="Tautan bertoken, tanpa perlu akun"
              />
              <div className="flex flex-col items-center gap-3 p-5">
                <div className="rounded-2xl bg-white p-3">
                  <QrTautan path={`/wali/${wali.token}`} ukuran={150} />
                </div>
                <p className="text-center text-sm text-sekunder">{wali.namaWali}</p>
                <div className="w-full">
                  <TautanWali tautan={`${asal}/wali/${wali.token}`} ukuran="kecil" />
                </div>
              </div>
            </Kartu>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-redup">{label}</dt>
      <dd className="text-right text-sekunder">{children}</dd>
    </div>
  );
}
