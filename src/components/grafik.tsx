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

const SUMBU = {
  stroke: "rgba(209,250,229,0.35)",
  fontSize: 11,
};

const gayaTooltip = {
  contentStyle: {
    background: "#0c2412",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 12,
    fontSize: 12,
    color: "#f8fafc",
  },
  labelStyle: { color: "rgba(209,250,229,0.6)", marginBottom: 4 },
  itemStyle: { color: "#f8fafc" },
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
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
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
          stroke="#34d399"
          strokeWidth={2}
          fill="url(#gradTren)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// --- Komposisi status -----------------------------------------------------

const WARNA_STATUS: Record<string, string> = {
  HADIR: "#34d399",
  TERLAMBAT: "#fbbf24",
  IZIN: "#38bdf8",
  SAKIT: "#a78bfa",
  ALFA: "#fb7185",
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
            <Cell key={d.kunci} fill={WARNA_STATUS[d.kunci] ?? "#64748b"} />
          ))}
        </Pie>
        <Tooltip {...gayaTooltip} />
        <Legend
          verticalAlign="bottom"
          height={28}
          formatter={(v) => (
            <span style={{ color: "rgba(209,250,229,0.7)", fontSize: 12 }}>{v}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// --- Perbandingan antar kegiatan / halaqah --------------------------------

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
          tick={SUMBU}
          tickLine={false}
          axisLine={false}
          interval={0}
          tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)}
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
                  ? "#34d399"
                  : d.persen >= 75
                    ? "#a3e635"
                    : d.persen >= 60
                      ? "#fbbf24"
                      : "#fb7185"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
