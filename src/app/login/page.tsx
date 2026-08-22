import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { LogoTeks } from "@/components/logo";
import { Kartu } from "@/components/ui";
import { APP } from "@/lib/constants";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Masuk" };

const AKUN_UJI = [
  { peran: "Admin / Pimpinan", u: "admin", s: "admin123" },
  { peran: "Musyrif putra", u: "hanif", s: "musyrif123" },
  { peran: "Musyrifah putri", u: "aisyah", s: "musyrif123" },
  { peran: "Petugas keamanan", u: "satpam", s: "petugas123" },
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
          className="inline-flex items-center gap-2 text-sm text-sekunder transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Kembali
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
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
                  <code className="rounded-lg bg-white/10 px-2 py-1 text-xs text-emerald-200">
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
        </div>
      </main>
    </div>
  );
}
