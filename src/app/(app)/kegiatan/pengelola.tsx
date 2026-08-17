"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarPlus, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Bidang,
  Input,
  Kartu,
  KepalaKartu,
  Lencana,
  Peringatan,
  Select,
  Textarea,
  Tombol,
} from "@/components/ui";
import {
  GENDER_LABEL,
  HARI,
  KATEGORI_KEGIATAN_LABEL,
} from "@/lib/constants";
import { hapusJadwal, hapusKegiatan, simpanKegiatan, tambahJadwal, type Hasil } from "./aksi";

export type KegiatanRow = {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  gender: string;
  deskripsi: string | null;
  toleransiTerlambatMenit: number;
  aktif: boolean;
  pengampuId: string | null;
  pengampu: { user: { nama: string } } | null;
  jadwal: {
    id: string;
    hari: number;
    jamMulai: string;
    jamSelesai: string;
    lokasi: string;
  }[];
  _count: { sesi: number };
};

const AWAL: Hasil = {};

function TombolSimpan({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" disabled={pending}>
      <Check size={16} />
      {pending ? "Menyimpan..." : label}
    </Tombol>
  );
}

export function PengelolaKegiatan({
  kegiatan,
  pengajar,
}: {
  kegiatan: KegiatanRow[];
  pengajar: { id: string; nama: string }[];
}) {
  const [sunting, setSunting] = useState<KegiatanRow | null>(null);
  const [formBaru, setFormBaru] = useState(false);
  const [jadwalUntuk, setJadwalUntuk] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {!formBaru && !sunting ? (
        <Tombol onClick={() => setFormBaru(true)}>
          <Plus size={16} />
          Tambah kegiatan
        </Tombol>
      ) : null}

      {formBaru || sunting ? (
        <Kartu>
          <KepalaKartu
            judul={sunting ? `Ubah: ${sunting.nama}` : "Kegiatan baru"}
            aksi={
              <Tombol
                gaya="hantu"
                ukuran="sm"
                onClick={() => {
                  setFormBaru(false);
                  setSunting(null);
                }}
              >
                <X size={15} />
                Tutup
              </Tombol>
            }
          />
          <FormKegiatan
            awal={sunting}
            pengajar={pengajar}
            selesai={() => {
              setFormBaru(false);
              setSunting(null);
            }}
          />
        </Kartu>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {kegiatan.map((k) => (
          <Kartu key={k.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-white">{k.nama}</h3>
                  {!k.aktif ? (
                    <Lencana className="bg-white/10 text-emerald-100/50 ring-white/15">
                      Nonaktif
                    </Lencana>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-emerald-100/45">
                  {k.kode} · {KATEGORI_KEGIATAN_LABEL[k.kategori]} ·{" "}
                  {GENDER_LABEL[k.gender]}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => {
                    setSunting(k);
                    setFormBaru(false);
                  }}
                  className="rounded-lg p-2 text-emerald-100/50 transition hover:bg-white/10 hover:text-white"
                  aria-label="Ubah kegiatan"
                >
                  <Pencil size={15} />
                </button>
                <form action={hapusKegiatan.bind(null, k.id)}>
                  <button
                    type="submit"
                    className="rounded-lg p-2 text-rose-300/60 transition hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label="Hapus kegiatan"
                    title={
                      k._count.sesi > 0
                        ? "Kegiatan sudah punya riwayat presensi — akan dinonaktifkan, bukan dihapus."
                        : "Hapus kegiatan"
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            </div>

            <div className="flex-1 px-5 py-4">
              {k.deskripsi ? (
                <p className="text-sm leading-relaxed text-emerald-100/60">
                  {k.deskripsi}
                </p>
              ) : null}
              <p className="mt-2.5 text-xs text-emerald-100/40">
                Toleransi terlambat {k.toleransiTerlambatMenit} menit
                {k.pengampu ? ` · pengampu ${k.pengampu.user.nama}` : ""} ·{" "}
                {k._count.sesi} sesi tercatat
              </p>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-100/40">
                  Jadwal
                </p>
                {k.jadwal.length === 0 ? (
                  <p className="text-sm text-emerald-100/40">Belum ada jadwal rutin.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {[...k.jadwal]
                      .sort((a, b) => a.hari - b.hari)
                      .map((j) => (
                        <li
                          key={j.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-2 text-sm"
                        >
                          <span className="min-w-0">
                            <span className="text-emerald-50/90">{HARI[j.hari]}</span>
                            <span className="ml-2 text-emerald-100/55">
                              {j.jamMulai}–{j.jamSelesai}
                            </span>
                            <span className="block truncate text-xs text-emerald-100/35">
                              {j.lokasi}
                            </span>
                          </span>
                          <form action={hapusJadwal.bind(null, j.id)}>
                            <button
                              type="submit"
                              className="shrink-0 rounded p-1 text-rose-300/50 transition hover:text-rose-300"
                              aria-label="Hapus jadwal"
                            >
                              <Trash2 size={13} />
                            </button>
                          </form>
                        </li>
                      ))}
                  </ul>
                )}

                {jadwalUntuk === k.id ? (
                  <FormJadwal
                    kegiatanId={k.id}
                    selesai={() => setJadwalUntuk(null)}
                  />
                ) : (
                  <button
                    onClick={() => setJadwalUntuk(k.id)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-300 transition hover:text-emerald-200"
                  >
                    <CalendarPlus size={13} />
                    Tambah jadwal
                  </button>
                )}
              </div>
            </div>
          </Kartu>
        ))}
      </div>
    </div>
  );
}

function FormKegiatan({
  awal,
  pengajar,
  selesai,
}: {
  awal: KegiatanRow | null;
  pengajar: { id: string; nama: string }[];
  selesai: () => void;
}) {
  const [status, aksi] = useActionState(async (s: Hasil, d: FormData) => {
    const r = await simpanKegiatan(s, d);
    if (r.ok) selesai();
    return r;
  }, AWAL);

  return (
    <form action={aksi} className="space-y-5 p-5">
      {status.galat ? <Peringatan nada="galat">{status.galat}</Peringatan> : null}
      {awal ? <input type="hidden" name="id" value={awal.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-3">
        <Bidang label="Kode" petunjuk="Huruf kapital, mis. SUBUH">
          <Input name="kode" defaultValue={awal?.kode ?? ""} required maxLength={20} />
        </Bidang>
        <Bidang label="Nama kegiatan" className="sm:col-span-2">
          <Input name="nama" defaultValue={awal?.nama ?? ""} required />
        </Bidang>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Bidang label="Kategori">
          <Select name="kategori" defaultValue={awal?.kategori ?? "HARIAN"}>
            {Object.entries(KATEGORI_KEGIATAN_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Bidang>
        <Bidang label="Untuk kelompok">
          <Select name="gender" defaultValue={awal?.gender ?? "SEMUA"}>
            <option value="SEMUA">Putra &amp; Putri</option>
            <option value="PUTRA">Putra</option>
            <option value="PUTRI">Putri</option>
          </Select>
        </Bidang>
        <Bidang label="Toleransi terlambat (menit)">
          <Input
            type="number"
            name="toleransi"
            defaultValue={awal?.toleransiTerlambatMenit ?? 10}
            min={0}
            max={120}
          />
        </Bidang>
      </div>

      <Bidang label="Pengampu (opsional)">
        <Select name="pengampuId" defaultValue={awal?.pengampuId ?? ""}>
          <option value="">Tidak ditentukan</option>
          {pengajar.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Select>
      </Bidang>

      <Bidang label="Deskripsi">
        <Textarea name="deskripsi" rows={3} defaultValue={awal?.deskripsi ?? ""} />
      </Bidang>

      <label className="flex items-center gap-2.5 text-sm text-emerald-50/90">
        <input
          type="checkbox"
          name="aktif"
          defaultChecked={awal?.aktif ?? true}
          className="size-4 accent-emerald-500"
        />
        Kegiatan aktif dan dapat dibuka sesinya
      </label>

      <div className="flex gap-3">
        <TombolSimpan label={awal ? "Simpan perubahan" : "Tambah kegiatan"} />
        <Tombol type="button" gaya="kedua" onClick={selesai}>
          Batal
        </Tombol>
      </div>
    </form>
  );
}

function FormJadwal({
  kegiatanId,
  selesai,
}: {
  kegiatanId: string;
  selesai: () => void;
}) {
  const [status, aksi] = useActionState(async (s: Hasil, d: FormData) => {
    const r = await tambahJadwal(s, d);
    if (r.ok) selesai();
    return r;
  }, AWAL);

  return (
    <form action={aksi} className="mt-3 space-y-3 rounded-xl bg-white/[0.04] p-3.5">
      {status.galat ? <Peringatan nada="galat">{status.galat}</Peringatan> : null}
      <input type="hidden" name="kegiatanId" value={kegiatanId} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Select name="hari" defaultValue="1" className="py-2 text-xs">
          {HARI.map((h, i) => (
            <option key={h} value={i}>
              {h}
            </option>
          ))}
        </Select>
        <Input type="time" name="jamMulai" defaultValue="05:00" className="py-2 text-xs" />
        <Input
          type="time"
          name="jamSelesai"
          defaultValue="06:00"
          className="py-2 text-xs"
        />
      </div>
      <Input name="lokasi" placeholder="Lokasi kegiatan" className="py-2 text-xs" required />

      <div className="flex gap-2">
        <Tombol type="submit" ukuran="sm">
          Simpan jadwal
        </Tombol>
        <Tombol type="button" gaya="hantu" ukuran="sm" onClick={selesai}>
          Batal
        </Tombol>
      </div>
    </form>
  );
}
