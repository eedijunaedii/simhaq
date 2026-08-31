import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Kartu, JudulHalaman } from "@/components/ui";
import { wajibLogin } from "@/lib/auth";
import { ROLE } from "@/lib/constants";

export const metadata: Metadata = { title: "Ajukan Izin" };

export default async function HalamanIzinBaru() {
  const sesi = await wajibLogin();
  if (sesi.role !== ROLE.SANTRI) redirect("/izin");

  const { FormIzin } = await import("./form-izin");

  return (
    <>
      <Link
        href="/izin"
        className="mb-4 inline-flex items-center gap-2 text-sm text-redup transition hover:text-teks"
      >
        <ArrowLeft size={16} />
        Perizinan
      </Link>

      <JudulHalaman
        judul="Ajukan izin"
        keterangan="Isi rentang waktu dan alasan sejelas mungkin. Musyrif akan menerima pengajuan ini dan dapat menyetujuinya langsung dari ponsel."
      />

      <div className="max-w-2xl">
        <Kartu className="p-6 sm:p-7">
          <FormIzin />
        </Kartu>
      </div>
    </>
  );
}
