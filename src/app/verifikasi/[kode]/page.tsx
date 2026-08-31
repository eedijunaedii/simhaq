import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, LogIn, ShieldQuestion, XCircle } from "lucide-react";
import { LogoTeks } from "@/components/logo";
import { Kartu, Lencana, Peringatan, Tombol } from "@/components/ui";
import { ambilSesi, bolehJagaGerbang } from "@/lib/auth";
import { tandaiKembali } from "@/app/(app)/izin/aksi";
import {
  APP,
  JENIS_IZIN_LABEL,
  STATUS_IZIN_LABEL,
  STATUS_IZIN_STYLE,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { fmtTanggalJam } from "@/lib/tanggal";

export const metadata: Metadata = { title: "Verifikasi Izin" };
export const dynamic = "force-dynamic";

/**
 * Halaman verifikasi kartu izin — dapat dibuka tanpa akun oleh petugas yang
 * memindai QR pada kartu izin santri. Hanya menampilkan data seperlunya.
 */
export default async function HalamanVerifikasi(props: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = await props.params;

  const izin = await prisma.izin.findUnique({
    where: { kode: decodeURIComponent(kode).toUpperCase() },
    select: {
      kode: true,
      jenis: true,
      mulai: true,
      selesai: true,
      status: true,
      tujuan: true,
      id: true,
      waktuKembali: true,
      santri: {
        select: {
          nim: true,
          user: { select: { nama: true } },
          halaqah: { select: { nama: true } },
        },
      },
    },
  });

  // Tombol pencatatan hanya muncul untuk petugas gerbang yang sedang masuk.
  // Bagi siapa pun yang lain, halaman ini tetap sekadar bacaan.
  const pengguna = await ambilSesi();
  const bolehCatat =
    pengguna !== null &&
    bolehJagaGerbang(pengguna.role) &&
    izin?.status === "DISETUJUI" &&
    izin.waktuKembali === null;

  const sekarang = new Date();
  const sah =
    izin !== null &&
    izin.status === "DISETUJUI" &&
    izin.mulai <= sekarang &&
    izin.selesai >= sekarang;

  return (
    <div id="konten" className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center">
          <LogoTeks ukuran={38} />
        </div>

        <Kartu className="overflow-hidden">
          <div
            className={`px-6 py-7 text-center ${
              !izin
                ? "bg-lapis"
                : sah
                  ? "bg-sukses/10"
                  : "bg-waspada/10"
            }`}
          >
            <span
              className={`mx-auto grid size-14 place-items-center rounded-full ${
                !izin
                  ? "bg-lapis-naik text-redup"
                  : sah
                    ? "bg-sukses/20 text-sukses"
                    : "bg-waspada/20 text-waspada"
              }`}
            >
              {!izin ? (
                <ShieldQuestion size={28} />
              ) : sah ? (
                <CheckCircle2 size={28} />
              ) : (
                <XCircle size={28} />
              )}
            </span>
            <p className="mt-4 text-lg font-semibold text-teks">
              {!izin
                ? "Kartu izin tidak ditemukan"
                : sah
                  ? "Izin sah dan sedang berlaku"
                  : "Izin tidak sedang berlaku"}
            </p>
            <p className="mt-1 text-sm text-redup">
              {!izin
                ? "Kode pada kartu tidak terdaftar di sistem."
                : sah
                  ? "Santri berikut diizinkan berada di luar area pesantren."
                  : `Status pengajuan: ${STATUS_IZIN_LABEL[izin.status]}.`}
            </p>
          </div>

          {izin ? (
            <dl className="divide-y divide-garis">
              <Baris label="Nama santri" nilai={izin.santri.user.nama} />
              <Baris label="NIM" nilai={izin.santri.nim} />
              <Baris label="Halaqah" nilai={izin.santri.halaqah?.nama ?? "-"} />
              <Baris label="Jenis izin" nilai={JENIS_IZIN_LABEL[izin.jenis]} />
              <Baris label="Tujuan" nilai={izin.tujuan ?? "-"} />
              <Baris label="Mulai" nilai={fmtTanggalJam(izin.mulai)} />
              <Baris label="Selesai" nilai={fmtTanggalJam(izin.selesai)} />
              <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                <dt className="text-sm text-redup">Status</dt>
                <dd>
                  <Lencana className={STATUS_IZIN_STYLE[izin.status]}>
                    {STATUS_IZIN_LABEL[izin.status]}
                  </Lencana>
                </dd>
              </div>
              <div className="px-5 py-3.5">
                <p className="text-center font-mono text-xs text-samar">
                  {izin.kode}
                </p>
              </div>
            </dl>
          ) : null}
        </Kartu>

        {bolehCatat && izin ? (
          <Kartu className="mt-5 p-5">
            <p className="text-sm font-semibold text-teks">Santri kembali sekarang?</p>
            <p className="mt-1 text-xs leading-relaxed text-redup">
              Tekan bila santri ini sudah masuk kembali ke area pesantren. Waktu
              kembali dicatat otomatis atas nama {pengguna.nama}.
            </p>
            <form
              action={async () => {
                "use server";
                await tandaiKembali(izin.id);
              }}
              className="mt-4"
            >
              <Tombol type="submit" className="w-full">
                <LogIn size={16} />
                Tandai sudah kembali
              </Tombol>
            </form>
          </Kartu>
        ) : null}

        {izin?.status === "SELESAI" && izin.waktuKembali ? (
          <div className="mt-5">
            <Peringatan nada="sukses" judul="Sudah tercatat kembali">
              Kepulangan santri ini sudah dikonfirmasi pada{" "}
              {fmtTanggalJam(izin.waktuKembali)}.
            </Peringatan>
          </div>
        ) : null}

        {!pengguna && izin?.status === "DISETUJUI" ? (
          <p className="mt-5 text-center text-xs text-samar">
            Petugas gerbang:{" "}
            <Link href={`/login?lanjut=/verifikasi/${izin.kode}`} className="tautan-halus">
              masuk
            </Link>{" "}
            untuk mencatat kepulangan santri ini.
          </p>
        ) : null}

        <p className="mt-6 text-center text-xs leading-relaxed text-samar">
          Halaman verifikasi resmi {APP.lembaga}. Data ditampilkan seperlunya untuk
          keperluan pemeriksaan di gerbang pesantren.
        </p>
      </div>
    </div>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <dt className="text-sm text-redup">{label}</dt>
      <dd className="text-right text-sm text-sekunder">{nilai}</dd>
    </div>
  );
}
