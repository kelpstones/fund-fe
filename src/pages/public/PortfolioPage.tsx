import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { compactCurrency } from "../../lib/format";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useScrollReveal } from "../../lib/ui/useScrollReveal";
import { apiClient, unwrap } from "../../lib/api/client";
import { dashboardPathFor, useAuth } from "../../lib/auth/AuthProvider";
import { portfolios, riskLabelKey, riskOptions } from "./portfolioData";
import {
  mapPreviewBusinessesToPortfolios,
  unwrapPreviewList,
} from "./portfolioPreviewAdapter";

function BusinessVisual({
  image,
}: {
  image: string;
}) {
  return (
    <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-md bg-base-200">
      <img
        src={image}
        alt="UMKM opportunity"
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export function PortfolioPage() {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  useScrollReveal();
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("all");
  const [sector, setSector] = useState("all");

  const previewQuery = useQuery({
    queryKey: ["public-portfolio-preview"],
    queryFn: async () => {
      const response = await apiClient.get("/businesses/preview?page=1");
      return unwrapPreviewList(unwrap<unknown>(response.data));
    },
    retry: false,
  });

  const previewPortfolios = useMemo(
    () => mapPreviewBusinessesToPortfolios(previewQuery.data ?? []),
    [previewQuery.data],
  );

  const activePortfolios = previewPortfolios.length > 0 ? previewPortfolios : portfolios;
  const showPreviewFallbackWarning = previewQuery.isError && previewPortfolios.length === 0;
  const previewInfoMessage = showPreviewFallbackWarning
    ? t("portfolioPreviewFallbackWarning")
    : previewPortfolios.length === 0
      ? t("portfolioDemoMode")
      : null;
  const startNowTarget = isAuthenticated
    ? dashboardPathFor(user?.role ?? "umkm")
    : "/register";
  const sectors = useMemo(
    () => Array.from(new Set(activePortfolios.map((item) => item.sectorKey))),
    [activePortfolios],
  );

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return activePortfolios.filter((item) => {
      const matchSearch = `${item.name} ${t(item.sectorKey)} ${item.city}`.toLowerCase().includes(needle);
      const matchRisk = risk === "all" || item.risk === risk;
      const matchSector = sector === "all" || item.sectorKey === sector;
      return matchSearch && matchRisk && matchSector;
    });
  }, [activePortfolios, risk, search, sector, t]);

  return (
    <main className="bg-white">
      <section
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        data-reveal
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl font-black leading-tight tracking-normal">
              {t("portfolioHeroTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral/65">
              {t("portfolioHeroBody")}
            </p>
          </div>
          <Link to={startNowTarget} className="btn btn-primary rounded-md text-white">
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
              aria-label={t("portfolioSearchPlaceholder")}
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

        {previewInfoMessage ? (
          <div
            className={[
              "mt-4 rounded-md px-4 py-3 text-sm font-semibold",
              showPreviewFallbackWarning
                ? "border border-warning/20 bg-warning/10 text-warning"
                : "border border-info/20 bg-info/10 text-info",
            ].join(" ")}
          >
            {previewInfoMessage}
          </div>
        ) : null}

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {filtered.map((item) => {
            const progress = Math.min(100, Math.round((item.raised / item.target) * 100));
            return (
              <article
                key={item.slug}
                className="rounded-md border border-base-300 bg-white p-4 shadow-sm transition-[transform,box-shadow] duration-200 ease-out md:hover:-translate-y-0.5 md:hover:shadow-md"
                data-reveal
              >
                <BusinessVisual image={item.image} />
                <div>
                  <h2 className="text-xl font-black">{item.name}</h2>
                  <p className="mt-1 text-sm text-neutral/55">
                    {t(item.sectorKey)} - {item.city}
                  </p>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-sm font-semibold">
                    <span>
                      {compactCurrency(item.raised)} / {compactCurrency(item.target)}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-base-200">
                    <div
                      className="h-2.5 rounded-full bg-primary transition-[width] duration-[420ms] ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <Link to={`/portfolio/${item.slug}`} className="btn btn-primary flex-1 rounded-md text-white">
                    {t("detail")}
                  </Link>
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

        <section
          className="mt-16 rounded-md border border-base-300 bg-neutral p-8 text-white"
          data-reveal
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-normal">{t("portfolioMarketplaceTitle")}</h2>
              <p className="mt-4 text-sm leading-6 text-white/65">
                {t("portfolioMarketplaceBody")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["portfolioStepSave", "detail", "portfolioStepNegotiate"].map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/10 p-4">
                  <p className="text-xl font-black">{t(item)}</p>
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

