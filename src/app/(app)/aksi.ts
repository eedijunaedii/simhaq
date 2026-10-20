"use server";

import { redirect } from "next/navigation";
import { akhiriSesi, ambilSesi, catatAudit } from "@/lib/auth";

export async function keluar() {
  const sesi = await ambilSesi();

  /*
    Sesi dibuang lebih dulu, sebelum apa pun yang bisa gagal.

    Sebelumnya pencatatan audit dilakukan duluan. Bila akun pada sesi sudah
    tidak ada — misalnya basis data diisi ulang sementara peramban masih
    memegang cookie lama — penulisan audit melanggar kunci tamu ke User,
    aksinya melempar galat, dan `akhiriSesi()` tidak pernah dijalankan.
    Akibatnya pengguna terkunci: menekan Keluar hanya menghasilkan galat
    server, dan satu-satunya jalan keluar adalah menghapus cookie sendiri.

    Keluar harus selalu berhasil, jadi pencatatannya dibuat menyusul dan
    kegagalannya tidak boleh menular ke pengguna.
  */
  await akhiriSesi();

  if (sesi) {
    try {
      await catatAudit({
        userId: sesi.sub,
        aksi: "LOGOUT",
        entitas: "User",
        entitasId: sesi.sub,
      });
    } catch {
      /* Akun sudah tidak ada; sesinya tetap berhasil diakhiri. */
    }
  }

  redirect("/login");
}
