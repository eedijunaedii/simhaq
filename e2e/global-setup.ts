import { muatEnvUji } from "./jaga";

/**
 * Dijalankan sekali sebelum seluruh pengujian. Memastikan basis data yang
 * dipakai memang basis data pengujian, bukan produksi.
 */
export default function globalSetup() {
  muatEnvUji();
  const url = (process.env.DATABASE_URL ?? "").replace(/:\/\/[^@]*@/, "://****@");
  console.log(`\n  Basis data pengujian: ${url}\n`);
}
