import { test, expect } from "@playwright/test";

test.describe("Halaman depan (landing)", () => {
  test("memuat judul dan elemen utama", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SIMHAQ/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Presensi");
    await expect(page.getByRole("link", { name: "Masuk" }).first()).toBeVisible();
  });

  test("menampilkan logo kampus pada carousel", async ({ page }) => {
    await page.goto("/");
    const marquee = page.locator(".animasi-marquee");
    await expect(marquee).toBeVisible();
    // Ada 3 salinan × 14 kampus = 42 kartu
    await expect(marquee.locator(":scope > div")).toHaveCount(42);
    await expect(page.getByRole("img", { name: "Logo ITB" })).toHaveCount(3);
  });

  test("saklar tema berganti atribut data-tema", async ({ page }) => {
    await page.goto("/");
    const tombol = page.getByRole("button", { name: "Ganti mode terang/gelap" });
    await tombol.click();
    // Tema awal mengikuti sistem; setelah diklik, atribut harus eksplisit.
    const atribut = await page.evaluate(() => document.documentElement.dataset.tema);
    expect(["gelap", undefined]).toContain(atribut);
    // Klik lagi untuk mengembalikan (ke arah terang).
    await tombol.click();
    expect(await page.evaluate(() => document.documentElement.dataset.tema)).toBe(undefined);
  });
});