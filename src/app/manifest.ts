import type { MetadataRoute } from "next";
import { APP } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP.nama} — ${APP.namaPanjang}`,
    short_name: APP.nama,
    description: `Presensi kegiatan berbasis QR Code dinamis dan perizinan digital santri ${APP.lembaga}.`,
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1f0d",
    theme_color: "#0a1f0d",
    lang: "id",
    dir: "ltr",
    categories: ["education", "productivity"],
    icons: [
      { src: "/ikon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/ikon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/ikon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Pindai QR", short_name: "Pindai", url: "/scan" },
      { name: "Ajukan izin", short_name: "Izin", url: "/izin/baru" },
      { name: "Sesi presensi", short_name: "Sesi", url: "/presensi" },
    ],
  };
}
