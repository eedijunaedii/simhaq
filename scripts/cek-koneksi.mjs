/*
 * Memastikan kredensial basis data di .env dan .env.test masih berlaku.
 *
 * Dipakai terutama sesudah kata sandi peran Neon dirotasi: kedua berkas
 * memakai peran yang sama (neondb_owner) pada endpoint yang sama, hanya
 * berbeda nama basis data, sehingga satu rotasi memutus keduanya sekaligus.
 *
 * Kata sandi tidak pernah dicetak — yang ditampilkan hanya peran, host,
 * nama basis data, dan berhasil/tidaknya sambungan.
 */
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const BERKAS = [".env", ".env.test"];

function ambilUrl(berkas) {
  const isi = readFileSync(berkas, "utf8");
  const cocok = isi.match(/^\s*DATABASE_URL\s*=\s*"?([^"\n\r]+)"?/m);
  return cocok ? cocok[1].trim() : null;
}

function ringkas(url) {
  try {
    const u = new URL(url);
    return {
      peran: decodeURIComponent(u.username),
      host: u.hostname,
      basisData: u.pathname.replace(/^\//, ""),
      ssl: u.searchParams.get("sslmode") ?? "(tidak disetel)",
    };
  } catch {
    return null;
  }
}

let gagal = 0;

for (const berkas of BERKAS) {
  if (!existsSync(berkas)) {
    console.log(`${berkas}: tidak ada — dilewati`);
    continue;
  }

  const url = ambilUrl(berkas);
  if (!url) {
    console.log(`${berkas}: DATABASE_URL tidak ditemukan`);
    gagal++;
    continue;
  }

  const r = ringkas(url);
  if (!r) {
    console.log(`${berkas}: DATABASE_URL tidak bisa diurai sebagai URL`);
    gagal++;
    continue;
  }

  const klien = new pg.Client({ connectionString: url });
  try {
    await klien.connect();
    const { rows } = await klien.query("select current_database() as db, current_user as peran");
    await klien.end();
    console.log(
      `${berkas}: OK — ${rows[0].peran}@${r.host} basis data ${rows[0].db}, sslmode=${r.ssl}`
    );
  } catch (e) {
    gagal++;
    const sebab = /password authentication failed/i.test(e.message)
      ? "kata sandi ditolak (kemungkinan belum diperbarui setelah rotasi)"
      : e.message;
    console.log(`${berkas}: GAGAL — ${sebab}`);
  }
}

if (gagal > 0) {
  console.log(`\n${gagal} berkas bermasalah.`);
  process.exit(1);
}
console.log("\nSemua kredensial basis data berlaku.");
