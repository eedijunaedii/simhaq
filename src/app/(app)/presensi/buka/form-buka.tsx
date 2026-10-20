"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { QrCode } from "lucide-react";
import { Bidang, Input, Peringatan, Select, Tombol } from "@/components/ui";
import { GENDER_LABEL, KATEGORI_KEGIATAN_LABEL } from "@/lib/constants";
import { bukaSesi, type Hasil } from "../aksi";

type Kegiatan = {
  id: string;
  nama: string;
  kategori: string;
  gender: string;
  toleransiTerlambatMenit: number;
  jadwal: { hari: number; jamMulai: string; jamSelesai: string; lokasi: string }[];
};

const AWAL: Hasil = {};

function Kirim() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" ukuran="lg" disabled={pending} className="w-full">
      <QrCode size={16} />
      {pending ? "Membuka sesi..." : "Buka sesi presensi"}
    </Tombol>
  );
}

export function FormBukaSesi({
  kegiatan,
  kelas,
  genderTersedia,
  genderBawaan,
  lokasiBawaan,
}: {
  kegiatan: Kegiatan[];
  kelas: { id: string; nama: string; gender: string }[];
  genderTersedia: string[];
  genderBawaan: string;
  lokasiBawaan: { lat: string; lng: string; radius: number };
}) {
  const [status, aksi] = useActionState(bukaSesi, AWAL);
  const [kegiatanId, setKegiatanId] = useState(kegiatan[0]?.id ?? "");
  const [gender, setGender] = useState(genderBawaan);
  const [pakaiLokasi, setPakaiLokasi] = useState(false);

  const terpilih = kegiatan.find((k) => k.id === kegiatanId);
  const hariIni = new Date().getDay();
  const jadwalHariIni = terpilih?.jadwal.find((j) => j.hari === hariIni);

  const kelasTersedia = kelas.filter(
    (h) => gender === "SEMUA" || h.gender === gender
  );

  return (
    <form action={aksi} className="space-y-5">
      {status.galat ? <Peringatan nada="galat">{status.galat}</Peringatan> : null}

      <Bidang
        label="Kegiatan"
        petunjuk={
          jadwalHariIni
            ? `Jadwal hari ini: ${jadwalHariIni.jamMulai}–${jadwalHariIni.jamSelesai} di ${jadwalHariIni.lokasi}`
            : "Kegiatan ini tidak terjadwal hari ini — sesi tetap bisa dibuka sebagai kegiatan insidental."
        }
      >
        <Select
          name="kegiatanId"
          value={kegiatanId}
          onChange={(e) => setKegiatanId(e.target.value)}
          required
        >
          {kegiatan.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama} — {KATEGORI_KEGIATAN_LABEL[k.kategori]}
            </option>
          ))}
        </Select>
      </Bidang>

      <div className="grid gap-5 sm:grid-cols-2">
        <Bidang label="Untuk kelompok">
          <Select
            name="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            {genderTersedia.map((g) => (
              <option key={g} value={g}>
                {GENDER_LABEL[g]}
              </option>
            ))}
          </Select>
        </Bidang>

        <Bidang
          label="Kelas (opsional)"
          petunjuk="Kosongkan bila sesi berlaku untuk seluruh santri."
        >
          <Select name="kelasId" defaultValue="">
            <option value="">Semua kelas</option>
            {kelasTersedia.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nama}
              </option>
            ))}
          </Select>
        </Bidang>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Bidang
          label="Jam mulai kegiatan"
          petunjuk="Dipakai menghitung batas terlambat."
        >
          <Input
            type="time"
            name="jamMulai"
            defaultValue={jadwalHariIni?.jamMulai ?? ""}
          />
        </Bidang>
        <Bidang label="Durasi sesi (menit)">
          <Input type="number" name="durasiMenit" defaultValue={60} min={5} max={480} />
        </Bidang>
        <Bidang
          label="Rotasi QR (detik)"
          petunjuk="Bawaan 40 detik. Makin kecil makin aman dari tangkapan layar, makin besar makin nyaman dipindai."
        >
          <Input type="number" name="rotasiDetik" defaultValue={40} min={5} max={60} />
        </Bidang>
      </div>

      <div className="rounded-xl border border-garis bg-lapis p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="wajibLokasi"
            checked={pakaiLokasi}
            onChange={(e) => setPakaiLokasi(e.target.checked)}
            className="mt-0.5 size-4 accent-sukses"
          />
          <span>
            <span className="block text-sm font-medium text-teks">
              Batasi pemindaian pada radius pesantren
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-redup">
              Akurasi GPS di dalam bangunan tidak selalu stabil, jadi opsi ini dimatikan
              secara bawaan dan dapat diaktifkan per sesi.
            </span>
          </span>
        </label>

        {pakaiLokasi ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Bidang label="Lintang">
              <Input name="lat" defaultValue={lokasiBawaan.lat} />
            </Bidang>
            <Bidang label="Bujur">
              <Input name="lng" defaultValue={lokasiBawaan.lng} />
            </Bidang>
            <Bidang label="Radius (meter)">
              <Input
                type="number"
                name="radiusMeter"
                defaultValue={lokasiBawaan.radius}
                min={20}
                max={2000}
              />
            </Bidang>
          </div>
        ) : null}
      </div>

      <Kirim />
    </form>
  );
}
