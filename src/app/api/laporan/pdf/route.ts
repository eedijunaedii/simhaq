import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ambilSesi, filterGender } from "@/lib/auth";
import { APP, AMBANG_PEMBINAAN, ROLE, STATUS_PRESENSI_LABEL } from "@/lib/constants";
import {
  rekapPerKelas,
  rekapPerKegiatan,
  rekapPerSantri,
  ringkasanDasbor,
} from "@/lib/rekap";
import { fmtTanggal } from "@/lib/tanggal";
import { bacaRentang } from "../rentang";

const HIJAU: [number, number, number] = [6, 78, 59];
const ABU: [number, number, number] = [100, 116, 139];

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

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const lebar = doc.internal.pageSize.getWidth();

  // --- Kepala surat -------------------------------------------------------
  doc.setFillColor(...HIJAU);
  doc.rect(0, 0, lebar, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`${APP.nama} — Rekapitulasi Kehadiran Santri`, 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${APP.lembagaPanjang} · ${APP.alamat}`, 14, 18.5);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(`Periode   : ${label}`, 14, 35);
  doc.text(`Kelompok  : ${gender ?? "Putra & Putri"}`, 14, 40.5);
  doc.text(`Dicetak   : ${fmtTanggal(new Date())} oleh ${pengguna.nama}`, 14, 46);

  // --- Ringkasan ----------------------------------------------------------
  autoTable(doc, {
    startY: 53,
    head: [["Ringkasan", "Nilai"]],
    body: [
      ["Santri aktif", String(ringkas.jumlahSantri)],
      ["Persentase kehadiran", `${ringkas.persenKehadiran}%`],
      ["Total catatan presensi", String(ringkas.totalPresensi)],
      ...Object.entries(ringkas.perStatus).map(([k, v]) => [
        STATUS_PRESENSI_LABEL[k] ?? k,
        String(v),
      ]),
    ],
    theme: "grid",
    headStyles: { fillColor: HIJAU, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 1: { halign: "right", cellWidth: 40 } },
    margin: { left: 14, right: 14 },
  });

  // --- Per kegiatan -------------------------------------------------------
  autoTable(doc, {
    head: [["Kegiatan", "Hadir", "Terlambat", "Izin/Sakit", "Alfa", "%"]],
    body: perKegiatan.map((k) => [
      k.nama,
      String(k.hadir),
      String(k.terlambat),
      String(k.izin),
      String(k.alfa),
      `${k.persen}%`,
    ]),
    theme: "striped",
    headStyles: { fillColor: HIJAU, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => undefined,
  });

  // --- Per kelas --------------------------------------------------------
  autoTable(doc, {
    head: [["Kelas", "Pembina", "Santri", "Hadir", "Izin", "Alfa", "%"]],
    body: perKelas.map((h) => [
      h.nama,
      h.pembina,
      String(h.jumlahSantri),
      String(h.hadir),
      String(h.izin),
      String(h.alfa),
      `${h.persen}%`,
    ]),
    theme: "striped",
    headStyles: { fillColor: HIJAU, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    columnStyles: {
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  // --- Per santri ---------------------------------------------------------
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...HIJAU);
  doc.text("Rekapitulasi per santri", 14, 18);

  autoTable(doc, {
    startY: 23,
    head: [["No", "Nama", "Kampus", "Kelas", "H", "T", "I", "S", "A", "%"]],
    body: perSantri.map((r, i) => [
      String(i + 1),
      r.nama,
      r.kampus,
      r.kelas ?? "-",
      String(r.hadir),
      String(r.terlambat),
      String(r.izin),
      String(r.sakit),
      String(r.alfa),
      `${r.persen}%`,
    ]),
    theme: "grid",
    headStyles: { fillColor: HIJAU, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 7.5, cellPadding: 1.4 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      4: { cellWidth: 8, halign: "center" },
      5: { cellWidth: 8, halign: "center" },
      6: { cellWidth: 8, halign: "center" },
      7: { cellWidth: 8, halign: "center" },
      8: { cellWidth: 8, halign: "center" },
      9: { cellWidth: 13, halign: "right" },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 9) {
        const nilai = Number(String(data.cell.raw).replace("%", ""));
        if (nilai < AMBANG_PEMBINAAN) {
          data.cell.styles.textColor = [190, 18, 60];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // --- Catatan kaki -------------------------------------------------------
  const jumlahHalaman = doc.getNumberOfPages();
  for (let i = 1; i <= jumlahHalaman; i++) {
    doc.setPage(i);
    const tinggi = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...ABU);
    doc.text(
      "H = Hadir · T = Terlambat · I = Izin · S = Sakit · A = Tanpa keterangan",
      14,
      tinggi - 8
    );
    doc.text(`Halaman ${i} dari ${jumlahHalaman}`, lebar - 14, tinggi - 8, {
      align: "right",
    });
  }

  const bytes = doc.output("arraybuffer");
  const namaBerkas = `Rekap-Kehadiran-${APP.nama}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${namaBerkas}"`,
      "Cache-Control": "no-store",
    },
  });
}
