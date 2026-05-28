import { Link } from "react-router-dom";
import { useLanguage, type Language } from "../../lib/i18n/LanguageProvider";

type TermsSection = {
  id: string;
  title: string;
  body: string[];
};

const termsCopy: Record<
  Language,
  {
    heroTitle: string;
    heroBody: string;
    updatedAt: string;
    summary: string;
    sections: TermsSection[];
    questionTitle: string;
    questionBody: string;
    contactCta: string;
    safetyCta: string;
  }
> = {
  id: {
    heroTitle: "Syarat & Ketentuan Layanan",
    heroBody:
      "Dengan menggunakan platform FundRaise, kamu menyetujui syarat dan ketentuan berikut. Harap baca dengan seksama sebelum mendaftar atau menggunakan layanan.",
    updatedAt: "Terakhir diperbarui: Januari 2025",
    summary:
      "Ringkasan singkat: FundRaise adalah platform fasilitator pendanaan UMKM. Pengguna wajib memberikan data yang akurat. Platform tidak menjamin return investasi dan tidak bertanggung jawab atas kerugian dari keputusan investasi individual.",
    sections: [
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
          "Pengajuan pendanaan yang disetujui admin akan ditampilkan di halaman peluang investor. UMKM bertanggung jawab atas keakuratan data yang dicantumkan.",
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
    ],
    questionTitle: "Ada pertanyaan?",
    questionBody:
      "Jika kamu memiliki pertanyaan tentang syarat layanan ini, hubungi tim kami melalui halaman kontak atau email ke",
    contactCta: "Hubungi Kami",
    safetyCta: "Keamanan & Privasi",
  },
  en: {
    heroTitle: "Terms & Conditions",
    heroBody:
      "By using the FundRaise platform, you agree to the terms below. Please read them carefully before registering or using the service.",
    updatedAt: "Last updated: January 2025",
    summary:
      "Quick summary: FundRaise is an UMKM funding facilitation platform. Users must provide accurate data. The platform does not guarantee investment returns and is not responsible for losses from individual investment decisions.",
    sections: [
      {
        id: "usage",
        title: "Platform Usage",
        body: [
          "FundRaise is a digital platform connecting UMKM seeking funding with investors looking for investment opportunities.",
          "Users must register and provide accurate, complete, and accountable information.",
          "This platform is available only to Indonesian citizens aged at least 17 years or legally registered business entities.",
          "Accounts cannot be transferred. Each user is responsible for all activity under their account.",
        ],
      },
      {
        id: "umkm",
        title: "Terms for UMKM",
        body: [
          "Registered UMKM must provide valid business data, including financial, operational, and business identity information.",
          "Funding submissions approved by admin will be displayed on the investor opportunities page. UMKM are responsible for data accuracy.",
          "FundRaise does not guarantee that every submission will receive investor funding. Investment decisions are fully up to investors.",
          "UMKM must report sales data periodically for investor profit distribution.",
        ],
      },
      {
        id: "investor",
        title: "Terms for Investors",
        body: [
          "Investors must complete preferences and survey before accessing detailed UMKM opportunities.",
          "Investments through the platform carry risk. FundRaise does not guarantee returns on any investment.",
          "All investment and invoice transactions are processed through the platform system. Investors are responsible for verification before approving negotiations.",
          "AI recommendation data is indicative only and not official investment advice.",
        ],
      },
      {
        id: "platform",
        title: "Platform Responsibility",
        body: [
          "FundRaise acts as a facilitator providing digital infrastructure to connect UMKM and investors.",
          "The platform is not a direct party in investment transactions and is not responsible for losses resulting from investment decisions.",
          "FundRaise may suspend or close accounts proven to violate terms, spread false information, or misuse the platform.",
          "We may update these terms at any time. Significant changes will be communicated by email or platform notifications.",
        ],
      },
    ],
    questionTitle: "Any questions?",
    questionBody:
      "If you have questions about these terms, contact our team via the contact page or email",
    contactCta: "Contact Us",
    safetyCta: "Security & Privacy",
  },
};

export function TermsPage() {
  const { language } = useLanguage();
  const copy = termsCopy[language];

  return (
    <main className="bg-white">
      <section className="border-b border-base-300 bg-neutral px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mt-6 font-display text-4xl font-black leading-tight tracking-normal lg:text-5xl">
            {copy.heroTitle}
          </h1>
          <p className="mt-5 text-base leading-7 text-white/65">
            {copy.heroBody}
          </p>
          <p className="mt-4 text-sm text-white/45">{copy.updatedAt}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-md border border-info/20 bg-info/10 px-5 py-4">
          <p className="text-sm leading-6 text-info">
            <strong>{language === "id" ? "Ringkasan singkat:" : "Quick summary:"}</strong>{" "}
            {copy.summary}
          </p>
        </div>

        <div className="space-y-10">
          {copy.sections.map(({ id, title, body }) => (
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
          <h3 className="text-lg font-black">{copy.questionTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral/65">
            {copy.questionBody}{" "}
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
              {copy.contactCta}
            </Link>
            <Link to="/keamanan" className="btn btn-outline btn-sm rounded-md">
              {copy.safetyCta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
