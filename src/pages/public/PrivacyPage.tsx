import { Link } from "react-router-dom";
import { useLanguage, type Language } from "../../lib/i18n/LanguageProvider";

type PrivacySection = {
  id: string;
  title: string;
  body: string[];
};

type PrivacyCopy = {
  badge: string;
  heroTitle: string;
  heroBody: string;
  updatedAt: string;
  commitmentLabel: string;
  commitmentBody: string;
  tocTitle: string;
  sections: PrivacySection[];
  questionTitle: string;
  questionBody: string;
  contactCta: string;
  termsCta: string;
  breadcrumbHome: string;
  breadcrumbCurrent: string;
};

const privacyCopy: Record<Language, PrivacyCopy> = {
  id: {
    badge: "Privasi",
    heroTitle: "Kebijakan Privasi",
    heroBody:
      "Kami menghargai privasi kamu. Halaman ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak-hak kamu sebagai pengguna FundRaise.",
    updatedAt: "Terakhir diperbarui: Januari 2025",
    commitmentLabel: "Komitmen kami",
    commitmentBody:
      "FundRaise tidak menjual data pribadi pengguna. Data hanya digunakan untuk menjalankan layanan platform dan meningkatkan pengalaman pengguna.",
    tocTitle: "Daftar Isi",
    sections: [
      {
        id: "data-collected",
        title: "Data yang Kami Kumpulkan",
        body: [
          "Data identitas: nama lengkap, NIK, email, dan nomor telepon yang diberikan saat registrasi.",
          "Data bisnis (khusus UMKM): informasi perusahaan, performa keuangan, laporan penjualan, dan dokumen pengajuan pendanaan.",
          "Data investasi (khusus Investor): preferensi investasi, riwayat negosiasi, invoice, dan portfolio.",
          "Data teknis: alamat IP, perangkat yang digunakan, log aktivitas, dan informasi browser untuk keperluan keamanan dan analitik.",
        ],
      },
      {
        id: "legal-basis",
        title: "Dasar Hukum Pemrosesan Data",
        body: [
          "Pemrosesan data pribadi di FundRaise dilakukan berdasarkan UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP).",
          "Data diproses atas dasar: (a) persetujuan eksplisit pengguna saat registrasi, (b) pemenuhan kontrak layanan platform, (c) kepentingan sah operasional bisnis, dan (d) kewajiban hukum yang berlaku.",
          "Dengan mendaftar di FundRaise, pengguna memberikan persetujuan atas pemrosesan data sesuai kebijakan ini.",
          "Pengguna berhak mencabut persetujuan kapan saja, dengan konsekuensi bahwa sebagian atau seluruh layanan platform mungkin tidak dapat digunakan.",
        ],
      },
      {
        id: "data-usage",
        title: "Bagaimana Kami Menggunakan Data",
        body: [
          "Menjalankan fitur platform: autentikasi, profil bisnis, matchmaking AI, negosiasi, invoice, dan distribusi profit.",
          "Meningkatkan kualitas rekomendasi AI matchmaking berdasarkan pola data yang telah dianonimkan.",
          "Mengirimkan notifikasi penting terkait akun, status pengajuan, negosiasi aktif, dan invoice.",
          "Memenuhi kewajiban hukum dan regulasi yang berlaku di Indonesia, termasuk kewajiban pelaporan perpajakan.",
        ],
      },
      {
        id: "data-retention",
        title: "Retensi & Penyimpanan Data",
        body: [
          "Data akun aktif disimpan selama akun masih terdaftar dan aktif di platform.",
          "Setelah akun dihapus atas permintaan pengguna, data pribadi akan dihapus dalam waktu maksimal 30 hari kerja.",
          "Data transaksi keuangan (invoice, investasi, profit) dapat disimpan lebih lama sesuai kewajiban hukum perpajakan dan pelaporan keuangan yang berlaku di Indonesia (umumnya 5 tahun).",
          "Data yang telah dianonimkan untuk keperluan analitik dan peningkatan model AI dapat dipertahankan tanpa batas waktu dalam bentuk yang tidak dapat diidentifikasi kembali ke individu.",
        ],
      },
      {
        id: "data-security",
        title: "Keamanan Data",
        body: [
          "Seluruh komunikasi antara browser dan server diamankan menggunakan protokol HTTPS dengan enkripsi TLS.",
          "Password disimpan dalam bentuk hash satu arah (one-way hash) dan tidak dapat diakses oleh siapapun, termasuk tim internal FundRaise.",
          "Akses ke data pengguna di sistem internal dibatasi berdasarkan prinsip least privilege — hanya personel yang membutuhkan akses untuk tujuan operasional.",
          "Kami menerapkan kebijakan incident response untuk penanganan cepat jika terjadi pelanggaran keamanan data, termasuk kewajiban notifikasi kepada pengguna yang terdampak.",
        ],
      },
      {
        id: "cookies",
        title: "Cookie & Penyimpanan Lokal",
        body: [
          'FundRaise menggunakan localStorage browser untuk menyimpan token sesi, preferensi bahasa, dan data form sementara dengan prefix "fundraise_".',
          "Data yang disimpan di browser kamu bersifat lokal dan tidak dikirim ke pihak ketiga untuk tujuan pelacakan atau iklan.",
          "Kamu dapat menghapus data penyimpanan lokal kapan saja melalui pengaturan browser, namun ini akan mengakhiri sesi login yang sedang aktif.",
          "Kami tidak menggunakan cookie pihak ketiga untuk pelacakan lintas situs (cross-site tracking) atau keperluan pemasaran.",
        ],
      },
      {
        id: "cross-border",
        title: "Transfer Data Lintas Batas",
        body: [
          "Data pengguna disimpan di server yang dikelola penyedia layanan cloud. Beberapa layanan infrastruktur mungkin berlokasi di luar Indonesia, seperti di Singapura atau wilayah Asia Pasifik.",
          "Transfer data lintas batas dilakukan dengan perlindungan yang memadai sesuai ketentuan UU PDP, termasuk perjanjian pemrosesan data dengan penyedia layanan cloud.",
          "Kami memastikan bahwa standar perlindungan data yang diterapkan oleh penyedia pihak ketiga setara dengan ketentuan yang berlaku di Indonesia.",
          "Dengan menggunakan platform ini, pengguna menyetujui transfer data ke yurisdiksi lain sebagaimana diperlukan untuk operasional layanan.",
        ],
      },
      {
        id: "third-party",
        title: "Berbagi Data dengan Pihak Ketiga",
        body: [
          "Data UMKM yang relevan (nama bisnis, sektor, performa, target modal) ditampilkan di halaman peluang investor hanya setelah pengajuan disetujui admin.",
          "Kami tidak menjual data pribadi pengguna kepada pihak ketiga untuk tujuan iklan, pemasaran, atau kepentingan komersial apapun.",
          "Data dapat dibagikan kepada pihak berwenang (kepolisian, pengadilan, regulator) jika diwajibkan oleh hukum atau proses hukum yang sah.",
          "Penyedia layanan teknis pihak ketiga yang kami gunakan (cloud, email, analitik) terikat oleh perjanjian pemrosesan data dan wajib menjaga kerahasiaan.",
        ],
      },
      {
        id: "user-rights",
        title: "Hak Pengguna",
        body: [
          "Hak akses: Kamu berhak meminta salinan data pribadi yang kami simpan tentang kamu.",
          "Hak koreksi: Kamu berhak memperbarui atau mengoreksi data pribadi yang tidak akurat melalui halaman profil atau dengan menghubungi kami.",
          "Hak penghapusan: Kamu dapat meminta penghapusan akun dan data dengan mengirim email ke hello@fundraise.id. Permintaan akan diproses dalam maksimal 30 hari kerja.",
          "Hak keberatan: Kamu berhak menolak pemrosesan data untuk tujuan tertentu seperti pemasaran, kapan saja.",
          "Hak portabilitas: Kamu berhak mendapatkan data kamu dalam format yang dapat dibaca mesin untuk dipindahkan ke layanan lain.",
          "Untuk mengajukan permintaan terkait hak-hak di atas, hubungi kami di hello@fundraise.id dengan subjek email \"Permintaan Hak Data Pribadi\".",
        ],
      },
    ],
    questionTitle: "Pertanyaan tentang privasi?",
    questionBody:
      "Jika kamu memiliki pertanyaan atau ingin mengajukan permintaan terkait data pribadi, tim kami siap membantu di",
    contactCta: "Hubungi Kami",
    termsCta: "Syarat Layanan",
    breadcrumbHome: "Beranda",
    breadcrumbCurrent: "Kebijakan Privasi",
  },
  en: {
    badge: "Privacy",
    heroTitle: "Privacy Policy",
    heroBody:
      "We value your privacy. This page explains what data we collect, how we use it, and your rights as a FundRaise user.",
    updatedAt: "Last updated: January 2025",
    commitmentLabel: "Our commitment",
    commitmentBody:
      "FundRaise does not sell personal user data. Data is used only to run platform services and improve user experience.",
    tocTitle: "Table of Contents",
    sections: [
      {
        id: "data-collected",
        title: "Data We Collect",
        body: [
          "Identity data: full name, national ID (NIK), email, and phone number provided during registration.",
          "Business data (UMKM only): company information, financial performance, sales reports, and funding submission documents.",
          "Investment data (Investor only): investment preferences, negotiation history, invoices, and portfolio.",
          "Technical data: IP address, device information, activity logs, and browser details for security and analytics purposes.",
        ],
      },
      {
        id: "legal-basis",
        title: "Legal Basis for Data Processing",
        body: [
          "Personal data processing at FundRaise is conducted in accordance with Law No. 27 of 2022 on Personal Data Protection (UU PDP).",
          "Data is processed on the basis of: (a) explicit user consent at registration, (b) fulfillment of the platform service contract, (c) legitimate business operational interests, and (d) applicable legal obligations.",
          "By registering on FundRaise, users provide consent to data processing in accordance with this policy.",
          "Users may withdraw consent at any time, with the consequence that some or all platform services may not be available.",
        ],
      },
      {
        id: "data-usage",
        title: "How We Use Data",
        body: [
          "To run core platform features: authentication, business profiles, AI matchmaking, negotiations, invoices, and profit distributions.",
          "To improve AI matchmaking recommendation quality based on anonymized data patterns.",
          "To send important notifications related to accounts, submission status, active negotiations, and invoices.",
          "To fulfill legal and regulatory obligations applicable in Indonesia, including tax reporting requirements.",
        ],
      },
      {
        id: "data-retention",
        title: "Data Retention & Storage",
        body: [
          "Active account data is stored for as long as the account remains registered and active on the platform.",
          "After an account is deleted at the user's request, personal data will be deleted within a maximum of 30 business days.",
          "Financial transaction data (invoices, investments, profit) may be retained longer in accordance with applicable Indonesian tax and financial reporting obligations (typically 5 years).",
          "Anonymized data used for analytics and AI model improvement may be retained indefinitely in a form that cannot be re-identified to an individual.",
        ],
      },
      {
        id: "data-security",
        title: "Data Security",
        body: [
          "All communication between browsers and our servers is secured using HTTPS with TLS encryption.",
          "Passwords are stored as one-way hashes and cannot be accessed by anyone, including FundRaise's internal team.",
          "Access to user data in internal systems is restricted on a least-privilege basis — only personnel who need it for operational purposes.",
          "We maintain an incident response policy for rapid handling of data security breaches, including user notification obligations for affected parties.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies & Local Storage",
        body: [
          'FundRaise uses browser localStorage to store session tokens, language preferences, and temporary form data, prefixed with "fundraise_".',
          "Data stored in your browser is local and is not sent to third parties for tracking or advertising purposes.",
          "You may delete local storage data at any time through your browser settings, but this will end your active login session.",
          "We do not use third-party cookies for cross-site tracking or marketing purposes.",
        ],
      },
      {
        id: "cross-border",
        title: "Cross-Border Data Transfer",
        body: [
          "User data is stored on servers managed by cloud service providers. Some infrastructure services may be located outside Indonesia, such as in Singapore or the Asia-Pacific region.",
          "Cross-border data transfers are conducted with adequate protection in accordance with UU PDP requirements, including data processing agreements with cloud providers.",
          "We ensure that data protection standards applied by third-party providers are equivalent to those required in Indonesia.",
          "By using this platform, users consent to data transfer to other jurisdictions as necessary for service operations.",
        ],
      },
      {
        id: "third-party",
        title: "Third-Party Data Sharing",
        body: [
          "Relevant UMKM data (business name, sector, performance, funding target) is shown on investor opportunity pages only after admin approval.",
          "We do not sell personal user data to third parties for advertising, marketing, or any commercial purposes.",
          "Data may be shared with authorities (police, courts, regulators) if required by law or valid legal process.",
          "Third-party technical providers we use (cloud, email, analytics) are bound by data processing agreements and required to maintain confidentiality.",
        ],
      },
      {
        id: "user-rights",
        title: "User Rights",
        body: [
          "Right to access: You may request a copy of the personal data we hold about you.",
          "Right to rectification: You may update or correct inaccurate personal data via your profile page or by contacting us.",
          "Right to erasure: You may request account and data deletion by emailing hello@fundraise.id. Requests will be processed within a maximum of 30 business days.",
          "Right to object: You may object to data processing for specific purposes such as marketing at any time.",
          "Right to portability: You may obtain your data in a machine-readable format for transfer to another service.",
          'To submit a request related to the above rights, contact us at hello@fundraise.id with the subject "Personal Data Rights Request".',
        ],
      },
    ],
    questionTitle: "Questions about privacy?",
    questionBody:
      "If you have questions or want to submit a request related to personal data, our team is ready to help at",
    contactCta: "Contact Us",
    termsCta: "Terms of Service",
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Privacy Policy",
  },
};

export function PrivacyPage() {
  const { language } = useLanguage();
  const copy = privacyCopy[language];

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
              <strong className="text-neutral">{copy.commitmentLabel}:</strong> {copy.commitmentBody}
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
              <Link to="/syarat" className="btn btn-outline btn-sm rounded-md">
                {copy.termsCta}
              </Link>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
