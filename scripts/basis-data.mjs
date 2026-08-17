/**
 * Pengalih provider basis data.
 *
 * Prisma tidak mengizinkan `provider` diisi dari variabel lingkungan, sehingga
 * perpindahan SQLite <-> PostgreSQL dilakukan dengan menulis ulang satu baris
 * pada prisma/schema.prisma. Skema modelnya sendiri tidak berubah sama sekali
 * (tanpa enum dan tanpa tipe array), jadi tidak ada risiko kehilangan definisi.
 *
 *   node scripts/basis-data.mjs postgres   -> siap deploy (Vercel/Neon)
 *   node scripts/basis-data.mjs sqlite     -> kembali ke development lokal
 */
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const akar = join(dirname(fileURLToPath(import.meta.url)), "..");
const berkasSkema = join(akar, "prisma", "schema.prisma");
const folderMigrasi = join(akar, "prisma", "migrations");

const target = (process.argv[2] ?? "").toLowerCase();
const PILIHAN = {
  postgres: "postgresql",
  postgresql: "postgresql",
  sqlite: "sqlite",
};

const provider = PILIHAN[target];
if (!provider) {
  console.error(
    "Pemakaian: node scripts/basis-data.mjs <postgres|sqlite>\n" +
      "  postgres  menyiapkan skema untuk PostgreSQL (produksi)\n" +
      "  sqlite    mengembalikan skema untuk development lokal"
  );
  process.exit(1);
}

const skema = readFileSync(berkasSkema, "utf8");
const sekarang = skema.match(/datasource db \{\s*\n\s*provider = "([^"]+)"/)?.[1];

if (sekarang === provider) {
  console.log(`Skema sudah memakai provider "${provider}". Tidak ada perubahan.`);
  process.exit(0);
}

const komentar =
  provider === "postgresql"
    ? ' // development lokal: kembalikan ke "sqlite"'
    : ' // produksi: ganti menjadi "postgresql"';

writeFileSync(
  berkasSkema,
  skema.replace(
    /(datasource db \{\s*\n\s*provider = )"[^"]+"[^\n]*/,
    `$1"${provider}"${komentar}`
  )
);

// Migrasi SQL bersifat khusus per dialek, jadi migrasi lama tidak boleh terbawa.
if (existsSync(folderMigrasi)) {
  rmSync(folderMigrasi, { recursive: true, force: true });
  console.log("Folder prisma/migrations dihapus (SQL-nya khusus dialek lama).");
}

console.log(`Provider basis data diubah menjadi "${provider}".`);
console.log(
  provider === "postgresql"
    ? "\nLangkah berikutnya:\n" +
        '  1. Set DATABASE_URL ke connection string PostgreSQL Anda\n' +
        "  2. npx prisma db push\n" +
        "  3. npm run db:seed"
    : "\nLangkah berikutnya:\n  1. npm run db:migrate\n  2. npm run db:seed"
);
