"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import { Bidang, Input, Peringatan, Select, Tombol } from "@/components/ui";
import { GENDER_LABEL } from "@/lib/constants";
import { tambahSantri, type Hasil } from "../aksi";

const AWAL: Hasil = {};

function Kirim() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" ukuran="lg" disabled={pending} className="w-full sm:w-auto">
      <UserPlus size={16} />
      {pending ? "Menyimpan..." : "Daftarkan santri"}
    </Tombol>
  );
}

export function FormSantri({
  kelas,
  kamar,
  genderBoleh,
}: {
  kelas: { id: string; nama: string }[];
  kamar: { id: string; nama: string; gedung: string; gender: string }[];
  genderBoleh: string[];
}) {
  const [status, aksi] = useActionState(tambahSantri, AWAL);
  const tahunIni = new Date().getFullYear();

  return (
    <form action={aksi} className="space-y-6">
      {status.galat ? <Peringatan nada="galat">{status.galat}</Peringatan> : null}
      {status.ok ? (
        <Peringatan nada="sukses" judul="Santri terdaftar">
          {status.ok}
        </Peringatan>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang label="Nama lengkap">
          <Input name="nama" placeholder="Nama sesuai dokumen resmi" required />
        </Bidang>
        <Bidang label="Gender">
          <Select name="gender" required defaultValue="">
            <option value="" disabled>
              Pilih gender...
            </option>
            {genderBoleh.map((g) => (
              <option key={g} value={g}>
                {GENDER_LABEL[g] ?? g}
              </option>
            ))}
          </Select>
        </Bidang>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Bidang label="NIM">
          <Input name="nim" placeholder="Nomor induk mahasiswa" required />
        </Bidang>
        <Bidang label="Angkatan">
          <Input
            name="angkatan"
            type="number"
            min={2000}
            max={tahunIni + 1}
            defaultValue={tahunIni}
            required
          />
        </Bidang>
        <Bidang label="Telepon" petunjuk="Boleh dikosongkan">
          <Input name="telepon" placeholder="08..." />
        </Bidang>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Bidang label="Kampus" petunjuk="Kosongkan bila belum diketahui">
          <Input name="kampus" placeholder="mis. POLBAN" />
        </Bidang>
        <Bidang label="Jurusan" petunjuk="Kosongkan bila belum diketahui">
          <Input name="jurusan" placeholder="mis. Teknik Informatika" />
        </Bidang>
        <Bidang label="Asal daerah" petunjuk="Kosongkan bila belum diketahui">
          <Input name="asalDaerah" placeholder="mis. Garut" />
        </Bidang>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang label="Kelas" petunjuk="Dapat ditentukan belakangan">
          <Select name="kelasId" defaultValue="">
            <option value="">Belum ditempatkan</option>
            {kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </Select>
        </Bidang>
        <Bidang label="Kamar" petunjuk="Hanya kamar yang sesuai gender santri">
          <Select name="kamarId" defaultValue="">
            <option value="">Belum ditempatkan</option>
            {kamar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} — {k.gedung} ({GENDER_LABEL[k.gender] ?? k.gender})
              </option>
            ))}
          </Select>
        </Bidang>
      </div>

      <p className="text-xs leading-relaxed text-redup">
        Nama pengguna dibuat otomatis dari nama santri, dan kata sandi sementara
        ditampilkan satu kali setelah tersimpan. Sampaikan keduanya langsung
        kepada santri yang bersangkutan.
      </p>

      <Kirim />
    </form>
  );
}
