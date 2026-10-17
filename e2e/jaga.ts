import { config } from "dotenv";
import { existsSync } from "node:fs";

/**
 * Pengaman basis data pengujian.
 *
 * Suite e2e menulis data sungguhan — salah satu skenario membuat izin baru.
 * Tanpa pengaman, menjalankannya di mesin pengembang akan mengotori basis data
 * produksi, karena `.env` menunjuk ke sana.
 *
 * Karena itu konfigurasi Playwright memuat `.env.test` lebih dulu, lalu fungsi
 * ini menolak berjalan bila URL yang terpakai tidak tampak seperti basis data
 * pengujian.
 */
const POLA_UJI = /(simhaq_test|_test\b|localhost|127\.0\.0\.1|test\.)/i;

export function muatEnvUji() {
  if (existsSync(".env.test")) {
    config({ path: ".env.test", override: true });
  } else if (!process.env.CI) {
    throw new Error(
      "Berkas .env.test tidak ditemukan.\n" +
        "Salin .env.test.example lalu arahkan DATABASE_URL ke basis data pengujian " +
        "yang terpisah dari produksi."
    );
  }

  const url = process.env.DATABASE_URL ?? "";
  if (!POLA_UJI.test(url)) {
    const aman = url.replace(/:\/\/[^@]*@/, "://****@");
    throw new Error(
      "DATABASE_URL tidak tampak seperti basis data pengujian:\n" +
        `  ${aman}\n\n` +
        "Pengujian e2e menulis data sungguhan dan akan mengotori produksi.\n" +
        "Arahkan DATABASE_URL pada .env.test ke basis data terpisah."
    );
  }
}
