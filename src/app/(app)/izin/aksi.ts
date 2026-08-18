"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  catatAudit,
  genderYangBolehDiakses,
  wajibLogin,
  wajibPengurus,
  wajibPenjagaGerbang,
} from "@/lib/auth";
import { JENIS_IZIN, MAKS_LAMPIRAN, ROLE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { terapkanIzinKeSemuaSesi } from "@/lib/presensi";

export type Hasil = { ok?: string; galat?: string };

const JENIS_SAH = Object.values(JENIS_IZIN) as string[];
const TIPE_LAMPIRAN = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

async function kodeIzinBaru() {
  const tahun = new Date().getFullYear();
  const jumlah = await prisma.izin.count({
    where: { kode: { startsWith: `IZN-${tahun}` } },
  });
  return `IZN-${tahun}${String(jumlah + 1).padStart(4, "0")}`;
}

// --- Pengajuan oleh santri ------------------------------------------------

export async function ajukanIzin(_sebelum: Hasil, data: FormData): Promise<Hasil> {
  const sesi = await wajibLogin();
  if (sesi.role !== ROLE.SANTRI || !sesi.santriId) {
    return { galat: "Hanya santri yang dapat mengajukan izin." };
  }

  const jenis = String(data.get("jenis") ?? "");
  const mulaiStr = String(data.get("mulai") ?? "");
  const selesaiStr = String(data.get("selesai") ?? "");
  const alasan = String(data.get("alasan") ?? "").trim();
  const tujuan = String(data.get("tujuan") ?? "").trim() || null;

  if (!JENIS_SAH.includes(jenis)) return { galat: "Jenis izin tidak dikenali." };
  if (!mulaiStr || !selesaiStr) return { galat: "Rentang waktu izin wajib diisi." };
  if (alasan.length < 10) {
    return { galat: "Alasan terlalu singkat. Jelaskan minimal 10 karakter." };
  }

  const mulai = new Date(mulaiStr);
  const selesai = new Date(selesaiStr);
  if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime())) {
    return { galat: "Format waktu tidak valid." };
  }
  if (selesai <= mulai) {
    return { galat: "Waktu selesai harus setelah waktu mulai." };
  }
  if (selesai.getTime() - mulai.getTime() > 30 * 86_400_000) {
    return { galat: "Rentang izin maksimal 30 hari." };
  }

  const bentrok = await prisma.izin.findFirst({
    where: {
      santriId: sesi.santriId,
      status: { in: ["DIAJUKAN", "DIPROSES", "DISETUJUI"] },
      mulai: { lte: selesai },
      selesai: { gte: mulai },
    },
    select: { kode: true },
  });
  if (bentrok) {
    return {
      galat: `Rentang waktu ini bertumpang tindih dengan izin ${bentrok.kode} yang masih berjalan.`,
    };
  }

  // Lampiran bukti (opsional)
  const berkas = data.get("lampiran");
  let lampiran: { namaFile: string; mimeType: string; ukuran: number; data: string } | null =
    null;

  if (berkas instanceof File && berkas.size > 0) {
    if (berkas.size > MAKS_LAMPIRAN) {
      return { galat: "Ukuran lampiran melebihi 2 MB." };
    }
    if (!TIPE_LAMPIRAN.includes(berkas.type)) {
      return { galat: "Lampiran harus berupa gambar (JPG/PNG/WebP) atau PDF." };
    }
    const buf = Buffer.from(await berkas.arrayBuffer());
    lampiran = {
      namaFile: berkas.name,
      mimeType: berkas.type,
      ukuran: berkas.size,
      data: `data:${berkas.type};base64,${buf.toString("base64")}`,
    };
  }

  const izin = await prisma.izin.create({
    data: {
      kode: await kodeIzinBaru(),
      santriId: sesi.santriId,
      jenis,
      mulai,
      selesai,
      alasan,
      tujuan,
      status: "DIAJUKAN",
      ...(lampiran ? { lampiran: { create: lampiran } } : {}),
    },
    select: { id: true, kode: true },
  });

  await catatAudit({
    userId: sesi.sub,
    aksi: "AJUKAN_IZIN",
    entitas: "Izin",
    entitasId: izin.id,
    detail: { jenis, mulai, selesai },
  });

  revalidatePath("/izin");
  revalidatePath("/dashboard");
  redirect(`/izin/${izin.id}`);
}

export async function batalkanIzin(izinId: string) {
  const sesi = await wajibLogin();
  const izin = await prisma.izin.findUnique({
    where: { id: izinId },
    select: { santriId: true, status: true },
  });
  if (!izin) return;
  if (sesi.role === ROLE.SANTRI && izin.santriId !== sesi.santriId) return;
  if (!["DIAJUKAN", "DIPROSES"].includes(izin.status)) return;

  await prisma.izin.update({
    where: { id: izinId },
    data: { status: "DIBATALKAN" },
  });
  await catatAudit({
    userId: sesi.sub,
    aksi: "BATAL_IZIN",
    entitas: "Izin",
    entitasId: izinId,
  });

  revalidatePath("/izin");
  revalidatePath(`/izin/${izinId}`);
}

// --- Pemrosesan oleh pengurus --------------------------------------------

async function pastikanBerwenang(izinId: string) {
  const sesi = await wajibPengurus();
  const izin = await prisma.izin.findUnique({
    where: { id: izinId },
    select: {
      id: true,
      status: true,
      santri: { select: { user: { select: { gender: true } } } },
    },
  });
  if (!izin) return null;
  if (!genderYangBolehDiakses(sesi).includes(izin.santri.user.gender)) return null;
  return { sesi, izin };
}

export async function prosesIzin(
  izinId: string,
  keputusan: "DISETUJUI" | "DITOLAK" | "DIPROSES",
  catatan?: string
) {
  const konteks = await pastikanBerwenang(izinId);
  if (!konteks) return;
  const { sesi, izin } = konteks;

  if (!["DIAJUKAN", "DIPROSES"].includes(izin.status)) return;

  await prisma.izin.update({
    where: { id: izinId },
    data: {
      status: keputusan,
      diprosesOlehId: sesi.sub,
      waktuProses: new Date(),
      catatanPengurus: catatan?.trim() || null,
    },
  });

  // Izin yang disetujui langsung menutup sesi presensi pada rentang waktunya.
  let terdampak = 0;
  if (keputusan === "DISETUJUI") {
    terdampak = await terapkanIzinKeSemuaSesi(izinId);
  }

  await catatAudit({
    userId: sesi.sub,
    aksi: `IZIN_${keputusan}`,
    entitas: "Izin",
    entitasId: izinId,
    detail: { catatan, sesiTerdampak: terdampak },
  });

  revalidatePath("/izin");
  revalidatePath(`/izin/${izinId}`);
  revalidatePath("/dashboard");
}

export async function setujuiIzinDariForm(data: FormData) {
  const izinId = String(data.get("izinId") ?? "");
  const catatan = String(data.get("catatan") ?? "");
  await prosesIzin(izinId, "DISETUJUI", catatan);
}

export async function tolakIzinDariForm(data: FormData) {
  const izinId = String(data.get("izinId") ?? "");
  const catatan = String(data.get("catatan") ?? "");
  await prosesIzin(izinId, "DITOLAK", catatan);
}

/**
 * Catat bahwa santri sudah kembali ke pesantren.
 *
 * Boleh dilakukan petugas keamanan di gerbang maupun musyrif. Petugas tidak
 * dibatasi gender karena ia menjaga satu pintu untuk seluruh santri.
 */
export async function tandaiKembali(izinId: string) {
  const sesi = await wajibPenjagaGerbang();

  const izin = await prisma.izin.findUnique({
    where: { id: izinId },
    select: {
      selesai: true,
      status: true,
      santriId: true,
      santri: { select: { user: { select: { gender: true } } } },
    },
  });
  if (!izin || izin.status !== "DISETUJUI") return;
  if (!genderYangBolehDiakses(sesi).includes(izin.santri.user.gender)) return;

  const sekarang = new Date();
  const terlambat = sekarang > izin.selesai;

  await prisma.izin.update({
    where: { id: izinId },
    data: {
      status: "SELESAI",
      waktuKembali: sekarang,
      terlambatKembali: terlambat,
    },
  });

  // Temuan pengawasan hanya dibuat bila keterlambatan benar-benar terbukti,
  // yakni saat ada orang yang mengonfirmasi kepulangan setelah batas waktu.
  if (terlambat) {
    await prisma.flagPelanggaran.create({
      data: {
        santriId: izin.santriId,
        jenis: "TELAT_KEMBALI",
        keterangan: `Kembali ${Math.round(
          (sekarang.getTime() - izin.selesai.getTime()) / 60000
        )} menit melewati batas izin, dikonfirmasi ${sesi.nama}.`,
      },
    });
  }

  await catatAudit({
    userId: sesi.sub,
    aksi: "IZIN_SELESAI",
    entitas: "Izin",
    entitasId: izinId,
    detail: { terlambat },
  });

  revalidatePath(`/izin/${izinId}`);
  revalidatePath("/izin");
  revalidatePath("/gerbang");
}

/**
 * Izin yang batas waktunya sudah lewat namun belum ada yang mengonfirmasi
 * kepulangan santrinya.
 *
 * Ini sengaja TIDAK dicatat sebagai temuan pelanggaran. Belum dikonfirmasi
 * belum tentu terlambat — bisa jadi santrinya pulang tepat waktu dan petugas
 * yang belum sempat menandai. Menuduh lebih dulu membuat halaman Pengawasan
 * penuh laporan palsu, dan pengurus berhenti mempercayainya.
 *
 * Keterlambatan baru dicatat sebagai temuan oleh `tandaiKembali()`, yaitu saat
 * ada orang yang benar-benar mengonfirmasi kepulangan setelah batas waktu.
 */
export async function izinBelumDikonfirmasi(gender?: string) {
  return prisma.izin.findMany({
    where: {
      status: "DISETUJUI",
      selesai: { lt: new Date() },
      waktuKembali: null,
      ...(gender ? { santri: { user: { gender } } } : {}),
    },
    select: {
      id: true,
      kode: true,
      jenis: true,
      mulai: true,
      selesai: true,
      santri: {
        select: {
          id: true,
          user: { select: { nama: true } },
          halaqah: { select: { nama: true } },
        },
      },
    },
    orderBy: { selesai: "asc" },
  });
}
