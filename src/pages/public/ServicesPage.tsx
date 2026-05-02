import { BarChart3, FileCheck2, Handshake, LineChart, Receipt, Scale } from "lucide-react";

const services = [
  {
    title: "Profil Bisnis UMKM",
    body: "Data bisnis, kelas, performa tahunan, dan indikator operasional.",
    icon: FileCheck2,
    cardClass: "border-emerald-200 bg-emerald-500 text-white",
    iconClass: "bg-white text-emerald-600",
  },
  {
    title: "Pengajuan Pendanaan",
    body: "Target modal, progress pendanaan, return tahunan, dan approval admin.",
    icon: BarChart3,
    cardClass: "border-blue-200 bg-blue-600 text-white",
    iconClass: "bg-white text-blue-600",
  },
  {
    title: "AI Matchmaking",
    body: "Skor kecocokan investor dan UMKM berdasarkan preferensi dan risiko.",
    icon: Scale,
    cardClass: "border-cyan-200 bg-cyan-500 text-white",
    iconClass: "bg-white text-cyan-600",
  },
  {
    title: "Negosiasi",
    body: "Penawaran nominal, return, catatan, accept, reject, dan riwayat interaksi.",
    icon: Handshake,
    cardClass: "border-amber-200 bg-amber-400 text-neutral",
    iconClass: "bg-white text-amber-600",
  },
  {
    title: "Invoice & Investasi",
    body: "Invoice investor, pembayaran, pencatatan investasi, dan portfolio.",
    icon: Receipt,
    cardClass: "border-rose-200 bg-rose-500 text-white",
    iconClass: "bg-white text-rose-600",
  },
  {
    title: "Distribusi Profit",
    body: "Profit dari laporan penjualan dipantau untuk investor dan admin.",
    icon: LineChart,
    cardClass: "border-lime-200 bg-lime-400 text-neutral",
    iconClass: "bg-white text-lime-700",
  },
];

export function ServicesPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl font-black leading-tight tracking-normal">
              Satu sistem untuk alur pendanaan UMKM
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral/65">
              Semua modul utama MVP disusun untuk mendukung alur dari registrasi,
              profil bisnis, pengajuan, matching, negosiasi, invoice, sampai
              distribusi profit.
            </p>
          </div>
          <div className="aspect-video overflow-hidden rounded-md border border-base-300 bg-base-200 shadow-sm">
            <img
              src="/images/services.png"
              alt="Operasional pendanaan FundRaise"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ title, body, icon: Icon, cardClass, iconClass }) => (
            <div
              key={title}
              className={`flex gap-4 rounded-md border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft sm:p-6 md:block ${cardClass}`}
            >
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-md ${iconClass}`}>
                <Icon size={22} />
              </div>
              <div className="min-w-0 md:mt-5">
                <h2 className="text-lg font-black">{title}</h2>
                <p className="mt-2 text-sm font-medium leading-6 opacity-82 md:mt-3">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
