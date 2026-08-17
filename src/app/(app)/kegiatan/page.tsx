import type { Metadata } from "next";
import { JudulHalaman } from "@/components/ui";
import { wajibAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PengelolaKegiatan } from "./pengelola";

export const metadata: Metadata = { title: "Kegiatan" };
export const dynamic = "force-dynamic";

export default async function HalamanKegiatan() {
  await wajibAdmin();

  const [kegiatan, pengajar] = await Promise.all([
    prisma.kegiatan.findMany({
      select: {
        id: true,
        kode: true,
        nama: true,
        kategori: true,
        gender: true,
        deskripsi: true,
        toleransiTerlambatMenit: true,
        aktif: true,
        pengampuId: true,
        pengampu: { select: { user: { select: { nama: true } } } },
        jadwal: {
          select: { id: true, hari: true, jamMulai: true, jamSelesai: true, lokasi: true },
        },
        _count: { select: { sesi: true } },
      },
      orderBy: [{ aktif: "desc" }, { nama: "asc" }],
    }),
    prisma.profilPengajar.findMany({
      select: { id: true, user: { select: { nama: true } } },
      orderBy: { user: { nama: "asc" } },
    }),
  ]);

  return (
    <>
      <JudulHalaman
        judul="Jenis kegiatan & jadwal"
        keterangan="Kegiatan wajib pesantren beserta jadwal rutinnya. Jadwal dipakai sebagai nilai bawaan saat musyrif membuka sesi presensi."
      />
      <PengelolaKegiatan
        kegiatan={kegiatan}
        pengajar={pengajar.map((p) => ({ id: p.id, nama: p.user.nama }))}
      />
    </>
  );
}
