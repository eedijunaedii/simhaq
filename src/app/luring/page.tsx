import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { LogoTeks } from "@/components/logo";
import { Kartu, TautanTombol } from "@/components/ui";

export const metadata: Metadata = { title: "Luring" };

export default function HalamanLuring() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <LogoTeks ukuran={38} />
        </div>
        <Kartu className="p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-500/15 text-amber-300">
            <WifiOff size={28} />
          </span>
          <h1 className="mt-5 text-lg font-semibold text-white">
            Tidak ada koneksi
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-redup">
            Halaman ini belum tersimpan di perangkat. Pemindaian presensi yang Anda
            lakukan saat luring tetap tersimpan dan akan dikirim otomatis setelah
            jaringan pulih.
          </p>
          <TautanTombol href="/dashboard" className="mt-6">
            Coba lagi
          </TautanTombol>
        </Kartu>
      </div>
    </div>
  );
}
