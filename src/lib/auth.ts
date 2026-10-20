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

/** Pembina atau admin (pengurus). */
export function wajibPengurus() {
  return wajibPeran(ROLE.PEMBINA, ROLE.ADMIN);
}

export function wajibAdmin() {
  return wajibPeran(ROLE.ADMIN);
}

/** Halaman awal setelah masuk; sama untuk seluruh peran. */
export function halamanAwal() {
  return "/dashboard";
}

/**
 * Pembatasan berdasarkan gender sesuai kebijakan hijab pesantren: pembina
 * putra hanya melihat data santri putra, demikian sebaliknya.
 *
 * Admin/pimpinan dikecualikan. Mereka bertanggung jawab atas seluruh
 * pesantren — memaksa pimpinan hanya melihat separuh santrinya membuat rekap,
 * laporan, dan pendataan tidak dapat dipakai untuk mengambil keputusan.
 */
export function filterGender(sesi: Sesi): { gender?: Gender } {
  if (sesi.role === ROLE.ADMIN) return {};
  return { gender: sesi.gender };
}

/** Nilai gender yang boleh diakses, termasuk sesi bergender "SEMUA". */
export function genderYangBolehDiakses(sesi: Sesi): string[] {
  if (sesi.role === ROLE.ADMIN) return ["PUTRA", "PUTRI", "SEMUA"];
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
