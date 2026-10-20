"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { catatAudit, hashKataSandi, wajibAdmin } from "@/lib/auth";
import { GENDER } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type Hasil = { ok?: string; galat?: string };

const BELUM_DIISI = "Belum diisi";

/**
 * Nama pengguna dari nama santri: huruf saja, dipotong 10 karakter, lalu
 * diberi nomor urut tiga digit. Nomornya dicari sampai belum terpakai agar
 * dua santri bernama mirip tidak bertabrakan.
 */
async function usernameUnik(nama: string): Promise<string> {
  const dasar = nama.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10) || "santri";
  for (let n = 1; n <= 999; n++) {
    const calon = `${dasar}${String(n).padStart(3, "0")}`;
    const ada = await prisma.user.findUnique({
      where: { username: calon },
      select: { id: true },
    });
    if (!ada) return calon;
  }
  throw new Error("Gagal membuat nama pengguna yang unik.");
}

function teks(data: FormData, kunci: string): string {
  return String(data.get(kunci) ?? "").trim();
}

export async function tambahSantri(_sebelum: Hasil, data: FormData): Promise<Hasil> {
  const sesi = await wajibAdmin();

  const nama = teks(data, "nama");
  const gender = teks(data, "gender");
  const nim = teks(data, "nim");
  const angkatanMentah = teks(data, "angkatan");

  if (nama.length < 3) return { galat: "Nama santri minimal 3 huruf." };
  if (gender !== GENDER.PUTRA && gender !== GENDER.PUTRI) {
    return { galat: "Gender santri belum dipilih." };
  }
  if (!nim) return { galat: "NIM wajib diisi." };

  const tahunIni = new Date().getFullYear();
  const angkatan = Number(angkatanMentah);
  if (!Number.isInteger(angkatan) || angkatan < 2000 || angkatan > tahunIni + 1) {
    return { galat: `Angkatan harus berupa tahun antara 2000 dan ${tahunIni + 1}.` };
  }

  const nimBentrok = await prisma.profilSantri.findFirst({
    where: { nim },
    select: { user: { select: { nama: true } } },
  });
  if (nimBentrok) {
    return { galat: `NIM ${nim} sudah terdaftar atas nama ${nimBentrok.user.nama}.` };
  }

  /* Kelas dan kamar bersifat opsional supaya pengurus dapat mendaftarkan
     santri lebih dulu dan menempatkannya belakangan. Keduanya tetap
     diperiksa agar id yang dikirim benar-benar ada. */
  const kelasId = teks(data, "kelasId") || null;
  const kamarId = teks(data, "kamarId") || null;
  if (kelasId && !(await prisma.kelas.findUnique({ where: { id: kelasId }, select: { id: true } }))) {
    return { galat: "Kelas yang dipilih tidak ditemukan." };
  }
  if (kamarId) {
    const kamar = await prisma.kamar.findUnique({
      where: { id: kamarId },
      select: { gender: true, kapasitas: true, _count: { select: { santri: true } } },
    });
    if (!kamar) return { galat: "Kamar yang dipilih tidak ditemukan." };
    if (kamar.gender !== gender) {
      return { galat: "Kamar yang dipilih bukan untuk gender santri ini." };
    }
    if (kamar._count.santri >= kamar.kapasitas) {
      return { galat: "Kamar yang dipilih sudah penuh." };
    }
  }

  const username = await usernameUnik(nama);
  const sandiAwal = `mhq${randomBytes(4).toString("hex")}`;

  const user = await prisma.user.create({
    data: {
      nama,
      username,
      passwordHash: await hashKataSandi(sandiAwal),
      role: "SANTRI",
      gender,
      telepon: teks(data, "telepon") || null,
      santri: {
        create: {
          nim,
          kampus: teks(data, "kampus") || BELUM_DIISI,
          jurusan: teks(data, "jurusan") || BELUM_DIISI,
          angkatan,
          asalDaerah: teks(data, "asalDaerah") || BELUM_DIISI,
          status: "AKTIF",
          kelasId,
          kamarId,
        },
      },
    },
    select: { id: true },
  });

  await catatAudit({
    userId: sesi.sub,
    aksi: "TAMBAH_SANTRI",
    entitas: "User",
    entitasId: user.id,
    detail: { nama, username, nim, sandiAwal },
  });

  revalidatePath("/santri");
  revalidatePath("/kelas");

  return {
    ok:
      `${nama} berhasil didaftarkan. Nama pengguna: ${username}, ` +
      `kata sandi sementara: ${sandiAwal}. Catat sekarang — kata sandi ini ` +
      `hanya ditampilkan sekali, dan dapat diatur ulang lewat Pengaturan.`,
  };
}
