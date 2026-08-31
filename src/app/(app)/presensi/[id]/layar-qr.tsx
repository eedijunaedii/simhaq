"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  /** Pengukur lebar yang tersedia untuk QR, tanpa ikut padding kartu putih. */
  const kotak = useRef<HTMLDivElement>(null);
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

  const token = muatan?.token ?? null;

  /**
   * Gambar QR seukuran ruang yang tersedia, dikalikan kerapatan piksel layar.
   *
   * Sebelumnya kanvas selalu digambar 460 px lalu diperkecil oleh CSS; hasilnya
   * tepi modul menjadi buram dan lebih sulit dipindai dari jarak beberapa meter.
   */
  const gambarQr = useCallback(() => {
    const el = kanvas.current;
    const wadah = kotak.current;
    if (!token || !el || !wadah) return;

    const sisi = Math.round(wadah.clientWidth);
    if (sisi <= 0) return;

    const kerapatan = Math.min(window.devicePixelRatio || 1, 3);
    const url = `${window.location.origin}/scan?t=${encodeURIComponent(token)}`;

    QRCode.toCanvas(el, url, {
      width: Math.round(sisi * kerapatan),
      // Satu modul putih di dalam kanvas, sisanya dari padding kartu putih.
      // Gabungan keduanya melampaui zona hening 4 modul yang disarankan.
      margin: 1,
      // Kode tampil di layar bersih dan berumur pendek, jadi koreksi galat
      // paling ringan sudah memadai — modulnya lebih besar dan lebih terbaca.
      errorCorrectionLevel: "L",
      color: { dark: "#064e3b", light: "#ffffff" },
    })
      .then(() => {
        el.style.width = `${sisi}px`;
        el.style.height = `${sisi}px`;
      })
      .catch(() => setGalat("Gagal menggambar kode QR."));
  }, [token]);

  useEffect(() => {
    gambarQr();
  }, [gambarQr, penuh]);

  useEffect(() => {
    window.addEventListener("resize", gambarQr);
    return () => window.removeEventListener("resize", gambarQr);
  }, [gambarQr]);

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
        <p className={cn("font-bold text-teks", penuh ? "text-4xl" : "text-lg")}>
          {namaKegiatan}
        </p>
        <p className={cn("text-redup", penuh ? "mt-2 text-lg" : "text-sm")}>
          {keterangan}
        </p>
      </div>

      {/* Kartu putih: kotak QR ditambah zona hening yang lega di keempat sisi. */}
      <div
        className={cn(
          "relative w-full bg-white shadow-2xl shadow-emerald-950/30",
          penuh
            ? "max-w-[min(64vh,32rem)] rounded-[2rem] p-7"
            : "max-w-[17.5rem] rounded-[1.5rem] p-5"
        )}
      >
        <div ref={kotak} className="w-full">
          <canvas ref={kanvas} className="block h-auto w-full" />
        </div>
        {muatan?.status !== "DIBUKA" && muatan ? (
          <div
            className={cn(
              "absolute inset-0 grid place-items-center bg-[#16241a]/92 text-center",
              penuh ? "rounded-[2rem]" : "rounded-[1.5rem]"
            )}
          >
            <p className="px-6 text-sm font-medium text-white">
              Sesi sudah ditutup. Kode QR tidak berlaku lagi.
            </p>
          </div>
        ) : null}
      </div>

      <div className={cn("w-full", penuh ? "max-w-[min(64vh,32rem)]" : "max-w-[17.5rem]")}>
        <div className="h-2 w-full overflow-hidden rounded-full bg-lapis-naik">
          <div
            className="h-full rounded-full bg-sukses transition-[width] duration-100 ease-linear"
            style={{ width: `${sisaPersen}%` }}
          />
        </div>
        <p
          className={cn(
            "mt-2 text-center text-redup",
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
          penuh ? "max-w-2xl" : "max-w-[17.5rem]"
        )}
      >
        {[
          { l: "Hadir", n: hadir, w: "text-sukses" },
          { l: "Terlambat", n: hitungan.TERLAMBAT ?? 0, w: "text-waspada" },
          { l: "Izin", n: (hitungan.IZIN ?? 0) + (hitungan.SAKIT ?? 0), w: "text-info" },
          { l: "Alfa", n: hitungan.ALFA ?? 0, w: "text-bahaya" },
        ].map((x) => (
          <div key={x.l} className="rounded-xl bg-lapis py-2.5">
            <p className={cn("font-bold", penuh ? "text-3xl" : "text-lg", x.w)}>{x.n}</p>
            <p className={cn("text-redup", penuh ? "text-sm" : "text-[11px]")}>
              {x.l}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  if (penuh) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-dasar p-8">
        <button
          onClick={() => setPenuh(false)}
          className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-xl bg-lapis-naik px-4 py-2 text-sm text-teks transition hover:bg-lapis-naik"
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
