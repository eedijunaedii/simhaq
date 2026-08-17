import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  FileCheck2,
  Fingerprint,
  MapPin,
  Phone,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import { LogoTeks } from "@/components/logo";
import { Kartu, TautanTombol } from "@/components/ui";
import { APP, KAMPUS } from "@/lib/constants";

const FITUR = [
  {
    ikon: QrCode,
    judul: "Presensi QR Code dinamis",
    isi: "Musyrif membuka sesi, layar menampilkan QR yang isinya berganti setiap belasan detik. Santri cukup memindai dari ponsel masing-masing.",
  },
  {
    ikon: FileCheck2,
    judul: "Perizinan digital",
    isi: "Pengajuan izin lengkap dengan rentang waktu, alasan, dan lampiran bukti. Alur persetujuan tercatat rapi dan bisa ditelusuri.",
  },
  {
    ikon: CalendarCheck,
    judul: "Izin menutup presensi otomatis",
    isi: "Izin yang disetujui langsung menutup sesi presensi pada rentang waktunya, sehingga tidak lagi terhitung tanpa keterangan.",
  },
  {
    ikon: BarChart3,
    judul: "Rekap otomatis",
    isi: "Persentase kehadiran per santri, per halaqah, dan per kegiatan, lengkap dengan tren mingguan serta unduhan Excel dan PDF.",
  },
  {
    ikon: ShieldCheck,
    judul: "Pengamanan titip absen",
    isi: "QR dinamis, keterikatan satu akun satu perangkat, jendela waktu sesi, dan pembatasan lokasi opsional.",
  },
  {
    ikon: Smartphone,
    judul: "Cukup lewat peramban",
    isi: "Dibangun sebagai Progressive Web App. Tidak perlu memasang aplikasi dari toko aplikasi, kamera ponsel langsung terpakai.",
  },
];

const PENGAMANAN = [
  {
    judul: "QR dinamis",
    isi: "Isi QR memuat penanda sesi, waktu, dan tanda tangan digital yang diperbarui setiap 12 detik. Tangkapan layar kedaluwarsa sebelum sempat dipakai.",
  },
  {
    judul: "Keterikatan perangkat",
    isi: "Satu akun santri terhubung dengan satu perangkat. Bila dua akun memindai dari perangkat yang sama, sistem menolak dan menandainya untuk ditinjau pengurus.",
  },
  {
    judul: "Jendela waktu",
    isi: "Pemindaian hanya diterima selama sesi berstatus terbuka, dan sesi menutup sendiri pada waktu yang ditentukan.",
  },
  {
    judul: "Pembatasan lokasi (opsional)",
    isi: "Pemindaian dapat dibatasi pada radius tertentu dari area pesantren, dan bisa dimatikan per sesi karena akurasi GPS dalam bangunan tidak selalu stabil.",
  },
];

const PENGGUNA = [
  {
    peran: "Santri",
    isi: "Memindai QR untuk presensi, mengajukan izin beserta lampiran bukti, dan melihat rekap kehadiran pribadi.",
  },
  {
    peran: "Musyrif / Musyrifah",
    isi: "Membuka dan menutup sesi presensi, menyetujui atau menolak izin, melakukan presensi manual bila diperlukan, serta melihat rekap santri binaannya.",
  },
  {
    peran: "Admin / Pimpinan",
    isi: "Mengelola data induk santri, kamar, jenis kegiatan dan jadwalnya; melihat dasbor keseluruhan; mengunduh laporan.",
  },
  {
    peran: "Wali santri",
    isi: "Melihat rekap kehadiran anaknya melalui tautan bertoken, tanpa perlu membuat akun.",
  },
];

export default function Beranda() {
  return (
    <div className="min-h-dvh">
      {/* Navigasi */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a1f0d]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <LogoTeks />
          <nav className="hidden items-center gap-7 text-sm text-emerald-100/70 md:flex">
            <a className="transition hover:text-white" href="#fitur">
              Fitur
            </a>
            <a className="transition hover:text-white" href="#pengamanan">
              Pengamanan
            </a>
            <a className="transition hover:text-white" href="#pengguna">
              Pengguna
            </a>
            <a
              className="transition hover:text-white"
              href={APP.situsUtama}
              target="_blank"
              rel="noreferrer"
            >
              Situs Pesantren ↗
            </a>
          </nav>
          <TautanTombol href="/login" ukuran="sm">
            Masuk
            <ArrowRight size={15} />
          </TautanTombol>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="muncul">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
                <ScanLine size={14} />
                Aplikasi internal {APP.lembaga}
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Presensi kegiatan{" "}
                <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                  sekali pindai
                </span>
                , perizinan tanpa kertas.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-emerald-100/70">
                SIMHAQ mencatat kehadiran santri pada kegiatan wajib pesantren melalui
                pemindaian QR Code, sekaligus mengelola pengajuan izin secara digital.
                Keduanya terhubung dalam satu basis data, sehingga izin yang disetujui
                otomatis tercatat pada rekap dan tidak lagi dihitung sebagai
                ketidakhadiran tanpa keterangan.
              </p>

              <p className="mt-4 max-w-xl rounded-xl border-l-2 border-emerald-400/50 bg-white/[0.03] py-2.5 pl-4 text-sm italic leading-relaxed text-emerald-100/60">
                Di pesantren mahasiswa, ketidakhadiran belum tentu pelanggaran. Santri
                yang praktikum sampai malam dan santri yang tidak disiplin sama-sama
                tercatat &ldquo;tidak hadir&rdquo; pada buku absen manual. Sistem ini
                memberi pengurus data untuk membedakan keduanya.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <TautanTombol href="/login" ukuran="lg">
                  Masuk ke sistem
                  <ArrowRight size={16} />
                </TautanTombol>
                <TautanTombol href="#fitur" gaya="kedua" ukuran="lg">
                  Pelajari fitur
                </TautanTombol>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {[
                  { n: "82", l: "Santri aktif" },
                  { n: "7", l: "Dewan guru" },
                  { n: "5", l: "Gedung asrama" },
                  { n: "14", l: "Kampus asal" },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="text-2xl font-bold text-emerald-300">{s.n}</dt>
                    <dd className="text-xs text-emerald-100/50">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Ilustrasi layar QR */}
            <div className="muncul relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-500/10 blur-3xl" />
              <Kartu className="relative overflow-hidden p-6">
                <div className="flex items-center justify-between text-xs text-emerald-100/60">
                  <span>Kajian Ba&apos;da Subuh</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-300">
                    <span className="denyut inline-block size-1.5 rounded-full bg-emerald-400" />
                    Sesi dibuka
                  </span>
                </div>

                <div className="mt-5 grid place-items-center rounded-2xl bg-white p-5">
                  <QrIlustrasi />
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-center text-xs text-emerald-100/50">
                    Kode berganti dalam 8 detik
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    { n: "38", l: "Hadir" },
                    { n: "4", l: "Izin" },
                    { n: "3", l: "Belum" },
                  ].map((x) => (
                    <div key={x.l} className="rounded-xl bg-white/[0.05] py-2.5">
                      <p className="text-lg font-bold text-white">{x.n}</p>
                      <p className="text-[11px] text-emerald-100/50">{x.l}</p>
                    </div>
                  ))}
                </div>
              </Kartu>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section id="fitur" className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Ruang lingkup fitur
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-emerald-100/60">
            Tiga modul utama yang saling terhubung dalam satu basis data.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FITUR.map((f) => (
              <Kartu key={f.judul} className="p-6 transition hover:bg-white/[0.09]">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <f.ikon size={20} />
                </span>
                <h3 className="mt-4 font-semibold text-white">{f.judul}</h3>
                <p className="mt-2 text-sm leading-relaxed text-emerald-100/60">{f.isi}</p>
              </Kartu>
            ))}
          </div>
        </div>
      </section>

      {/* Pengamanan */}
      <section id="pengamanan" className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Fingerprint size={13} />
                Anti titip absen
              </span>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-white">
                QR tempel akan segera difoto lalu disebarkan
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-emerald-100/65">
                Karena itu SIMHAQ tidak memakai QR statis. Sistem menerapkan pengamanan
                berlapis agar catatan kehadiran benar-benar mencerminkan siapa yang
                hadir.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {PENGAMANAN.map((p, i) => (
                <Kartu key={p.judul} className="p-5">
                  <span className="text-xs font-semibold text-emerald-400/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1.5 font-semibold text-white">{p.judul}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-emerald-100/60">
                    {p.isi}
                  </p>
                </Kartu>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pengguna */}
      <section id="pengguna" className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Pengguna dan hak akses
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-emerald-100/60">
            Hak akses dipisahkan berdasarkan gender sesuai kebijakan hijab pesantren:
            pengurus putra hanya dapat mengakses data santri putra, demikian pula
            sebaliknya.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PENGGUNA.map((p) => (
              <Kartu key={p.peran} className="p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <Users size={18} />
                </span>
                <h3 className="mt-4 font-semibold text-white">{p.peran}</h3>
                <p className="mt-2 text-sm leading-relaxed text-emerald-100/60">{p.isi}</p>
              </Kartu>
            ))}
          </div>
        </div>
      </section>

      {/* Kampus */}
      <section className="border-t border-white/5 py-14">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-100/40">
            Santri berasal dari belasan perguruan tinggi di Bandung
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {KAMPUS.map((k) => (
              <span
                key={k}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-emerald-100/70"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Ajakan */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <Kartu className="overflow-hidden">
            <div className="grid gap-8 p-9 sm:p-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Siap dipakai pengurus dan santri
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-emerald-100/65">
                  Masuk memakai akun yang dibuatkan pengurus. Santri cukup membuka
                  tautan dari peramban ponsel — tidak perlu mengunduh aplikasi apa pun.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <TautanTombol href="/login" ukuran="lg">
                    Masuk ke sistem
                    <ArrowRight size={16} />
                  </TautanTombol>
                  <TautanTombol
                    href={APP.situsUtama}
                    target="_blank"
                    gaya="kedua"
                    ukuran="lg"
                  >
                    Kunjungi situs pesantren
                  </TautanTombol>
                </div>
              </div>

              <div className="space-y-3 text-sm text-emerald-100/65">
                <p className="flex items-start gap-2.5">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                  {APP.alamat}
                </p>
                <p className="flex items-start gap-2.5">
                  <Phone size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                  {APP.telepon}
                </p>
                <p className="text-emerald-100/45">{APP.email}</p>
              </div>
            </div>
          </Kartu>
        </div>
      </section>

      {/* Kaki */}
      <footer className="border-t border-white/10 py-9">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <LogoTeks ukuran={30} />
            <p className="mt-2.5 max-w-md text-xs leading-relaxed text-emerald-100/40">
              {APP.namaPanjang} — aplikasi internal {APP.lembagaPanjang}. Terpisah dari
              situs profil pesantren.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-emerald-100/45">
            <Link href="/login" className="transition hover:text-emerald-200">
              Masuk
            </Link>
            <a
              href={APP.situsUtama}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-emerald-200"
            >
              ppmmh.site
            </a>
            <span>&copy; {new Date().getFullYear()} PPM Minhajul Haq</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** QR dekoratif (bukan kode yang bisa dipindai). */
function QrIlustrasi() {
  const pola = [
    "1111111011010001111111",
    "1000001010111001000001",
    "1011101001001101011101",
    "1011101011100101011101",
    "1011101000110101011101",
    "1000001010101001000001",
    "1111111010101011111111",
    "0000000011100000000000",
    "1101101101010110110110",
    "0010110010101101001011",
    "1101011011010010110101",
    "0110100100101101011010",
    "1011011011010010110110",
    "0000000010110101101001",
    "1111111011010110101101",
    "1000001001011010010110",
    "1011101010110101101011",
    "1011101101001011010010",
    "1011101010110100101101",
    "1000001011010011010110",
    "1111111001101010110101",
  ];
  const ukuranSel = 8;
  return (
    <svg
      width={pola[0].length * ukuranSel}
      height={pola.length * ukuranSel}
      viewBox={`0 0 ${pola[0].length * ukuranSel} ${pola.length * ukuranSel}`}
      className="h-auto w-full max-w-[180px]"
      aria-hidden="true"
    >
      {pola.map((baris, y) =>
        baris.split("").map((sel, x) =>
          sel === "1" ? (
            <rect
              key={`${x}-${y}`}
              x={x * ukuranSel}
              y={y * ukuranSel}
              width={ukuranSel}
              height={ukuranSel}
              rx={1.5}
              fill="#064e3b"
            />
          ) : null
        )
      )}
    </svg>
  );
}
