"use server";

import { redirect } from "next/navigation";
import { catatAudit, halamanAwal, mulaiSesi, verifikasiKredensial } from "@/lib/auth";

export type StatusLogin = { galat?: string };

export async function masuk(
  _sebelumnya: StatusLogin,
  data: FormData
): Promise<StatusLogin> {
  const username = String(data.get("username") ?? "").trim();
  const kataSandi = String(data.get("kataSandi") ?? "");
  const lanjutDiminta = String(data.get("lanjut") ?? "");

  if (!username || !kataSandi) {
    return { galat: "Nama pengguna dan kata sandi wajib diisi." };
  }

  const sesi = await verifikasiKredensial(username, kataSandi);
  if (!sesi) {
    return { galat: "Nama pengguna atau kata sandi tidak cocok." };
  }

  await mulaiSesi(sesi);
  await catatAudit({
    userId: sesi.sub,
    aksi: "LOGIN",
    entitas: "User",
    entitasId: sesi.sub,
  });

  // Petugas keamanan tidak punya dasbor; halaman awalnya adalah pos gerbang.
  const bawaan = halamanAwal(sesi.role);
  const lanjut =
    lanjutDiminta.startsWith("/") && lanjutDiminta !== "/dashboard"
      ? lanjutDiminta
      : bawaan;
  redirect(lanjut);
}
