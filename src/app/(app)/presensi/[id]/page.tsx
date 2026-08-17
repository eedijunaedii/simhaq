import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Clock, Lock, MapPin, Timer, XCircle } from "lucide-react";
import {
  Kartu,
  KepalaKartu,
  Lencana,
  JudulHalaman,
  Peringatan,
  Tombol,
} from "@/components/ui";
import {
  GENDER_LABEL,
  STATUS_SESI_LABEL,
  STATUS_PRESENSI_LABEL,
} from "@/lib/constants";
import { genderYangBolehDiakses, wajibPengurus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pesertaSesi } from "@/lib/presensi";
import { fmtJam, fmtTanggal, selisihManusiawi } from "@/lib/tanggal";
import { batalkanSesi, perpanjangSesi, tutupSesi } from "../aksi";
import { DaftarPeserta, type BarisPeserta } from "./daftar-peserta";
import { LayarQr } from "./layar-qr";

export const metadata: Metadata = { title: "Sesi Presensi" };
export const dynamic = "force-dynamic";

export default async function HalamanSesi(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const pengguna = await wajibPengurus();

  const sesi = await prisma.sesiPresensi.findUnique({
    where: { id },
    select: {
      id: true,
      gender: true,
      halaqahId: true,
      status: true,
      tanggal: true,
      waktuBuka: true,
      waktuTutup: true,
      batasTerlambat: true,
      rotasiDetik: true,
      wajibLokasi: true,
      radiusMeter: true,
      kegiatan: { select: { nama: true, kode: true, toleransiTerlambatMenit: true } },
      halaqah: { select: { nama: true } },
      dibukaOleh: { select: { nama: true } },
      ditutupOleh: { select: { nama: true } },
      ditutupPada: true,
    },
  });

  if (!sesi) notFound();
  if (!genderYangBolehDiakses(pengguna).includes(sesi.gender)) redirect("/presensi");

  const [peserta, presensi] = await Promise.all([
    pesertaSesi(sesi),
    prisma.presensi.findMany({
      where: { sesiId: sesi.id },
      select: {
        santriId: true,
        status: true,
        metode: true,
        waktuScan: true,
        catatan: true,
      },
    }),
  ]);

  const petaPresensi = new Map(presensi.map((p) => [p.santriId, p]));

  const baris: BarisPeserta[] = peserta.map((p) => {
    const rec = petaPresensi.get(p.id);
    return {
      santriId: p.id,
      nama: p.user.nama,
      nim: p.nim,
      kampus: p.kampus,
      halaqah: p.halaqah?.nama ?? null,
      kamar: p.kamar?.nama ?? null,
      status: rec?.status ?? null,
      metode: rec?.metode ?? null,
      waktuScan: rec?.waktuScan ? fmtJam(rec.waktuScan) : null,
      catatan: rec?.catatan ?? null,
    };
  });

  const hitung: Record<string, number> = {};
  for (const p of presensi) hitung[p.status] = (hitung[p.status] ?? 0) + 1;
  const belum = peserta.length - presensi.length;

  const terbuka = sesi.status === "DIBUKA";
  const lewatWaktu = terbuka && sesi.waktuTutup < new Date();

  return (
    <>
      <Link
        href="/presensi"
        className="mb-4 inline-flex items-center gap-2 text-sm text-emerald-100/55 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Semua sesi
      </Link>

      <JudulHalaman
        judul={sesi.kegiatan.nama}
        keterangan={
          <>
            {fmtTanggal(sesi.tanggal)} · {fmtJam(sesi.waktuBuka)} –{" "}
            {fmtJam(sesi.waktuTutup)} · {GENDER_LABEL[sesi.gender]}
            {sesi.halaqah ? ` · ${sesi.halaqah.nama}` : ""}
          </>
        }
        aksi={
          <>
            <Lencana
              className={
                terbuka
                  ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                  : "bg-white/10 text-emerald-100/60 ring-white/15"
              }
            >
              {terbuka ? (
                <span className="denyut inline-block size-1.5 rounded-full bg-emerald-400" />
              ) : null}
              {STATUS_SESI_LABEL[sesi.status]}
            </Lencana>
            {terbuka ? (
              <>
                <form
                  action={async () => {
                    "use server";
                    await perpanjangSesi(sesi.id, 15);
                  }}
                >
                  <Tombol gaya="kedua" ukuran="sm" type="submit">
                    <Timer size={15} />
                    +15 menit
                  </Tombol>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await tutupSesi(sesi.id);
                  }}
                >
                  <Tombol ukuran="sm" type="submit">
                    <Lock size={15} />
                    Tutup sesi
                  </Tombol>
                </form>
              </>
            ) : null}
            {sesi.status !== "DIBATALKAN" && presensi.length === 0 ? (
              <form
                action={async () => {
                  "use server";
                  await batalkanSesi(sesi.id);
                }}
              >
                <Tombol gaya="bahaya" ukuran="sm" type="submit">
                  <XCircle size={15} />
                  Batalkan
                </Tombol>
              </form>
            ) : null}
          </>
        }
      />

      {lewatWaktu ? (
        <div className="mb-5">
          <Peringatan nada="waspada" judul="Waktu sesi sudah lewat">
            Sesi ini masih berstatus dibuka namun sudah melewati waktu tutup. Tutup sesi
            agar santri yang tidak hadir tercatat tanpa keterangan.
          </Peringatan>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <div className="space-y-6">
          {terbuka ? (
            <LayarQr
              sesiId={sesi.id}
              namaKegiatan={sesi.kegiatan.nama}
              keterangan={`${GENDER_LABEL[sesi.gender]}${
                sesi.halaqah ? ` · ${sesi.halaqah.nama}` : ""
              } · tutup ${selisihManusiawi(sesi.waktuTutup)}`}
            />
          ) : (
            <Kartu className="p-6 text-center">
              <Lock size={26} className="mx-auto text-emerald-100/30" />
              <p className="mt-3 font-medium text-white">
                {STATUS_SESI_LABEL[sesi.status]}
              </p>
              <p className="mt-1 text-sm text-emerald-100/50">
                {sesi.ditutupPada
                  ? `Ditutup ${fmtJam(sesi.ditutupPada)}${
                      sesi.ditutupOleh ? ` oleh ${sesi.ditutupOleh.nama}` : ""
                    }`
                  : "Sesi tidak lagi menerima pemindaian."}
              </p>
            </Kartu>
          )}

          <Kartu>
            <KepalaKartu judul="Rincian sesi" />
            <dl className="space-y-3 p-5 text-sm">
              <Baris ikon={<Clock size={14} />} label="Batas terlambat">
                {fmtJam(sesi.batasTerlambat)} (toleransi{" "}
                {sesi.kegiatan.toleransiTerlambatMenit} menit)
              </Baris>
              <Baris ikon={<Timer size={14} />} label="Rotasi QR">
                Setiap {sesi.rotasiDetik} detik
              </Baris>
              <Baris ikon={<MapPin size={14} />} label="Pembatasan lokasi">
                {sesi.wajibLokasi ? `Aktif, radius ${sesi.radiusMeter} m` : "Dimatikan"}
              </Baris>
              <Baris label="Dibuka oleh">{sesi.dibukaOleh.nama}</Baris>
            </dl>
          </Kartu>

          <Kartu>
            <KepalaKartu judul="Ringkasan" keterangan={`${peserta.length} peserta`} />
            <ul className="space-y-2.5 p-5 text-sm">
              {["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "ALFA"].map((s) => (
                <li key={s} className="flex items-center justify-between">
                  <span className="text-emerald-100/60">{STATUS_PRESENSI_LABEL[s]}</span>
                  <span className="font-semibold text-white">{hitung[s] ?? 0}</span>
                </li>
              ))}
              <li className="flex items-center justify-between border-t border-white/10 pt-2.5">
                <span className="text-emerald-100/60">Belum tercatat</span>
                <span className="font-semibold text-white">{belum}</span>
              </li>
            </ul>
          </Kartu>
        </div>

        <Kartu className="self-start">
          <KepalaKartu
            judul="Daftar peserta"
            keterangan="Ubah status secara manual bila santri tidak dapat memindai."
          />
          <DaftarPeserta
            sesiId={sesi.id}
            peserta={baris}
            bolehUbah={sesi.status !== "DIBATALKAN"}
          />
        </Kartu>
      </div>
    </>
  );
}

function Baris({
  ikon,
  label,
  children,
}: {
  ikon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex items-center gap-2 text-emerald-100/50">
        {ikon}
        {label}
      </dt>
      <dd className="text-right text-emerald-50/90">{children}</dd>
    </div>
  );
}
