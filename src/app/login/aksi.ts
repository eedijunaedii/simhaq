"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { catatAudit, halamanAwal, mulaiSesi, verifikasiKredensial } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type StatusLogin = { galat?: string };

/*
  Pembatas percobaan login (anti brute-force). Percobaan gagal dicatat pada
  tabel PercobaanLogin; bila melebihi ambang dalam jendela waktu, permintaan
  ditolak lebih dulu sebelum verifikasi kredensial dijalankan.
*/
const JENDELA_MS = 15 * 60 * 1000; // 15 menit
const BATAS_PER_USERNAME = 10;
const BATAS_PER_IP = 30;

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

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // Bersihkan catatan lama (lebih dari 24 jam) agar tabel tetap kecil.
  await prisma.percobaanLogin.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });

  // Cek ambang sebelum verifikasi, supaya percobaan berulang tidak membebani
  // bcrypt.
  const sejak = new Date(Date.now() - JENDELA_MS);
  const [gagalUser, gagalIp] = await Promise.all([
    prisma.percobaanLogin.count({
      where: { username, berhasil: false, createdAt: { gte: sejak } },
    }),
    ip
      ? prisma.percobaanLogin.count({
          where: { ip, berhasil: false, createdAt: { gte: sejak } },
        })
      : Promise.resolve(0),
  ]);

  if (gagalUser >= BATAS_PER_USERNAME || gagalIp >= BATAS_PER_IP) {
    return {
      galat: "Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit.",
    };
  }

  const sesi = await verifikasiKredensial(username, kataSandi);

  await prisma.percobaanLogin.create({
    data: { username, ip, berhasil: Boolean(sesi) },
  });

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
