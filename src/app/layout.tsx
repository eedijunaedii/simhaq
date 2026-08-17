import type { Metadata, Viewport } from "next";
import { DaftarServiceWorker } from "@/components/daftar-sw";
import { APP } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP.nama} — ${APP.namaPanjang}`,
    template: `%s · ${APP.nama}`,
  },
  description: `${APP.namaPanjang} ${APP.lembaga}. Presensi kegiatan berbasis QR Code dinamis dan perizinan santri secara digital.`,
  applicationName: APP.nama,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP.nama,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/ikon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/ikon-192.png" }],
  },
  openGraph: {
    title: `${APP.nama} — ${APP.namaPanjang}`,
    description: `Sistem presensi dan perizinan santri ${APP.lembaga}.`,
    siteName: APP.nama,
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1f0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
        <DaftarServiceWorker />
      </body>
    </html>
  );
}
