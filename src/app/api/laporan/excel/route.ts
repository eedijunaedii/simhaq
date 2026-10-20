import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { ambilSesi, filterGender } from "@/lib/auth";
import { APP, ROLE, STATUS_PRESENSI_LABEL } from "@/lib/constants";
import {
  rekapPerKelas,
  rekapPerKegiatan,
  rekapPerSantri,
  ringkasanDasbor,
} from "@/lib/rekap";
import { fmtTanggal } from "@/lib/tanggal";
import { bacaRentang } from "../rentang";

export async function GET(request: Request) {
  const pengguna = await ambilSesi();
  if (!pengguna || pengguna.role === ROLE.SANTRI) {
    return NextResponse.json({ galat: "Tidak berwenang." }, { status: 403 });
  }

  const url = new URL(request.url);
  const { rentang, label } = bacaRentang(url.searchParams);
  const kelasId = url.searchParams.get("kelas") ?? undefined;
  const kegiatanId = url.searchParams.get("kegiatan") ?? undefined;
  const { gender } = filterGender(pengguna);

  const [ringkas, perSantri, perKelas, perKegiatan] = await Promise.all([
    ringkasanDasbor(gender),
    rekapPerSantri({ gender, rentang, kelasId, kegiatanId }),
    rekapPerKelas({ gender, rentang }),
    rekapPerKegiatan({ gender, rentang }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = `${APP.nama} — ${APP.lembaga}`;
  wb.created = new Date();

  const hijau = "FF064E3B";
  const gayaKepala = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: hijau },
    },
    alignment: { vertical: "middle" as const, horizontal: "center" as const },
  };

  // --- Lembar ringkasan ---------------------------------------------------
  const s1 = wb.addWorksheet("Ringkasan");
  s1.columns = [{ width: 34 }, { width: 26 }];
  s1.addRow([`${APP.nama} — Rekapitulasi Kehadiran`]);
  s1.getRow(1).font = { bold: true, size: 14 };
  s1.addRow([APP.lembagaPanjang]);
  s1.addRow([APP.alamat]);
  s1.addRow([]);
  s1.addRow(["Periode", label]);
  s1.addRow(["Kelompok", gender ?? "Putra & Putri"]);
  s1.addRow(["Dicetak", fmtTanggal(new Date())]);
  s1.addRow(["Oleh", pengguna.nama]);
  s1.addRow([]);
  s1.addRow(["Santri aktif", ringkas.jumlahSantri]);
  s1.addRow(["Persentase kehadiran", `${ringkas.persenKehadiran}%`]);
  s1.addRow(["Total catatan presensi", ringkas.totalPresensi]);
  s1.addRow([]);
  s1.addRow(["Status", "Jumlah"]);
  s1.getRow(s1.rowCount).eachCell((c) => Object.assign(c, gayaKepala));
  for (const [k, v] of Object.entries(ringkas.perStatus)) {
    s1.addRow([STATUS_PRESENSI_LABEL[k] ?? k, v]);
  }

  // --- Lembar per santri --------------------------------------------------
  const s2 = wb.addWorksheet("Per Santri");
  s2.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama", key: "nama", width: 30 },
    { header: "Kampus", key: "kampus", width: 14 },
    { header: "Kelas", key: "kelas", width: 22 },
    { header: "Hadir", key: "hadir", width: 9 },
    { header: "Terlambat", key: "terlambat", width: 11 },
    { header: "Izin", key: "izin", width: 8 },
    { header: "Sakit", key: "sakit", width: 8 },
    { header: "Alfa", key: "alfa", width: 8 },
    { header: "Total", key: "total", width: 9 },
    { header: "Kehadiran (%)", key: "persen", width: 14 },
  ];
  s2.getRow(1).eachCell((c) => Object.assign(c, gayaKepala));
  perSantri.forEach((r, i) => {
    s2.addRow({
      no: i + 1,
      nama: r.nama,
      kampus: r.kampus,
      kelas: r.kelas ?? "-",
      hadir: r.hadir,
      terlambat: r.terlambat,
      izin: r.izin,
      sakit: r.sakit,
      alfa: r.alfa,
      total: r.total,
      persen: r.persen,
    });
  });
  s2.autoFilter = { from: "A1", to: "K1" };
  s2.views = [{ state: "frozen", ySplit: 1 }];

  // --- Lembar per kelas -------------------------------------------------
  const s3 = wb.addWorksheet("Per Kelas");
  s3.columns = [
    { header: "Kelas", key: "nama", width: 26 },
    { header: "Pembina", key: "pembina", width: 28 },
    { header: "Jumlah santri", key: "jumlah", width: 14 },
    { header: "Hadir", key: "hadir", width: 10 },
    { header: "Izin/Sakit", key: "izin", width: 12 },
    { header: "Alfa", key: "alfa", width: 9 },
    { header: "Kehadiran (%)", key: "persen", width: 14 },
  ];
  s3.getRow(1).eachCell((c) => Object.assign(c, gayaKepala));
  for (const h of perKelas) {
    s3.addRow({
      nama: h.nama,
      pembina: h.pembina,
      jumlah: h.jumlahSantri,
      hadir: h.hadir,
      izin: h.izin,
      alfa: h.alfa,
      persen: h.persen,
    });
  }

  // --- Lembar per kegiatan ------------------------------------------------
  const s4 = wb.addWorksheet("Per Kegiatan");
  s4.columns = [
    { header: "Kegiatan", key: "nama", width: 30 },
    { header: "Kategori", key: "kategori", width: 14 },
    { header: "Hadir", key: "hadir", width: 10 },
    { header: "Terlambat", key: "terlambat", width: 12 },
    { header: "Izin/Sakit", key: "izin", width: 12 },
    { header: "Alfa", key: "alfa", width: 9 },
    { header: "Total", key: "total", width: 10 },
    { header: "Kehadiran (%)", key: "persen", width: 14 },
  ];
  s4.getRow(1).eachCell((c) => Object.assign(c, gayaKepala));
  for (const k of perKegiatan) {
    s4.addRow({
      nama: k.nama,
      kategori: k.kategori,
      hadir: k.hadir,
      terlambat: k.terlambat,
      izin: k.izin,
      alfa: k.alfa,
      total: k.total,
      persen: k.persen,
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const namaBerkas = `Rekap-Kehadiran-${APP.nama}-${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaBerkas}"`,
      "Cache-Control": "no-store",
    },
  });
}
