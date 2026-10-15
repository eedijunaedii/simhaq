/*
 * Service worker SIMHAQ.
 *
 * Tujuannya sederhana: aplikasi tetap terbuka saat jaringan pesantren lemah,
 * dan aset statis tidak diunduh ulang terus-menerus. Data presensi TIDAK
 * di-cache — antrean luring ditangani di sisi halaman (localStorage).
 */

const VERSI = "simhaq-v2";
const ASET = ["/luring", "/ikon-192.png", "/ikon-512.png", "/favicon-32.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSI)
      .then((cache) => cache.addAll(ASET))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((kunci) =>
        Promise.all(kunci.filter((k) => k !== VERSI).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Hanya tangani GET dari origin sendiri.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Jangan pernah menyimpan hasil API atau server action.
  if (url.pathname.startsWith("/api/")) return;

  // Aset build Next.js: cache-first (nama berkas sudah ber-hash).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (tersimpan) =>
          tersimpan ||
          fetch(request).then((res) => {
            const salinan = res.clone();
            caches.open(VERSI).then((c) => c.put(request, salinan));
            return res;
          })
      )
    );
    return;
  }

  // Navigasi halaman: network-first dengan cadangan halaman luring.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((tersimpan) => tersimpan || caches.match("/luring"))
      )
    );
  }
});
