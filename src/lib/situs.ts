import { headers } from "next/headers";

/**
 * Asal (origin) situs pada permintaan yang sedang berjalan, misalnya
 * `https://simhaq-ppmmh.vercel.app`.
 *
 * Dibaca dari header permintaan, bukan dari nilai tetap, supaya tautan yang
 * ditampilkan selalu cocok dengan alamat yang sedang dibuka pengurus —
 * baik saat pengembangan di localhost maupun setelah nama domain berganti.
 *
 * Header `x-forwarded-*` didahulukan karena aplikasi berjalan di belakang
 * proksi hosting; `host` mentah dipakai sebagai cadangan.
 */
export async function asalSitus(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";

  const lokal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);
  const protokol = h.get("x-forwarded-proto") ?? (lokal ? "http" : "https");
  return `${protokol}://${host}`;
}
