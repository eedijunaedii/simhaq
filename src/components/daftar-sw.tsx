"use client";

import { useEffect } from "react";

/** Mendaftarkan service worker agar aplikasi berperilaku sebagai PWA. */
export function DaftarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const daftar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };

    if (document.readyState === "complete") daftar();
    else window.addEventListener("load", daftar);

    return () => window.removeEventListener("load", daftar);
  }, []);

  return null;
}
