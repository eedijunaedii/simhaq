import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import {
  Avatar,
  Input,
  Kartu,
  KepalaKartu,
  Kosong,
  JudulHalaman,
  KartuStat,
  Lencana,
  Select,
  Tabel,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { AMBANG_PEMBINAAN, GENDER_LABEL } from "@/lib/constants";
import { filterGender, wajibPengurus } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rekapPerSantri } from "@/lib/rekap";
import { cn, warnaKehadiran } from "@/lib/utils";

export const metadata: Metadata = { title: "Santri" };
export const dynamic = "force-dynamic";

export default async function HalamanSantri(props: {
  searchParams: Promise<{ q?: string; halaqah?: string; kampus?: string }>;
}) {
  const pengguna = await wajibPengurus();
  const sp = await props.searchParams;
  const { gender } = filterGender(pengguna);

  const [daftar, halaqah, kampusRows, rekap] = await Promise.all([
    prisma.profilSantri.findMany({
      where: {
        ...(gender ? { user: { gender } } : {}),
        ...(sp.halaqah ? { halaqahId: sp.halaqah } : {}),
        ...(sp.kampus ? { kampus: sp.kampus } : {}),
        ...(sp.q
          ? {
              OR: [
                { user: { nama: { contains: sp.q } } },
                { nim: { contains: sp.q } },
                { jurusan: { contains: sp.q } },
                { asalDaerah: { contains: sp.q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        nim: true,
        kampus: true,
        jurusan: true,
        angkatan: true,
        asalDaerah: true,
        status: true,
        deviceId: true,
        user: { select: { nama: true, gender: true, username: true } },
        halaqah: { select: { id: true, nama: true } },
        kamar: { select: { nama: true, gedung: true } },
      },
      orderBy: { user: { nama: "asc" } },
    }),
    prisma.halaqah.findMany({
      where: gender ? { gender } : {},
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
    prisma.profilSantri.findMany({
      where: gender ? { user: { gender } } : {},
      select: { kampus: true },
      distinct: ["kampus"],
      orderBy: { kampus: "asc" },
    }),
    rekapPerSantri({ gender }),
  ]);

  const petaRekap = new Map(rekap.map((r) => [r.santriId, r]));
  const aktif = daftar.filter((s) => s.status === "AKTIF").length;
  const dibawahAmbang = rekap.filter(
    (r) => r.total > 0 && r.persen < AMBANG_PEMBINAAN
  ).length;
  const belumTerikat = daftar.filter((s) => !s.deviceId).length;

  return (
    <>
      <JudulHalaman
        judul="Data santri"
        keterangan={
          gender
            ? `Menampilkan santri ${GENDER_LABEL[gender]} sesuai kebijakan hijab pesantren.`
            : "Seluruh santri aktif pesantren."
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat label="Santri aktif" nilai={aktif} />
        <KartuStat label="Ditampilkan" nilai={daftar.length} />
        <KartuStat
          label={`Kehadiran < ${AMBANG_PEMBINAAN}%`}
          nilai={dibawahAmbang}
          nada={dibawahAmbang > 0 ? "waspada" : "baik"}
        />
        <KartuStat
          label="Perangkat belum terikat"
          nilai={belumTerikat}
          keterangan="Terikat otomatis saat pemindaian pertama"
        />
      </div>

      <Kartu>
        <KepalaKartu judul="Daftar santri" keterangan={`${daftar.length} santri`} />

        <form className="flex flex-wrap gap-3 border-b border-garis px-5 py-4">
          <div className="relative min-w-52 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-samar"
            />
            <Input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Cari nama, NIM, jurusan, atau daerah asal..."
              className="pl-10"
            />
          </div>
          <Select name="halaqah" defaultValue={sp.halaqah ?? ""} className="w-auto min-w-44">
            <option value="">Semua halaqah</option>
            {halaqah.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nama}
              </option>
            ))}
          </Select>
          <Select name="kampus" defaultValue={sp.kampus ?? ""} className="w-auto min-w-36">
            <option value="">Semua kampus</option>
            {kampusRows.map((k) => (
              <option key={k.kampus} value={k.kampus}>
                {k.kampus}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            className="rounded-xl bg-sukses px-4 py-2 text-sm font-medium text-sukses transition hover:bg-sukses"
          >
            Cari
          </button>
        </form>

        {daftar.length === 0 ? (
          <Kosong
            judul="Tidak ada santri yang cocok"
            keterangan="Ubah kata kunci atau penyaringan."
          />
        ) : (
          <Tabel>
            <thead>
              <tr>
                <Th>Santri</Th>
                <Th className="hidden md:table-cell">Kampus / Jurusan</Th>
                <Th className="hidden lg:table-cell">Halaqah</Th>
                <Th className="hidden xl:table-cell">Kamar</Th>
                <Th className="text-right">Kehadiran</Th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((s) => {
                const r = petaRekap.get(s.id);
                return (
                  <Tr key={s.id}>
                    <Td>
                      <Link
                        href={`/santri/${s.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar nama={s.user.nama} ukuran={34} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-teks group-hover:text-aksen">
                            {s.user.nama}
                          </span>
                          <span className="block text-xs text-samar">
                            {s.nim} · {s.user.username}
                          </span>
                        </span>
                      </Link>
                    </Td>
                    <Td className="hidden text-sekunder md:table-cell">
                      <span className="block">{s.kampus}</span>
                      <span className="block text-xs text-samar">
                        {s.jurusan} · {s.angkatan}
                      </span>
                    </Td>
                    <Td className="hidden text-sekunder lg:table-cell">
                      {s.halaqah?.nama ?? "-"}
                    </Td>
                    <Td className="hidden text-sekunder xl:table-cell">
                      {s.kamar ? `${s.kamar.nama}` : "-"}
                      {s.kamar ? (
                        <span className="block text-xs text-samar">
                          {s.kamar.gedung}
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-right">
                      {r && r.total > 0 ? (
                        <span className={cn("font-semibold", warnaKehadiran(r.persen))}>
                          {r.persen}%
                        </span>
                      ) : (
                        <Lencana className="bg-lapis text-samar ring-garis">
                          Belum ada data
                        </Lencana>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Tabel>
        )}
      </Kartu>
    </>
  );
}
