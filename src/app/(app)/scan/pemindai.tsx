"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CameraOff,
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
  ScanLine,
  WifiOff,
  XCircle,
} from "lucide-react";
import { Kartu, Peringatan, Tombol } from "@/components/ui";
import { pindaiQr, type HasilPindai } from "../presensi/aksi";

const KUNCI_PERANGKAT = "simhaq.perangkat";
const KUNCI_ANTREAN = "simhaq.antrean-presensi";

/** Id perangkat yang bertahan di peramban, dipakai untuk keterikatan perangkat. */
function idPerangkat() {
  let id = localStorage.getItem(KUNCI_PERANGKAT);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    localStorage.setItem(KUNCI_PERANGKAT, id);
  }
  return id;
}

type Antrean = { token: string; deviceId: string; lat?: number; lng?: number; pada: number };

function bacaAntrean(): Antrean[] {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_ANTREAN) ?? "[]");
  } catch {
    return [];
  }
}

function tulisAntrean(a: Antrean[]) {
  localStorage.setItem(KUNCI_ANTREAN, JSON.stringify(a));
}

let ctxAudio: AudioContext | null = null;

/**
 * Umpan balik saat pemindaian berhasil: getar halus (Android) dan nada
 * singkat konfirmasi (Web Audio). Keduanya opsional — tidak gagal bila
 * peramban memblokir audio atau getar.
 */
function beriFeedbackBerhasil() {
  try {
    navigator.vibrate?.(60);
  } catch {
    /* getar tidak tersedia */
  }
  try {
    if (!ctxAudio) ctxAudio = new AudioContext();
    const ctx = ctxAudio;
    if (ctx.state === "suspended") void ctx.resume();
    const osilator = ctx.createOscillator();
    const penguat = ctx.createGain();
    osilator.type = "sine";
    osilator.frequency.setValueAtTime(880, ctx.currentTime);
    penguat.gain.setValueAtTime(0.0001, ctx.currentTime);
    penguat.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.012);
    penguat.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osilator.connect(penguat);
    penguat.connect(ctx.destination);
    osilator.start();
    osilator.stop(ctx.currentTime + 0.22);
  } catch {
    /* audio tidak tersedia */
  }
}

export function Pemindai({ tokenAwal }: { tokenAwal?: string }) {
  const router = useRouter();
  const wadah = useRef<HTMLDivElement>(null);
  const pemindaiRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(
    null
  );
  const sedangProses = useRef(false);

  const [fase, setFase] = useState<"siap" | "memindai" | "memproses" | "hasil">("siap");
  const [hasil, setHasil] = useState<HasilPindai | null>(null);
  const [galatKamera, setGalatKamera] = useState<string | null>(null);
  const [luring, setLuring] = useState(false);
  const [antre, setAntre] = useState(0);

  // --- Pengiriman ---------------------------------------------------------

  const kirim = useCallback(
    async (token: string) => {
      if (sedangProses.current) return;
      sedangProses.current = true;
      setFase("memproses");

      const deviceId = idPerangkat();
      let lat: number | undefined;
      let lng: number | undefined;

      // Lokasi diambil bila tersedia; sesi yang tidak mewajibkannya tetap jalan.
      try {
        const posisi = await new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            () => resolve(null),
            { timeout: 4000, maximumAge: 30000 }
          );
        });
        if (posisi) {
          lat = posisi.coords.latitude;
          lng = posisi.coords.longitude;
        }
      } catch {
        /* lokasi tidak wajib */
      }

      try {
        const r = await pindaiQr({ token, deviceId, lat, lng });
        setHasil(r);
        setFase("hasil");
        if (r.status === "sukses") {
          beriFeedbackBerhasil();
          router.refresh();
        }
      } catch {
        // Jaringan bermasalah: simpan untuk disinkronkan setelah pulih.
        const antrean = bacaAntrean();
        antrean.push({ token, deviceId, lat, lng, pada: Date.now() });
        tulisAntrean(antrean);
        setAntre(antrean.length);
        setHasil({
          status: "gagal",
          pesan: "Jaringan bermasalah.",
          detail:
            "Pemindaian disimpan di perangkat dan akan dikirim otomatis setelah jaringan pulih.",
        });
        setFase("hasil");
      } finally {
        sedangProses.current = false;
      }
    },
    [router]
  );

  // --- Sinkronisasi antrean ----------------------------------------------

  const sinkron = useCallback(async () => {
    const antrean = bacaAntrean();
    if (antrean.length === 0) return;
    const sisa: Antrean[] = [];
    for (const a of antrean) {
      try {
        await pindaiQr({ token: a.token, deviceId: a.deviceId, lat: a.lat, lng: a.lng });
      } catch {
        sisa.push(a);
      }
    }
    tulisAntrean(sisa);
    setAntre(sisa.length);
    if (sisa.length < antrean.length) router.refresh();
  }, [router]);

  useEffect(() => {
    const daring = () => {
      setLuring(false);
      void sinkron();
    };
    const putus = () => setLuring(true);

    window.addEventListener("online", daring);
    window.addEventListener("offline", putus);

    // Nilai awal dibaca setelah render pertama karena localStorage dan
    // navigator.onLine hanya tersedia di peramban.
    const awal = setTimeout(() => {
      setAntre(bacaAntrean().length);
      setLuring(!navigator.onLine);
      if (navigator.onLine) void sinkron();
    }, 0);

    return () => {
      clearTimeout(awal);
      window.removeEventListener("online", daring);
      window.removeEventListener("offline", putus);
    };
  }, [sinkron]);

  // --- Token dari tautan langsung (dibuka lewat aplikasi kamera) ----------

  useEffect(() => {
    if (tokenAwal) void kirim(tokenAwal);
  }, [tokenAwal, kirim]);

  // --- Kamera -------------------------------------------------------------

  const mulaiKamera = useCallback(async () => {
    setGalatKamera(null);
    setHasil(null);
    setFase("memindai");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const el = wadah.current;
      if (!el) return;
      el.id = el.id || "pemindai-qr";

      const pemindai = new Html5Qrcode(el.id, { verbose: false });
      pemindaiRef.current = pemindai as unknown as {
        stop: () => Promise<void>;
        clear: () => void;
      };

      await pemindai.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        async (teks) => {
          const token = ambilToken(teks);
          if (!token || sedangProses.current) return;
          try {
            await pemindai.stop();
            pemindai.clear();
          } catch {
            /* abaikan */
          }
          pemindaiRef.current = null;
          await kirim(token);
        },
        () => {
          /* kegagalan pembacaan per frame diabaikan */
        }
      );
    } catch (e) {
      setFase("siap");
      setGalatKamera(
        e instanceof Error && /permission|denied|notallowed/i.test(e.message)
          ? "Izin kamera ditolak. Aktifkan izin kamera pada peramban lalu coba lagi."
          : "Kamera tidak dapat diakses. Pastikan halaman dibuka melalui HTTPS dan tidak ada aplikasi lain yang memakai kamera."
      );
    }
  }, [kirim]);

  useEffect(() => {
    return () => {
      const p = pemindaiRef.current;
      if (p) {
        p.stop()
          .then(() => p.clear())
          .catch(() => undefined);
      }
    };
  }, []);

  // Kode berganti hanyalah jeda, bukan kegagalan: nyalakan kamera lagi sendiri
  // supaya santri cukup mengarahkan ponsel tanpa menekan tombol apa pun.
  useEffect(() => {
    if (fase !== "hasil" || hasil?.status !== "berganti") return;
    const jeda = setTimeout(() => void mulaiKamera(), 1400);
    return () => clearTimeout(jeda);
  }, [fase, hasil?.status, mulaiKamera]);

  function ulangi() {
    setHasil(null);
    setFase("siap");
  }

  // --- Tampilan -----------------------------------------------------------

  if (fase === "hasil" && hasil) {
    const sukses = hasil.status === "sukses";
    const berganti = hasil.status === "berganti";

    const gayaIkon = sukses
      ? "bg-sukses/15 text-sukses"
      : berganti
        ? "bg-waspada/15 text-waspada"
        : "bg-bahaya/15 text-bahaya";

    return (
      <Kartu className="p-8 text-center">
        <span className={`mx-auto grid size-16 place-items-center rounded-full ${gayaIkon}`}>
          {sukses ? (
            <CheckCircle2 size={34} />
          ) : berganti ? (
            <RefreshCw size={32} className="animate-spin [animation-duration:2.4s]" />
          ) : (
            <XCircle size={34} />
          )}
        </span>
        <p className="mt-5 text-lg font-semibold text-teks">{hasil.pesan}</p>
        {hasil.kegiatan ? (
          <p className="mt-1 text-sm text-sekunder">{hasil.kegiatan}</p>
        ) : null}
        {hasil.detail ? (
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-redup">
            {hasil.detail}
          </p>
        ) : null}

        {berganti ? (
          <p className="mt-5 text-sm text-sukses">Menyalakan kamera kembali...</p>
        ) : (
          <div className="mt-7 flex justify-center gap-3">
            <Tombol onClick={ulangi} gaya={sukses ? "kedua" : "utama"}>
              <RotateCcw size={16} />
              Pindai lagi
            </Tombol>
          </div>
        )}
      </Kartu>
    );
  }

  return (
    <div className="space-y-4">
      {luring ? (
        <Peringatan nada="waspada" judul="Sedang luring">
          Pemindaian tetap bisa dilakukan. Hasilnya disimpan di perangkat dan dikirim
          otomatis setelah jaringan pulih.
        </Peringatan>
      ) : null}

      {antre > 0 ? (
        <Peringatan nada="info">
          {antre} pemindaian menunggu dikirim.{" "}
          <button onClick={() => void sinkron()} className="tautan-halus">
            Kirim sekarang
          </button>
        </Peringatan>
      ) : null}

      {galatKamera ? <Peringatan nada="galat">{galatKamera}</Peringatan> : null}

      <Kartu className="overflow-hidden">
        <div className="relative aspect-square w-full bg-black/40">
          <div ref={wadah} id="pemindai-qr" className="size-full [&_video]:object-cover" />

          {fase === "siap" ? (
            <div className="absolute inset-0 grid place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-sukses/15 text-sukses">
                  <ScanLine size={30} />
                </span>
                <p className="mt-4 font-medium text-teks">Siap memindai</p>
                <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-redup">
                  Arahkan kamera ke layar QR yang ditampilkan pembina. Kode berganti
                  setiap 40 detik, jadi pindai langsung dari layarnya.
                </p>
                <Tombol onClick={mulaiKamera} className="mt-5">
                  <ScanLine size={16} />
                  Nyalakan kamera
                </Tombol>
              </div>
            </div>
          ) : null}

          {fase === "memproses" ? (
            <div className="absolute inset-0 grid place-items-center bg-dasar/85">
              <div className="text-center">
                <Loader2 size={32} className="mx-auto animate-spin text-sukses" />
                <p className="mt-3 text-sm text-sekunder">Memeriksa kode...</p>
              </div>
            </div>
          ) : null}

          {fase === "memindai" ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="size-56 rounded-3xl border-2 border-sukses/70 shadow-[0_0_0_9999px_rgba(10,31,13,0.45)]" />
            </div>
          ) : null}
        </div>
      </Kartu>

      {fase === "memindai" ? (
        <p className="flex items-center justify-center gap-2 text-center text-sm text-redup">
          <ScanLine size={15} className="text-sukses" />
          Mencari kode QR...
        </p>
      ) : null}

      {galatKamera ? (
        <p className="flex items-center justify-center gap-2 text-center text-xs text-samar">
          <CameraOff size={14} />
          Bila kamera tetap tidak bisa dipakai, mintalah pembina mencatat kehadiran Anda
          secara manual.
        </p>
      ) : null}

      {luring ? (
        <p className="flex items-center justify-center gap-2 text-xs text-waspada/60">
          <WifiOff size={14} />
          Mode luring aktif
        </p>
      ) : null}
    </div>
  );
}

/** Isi QR berupa URL /scan?t=... — ambil bagian tokennya saja. */
function ambilToken(teks: string) {
  const t = teks.trim();
  try {
    const url = new URL(t);
    const dariQuery = url.searchParams.get("t");
    if (dariQuery) return dariQuery;
  } catch {
    /* bukan URL, anggap token mentah */
  }
  return /^[\w-]+\.\d+\.[0-9a-f]+$/i.test(t) ? t : null;
}
