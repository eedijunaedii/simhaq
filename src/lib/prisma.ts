import { PrismaClient } from "@/generated/prisma/client";

/**
 * Satu instance Prisma untuk seluruh aplikasi.
 *
 * Prisma 7 mewajibkan driver adapter. Adapter dipilih otomatis dari bentuk
 * DATABASE_URL sehingga kode aplikasi tidak perlu berubah saat berpindah dari
 * SQLite (development lokal) ke PostgreSQL (produksi / Neon).
 */

const url = process.env.DATABASE_URL ?? "file:./dev.db";

async function buatAdapter() {
  if (/^postgres(ql)?:\/\//i.test(url)) {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    return new PrismaPg({ connectionString: url });
  }

  if (/^file:/i.test(url)) {
    const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
    return new PrismaBetterSqlite3({ url });
  }

  // Gagal terang-terangan daripada diam-diam jatuh ke SQLite. Kasus yang paling
  // sering: DATABASE_URL berbentuk `prisma+postgres://` (Prisma Accelerate),
  // yang memerlukan ekstensi tersendiri dan tidak dipakai aplikasi ini.
  const skema = url.split(":")[0];
  throw new Error(
    `DATABASE_URL memakai skema "${skema}:" yang tidak didukung. ` +
      `Gunakan connection string PostgreSQL langsung (postgresql://...) untuk produksi, ` +
      `atau file:./dev.db untuk development lokal.`
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: await buatAdapter() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
