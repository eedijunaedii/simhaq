import { NextResponse } from "next/server";
import { ambilSesi, genderYangBolehDiakses } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buatTokenQr } from "@/lib/qr-token";

/**
 * Token QR aktif untuk sebuah sesi, dipanggil berulang oleh layar presensi.
 * Hanya pengurus yang berwenang atas sesi tersebut yang boleh mengambilnya.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const pengguna = await ambilSesi();

  if (!pengguna || pengguna.role === "SANTRI") {
    return NextResponse.json({ galat: "Tidak berwenang." }, { status: 403 });
  }

  const sesi = await prisma.sesiPresensi.findUnique({
    where: { id },
    select: {
      id: true,
      secret: true,
      rotasiDetik: true,
      status: true,
      gender: true,
      waktuTutup: true,
    },
  });
  if (!sesi) {
    return NextResponse.json({ galat: "Sesi tidak ditemukan." }, { status: 404 });
  }
  if (!genderYangBolehDiakses(pengguna).includes(sesi.gender)) {
    return NextResponse.json({ galat: "Tidak berwenang." }, { status: 403 });
  }
  if (sesi.status !== "DIBUKA") {
    return NextResponse.json({ status: sesi.status, token: null });
  }

  const { token, sisaMs } = buatTokenQr(sesi.id, sesi.secret, sesi.rotasiDetik);

  const perStatus = await prisma.presensi.groupBy({
    by: ["status"],
    _count: { _all: true },
    where: { sesiId: sesi.id },
  });

  const hitungan: Record<string, number> = {};
  for (const p of perStatus) hitungan[p.status] = p._count._all;

  return NextResponse.json(
    {
      status: sesi.status,
      token,
      sisaMs,
      rotasiDetik: sesi.rotasiDetik,
      waktuTutup: sesi.waktuTutup.toISOString(),
      hitungan,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
