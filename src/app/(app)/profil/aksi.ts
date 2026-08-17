"use server";

import { revalidatePath } from "next/cache";
import {
  ambilSesi,
  catatAudit,
  cocokKataSandi,
  hashKataSandi,
  wajibLogin,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Hasil = { ok?: string; galat?: string };

export async function ubahKataSandi(_sebelum: Hasil, data: FormData): Promise<Hasil> {
  const sesi = await wajibLogin();

  const lama = String(data.get("lama") ?? "");
  const baru = String(data.get("baru") ?? "");
  const ulangi = String(data.get("ulangi") ?? "");

  if (baru.length < 8) return { galat: "Kata sandi baru minimal 8 karakter." };
  if (baru !== ulangi) return { galat: "Konfirmasi kata sandi tidak cocok." };
  if (baru === lama) return { galat: "Kata sandi baru harus berbeda dari yang lama." };

  const user = await prisma.user.findUnique({
    where: { id: sesi.sub },
    select: { passwordHash: true },
  });
  if (!user) return { galat: "Akun tidak ditemukan." };

  const cocok = await cocokKataSandi(lama, user.passwordHash);
  if (!cocok) return { galat: "Kata sandi lama tidak cocok." };

  await prisma.user.update({
    where: { id: sesi.sub },
    data: { passwordHash: await hashKataSandi(baru) },
  });

  await catatAudit({
    userId: sesi.sub,
    aksi: "UBAH_SANDI",
    entitas: "User",
    entitasId: sesi.sub,
  });

  return { ok: "Kata sandi berhasil diperbarui." };
}

export async function ubahKontak(_sebelum: Hasil, data: FormData): Promise<Hasil> {
  const sesi = await wajibLogin();

  const telepon = String(data.get("telepon") ?? "").trim() || null;
  const email = String(data.get("email") ?? "").trim() || null;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { galat: "Format surel tidak valid." };
  }
  if (telepon && !/^[0-9+\-\s()]{6,20}$/.test(telepon)) {
    return { galat: "Format nomor telepon tidak valid." };
  }

  await prisma.user.update({
    where: { id: sesi.sub },
    data: { telepon, email },
  });

  await catatAudit({
    userId: sesi.sub,
    aksi: "UBAH_KONTAK",
    entitas: "User",
    entitasId: sesi.sub,
  });

  revalidatePath("/profil");
  return { ok: "Data kontak diperbarui." };
}

/** Lepas keterikatan perangkat milik sendiri (santri berganti ponsel). */
export async function lepasPerangkatSendiri(): Promise<void> {
  const sesi = await ambilSesi();
  if (!sesi?.santriId) return;

  await prisma.profilSantri.update({
    where: { id: sesi.santriId },
    data: { deviceId: null, deviceLabel: null, deviceBoundAt: null },
  });
  await catatAudit({
    userId: sesi.sub,
    aksi: "LEPAS_PERANGKAT_SENDIRI",
    entitas: "ProfilSantri",
    entitasId: sesi.santriId,
  });
  revalidatePath("/profil");
}
