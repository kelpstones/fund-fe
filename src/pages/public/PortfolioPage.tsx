import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, Scale, Search, Store } from "lucide-react";
import { compactCurrency, percent } from "../../lib/format";
import { PhotoPlaceholder } from "../../components/PhotoPlaceholder";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const portfolios = [
  {
    name: "Kopi Nusa Rasa",
    sector: "Food & Beverage",
    city: "Bandung",
    raised: 164000000,
    target: 250000000,
    score: 92,
    returnRate: 18,
    risk: "Moderate",
  },
  {
    name: "Batik Lestari",
    sector: "Fashion",
    city: "Solo",
    raised: 48000000,
    target: 120000000,
    score: 81,
    returnRate: 15,
    risk: "High",
  },
  {
    name: "TaniHub Lokal",
    sector: "Agribusiness",
    city: "Malang",
    raised: 310000000,
    target: 400000000,
    score: 88,
    returnRate: 21,
    risk: "Low",
  },
];

export function PortfolioPage() {
  const { t } = useLanguage();

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl font-black leading-tight tracking-normal">
              {t("portfolioHeroTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral/65">
              {t("portfolioHeroBody")}
            </p>
          </div>
          <Link to="/register" className="btn btn-primary rounded-md text-white">
            {t("portfolioCta")}
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mt-10 grid gap-3 rounded-md border border-base-300 bg-base-200 p-4 md:grid-cols-[1fr_0.75fr_0.75fr]">
          <label className="input input-bordered flex items-center gap-2 rounded-md bg-white">
            <Search size={18} className="text-neutral/40" />
            <input placeholder={t("portfolioSearchPlaceholder")} />
          </label>
          <select className="select select-bordered rounded-md bg-white" defaultValue="all">
            <option value="all">{t("allRisk")}</option>
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
          </select>
          <select className="select select-bordered rounded-md bg-white" defaultValue="all">
            <option value="all">{t("allSectors")}</option>
            <option>Food & Beverage</option>
            <option>Fashion</option>
            <option>Agribusiness</option>
          </select>
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
                  <button className="btn btn-square btn-outline btn-sm rounded-md" aria-label={t("save")}>
                    <Bookmark size={18} />
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-md bg-base-200 p-3">
                    <p className="text-neutral/50">{t("metricReturn")}</p>
                    <p className="font-black">{percent(item.returnRate)}</p>
                  </div>
                  <div className="rounded-md bg-base-200 p-3">
                    <p className="text-neutral/50">{t("metricRisk")}</p>
                    <p className="font-black">{item.risk}</p>
                  </div>
                  <div className="rounded-md bg-base-200 p-3">
                    <p className="text-neutral/50">{t("metricMatch")}</p>
                    <p className="font-black text-secondary">{percent(item.score)}</p>
                  </div>
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
                <div className="mt-6 flex gap-2">
                  <Link to="/register" className="btn btn-primary flex-1 rounded-md text-white">
                    {t("detail")}
                  </Link>
                  <button className="btn btn-outline rounded-md">
                    <Scale size={18} />
                    {t("compare")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-16 rounded-md border border-base-300 bg-neutral p-8 text-white">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-normal">{t("portfolioMarketplaceTitle")}</h2>
              <p className="mt-4 text-sm leading-6 text-white/65">
                {t("portfolioMarketplaceBody")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Save", "Compare", "Negotiate"].map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/10 p-4">
                  <p className="text-xl font-black">{item}</p>
                  <p className="mt-2 text-xs leading-5 text-white/60">{t("investorWorkflow")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

