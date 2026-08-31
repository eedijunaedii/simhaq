import Link from "next/link";
import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn, warnaBatang } from "@/lib/utils";

// --- Panel & kartu --------------------------------------------------------

/**
 * Panel dasar.
 *
 * Dua tingkat umpan balik yang sengaja dibedakan, karena tampilan harus jujur
 * mencerminkan fungsi:
 *
 *   `sorot`       kartu tampilan di dalam kisi — merespons halus saat disorot
 *                 agar kisi terasa hidup, tanpa mengubah kursor karena memang
 *                 tidak ada yang terjadi bila diklik.
 *   `dapatDiklik` kartu yang benar-benar menuju ke suatu halaman — angkatan
 *                 lebih tegas, tepi menyala, dan kursor berubah.
 *
 * Panel besar berisi tabel atau formulir tidak memakai keduanya: menyalakan
 * satu bagian halaman penuh saat kursor lewat hanya jadi gangguan.
 */
export function Kartu({
  className,
  children,
  sorot,
  dapatDiklik,
  ...rest
}: ComponentProps<"div"> & { sorot?: boolean; dapatDiklik?: boolean }) {
  return (
    <div
      className={cn(
        "kartu",
        sorot && "transition-colors duration-200 hover:border-kendali/60 hover:bg-permukaan-naik",
        dapatDiklik &&
          "cursor-pointer transition-all duration-200 hover:border-aksen/50 hover:shadow-[0_4px_16px_rgba(4,120,87,0.12)]",
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
          <h2 className="text-base font-semibold tracking-tight text-teks">{judul}</h2>
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
        <h1 className="text-2xl font-bold tracking-tight text-teks sm:text-3xl">
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
  utama: "bg-aksen text-di-aksen hover:bg-aksen-lembut shadow-sm",
  kedua: "bg-lapis text-teks hover:bg-lapis-naik border border-kendali/60",
  bahaya: "bg-bahaya text-teks hover:brightness-110",
  hantu: "text-sekunder hover:bg-lapis hover:text-teks",
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
        className ?? "bg-lapis text-sekunder ring-garis"
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

/** Identitas stabil dari teks label, untuk mengaitkan <label> ke kontrolnya. */
function idBidang(label: string) {
  return (
    "bidang-" +
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

const KELAS_KENDALI =
  "w-full min-h-11 rounded-xl border border-kendali/70 bg-permukaan px-3.5 py-2.5 text-sm text-teks outline-none transition-colors duration-200 placeholder:text-samar hover:border-kendali focus-visible:border-aksen disabled:cursor-not-allowed disabled:opacity-50";

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
  /*
    Kaitkan label ke kontrolnya lewat id/htmlFor supaya pembaca layar dan
    bantuan label otomatis (mis. getByLabel) menemukan kontrol yang tepat.
    Id diturunkan dari teks label sehingga tetap stabil antara render server
    dan klien. Bila kontrol sudah membawa id sendiri, id itu dipertahankan.
  */
  const id = idBidang(label);
  const idPetunjuk = petunjuk ? `${id}-petunjuk` : undefined;
  const anak = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: (children as ReactElement<Record<string, unknown>>).props.id ?? id,
        ...(idPetunjuk
          ? {
              "aria-describedby":
                (children as ReactElement<Record<string, unknown>>).props[
                  "aria-describedby"
                ] ?? idPetunjuk,
            }
          : {}),
      })
    : children;

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {anak}
      {petunjuk ? (
        <p id={idPetunjuk} className="mt-1.5 text-xs text-redup">
          {petunjuk}
        </p>
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
    info: "border-info/25 bg-info/10 text-info",
    sukses: "border-sukses/25 bg-sukses/10 text-sukses",
    galat: "border-bahaya/25 bg-bahaya/10 text-bahaya",
    waspada: "border-waspada/25 bg-waspada/10 text-waspada",
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
      <p className="text-sm font-medium text-teks">{judul}</p>
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
    baik: "text-sukses",
    waspada: "text-waspada",
    buruk: "text-bahaya",
  }[nada];

  return (
    <Kartu sorot className="p-5">
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
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-lapis", className)}>
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
      className={cn("border-b border-garis/70 px-4 py-3 align-middle text-sekunder", className)}
      {...rest}
    />
  );
}

export function Tr({ className, ...rest }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors duration-150 hover:bg-permukaan-naik", className)} {...rest} />;
}

/**
 * Baris tabel yang seluruh permukaannya dapat diklik menuju satu tujuan.
 *
 * Dipasangkan dengan `TautanBaris` di salah satu selnya. Tetap satu tautan
 * sungguhan di dalam DOM, jadi pembaca layar mengumumkan satu tujuan, papan
 * ketik tetap dapat menjangkaunya, dan klik kanan "buka di tab baru" tetap
 * bekerja pada teksnya.
 */
export function TrTautan({ className, ...rest }: ComponentProps<"tr">) {
  return (
    <Tr
      className={cn("relative cursor-pointer hover:bg-permukaan-naik", className)}
      {...rest}
    />
  );
}

/**
 * Tautan yang area kliknya direntangkan menutupi seluruh baris induknya.
 *
 * Elemen lain di baris yang juga perlu diklik harus diberi `relative z-10`
 * agar berada di atas rentangan ini.
 */
export function TautanBaris({ className, ...rest }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "font-medium text-teks transition-colors duration-150 hover:text-aksen",
        "after:absolute after:inset-0 after:content-['']",
        className
      )}
      {...rest}
    />
  );
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
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 font-semibold text-white"
      style={{ width: ukuran, height: ukuran, fontSize: ukuran * 0.36 }}
    >
      {huruf || "?"}
    </span>
  );
}
