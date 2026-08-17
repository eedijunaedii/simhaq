import "server-only";
import { prisma } from "./prisma";
import { STATUS_PRESENSI_DARI_IZIN } from "./constants";

/** Kriteria santri yang menjadi peserta sebuah sesi presensi. */
export function kriteriaPeserta(sesi: {
  gender: string;
  halaqahId: string | null;
}) {
  return {
    status: "AKTIF",
    ...(sesi.halaqahId ? { halaqahId: sesi.halaqahId } : {}),
    ...(sesi.gender === "SEMUA" ? {} : { user: { gender: sesi.gender } }),
  };
}

export async function pesertaSesi(sesi: { gender: string; halaqahId: string | null }) {
  return prisma.profilSantri.findMany({
    where: kriteriaPeserta(sesi),
    select: {
      id: true,
      nim: true,
      kampus: true,
      user: { select: { nama: true, gender: true } },
      halaqah: { select: { nama: true } },
      kamar: { select: { nama: true } },
    },
    orderBy: { user: { nama: "asc" } },
  });
}

/**
 * Terapkan izin yang sudah disetujui ke sebuah sesi: santri yang rentang
 * izinnya menaungi waktu sesi langsung dicatat sebagai IZIN / SAKIT sehingga
 * tidak terhitung tanpa keterangan.
 */
export async function terapkanIzinKeSesi(sesiId: string) {
  const sesi = await prisma.sesiPresensi.findUnique({
    where: { id: sesiId },
    select: {
      id: true,
      gender: true,
      halaqahId: true,
      waktuBuka: true,
      waktuTutup: true,
    },
  });
  if (!sesi) return 0;

  const izin = await prisma.izin.findMany({
    where: {
      status: { in: ["DISETUJUI", "SELESAI"] },
      mulai: { lte: sesi.waktuTutup },
      selesai: { gte: sesi.waktuBuka },
      santri: kriteriaPeserta(sesi),
    },
    select: { id: true, santriId: true, jenis: true },
  });

  let jumlah = 0;
  for (const z of izin) {
    const status = STATUS_PRESENSI_DARI_IZIN[z.jenis] ?? "IZIN";
    const ada = await prisma.presensi.findUnique({
      where: { sesiId_santriId: { sesiId: sesi.id, santriId: z.santriId } },
      select: { id: true, status: true },
    });

    // Jangan menimpa kehadiran yang benar-benar terjadi.
    if (ada && (ada.status === "HADIR" || ada.status === "TERLAMBAT")) continue;

    await prisma.presensi.upsert({
      where: { sesiId_santriId: { sesiId: sesi.id, santriId: z.santriId } },
      create: {
        sesiId: sesi.id,
        santriId: z.santriId,
        status,
        metode: "OTOMATIS_IZIN",
        izinId: z.id,
      },
      update: { status, metode: "OTOMATIS_IZIN", izinId: z.id },
    });
    jumlah++;
  }
  return jumlah;
}

/**
 * Terapkan sebuah izin yang baru disetujui ke seluruh sesi presensi yang
 * berada pada rentang waktunya (termasuk sesi yang sudah ditutup).
 */
export async function terapkanIzinKeSemuaSesi(izinId: string) {
  const izin = await prisma.izin.findUnique({
    where: { id: izinId },
    select: {
      id: true,
      jenis: true,
      mulai: true,
      selesai: true,
      santriId: true,
      santri: {
        select: { halaqahId: true, user: { select: { gender: true } } },
      },
    },
  });
  if (!izin) return 0;

  const status = STATUS_PRESENSI_DARI_IZIN[izin.jenis] ?? "IZIN";

  const sesi = await prisma.sesiPresensi.findMany({
    where: {
      waktuBuka: { lte: izin.selesai },
      waktuTutup: { gte: izin.mulai },
      gender: { in: [izin.santri.user.gender, "SEMUA"] },
      OR: [{ halaqahId: null }, { halaqahId: izin.santri.halaqahId }],
    },
    select: { id: true },
  });

  let jumlah = 0;
  for (const s of sesi) {
    const ada = await prisma.presensi.findUnique({
      where: { sesiId_santriId: { sesiId: s.id, santriId: izin.santriId } },
      select: { status: true },
    });
    if (ada && (ada.status === "HADIR" || ada.status === "TERLAMBAT")) continue;

    await prisma.presensi.upsert({
      where: { sesiId_santriId: { sesiId: s.id, santriId: izin.santriId } },
      create: {
        sesiId: s.id,
        santriId: izin.santriId,
        status,
        metode: "OTOMATIS_IZIN",
        izinId: izin.id,
      },
      update: { status, metode: "OTOMATIS_IZIN", izinId: izin.id },
    });
    jumlah++;
  }
  return jumlah;
}

/**
 * Tandai peserta yang tidak memiliki catatan presensi sebagai ALFA.
 * Dipanggil saat sesi ditutup.
 */
export async function lengkapiAlfa(sesiId: string) {
  const sesi = await prisma.sesiPresensi.findUnique({
    where: { id: sesiId },
    select: { id: true, gender: true, halaqahId: true },
  });
  if (!sesi) return 0;

  const [peserta, sudah] = await Promise.all([
    prisma.profilSantri.findMany({
      where: kriteriaPeserta(sesi),
      select: { id: true },
    }),
    prisma.presensi.findMany({
      where: { sesiId: sesi.id },
      select: { santriId: true },
    }),
  ]);

  const punya = new Set(sudah.map((s) => s.santriId));
  const kurang = peserta.filter((p) => !punya.has(p.id));
  if (kurang.length === 0) return 0;

  await prisma.presensi.createMany({
    data: kurang.map((p) => ({
      sesiId: sesi.id,
      santriId: p.id,
      status: "ALFA",
      metode: "MANUAL",
    })),
  });
  return kurang.length;
}

/** Tutup sesi yang sudah lewat waktunya (dipanggil saat halaman dimuat). */
export async function tutupSesiKedaluwarsa() {
  const kedaluwarsa = await prisma.sesiPresensi.findMany({
    where: { status: "DIBUKA", waktuTutup: { lt: new Date() } },
    select: { id: true },
  });

  for (const s of kedaluwarsa) {
    await terapkanIzinKeSesi(s.id);
    await lengkapiAlfa(s.id);
    await prisma.sesiPresensi.update({
      where: { id: s.id },
      data: { status: "DITUTUP", ditutupPada: new Date() },
    });
  }
  return kedaluwarsa.length;
}
