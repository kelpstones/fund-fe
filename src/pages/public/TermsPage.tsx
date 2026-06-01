import { Link } from "react-router-dom";
import { useLanguage, type Language } from "../../lib/i18n/LanguageProvider";

type TermsSection = {
  id: string;
  title: string;
  body: string[];
};

type TermsCopy = {
  badge: string;
  heroTitle: string;
  heroBody: string;
  updatedAt: string;
  summaryLabel: string;
  summaryBody: string;
  tocTitle: string;
  sections: TermsSection[];
  questionTitle: string;
  questionBody: string;
  contactCta: string;
  privacyCta: string;
  safetyCta: string;
  breadcrumbHome: string;
  breadcrumbCurrent: string;
};

const termsCopy: Record<Language, TermsCopy> = {
  id: {
    badge: "Syarat",
    heroTitle: "Syarat & Ketentuan Layanan",
    heroBody:
      "Dengan menggunakan platform FundRaise, kamu menyetujui syarat dan ketentuan berikut. Harap baca dengan seksama sebelum mendaftar atau menggunakan layanan.",
    updatedAt: "Terakhir diperbarui: Januari 2025",
    summaryLabel: "Ringkasan singkat",
    summaryBody:
      "FundRaise adalah platform fasilitator pendanaan UMKM. Pengguna wajib memberikan data yang akurat. Platform tidak menjamin return investasi dan tidak bertanggung jawab atas kerugian dari keputusan investasi individual.",
    tocTitle: "Daftar Isi",
    sections: [
      {
        id: "definitions",
        title: "Definisi Istilah",
        body: [
          '"Platform" merujuk pada FundRaise, aplikasi web yang mempertemukan UMKM dan investor.',
          '"Pengguna" adalah setiap individu atau badan usaha yang mendaftar dan menggunakan layanan platform.',
          '"UMKM" adalah pelaku usaha mikro, kecil, dan menengah yang terdaftar sebagai pemilik usaha di platform.',
          '"Investor" adalah pengguna yang terdaftar dengan peran investor dan berminat melakukan investasi pada UMKM.',
          '"Pengajuan" adalah proposal pendanaan yang dibuat oleh UMKM dan diajukan untuk ditinjau admin.',
          '"Negosiasi" adalah proses tawar-menawar nominal investasi dan return antara UMKM dan investor melalui platform.',
          '"Invoice" adalah tagihan resmi yang diterbitkan kepada investor sebagai bukti transaksi investasi.',
          '"Profit Sharing" adalah distribusi keuntungan dari laporan penjualan UMKM kepada investor sesuai proporsi investasi.',
        ],
      },
      {
        id: "platform-usage",
        title: "Penggunaan Platform",
        body: [
          "FundRaise adalah platform digital yang mempertemukan UMKM yang membutuhkan pendanaan dengan investor yang mencari peluang investasi.",
          "Pengguna wajib mendaftar dan memberikan informasi yang akurat, lengkap, dan dapat dipertanggungjawabkan.",
          "Platform ini hanya tersedia untuk warga negara Indonesia yang berusia minimal 17 tahun atau badan usaha yang terdaftar secara sah.",
          "Akun tidak boleh dipindahtangankan. Setiap pengguna bertanggung jawab atas seluruh aktivitas yang terjadi di akunnya.",
        ],
      },
      {
        id: "prohibitions",
        title: "Larangan Penggunaan",
        body: [
          "Menggunakan identitas palsu, menyamar sebagai pihak lain, atau mendaftar dengan data yang tidak valid.",
          "Memanipulasi data bisnis, keuangan, atau performa UMKM untuk tujuan penipuan atau memperoleh investasi secara tidak sah.",
          "Membuat lebih dari satu akun untuk menghindari pembatasan platform atau menyiasati proses verifikasi.",
          "Menggunakan platform untuk aktivitas pencucian uang, pendanaan terorisme, atau kegiatan ilegal lainnya.",
          "Menyebarkan konten yang menyesatkan, melanggar hukum, atau mengandung unsur SARA.",
          "Mengakses sistem platform secara tidak sah, melakukan reverse engineering, atau upaya apapun yang merusak infrastruktur.",
        ],
      },
      {
        id: "umkm-terms",
        title: "Ketentuan untuk UMKM",
        body: [
          "UMKM yang mendaftar wajib memberikan data bisnis yang valid, termasuk informasi keuangan, operasional, dan identitas usaha.",
          "Pengajuan pendanaan yang disetujui admin akan ditampilkan di halaman peluang investor. UMKM bertanggung jawab penuh atas keakuratan data yang dicantumkan.",
          "FundRaise tidak menjamin bahwa setiap pengajuan akan mendapat investor. Keputusan investasi sepenuhnya ada di tangan investor.",
          "UMKM wajib melaporkan data penjualan secara berkala (minimal setiap bulan) untuk keperluan perhitungan dan distribusi profit kepada investor.",
          "UMKM yang tidak memenuhi kewajiban pelaporan selama 3 bulan berturut-turut berisiko mendapat penangguhan akses ke fitur pengajuan.",
          "UMKM bertanggung jawab menjaga hubungan baik dengan investor yang telah berinvestasi dan wajib merespons komunikasi melalui platform dalam waktu yang wajar.",
        ],
      },
      {
        id: "investor-terms",
        title: "Ketentuan untuk Investor",
        body: [
          "Investor wajib mengisi preferensi investasi dan menyelesaikan survey sebelum dapat mengakses detail peluang UMKM.",
          "Investasi yang dilakukan melalui platform bersifat berisiko. FundRaise tidak memberikan jaminan return atas investasi apapun.",
          "Semua transaksi investasi dan invoice diproses melalui sistem platform. Investor bertanggung jawab memverifikasi seluruh informasi sebelum menyetujui negosiasi.",
          "Data rekomendasi AI bersifat indikatif berdasarkan algoritma matchmaking dan bukan merupakan saran investasi resmi dari pihak berlisensi.",
          "Investor dilarang memaksa, mengancam, atau menekan UMKM dalam proses negosiasi. Semua kesepakatan harus bersifat sukarela.",
        ],
      },
      {
        id: "financial-terms",
        title: "Ketentuan Keuangan",
        body: [
          "FundRaise bertindak sebagai fasilitator transaksi. Platform tidak memegang, menerima, atau menyalurkan dana secara langsung antara UMKM dan investor.",
          "Seluruh mekanisme pembayaran, termasuk invoice dan distribusi profit, didokumentasikan dalam sistem dan menjadi tanggung jawab langsung masing-masing pihak yang bertransaksi.",
          "FundRaise dapat memungut biaya layanan sesuai kebijakan yang berlaku. Informasi tarif akan disampaikan secara transparan sebelum transaksi dikonfirmasi.",
          "UMKM yang gagal memenuhi kewajiban distribusi profit kepada investor dapat dilaporkan oleh investor dan akan ditindaklanjuti oleh admin platform.",
          "Dalam hal terjadi sengketa keuangan, FundRaise akan menyediakan data transaksi yang tersimpan di sistem sebagai bukti untuk proses mediasi.",
        ],
      },
      {
        id: "platform-responsibility",
        title: "Tanggung Jawab Platform",
        body: [
          "FundRaise berperan sebagai fasilitator yang menyediakan infrastruktur digital untuk mempertemukan UMKM dan investor.",
          "Platform tidak bertindak sebagai pihak dalam transaksi investasi dan tidak bertanggung jawab atas kerugian yang timbul dari keputusan investasi.",
          "FundRaise berhak menangguhkan atau menutup akun yang terbukti melanggar syarat layanan ini.",
          "Kami berhak mengubah ketentuan layanan ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam platform minimal 14 hari sebelum berlaku.",
        ],
      },
      {
        id: "service-termination",
        title: "Penghentian Layanan",
        body: [
          "FundRaise berhak menghentikan layanan sementara untuk keperluan pemeliharaan sistem dengan pemberitahuan minimal 24 jam sebelumnya.",
          "Dalam kondisi force majeure — termasuk bencana alam, kegagalan sistem masif, atau perubahan regulasi pemerintah — FundRaise tidak bertanggung jawab atas keterlambatan atau gangguan layanan.",
          "Jika platform berhenti beroperasi secara permanen, pengguna akan diberikan notifikasi minimal 30 hari sebelumnya melalui email dan pengumuman di platform.",
          "Selama masa transisi sebelum penutupan, pengguna diberikan waktu yang cukup untuk mengekspor data dan menyelesaikan transaksi yang masih berjalan.",
        ],
      },
      {
        id: "dispute-resolution",
        title: "Penyelesaian Sengketa",
        body: [
          "Setiap perselisihan antara sesama pengguna (UMKM dengan investor) diselesaikan terlebih dahulu melalui mediasi yang difasilitasi oleh tim FundRaise.",
          "Jika mediasi tidak menghasilkan kesepakatan dalam waktu 30 hari, perselisihan diselesaikan melalui mekanisme hukum yang berlaku di Republik Indonesia.",
          "Perjanjian ini diatur oleh hukum Republik Indonesia. Pengadilan Negeri yang berwenang adalah pengadilan di wilayah tempat FundRaise berdomisili hukum.",
          "Pengguna tidak dapat menggugat FundRaise secara kolektif atas kerugian yang timbul dari keputusan investasi individual yang dilakukan atas kehendak sendiri.",
        ],
      },
    ],
    questionTitle: "Ada pertanyaan?",
    questionBody:
      "Jika kamu memiliki pertanyaan tentang syarat layanan ini, hubungi tim kami melalui halaman kontak atau email ke",
    contactCta: "Hubungi Kami",
    privacyCta: "Kebijakan Privasi",
    safetyCta: "Keamanan",
    breadcrumbHome: "Beranda",
    breadcrumbCurrent: "Syarat & Ketentuan",
  },
  en: {
    badge: "Terms",
    heroTitle: "Terms & Conditions",
    heroBody:
      "By using the FundRaise platform, you agree to the terms below. Please read them carefully before registering or using the service.",
    updatedAt: "Last updated: January 2025",
    summaryLabel: "Quick summary",
    summaryBody:
      "FundRaise is an UMKM funding facilitation platform. Users must provide accurate data. The platform does not guarantee investment returns and is not responsible for losses from individual investment decisions.",
    tocTitle: "Table of Contents",
    sections: [
      {
        id: "definitions",
        title: "Definitions",
        body: [
          '"Platform" refers to FundRaise, the web application connecting UMKM and investors.',
          '"User" means any individual or business entity that registers and uses the platform services.',
          '"UMKM" means micro, small, and medium enterprises registered as business owners on the platform.',
          '"Investor" means a user registered with the investor role who is interested in investing in UMKM.',
          '"Submission" means a funding proposal created by UMKM and submitted for admin review.',
          '"Negotiation" means the process of discussing investment amounts and returns between UMKM and investors through the platform.',
          '"Invoice" means an official billing document issued to an investor as proof of an investment transaction.',
          '"Profit Sharing" means the distribution of profits from UMKM sales reports to investors proportional to their investment.',
        ],
      },
      {
        id: "platform-usage",
        title: "Platform Usage",
        body: [
          "FundRaise is a digital platform connecting UMKM seeking funding with investors looking for investment opportunities.",
          "Users must register and provide accurate, complete, and accountable information.",
          "This platform is available only to Indonesian citizens aged at least 17 years or legally registered business entities.",
          "Accounts cannot be transferred. Each user is fully responsible for all activity under their account.",
        ],
      },
      {
        id: "prohibitions",
        title: "Prohibited Actions",
        body: [
          "Using a false identity, impersonating others, or registering with invalid data.",
          "Manipulating business, financial, or performance data to commit fraud or obtain investment unlawfully.",
          "Creating more than one account to circumvent platform restrictions or bypass verification processes.",
          "Using the platform for money laundering, terrorism financing, or any other illegal activity.",
          "Spreading misleading content, violating Indonesian law, or posting content containing discriminatory elements.",
          "Accessing platform systems without authorization, reverse engineering, or any attempt to damage infrastructure.",
        ],
      },
      {
        id: "umkm-terms",
        title: "Terms for UMKM",
        body: [
          "Registered UMKM must provide valid business data, including financial, operational, and business identity information.",
          "Funding submissions approved by admin will be displayed on the investor opportunities page. UMKM are fully responsible for the accuracy of the data they provide.",
          "FundRaise does not guarantee that every submission will receive investor funding. Investment decisions are fully up to investors.",
          "UMKM must report sales data periodically (at least monthly) for the purpose of calculating and distributing profit to investors.",
          "UMKM that fail to meet reporting obligations for 3 consecutive months risk suspension of access to submission features.",
          "UMKM are responsible for maintaining good relationships with investors and must respond to platform communications within a reasonable time.",
        ],
      },
      {
        id: "investor-terms",
        title: "Terms for Investors",
        body: [
          "Investors must complete investment preferences and finish the survey before accessing UMKM opportunity details.",
          "Investments made through the platform carry risk. FundRaise does not guarantee returns on any investment.",
          "All investment and invoice transactions are processed through the platform system. Investors are responsible for verifying all information before approving negotiations.",
          "AI recommendation data is indicative, based on a matchmaking algorithm, and does not constitute official investment advice from a licensed party.",
          "Investors may not coerce, threaten, or pressure UMKM during negotiations. All agreements must be made voluntarily.",
        ],
      },
      {
        id: "financial-terms",
        title: "Financial Terms",
        body: [
          "FundRaise acts as a transaction facilitator. The platform does not directly hold, receive, or transfer funds between UMKM and investors.",
          "All payment mechanisms, including invoices and profit distributions, are documented in the system and are the direct responsibility of each transacting party.",
          "FundRaise may charge a service fee in accordance with applicable policies. Fee information will be communicated transparently before a transaction is confirmed.",
          "UMKM that fail to fulfill profit distribution obligations to investors may be reported by investors and will be followed up by the platform admin.",
          "In case of a financial dispute, FundRaise will provide transaction data stored in the system as evidence for mediation.",
        ],
      },
      {
        id: "platform-responsibility",
        title: "Platform Responsibility",
        body: [
          "FundRaise acts as a facilitator providing digital infrastructure to connect UMKM and investors.",
          "The platform is not a direct party in investment transactions and is not responsible for losses resulting from investment decisions.",
          "FundRaise may suspend or close accounts proven to violate these terms of service.",
          "We may update these terms at any time. Significant changes will be communicated by email or in-platform notifications at least 14 days before taking effect.",
        ],
      },
      {
        id: "service-termination",
        title: "Service Termination",
        body: [
          "FundRaise may temporarily suspend services for system maintenance with at least 24 hours prior notice.",
          "In force majeure conditions — including natural disasters, major system failures, or government regulatory changes — FundRaise is not responsible for service delays or disruptions.",
          "If the platform ceases to operate permanently, users will be notified at least 30 days in advance via email and platform announcements.",
          "During the transition period before closure, users will be given sufficient time to export their data and complete any ongoing transactions.",
        ],
      },
      {
        id: "dispute-resolution",
        title: "Dispute Resolution",
        body: [
          "Any dispute between users (UMKM and investors) will first be resolved through mediation facilitated by the FundRaise team.",
          "If mediation fails to reach an agreement within 30 days, the dispute will be resolved through the legal mechanisms applicable in the Republic of Indonesia.",
          "This agreement is governed by Indonesian law. The competent court is the district court in the jurisdiction where FundRaise has its legal domicile.",
          "Users may not bring collective (class action) lawsuits against FundRaise for losses arising from individual investment decisions made of their own volition.",
        ],
      },
    ],
    questionTitle: "Any questions?",
    questionBody:
      "If you have questions about these terms, contact our team via the contact page or email",
    contactCta: "Contact Us",
    privacyCta: "Privacy Policy",
    safetyCta: "Security",
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Terms & Conditions",
  },
};

export function TermsPage() {
  const { language } = useLanguage();
  const copy = termsCopy[language];

  return (
    <main className="bg-white">
      <section className="border-b border-base-300 bg-base-200/55 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <nav className="flex items-center gap-2 text-sm text-neutral/50">
            <Link to="/" className="transition hover:text-primary">{copy.breadcrumbHome}</Link>
            <span>/</span>
            <span className="font-semibold text-neutral/70">{copy.breadcrumbCurrent}</span>
          </nav>
          <span className="inline-flex w-fit rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary/75">
            {copy.badge}
          </span>
          <h1 className="font-display text-4xl font-black leading-tight tracking-normal lg:text-5xl">
            {copy.heroTitle}
          </h1>
          <p className="max-w-4xl text-base leading-7 text-neutral/65">{copy.heroBody}</p>
          <p className="text-sm text-neutral/50">{copy.updatedAt}</p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="rounded-md border border-base-300 bg-base-100 p-5 shadow-sm">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-neutral/50">{copy.tocTitle}</p>
            <ol className="space-y-1.5 text-sm">
              {copy.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-baseline gap-2 text-neutral/70 transition hover:text-primary"
                  >
                    <span className="shrink-0 text-xs font-black text-neutral/40">{index + 1}.</span>
                    <span className="font-semibold">{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="space-y-5">
          <div className="rounded-md border border-base-300 bg-base-100 px-5 py-4 shadow-sm">
            <p className="text-sm leading-6 font-semibold text-neutral/75">
              <strong className="text-neutral">{copy.summaryLabel}:</strong> {copy.summaryBody}
            </p>
          </div>

          {copy.sections.map((section, index) => (
            <section id={section.id} key={section.id} className="scroll-mt-24 rounded-md border border-base-300 bg-base-100 p-6 shadow-sm">
              <h2 className="flex items-baseline gap-3 text-2xl font-black">
                <span className="text-base font-black text-neutral/30">{index + 1}.</span>
                {section.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {section.body.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-6 text-neutral/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className="rounded-md border border-base-300 bg-base-100 p-6 shadow-sm">
            <h3 className="text-lg font-black">{copy.questionTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral/65">
              {copy.questionBody}{" "}
              <a href="mailto:hello@fundraise.id" className="font-semibold text-primary hover:underline">
                hello@fundraise.id
              </a>
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/kontak" className="btn btn-primary btn-sm rounded-md text-white">
                {copy.contactCta}
              </Link>
              <Link to="/privasi" className="btn btn-outline btn-sm rounded-md">
                {copy.privacyCta}
              </Link>
              <Link to="/keamanan" className="btn btn-outline btn-sm rounded-md">
                {copy.safetyCta}
              </Link>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
