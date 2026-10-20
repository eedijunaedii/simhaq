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

  /*
    Kebijakan hijab membatasi pembina pada santri segendernya, tetapi
    admin/pimpinan dikecualikan: rekap dan laporan tidak dapat dipakai
    mengambil keputusan bila pimpinan hanya melihat separuh pesantren.
  */
  test("admin melihat santri putra maupun putri", async ({ page }) => {
    await masuk(page, "admin", "admin123");
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto("/santri");
    await expect(page.getByText("Seluruh santri aktif pesantren.")).toBeVisible();

    const jumlahAdmin = Number(
      (await page.locator("main").first().innerText()).match(/(\d+)\s+santri/)?.[1]
    );
    expect(jumlahAdmin).toBeGreaterThan(0);

    // Pembina pada gender mana pun harus melihat lebih sedikit daripada admin.
    for (const [nama, sandi] of [["hanif", "pembina123"], ["aisyah", "pembina123"]]) {
      // Sesi sebelumnya harus dibuang dulu: membuka /login sambil masih masuk
      // akan dialihkan ke dasbor, sehingga formulirnya tidak pernah muncul.
      await page.context().clearCookies();
      await masuk(page, nama, sandi);
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
      await page.goto("/santri");
      const jumlahPembina = Number(
        (await page.locator("main").first().innerText()).match(/(\d+)\s+santri/)?.[1]
      );
      expect(jumlahPembina, `pembina ${nama} tidak boleh melihat seluruh santri`)
        .toBeLessThan(jumlahAdmin);
    }
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