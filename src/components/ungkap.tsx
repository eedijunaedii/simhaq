"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Mengungkap konten saat masuk viewport (fade + geser naik halus).
 *
 * Keadaan tersembunyi/terlihat diatur lewat kelas CSS `.ungkap`; komponen
 * hanya menambah `.ungkap-terlihat` ketika elemen masuk viewport. Pengguna
 * yang menonaktifkan animasi sistem langsung melihat konten lewat aturan
 * `prefers-reduced-motion` pada globals.css, tanpa menunggu JavaScript.
 */
export function Ungkap({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [terlihat, setTerlihat] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const pengamat = new IntersectionObserver(
      (entri) => {
        entri.forEach((e) => {
          if (e.isIntersecting) {
            setTerlihat(true);
            pengamat.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("ungkap", terlihat && "ungkap-terlihat", className)}
    >
      {children}
    </div>
  );
}
