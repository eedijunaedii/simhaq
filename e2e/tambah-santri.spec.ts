import { test, expect, type Page } from "@playwright/test";

/*
  Pendaftaran santri baru sekaligus akunnya.

  Dibatasi pada admin karena tindakan ini membuat akun pengguna, sekelas
  dengan pengelolaan akun pada halaman Pengaturan. Pembina yang juga dapat
  membuka daftar santri tidak boleh melihat jalan masuknya.
*/

async function masuk(page: Page, nama: string, sandi: string) {
  await page.goto("/login");
  await page.getByRole("textbox").first().fill(nama);
  await page.locator('input[type="password"]').fill(sandi);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20_000 });
}

test.describe("Tambah santri", () => {
  test("admin dapat mendaftarkan santri beserta akunnya", async ({ page }) => {
    await masuk(page, "admin", "admin123");
    await page.goto("/santri");

    await page.getByRole("link", { name: /Tambah santri/i }).click();
    await page.waitForURL(/\/santri\/baru/);

    // NIM dibuat unik tiap jalannya agar pemeriksaan NIM ganda tidak
    // menggagalkan pengujian pada eksekusi berikutnya.
    const nim = `29${Date.now().toString().slice(-7)}`;
    await page.locator('input[name="nama"]').fill(`Santri Uji ${nim}`);
    await page.locator('select[name="gender"]').selectOption("PUTRA");
    await page.locator('input[name="nim"]').fill(nim);
    await page.locator('input[name="kampus"]').fill("POLBAN");

    await page.getByRole("button", { name: /Daftarkan santri/i }).click();

    const pesan = page.getByText(/berhasil didaftarkan/i);
    await expect(pesan).toBeVisible({ timeout: 20_000 });
    // Nama pengguna dan kata sandi sementara harus ikut disampaikan,
    // karena keduanya tidak dapat dilihat lagi setelah halaman ditinggalkan.
    await expect(pesan).toContainText("Nama pengguna:");
    await expect(pesan).toContainText("kata sandi sementara:");

    await page.goto(`/santri?q=${nim}`);
    await expect(page.getByText(`Santri Uji ${nim}`)).toBeVisible();
  });

  test("NIM yang sudah terdaftar ditolak", async ({ page }) => {
    await masuk(page, "admin", "admin123");
    await page.goto("/santri");

    // NIM milik santri pertama pada data seed.
    const nimAda = await page
      .locator("table tbody tr")
      .first()
      .innerText()
      .then((t) => t.match(/\b\d{9}\b/)?.[0]);
    expect(nimAda, "NIM contoh tidak ditemukan pada daftar").toBeTruthy();

    await page.goto("/santri/baru");
    await page.locator('input[name="nama"]').fill("Santri NIM Ganda");
    await page.locator('select[name="gender"]').selectOption("PUTRA");
    await page.locator('input[name="nim"]').fill(nimAda!);
    await page.getByRole("button", { name: /Daftarkan santri/i }).click();

    await expect(page.getByText(/sudah terdaftar atas nama/i)).toBeVisible({
      timeout: 20_000,
    });
  });

  test("pembina tidak melihat jalan masuk tambah santri", async ({ page }) => {
    await masuk(page, "hanif", "pembina123");
    await page.goto("/santri");

    await expect(page.getByRole("link", { name: /Tambah santri/i })).toHaveCount(0);

    // Dibuka langsung pun harus ditolak, bukan sekadar disembunyikan.
    await page.goto("/santri/baru");
    await expect(page).not.toHaveURL(/\/santri\/baru/);
  });
});
