/*
 * Daftar santri PPM Minhajul Haq.
 *
 * Nama dan kampus berasal dari data resmi pesantren; data pendukung lain
 * (NIM, jurusan, angkatan, asal daerah, kamar, halaqah, dan seluruh riwayat
 * presensi) dibangkitkan di prisma/seed.ts sebagai contoh agar tampilan dan
 * grafik ada isinya.
 *
 * `kampus: null` berarti kolomnya memang kosong pada data sumber — sengaja
 * tidak ditebak supaya tidak ada informasi karangan yang menempel pada nama
 * orang sungguhan.
 */
export type SantriSumber = {
  nama: string;
  kampus: string | null;
};

/** Santri putra (45 orang). */
export const SANTRI_PUTRA: SantriSumber[] = [
  { nama: "Abdillah Mahfudin Al Khayis", kampus: "POLBAN" },
  { nama: "Agustian Rahmat Sesar", kampus: "UPI" },
  { nama: "Ahmad Afif Raihan", kampus: "ULBI" },
  { nama: "Ananda Fityan Syakur", kampus: "UNIKOM" },
  { nama: "Anvito Fitra Maulana", kampus: "POLBAN" },
  { nama: "Arsyada Fariha", kampus: "ITENAS" },
  { nama: "Azka Danendra Hadyan", kampus: "ITB" },
  { nama: "Bilal Farrel Taghsya", kampus: "POLTEKKES" },
  { nama: "Danang Nur Faizal", kampus: "UPI" },
  { nama: "Diandra Tsabit Al-Iman", kampus: "POLBAN" },
  { nama: "Dimas Arif Mabrury", kampus: "UPI" },
  { nama: "Edo Romeo Jiddan Iskandar", kampus: "ENHAI" },
  { nama: "Fajri Rizqi Amanah", kampus: "POLBAN" },
  { nama: "Farrel Nauval Putera Rhamdani", kampus: "POLTEKESOS" },
  { nama: "Fakih Anugerah Pratama", kampus: "ITB" },
  { nama: "Fernandha Bagus Pratama", kampus: "UPI" },
  { nama: "Fuad Zuzinul Fiqih", kampus: "UPI" },
  { nama: "Husen Indarno Syaifullah", kampus: "UPI" },
  { nama: "Ilham Mahardika Arya", kampus: "POLTEKKES" },
  { nama: "Moch Fauzan Adhima", kampus: "UPI" },
  { nama: "Mohamad Fatakhu Roeziq", kampus: "POLBAN" },
  { nama: "Mohamad Ridwan Firdaus", kampus: "ITENAS" },
  { nama: "Muhammad Ahsan Tritya", kampus: "ITB" },
  { nama: "Muhammad Dafa Farhani", kampus: "UT" },
  { nama: "Muhammad Hamzah Arofah", kampus: "POLBAN" },
  { nama: "Muhammad Mizan Habibi", kampus: "POLMAN" },
  { nama: "Muhammad Renaga Shafar Anggara", kampus: "ULBI" },
  { nama: "Muhammad Ridho Alvino Fenderion", kampus: "UNISBA" },
  { nama: "Muhammad Rizky", kampus: null },
  { nama: "Muhammad Rizky Fadillah", kampus: "USB YPKP" },
  { nama: "Nauvenra Farizy", kampus: "ITB" },
  { nama: "Radya Falih Akbar", kampus: "ITENAS" },
  { nama: "Ragil Putra Darmawan", kampus: "ULBI" },
  { nama: "Rasha Atha Marchiano Kurniawan", kampus: "PEP" },
  { nama: "Reza Akbar Ramadhan", kampus: "UNISBA" },
  { nama: "Rian Ahmad Dhani", kampus: "POLBAN" },
  { nama: "Riza Raka Fadhilah", kampus: "POLBAN" },
  { nama: "Rizki Alip Mulyadi", kampus: "UNISBA" },
  { nama: "Roofi Ahmad", kampus: "POLMAN" },
  { nama: "Surya Maulana Tanjung", kampus: "POLBAN" },
  { nama: "Ubaidah Kholilullah Abdul Ghoni", kampus: "ITB" },
  { nama: "Wiragil Arsa Rizkya", kampus: "POLTEKKES" },
  { nama: "Zidan Ardiansyah", kampus: "ULBI" },
  { nama: "Bintang", kampus: "POLBAN" },
  { nama: "Zea", kampus: "UPI" },
];

/** Santri putri (42 orang). */
export const SANTRI_PUTRI: SantriSumber[] = [
  { nama: "Adinda Chila Nuryasmin", kampus: "UPI" },
  { nama: "Aisiah Muqiita", kampus: null },
  { nama: "Aisy AZKA Meriam Cipta Iskan Julia", kampus: null },
  { nama: "Akwa Syakura", kampus: "POLBAN" },
  { nama: "Andrea Azraningrum", kampus: "STTT" },
  { nama: "Ardia Pramesti Regita Cahyani", kampus: null },
  { nama: "Aurelia Octa Andreana", kampus: null },
  { nama: "BELVA Hasanatul Fi'al", kampus: null },
  { nama: "Brillianty Dwi Wandha Putri", kampus: "UPI" },
  { nama: "Cahaya Berlian Lestari", kampus: null },
  { nama: "clarissa kaina rahman", kampus: null },
  { nama: "De'fanie Alifta Putri", kampus: null },
  { nama: "Diandra Nariswari Zahrina", kampus: null },
  { nama: "Dinda Niken Zahra Anandito", kampus: "UPI" },
  { nama: "Edelweiss Mutiara Giri", kampus: "POLTEKKES" },
  { nama: "Fildzah Nafeesa Putri Handoko", kampus: null },
  { nama: "Firyal Dwi Maharani", kampus: "POLTEKESOS" },
  { nama: "Gadis Agnia Herman", kampus: "UPI" },
  { nama: "Ganeda Dimaretha", kampus: "POLBAN" },
  { nama: "Hanifa Nurul Khotami", kampus: "UPI" },
  { nama: "Herviasani Cahya Medina", kampus: "UPI" },
  { nama: "Karina Dwiya Putri", kampus: "STTT" },
  { nama: "Kharisma Nurul Aini", kampus: null },
  { nama: "Lafaz Sains Azizah", kampus: null },
  { nama: "Latania Aulia Khairani", kampus: null },
  { nama: "Levina Izza Naelu Najah", kampus: "STTT" },
  { nama: "Loredana Putri Firdaus", kampus: "UNISBA" },
  { nama: "Maharani Putri", kampus: "UPI" },
  { nama: "Marjani Tsauri Ernanto", kampus: "UPI" },
  { nama: "Nahwa Maulia", kampus: null },
  { nama: "Navila Azka Azzahra", kampus: "POLTEKKES" },
  { nama: "Nayla Zahra Nur Hasanah", kampus: "ITENAS" },
  { nama: "Nina Almas Shofiyah", kampus: "UPI" },
  { nama: "Nur Istiqomah", kampus: "UT" },
  { nama: "Nurhasni Rahmah Febianty", kampus: "UPI" },
  { nama: "Resiva Auliya", kampus: "ITB" },
  { nama: "Salsa Amalia Firda", kampus: null },
  { nama: "Salsabila Choerunnisa Hendarsah", kampus: null },
  { nama: "Sita Avrilliana", kampus: null },
  { nama: "Sitta Al Hila Jannet", kampus: "UPI" },
  { nama: "Utari Kamila Dewi", kampus: "UPI" },
  { nama: "Zahrah Permata Supardi Gito Martana", kampus: null },
];
