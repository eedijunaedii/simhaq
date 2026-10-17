import { test, expect, type Page } from "@playwright/test";
import { laporkan, ukurKontras } from "./kontras";

/*
  Regresi untuk kedipan saklar tema.

  Banyak elemen memakai utilitas `transition` yang ikut menganimasikan `color`
  dan `background-color`. Saat tema berganti, teks menempuh warna-warna
  peralihan sementara latarnya sudah berpindah, sehingga selama kira-kira
  100 ms ada teks yang jatuh di bawah ambang kontras (terukur 7-10 teks pada
  halaman depan). Keadaan akhirnya selalu benar, jadi pengukuran setelah
  transisi selesai TIDAK menangkap masalah ini — pemeriksaannya harus jatuh
  persis pada frame-frame awal sesudah klik.

  Perbaikannya: kelas .tanpa-transisi mematikan transisi sesaat ketika tema
  diterapkan, sehingga pergantian tema seketika dan tak ada warna peralihan.
*/

const HALAMAN = ["/", "/login"] as const;
const SAKLAR = "Ganti mode terang/gelap";

async function siapkan(page: Page, tema: "terang" | "gelap") {
  await page.addInitScript((t) => {
    window.localStorage.setItem("tema-simhaq", t);
  }, tema);
}

test.describe("Kontras teks (WCAG 1.4.3)", () => {
  for (const jalur of HALAMAN) {
    for (const tema of ["terang", "gelap"] as const) {
      test(`muat bersih ${jalur} mode ${tema} memenuhi ambang`, async ({ page }) => {
        await siapkan(page, tema);
        await page.goto(jalur);
        await page.waitForLoadState("networkidle");

        const gagal = await ukurKontras(page);
        expect(gagal, `\n${laporkan(gagal)}`).toHaveLength(0);
      });
    }
  }

  for (const [dari, ke] of [
    ["gelap", "terang"],
    ["terang", "gelap"],
  ] as const) {
    test(`ganti tema ${dari} ke ${ke} tanpa kedipan kontras`, async ({ page }) => {
      await siapkan(page, dari);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      await page.getByRole("button", { name: SAKLAR }).first().click();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.dataset.tema ?? "terang"))
        .toBe(ke);

      /* Diukur berulang di dalam jendela transisi, bukan sesudahnya: di situlah
         kedipan muncul, dan tanpa perbaikan sampel-sampel awal gagal. */
      const temuan: string[] = [];
      for (let i = 0; i < 6; i++) {
        const gagal = await ukurKontras(page);
        if (gagal.length > 0) {
          temuan.push(`sampel ${i + 1} (${gagal.length} teks)\n${laporkan(gagal)}`);
        }
        await page.waitForTimeout(25);
      }
      expect(temuan, `\n${temuan.join("\n\n")}`).toHaveLength(0);
    });
  }

  test("saklar tema memulihkan transisi setelah dipakai", async ({ page }) => {
    await siapkan(page, "gelap");
    await page.goto("/");

    await page.getByRole("button", { name: SAKLAR }).first().click();
    // Kelas penekan transisi harus hilang kembali; kalau tersangkut, seluruh
    // animasi aplikasi mati permanen setelah sekali ganti tema.
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.classList.contains("tanpa-transisi"))
      )
      .toBe(false);
  });
});
