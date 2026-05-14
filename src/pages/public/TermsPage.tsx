import { Link } from "react-router-dom";

const sections = [
  {
    id: "penggunaan",
    title: "Penggunaan Platform",
    body: [
      "FundRaise adalah platform digital yang mempertemukan UMKM yang membutuhkan pendanaan dengan investor yang mencari peluang investasi.",
      "Pengguna wajib mendaftar dan memberikan informasi yang akurat, lengkap, dan dapat dipertanggungjawabkan.",
      "Platform ini hanya tersedia untuk warga negara Indonesia yang berusia minimal 17 tahun atau badan usaha yang terdaftar secara sah.",
      "Akun tidak boleh dipindahtangankan. Setiap pengguna bertanggung jawab atas aktivitas yang terjadi di akunnya.",
    ],
  },
  {
    id: "umkm",
    title: "Ketentuan untuk UMKM",
    body: [
      "UMKM yang mendaftar wajib memberikan data bisnis yang valid, termasuk informasi keuangan, operasional, dan identitas usaha.",
      "Pengajuan pendanaan yang disetujui admin akan ditampilkan di marketplace investor. UMKM bertanggung jawab atas keakuratan data yang dicantumkan.",
      "FundRaise tidak menjamin bahwa setiap pengajuan akan mendapat investor. Keputusan investasi sepenuhnya ada di tangan investor.",
      "UMKM wajib melaporkan data penjualan secara berkala untuk keperluan distribusi profit kepada investor.",
    ],
  },
  {
    id: "investor",
    title: "Ketentuan untuk Investor",
    body: [
      "Investor wajib mengisi preferensi dan survey sebelum dapat mengakses detail peluang UMKM.",
      "Investasi yang dilakukan melalui platform bersifat berisiko. FundRaise tidak memberikan jaminan return atas investasi apapun.",
      "Semua transaksi investasi dan invoice diproses melalui sistem platform. Investor bertanggung jawab memverifikasi informasi sebelum menyetujui negosiasi.",
      "Data rekomendasi AI bersifat indikatif dan bukan merupakan saran investasi resmi.",
    ],
  },
  {
    id: "platform",
    title: "Tanggung Jawab Platform",
    body: [
      "FundRaise berperan sebagai fasilitator yang menyediakan infrastruktur digital untuk mempertemukan UMKM dan investor.",
      "Platform tidak bertindak sebagai pihak dalam transaksi investasi dan tidak bertanggung jawab atas kerugian yang timbul dari keputusan investasi.",
      "FundRaise berhak menangguhkan atau menutup akun yang terbukti melanggar syarat layanan, menyebarkan informasi palsu, atau menyalahgunakan platform.",
      "Kami berhak mengubah ketentuan layanan ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam platform.",
    ],
  },
];

export function TermsPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-base-300 bg-neutral px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mt-6 font-display text-4xl font-black leading-tight tracking-normal lg:text-5xl">
            Syarat & Ketentuan Layanan
          </h1>
          <p className="mt-5 text-base leading-7 text-white/65">
            Dengan menggunakan platform FundRaise, kamu menyetujui syarat dan
            ketentuan berikut. Harap baca dengan seksama sebelum mendaftar atau
            menggunakan layanan.
          </p>
          <p className="mt-4 text-sm text-white/45">
            Terakhir diperbarui: Januari 2025
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-md border border-info/20 bg-info/10 px-5 py-4">
          <p className="text-sm leading-6 text-info">
            <strong>Ringkasan singkat:</strong> FundRaise adalah platform
            fasilitator pendanaan UMKM. Pengguna wajib memberikan data yang
            akurat. Platform tidak menjamin return investasi dan tidak
            bertanggung jawab atas kerugian dari keputusan investasi individual.
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
          <h3 className="text-lg font-black">Ada pertanyaan?</h3>
          <p className="mt-2 text-sm leading-6 text-neutral/65">
            Jika kamu memiliki pertanyaan tentang syarat layanan ini, hubungi
            tim kami melalui halaman kontak atau email ke{" "}
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
            <Link to="/keamanan" className="btn btn-outline btn-sm rounded-md">
              Keamanan & Privasi
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
