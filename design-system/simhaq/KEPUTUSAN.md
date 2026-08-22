# Keputusan penerapan — SIMHAQ

Dokumen ini mencatat di mana penerapan menyimpang dari `MASTER.md` yang
dihasilkan skill `ui-ux-pro-max`, beserta alasannya. `MASTER.md` dibiarkan
apa adanya sebagai keluaran mentah skill.

## Yang diambil dari rekomendasi

| Aspek | Rekomendasi | Status |
| --- | --- | --- |
| Gaya | Minimalism & Swiss Style | **Diterapkan.** Panel kaca dikurangi, tepi dipertegas, latar ditenangkan agar data jadi elemen paling menonjol. |
| Kerapatan | Density 8/10 (dashboard) | **Diterapkan.** Skala spasi dirapatkan. |
| Gerak | Motion 3/10 (subtle) | **Diterapkan.** Transisi 150–200 ms, tanpa koreografi. |
| Struktur token | primitive → semantic | **Diterapkan.** Warna teks kini token semantik, bukan opasitas berjenjang. |
| Kontras 4.5:1 | Wajib | **Diterapkan dan diukur.** Lihat tabel di bawah. |
| Fokus terlihat | Wajib | **Diterapkan.** Sebelumnya tidak ada sama sekali. |
| prefers-reduced-motion | Wajib | **Diterapkan.** |

## Yang sengaja tidak diambil

**Palet warna.** Skill merekomendasikan `#0F172A` / `#1E293B` (slate gelap) dengan
aksen `#22C55E`. Tidak dipakai. Permintaan awal pesantren menetapkan tema harus
menyesuaikan situs resmi <https://www.ppmmh.site>, yang memakai hijau
`#0a1f0d` / `#064e3b` / `#047857` / `#10b981` / `#34d399`. Struktur token dari
rekomendasi tetap diadopsi; hanya nilainya yang diganti ke hijau jenama, lalu
setiap nilai diverifikasi ulang kontrasnya.

**Tipografi Fira Sans / Fira Code.** Tidak dipakai. Situs pesantren memakai
Inter/Poppins, dan menambah dua keluarga font berarti unduhan tambahan pada
jaringan pesantren yang lemah. Manfaat utama font monospace untuk data —
perataan angka antar baris — diambil lewat `font-variant-numeric: tabular-nums`
tanpa mengganti font.

**Pola "Hero + Features + CTA" / "Real-Time Operations Landing".** Tidak dipakai
untuk halaman dalam aplikasi. Basis data pola pada skill berorientasi halaman
pemasaran (berisi bagian "CTA (Start trial / Contact)"), sedangkan SIMHAQ adalah
alat operasional internal. Struktur halaman tetap mengikuti alur kerja pengurus.
Halaman depan publik memang memakai pola tersebut dan tidak diubah.

## Nilai token dan rasio kontras terukur

Diukur terhadap permukaan kartu `rgb(25,44,28)`, ambang WCAG AA 4.5:1 untuk
teks normal.

| Token | Nilai | Rasio | Status |
| --- | --- | --- | --- |
| `--color-teks` | `#F2F7F3` | 13.61:1 | AAA |
| `--color-sekunder` | `#C6D9C9` | 9.95:1 | AAA |
| `--color-redup` | `#9DB5A2` | 6.72:1 | AA |
| `--color-samar` | `#8AA390` | 5.42:1 | AA |
| `--color-aksen` | `#4ADE80` | 8.46:1 | AAA |
| `--color-kendali` | `#65876E` | 3.68:1 | lolos 1.4.11 (batas kontrol) |

Sebelum perombakan, teks memakai opasitas berjenjang dengan hasil:
`emerald-100/50` 4.39:1, `/45` 3.84:1, `/40` 3.34:1, `/35` 2.89:1, `/30` 2.49:1 —
lima tingkat di bawah ambang, dipakai pada 150 tempat.

## Catatan pemeliharaan

Jangan kembali memakai opasitas untuk meredupkan teks (`text-putih/40` dan
sejenisnya). Pakai `text-sekunder`, `text-redup`, atau `text-samar`. Bila perlu
tingkat baru, hitung dulu rasionya terhadap ketiga permukaan sebelum menambah
token.
