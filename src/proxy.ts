import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESI, bacaTokenSesi } from "@/lib/session";

/**
 * Pemeriksaan sesi awal (optimistic check). Otorisasi sebenarnya tetap
 * dilakukan ulang di setiap halaman & server action lewat `wajibPeran()`.
 */

const RUTE_TERLINDUNGI = [
  "/dashboard",
  "/presensi",
  "/izin",
  "/santri",
  "/kegiatan",
  "/kelas",
  "/kamar",
  "/pengajar",
  "/laporan",
  "/pengawasan",
  "/pengaturan",
  "/profil",
  "/scan",
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const perluAuth = RUTE_TERLINDUNGI.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );

  const sesi = await bacaTokenSesi(request.cookies.get(COOKIE_SESI)?.value);

  if (perluAuth && !sesi) {
    const url = new URL("/login", request.url);
    url.searchParams.set("lanjut", pathname + search);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && sesi) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Lewati aset statis, gambar, dan berkas PWA.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|ikon.*|.*\\.png$|.*\\.svg$).*)",
  ],
};
