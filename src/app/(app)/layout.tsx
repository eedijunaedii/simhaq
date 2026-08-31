import { Shell } from "@/components/shell";
import { filterGender, wajibLogin } from "@/lib/auth";
import { ROLE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { keluar } from "./aksi";

export default async function LayoutAplikasi({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesi = await wajibLogin();

  // Badge penghitung pada menu sidebar, hanya untuk pengurus.
  let badge: { izin?: number; presensi?: number } = {};
  if (sesi.role === ROLE.MUSYRIF || sesi.role === ROLE.ADMIN) {
    const { gender } = filterGender(sesi);
    const [izin, presensi] = await Promise.all([
      prisma.izin.count({
        where: {
          status: { in: ["DIAJUKAN", "DIPROSES"] },
          ...(gender ? { santri: { user: { gender } } } : {}),
        },
      }),
      prisma.sesiPresensi.count({
        where: {
          status: "DIBUKA",
          ...(gender ? { gender: { in: [gender, "SEMUA"] } } : {}),
        },
      }),
    ]);
    badge = { izin, presensi };
  }

  return (
    <Shell
      sesi={{
        nama: sesi.nama,
        role: sesi.role,
        gender: sesi.gender,
        username: sesi.username,
      }}
      badge={badge}
      keluar={keluar}
    >
      {children}
    </Shell>
  );
}
