import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Lambang resmi PPM Minhajul Haq (diambil dari situs pesantren, dioptimasi
 * ke 512px). Berlatar putih sehingga dibungkus sudut membulat + cincin
 * halus agar rapi di mode terang maupun gelap.
 */
export function Logo({ ukuran = 40, className }: { ukuran?: number; className?: string }) {
  return (
    <Image
      src="/logo-ppm.png"
      alt="Logo PPM Minhajul Haq"
      width={ukuran}
      height={ukuran}
      className={cn(
        "shrink-0 rounded-[22%] bg-white object-contain ring-1 ring-garis",
        className
      )}
      style={{ width: ukuran, height: ukuran }}
      priority={false}
    />
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
        <span className="block text-[15px] font-bold tracking-tight text-teks">
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
