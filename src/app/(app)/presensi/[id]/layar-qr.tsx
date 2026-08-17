"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { Kartu, Tombol } from "@/components/ui";
import { cn } from "@/lib/utils";

type Muatan = {
  status: string;
  token: string | null;
  sisaMs?: number;
  rotasiDetik?: number;
  waktuTutup?: string;
  hitungan?: Record<string, number>;
};

/**
 * Layar QR dinamis untuk ditampilkan di depan kelas/masjid.
 * Token diambil ulang dari server tepat sebelum masa berlakunya habis.
 */
export function LayarQr({
  sesiId,
  namaKegiatan,
  keterangan,
}: {
  sesiId: string;
  namaKegiatan: string;
  keterangan: string;
}) {
  const kanvas = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const [muatan, setMuatan] = useState<Muatan | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sisaPersen, setSisaPersen] = useState(100);
  const [penuh, setPenuh] = useState(false);

  // Ambil token, lalu jadwalkan pengambilan berikutnya.
  useEffect(() => {
    let batal = false;
    let timer: ReturnType<typeof setTimeout>;

    async function ambil() {
      try {
        const res = await fetch(`/api/sesi/${sesiId}/token`, { cache: "no-store" });
        if (!res.ok) throw new Error("Gagal mengambil kode.");
        const data: Muatan = await res.json();
        if (batal) return;

        setMuatan(data);
        setGalat(null);

        if (data.status !== "DIBUKA") {
          router.refresh();
          return;
        }
        timer = setTimeout(ambil, Math.max(1000, data.sisaMs ?? 5000));
      } catch {
        if (batal) return;
        setGalat("Koneksi terputus. Mencoba lagi...");
        timer = setTimeout(ambil, 3000);
      }
    }

    ambil();
    return () => {
      batal = true;
      clearTimeout(timer);
    };
  }, [sesiId, router]);

  // Gambar QR setiap token berganti.
  useEffect(() => {
    if (!muatan?.token || !kanvas.current) return;
    const url = `${window.location.origin}/scan?t=${encodeURIComponent(muatan.token)}`;
    QRCode.toCanvas(kanvas.current, url, {
      width: 460,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#064e3b", light: "#ffffff" },
    }).catch(() => setGalat("Gagal menggambar kode QR."));
  }, [muatan?.token]);

  // Bilah hitung mundur.
  useEffect(() => {
    if (!muatan?.sisaMs || !muatan.rotasiDetik) return;
    const total = muatan.rotasiDetik * 1000;
    const mulai = Date.now();
    const awal = muatan.sisaMs;

    const iv = setInterval(() => {
      const sisa = Math.max(0, awal - (Date.now() - mulai));
      setSisaPersen((sisa / total) * 100);
    }, 100);
    return () => clearInterval(iv);
  }, [muatan?.sisaMs, muatan?.rotasiDetik, muatan?.token]);

  const hitungan = muatan?.hitungan ?? {};
  const hadir = (hitungan.HADIR ?? 0) + (hitungan.TERLAMBAT ?? 0);

  const isi = (
    <div className={cn("flex flex-col items-center", penuh ? "gap-6" : "gap-4")}>
      <div className="text-center">
        <p className={cn("font-bold text-white", penuh ? "text-4xl" : "text-lg")}>
          {namaKegiatan}
        </p>
        <p className={cn("text-emerald-100/55", penuh ? "mt-2 text-lg" : "text-sm")}>
          {keterangan}
        </p>
      </div>

      <div
        className={cn(
          "relative rounded-3xl bg-white p-5 shadow-2xl shadow-emerald-900/40",
          penuh ? "p-8" : "p-5"
        )}
      >
        <canvas
          ref={kanvas}
          className={cn("h-auto", penuh ? "w-[min(70vh,34rem)]" : "w-full max-w-[18rem]")}
        />
        {muatan?.status !== "DIBUKA" && muatan ? (
          <div className="absolute inset-0 grid place-items-center rounded-3xl bg-[#0a1f0d]/92 text-center">
            <p className="px-6 text-sm font-medium text-white">
              Sesi sudah ditutup. Kode QR tidak berlaku lagi.
            </p>
          </div>
        ) : null}
      </div>

      <div className={cn("w-full", penuh ? "max-w-xl" : "max-w-[18rem]")}>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-400 transition-[width] duration-100 ease-linear"
            style={{ width: `${sisaPersen}%` }}
          />
        </div>
        <p
          className={cn(
            "mt-2 text-center text-emerald-100/50",
            penuh ? "text-base" : "text-xs"
          )}
        >
          {galat
            ? galat
            : `Kode berganti otomatis setiap ${muatan?.rotasiDetik ?? 40} detik`}
        </p>
      </div>

      <div
        className={cn(
          "grid w-full grid-cols-4 gap-2 text-center",
          penuh ? "max-w-2xl" : "max-w-[20rem]"
        )}
      >
        {[
          { l: "Hadir", n: hadir, w: "text-emerald-300" },
          { l: "Terlambat", n: hitungan.TERLAMBAT ?? 0, w: "text-amber-300" },
          { l: "Izin", n: (hitungan.IZIN ?? 0) + (hitungan.SAKIT ?? 0), w: "text-sky-300" },
          { l: "Alfa", n: hitungan.ALFA ?? 0, w: "text-rose-300" },
        ].map((x) => (
          <div key={x.l} className="rounded-xl bg-white/[0.06] py-2.5">
            <p className={cn("font-bold", penuh ? "text-3xl" : "text-lg", x.w)}>{x.n}</p>
            <p className={cn("text-emerald-100/45", penuh ? "text-sm" : "text-[11px]")}>
              {x.l}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  if (penuh) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-[#0a1f0d] p-8">
        <button
          onClick={() => setPenuh(false)}
          className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
        >
          <Minimize2 size={16} />
          Keluar layar penuh
        </button>
        {isi}
      </div>
    );
  }

  return (
    <Kartu className="p-6">
      {isi}
      <div className="mt-5 flex justify-center gap-2">
        <Tombol gaya="kedua" ukuran="sm" onClick={() => setPenuh(true)}>
          <Maximize2 size={15} />
          Layar penuh
        </Tombol>
        <Tombol gaya="hantu" ukuran="sm" onClick={() => router.refresh()}>
          <RefreshCw size={15} />
          Segarkan daftar
        </Tombol>
      </div>
    </Kartu>
  );
}
