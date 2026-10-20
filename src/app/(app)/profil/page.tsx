import type { Metadata } from "next";
import { Link2Off, Smartphone } from "lucide-react";
import {
  Avatar,
  Kartu,
  KepalaKartu,
  JudulHalaman,
  Lencana,
  Tombol,
} from "@/components/ui";
import { GENDER_LABEL, ROLE_LABEL } from "@/lib/constants";
import { wajibLogin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtTanggal } from "@/lib/tanggal";
import { FormKataSandi, FormKontak } from "./form-profil";
import { lepasPerangkatSendiri } from "./aksi";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function HalamanProfil() {
  const sesi = await wajibLogin();

  const user = await prisma.user.findUnique({
    where: { id: sesi.sub },
    select: {
      nama: true,
      username: true,
      role: true,
      gender: true,
      telepon: true,
      email: true,
      createdAt: true,
      santri: {
        select: {
          id: true,
          nim: true,
          kampus: true,
          jurusan: true,
          angkatan: true,
          asalDaerah: true,
          deviceId: true,
          deviceBoundAt: true,
          kelas: { select: { nama: true, pembina: { select: { nama: true } } } },
          kamar: { select: { nama: true, gedung: true } },
        },
      },
      pengajar: { select: { gelar: true, jabatan: true, bidang: true, dewanGuru: true } },
    },
  });

  if (!user) return null;

  return (
    <>
      <JudulHalaman judul="Profil saya" />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar nama={user.nama} ukuran={64} />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-teks">{user.nama}</h2>
          <p className="mt-0.5 text-sm text-redup">
            {user.username} · {ROLE_LABEL[user.role as keyof typeof ROLE_LABEL]}
            {user.pengajar ? ` · ${user.pengajar.jabatan}` : ""}
          </p>
        </div>
        <Lencana>{GENDER_LABEL[user.gender]}</Lencana>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="space-y-6">
          <Kartu>
            <KepalaKartu
              judul="Data kontak"
              keterangan="Dipakai pengurus untuk menghubungi Anda bila diperlukan."
            />
            <FormKontak telepon={user.telepon} email={user.email} />
          </Kartu>

          <Kartu>
            <KepalaKartu
              judul="Ubah kata sandi"
              keterangan="Gunakan kata sandi yang tidak mudah ditebak, terutama karena akun ini terhubung dengan catatan kehadiran."
            />
            <FormKataSandi />
          </Kartu>
        </div>

        <div className="space-y-6">
          {user.santri ? (
            <>
              <Kartu>
                <KepalaKartu judul="Data kesantrian" />
                <dl className="space-y-3 p-5 text-sm">
                  <Baris label="NIM">{user.santri.nim}</Baris>
                  <Baris label="Kampus">{user.santri.kampus}</Baris>
                  <Baris label="Program studi">{user.santri.jurusan}</Baris>
                  <Baris label="Angkatan">{user.santri.angkatan}</Baris>
                  <Baris label="Asal daerah">{user.santri.asalDaerah}</Baris>
                  <Baris label="Kelas">{user.santri.kelas?.nama ?? "-"}</Baris>
                  <Baris label="Pembina">
                    {user.santri.kelas?.pembina?.nama ?? "-"}
                  </Baris>
                  <Baris label="Kamar">
                    {user.santri.kamar
                      ? `${user.santri.kamar.nama}, ${user.santri.kamar.gedung}`
                      : "-"}
                  </Baris>
                </dl>
                <p className="border-t border-garis px-5 py-3 text-xs text-samar">
                  Perubahan data kesantrian dilakukan oleh admin pesantren.
                </p>
              </Kartu>

              <Kartu>
                <KepalaKartu judul="Perangkat presensi" />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-lapis text-sukses">
                      <Smartphone size={17} />
                    </span>
                    <p className="text-sm leading-relaxed text-sekunder">
                      {user.santri.deviceId
                        ? `Akun terikat pada satu perangkat sejak ${
                            user.santri.deviceBoundAt
                              ? fmtTanggal(user.santri.deviceBoundAt)
                              : "-"
                          }. Melepas keterikatan akan tercatat pada log sistem.`
                        : "Belum ada perangkat terdaftar. Perangkat akan terikat otomatis pada pemindaian QR pertama Anda."}
                    </p>
                  </div>

                  {user.santri.deviceId ? (
                    <form action={lepasPerangkatSendiri} className="mt-4">
                      <Tombol type="submit" gaya="kedua" ukuran="sm" className="w-full">
                        <Link2Off size={15} />
                        Saya berganti ponsel
                      </Tombol>
                    </form>
                  ) : null}
                </div>
              </Kartu>
            </>
          ) : null}

          {user.pengajar ? (
            <Kartu>
              <KepalaKartu judul="Data kepengurusan" />
              <dl className="space-y-3 p-5 text-sm">
                <Baris label="Jabatan">{user.pengajar.jabatan}</Baris>
                <Baris label="Bidang">{user.pengajar.bidang}</Baris>
                <Baris label="Gelar">{user.pengajar.gelar ?? "-"}</Baris>
                <Baris label="Dewan guru">
                  {user.pengajar.dewanGuru ? "Ya" : "Tidak"}
                </Baris>
              </dl>
            </Kartu>
          ) : null}

          <Kartu className="p-5">
            <p className="text-xs leading-relaxed text-samar">
              Akun dibuat {fmtTanggal(user.createdAt)}. Seluruh aktivitas penting
              (pembukaan sesi, presensi manual, keputusan izin) tercatat pada log audit
              sistem.
            </p>
          </Kartu>
        </div>
      </div>
    </>
  );
}

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-redup">{label}</dt>
      <dd className="text-right text-sekunder">{children}</dd>
    </div>
  );
}
