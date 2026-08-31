import Link from "next/link";
import { CalendarCheck, ClipboardList, ScanLine, TrendingUp } from "lucide-react";
import { GrafikStatus, GrafikTren } from "@/components/grafik";
import {
  BatangProgres,
  Kartu,
  KartuStat,
  KepalaKartu,
  Kosong,
  Lencana,
  Peringatan,
  TautanTombol,
} from "@/components/ui";
import {
  JENIS_IZIN_LABEL,
  STATUS_IZIN_LABEL,
  STATUS_IZIN_STYLE,
  STATUS_PRESENSI_LABEL,
  STATUS_PRESENSI_STYLE,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { rekapSantri } from "@/lib/rekap";
import { fmtJam, fmtTanggalJam, fmtTanggalPendek, selisihManusiawi } from "@/lib/tanggal";
import { cn, persen, warnaKehadiran } from "@/lib/utils";
import type { Sesi } from "@/lib/session";

export async function DasborSantri({ sesi }: { sesi: Sesi }) {
  const santriId = sesi.santriId!;

  const [profil, rekap, sesiTerbuka, izinTerakhir, presensiTerakhir, trenPribadi] =
    await Promise.all([
      prisma.profilSantri.findUnique({
        where: { id: santriId },
        select: {
          nim: true,
          kampus: true,
          jurusan: true,
          deviceId: true,
          halaqah: { select: { nama: true, musyrif: { select: { nama: true } } } },
          kamar: { select: { nama: true, gedung: true } },
        },
      }),
      rekapSantri(santriId),
      prisma.sesiPresensi.findMany({
        where: {
          status: "DIBUKA",
          gender: { in: [sesi.gender, "SEMUA"] },
          waktuTutup: { gte: new Date() },
        },
        select: {
          id: true,
          waktuTutup: true,
          batasTerlambat: true,
          kegiatan: { select: { nama: true } },
          halaqah: { select: { nama: true } },
          presensi: { where: { santriId }, select: { status: true } },
        },
        orderBy: { waktuBuka: "asc" },
      }),
      prisma.izin.findMany({
        where: { santriId },
        select: {
          id: true,
          kode: true,
          jenis: true,
          status: true,
          mulai: true,
          selesai: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.presensi.findMany({
        where: { santriId },
        select: {
          id: true,
          status: true,
          waktuScan: true,
          sesi: {
            select: { tanggal: true, kegiatan: { select: { nama: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      trenPribadiSantri(santriId),
    ]);

  const belumPresensi = sesiTerbuka.filter((s) => s.presensi.length === 0);
  const izinAktif = izinTerakhir.find(
    (z) =>
      z.status === "DISETUJUI" &&
      new Date(z.mulai) <= new Date() &&
      new Date(z.selesai) >= new Date()
  );

  return (
    <div className="space-y-6">
      {belumPresensi.length > 0 ? (
        <Kartu className="border-sukses/30 bg-sukses/[0.08] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-sukses/20 text-sukses">
                <ScanLine size={20} />
              </span>
              <div>
                <p className="font-semibold text-teks">
                  {belumPresensi.length} sesi presensi sedang dibuka
                </p>
                <p className="mt-0.5 text-sm text-sekunder">
                  {belumPresensi
                    .map(
                      (s) =>
                        `${s.kegiatan.nama}${s.halaqah ? ` (${s.halaqah.nama})` : ""}`
                    )
                    .join(", ")}{" "}
                  · tutup {selisihManusiawi(belumPresensi[0].waktuTutup)}
                </p>
              </div>
            </div>
            <TautanTombol href="/scan">
              <ScanLine size={16} />
              Pindai sekarang
            </TautanTombol>
          </div>
        </Kartu>
      ) : null}

      {izinAktif ? (
        <Peringatan nada="info" judul={`Izin ${JENIS_IZIN_LABEL[izinAktif.jenis]} sedang berlaku`}>
          Berlaku sampai {fmtTanggalJam(izinAktif.selesai)}. Sesi presensi pada rentang
          ini tercatat otomatis sebagai izin.{" "}
          <Link href={`/izin/${izinAktif.id}`} className="tautan-halus">
            Lihat kartu izin
          </Link>
        </Peringatan>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat
          label="Kehadiran 30 hari"
          nilai={rekap.persen}
          satuan="%"
          keterangan={`${rekap.total} kegiatan tercatat`}
          nada={rekap.persen >= 90 ? "baik" : rekap.persen >= 75 ? "netral" : "waspada"}
          ikon={<TrendingUp size={18} />}
        />
        <KartuStat
          label="Hadir"
          nilai={(rekap.perStatus.HADIR ?? 0) + (rekap.perStatus.TERLAMBAT ?? 0)}
          keterangan={`${rekap.perStatus.TERLAMBAT ?? 0} di antaranya terlambat`}
          nada="baik"
          ikon={<CalendarCheck size={18} />}
        />
        <KartuStat
          label="Izin & sakit"
          nilai={(rekap.perStatus.IZIN ?? 0) + (rekap.perStatus.SAKIT ?? 0)}
          keterangan="Tercatat dengan keterangan"
          ikon={<ClipboardList size={18} />}
        />
        <KartuStat
          label="Tanpa keterangan"
          nilai={rekap.perStatus.ALFA ?? 0}
          keterangan="Perlu diperbaiki"
          nada={(rekap.perStatus.ALFA ?? 0) > 0 ? "buruk" : "baik"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Kartu>
          <KepalaKartu
            judul="Tren kehadiran saya"
            keterangan="Persentase kehadiran 30 hari terakhir"
          />
          <div className="p-4">
            <GrafikTren data={trenPribadi} />
          </div>
        </Kartu>

        <Kartu>
          <KepalaKartu judul="Komposisi" keterangan="30 hari terakhir" />
          <div className="p-4">
            <GrafikStatus perStatus={rekap.perStatus} />
          </div>
        </Kartu>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Kartu>
          <KepalaKartu judul="Kehadiran per kegiatan" />
          <div className="space-y-3.5 p-5">
            {rekap.perKegiatan.length === 0 ? (
              <p className="py-8 text-center text-sm text-samar">
                Belum ada data presensi.
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
            <KepalaKartu
              judul="Riwayat presensi terakhir"
              aksi={
                <TautanTombol href="/presensi/saya" gaya="kedua" ukuran="sm">
                  Semua
                </TautanTombol>
              }
            />
            {presensiTerakhir.length === 0 ? (
              <Kosong judul="Belum ada riwayat presensi" />
            ) : (
              <ul className="divide-y divide-garis">
                {presensiTerakhir.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-teks">
                        {p.sesi.kegiatan.nama}
                      </span>
                      <span className="block text-xs text-samar">
                        {fmtTanggalPendek(p.sesi.tanggal)}
                        {p.waktuScan ? ` · ${fmtJam(p.waktuScan)}` : ""}
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
            <KepalaKartu
              judul="Izin terakhir"
              aksi={
                <TautanTombol href="/izin/baru" ukuran="sm">
                  Ajukan izin
                </TautanTombol>
              }
            />
            {izinTerakhir.length === 0 ? (
              <Kosong
                judul="Belum pernah mengajukan izin"
                keterangan="Ajukan izin bila berhalangan mengikuti kegiatan wajib."
              />
            ) : (
              <ul className="divide-y divide-garis">
                {izinTerakhir.map((z) => (
                  <li key={z.id}>
                    <Link
                      href={`/izin/${z.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors duration-200 hover:bg-lapis"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-teks">
                          {JENIS_IZIN_LABEL[z.jenis]}
                        </span>
                        <span className="block text-xs text-samar">
                          {fmtTanggalPendek(z.mulai)} – {fmtTanggalPendek(z.selesai)}
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
      </div>

      {profil ? (
        <Kartu className="p-5">
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Info label="NIM / Kampus" nilai={`${profil.nim} · ${profil.kampus}`} />
            <Info label="Program studi" nilai={profil.jurusan} />
            <Info
              label="Halaqah"
              nilai={
                profil.halaqah
                  ? `${profil.halaqah.nama} — ${profil.halaqah.musyrif?.nama ?? "-"}`
                  : "Belum ditentukan"
              }
            />
            <Info
              label="Kamar"
              nilai={
                profil.kamar
                  ? `${profil.kamar.nama}, ${profil.kamar.gedung}`
                  : "Belum ditentukan"
              }
            />
          </div>
          {!profil.deviceId ? (
            <p className="mt-4 rounded-xl border border-waspada/20 bg-waspada/10 px-4 py-2.5 text-xs text-waspada">
              Perangkat belum terdaftar. Perangkat akan terikat otomatis pada pemindaian
              QR pertama Anda.
            </p>
          ) : null}
        </Kartu>
      ) : null}
    </div>
  );
}

function Info({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-samar">{label}</p>
      <p className="mt-0.5 text-sekunder">{nilai}</p>
    </div>
  );
}

/** Tren kehadiran khusus satu santri. */
async function trenPribadiSantri(santriId: string) {
  const mulai = new Date();
  mulai.setHours(0, 0, 0, 0);
  mulai.setDate(mulai.getDate() - 29);

  const baris = await prisma.presensi.findMany({
    where: { santriId, sesi: { tanggal: { gte: mulai } } },
    select: { status: true, sesi: { select: { tanggal: true } } },
  });

  const peta = new Map<string, { hadir: number; total: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(mulai);
    d.setDate(d.getDate() + i);
    peta.set(d.toISOString().slice(0, 10), { hadir: 0, total: 0 });
  }

  for (const b of baris) {
    const d = new Date(b.sesi.tanggal);
    d.setHours(0, 0, 0, 0);
    const rec = peta.get(d.toISOString().slice(0, 10));
    if (!rec) continue;
    rec.total++;
    if (b.status === "HADIR" || b.status === "TERLAMBAT") rec.hadir++;
  }

  return [...peta.entries()].map(([tanggal, v]) => ({
    tanggal,
    hadir: v.hadir,
    total: v.total,
    persen: persen(v.hadir, v.total),
  }));
}
