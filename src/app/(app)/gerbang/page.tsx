import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, DoorOpen, LogIn, ScanLine, ShieldCheck } from "lucide-react";
import {
  Kartu,
  KartuStat,
  KepalaKartu,
  Kosong,
  JudulHalaman,
  Lencana,
  Peringatan,
  Tombol,
} from "@/components/ui";
import { JENIS_IZIN_LABEL } from "@/lib/constants";
import { wajibPenjagaGerbang } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtTanggalJam, selisihManusiawi } from "@/lib/tanggal";
import { tandaiKembali } from "../izin/aksi";

export const metadata: Metadata = { title: "Pos Gerbang" };
export const dynamic = "force-dynamic";

/**
 * Layar kerja petugas keamanan.
 *
 * Sengaja hanya menampilkan yang diperlukan untuk menjaga pintu: siapa yang
 * sedang berada di luar dan sampai kapan izinnya. Tidak ada NIM, kampus,
 * nomor kamar, maupun catatan kehadiran.
 */
export default async function HalamanGerbang() {
  const sesi = await wajibPenjagaGerbang();
  const sekarang = new Date();

  const sedangKeluar = await prisma.izin.findMany({
    where: { status: "DISETUJUI", mulai: { lte: sekarang } },
    select: {
      id: true,
      kode: true,
      jenis: true,
      mulai: true,
      selesai: true,
      tujuan: true,
      santri: { select: { user: { select: { nama: true } } } },
    },
    orderBy: { selesai: "asc" },
  });

  const lewatBatas = sedangKeluar.filter((z) => z.selesai < sekarang);
  const masihBerlaku = sedangKeluar.filter((z) => z.selesai >= sekarang);

  return (
    <>
      <JudulHalaman
        judul="Pos gerbang"
        keterangan={`Selamat bertugas, ${sesi.nama}. Halaman ini menampilkan santri yang sedang berada di luar pesantren.`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KartuStat
          label="Sedang di luar"
          nilai={sedangKeluar.length}
          keterangan="Izin disetujui dan sudah dimulai"
          ikon={<DoorOpen size={18} />}
        />
        <KartuStat
          label="Lewat batas waktu"
          nilai={lewatBatas.length}
          nada={lewatBatas.length > 0 ? "buruk" : "baik"}
          keterangan="Belum tercatat kembali"
          ikon={<AlertTriangle size={18} />}
        />
        <KartuStat
          label="Masih dalam waktu"
          nilai={masihBerlaku.length}
          nada="netral"
          ikon={<ShieldCheck size={18} />}
        />
      </div>

      <div className="mb-6">
        <Peringatan nada="info" judul="Cara memeriksa kartu izin">
          Pindai QR pada kartu izin santri memakai kamera ponsel. Halaman verifikasi
          akan terbuka dan menunjukkan apakah izinnya sah. Saat santri kembali, pindai
          kartu yang sama lalu tekan tombol <strong>Tandai sudah kembali</strong> —
          atau cari namanya pada daftar di bawah ini.
        </Peringatan>
      </div>

      {lewatBatas.length > 0 ? (
        <Kartu className="mb-6 border-rose-400/25 bg-rose-500/[0.06]">
          <KepalaKartu
            judul="Lewat batas waktu"
            keterangan="Perlu diperiksa: sudah kembali tetapi belum ditandai, atau memang belum pulang."
          />
          <ul className="divide-y divide-white/5">
            {lewatBatas.map((z) => (
              <BarisIzin key={z.id} izin={z} lewat />
            ))}
          </ul>
        </Kartu>
      ) : null}

      <Kartu>
        <KepalaKartu
          judul="Sedang di luar pesantren"
          keterangan={`${masihBerlaku.length} santri, diurutkan dari yang paling dekat batas waktunya`}
        />
        {masihBerlaku.length === 0 ? (
          <Kosong
            judul="Tidak ada santri di luar"
            keterangan="Semua santri berizin sudah tercatat kembali."
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {masihBerlaku.map((z) => (
              <BarisIzin key={z.id} izin={z} />
            ))}
          </ul>
        )}
      </Kartu>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-samar">
        <ScanLine size={14} />
        Akun petugas hanya dapat memeriksa kartu izin dan mencatat kepulangan.
      </p>
    </>
  );
}

type IzinGerbang = {
  id: string;
  kode: string;
  jenis: string;
  mulai: Date;
  selesai: Date;
  tujuan: string | null;
  santri: { user: { nama: string } };
};

function BarisIzin({ izin, lewat }: { izin: IzinGerbang; lewat?: boolean }) {
  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="min-w-52 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-white">{izin.santri.user.nama}</span>
          <Lencana>{JENIS_IZIN_LABEL[izin.jenis]}</Lencana>
          {lewat ? (
            <Lencana className="bg-rose-500/15 text-rose-300 ring-rose-400/30">
              Lewat {selisihManusiawi(izin.selesai).replace(" lalu", "")}
            </Lencana>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-redup">
          Batas kembali {fmtTanggalJam(izin.selesai)}
          {!lewat ? ` · ${selisihManusiawi(izin.selesai)}` : ""}
        </p>
        {izin.tujuan ? (
          <p className="text-xs text-samar">Tujuan: {izin.tujuan}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/verifikasi/${izin.kode}`}
          className="rounded-xl border border-kendali bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/15"
        >
          Lihat kartu
        </Link>
        <form
          action={async () => {
            "use server";
            await tandaiKembali(izin.id);
          }}
        >
          <Tombol type="submit" ukuran="sm">
            <LogIn size={15} />
            Sudah kembali
          </Tombol>
        </form>
      </div>
    </li>
  );
}
