import { test, expect, type Page } from "@playwright/test";

async function masuk(page: Page, username: string, sandi: string) {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="kataSandi"]').fill(sandi);
  await page.getByRole("button", { name: "Masuk" }).click();
}

test.describe("Alur berbasis peran", () => {
  test("pembina melihat menu Sesi Presensi", async ({ page }) => {
    await masuk(page, "hanif", "pembina123");
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Sesi Presensi" })).toBeVisible();
  });

  test("santri dapat mengajukan izin", async ({ page }) => {
    await masuk(page, "abdillahma001", "santri123");
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto("/izin/baru");
    await page.locator('textarea[name="alasan"]').fill(
      "Praktikum Kimia Fisika sampai malam hari di laboratorium kampus."
    );
    await page.getByRole("button", { name: "Ajukan izin" }).click();

    // Setelah disimpan, pengguna diarahkan ke halaman detail izin.
    await page.waitForURL(/\/izin\/[a-z0-9]+/i, { timeout: 15_000 });
  });
});

test.describe("Halaman publik tanpa akun", () => {
  test("token wali yang tidak sah menampilkan pesan", async ({ page }) => {
    await page.goto("/wali/token-palsu-123");
    await expect(page.getByText("Tautan tidak berlaku")).toBeVisible();
  });
});