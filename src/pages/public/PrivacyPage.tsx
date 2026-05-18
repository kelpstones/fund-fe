import { Link } from "react-router-dom";

const sections = [
  {
    id: "data-dikumpulkan",
    title: "Data yang Kami Kumpulkan",
    body: [
      "Data identitas: nama lengkap, NIK, email, dan nomor telepon yang diberikan saat registrasi.",
      "Data bisnis (khusus UMKM): informasi perusahaan, performa keuangan, laporan penjualan, dan dokumen pengajuan pendanaan.",
      "Data investasi (khusus Investor): preferensi investasi, riwayat negosiasi, invoice, dan portfolio.",
      "Data teknis: alamat IP, perangkat yang digunakan, log aktivitas, dan informasi browser untuk keperluan keamanan dan analitik.",
    ],
  },
  {
    id: "penggunaan-data",
    title: "Bagaimana Kami Menggunakan Data",
    body: [
      "Menjalankan fitur platform: autentikasi, profil bisnis, matchmaking AI, negosiasi, invoice, dan distribusi profit.",
      "Meningkatkan kualitas rekomendasi AI matchmaking berdasarkan pola data yang dianonimkan.",
      "Mengirimkan notifikasi penting terkait akun, pengajuan, negosiasi, dan invoice.",
      "Memenuhi kewajiban hukum dan regulasi yang berlaku di Indonesia.",
    ],
  },
  {
    id: "keamanan-data",
    title: "Keamanan Data",
    body: [
      "Data disimpan di server yang dilindungi dengan enkripsi standar industri.",
      "Password disimpan dalam bentuk hash dan tidak dapat diakses oleh siapapun termasuk tim internal.",
      "Akses ke data pengguna dibatasi hanya untuk personel yang membutuhkan akses untuk tujuan operasional.",
      "Kami secara rutin melakukan audit keamanan dan pembaruan sistem untuk mencegah kebocoran data.",
    ],
  },
  {
    id: "berbagi-data",
    title: "Berbagi Data dengan Pihak Ketiga",
    body: [
      "Data UMKM yang relevan (nama bisnis, sektor, performa, target modal) ditampilkan di halaman peluang investor hanya setelah pengajuan disetujui admin.",
      "Kami tidak menjual data pribadi pengguna kepada pihak ketiga untuk tujuan iklan atau komersial.",
      "Data dapat dibagikan kepada pihak berwenang jika diwajibkan oleh hukum atau proses hukum yang sah.",
      "Penyedia layanan teknis pihak ketiga (cloud, email) yang kami gunakan terikat oleh perjanjian kerahasiaan.",
    ],
  },
  {
    id: "hak-pengguna",
    title: "Hak Pengguna",
    body: [
      "Kamu berhak mengakses, memperbarui, atau mengoreksi data pribadi yang tersimpan di platform.",
      "Kamu dapat meminta penghapusan akun dan data dengan menghubungi tim support kami.",
      "Kamu berhak menarik persetujuan atas penggunaan data untuk tujuan pemasaran kapan saja.",
      "Untuk pertanyaan atau permintaan terkait data pribadi, hubungi kami di hello@fundraise.id.",
    ],
  },
];

export function PrivacyPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-base-300 bg-neutral px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mt-6 font-display text-4xl font-black leading-tight tracking-normal lg:text-5xl">
            Kebijakan Privasi
          </h1>
          <p className="mt-5 text-base leading-7 text-white/65">
            Kami menghargai privasi kamu. Halaman ini menjelaskan data apa yang
            kami kumpulkan, bagaimana kami menggunakannya, dan hak-hak kamu
            sebagai pengguna FundRaise.
          </p>
          <p className="mt-4 text-sm text-white/45">
            Terakhir diperbarui: Januari 2025
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-md border border-success/20 bg-success/10 px-5 py-4">
          <p className="text-sm leading-6 font-semibold text-neutral/70">
            <strong className="text-neutral">Komitmen kami:</strong> FundRaise
            tidak menjual data pribadi pengguna. Data hanya digunakan untuk
            menjalankan layanan platform dan meningkatkan pengalaman pengguna.
          </p>
        </div>

        <div className="space-y-10">
          {sections.map(({ id, title, body }) => (
            <div key={id} id={id} className="scroll-mt-24">
              <h2 className="text-2xl font-black">{title}</h2>
              <ul className="mt-5 space-y-3">
                {body.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm leading-6 text-neutral/70"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-md border border-base-300 bg-base-200 p-6">
          <h3 className="text-lg font-black">Pertanyaan tentang privasi?</h3>
          <p className="mt-2 text-sm leading-6 text-neutral/65">
            Jika kamu memiliki pertanyaan atau ingin mengajukan permintaan
            terkait data pribadi, tim kami siap membantu di{" "}
            <a
              href="mailto:hello@fundraise.id"
              className="font-semibold text-primary hover:underline"
            >
              hello@fundraise.id
            </a>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/kontak"
              className="btn btn-primary btn-sm rounded-md text-white"
            >
              Hubungi Kami
            </Link>
            <Link to="/syarat" className="btn btn-outline btn-sm rounded-md">
              Syarat Layanan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
