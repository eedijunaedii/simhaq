import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Kartu, JudulHalaman, Kosong, TautanTombol } from "@/components/ui";
import { genderYangBolehDiakses, wajibPengurus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FormBukaSesi } from "./form-buka";

export const metadata: Metadata = { title: "Buka Sesi Presensi" };
export const dynamic = "force-dynamic";

export default async function HalamanBukaSesi() {
  const pengguna = await wajibPengurus();
  const genderBoleh = genderYangBolehDiakses(pengguna);

  const [kegiatan, kelas, pengaturan] = await Promise.all([
    prisma.kegiatan.findMany({
      where: { aktif: true },
      select: {
        id: true,
        nama: true,
        kategori: true,
        gender: true,
        toleransiTerlambatMenit: true,
        jadwal: {
          where: { aktif: true },
          select: { hari: true, jamMulai: true, jamSelesai: true, lokasi: true },
        },
      },
      orderBy: { nama: "asc" },
    }),
    prisma.kelas.findMany({
      where: { gender: { in: genderBoleh } },
      select: { id: true, nama: true, gender: true },
      orderBy: { nama: "asc" },
    }),
    prisma.pengaturanSistem.findMany({
      where: { kunci: { in: ["lokasi_lat", "lokasi_lng", "radius_meter"] } },
    }),
  ]);

  const peta = Object.fromEntries(pengaturan.map((p) => [p.kunci, p.nilai]));

  return (
    <>
      <Link
        href="/presensi"
        className="mb-4 inline-flex items-center gap-2 text-sm text-redup transition hover:text-teks"
      >
        <ArrowLeft size={16} />
        Sesi presensi
      </Link>

      <JudulHalaman
        judul="Buka sesi presensi"
        keterangan="Sesi akan menampilkan QR Code dinamis yang isinya berganti setiap 40 detik. Sesi menutup sendiri pada waktu yang ditentukan."
      />

      <div className="max-w-3xl">
        <Kartu className="p-6 sm:p-7">
          {kegiatan.length === 0 ? (
            <Kosong
              judul="Belum ada kegiatan"
              keterangan="Admin perlu menambahkan jenis kegiatan terlebih dahulu."
              aksi={
                <TautanTombol href="/kegiatan" ukuran="sm">
                  Kelola kegiatan
                </TautanTombol>
              }
            />
          ) : (
            <FormBukaSesi
              kegiatan={kegiatan}
              kelas={kelas}
              genderTersedia={genderBoleh.filter((g) => g !== "SEMUA").concat(
                genderBoleh.length > 2 ? ["SEMUA"] : []
              )}
              genderBawaan={pengguna.gender}
              lokasiBawaan={{
                lat: peta.lokasi_lat ?? "-6.893056",
                lng: peta.lokasi_lng ?? "107.590278",
                radius: Number(peta.radius_meter ?? 150),
              }}
            />
          )}
        </Kartu>
      </div>
    </>
  );
}
