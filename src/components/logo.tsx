import { cn } from "@/lib/utils";

/**
 * Lambang SIMHAQ: modul QR bergaya di dalam bingkai mihrab, memakai gradasi
 * hijau yang sama dengan situs resmi pesantren.
 */
export function Logo({ ukuran = 40, className }: { ukuran?: number; className?: string }) {
  return (
    <svg
      width={ukuran}
      height={ukuran}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="simhaq-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="55%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Bingkai mihrab */}
      <path
        d="M24 2c9 0 16 6.4 16 14.6V38a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V16.6C8 8.4 15 2 24 2Z"
        fill="url(#simhaq-grad)"
        opacity="0.16"
      />
      <path
        d="M24 2c9 0 16 6.4 16 14.6V38a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V16.6C8 8.4 15 2 24 2Z"
        stroke="url(#simhaq-grad)"
        strokeWidth="2"
      />

      {/* Modul QR */}
      <g fill="url(#simhaq-grad)">
        <rect x="14" y="14" width="7" height="7" rx="1.6" />
        <rect x="27" y="14" width="7" height="7" rx="1.6" />
        <rect x="14" y="27" width="7" height="7" rx="1.6" />
        <rect x="27" y="27" width="3" height="3" rx="0.8" />
        <rect x="31" y="31" width="3" height="3" rx="0.8" />
      </g>
      <g fill="#0a1f0d">
        <rect x="16.4" y="16.4" width="2.2" height="2.2" rx="0.6" />
        <rect x="29.4" y="16.4" width="2.2" height="2.2" rx="0.6" />
        <rect x="16.4" y="29.4" width="2.2" height="2.2" rx="0.6" />
      </g>
    </svg>
  );
}

export function LogoTeks({
  ukuran = 36,
  ringkas = false,
}: {
  ukuran?: number;
  ringkas?: boolean;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo ukuran={ukuran} />
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-tight text-white">
          SIMHAQ
        </span>
        {!ringkas ? (
          <span className="block text-[11px] text-redup">
            Presensi &amp; Perizinan Santri
          </span>
        ) : null}
      </span>
    </span>
  );
}
