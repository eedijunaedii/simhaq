"use server";

import { revalidatePath } from "next/cache";
import { catatAudit, wajibAdmin } from "@/lib/auth";
import { KATEGORI_KEGIATAN } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type Hasil = { ok?: string; galat?: string };

const KATEGORI_SAH = Object.values(KATEGORI_KEGIATAN) as string[];
const GENDER_SAH = ["PUTRA", "PUTRI", "SEMUA"];

export async function simpanKegiatan(_sebelum: Hasil, data: FormData): Promise<Hasil> {
  const sesi = await wajibAdmin();

  const id = String(data.get("id") ?? "") || null;
  const kode = String(data.get("kode") ?? "").trim().toUpperCase();
  const nama = String(data.get("nama") ?? "").trim();
  const kategori = String(data.get("kategori") ?? "");
  const gender = String(data.get("gender") ?? "SEMUA");
  const deskripsi = String(data.get("deskripsi") ?? "").trim() || null;
  const toleransi = Number(data.get("toleransi") ?? 10);
  const pengampuId = String(data.get("pengampuId") ?? "") || null;
  const aktif = data.get("aktif") !== null;

  if (!kode || !/^[A-Z0-9_-]{2,20}$/.test(kode)) {
    return { galat: "Kode kegiatan wajib diisi (2–20 huruf kapital/angka)." };
  }
  if (nama.length < 3) return { galat: "Nama kegiatan terlalu pendek." };
  if (!KATEGORI_SAH.includes(kategori)) return { galat: "Kategori tidak dikenali." };
  if (!GENDER_SAH.includes(gender)) return { galat: "Kelompok tidak dikenali." };
  if (toleransi < 0 || toleransi > 120) {
    return { galat: "Toleransi keterlambatan harus 0–120 menit." };
  }

  const bentrok = await prisma.kegiatan.findFirst({
    where: { kode, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (bentrok) return { galat: `Kode ${kode} sudah dipakai kegiatan lain.` };

  const isi = {
    kode,
    nama,
    kategori,
    gender,
    deskripsi,
    toleransiTerlambatMenit: toleransi,
    pengampuId,
    aktif,
  };

  if (id) {
    await prisma.kegiatan.update({ where: { id }, data: isi });
  } else {
    await prisma.kegiatan.create({ data: isi });
  }

  await catatAudit({
    userId: sesi.sub,
    aksi: id ? "UBAH_KEGIATAN" : "TAMBAH_KEGIATAN",
    entitas: "Kegiatan",
    entitasId: id,
    detail: isi,
  });

  revalidatePath("/kegiatan");
  return { ok: id ? "Kegiatan diperbarui." : "Kegiatan ditambahkan." };
}

export async function hapusKegiatan(id: string) {
  const sesi = await wajibAdmin();
  const jumlahSesi = await prisma.sesiPresensi.count({ where: { kegiatanId: id } });

  if (jumlahSesi > 0) {
    // Kegiatan yang sudah punya riwayat presensi dinonaktifkan, bukan dihapus,
    // agar rekap lama tetap utuh.
    await prisma.kegiatan.update({ where: { id }, data: { aktif: false } });
  } else {
    await prisma.kegiatan.delete({ where: { id } });
  }

  await catatAudit({
    userId: sesi.sub,
    aksi: jumlahSesi > 0 ? "NONAKTIF_KEGIATAN" : "HAPUS_KEGIATAN",
    entitas: "Kegiatan",
    entitasId: id,
  });
  revalidatePath("/kegiatan");
}

export async function tambahJadwal(_sebelum: Hasil, data: FormData): Promise<Hasil> {
  const sesi = await wajibAdmin();

  const kegiatanId = String(data.get("kegiatanId") ?? "");
  const hari = Number(data.get("hari") ?? -1);
  const jamMulai = String(data.get("jamMulai") ?? "");
  const jamSelesai = String(data.get("jamSelesai") ?? "");
  const lokasi = String(data.get("lokasi") ?? "").trim();

  if (!kegiatanId) return { galat: "Kegiatan tidak dikenali." };
  if (hari < 0 || hari > 6) return { galat: "Hari tidak valid." };
  if (!/^\d{2}:\d{2}$/.test(jamMulai) || !/^\d{2}:\d{2}$/.test(jamSelesai)) {
    return { galat: "Format jam harus HH:MM." };
  }
  if (jamSelesai <= jamMulai) return { galat: "Jam selesai harus setelah jam mulai." };
  if (!lokasi) return { galat: "Lokasi wajib diisi." };

  await prisma.jadwalKegiatan.create({
    data: { kegiatanId, hari, jamMulai, jamSelesai, lokasi },
  });

  await catatAudit({
    userId: sesi.sub,
    aksi: "TAMBAH_JADWAL",
    entitas: "JadwalKegiatan",
    entitasId: kegiatanId,
    detail: { hari, jamMulai, jamSelesai, lokasi },
  });

  revalidatePath("/kegiatan");
  return { ok: "Jadwal ditambahkan." };
}

export async function hapusJadwal(id: string) {
  const sesi = await wajibAdmin();
  await prisma.jadwalKegiatan.delete({ where: { id } });
  await catatAudit({
    userId: sesi.sub,
    aksi: "HAPUS_JADWAL",
    entitas: "JadwalKegiatan",
    entitasId: id,
  });
  revalidatePath("/kegiatan");
}
