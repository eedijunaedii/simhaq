import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Kartu, JudulHalaman } from "@/components/ui";
import { genderYangBolehDiakses, wajibAdmin } from "@/lib/auth";
import { GENDER } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Tambah Santri" };

export default async function HalamanSantriBaru() {
  // Mendaftarkan santri berarti membuat akun baru, sekelas dengan pengelolaan
  // akun pada Pengaturan — karena itu dibatasi pada admin.
  const sesi = await wajibAdmin();
  const genderBoleh = genderYangBolehDiakses(sesi).filter(
    (g) => g === GENDER.PUTRA || g === GENDER.PUTRI
  );

  const [kelas, kamar] = await Promise.all([
    prisma.kelas.findMany({
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.kamar.findMany({
      where: { gender: { in: genderBoleh } },
      select: { id: true, nama: true, gedung: true, gender: true },
      orderBy: [{ gedung: "asc" }, { nama: "asc" }],
    }),
  ]);

  const { FormSantri } = await import("./form-santri");

  return (
    <>
      <Link
        href="/santri"
        className="mb-4 inline-flex items-center gap-2 text-sm text-redup transition hover:text-teks"
      >
        <ArrowLeft size={16} />
        Data santri
      </Link>

      <JudulHalaman
        judul="Tambah santri"
        keterangan="Daftarkan santri baru beserta akunnya. Nama pengguna dan kata sandi sementara dibuat otomatis setelah data tersimpan."
      />

      <div className="max-w-3xl">
        <Kartu className="p-6 sm:p-7">
          <FormSantri kelas={kelas} kamar={kamar} genderBoleh={genderBoleh} />
        </Kartu>
      </div>
    </>
  );
}
