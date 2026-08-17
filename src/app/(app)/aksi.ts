"use server";

import { redirect } from "next/navigation";
import { akhiriSesi, ambilSesi, catatAudit } from "@/lib/auth";

export async function keluar() {
  const sesi = await ambilSesi();
  if (sesi) {
    await catatAudit({
      userId: sesi.sub,
      aksi: "LOGOUT",
      entitas: "User",
      entitasId: sesi.sub,
    });
  }
  await akhiriSesi();
  redirect("/login");
}
