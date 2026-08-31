import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CircleSlash,
  Download,
  LogIn,
  Paperclip,
  X,
} from "lucide-react";
import { QrTautan } from "@/components/qr-statis";
import {
  Kartu,
  KepalaKartu,
  Lencana,
  JudulHalaman,
  Peringatan,
  Textarea,
  Tombol,
} from "@/components/ui";
import {
  JENIS_IZIN_LABEL,
  ROLE,
  STATUS_IZIN_LABEL,
  STATUS_IZIN_STYLE,
  STATUS_PRESENSI_LABEL,
} from "@/lib/constants";
import { genderYangBolehDiakses, wajibLogin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtTanggalJam, selisihManusiawi } from "@/lib/tanggal";
import { batalkanIzin, setujuiIzinDariForm, tandaiKembali, tolakIzinDariForm } from "../aksi";

export const metadata: Metadata = { title: "Detail Izin" };
export const dynamic = "force-dynamic";

export default async function HalamanDetailIzin(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const sesi = await wajibLogin();
  // Detail izin memuat alasan pribadi dan lampiran bukti (mis. surat dokter),
  // di luar kebutuhan petugas gerbang. Ia memakai halaman verifikasi kartu.
  if (sesi.role === ROLE.PETUGAS) redirect("/gerbang");

  const izin = await prisma.izin.findUnique({
    where: { id },
    select: {
      id: true,
      kode: true,
      jenis: true,
      mulai: true,
      selesai: true,
      alasan: true,
      tujuan: true,
      status: true,
      catatanPengurus: true,
      waktuProses: true,
      waktuKembali: true,
      terlambatKembali: true,
      createdAt: true,
      diprosesOleh: { select: { nama: true } },
      lampiran: {
        select: { id: true, namaFile: true, mimeType: true, ukuran: true, data: true },
      },
      santri: {
        select: {
          id: true,
          nim: true,
          kampus: true,
          user: { select: { nama: true, gender: true } },
          halaqah: { select: { nama: true, musyrif: { select: { nama: true } } } },
          kamar: { select: { nama: true, gedung: true } },
        },
      },
      presensi: {
        select: {
          status: true,
          sesi: { select: { tanggal: true, kegiatan: { select: { nama: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!izin) notFound();

  const milikSendiri = sesi.role === ROLE.SANTRI && izin.santri.id === sesi.santriId;
  const pengurus = sesi.role !== ROLE.SANTRI;
  const bolehLihat =
    milikSendiri ||
    (pengurus && genderYangBolehDiakses(sesi).includes(izin.santri.user.gender));
  if (!bolehLihat) redirect("/izin");

  const bisaDiproses = pengurus && ["DIAJUKAN", "DIPROSES"].includes(izin.status);
  const bisaDitandaiKembali = pengurus && izin.status === "DISETUJUI";
  const bisaDibatalkan =
    (milikSendiri || pengurus) && ["DIAJUKAN", "DIPROSES"].includes(izin.status);
  const berlaku =
    izin.status === "DISETUJUI" &&
    izin.mulai <= new Date() &&
    izin.selesai >= new Date();

  return (
    <>
      <Link
        href="/izin"
        className="mb-4 inline-flex items-center gap-2 text-sm text-redup transition hover:text-teks"
      >
        <ArrowLeft size={16} />
        Perizinan
      </Link>

      <JudulHalaman
        judul={JENIS_IZIN_LABEL[izin.jenis]}
        keterangan={`${izin.kode} · diajukan ${fmtTanggalJam(izin.createdAt)}`}
        aksi={
          <Lencana className={STATUS_IZIN_STYLE[izin.status]}>
            {STATUS_IZIN_LABEL[izin.status]}
          </Lencana>
        }
      />

      {izin.terlambatKembali ? (
        <div className="mb-5">
          <Peringatan nada="waspada" judul="Terlambat kembali">
            {izin.waktuKembali
              ? `Santri tercatat kembali ${fmtTanggalJam(izin.waktuKembali)}, melewati batas izin.`
              : "Batas waktu izin sudah lewat namun santri belum tercatat kembali ke pesantren."}
          </Peringatan>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Kartu>
            <KepalaKartu judul="Rincian pengajuan" />
            <dl className="grid gap-5 p-5 sm:grid-cols-2">
              <Info label="Santri">
                <Link
                  href={pengurus ? `/santri/${izin.santri.id}` : "#"}
                  className={pengurus ? "tautan-halus" : ""}
                >
                  {izin.santri.user.nama}
                </Link>
                <span className="block text-xs text-samar">
                  {izin.santri.nim} · {izin.santri.kampus}
                </span>
              </Info>
              <Info label="Halaqah">
                {izin.santri.halaqah?.nama ?? "-"}
                <span className="block text-xs text-samar">
                  Musyrif {izin.santri.halaqah?.musyrif?.nama ?? "-"}
                </span>
              </Info>
              <Info label="Mulai">{fmtTanggalJam(izin.mulai)}</Info>
              <Info label="Selesai">
                {fmtTanggalJam(izin.selesai)}
                {berlaku ? (
                  <span className="block text-xs text-sukses">
                    berakhir {selisihManusiawi(izin.selesai)}
                  </span>
                ) : null}
              </Info>
              <Info label="Tujuan">{izin.tujuan ?? "-"}</Info>
              <Info label="Kamar">
                {izin.santri.kamar
                  ? `${izin.santri.kamar.nama}, ${izin.santri.kamar.gedung}`
                  : "-"}
              </Info>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-samar">
                  Alasan
                </dt>
                <dd className="mt-1 leading-relaxed text-sekunder">{izin.alasan}</dd>
              </div>
            </dl>
          </Kartu>

          {izin.lampiran.length > 0 ? (
            <Kartu>
              <KepalaKartu judul="Lampiran bukti" />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                {izin.lampiran.map((l) => (
                  <div
                    key={l.id}
                    className="overflow-hidden rounded-xl border border-garis"
                  >
                    {l.mimeType.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.data}
                        alt={l.namaFile}
                        className="max-h-64 w-full bg-[var(--tirai)] object-contain"
                      />
                    ) : (
                      <div className="grid h-32 place-items-center bg-lapis text-redup">
                        <Paperclip size={22} />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <span className="min-w-0 truncate text-xs text-sekunder">
                        {l.namaFile}
                        <span className="block text-[11px] text-samar">
                          {(l.ukuran / 1024).toFixed(0)} KB
                        </span>
                      </span>
                      <a
                        href={l.data}
                        download={l.namaFile}
                        className="shrink-0 text-sukses transition hover:text-sukses"
                        aria-label={`Unduh ${l.namaFile}`}
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Kartu>
          ) : null}

          {bisaDiproses ? (
            <Kartu>
              <KepalaKartu
                judul="Keputusan musyrif"
                keterangan="Izin yang disetujui otomatis menutup sesi presensi pada rentang waktunya."
              />
              <div className="space-y-4 p-5">
                <form className="space-y-4">
                  <input type="hidden" name="izinId" value={izin.id} />
                  <Textarea
                    name="catatan"
                    rows={3}
                    placeholder="Catatan untuk santri (opsional). Contoh: Disetujui, mohon kembali tepat waktu."
                  />
                  <div className="flex flex-wrap gap-3">
                    <Tombol type="submit" formAction={setujuiIzinDariForm}>
                      <Check size={16} />
                      Setujui izin
                    </Tombol>
                    <Tombol type="submit" gaya="bahaya" formAction={tolakIzinDariForm}>
                      <X size={16} />
                      Tolak
                    </Tombol>
                  </div>
                </form>
              </div>
            </Kartu>
          ) : null}

          {izin.catatanPengurus || izin.waktuProses ? (
            <Kartu>
              <KepalaKartu judul="Catatan pengurus" />
              <div className="space-y-2 p-5 text-sm">
                {izin.catatanPengurus ? (
                  <p className="leading-relaxed text-sekunder">
                    {izin.catatanPengurus}
                  </p>
                ) : (
                  <p className="text-samar">Tanpa catatan tambahan.</p>
                )}
                {izin.waktuProses ? (
                  <p className="text-xs text-samar">
                    Diproses {fmtTanggalJam(izin.waktuProses)}
                    {izin.diprosesOleh ? ` oleh ${izin.diprosesOleh.nama}` : ""}
                  </p>
                ) : null}
              </div>
            </Kartu>
          ) : null}

          {izin.presensi.length > 0 ? (
            <Kartu>
              <KepalaKartu
                judul="Sesi presensi yang tercakup"
                keterangan={`${izin.presensi.length} sesi tercatat otomatis karena izin ini`}
              />
              <ul className="divide-y divide-garis">
                {izin.presensi.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sekunder">
                        {p.sesi.kegiatan.nama}
                      </span>
                      <span className="block text-xs text-samar">
                        {p.sesi.tanggal.toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                    <Lencana className="bg-info/15 text-info ring-info/30">
                      {STATUS_PRESENSI_LABEL[p.status]}
                    </Lencana>
                  </li>
                ))}
              </ul>
            </Kartu>
          ) : null}
        </div>

        <div className="space-y-6">
          {izin.status === "DISETUJUI" || izin.status === "SELESAI" ? (
            <Kartu className="overflow-hidden">
              <div className="border-b border-garis bg-sukses/[0.07] px-5 py-4 text-center">
                <p className="text-sm font-semibold text-teks">Kartu Izin Digital</p>
                <p className="mt-0.5 text-xs text-redup">
                  Tunjukkan saat keluar area pesantren
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 p-6">
                <div className="rounded-2xl bg-white p-3.5">
                  <QrTautan path={`/verifikasi/${izin.kode}`} ukuran={180} />
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm text-sukses">{izin.kode}</p>
                  <p className="mt-1 text-sm font-medium text-teks">
                    {izin.santri.user.nama}
                  </p>
                  <p className="mt-0.5 text-xs text-redup">
                    {JENIS_IZIN_LABEL[izin.jenis]}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-redup">
                    {fmtTanggalJam(izin.mulai)}
                    <br />
                    s.d. {fmtTanggalJam(izin.selesai)}
                  </p>
                </div>
              </div>
            </Kartu>
          ) : null}

          {bisaDitandaiKembali ? (
            <Kartu className="p-5">
              <p className="text-sm font-semibold text-teks">Konfirmasi kepulangan</p>
              <p className="mt-1 text-xs leading-relaxed text-redup">
                Tandai bila santri sudah kembali ke pesantren. Kembali melewati batas
                waktu akan tercatat pada halaman Pengawasan.
              </p>
              <form
                action={async () => {
                  "use server";
                  await tandaiKembali(izin.id);
                }}
                className="mt-4"
              >
                <Tombol type="submit" ukuran="sm" className="w-full">
                  <LogIn size={15} />
                  Tandai sudah kembali
                </Tombol>
              </form>
              {izin.selesai < new Date() ? (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-waspada">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  Batas waktu izin sudah lewat.
                </p>
              ) : null}
            </Kartu>
          ) : null}

          {bisaDibatalkan ? (
            <form
              action={async () => {
                "use server";
                await batalkanIzin(izin.id);
              }}
            >
              <Tombol type="submit" gaya="kedua" ukuran="sm" className="w-full">
                <CircleSlash size={15} />
                Batalkan pengajuan
              </Tombol>
            </form>
          ) : null}

          <Kartu className="p-5">
            <p className="text-sm font-semibold text-teks">Alur status</p>
            <ol className="mt-3 space-y-2.5 text-sm">
              {["DIAJUKAN", "DIPROSES", "DISETUJUI", "SELESAI"].map((s) => {
                const urutan = ["DIAJUKAN", "DIPROSES", "DISETUJUI", "SELESAI"];
                const posisiKini = urutan.indexOf(izin.status);
                const posisi = urutan.indexOf(s);
                const lewat = posisiKini >= posisi && posisiKini !== -1;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={
                        lewat
                          ? "size-2 rounded-full bg-sukses"
                          : "size-2 rounded-full bg-lapis-naik"
                      }
                    />
                    <span className={lewat ? "text-sukses" : "text-samar"}>
                      {STATUS_IZIN_LABEL[s]}
                    </span>
                  </li>
                );
              })}
            </ol>
            {["DITOLAK", "DIBATALKAN"].includes(izin.status) ? (
              <p className="mt-3 rounded-lg bg-bahaya/10 px-3 py-2 text-xs text-bahaya">
                Pengajuan {STATUS_IZIN_LABEL[izin.status].toLowerCase()}.
              </p>
            ) : null}
          </Kartu>
        </div>
      </div>
    </>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-samar">{label}</dt>
      <dd className="mt-1 text-sm text-sekunder">{children}</dd>
    </div>
  );
}
