import Link from "next/link";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { AlertTriangle, Check, Clock, Eye } from "lucide-react";
import {
  Kartu,
  KartuStat,
  KepalaKartu,
  Kosong,
  JudulHalaman,
  Lencana,
  Tombol,
} from "@/components/ui";
import {
  JENIS_FLAG_LABEL,
  METODE_PRESENSI_LABEL,
  STATUS_FLAG_LABEL,
} from "@/lib/constants";
import { catatAudit, filterGender, wajibPengurus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtTanggalJam, selisihManusiawi } from "@/lib/tanggal";
import { JENIS_IZIN_LABEL } from "@/lib/constants";
import { izinBelumDikonfirmasi } from "../izin/aksi";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pengawasan" };
export const dynamic = "force-dynamic";

async function ubahStatusFlag(id: string, status: string) {
  "use server";
  const sesi = await wajibPengurus();
  await prisma.flagPelanggaran.update({
    where: { id },
    data: { status, ditanganiOlehId: sesi.sub },
  });
  await catatAudit({
    userId: sesi.sub,
    aksi: "TANGANI_FLAG",
    entitas: "FlagPelanggaran",
    entitasId: id,
    detail: { status },
  });
  revalidatePath("/pengawasan");
}

export default async function HalamanPengawasan(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const pengguna = await wajibPengurus();
  const sp = await props.searchParams;
  const { gender } = filterGender(pengguna);
  const saring = sp.status ?? "BARU";

  const whereGender = gender ? { santri: { user: { gender } } } : {};

  const [flag, hitung, presensiManual, belumDikonfirmasi] = await Promise.all([
    prisma.flagPelanggaran.findMany({
      where: {
        ...whereGender,
        ...(saring === "SEMUA" ? {} : { status: saring }),
      },
      select: {
        id: true,
        jenis: true,
        keterangan: true,
        status: true,
        createdAt: true,
        ditanganiOleh: { select: { nama: true } },
        santri: {
          select: {
            id: true,
            user: { select: { nama: true } },
            halaqah: { select: { nama: true } },
          },
        },
        sesi: {
          select: { id: true, kegiatan: { select: { nama: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.flagPelanggaran.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: whereGender,
    }),
    prisma.presensi.findMany({
      where: {
        metode: "MANUAL",
        dicatatOlehId: { not: null },
        ...(gender ? { santri: { user: { gender } } } : {}),
      },
      select: {
        id: true,
        status: true,
        catatan: true,
        createdAt: true,
        santri: { select: { id: true, user: { select: { nama: true } } } },
        dicatatOleh: { select: { nama: true } },
        sesi: { select: { id: true, kegiatan: { select: { nama: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    izinBelumDikonfirmasi(gender),
  ]);

  const perStatus: Record<string, number> = {};
  for (const h of hitung) perStatus[h.status] = h._count._all;

  return (
    <>
      <JudulHalaman
        judul="Pengawasan"
        keterangan="Temuan sistem yang perlu ditinjau pengurus: indikasi titip absen, pemindaian di luar area, dan keterlambatan kembali dari izin."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat
          label="Temuan baru"
          nilai={perStatus.BARU ?? 0}
          nada={(perStatus.BARU ?? 0) > 0 ? "waspada" : "baik"}
        />
        <KartuStat label="Sedang ditinjau" nilai={perStatus.DITINJAU ?? 0} />
        <KartuStat label="Selesai ditangani" nilai={perStatus.SELESAI ?? 0} nada="baik" />
        <KartuStat
          label="Belum dikonfirmasi kembali"
          nilai={belumDikonfirmasi.length}
          nada={belumDikonfirmasi.length > 0 ? "waspada" : "baik"}
          keterangan="Menunggu petugas gerbang"
        />
      </div>

      {belumDikonfirmasi.length > 0 ? (
        <Kartu className="mb-6 border-waspada/25 bg-waspada/[0.05]">
          <KepalaKartu
            judul="Belum dikonfirmasi kembali"
            keterangan="Batas izin sudah lewat dan belum ada petugas yang menandai kepulangannya. Ini daftar tugas, bukan pelanggaran — santrinya bisa saja sudah pulang tepat waktu."
          />
          <ul className="divide-y divide-garis">
            {belumDikonfirmasi.map((z) => (
              <li key={z.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <Clock size={16} className="shrink-0 text-waspada" />
                <div className="min-w-48 flex-1">
                  <Link
                    href={`/santri/${z.santri.id}`}
                    className="inline-block -my-1 py-1 font-medium text-teks transition-colors duration-150 hover:text-aksen"
                  >
                    {z.santri.user.nama}
                  </Link>
                  <p className="text-xs text-redup">
                    {JENIS_IZIN_LABEL[z.jenis]} · batas {fmtTanggalJam(z.selesai)} (
                    {selisihManusiawi(z.selesai)})
                  </p>
                </div>
                <Link
                  href={`/izin/${z.id}`}
                  className="rounded-xl border border-kendali bg-lapis-naik px-3.5 py-2 text-xs font-medium text-teks transition hover:bg-lapis-naik"
                >
                  Buka izin
                </Link>
              </li>
            ))}
          </ul>
        </Kartu>
      ) : null}

      <Kartu className="mb-6">
        <div className="flex flex-wrap gap-1.5 border-b border-garis px-4 py-3">
          {["BARU", "DITINJAU", "SELESAI", "SEMUA"].map((s) => (
            <Link
              key={s}
              href={`/pengawasan?status=${s}`}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3.5 text-sm transition-colors duration-200",
                saring === s
                  ? "bg-sukses/15 font-medium text-sukses"
                  : "text-redup hover:bg-lapis hover:text-teks"
              )}
            >
              {STATUS_FLAG_LABEL[s] ?? "Semua"}
            </Link>
          ))}
        </div>

        {flag.length === 0 ? (
          <Kosong
            judul="Tidak ada temuan"
            keterangan="Belum ada indikasi pelanggaran pada kategori ini."
          />
        ) : (
          <ul className="divide-y divide-garis">
            {flag.map((f) => (
              <li key={f.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-waspada/15 text-waspada">
                  <AlertTriangle size={17} />
                </span>

                <div className="min-w-52 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/santri/${f.santri.id}`}
                      className="inline-block -my-1 py-1 font-medium text-teks transition-colors duration-150 hover:text-aksen"
                    >
                      {f.santri.user.nama}
                    </Link>
                    <Lencana className="bg-waspada/10 text-waspada ring-waspada/25">
                      {JENIS_FLAG_LABEL[f.jenis]}
                    </Lencana>
                    <Lencana
                      className={
                        f.status === "BARU"
                          ? "bg-bahaya/15 text-bahaya ring-bahaya/30"
                          : f.status === "DITINJAU"
                            ? "bg-info/15 text-info ring-info/30"
                            : "bg-sukses/15 text-sukses ring-sukses/30"
                      }
                    >
                      {STATUS_FLAG_LABEL[f.status]}
                    </Lencana>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-sekunder">
                    {f.keterangan}
                  </p>
                  <p className="mt-1 text-xs text-samar">
                    {fmtTanggalJam(f.createdAt)}
                    {f.santri.halaqah ? ` · ${f.santri.halaqah.nama}` : ""}
                    {f.sesi ? ` · ${f.sesi.kegiatan.nama}` : ""}
                    {f.ditanganiOleh ? ` · ditangani ${f.ditanganiOleh.nama}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {f.status === "BARU" ? (
                    <form
                      action={async () => {
                        "use server";
                        await ubahStatusFlag(f.id, "DITINJAU");
                      }}
                    >
                      <Tombol type="submit" gaya="kedua" ukuran="sm">
                        <Eye size={14} />
                        Tinjau
                      </Tombol>
                    </form>
                  ) : null}
                  {f.status !== "SELESAI" ? (
                    <form
                      action={async () => {
                        "use server";
                        await ubahStatusFlag(f.id, "SELESAI");
                      }}
                    >
                      <Tombol type="submit" ukuran="sm">
                        <Check size={14} />
                        Selesai
                      </Tombol>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Kartu>

      <Kartu>
        <KepalaKartu
          judul="Jejak presensi manual"
          keterangan="Setiap presensi yang diinput pengurus tercatat lengkap dengan siapa yang menginput."
        />
        {presensiManual.length === 0 ? (
          <Kosong judul="Belum ada presensi manual" />
        ) : (
          <ul className="divide-y divide-garis">
            {presensiManual.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
              >
                <Link
                  href={`/santri/${p.santri.id}`}
                  className="inline-block -my-1 py-1 font-medium text-teks transition-colors duration-150 hover:text-aksen"
                >
                  {p.santri.user.nama}
                </Link>
                <span className="text-redup">·</span>
                <Link
                  href={`/presensi/${p.sesi.id}`}
                  className="text-sekunder transition hover:text-aksen"
                >
                  {p.sesi.kegiatan.nama}
                </Link>
                <Lencana>{p.status}</Lencana>
                <span className="ml-auto text-xs text-samar">
                  {METODE_PRESENSI_LABEL.MANUAL} oleh {p.dicatatOleh?.nama ?? "-"} ·{" "}
                  {fmtTanggalJam(p.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </>
  );
}
