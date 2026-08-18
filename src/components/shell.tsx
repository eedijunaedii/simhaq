"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  keluar,
  children,
}: {
  sesi: { nama: string; role: Role; gender: string; username: string };
  keluar: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [buka, setBuka] = useState(false);
  const path = usePathname();

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
          className="text-emerald-100/60 lg:hidden"
          aria-label="Tutup menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {grupTampil.map((g) => (
          <div key={g.grup}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-100/30">
              {g.grup}
            </p>
            <ul className="space-y-0.5">
              {g.item.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={() => setBuka(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                      aktif(i.href)
                        ? "bg-emerald-500/15 font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/25"
                        : "text-emerald-100/65 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <i.ikon size={17} />
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/profil"
          onClick={() => setBuka(false)}
          className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.06]"
        >
          <Avatar nama={sesi.nama} ukuran={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">
              {sesi.nama}
            </span>
            <span className="block truncate text-xs text-emerald-100/45">
              {ROLE_LABEL[sesi.role]}
            </span>
          </span>
          <UserCircle size={16} className="shrink-0 text-emerald-100/40" />
        </Link>
        <form action={keluar}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-emerald-100/55 transition hover:bg-rose-500/10 hover:text-rose-200"
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
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-white/[0.03] backdrop-blur-md lg:block">
        <div className="sticky top-0 h-dvh">{isiSidebar}</div>
      </aside>

      {/* Laci (mobile) */}
      {buka ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setBuka(false)}
            aria-label="Tutup menu"
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-[#0c2412]">
            {isiSidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bilah atas (mobile) */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0a1f0d]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setBuka(true)}
            className="text-emerald-100/70"
            aria-label="Buka menu"
          >
            <Menu size={22} />
          </button>
          <LogoTeks ukuran={30} ringkas />
          <Link href="/profil">
            <Avatar nama={sesi.nama} ukuran={32} />
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
