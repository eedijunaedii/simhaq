import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sembunyikan header X-Powered-By (fingerprinting server).
  poweredByHeader: false,

  // Driver database dimuat saat runtime dari node_modules, bukan dibundel.
  // Diperlukan karena better-sqlite3 memakai binary native, dan supaya
  // adapter yang tidak dipakai tidak ikut terbawa ke bundel produksi.
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "pg",
    "@prisma/adapter-pg",
  ],

  // Lampiran izin dikirim sebagai data URI melalui Server Action.
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },

  // Header keamanan di semua rute.
  //
  // CSP sengaja memakai 'unsafe-inline' pada script karena Next.js menyisipkan
  // skrip bootstrap inline (payload RSC) dan skrip tema awal; 'unsafe-eval'
  // dicantumkan agar runtime tidak patah. Kendati begitu, CSP ini tetap
  // menutup pemuatan skrip eksternal, objek embbed, clickjacking (frame-ancestors),
  // dan pembajakan form (form-action).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "worker-src 'self' blob:",
              "media-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
          {
            // Paksa HTTPS pada kunjungan berikutnya. Vercel mengirimkannya
            // sendiri untuk domain .vercel.app, tetapi tidak untuk domain
            // khusus seperti presensi.ppmmh.site — jadi disetel di sini.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
