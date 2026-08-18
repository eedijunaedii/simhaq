import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { ROLE, type Gender, type Role } from "./constants";
import {
  COOKIE_SESI,
  UMUR_SESI_DETIK,
  bacaTokenSesi,
  buatTokenSesi,
  type Sesi,
} from "./session";

export type { Sesi };

// --- Kata sandi -----------------------------------------------------------

export function hashKataSandi(kataSandi: string) {
  return bcrypt.hash(kataSandi, 10);
}

export function cocokKataSandi(kataSandi: string, hash: string) {
  return bcrypt.compare(kataSandi, hash);
}

// --- Sesi -----------------------------------------------------------------

export async function ambilSesi(): Promise<Sesi | null> {
  const jar = await cookies();
  return bacaTokenSesi(jar.get(COOKIE_SESI)?.value);
}

export async function mulaiSesi(sesi: Sesi) {
  const token = await buatTokenSesi(sesi);
  const jar = await cookies();
  jar.set(COOKIE_SESI, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UMUR_SESI_DETIK,
  });
}

export async function akhiriSesi() {
  const jar = await cookies();
  jar.delete(COOKIE_SESI);
}

// --- Penjaga akses --------------------------------------------------------

/** Wajib login. Melempar ke /login bila belum masuk. */
export async function wajibLogin(): Promise<Sesi> {
  const sesi = await ambilSesi();
  if (!sesi) redirect("/login");
  return sesi;
}

/** Wajib login dengan salah satu peran tertentu. */
export async function wajibPeran(...peran: Role[]): Promise<Sesi> {
  const sesi = await wajibLogin();
  if (!peran.includes(sesi.role)) redirect("/dashboard");
  return sesi;
}

/** Musyrif atau admin (pengurus). */
export function wajibPengurus() {
  return wajibPeran(ROLE.MUSYRIF, ROLE.ADMIN);
}

export function wajibAdmin() {
  return wajibPeran(ROLE.ADMIN);
}

/**
 * Boleh memeriksa kartu izin dan mencatat kepulangan santri di gerbang.
 *
 * Petugas keamanan sengaja tidak dimasukkan ke `wajibPengurus`: ia hanya
 * berwenang pada dua tindakan gerbang tersebut, bukan pada data santri,
 * rekap kehadiran, maupun persetujuan izin.
 */
export function wajibPenjagaGerbang() {
  return wajibPeran(ROLE.PETUGAS, ROLE.MUSYRIF, ROLE.ADMIN);
}

export function bolehJagaGerbang(role: Role) {
  return role === ROLE.PETUGAS || role === ROLE.MUSYRIF || role === ROLE.ADMIN;
}

/** Halaman awal setelah masuk, berbeda menurut peran. */
export function halamanAwal(role: Role) {
  return role === ROLE.PETUGAS ? "/gerbang" : "/dashboard";
}

/**
 * Pembatasan berdasarkan gender sesuai kebijakan hijab pesantren:
 * pengurus putra hanya melihat data santri putra, demikian sebaliknya.
 * Admin/pimpinan tetap dibatasi kecuali diberi izin lintas gender.
 */
export function filterGender(sesi: Sesi): { gender?: Gender } {
  if (sesi.role === ROLE.ADMIN && process.env.ADMIN_LINTAS_GENDER === "true") {
    return {};
  }
  // Petugas keamanan menjaga satu gerbang untuk seluruh santri, sehingga tidak
  // dibatasi gender. Sebagai gantinya, data yang ditampilkan kepadanya dibatasi
  // seminimal mungkin: nama, jenis izin, dan batas waktu kembali saja.
  if (sesi.role === ROLE.PETUGAS) return {};
  return { gender: sesi.gender };
}

/** Nilai gender yang boleh diakses, termasuk sesi bergender "SEMUA". */
export function genderYangBolehDiakses(sesi: Sesi): string[] {
  if (sesi.role === ROLE.ADMIN && process.env.ADMIN_LINTAS_GENDER === "true") {
    return ["PUTRA", "PUTRI", "SEMUA"];
  }
  if (sesi.role === ROLE.PETUGAS) return ["PUTRA", "PUTRI", "SEMUA"];
  return [sesi.gender, "SEMUA"];
}

// --- Login ----------------------------------------------------------------

export async function verifikasiKredensial(username: string, kataSandi: string) {
  const user = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
    include: { santri: { select: { id: true } } },
  });
  if (!user || !user.aktif) return null;
  const cocok = await cocokKataSandi(kataSandi, user.passwordHash);
  if (!cocok) return null;

  const sesi: Sesi = {
    sub: user.id,
    nama: user.nama,
    username: user.username,
    role: user.role as Role,
    gender: user.gender as Gender,
    santriId: user.santri?.id,
  };
  return sesi;
}

// --- Audit ----------------------------------------------------------------

export async function catatAudit(input: {
  userId?: string | null;
  aksi: string;
  entitas: string;
  entitasId?: string | null;
  detail?: unknown;
}) {
  const h = await headers();
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      aksi: input.aksi,
      entitas: input.entitas,
      entitasId: input.entitasId ?? null,
      detail: input.detail === undefined ? null : JSON.stringify(input.detail),
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: h.get("user-agent"),
    },
  });
}
