import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import pg from "pg";

/*
  Sesi yang akunnya sudah tidak ada.

  Terjadi nyata di produksi: basis data diisi ulang sementara peramban masih
  memegang cookie lama. Dulu menekan Keluar menghasilkan galat server 500,
  karena pencatatan audit dilakukan sebelum sesi dihapus dan penulisannya
  melanggar kunci tamu ke User. Pengguna terkunci — satu-satunya jalan keluar
  adalah menghapus cookie sendiri.

  Keluar harus selalu berhasil, apa pun keadaan akunnya.
*/

const UJI = "ujisesibasi_e2e";

async function db() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  return c;
}

test("keluar tetap berhasil walau akunnya sudah terhapus", async ({ page }) => {
  const c = await db();
  await c.query(`delete from "User" where username = $1`, [UJI]);
  const { rows } = await c.query(
    `insert into "User" (id, nama, username, "passwordHash", role, gender, aktif, "createdAt", "updatedAt")
     values (gen_random_uuid()::text, 'Admin Sesi Basi', $1, $2, 'ADMIN', 'PUTRA', true, now(), now())
     returning id`,
    [UJI, await bcrypt.hash("uji12345", 10)]
  );
  const id = rows[0].id;

  try {
    await page.goto("/login");
    await page.locator('input[name="username"]').fill(UJI);
    await page.locator('input[name="kataSandi"]').fill("uji12345");
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 });

    // Akunnya lenyap, sesinya masih dipegang peramban.
    await c.query(`delete from "User" where id = $1`, [id]);

    const tanggapan: number[] = [];
    page.on("response", (r) => {
      if (r.status() >= 500) tanggapan.push(r.status());
    });

    await page.getByRole("button", { name: /^Keluar$/ }).first().click();

    await page.waitForURL(/\/login/, { timeout: 20_000 });
    expect(tanggapan, "tidak boleh ada tanggapan 5xx saat keluar").toEqual([]);
    await expect(page.getByRole("heading", { name: /Masuk ke SIMHAQ/i })).toBeVisible();
  } finally {
    await c.query(`delete from "User" where username = $1`, [UJI]);
    await c.end();
  }
});
