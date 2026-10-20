import Link from "next/link";
import type { Metadata } from "next";
import { KeyRound, Power, Trash2 } from "lucide-react";
import {
  Kartu,
  KepalaKartu,
  Kosong,
  JudulHalaman,
  Lencana,
  Tabel,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { GENDER_LABEL, ROLE_LABEL, type Role } from "@/lib/constants";
import { wajibAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtTanggalJam } from "@/lib/tanggal";
import { cabutTokenWali, resetKataSandi, ubahStatusAkun } from "./aksi";
import { FormPengaturan, FormTokenWali } from "./form-pengaturan";
import { TautanWali } from "@/components/tautan-wali";
import { asalSitus } from "@/lib/situs";

export const metadata: Metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";

export default async function HalamanPengaturan() {
  const asal = await asalSitus();
  const pengguna = await wajibAdmin();

  const [pengaturan, pengurus, santri, tokenWali, audit] = await Promise.all([
    prisma.pengaturanSistem.findMany(),
    prisma.user.findMany({
      where: { role: { in: ["PEMBINA", "ADMIN"] } },
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        gender: true,
        aktif: true,
        pengajar: { select: { jabatan: true, dewanGuru: true } },
        _count: { select: { kelasDiampu: true } },
      },
      orderBy: [{ role: "asc" }, { nama: "asc" }],
    }),
    prisma.profilSantri.findMany({
      select: { id: true, user: { select: { nama: true } } },
      orderBy: { user: { nama: "asc" } },
    }),
    prisma.waliToken.findMany({
      where: { aktif: true },
      select: {
        id: true,
        token: true,
        namaWali: true,
        hubungan: true,
        terakhirDibuka: true,
        santri: { select: { id: true, user: { select: { nama: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.auditLog.findMany({
      select: {
        id: true,
        aksi: true,
        entitas: true,
        entitasId: true,
        createdAt: true,
        user: { select: { nama: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const nilai = Object.fromEntries(pengaturan.map((p) => [p.kunci, p.nilai]));

  return (
    <>
      <JudulHalaman
        judul="Pengaturan sistem"
        keterangan="Konfigurasi presensi, akun pengurus, akses wali santri, dan jejak aktivitas."
      />

      <div className="space-y-6">
        <Kartu>
          <KepalaKartu
            judul="Parameter presensi"
            keterangan="Berlaku sebagai nilai bawaan untuk seluruh sesi presensi."
          />
          <FormPengaturan nilai={nilai} />
        </Kartu>

        <Kartu>
          <KepalaKartu
            judul="Akun pengurus"
            keterangan={`${pengurus.length} akun pembina, dewan guru, dan admin`}
          />
          <Tabel>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th className="hidden sm:table-cell">Peran</Th>
                <Th className="hidden lg:table-cell">Kelas diampu</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-right">Tindakan</Th>
              </tr>
            </thead>
            <tbody>
              {pengurus.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <span className="block font-medium text-teks">{u.nama}</span>
                    <span className="block text-xs text-samar">
                      {u.username} · {GENDER_LABEL[u.gender]}
                    </span>
                  </Td>
                  <Td className="hidden text-sekunder sm:table-cell">
                    {ROLE_LABEL[u.role as Role]}
                    {u.pengajar ? (
                      <span className="block text-xs text-samar">
                        {u.pengajar.jabatan}
                      </span>
                    ) : null}
                  </Td>
                  <Td className="hidden text-center text-sekunder lg:table-cell">
                    {u._count.kelasDiampu}
                  </Td>
                  <Td className="text-center">
                    <Lencana
                      className={
                        u.aktif
                          ? "bg-sukses/15 text-sukses ring-sukses/30"
                          : "bg-bahaya/15 text-bahaya ring-bahaya/30"
                      }
                    >
                      {u.aktif ? "Aktif" : "Nonaktif"}
                    </Lencana>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <form action={resetKataSandi.bind(null, u.id)}>
                        <button
                          type="submit"
                          className="inline-grid size-11 cursor-pointer place-items-center rounded-lg text-redup transition-colors duration-200 hover:bg-lapis-naik hover:text-teks"
                          title="Atur ulang kata sandi (nilai baru tercatat pada log audit)"
                        >
                          <KeyRound size={15} />
                        </button>
                      </form>
                      {u.id !== pengguna.sub ? (
                        <form action={ubahStatusAkun.bind(null, u.id, !u.aktif)}>
                          <button
                            type="submit"
                            className="inline-grid size-11 cursor-pointer place-items-center rounded-lg text-redup transition-colors duration-200 hover:bg-lapis-naik hover:text-teks"
                            title={u.aktif ? "Nonaktifkan akun" : "Aktifkan akun"}
                          >
                            <Power size={15} />
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Tabel>
          <p className="border-t border-garis px-5 py-3 text-xs text-samar">
            Kata sandi sementara hasil pengaturan ulang dapat dilihat pada log audit di
            bawah halaman ini, lalu sampaikan langsung kepada yang bersangkutan.
          </p>
        </Kartu>

        <Kartu>
          <KepalaKartu
            judul="Akses wali santri"
            keterangan="Wali melihat rekap kehadiran anaknya melalui tautan bertoken, tanpa perlu membuat akun."
          />
          <FormTokenWali
            santri={santri.map((s) => ({ id: s.id, nama: s.user.nama }))}
          />
          {tokenWali.length === 0 ? (
            <Kosong judul="Belum ada tautan wali" />
          ) : (
            <Tabel>
              <thead>
                <tr>
                  <Th>Santri</Th>
                  <Th>Wali</Th>
                  <Th className="hidden md:table-cell">Tautan</Th>
                  <Th className="text-right">Tindakan</Th>
                </tr>
              </thead>
              <tbody>
                {tokenWali.map((w) => (
                  <Tr key={w.id}>
                    <Td>
                      <Link
                        href={`/santri/${w.santri.id}`}
                        className="inline-block -my-1 py-1 font-medium text-teks transition-colors duration-150 hover:text-aksen"
                      >
                        {w.santri.user.nama}
                      </Link>
                    </Td>
                    <Td className="text-sekunder">
                      {w.namaWali}
                      <span className="block text-xs text-samar">
                        {w.hubungan}
                      </span>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <TautanWali
                        tautan={`${asal}/wali/${w.token}`}
                        ukuran="kecil"
                      />
                      {w.terakhirDibuka ? (
                        <span className="block text-[11px] text-samar">
                          dibuka {fmtTanggalJam(w.terakhirDibuka)}
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-right">
                      <form action={cabutTokenWali.bind(null, w.id)}>
                        <button
                          type="submit"
                          className="inline-grid size-11 cursor-pointer place-items-center rounded-lg text-bahaya transition-colors duration-200 hover:bg-bahaya/10 hover:text-bahaya"
                          title="Cabut tautan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </form>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabel>
          )}
        </Kartu>

        <Kartu>
          <KepalaKartu judul="Log aktivitas" keterangan="40 catatan terakhir" />
          <ul className="divide-y divide-garis">
            {audit.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm"
              >
                <code className="rounded bg-lapis px-2 py-0.5 text-[11px] text-sukses">
                  {a.aksi}
                </code>
                <span className="text-sekunder">{a.entitas}</span>
                <span className="text-samar">{a.user?.nama ?? "sistem"}</span>
                <span className="ml-auto text-xs text-samar">
                  {fmtTanggalJam(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Kartu>
      </div>
    </>
  );
}
