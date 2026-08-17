import { Shell } from "@/components/shell";
import { wajibLogin } from "@/lib/auth";
import { keluar } from "./aksi";

export default async function LayoutAplikasi({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesi = await wajibLogin();

  return (
    <Shell
      sesi={{
        nama: sesi.nama,
        role: sesi.role,
        gender: sesi.gender,
        username: sesi.username,
      }}
      keluar={keluar}
    >
      {children}
    </Shell>
  );
}
