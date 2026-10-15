import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { DaftarServiceWorker } from "@/components/daftar-sw";
import { APP } from "@/lib/constants";
import "./globals.css";

/*
  Tipografi jenama: Inter untuk teks isi, Poppins untuk judul. Dimuat lewat
  next/font sehingga di-self-host (tanpa permintaan eksternal, cocok dengan
  CSP font-src 'self') dan konsisten di semua perangkat.
*/
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

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
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/ikon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1f0d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/*
  Dijalankan sebelum cat pertama supaya tidak ada kedipan tema yang salah:
  preferensi tersimpan menang, kalau belum ada ikuti preferensi sistem.
*/
const SKRIP_TEMA = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem("tema-simhaq");var g=t?t==="gelap":window.matchMedia("(prefers-color-scheme: dark)").matches;if(g)d.dataset.tema="gelap";}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta
          name="strix-verification"
          content="strix-verify-6205d270c586fd041c0a0ec0fcd50402"
        />
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
      </head>
      <body className={`${inter.variable} ${poppins.variable} antialiased`}>
        <a href="#konten" className="skip-link">
          Lewati ke konten
        </a>
        {children}
        <DaftarServiceWorker />
      </body>
    </html>
  );
}
