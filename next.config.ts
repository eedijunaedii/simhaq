import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
