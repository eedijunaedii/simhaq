import { SignJWT, jwtVerify } from "jose";
import type { Gender, Role } from "./constants";

export const COOKIE_SESI = "simhaq_session";
export const UMUR_SESI_DETIK = 60 * 60 * 24 * 7; // 7 hari

export type Sesi = {
  sub: string; // id User
  nama: string;
  username: string;
  role: Role;
  gender: Gender;
  santriId?: string;
};

function kunci(): Uint8Array {
  const rahasia = process.env.AUTH_SECRET;
  if (!rahasia || rahasia.length < 16) {
    throw new Error(
      "AUTH_SECRET belum diatur (minimal 16 karakter). Salin .env.example menjadi .env lalu isi AUTH_SECRET."
    );
  }
  return new TextEncoder().encode(rahasia);
}

export async function buatTokenSesi(sesi: Sesi): Promise<string> {
  return new SignJWT({ ...sesi })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sesi.sub)
    .setIssuedAt()
    .setExpirationTime(`${UMUR_SESI_DETIK}s`)
    .sign(kunci());
}

export async function bacaTokenSesi(token: string | undefined): Promise<Sesi | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci());
    return {
      sub: String(payload.sub),
      nama: String(payload.nama),
      username: String(payload.username),
      role: payload.role as Role,
      gender: payload.gender as Gender,
      santriId: payload.santriId ? String(payload.santriId) : undefined,
    };
  } catch {
    return null;
  }
}
