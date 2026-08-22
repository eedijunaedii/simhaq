import { FileQuestion } from "lucide-react";
import { LogoTeks } from "@/components/logo";
import { Kartu, TautanTombol } from "@/components/ui";

export default function TidakDitemukan() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <LogoTeks ukuran={38} />
        </div>
        <Kartu className="p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/10 text-redup">
            <FileQuestion size={28} />
          </span>
          <h1 className="mt-5 text-lg font-semibold text-white">
            Halaman tidak ditemukan
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-redup">
            Tautan yang Anda buka tidak ada atau sudah dipindahkan.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <TautanTombol href="/dashboard">Ke dasbor</TautanTombol>
            <TautanTombol href="/" gaya="kedua">
              Beranda
            </TautanTombol>
          </div>
        </Kartu>
      </div>
    </div>
  );
}
