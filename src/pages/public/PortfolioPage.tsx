import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, Scale, Search, Store, X } from "lucide-react";
import { compactCurrency, percent } from "../../lib/format";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const portfolios = [
  {
    name: "Kopi Nusa Rasa",
    sectorKey: "portfolioSectorFoodBeverage",
    city: "Bandung",
    raised: 164000000,
    target: 250000000,
    score: 92,
    returnRate: 18,
    risk: "Moderate",
  },
  {
    name: "Batik Lestari",
    sectorKey: "portfolioSectorFashion",
    city: "Solo",
    raised: 48000000,
    target: 120000000,
    score: 81,
    returnRate: 15,
    risk: "High",
  },
  {
    name: "TaniHub Lokal",
    sectorKey: "portfolioSectorAgribusiness",
    city: "Malang",
    raised: 310000000,
    target: 400000000,
    score: 88,
    returnRate: 21,
    risk: "Low",
  },
];

const riskOptions = ["Low", "Moderate", "High"] as const;
const riskLabelKey = (risk: string) => `risk${risk}`;

function BusinessVisual({ name, sector, city }: { name: string; sector: string; city: string }) {
  return (
    <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-md border border-base-300 bg-base-200">
      <div className="absolute inset-0 grid grid-cols-3 gap-3 p-5">
        <div className="rounded-md bg-primary/15" />
        <div className="rounded-md bg-accent/40" />
        <div className="rounded-md bg-secondary/15" />
      </div>
      <div className="absolute inset-x-5 bottom-5 rounded-md border border-base-300 bg-white/90 p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white">
            <Store size={20} />
          </div>
          <div>
            <p className="font-black text-neutral">{name}</p>
            <p className="text-xs font-semibold text-neutral/55">{sector} - {city}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortfolioPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("all");
  const [sector, setSector] = useState("all");
  const [compareItems, setCompareItems] = useState<typeof portfolios>([]);
  const sectors = useMemo(() => Array.from(new Set(portfolios.map((item) => item.sectorKey))), []);
  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return portfolios.filter((item) => {
      const matchSearch = `${item.name} ${t(item.sectorKey)} ${item.city}`.toLowerCase().includes(needle);
      const matchRisk = risk === "all" || item.risk === risk;
      const matchSector = sector === "all" || item.sectorKey === sector;
      return matchSearch && matchRisk && matchSector;
    });
  }, [risk, search, sector, t]);

  const toggleCompare = (item: typeof portfolios[number]) => {
    setCompareItems((current) =>
      current.some((entry) => entry.name === item.name)
        ? current.filter((entry) => entry.name !== item.name)
        : [...current, item].slice(-3),
    );
  };

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
            <input
              className="w-full min-w-0 bg-transparent outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("portfolioSearchPlaceholder")}
            />
          </label>
          <select className="select select-bordered rounded-md bg-white" value={risk} onChange={(event) => setRisk(event.target.value)}>
            <option value="all">{t("allRisk")}</option>
            {riskOptions.map((item) => (
              <option key={item} value={item}>{t(riskLabelKey(item))}</option>
            ))}
          </select>
          <select className="select select-bordered rounded-md bg-white" value={sector} onChange={(event) => setSector(event.target.value)}>
            <option value="all">{t("allSectors")}</option>
            {sectors.map((item) => (
              <option key={item} value={item}>{t(item)}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 rounded-md border border-info/20 bg-info/10 px-4 py-3 text-sm font-semibold text-info">
          {t("portfolioDemoMode")}
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {filtered.map((item) => {
            const progress = Math.min(100, Math.round((item.raised / item.target) * 100));
            const isCompared = compareItems.some((entry) => entry.name === item.name);
            return (
              <article key={item.name} className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
                <BusinessVisual name={item.name} sector={t(item.sectorKey)} city={item.city} />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black">{item.name}</h2>
                    <p className="mt-1 text-sm text-neutral/55">
                      {t(item.sectorKey)} - {item.city}
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
                    <p className="font-black">{t(riskLabelKey(item.risk))}</p>
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
                  <button
                    className={`btn rounded-md ${isCompared ? "btn-secondary text-white" : "btn-outline"}`}
                    onClick={() => toggleCompare(item)}
                  >
                    <Scale size={18} />
                    {t("compare")}
                  </button>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 ? (
            <div className="rounded-md border border-base-300 bg-white p-8 text-center text-sm font-semibold text-neutral/55 lg:col-span-3">
              {t("portfolioEmpty")}
            </div>
          ) : null}
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
              {["portfolioStepSave", "portfolioStepCompare", "portfolioStepNegotiate"].map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/10 p-4">
                  <p className="text-xl font-black">{t(item)}</p>
                  <p className="mt-2 text-xs leading-5 text-white/60">{t("investorWorkflow")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
      {compareItems.length > 0 ? (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl rounded-md">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">{t("portfolioCompareTitle")}</h3>
                <p className="mt-1 text-sm text-neutral/55">{t("portfolioCompareBody")}</p>
              </div>
              <button className="btn btn-square btn-ghost btn-sm" onClick={() => setCompareItems([])}>
                <X size={18} />
              </button>
            </div>
            <div className="overflow-x-auto rounded-md border border-base-300">
              <table className="table">
                <thead>
                  <tr className="bg-base-200 text-xs uppercase tracking-wide text-neutral/60">
                    <th>{t("metric")}</th>
                    {compareItems.map((item) => <th key={item.name}>{item.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    [t("sector"), (item: typeof portfolios[number]) => t(item.sectorKey)],
                    [t("location"), (item: typeof portfolios[number]) => item.city],
                    [t("metricTarget"), (item: typeof portfolios[number]) => compactCurrency(item.target)],
                    [t("funded"), (item: typeof portfolios[number]) => compactCurrency(item.raised)],
                    [t("metricReturn"), (item: typeof portfolios[number]) => percent(item.returnRate)],
                    [t("metricRisk"), (item: typeof portfolios[number]) => t(riskLabelKey(item.risk))],
                    [t("metricMatch"), (item: typeof portfolios[number]) => percent(item.score)],
                  ].map(([label, render]) => (
                    <tr key={String(label)}>
                      <td className="font-black">{String(label)}</td>
                      {compareItems.map((item) => (
                        <td key={`${label}-${item.name}`} className="font-semibold">
                          {(render as (entry: typeof portfolios[number]) => string)(item)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button className="modal-backdrop" onClick={() => setCompareItems([])}>{t("close")}</button>
        </div>
      ) : null}
    </main>
  );
}

