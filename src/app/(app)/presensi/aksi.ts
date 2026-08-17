"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { catatAudit, genderYangBolehDiakses, wajibLogin, wajibPengurus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buatSecretSesi, jarakMeter, sesiIdDariToken, verifikasiTokenQr } from "@/lib/qr-token";
import { lengkapiAlfa, terapkanIzinKeSesi } from "@/lib/presensi";
import { padukanJam, tambahMenit } from "@/lib/tanggal";

export type Hasil = { ok?: string; galat?: string };

// --- Membuka sesi ---------------------------------------------------------

export async function bukaSesi(_sebelum: Hasil, data: FormData): Promise<Hasil> {
  const sesi = await wajibPengurus();

  const kegiatanId = String(data.get("kegiatanId") ?? "");
  const halaqahId = String(data.get("halaqahId") ?? "") || null;
  const gender = String(data.get("gender") ?? sesi.gender);
  const jamMulai = String(data.get("jamMulai") ?? "");
  const durasiMenit = Number(data.get("durasiMenit") ?? 60);
  const rotasiDetik = Number(data.get("rotasiDetik") ?? 40);
  const wajibLokasi = data.get("wajibLokasi") === "on";
  const radiusMeter = Number(data.get("radiusMeter") ?? 150);
  const lat = data.get("lat") ? Number(data.get("lat")) : null;
  const lng = data.get("lng") ? Number(data.get("lng")) : null;

  if (!kegiatanId) return { galat: "Kegiatan wajib dipilih." };
  if (!genderYangBolehDiakses(sesi).includes(gender)) {
    return { galat: "Anda tidak berwenang membuka sesi untuk gender tersebut." };
  }
  if (durasiMenit < 5 || durasiMenit > 480) {
    return { galat: "Durasi sesi harus antara 5 sampai 480 menit." };
  }
  if (rotasiDetik < 5 || rotasiDetik > 60) {
    return { galat: "Rotasi QR harus antara 5 sampai 60 detik." };
  }
  if (wajibLokasi && (lat === null || lng === null)) {
    return {
      galat:
        "Pembatasan lokasi aktif, tetapi titik koordinat pesantren belum terisi. Isi koordinat atau matikan pembatasan lokasi.",
    };
  }

  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id: kegiatanId },
    select: { id: true, toleransiTerlambatMenit: true, gender: true },
  });
  if (!kegiatan) return { galat: "Kegiatan tidak ditemukan." };

  const sekarang = new Date();
  const mulai = jamMulai ? padukanJam(sekarang, jamMulai) : sekarang;

  const adaTerbuka = await prisma.sesiPresensi.findFirst({
    where: {
      kegiatanId,
      halaqahId,
      gender,
      status: "DIBUKA",
    },
    select: { id: true },
  });
  if (adaTerbuka) {
    redirect(`/presensi/${adaTerbuka.id}`);
  }

  const baru = await prisma.sesiPresensi.create({
    data: {
      kegiatanId,
      halaqahId,
      gender,
      tanggal: new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()),
      waktuBuka: sekarang,
      waktuTutup: tambahMenit(mulai, durasiMenit),
      batasTerlambat: tambahMenit(mulai, kegiatan.toleransiTerlambatMenit),
      secret: buatSecretSesi(),
      rotasiDetik,
      wajibLokasi,
      radiusMeter,
      lokasiLat: lat,
      lokasiLng: lng,
      dibukaOlehId: sesi.sub,
      status: "DIBUKA",
    },
  });

  await terapkanIzinKeSesi(baru.id);
  await catatAudit({
    userId: sesi.sub,
    aksi: "BUKA_SESI",
    entitas: "SesiPresensi",
    entitasId: baru.id,
    detail: { kegiatanId, halaqahId, gender },
  });

  revalidatePath("/presensi");
  redirect(`/presensi/${baru.id}`);
}

// --- Menutup / membatalkan sesi ------------------------------------------

export async function tutupSesi(sesiId: string) {
  const sesi = await wajibPengurus();

  const target = await prisma.sesiPresensi.findUnique({
    where: { id: sesiId },
    select: { id: true, gender: true, status: true },
  });
  if (!target) return;
  if (!genderYangBolehDiakses(sesi).includes(target.gender)) return;
  if (target.status !== "DIBUKA") return;

  await terapkanIzinKeSesi(sesiId);
  const alfa = await lengkapiAlfa(sesiId);

  await prisma.sesiPresensi.update({
    where: { id: sesiId },
    data: { status: "DITUTUP", ditutupPada: new Date(), ditutupOlehId: sesi.sub },
  });

  await catatAudit({
    userId: sesi.sub,
    aksi: "TUTUP_SESI",
    entitas: "SesiPresensi",
    entitasId: sesiId,
    detail: { ditandaiAlfa: alfa },
  });

  revalidatePath(`/presensi/${sesiId}`);
  revalidatePath("/presensi");
}

export async function batalkanSesi(sesiId: string) {
  const sesi = await wajibPengurus();
  const target = await prisma.sesiPresensi.findUnique({
    where: { id: sesiId },
    select: { gender: true, status: true },
  });
  if (!target || !genderYangBolehDiakses(sesi).includes(target.gender)) return;

  await prisma.presensi.deleteMany({ where: { sesiId } });
  await prisma.sesiPresensi.update({
    where: { id: sesiId },
    data: { status: "DIBATALKAN", ditutupPada: new Date(), ditutupOlehId: sesi.sub },
  });

  await catatAudit({
    userId: sesi.sub,
    aksi: "BATAL_SESI",
    entitas: "SesiPresensi",
    entitasId: sesiId,
  });

  revalidatePath("/presensi");
  redirect("/presensi");
}

/** Perpanjang waktu tutup sesi (mis. kegiatan molor). */
export async function perpanjangSesi(sesiId: string, menit: number) {
  const sesi = await wajibPengurus();
  const target = await prisma.sesiPresensi.findUnique({
    where: { id: sesiId },
    select: { gender: true, waktuTutup: true, status: true },
  });
  if (!target || target.status !== "DIBUKA") return;
  if (!genderYangBolehDiakses(sesi).includes(target.gender)) return;

  await prisma.sesiPresensi.update({
    where: { id: sesiId },
    data: { waktuTutup: tambahMenit(target.waktuTutup, menit) },
  });
  revalidatePath(`/presensi/${sesiId}`);
}

// --- Presensi manual ------------------------------------------------------

export async function setPresensiManual(
  sesiId: string,
  santriId: string,
  status: string,
  catatan?: string
) {
  const sesi = await wajibPengurus();

  const target = await prisma.sesiPresensi.findUnique({
    where: { id: sesiId },
    select: { id: true, gender: true, status: true },
  });
  if (!target) return;
  if (!genderYangBolehDiakses(sesi).includes(target.gender)) return;
  if (target.status === "DIBATALKAN") return;

  if (!["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "ALFA"].includes(status)) return;

  await prisma.presensi.upsert({
    where: { sesiId_santriId: { sesiId, santriId } },
    create: {
      sesiId,
      santriId,
      status,
      metode: "MANUAL",
      waktuScan: status === "HADIR" || status === "TERLAMBAT" ? new Date() : null,
      dicatatOlehId: sesi.sub,
      catatan: catatan ?? "Diinput manual oleh pengurus.",
    },
    update: {
      status,
      metode: "MANUAL",
      dicatatOlehId: sesi.sub,
      catatan: catatan ?? "Diubah manual oleh pengurus.",
    },
  });

  await catatAudit({
    userId: sesi.sub,
    aksi: "PRESENSI_MANUAL",
    entitas: "Presensi",
    entitasId: `${sesiId}:${santriId}`,
    detail: { status, catatan },
  });

  revalidatePath(`/presensi/${sesiId}`);
}

// --- Pemindaian QR oleh santri -------------------------------------------

export type HasilPindai = {
  /**
   * `berganti` = kode sudah berputar sebelum pemindaian sampai ke server.
   * Ini kejadian wajar (jeda jaringan, atau santri baru selesai login), bukan
   * kegagalan, sehingga ditampilkan berbeda dari `gagal`.
   */
  status: "sukses" | "berganti" | "gagal";
  pesan: string;
  detail?: string;
  kegiatan?: string;
  statusPresensi?: string;
};

/**
 * Batas usia token yang masih dianggap jeda wajar. Di atas ini, pemindaian
 * lebih mungkin berasal dari tangkapan layar yang disebarkan, sehingga dicatat
 * untuk ditinjau pengurus.
 */
const AMBANG_CURIGA_DETIK = 120;

export async function pindaiQr(input: {
  token: string;
  deviceId: string;
  lat?: number | null;
  lng?: number | null;
}): Promise<HasilPindai> {
  const sesiPengguna = await wajibLogin();
  if (sesiPengguna.role !== "SANTRI" || !sesiPengguna.santriId) {
    return { status: "gagal", pesan: "Hanya akun santri yang dapat memindai QR." };
  }
  const santriId = sesiPengguna.santriId;

  const sesiId = sesiIdDariToken(input.token);
  if (!sesiId) {
    return { status: "gagal", pesan: "Kode QR tidak dikenali." };
  }

  const sesi = await prisma.sesiPresensi.findUnique({
    where: { id: sesiId },
    select: {
      id: true,
      secret: true,
      rotasiDetik: true,
      status: true,
      gender: true,
      halaqahId: true,
      waktuBuka: true,
      waktuTutup: true,
      batasTerlambat: true,
      wajibLokasi: true,
      lokasiLat: true,
      lokasiLng: true,
      radiusMeter: true,
      kegiatan: { select: { nama: true } },
    },
  });
  if (!sesi) return { status: "gagal", pesan: "Sesi presensi tidak ditemukan." };

  // 1. Jendela waktu
  const sekarang = new Date();
  if (sesi.status !== "DIBUKA") {
    return {
      status: "gagal",
      pesan: "Sesi presensi sudah ditutup.",
      detail: "Hubungi musyrif bila Anda hadir tetapi belum sempat memindai.",
    };
  }
  if (sekarang < sesi.waktuBuka || sekarang > sesi.waktuTutup) {
    return { status: "gagal", pesan: "Pemindaian di luar jendela waktu sesi." };
  }

  // 2. Tanda tangan & masa berlaku token
  const cek = verifikasiTokenQr(input.token, sesi.secret, sesi.rotasiDetik);
  if (!cek.ok) {
    if (cek.alasan === "KEDALUWARSA") {
      // Jeda wajar: kode berputar sebelum pemindaian sampai. Tidak dicatat
      // sebagai temuan, dan santri cukup mengarahkan kamera lagi.
      if (cek.usiaDetik <= AMBANG_CURIGA_DETIK) {
        return {
          status: "berganti",
          pesan: "Kode sudah berganti.",
          detail: `Kode di layar berputar setiap ${sesi.rotasiDetik} detik. Arahkan kamera ke layar sekali lagi.`,
          kegiatan: sesi.kegiatan.nama,
        };
      }

      await prisma.flagPelanggaran.create({
        data: {
          santriId,
          sesiId: sesi.id,
          jenis: "TOKEN_KEDALUWARSA",
          keterangan: `Memindai kode QR yang sudah lewat sekitar ${Math.round(
            cek.usiaDetik / 60
          )} menit (kemungkinan tangkapan layar).`,
        },
      });
      return {
        status: "gagal",
        pesan: "Kode QR sudah kedaluwarsa.",
        detail:
          "Kode ini sudah lama berlalu, jadi tidak dapat dipakai. Pindai langsung dari layar yang ditampilkan musyrif.",
      };
    }
    return { status: "gagal", pesan: "Kode QR tidak sah." };
  }

  // 3. Kelayakan peserta
  const santri = await prisma.profilSantri.findUnique({
    where: { id: santriId },
    select: {
      id: true,
      halaqahId: true,
      status: true,
      deviceId: true,
      user: { select: { gender: true, nama: true } },
    },
  });
  if (!santri || santri.status !== "AKTIF") {
    return { status: "gagal", pesan: "Status santri tidak aktif." };
  }
  if (sesi.gender !== "SEMUA" && sesi.gender !== santri.user.gender) {
    return { status: "gagal", pesan: "Sesi ini bukan untuk kelompok Anda." };
  }
  if (sesi.halaqahId && sesi.halaqahId !== santri.halaqahId) {
    return { status: "gagal", pesan: "Sesi ini khusus untuk halaqah lain." };
  }

  // 4. Keterikatan perangkat
  if (!input.deviceId) {
    return { status: "gagal", pesan: "Perangkat tidak dapat dikenali." };
  }
  if (santri.deviceId && santri.deviceId !== input.deviceId) {
    await prisma.flagPelanggaran.create({
      data: {
        santriId,
        sesiId: sesi.id,
        jenis: "PERANGKAT_GANDA",
        keterangan:
          "Memindai dari perangkat yang berbeda dari perangkat terdaftar akun ini.",
      },
    });
    return {
      status: "gagal",
      pesan: "Perangkat tidak cocok dengan yang terdaftar.",
      detail:
        "Akun Anda terikat pada satu perangkat. Minta musyrif melepas keterikatan bila Anda berganti ponsel.",
    };
  }
  if (!santri.deviceId) {
    const dipakaiLain = await prisma.profilSantri.findFirst({
      where: { deviceId: input.deviceId, id: { not: santriId } },
      select: { id: true, user: { select: { nama: true } } },
    });
    if (dipakaiLain) {
      await prisma.flagPelanggaran.create({
        data: {
          santriId,
          sesiId: sesi.id,
          jenis: "PERANGKAT_GANDA",
          keterangan: `Perangkat ini sudah terdaftar atas nama ${dipakaiLain.user.nama}.`,
        },
      });
      return {
        status: "gagal",
        pesan: "Perangkat ini sudah dipakai akun santri lain.",
        detail: "Kejadian ini dicatat untuk ditinjau pengurus.",
      };
    }
    await prisma.profilSantri.update({
      where: { id: santriId },
      data: { deviceId: input.deviceId, deviceBoundAt: new Date() },
    });
  }

  // 5. Pembatasan lokasi (opsional)
  if (sesi.wajibLokasi && sesi.lokasiLat !== null && sesi.lokasiLng !== null) {
    if (input.lat == null || input.lng == null) {
      return {
        status: "gagal",
        pesan: "Sesi ini memerlukan izin lokasi.",
        detail: "Aktifkan izin lokasi pada peramban lalu pindai ulang.",
      };
    }
    const jarak = jarakMeter(input.lat, input.lng, sesi.lokasiLat, sesi.lokasiLng);
    if (jarak > sesi.radiusMeter) {
      await prisma.flagPelanggaran.create({
        data: {
          santriId,
          sesiId: sesi.id,
          jenis: "DILUAR_RADIUS",
          keterangan: `Pemindaian sekitar ${Math.round(jarak)} m dari titik pesantren (batas ${sesi.radiusMeter} m).`,
        },
      });
      return {
        status: "gagal",
        pesan: "Anda berada di luar area pesantren.",
        detail: `Jarak terdeteksi sekitar ${Math.round(jarak)} meter.`,
      };
    }
  }

  // 6. Catat kehadiran
  const sudah = await prisma.presensi.findUnique({
    where: { sesiId_santriId: { sesiId: sesi.id, santriId } },
    select: { status: true, metode: true },
  });
  if (sudah && (sudah.status === "HADIR" || sudah.status === "TERLAMBAT")) {
    return {
      status: "sukses",
      pesan: "Kehadiran Anda sudah tercatat sebelumnya.",
      kegiatan: sesi.kegiatan.nama,
      statusPresensi: sudah.status,
    };
  }
  if (sudah && (sudah.status === "IZIN" || sudah.status === "SAKIT")) {
    return {
      status: "gagal",
      pesan: "Anda tercatat sedang berizin pada sesi ini.",
      detail: "Bila Anda ternyata hadir, mintalah musyrif memperbarui catatan.",
    };
  }

  const status = sekarang > sesi.batasTerlambat ? "TERLAMBAT" : "HADIR";

  await prisma.presensi.upsert({
    where: { sesiId_santriId: { sesiId: sesi.id, santriId } },
    create: {
      sesiId: sesi.id,
      santriId,
      status,
      metode: "QR",
      waktuScan: sekarang,
      deviceId: input.deviceId,
    },
    update: {
      status,
      metode: "QR",
      waktuScan: sekarang,
      deviceId: input.deviceId,
      catatan: null,
    },
  });

  await catatAudit({
    userId: sesiPengguna.sub,
    aksi: "PRESENSI_QR",
    entitas: "Presensi",
    entitasId: `${sesi.id}:${santriId}`,
    detail: { status },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/presensi/${sesi.id}`);

  return {
    status: "sukses",
    pesan:
      status === "HADIR"
        ? "Alhamdulillah, kehadiran Anda tercatat."
        : "Kehadiran tercatat, namun Anda terlambat.",
    kegiatan: sesi.kegiatan.nama,
    statusPresensi: status,
  };
}

// --- Keterikatan perangkat -----------------------------------------------

export async function lepasPerangkat(santriId: string) {
  const sesi = await wajibPengurus();
  const santri = await prisma.profilSantri.findUnique({
    where: { id: santriId },
    select: { user: { select: { gender: true } } },
  });
  if (!santri || !genderYangBolehDiakses(sesi).includes(santri.user.gender)) return;

  await prisma.profilSantri.update({
    where: { id: santriId },
    data: { deviceId: null, deviceLabel: null, deviceBoundAt: null },
  });
  await catatAudit({
    userId: sesi.sub,
    aksi: "LEPAS_PERANGKAT",
    entitas: "ProfilSantri",
    entitasId: santriId,
  });
  revalidatePath(`/santri/${santriId}`);
}
