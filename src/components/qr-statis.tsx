"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

/** QR statis untuk kartu izin digital / tautan wali santri. */
export function QrStatis({
  nilai,
  ukuran = 200,
  gelap = "#064e3b",
}: {
  nilai: string;
  ukuran?: number;
  gelap?: string;
}) {
  const kanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!kanvas.current) return;
    QRCode.toCanvas(kanvas.current, nilai, {
      width: ukuran,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: gelap, light: "#ffffff" },
    }).catch(() => undefined);
  }, [nilai, ukuran, gelap]);

  return <canvas ref={kanvas} className="h-auto w-full" style={{ maxWidth: ukuran }} />;
}

/** QR yang isinya URL absolut berdasarkan origin peramban. */
export function QrTautan({
  path,
  ukuran = 200,
}: {
  path: string;
  ukuran?: number;
}) {
  const kanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!kanvas.current) return;
    QRCode.toCanvas(kanvas.current, `${window.location.origin}${path}`, {
      width: ukuran,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#064e3b", light: "#ffffff" },
    }).catch(() => undefined);
  }, [path, ukuran]);

  return <canvas ref={kanvas} className="h-auto w-full" style={{ maxWidth: ukuran }} />;
}
