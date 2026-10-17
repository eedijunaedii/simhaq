import { test, expect, type Page } from "@playwright/test";

async function cobaLogin(page: Page, username: string, sandi: string) {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="kataSandi"]').fill(sandi);
  await page.getByRole("button", { name: "Masuk" }).click();
}

test.describe("Otentikasi", () => {
  test("login admin berhasil lalu dasbor terbuka", async ({ page }) => {
    await cobaLogin(page, "admin", "admin123");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Assalamu");
  });

  test("salah kata sandi menampilkan peringatan", async ({ page }) => {
    await cobaLogin(page, "admin", "salah123");
    await expect(page.getByText("Nama pengguna atau kata sandi tidak cocok.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("dasbor memerlukan login (redirect ke /login)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});