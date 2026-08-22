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
        "rounded-2xl border border-garis bg-permukaan/[0.55] backdrop-blur-sm",
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
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-garis px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-white">{judul}</h2>
        {keterangan ? (
          <p className="mt-0.5 text-sm text-redup">{keterangan}</p>
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
          <p className="mt-1 max-w-2xl text-sm text-sekunder">{keterangan}</p>
        ) : null}
      </div>
      {aksi ? <div className="flex flex-wrap items-center gap-2">{aksi}</div> : null}
    </div>
  );
}

// --- Tombol ---------------------------------------------------------------

const GAYA_TOMBOL = {
  utama: "bg-aksen text-[#06240f] hover:bg-aksen-lembut",
  kedua: "bg-white/[0.07] text-teks hover:bg-white/[0.12] border border-kendali",
  bahaya: "bg-rose-500 text-white hover:bg-rose-400",
  hantu: "text-sekunder hover:bg-white/[0.08] hover:text-teks",
} as const;

const UKURAN_TOMBOL = {
  sm: "min-h-9 px-3 py-1.5 text-xs",
  md: "min-h-11 px-4 py-2 text-sm",
  lg: "min-h-12 px-5 py-2.5 text-sm",
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
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
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
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-200",
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
        className ?? "bg-white/[0.08] text-sekunder ring-white/15"
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
      className={cn("mb-1.5 block text-sm font-medium text-teks", className)}
      {...rest}
    />
  );
}

const KELAS_KENDALI =
  "w-full min-h-11 rounded-xl border border-kendali bg-white/[0.05] px-3.5 py-2.5 text-sm text-teks outline-none transition-colors duration-200 placeholder:text-samar hover:border-aksen-lembut/70 focus-visible:border-aksen disabled:cursor-not-allowed disabled:opacity-50";

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
        <p className="mt-1.5 text-xs text-redup">{petunjuk}</p>
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
        <p className="max-w-sm text-sm text-redup">{keterangan}</p>
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
    netral: "text-teks",
    baik: "text-aksen",
    waspada: "text-amber-300",
    buruk: "text-rose-300",
  }[nada];

  return (
    <Kartu className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-redup">
          {label}
        </p>
        {ikon ? <span className="text-aksen">{ikon}</span> : null}
      </div>
      <p className={cn("angka mt-2 text-3xl font-bold tracking-tight", warna)}>
        {nilai}
        {satuan ? (
          <span className="ml-1 text-base font-medium opacity-60">{satuan}</span>
        ) : null}
      </p>
      {keterangan ? (
        <p className="mt-1 text-xs text-redup">{keterangan}</p>
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
        "border-b border-garis px-4 py-3 text-xs font-semibold uppercase tracking-wide text-redup",
        className
      )}
      {...rest}
    />
  );
}

export function Td({ className, ...rest }: ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-white/[0.06] px-4 py-3 align-middle text-sekunder", className)}
      {...rest}
    />
  );
}

export function Tr({ className, ...rest }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors duration-150 hover:bg-white/[0.05]", className)} {...rest} />;
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
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aksen to-emerald-500 font-semibold text-[#06240f]"
      style={{ width: ukuran, height: ukuran, fontSize: ukuran * 0.36 }}
    >
      {huruf || "?"}
    </span>
  );
}
