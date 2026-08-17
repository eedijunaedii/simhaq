"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { catatAudit, hashKataSandi, wajibAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Hasil = { ok?: string; galat?: string };

export async function simpanPengaturan(_sebelum: Hasil, data: FormData): Promise<Hasil> {
  const sesi = await wajibAdmin();

  const isi: Record<string, string> = {
    ambang_pembinaan: String(data.get("ambang") ?? "75"),
    lokasi_lat: String(data.get("lat") ?? ""),
    lokasi_lng: String(data.get("lng") ?? ""),
    radius_meter: String(data.get("radius") ?? "150"),
    wajib_lokasi_default: data.get("wajibLokasi") ? "true" : "false",
  };

  const ambang = Number(isi.ambang_pembinaan);
  if (!Number.isFinite(ambang) || ambang < 1 || ambang > 100) {
    return { galat: "Ambang pembinaan harus antara 1 dan 100." };
  }
  const radius = Number(isi.radius_meter);
  if (!Number.isFinite(radius) || radius < 20 || radius > 5000) {
    return { galat: "Radius harus antara 20 dan 5000 meter." };
  }
  if (isi.lokasi_lat && !Number.isFinite(Number(isi.lokasi_lat))) {
    return { galat: "Lintang tidak valid." };
  }
  if (isi.lokasi_lng && !Number.isFinite(Number(isi.lokasi_lng))) {
    return { galat: "Bujur tidak valid." };
  }

  for (const [kunci, nilai] of Object.entries(isi)) {
    await prisma.pengaturanSistem.upsert({
      where: { kunci },
      create: { kunci, nilai },
      update: { nilai },
    });
  }

  await catatAudit({
    userId: sesi.sub,
    aksi: "UBAH_PENGATURAN",
    entitas: "PengaturanSistem",
    detail: isi,
  });

  revalidatePath("/pengaturan");
  return { ok: "Pengaturan tersimpan." };
}

/** Atur ulang kata sandi seorang pengguna menjadi nilai acak sekali pakai. */
export async function resetKataSandi(userId: string): Promise<void> {
  const sesi = await wajibAdmin();
  const sandiBaru = `mhq${randomBytes(4).toString("hex")}`;

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashKataSandi(sandiBaru) },
  });

  await catatAudit({
    userId: sesi.sub,
    aksi: "RESET_SANDI",
    entitas: "User",
    entitasId: userId,
    detail: { sandiSementara: sandiBaru },
  });

  revalidatePath("/pengaturan");
}

export async function ubahStatusAkun(userId: string, aktif: boolean) {
  const sesi = await wajibAdmin();
  if (userId === sesi.sub) return;

  await prisma.user.update({ where: { id: userId }, data: { aktif } });
  await catatAudit({
    userId: sesi.sub,
    aksi: aktif ? "AKTIFKAN_AKUN" : "NONAKTIFKAN_AKUN",
    entitas: "User",
    entitasId: userId,
  });
  revalidatePath("/pengaturan");
}

/** Buatkan tautan bertoken untuk wali santri. */
export async function buatTokenWali(_sebelum: Hasil, data: FormData): Promise<Hasil> {
  const sesi = await wajibAdmin();

  const santriId = String(data.get("santriId") ?? "");
  const namaWali = String(data.get("namaWali") ?? "").trim();
  const hubungan = String(data.get("hubungan") ?? "Orang tua").trim();

  if (!santriId) return { galat: "Santri wajib dipilih." };
  if (namaWali.length < 3) return { galat: "Nama wali terlalu pendek." };

  const token = randomBytes(16).toString("hex");
  await prisma.waliToken.create({
    data: { token, santriId, namaWali, hubungan },
  });

  await catatAudit({
    userId: sesi.sub,
    aksi: "BUAT_TOKEN_WALI",
    entitas: "WaliToken",
    entitasId: santriId,
  });

  revalidatePath("/pengaturan");
  return { ok: `Tautan wali dibuat: /wali/${token}` };
}

export async function cabutTokenWali(id: string) {
  const sesi = await wajibAdmin();
  await prisma.waliToken.update({ where: { id }, data: { aktif: false } });
  await catatAudit({
    userId: sesi.sub,
    aksi: "CABUT_TOKEN_WALI",
    entitas: "WaliToken",
    entitasId: id,
  });
  revalidatePath("/pengaturan");
}
