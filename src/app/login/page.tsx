import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, BarChart3, ClipboardList, QrCode } from "lucide-react";
import { LogoTeks } from "@/components/logo";
import { Kartu } from "@/components/ui";
import { APP, KAMPUS } from "@/lib/constants";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Masuk" };

const AKUN_UJI = [
  { peran: "Admin / Pimpinan", u: "admin", s: "admin123" },
  { peran: "Musyrif putra", u: "hanif", s: "musyrif123" },
  { peran: "Musyrifah putri", u: "aisyah", s: "musyrif123" },
  { peran: "Petugas keamanan", u: "satpam", s: "petugas123" },
];

const FITUR = [
  { ikon: QrCode, isi: "Presensi QR dinamis" },
  { ikon: ClipboardList, isi: "Perizinan digital" },
  { ikon: BarChart3, isi: "Rekap otomatis" },
];

export default async function HalamanLogin(props: {
  searchParams: Promise<{ lanjut?: string }>;
}) {
  const { lanjut } = await props.searchParams;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-5 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-sekunder transition hover:text-teks"
        >
          <ArrowLeft size={16} />
          Kembali
        </Link>
      </header>

      <main id="konten" className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            {/* Secara visual judul halaman diwakili lambang SIMHAQ di bawah,
                tetapi pembaca layar menelusuri halaman lewat tajuk — tanpa h1
                halaman ini tidak punya penanda tingkat teratas sama sekali. */}
            <h1 className="sr-only">Masuk ke SIMHAQ</h1>
            <LogoTeks ukuran={44} />
            <p className="mt-4 text-sm text-redup">
              Masuk dengan akun yang dibuatkan pengurus {APP.lembaga}.
            </p>
          </div>

          <Kartu className="p-7">
            <FormLogin lanjut={lanjut ?? "/dashboard"} />
          </Kartu>

          <Kartu className="mt-5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-redup">
              Akun uji coba
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {AKUN_UJI.map((a) => (
                <li key={a.u} className="flex items-center justify-between gap-3">
                  <span className="text-sekunder">{a.peran}</span>
                  <code className="rounded-lg bg-lapis-naik px-2 py-1 text-xs text-sukses">
                    {a.u} / {a.s}
                  </code>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-samar">
              Akun santri memakai pola <code>namaXXX</code> dengan kata sandi{" "}
              <code>santri123</code>. Daftar lengkap ada pada menu Santri setelah masuk
              sebagai pengurus.
            </p>
          </Kartu>

          <p className="mt-6 text-center text-xs text-samar">
            Lupa kata sandi? Hubungi pengurus di {APP.telepon}
          </p>

          <div className="mt-8 flex items-center justify-center gap-5 text-xs text-redup">
            {FITUR.map((f) => (
              <span key={f.isi} className="inline-flex items-center gap-1.5">
                <f.ikon size={14} className="text-sukses" />
                {f.isi}
              </span>
            ))}
          </div>

          <div className="mt-6 border-t border-garis pt-6">
            <p className="text-center text-[11px] uppercase tracking-widest text-samar">
              Santri {APP.lembaga} berasal dari
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-redup">
              {KAMPUS.map((k) => (
                <span key={k.singkatan}>{k.singkatan}</span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
