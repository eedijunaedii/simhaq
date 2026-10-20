import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Kartu, JudulHalaman, Kosong, Lencana } from "@/components/ui";
import { wajibLogin } from "@/lib/auth";
import { GENDER_LABEL, ROLE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { tutupSesiKedaluwarsa } from "@/lib/presensi";
import { fmtJam, selisihManusiawi } from "@/lib/tanggal";
import { Pemindai } from "./pemindai";

export const metadata: Metadata = { title: "Pindai QR" };
export const dynamic = "force-dynamic";

export default async function HalamanScan(props: {
  searchParams: Promise<{ t?: string }>;
}) {
  const sesi = await wajibLogin();
  if (sesi.role !== ROLE.SANTRI || !sesi.santriId) redirect("/presensi");

  const { t } = await props.searchParams;
  await tutupSesiKedaluwarsa();

  const santri = await prisma.profilSantri.findUnique({
    where: { id: sesi.santriId },
    select: { kelasId: true, deviceId: true },
  });

  const sesiTerbuka = await prisma.sesiPresensi.findMany({
    where: {
      status: "DIBUKA",
      gender: { in: [sesi.gender, "SEMUA"] },
      OR: [{ kelasId: null }, { kelasId: santri?.kelasId ?? undefined }],
    },
    select: {
      id: true,
      waktuTutup: true,
      batasTerlambat: true,
      kegiatan: { select: { nama: true } },
      kelas: { select: { nama: true } },
      presensi: { where: { santriId: sesi.santriId }, select: { status: true } },
    },
    orderBy: { waktuBuka: "asc" },
  });

  return (
    <>
      <JudulHalaman
        judul="Pindai QR presensi"
        keterangan="Arahkan kamera ke layar QR yang ditampilkan pembina. Kode berganti setiap 40 detik sehingga tangkapan layar tidak berlaku."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <Pemindai tokenAwal={t} />
        </div>

        <div className="space-y-5">
          <Kartu>
            <div className="border-b border-garis px-5 py-4">
              <h2 className="text-base font-semibold text-teks">Sesi yang tersedia</h2>
              <p className="mt-0.5 text-sm text-redup">
                {GENDER_LABEL[sesi.gender]}
              </p>
            </div>
            {sesiTerbuka.length === 0 ? (
              <Kosong
                judul="Tidak ada sesi terbuka"
                keterangan="Sesi presensi hanya muncul saat pembina membukanya."
              />
            ) : (
              <ul className="divide-y divide-garis">
                {sesiTerbuka.map((s) => {
                  const status = s.presensi[0]?.status;
                  return (
                    <li key={s.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-teks">
                            {s.kegiatan.nama}
                          </p>
                          {s.kelas ? (
                            <p className="text-xs text-redup">
                              {s.kelas.nama}
                            </p>
                          ) : null}
                        </div>
                        {status ? (
                          <Lencana className="bg-sukses/15 text-sukses ring-sukses/30">
                            Tercatat
                          </Lencana>
                        ) : (
                          <Lencana className="bg-waspada/15 text-waspada ring-waspada/30">
                            Belum
                          </Lencana>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-redup">
                        Batas tidak terlambat {fmtJam(s.batasTerlambat)} · sesi tutup{" "}
                        {selisihManusiawi(s.waktuTutup)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Kartu>

          <Kartu className="p-5">
            <h3 className="text-sm font-semibold text-teks">Perangkat Anda</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-redup">
              {santri?.deviceId
                ? "Akun ini sudah terikat pada satu perangkat. Bila Anda berganti ponsel, mintalah pembina melepas keterikatan perangkat."
                : "Perangkat belum terdaftar. Perangkat yang Anda pakai pada pemindaian pertama akan terikat otomatis dengan akun ini."}
            </p>
          </Kartu>
        </div>
      </div>
    </>
  );
}
