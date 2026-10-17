import { test, expect } from "@playwright/test";

/*
  Navigasi halaman depan memakai `hidden md:flex`, jadi di bawah 768px tautan
  bagian sempat tidak bisa dijangkau sama sekali. Tes ini menjaga agar menu
  penggantinya tetap ada dan benar-benar berfungsi.
*/

const PONSEL = { width: 375, height: 812 };
const BUKA = "Buka menu navigasi";

test.describe("Menu navigasi ponsel", () => {
  test("tautan bagian dapat dijangkau di lebar ponsel", async ({ page }) => {
    await page.setViewportSize(PONSEL);
    await page.goto("/");

    // Navigasi lebar memang disembunyikan di sini.
    await expect(page.locator("header nav").first()).toBeHidden();

    const tombol = page.getByRole("button", { name: BUKA });
    await expect(tombol).toBeVisible();
    await expect(tombol).toHaveAttribute("aria-expanded", "false");

    const idPanel = await tombol.getAttribute("aria-controls");
    /* useId() menghasilkan id dengan karakter khusus (mis. «r0»), jadi dipilih
       lewat selektor atribut, bukan selektor #id. */
    const panel = page.locator(`[id="${idPanel}"]`);
    await expect(panel).toBeHidden();

    await tombol.click();
    await expect(panel).toBeVisible();
    await expect(page.getByRole("button", { name: "Tutup menu navigasi" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    // Isinya harus sama dengan navigasi lebar, ditambah tautan situs pesantren.
    for (const label of ["Fitur", "Pengamanan", "Pengguna"]) {
      await expect(panel.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(panel.getByRole("link", { name: /Situs Pesantren/ })).toBeVisible();

    // Memilih tautan menutup panel dan benar-benar berpindah bagian.
    await panel.getByRole("link", { name: "Pengamanan", exact: true }).click();
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/#pengamanan$/);
    await expect(page.locator("#pengamanan")).toBeInViewport();
  });

  test("Escape menutup panel", async ({ page }) => {
    await page.setViewportSize(PONSEL);
    await page.goto("/");

    await page.getByRole("button", { name: BUKA }).click();
    const panel = page.locator("header div[id] nav");
    await expect(panel).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });

  test("tombol menu tidak muncul di lebar desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await expect(page.getByRole("button", { name: BUKA })).toBeHidden();
    await expect(page.locator("header nav").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Fitur", exact: true })).toBeVisible();
  });
});
