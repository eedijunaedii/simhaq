import { PrismaClient } from "@/generated/prisma/client";

/**
 * Satu instance Prisma untuk seluruh aplikasi.
 *
 * Prisma 7 mewajibkan driver adapter. Adapter dipilih otomatis dari bentuk
 * DATABASE_URL sehingga kode aplikasi tidak perlu berubah saat berpindah dari
 * SQLite (development lokal) ke PostgreSQL (produksi / Neon).
 */

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const pakaiPostgres = /^postgres(ql)?:\/\//i.test(url);

async function buatAdapter() {
  if (pakaiPostgres) {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    return new PrismaPg({ connectionString: url });
  }
  const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
  return new PrismaBetterSqlite3({ url });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: await buatAdapter() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
