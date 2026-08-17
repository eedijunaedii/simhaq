import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn, warnaBatang } from "@/lib/utils";

// --- Panel & kartu --------------------------------------------------------

export function Kartu({
  className,
  children,
  ...rest
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function KepalaKartu({
  judul,
  keterangan,
  aksi,
}: {
  judul: ReactNode;
  keterangan?: ReactNode;
  aksi?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-white">{judul}</h2>
        {keterangan ? (
          <p className="mt-0.5 text-sm text-emerald-100/55">{keterangan}</p>
        ) : null}
      </div>
      {aksi ? <div className="flex shrink-0 items-center gap-2">{aksi}</div> : null}
    </div>
  );
}

export function JudulHalaman({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: ReactNode;
  aksi?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {judul}
        </h1>
        {keterangan ? (
          <p className="mt-1 max-w-2xl text-sm text-emerald-100/60">{keterangan}</p>
        ) : null}
      </div>
      {aksi ? <div className="flex flex-wrap items-center gap-2">{aksi}</div> : null}
    </div>
  );
}

// --- Tombol ---------------------------------------------------------------

const GAYA_TOMBOL = {
  utama:
    "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20",
  kedua: "bg-white/10 text-white hover:bg-white/15 border border-white/15",
  bahaya: "bg-rose-500/90 text-white hover:bg-rose-500",
  hantu: "text-emerald-100/80 hover:bg-white/10 hover:text-white",
} as const;

const UKURAN_TOMBOL = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
} as const;

type PropsTombol = {
  gaya?: keyof typeof GAYA_TOMBOL;
  ukuran?: keyof typeof UKURAN_TOMBOL;
};

export function Tombol({
  gaya = "utama",
  ukuran = "md",
  className,
  ...rest
}: ComponentProps<"button"> & PropsTombol) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        GAYA_TOMBOL[gaya],
        UKURAN_TOMBOL[ukuran],
        className
      )}
      {...rest}
    />
  );
}

export function TautanTombol({
  gaya = "utama",
  ukuran = "md",
  className,
  ...rest
}: ComponentProps<typeof Link> & PropsTombol) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition",
        GAYA_TOMBOL[gaya],
        UKURAN_TOMBOL[ukuran],
        className
      )}
      {...rest}
    />
  );
}

// --- Lencana --------------------------------------------------------------

export function Lencana({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        className ?? "bg-white/10 text-emerald-100/80 ring-white/15"
      )}
    >
      {children}
    </span>
  );
}

// --- Form -----------------------------------------------------------------

export function Label({ className, ...rest }: ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-emerald-50/90", className)}
      {...rest}
    />
  );
}

const KELAS_KENDALI =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-emerald-100/30 focus:border-emerald-400/60 focus:bg-white/10 focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(KELAS_KENDALI, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cn(KELAS_KENDALI, "min-h-24", className)} {...rest} />;
}

export function Select({ className, ...rest }: ComponentProps<"select">) {
  return <select className={cn(KELAS_KENDALI, "pr-8", className)} {...rest} />;
}

export function Bidang({
  label,
  petunjuk,
  children,
  className,
}: {
  label: string;
  petunjuk?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {petunjuk ? (
        <p className="mt-1.5 text-xs text-emerald-100/45">{petunjuk}</p>
      ) : null}
    </div>
  );
}

// --- Umpan balik ----------------------------------------------------------

export function Peringatan({
  nada = "info",
  judul,
  children,
}: {
  nada?: "info" | "sukses" | "galat" | "waspada";
  judul?: string;
  children: ReactNode;
}) {
  const gaya = {
    info: "border-sky-400/25 bg-sky-500/10 text-sky-100",
    sukses: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
    galat: "border-rose-400/25 bg-rose-500/10 text-rose-100",
    waspada: "border-amber-400/25 bg-amber-500/10 text-amber-100",
  }[nada];

  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", gaya)}>
      {judul ? <p className="mb-0.5 font-semibold">{judul}</p> : null}
      <div className="text-[13px] leading-relaxed opacity-90">{children}</div>
    </div>
  );
}

export function Kosong({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-sm font-medium text-white">{judul}</p>
      {keterangan ? (
        <p className="max-w-sm text-sm text-emerald-100/50">{keterangan}</p>
      ) : null}
      {aksi ? <div className="mt-3">{aksi}</div> : null}
    </div>
  );
}

// --- Statistik ------------------------------------------------------------

export function KartuStat({
  label,
  nilai,
  satuan,
  keterangan,
  ikon,
  nada = "netral",
}: {
  label: string;
  nilai: ReactNode;
  satuan?: string;
  keterangan?: string;
  ikon?: ReactNode;
  nada?: "netral" | "baik" | "waspada" | "buruk";
}) {
  const warna = {
    netral: "text-white",
    baik: "text-emerald-300",
    waspada: "text-amber-300",
    buruk: "text-rose-300",
  }[nada];

  return (
    <Kartu className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-100/50">
          {label}
        </p>
        {ikon ? <span className="text-emerald-300/70">{ikon}</span> : null}
      </div>
      <p className={cn("mt-2 text-3xl font-bold tracking-tight", warna)}>
        {nilai}
        {satuan ? (
          <span className="ml-1 text-base font-medium opacity-60">{satuan}</span>
        ) : null}
      </p>
      {keterangan ? (
        <p className="mt-1 text-xs text-emerald-100/50">{keterangan}</p>
      ) : null}
    </Kartu>
  );
}

export function BatangProgres({
  nilai,
  className,
}: {
  nilai: number;
  className?: string;
}) {
  const lebar = Math.max(0, Math.min(100, nilai));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className={cn("h-full rounded-full transition-all", warnaBatang(lebar))}
        style={{ width: `${lebar}%` }}
      />
    </div>
  );
}

// --- Tabel ----------------------------------------------------------------

export function Tabel({ className, ...rest }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full min-w-[36rem] text-left text-sm", className)} {...rest} />
    </div>
  );
}

export function Th({ className, ...rest }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-emerald-100/50",
        className
      )}
      {...rest}
    />
  );
}

export function Td({ className, ...rest }: ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-white/5 px-4 py-3 align-middle text-emerald-50/90", className)}
      {...rest}
    />
  );
}

export function Tr({ className, ...rest }: ComponentProps<"tr">) {
  return <tr className={cn("transition hover:bg-white/[0.04]", className)} {...rest} />;
}

// --- Avatar ---------------------------------------------------------------

export function Avatar({ nama, ukuran = 36 }: { nama: string; ukuran?: number }) {
  const huruf = nama
    .split(" ")
    .filter((k) => /^[A-Za-z]/.test(k))
    .slice(0, 2)
    .map((k) => k[0].toUpperCase())
    .join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/80 to-emerald-700/80 font-semibold text-emerald-950"
      style={{ width: ukuran, height: ukuran, fontSize: ukuran * 0.36 }}
    >
      {huruf || "?"}
    </span>
  );
}
