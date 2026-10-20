"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STATUS_PRESENSI_LABEL } from "@/lib/constants";

/*
  Warna grafik membaca token tema (var(--…)) sehingga ikut berganti saat
  pengguna beralih antara mode terang dan gelap tanpa memuat ulang halaman.
  Palet diatur di globals.css (--graf-*): nada dalam pada mode terang, nada
  terang pada mode gelap — konsisten dan tidak mencolok.
*/
const SUMBU = {
  stroke: "var(--grafik-sumbu)",
  fontSize: 11,
};

const gayaTooltip = {
  contentStyle: {
    background: "var(--tip-latar)",
    border: "1px solid var(--tip-tepi)",
    borderRadius: 12,
    fontSize: 12,
    color: "var(--color-teks)",
    boxShadow: "var(--bayangan-kartu)",
  },
  labelStyle: { color: "var(--color-redup)", marginBottom: 4 },
  itemStyle: { color: "var(--color-teks)" },
};

// --- Tren kehadiran harian ------------------------------------------------

export function GrafikTren({
  data,
  tinggi = 260,
}: {
  data: { tanggal: string; persen: number; hadir: number; total: number }[];
  tinggi?: number;
}) {
  const rapi = data.map((d) => ({
    ...d,
    label: new Date(d.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={tinggi}>
      <AreaChart data={rapi} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradTren" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--graf-area)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--graf-area)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={SUMBU}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={SUMBU}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          {...gayaTooltip}
          formatter={(v) => [`${Number(v)}%`, "Kehadiran"] as [string, string]}
        />
        <Area
          type="monotone"
          dataKey="persen"
          stroke="var(--graf-area)"
          strokeWidth={2}
          fill="url(#gradTren)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// --- Komposisi status -----------------------------------------------------

const WARNA_STATUS: Record<string, string> = {
  HADIR: "var(--graf-hadir)",
  TERLAMBAT: "var(--graf-terlambat)",
  IZIN: "var(--graf-izin)",
  SAKIT: "var(--graf-sakit)",
  ALFA: "var(--graf-alfa)",
};

export function GrafikStatus({
  perStatus,
  tinggi = 240,
}: {
  perStatus: Record<string, number>;
  tinggi?: number;
}) {
  const data = Object.entries(perStatus)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      nama: STATUS_PRESENSI_LABEL[k] ?? k,
      kunci: k,
      nilai: v,
    }));

  if (data.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-samar">
        Belum ada data presensi.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={tinggi}>
      <PieChart>
        <Pie
          data={data}
          dataKey="nilai"
          nameKey="nama"
          innerRadius="58%"
          outerRadius="85%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((d) => (
            <Cell key={d.kunci} fill={WARNA_STATUS[d.kunci] ?? "var(--graf-samar)"} />
          ))}
        </Pie>
        <Tooltip {...gayaTooltip} />
        <Legend
          verticalAlign="bottom"
          height={28}
          formatter={(v) => (
            <span style={{ color: "var(--color-sekunder)", fontSize: 12 }}>{v}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// --- Perbandingan antar kegiatan / kelas --------------------------------

export function GrafikBatang({
  data,
  tinggi = 260,
}: {
  data: { nama: string; persen: number }[];
  tinggi?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={tinggi}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="nama"
          /* Label dimiringkan supaya nama kegiatan yang panjang tidak saling
             menumpuk pada kartu yang sempit. */
          tick={{ ...SUMBU, angle: -32, textAnchor: "end", dy: 6 }}
          tickLine={false}
          axisLine={false}
          interval={0}
          height={72}
          tickMargin={10}
          tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
        />
        <YAxis
          tick={SUMBU}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          {...gayaTooltip}
          formatter={(v) => [`${Number(v)}%`, "Kehadiran"] as [string, string]}
        />
        <Bar dataKey="persen" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.nama}
              fill={
                d.persen >= 90
                  ? "var(--graf-hadir)"
                  : d.persen >= 75
                    ? "var(--graf-limau)"
                    : d.persen >= 60
                      ? "var(--graf-terlambat)"
                      : "var(--graf-alfa)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
