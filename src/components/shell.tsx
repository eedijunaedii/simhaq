"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  CalendarClock,
  DoorClosed,
  ClipboardList,
  DoorOpen,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  ScanLine,
  Settings,
  ShieldAlert,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { LogoTeks } from "@/components/logo";
import { Avatar } from "@/components/ui";
import { TombolTema } from "@/components/tombol-tema";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Menu = {
  href: string;
  label: string;
  ikon: React.ComponentType<{ size?: number }>;
  peran: Role[];
};

const MENU: { grup: string; item: Menu[] }[] = [
  {
    grup: "Utama",
    item: [
      {
        href: "/dashboard",
        label: "Dasbor",
        ikon: LayoutDashboard,
        peran: ["SANTRI", "MUSYRIF", "ADMIN"],
      },
      {
        href: "/gerbang",
        label: "Pos Gerbang",
        ikon: DoorClosed,
        peran: ["PETUGAS", "MUSYRIF", "ADMIN"],
      },
      { href: "/scan", label: "Pindai QR", ikon: ScanLine, peran: ["SANTRI"] },
      {
        href: "/presensi/saya",
        label: "Presensi Saya",
        ikon: BadgeCheck,
        peran: ["SANTRI"],
      },
      {
        href: "/presensi",
        label: "Sesi Presensi",
        ikon: QrCode,
        peran: ["MUSYRIF", "ADMIN"],
      },
      {
        href: "/izin",
        label: "Perizinan",
        ikon: ClipboardList,
        peran: ["SANTRI", "MUSYRIF", "ADMIN"],
      },
    ],
  },
  {
    grup: "Data",
    item: [
      { href: "/santri", label: "Santri", ikon: Users, peran: ["MUSYRIF", "ADMIN"] },
      {
        href: "/halaqah",
        label: "Halaqah",
        ikon: BookOpen,
        peran: ["MUSYRIF", "ADMIN"],
      },
      { href: "/kegiatan", label: "Kegiatan", ikon: CalendarClock, peran: ["ADMIN"] },
      { href: "/kamar", label: "Kamar", ikon: DoorOpen, peran: ["ADMIN"] },
    ],
  },
  {
    grup: "Laporan & Pengawasan",
    item: [
      {
        href: "/laporan",
        label: "Rekap & Laporan",
        ikon: FileBarChart,
        peran: ["MUSYRIF", "ADMIN"],
      },
      {
        href: "/pengawasan",
        label: "Pengawasan",
        ikon: ShieldAlert,
        peran: ["MUSYRIF", "ADMIN"],
      },
      { href: "/pengaturan", label: "Pengaturan", ikon: Settings, peran: ["ADMIN"] },
    ],
  },
];

export function Shell({
  sesi,
  badge = {},
  keluar,
  children,
}: {
  sesi: { nama: string; role: Role; gender: string; username: string };
  badge?: { izin?: number; presensi?: number };
  keluar: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [buka, setBuka] = useState(false);
  const path = usePathname();

  // Tutup laci menu dengan tombol Escape.
  useEffect(() => {
    if (!buka) return;
    const saatTekan = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
    };
    window.addEventListener("keydown", saatTekan);
    return () => window.removeEventListener("keydown", saatTekan);
  }, [buka]);

  const grupTampil = MENU.map((g) => ({
    ...g,
    item: g.item.filter((i) => i.peran.includes(sesi.role)),
  })).filter((g) => g.item.length > 0);

  const aktif = (href: string) =>
    path === href || (href !== "/dashboard" && path.startsWith(`${href}/`));

  const isiSidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/dashboard" onClick={() => setBuka(false)}>
          <LogoTeks ukuran={34} />
        </Link>
        <button
          onClick={() => setBuka(false)}
          className="-mr-2 inline-grid size-11 cursor-pointer place-items-center rounded-xl text-sekunder transition-colors duration-200 hover:bg-lapis hover:text-teks lg:hidden"
          aria-label="Tutup menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {grupTampil.map((g) => (
          <div key={g.grup}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-samar">
              {g.grup}
            </p>
            <ul className="space-y-0.5">
              {g.item.map((i) => {
                const jumlah =
                  i.href === "/izin"
                    ? badge.izin
                    : i.href === "/presensi"
                      ? badge.presensi
                      : 0;
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={() => setBuka(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                        aktif(i.href)
                          ? "bg-aksen/10 font-medium text-aksen ring-1 ring-inset ring-aksen/25"
                          : "text-sekunder hover:bg-lapis hover:text-teks"
                      )}
                    >
                      <i.ikon size={17} />
                      <span className="flex-1">{i.label}</span>
                      {jumlah ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-aksen/15 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-aksen ring-1 ring-inset ring-aksen/25">
                          {jumlah}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-garis p-3">
        <div className="flex items-center gap-1">
          <Link
            href="/profil"
            onClick={() => setBuka(false)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-lapis"
          >
            <Avatar nama={sesi.nama} ukuran={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-teks">
                {sesi.nama}
              </span>
              <span className="block truncate text-xs text-redup">
                {ROLE_LABEL[sesi.role]}
              </span>
            </span>
            <UserCircle size={16} className="shrink-0 text-samar" />
          </Link>
          <TombolTema className="inline-grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl text-sekunder transition-colors duration-200 hover:bg-lapis hover:text-teks" />
        </div>
        <form action={keluar}>
          <button
            type="submit"
            className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-redup transition-colors duration-200 hover:bg-bahaya/10 hover:text-bahaya"
          >
            <LogOut size={17} />
            Keluar
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar tetap (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r border-garis bg-dasar-naik/60 backdrop-blur-md lg:block">
        <div className="sticky top-0 h-dvh">{isiSidebar}</div>
      </aside>

      {/* Laci (mobile) */}
      {buka ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-[var(--tirai)] backdrop-blur-sm"
            onClick={() => setBuka(false)}
            aria-label="Tutup menu"
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-garis bg-dasar-naik">
            {isiSidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bilah atas (mobile) */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-garis bg-dasar/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setBuka(true)}
            className="-ml-2 inline-grid size-11 cursor-pointer place-items-center rounded-xl text-sekunder transition-colors duration-200 hover:bg-lapis hover:text-teks"
            aria-label="Buka menu"
          >
            <Menu size={22} />
          </button>
          <LogoTeks ukuran={30} ringkas />
          <div className="-mr-2 flex items-center gap-1">
            <TombolTema className="inline-grid size-11 cursor-pointer place-items-center rounded-xl text-sekunder transition-colors duration-200 hover:bg-lapis hover:text-teks" />
            <Link
              href="/profil"
              aria-label="Profil saya"
              className="inline-grid size-11 place-items-center rounded-xl p-2 transition-colors duration-200 hover:bg-lapis"
            >
              <Avatar nama={sesi.nama} ukuran={32} />
            </Link>
          </div>
        </header>

        <main id="konten" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
