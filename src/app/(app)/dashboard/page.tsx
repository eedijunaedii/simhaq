import type { Metadata } from "next";
import { JudulHalaman } from "@/components/ui";
import { filterGender, wajibLogin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP, ROLE } from "@/lib/constants";
import { fmtTanggal } from "@/lib/tanggal";
import { DasborPengurus } from "./dasbor-pengurus";
import { DasborSantri } from "./dasbor-santri";

export const metadata: Metadata = { title: "Dasbor" };
export const dynamic = "force-dynamic";

export default async function HalamanDasbor() {
  const sesi = await wajibLogin();
  if (sesi.role === ROLE.PETUGAS) redirect("/gerbang");
  const { gender } = filterGender(sesi);

  const sapaan = sesi.role === ROLE.SANTRI ? "Assalamu'alaikum" : "Assalamu'alaikum";

  return (
    <>
      <JudulHalaman
        judul={`${sapaan}, ${sesi.nama.split(" ").slice(0, 2).join(" ")}`}
        keterangan={`${fmtTanggal(new Date())} · ${APP.lembaga}`}
      />
      {sesi.role === ROLE.SANTRI && sesi.santriId ? (
        <DasborSantri sesi={sesi} />
      ) : (
        <DasborPengurus sesi={sesi} gender={gender} />
      )}
    </>
  );
}
