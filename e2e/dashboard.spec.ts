import { test, expect, type Page } from "@playwright/test";

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="kataSandi"]').fill("admin123");
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("Dasbor admin", () => {
  test("menampilkan kartu statistik dan grafik", async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Assalamu");

    // Kartu statistik kehadiran
    await expect(page.getByText("Kehadiran 30 hari").first()).toBeVisible();
    await expect(page.getByText("Kehadiran per kegiatan").first()).toBeVisible();

    // Grafik tren hadir (SVG recharts)
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
  });

  test("saklar tema ada di sidebar", async ({ page }) => {
    await loginAdmin(page);
    const tombol = page.getByRole("button", { name: "Ganti mode terang/gelap" });
    await expect(tombol).toBeVisible();
  });
});