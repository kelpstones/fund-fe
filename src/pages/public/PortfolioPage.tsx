import { ArrowUpRight, Store } from "lucide-react";
import { compactCurrency } from "../../lib/format";
import { PhotoPlaceholder } from "../../components/PhotoPlaceholder";

const portfolios = [
  {
    name: "Kopi Nusa Rasa",
    sector: "Food & Beverage",
    city: "Bandung",
    raised: 164000000,
    target: 250000000,
    score: 92,
  },
  {
    name: "Batik Lestari",
    sector: "Fashion",
    city: "Solo",
    raised: 48000000,
    target: 120000000,
    score: 81,
  },
  {
    name: "TaniHub Lokal",
    sector: "Agribusiness",
    city: "Malang",
    raised: 310000000,
    target: 400000000,
    score: 88,
  },
];

export function PortfolioPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl font-black leading-tight tracking-normal">
              Contoh peluang pendanaan UMKM
            </h1>
          </div>
          <p className="max-w-md text-neutral/65">
            Kartu ini mewakili bentuk ringkasan yang investor lihat pada
            dashboard rekomendasi.
          </p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {portfolios.map((item) => {
            const progress = Math.min(100, Math.round((item.raised / item.target) * 100));
            return (
              <article key={item.name} className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
                <PhotoPlaceholder
                  dense
                  ratio="16:10"
                  title={item.name}
                  caption={`${item.sector} - ${item.city}`}
                  icon={Store}
                  className="mb-5"
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black">{item.name}</h2>
                    <p className="mt-1 text-sm text-neutral/55">
                      {item.sector} - {item.city}
                    </p>
                  </div>
                  <button className="btn btn-square btn-ghost btn-sm" aria-label="Detail">
                    <ArrowUpRight size={18} />
                  </button>
                </div>
                <div className="mt-8">
                  <div className="mb-2 flex justify-between text-sm font-semibold">
                    <span>{compactCurrency(item.raised)}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-base-200">
                    <div className="h-3 rounded-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="mt-6 rounded-md bg-base-200 p-4">
                  <p className="text-3xl font-black text-secondary">{item.score}%</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

