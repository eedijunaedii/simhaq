import { test, expect } from "@playwright/test";

/*
  Setiap halaman harus punya tepat satu tajuk tingkat teratas.

  Pengguna pembaca layar menelusuri halaman lewat daftar tajuk; tanpa <h1>
  mereka kehilangan penanda "halaman ini tentang apa", dan judul tab saja
  tidak menggantikannya. Pernah terlewat di /login dan /verifikasi karena
  judulnya ditulis sebagai <p> yang sekadar diperbesar.

  Hanya halaman publik yang diuji di sini; halaman dalam aplikasi memperoleh
  h1-nya dari komponen JudulHalaman.
*/

const HALAMAN = [
  { jalur: "/", nama: "halaman depan" },
  { jalur: "/login", nama: "halaman masuk" },
  { jalur: "/luring", nama: "halaman luring" },
  { jalur: "/verifikasi/kode-tidak-dikenal", nama: "verifikasi kartu izin" },
  { jalur: "/wali/token-tidak-sah", nama: "rekap wali santri" },
];

test.describe("Tajuk halaman", () => {
  for (const { jalur, nama } of HALAMAN) {
    test(`${nama} (${jalur}) punya tepat satu h1`, async ({ page }) => {
      await page.goto(jalur);

      const tajuk = page.locator("h1");
      await expect(tajuk).toHaveCount(1);

      // Tajuk yang kosong sama tidak bergunanya dengan tidak ada tajuk.
      const isi = (await tajuk.textContent())?.trim() ?? "";
      expect(isi.length, `h1 pada ${jalur} kosong`).toBeGreaterThan(2);
    });
  }
});
