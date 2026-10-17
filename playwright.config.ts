import { defineConfig, devices } from "@playwright/test";
import { muatEnvUji } from "./e2e/jaga";

// Dimuat sebelum konfigurasi dibaca, agar webServer mewarisi DATABASE_URL
// pengujian dan tidak pernah menyentuh basis data produksi.
muatEnvUji();

/*
  Di CI (dan bila UJI_PRODUKSI=1) pengujian dijalankan di atas hasil `next build`
  lewat `next start`, bukan server pengembangan. Keduanya berbeda cukup jauh —
  minifikasi, React mode produksi, penanganan galat, pembuatan halaman statis —
  sehingga menguji `next dev` saja bisa melewatkan bug yang hanya muncul di
  produksi. Build harus sudah ada lebih dulu; CI menjalankannya pada langkah
  tersendiri sebelum ini.
*/
const pakaiBuildProduksi = !!process.env.CI || process.env.UJI_PRODUKSI === "1";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    locale: "id-ID",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: pakaiBuildProduksi ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    // Jangan pakai ulang server yang sudah jalan: server itu kemungkinan besar
    // dinyalakan dengan .env produksi, sehingga pengujian akan menulis ke sana.
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "",
      ADMIN_LINTAS_GENDER: process.env.ADMIN_LINTAS_GENDER ?? "false",
    },
  },
});