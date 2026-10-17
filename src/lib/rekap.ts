import "server-only";
import { prisma } from "./prisma";
import { STATUS_DIHITUNG_HADIR } from "./constants";
import { awalHari, akhirHari, tambahHari } from "./tanggal";
import { persen } from "./utils";

export type Rentang = { mulai: Date; selesai: Date };

export function rentang30Hari(): Rentang {
  return { mulai: awalHari(tambahHari(new Date(), -29)), selesai: akhirHari() };
}

/** Filter presensi berdasarkan gender santri (kebijakan hijab). */
function whereGender(gender?: string) {
  return gender ? { santri: { user: { gender } } } : {};
}

// --- Ringkasan dasbor -----------------------------------------------------

export async function ringkasanDasbor(gender?: string) {
  const r = rentang30Hari();
  const filterSantri = gender ? { user: { gender } } : {};

  const [
    jumlahSantri,
    sesiHariIni,
    sesiTerbuka,
    izinMenunggu,
    izinBerjalan,
    flagBaru,
    agregat,
  ] = await Promise.all([
    prisma.profilSantri.count({ where: { ...filterSantri, status: "AKTIF" } }),
    prisma.sesiPresensi.count({
      where: {
        tanggal: { gte: awalHari(), lte: akhirHari() },
        ...(gender ? { gender: { in: [gender, "SEMUA"] } } : {}),
      },
    }),
    prisma.sesiPresensi.count({
      where: {
        status: "DIBUKA",
        ...(gender ? { gender: { in: [gender, "SEMUA"] } } : {}),
      },
    }),
    prisma.izin.count({
      where: {
        status: { in: ["DIAJUKAN", "DIPROSES"] },
        ...(gender ? { santri: { user: { gender } } } : {}),
      },
    }),
    prisma.izin.count({
      where: {
        status: "DISETUJUI",
        mulai: { lte: new Date() },
        selesai: { gte: new Date() },
        ...(gender ? { santri: { user: { gender } } } : {}),
      },
    }),
    prisma.flagPelanggaran.count({
      where: {
        status: "BARU",
        ...(gender ? { santri: { user: { gender } } } : {}),
      },
    }),
    prisma.presensi.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: {
        sesi: { tanggal: { gte: r.mulai, lte: r.selesai } },
        ...whereGender(gender),
      },
    }),
  ]);

  const perStatus: Record<string, number> = {};
  let total = 0;
  for (const a of agregat) {
    perStatus[a.status] = a._count._all;
    total += a._count._all;
  }
  const hadir = STATUS_DIHITUNG_HADIR.reduce((s, k) => s + (perStatus[k] ?? 0), 0);

  return {
    jumlahSantri,
    sesiHariIni,
    sesiTerbuka,
    izinMenunggu,
    izinBerjalan,
    flagBaru,
    perStatus,
    totalPresensi: total,
    persenKehadiran: persen(hadir, total),
    rentang: r,
  };
}

// --- Rekap per santri -----------------------------------------------------

export type BarisSantri = {
  santriId: string;
  nama: string;
  gender: string;
  kampus: string;
  halaqah: string | null;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alfa: number;
  total: number;
  persen: number;
};

export async function rekapPerSantri(opsi: {
  gender?: string;
  rentang?: Rentang;
  halaqahId?: string;
  kegiatanId?: string;
}): Promise<BarisSantri[]> {
  const r = opsi.rentang ?? rentang30Hari();

  const [santri, agregat] = await Promise.all([
    prisma.profilSantri.findMany({
      where: {
        status: "AKTIF",
        ...(opsi.gender ? { user: { gender: opsi.gender } } : {}),
        ...(opsi.halaqahId ? { halaqahId: opsi.halaqahId } : {}),
      },
      select: {
        id: true,
        kampus: true,
        user: { select: { nama: true, gender: true } },
        halaqah: { select: { nama: true } },
      },
      orderBy: { user: { nama: "asc" } },
    }),
    prisma.presensi.groupBy({
      by: ["santriId", "status"],
      _count: { _all: true },
      where: {
        sesi: {
          tanggal: { gte: r.mulai, lte: r.selesai },
          ...(opsi.kegiatanId ? { kegiatanId: opsi.kegiatanId } : {}),
        },
        ...(opsi.halaqahId ? { santri: { halaqahId: opsi.halaqahId } } : {}),
        ...whereGender(opsi.gender),
      },
    }),
  ]);

  const peta = new Map<string, Record<string, number>>();
  for (const a of agregat) {
    const rec = peta.get(a.santriId) ?? {};
    rec[a.status] = a._count._all;
    peta.set(a.santriId, rec);
  }

  return santri.map((s) => {
    const c = peta.get(s.id) ?? {};
    const hadir = c.HADIR ?? 0;
    const terlambat = c.TERLAMBAT ?? 0;
    const izin = c.IZIN ?? 0;
    const sakit = c.SAKIT ?? 0;
    const alfa = c.ALFA ?? 0;
    const total = hadir + terlambat + izin + sakit + alfa;
    return {
      santriId: s.id,
      nama: s.user.nama,
      gender: s.user.gender,
      kampus: s.kampus,
      halaqah: s.halaqah?.nama ?? null,
      hadir,
      terlambat,
      izin,
      sakit,
      alfa,
      total,
      persen: persen(hadir + terlambat, total),
    };
  });
}

// --- Rekap per halaqah ----------------------------------------------------

export async function rekapPerHalaqah(opsi: { gender?: string; rentang?: Rentang }) {
  const r = opsi.rentang ?? rentang30Hari();

  const halaqah = await prisma.halaqah.findMany({
    where: opsi.gender ? { gender: opsi.gender } : {},
    select: {
      id: true,
      nama: true,
      gender: true,
      pembina: { select: { nama: true } },
      _count: { select: { santri: true } },
    },
    orderBy: { nama: "asc" },
  });

  const hasil = await Promise.all(
    halaqah.map(async (h) => {
      const per = await prisma.presensi.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: {
          santri: { halaqahId: h.id },
          sesi: { tanggal: { gte: r.mulai, lte: r.selesai } },
        },
      });
      const c: Record<string, number> = {};
      let total = 0;
      for (const p of per) {
        c[p.status] = p._count._all;
        total += p._count._all;
      }
      const hadir = STATUS_DIHITUNG_HADIR.reduce((s, k) => s + (c[k] ?? 0), 0);
      return {
        id: h.id,
        nama: h.nama,
        gender: h.gender,
        pembina: h.pembina?.nama ?? "-",
        jumlahSantri: h._count.santri,
        hadir,
        alfa: c.ALFA ?? 0,
        izin: (c.IZIN ?? 0) + (c.SAKIT ?? 0),
        total,
        persen: persen(hadir, total),
      };
    })
  );

  return hasil;
}

// --- Rekap per kegiatan ---------------------------------------------------

export async function rekapPerKegiatan(opsi: { gender?: string; rentang?: Rentang }) {
  const r = opsi.rentang ?? rentang30Hari();

  const kegiatan = await prisma.kegiatan.findMany({
    where: { aktif: true },
    select: { id: true, nama: true, kode: true, kategori: true },
    orderBy: { nama: "asc" },
  });

  return Promise.all(
    kegiatan.map(async (k) => {
      const per = await prisma.presensi.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: {
          sesi: { kegiatanId: k.id, tanggal: { gte: r.mulai, lte: r.selesai } },
          ...whereGender(opsi.gender),
        },
      });
      const c: Record<string, number> = {};
      let total = 0;
      for (const p of per) {
        c[p.status] = p._count._all;
        total += p._count._all;
      }
      const hadir = STATUS_DIHITUNG_HADIR.reduce((s, x) => s + (c[x] ?? 0), 0);
      return {
        ...k,
        hadir,
        terlambat: c.TERLAMBAT ?? 0,
        izin: (c.IZIN ?? 0) + (c.SAKIT ?? 0),
        alfa: c.ALFA ?? 0,
        total,
        persen: persen(hadir, total),
      };
    })
  );
}

// --- Tren harian ----------------------------------------------------------

export async function trenHarian(opsi: { gender?: string; hari?: number }) {
  const hari = opsi.hari ?? 30;
  const mulai = awalHari(tambahHari(new Date(), -(hari - 1)));

  const baris = await prisma.presensi.findMany({
    where: {
      sesi: { tanggal: { gte: mulai, lte: akhirHari() } },
      ...whereGender(opsi.gender),
    },
    select: { status: true, sesi: { select: { tanggal: true } } },
  });

  const peta = new Map<string, { hadir: number; total: number }>();
  for (let i = 0; i < hari; i++) {
    const d = awalHari(tambahHari(mulai, i));
    peta.set(d.toISOString().slice(0, 10), { hadir: 0, total: 0 });
  }

  for (const b of baris) {
    const kunci = awalHari(b.sesi.tanggal).toISOString().slice(0, 10);
    const rec = peta.get(kunci);
    if (!rec) continue;
    rec.total++;
    if (STATUS_DIHITUNG_HADIR.includes(b.status)) rec.hadir++;
  }

  return [...peta.entries()].map(([tanggal, v]) => ({
    tanggal,
    hadir: v.hadir,
    total: v.total,
    persen: persen(v.hadir, v.total),
  }));
}

/** Rekap bulanan 6 bulan terakhir. */
export async function trenBulanan(opsi: { gender?: string; bulan?: number }) {
  const jumlah = opsi.bulan ?? 6;
  const sekarang = new Date();
  const mulai = new Date(sekarang.getFullYear(), sekarang.getMonth() - (jumlah - 1), 1);

  const baris = await prisma.presensi.findMany({
    where: {
      sesi: { tanggal: { gte: mulai, lte: akhirHari() } },
      ...whereGender(opsi.gender),
    },
    select: { status: true, sesi: { select: { tanggal: true } } },
  });

  const peta = new Map<string, { hadir: number; total: number }>();
  for (let i = 0; i < jumlah; i++) {
    const d = new Date(mulai.getFullYear(), mulai.getMonth() + i, 1);
    peta.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, {
      hadir: 0,
      total: 0,
    });
  }

  for (const b of baris) {
    const d = b.sesi.tanggal;
    const kunci = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const rec = peta.get(kunci);
    if (!rec) continue;
    rec.total++;
    if (STATUS_DIHITUNG_HADIR.includes(b.status)) rec.hadir++;
  }

  return [...peta.entries()].map(([bulan, v]) => ({
    bulan,
    hadir: v.hadir,
    total: v.total,
    persen: persen(v.hadir, v.total),
  }));
}

// --- Rekap pribadi santri -------------------------------------------------

export async function rekapSantri(santriId: string, rentang?: Rentang) {
  const r = rentang ?? rentang30Hari();

  const [agregat, perKegiatan] = await Promise.all([
    prisma.presensi.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { santriId, sesi: { tanggal: { gte: r.mulai, lte: r.selesai } } },
    }),
    prisma.presensi.findMany({
      where: { santriId, sesi: { tanggal: { gte: r.mulai, lte: r.selesai } } },
      select: {
        status: true,
        sesi: { select: { kegiatan: { select: { id: true, nama: true } } } },
      },
    }),
  ]);

  const c: Record<string, number> = {};
  let total = 0;
  for (const a of agregat) {
    c[a.status] = a._count._all;
    total += a._count._all;
  }
  const hadir = STATUS_DIHITUNG_HADIR.reduce((s, k) => s + (c[k] ?? 0), 0);

  const petaKegiatan = new Map<string, { nama: string; hadir: number; total: number }>();
  for (const p of perKegiatan) {
    const k = p.sesi.kegiatan;
    const rec = petaKegiatan.get(k.id) ?? { nama: k.nama, hadir: 0, total: 0 };
    rec.total++;
    if (STATUS_DIHITUNG_HADIR.includes(p.status)) rec.hadir++;
    petaKegiatan.set(k.id, rec);
  }

  return {
    rentang: r,
    perStatus: c,
    total,
    persen: persen(hadir, total),
    perKegiatan: [...petaKegiatan.entries()].map(([id, v]) => ({
      id,
      nama: v.nama,
      hadir: v.hadir,
      total: v.total,
      persen: persen(v.hadir, v.total),
    })),
  };
}
