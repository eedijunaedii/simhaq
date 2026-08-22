import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { GrafikBatang, GrafikTren } from "@/components/grafik";
import {
  BatangProgres,
  Kartu,
  KartuStat,
  KepalaKartu,
  Kosong,
  JudulHalaman,
  Tabel,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { AMBANG_PEMBINAAN, GENDER_LABEL } from "@/lib/constants";
import { filterGender, wajibPengurus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  rekapPerHalaqah,
  rekapPerKegiatan,
  rekapPerSantri,
  trenBulanan,
  trenHarian,
} from "@/lib/rekap";
import { akhirHari, awalHari, fmtTanggal, tambahHari, NAMA_BULAN } from "@/lib/tanggal";
import { cn, warnaKehadiran } from "@/lib/utils";
import { Penyaring } from "./penyaring";

export const metadata: Metadata = { title: "Rekap & Laporan" };
export const dynamic = "force-dynamic";

export default async function HalamanLaporan(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const pengguna = await wajibPengurus();
  const sp = await props.searchParams;
  const { gender } = filterGender(pengguna);

  const rentang =
    sp.mulai && sp.selesai
      ? { mulai: awalHari(new Date(sp.mulai)), selesai: akhirHari(new Date(sp.selesai)) }
      : {
          mulai: awalHari(tambahHari(new Date(), -(Number(sp.hari ?? 30) - 1))),
          selesai: akhirHari(),
        };

  const halaqahId = sp.halaqah || undefined;
  const kegiatanId = sp.kegiatan || undefined;

  const [perSantri, perHalaqah, perKegiatan, tren, bulanan, daftarHalaqah, daftarKegiatan] =
    await Promise.all([
      rekapPerSantri({ gender, rentang, halaqahId, kegiatanId }),
      rekapPerHalaqah({ gender, rentang }),
      rekapPerKegiatan({ gender, rentang }),
      trenHarian({ gender, hari: 30 }),
      trenBulanan({ gender, bulan: 6 }),
      prisma.halaqah.findMany({
        where: gender ? { gender } : {},
        select: { id: true, nama: true },
        orderBy: { nama: "asc" },
      }),
      prisma.kegiatan.findMany({
        where: { aktif: true },
        select: { id: true, nama: true },
        orderBy: { nama: "asc" },
      }),
    ]);

  const totalHadir = perSantri.reduce((s, r) => s + r.hadir + r.terlambat, 0);
  const totalCatatan = perSantri.reduce((s, r) => s + r.total, 0);
  const rerata = totalCatatan ? Math.round((totalHadir / totalCatatan) * 1000) / 10 : 0;
  const prioritas = perSantri
    .filter((s) => s.total > 0 && s.persen < AMBANG_PEMBINAAN)
    .sort((a, b) => a.persen - b.persen);

  const urut = [...perSantri].sort((a, b) => b.persen - a.persen);

  return (
    <>
      <JudulHalaman
        judul="Rekap & laporan"
        keterangan={`${fmtTanggal(rentang.mulai)} — ${fmtTanggal(rentang.selesai)}${
          gender ? ` · ${GENDER_LABEL[gender]}` : ""
        }`}
      />

      <Kartu className="mb-6">
        <KepalaKartu
          judul="Penyaringan & unduhan"
          keterangan="Atur periode lalu unduh rekap untuk kebutuhan rapat dan arsip pesantren."
        />
        <Suspense fallback={<div className="p-5 text-sm text-samar">Memuat...</div>}>
          <Penyaring halaqah={daftarHalaqah} kegiatan={daftarKegiatan} />
        </Suspense>
      </Kartu>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat
          label="Rerata kehadiran"
          nilai={rerata}
          satuan="%"
          nada={rerata >= 90 ? "baik" : rerata >= 75 ? "netral" : "waspada"}
        />
        <KartuStat label="Santri dalam rekap" nilai={perSantri.length} />
        <KartuStat label="Catatan presensi" nilai={totalCatatan.toLocaleString("id-ID")} />
        <KartuStat
          label={`Di bawah ${AMBANG_PEMBINAAN}%`}
          nilai={prioritas.length}
          nada={prioritas.length > 0 ? "buruk" : "baik"}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Kartu>
          <KepalaKartu judul="Tren mingguan-harian" keterangan="30 hari terakhir" />
          <div className="p-4">
            <GrafikTren data={tren} />
          </div>
        </Kartu>
        <Kartu>
          <KepalaKartu judul="Tren bulanan" keterangan="6 bulan terakhir" />
          <div className="p-4">
            <GrafikBatang
              data={bulanan.map((b) => {
                const [th, bl] = b.bulan.split("-");
                return {
                  nama: `${NAMA_BULAN[Number(bl) - 1].slice(0, 3)} ${th.slice(2)}`,
                  persen: b.persen,
                };
              })}
            />
          </div>
        </Kartu>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Kartu>
          <KepalaKartu judul="Kehadiran per kegiatan" />
          <Tabel>
            <thead>
              <tr>
                <Th>Kegiatan</Th>
                <Th className="text-center">Hadir</Th>
                <Th className="text-center">Alfa</Th>
                <Th className="text-right">%</Th>
              </tr>
            </thead>
            <tbody>
              {perKegiatan.map((k) => (
                <Tr key={k.id}>
                  <Td className="font-medium text-white">{k.nama}</Td>
                  <Td className="text-center text-sekunder">{k.hadir}</Td>
                  <Td className="text-center text-rose-300/80">{k.alfa}</Td>
                  <Td className="text-right">
                    <span className={cn("font-semibold", warnaKehadiran(k.persen))}>
                      {k.total > 0 ? `${k.persen}%` : "—"}
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Tabel>
        </Kartu>

        <Kartu>
          <KepalaKartu judul="Kehadiran per halaqah" />
          <div className="space-y-3.5 p-5">
            {perHalaqah.length === 0 ? (
              <p className="py-8 text-center text-sm text-samar">
                Belum ada data.
              </p>
            ) : (
              perHalaqah.map((h) => (
                <div key={h.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <Link
                      href={`/halaqah/${h.id}`}
                      className="inline-block -my-1 truncate py-1 text-sekunder transition-colors duration-150 hover:text-aksen"
                    >
                      {h.nama}
                    </Link>
                    <span className={cn("font-semibold", warnaKehadiran(h.persen))}>
                      {h.total > 0 ? `${h.persen}%` : "—"}
                    </span>
                  </div>
                  <BatangProgres nilai={h.persen} />
                  <p className="mt-1 text-[11px] text-samar">
                    {h.jumlahSantri} santri · musyrif {h.musyrif}
                  </p>
                </div>
              ))
            )}
          </div>
        </Kartu>
      </div>

      {prioritas.length > 0 ? (
        <Kartu className="mb-6">
          <KepalaKartu
            judul="Prioritas pembinaan"
            keterangan={`${prioritas.length} santri dengan kehadiran di bawah ${AMBANG_PEMBINAAN}%`}
          />
          <Tabel>
            <thead>
              <tr>
                <Th>Santri</Th>
                <Th className="hidden sm:table-cell">Halaqah</Th>
                <Th className="text-center">Alfa</Th>
                <Th className="text-center">Izin</Th>
                <Th className="text-right">Kehadiran</Th>
              </tr>
            </thead>
            <tbody>
              {prioritas.map((s) => (
                <Tr key={s.santriId}>
                  <Td>
                    <Link
                      href={`/santri/${s.santriId}`}
                      className="inline-block -my-1 py-1 font-medium text-white transition-colors duration-150 hover:text-aksen"
                    >
                      {s.nama}
                    </Link>
                    <span className="block text-xs text-samar">{s.kampus}</span>
                  </Td>
                  <Td className="hidden text-sekunder sm:table-cell">
                    {s.halaqah ?? "-"}
                  </Td>
                  <Td className="text-center text-rose-300">{s.alfa}</Td>
                  <Td className="text-center text-sky-300/80">{s.izin + s.sakit}</Td>
                  <Td className="text-right">
                    <span className={cn("font-semibold", warnaKehadiran(s.persen))}>
                      {s.persen}%
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Tabel>
        </Kartu>
      ) : null}

      <Kartu>
        <KepalaKartu
          judul="Rekap seluruh santri"
          keterangan={`${perSantri.length} santri, diurutkan dari kehadiran tertinggi`}
        />
        {urut.length === 0 ? (
          <Kosong judul="Tidak ada data pada penyaringan ini" />
        ) : (
          <Tabel>
            <thead>
              <tr>
                <Th className="w-12">#</Th>
                <Th>Santri</Th>
                <Th className="hidden lg:table-cell">Halaqah</Th>
                <Th className="text-center">H</Th>
                <Th className="text-center">T</Th>
                <Th className="text-center">I</Th>
                <Th className="text-center">S</Th>
                <Th className="text-center">A</Th>
                <Th className="text-right">Kehadiran</Th>
              </tr>
            </thead>
            <tbody>
              {urut.map((s, i) => (
                <Tr key={s.santriId}>
                  <Td className="text-samar">{i + 1}</Td>
                  <Td>
                    <Link
                      href={`/santri/${s.santriId}`}
                      className="inline-block -my-1 py-1 font-medium text-white transition-colors duration-150 hover:text-aksen"
                    >
                      {s.nama}
                    </Link>
                    <span className="block text-xs text-samar">{s.kampus}</span>
                  </Td>
                  <Td className="hidden text-sekunder lg:table-cell">
                    {s.halaqah ?? "-"}
                  </Td>
                  <Td className="text-center text-sekunder">{s.hadir}</Td>
                  <Td className="text-center text-amber-300/80">{s.terlambat}</Td>
                  <Td className="text-center text-sky-300/80">{s.izin}</Td>
                  <Td className="text-center text-violet-300/80">{s.sakit}</Td>
                  <Td className="text-center text-rose-300/80">{s.alfa}</Td>
                  <Td className="text-right">
                    <span className={cn("font-semibold", warnaKehadiran(s.persen))}>
                      {s.total > 0 ? `${s.persen}%` : "—"}
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Tabel>
        )}
        <p className="border-t border-garis px-5 py-3 text-xs text-samar">
          H = Hadir · T = Terlambat · I = Izin · S = Sakit · A = Tanpa keterangan
        </p>
      </Kartu>
    </>
  );
}
