"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Link2, Save } from "lucide-react";
import { Bidang, Input, Peringatan, Select, Tombol } from "@/components/ui";
import { buatTokenWali, simpanPengaturan, type Hasil } from "./aksi";

const AWAL: Hasil = {};

function Kirim({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending}>
      <Save size={16} />
      {pending ? "Menyimpan..." : label}
    </Tombol>
  );
}

export function FormPengaturan({
  nilai,
}: {
  nilai: Record<string, string | undefined>;
}) {
  const [status, aksi] = useActionState(simpanPengaturan, AWAL);
  const [wajibLokasi, setWajibLokasi] = useState(
    nilai.wajib_lokasi_default === "true"
  );

  return (
    <form action={aksi} className="space-y-5 p-5">
      {status.galat ? <Peringatan nada="galat">{status.galat}</Peringatan> : null}
      {status.ok ? <Peringatan nada="sukses">{status.ok}</Peringatan> : null}

      <Bidang
        label="Ambang kehadiran untuk pembinaan (%)"
        petunjuk="Santri dengan kehadiran di bawah angka ini muncul pada daftar prioritas pembinaan."
      >
        <Input
          type="number"
          name="ambang"
          defaultValue={nilai.ambang_pembinaan ?? "75"}
          min={1}
          max={100}
        />
      </Bidang>

      <div className="rounded-xl border border-garis bg-lapis p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="wajibLokasi"
            checked={wajibLokasi}
            onChange={(e) => setWajibLokasi(e.target.checked)}
            className="mt-0.5 size-4 accent-sukses"
          />
          <span>
            <span className="block text-sm font-medium text-teks">
              Aktifkan pembatasan lokasi secara bawaan
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-redup">
              Musyrif tetap dapat mematikannya per sesi. Akurasi GPS di dalam bangunan
              tidak selalu stabil, jadi disarankan dibiarkan mati.
            </span>
          </span>
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Bidang label="Lintang pesantren">
            <Input name="lat" defaultValue={nilai.lokasi_lat ?? "-6.893056"} />
          </Bidang>
          <Bidang label="Bujur pesantren">
            <Input name="lng" defaultValue={nilai.lokasi_lng ?? "107.590278"} />
          </Bidang>
          <Bidang label="Radius (meter)">
            <Input
              type="number"
              name="radius"
              defaultValue={nilai.radius_meter ?? "150"}
              min={20}
              max={5000}
            />
          </Bidang>
        </div>
      </div>

      <Kirim label="Simpan pengaturan" />
    </form>
  );
}

export function FormTokenWali({
  santri,
}: {
  santri: { id: string; nama: string }[];
}) {
  const [status, aksi] = useActionState(buatTokenWali, AWAL);

  return (
    <form action={aksi} className="space-y-4 p-5">
      {status.galat ? <Peringatan nada="galat">{status.galat}</Peringatan> : null}
      {status.ok ? <Peringatan nada="sukses">{status.ok}</Peringatan> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Bidang label="Santri">
          <Select name="santriId" required>
            <option value="">Pilih santri...</option>
            {santri.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </Select>
        </Bidang>
        <Bidang label="Nama wali">
          <Input name="namaWali" placeholder="Nama orang tua / wali" required />
        </Bidang>
        <Bidang label="Hubungan">
          <Select name="hubungan" defaultValue="Orang tua">
            <option>Orang tua</option>
            <option>Wali</option>
            <option>Kakak</option>
            <option>Kerabat</option>
          </Select>
        </Bidang>
      </div>

      <Tombol type="submit" ukuran="sm">
        <Link2 size={15} />
        Buat tautan wali
      </Tombol>
    </form>
  );
}
