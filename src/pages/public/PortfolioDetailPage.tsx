import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Bookmark } from "lucide-react";
import { compactCurrency, percent } from "../../lib/format";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useScrollReveal } from "../../lib/ui/useScrollReveal";
import { apiClient, unwrap } from "../../lib/api/client";
import { dashboardPathFor, useAuth } from "../../lib/auth/AuthProvider";
import { portfolios, riskLabelKey } from "./portfolioData";
import {
  mapPreviewBusinessesToPortfolios,
  unwrapPreviewList,
} from "./portfolioPreviewAdapter";

export function PortfolioDetailPage() {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  useScrollReveal();
  const { slug = "" } = useParams();

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
  const startNowTarget = isAuthenticated
    ? dashboardPathFor(user?.role ?? "umkm")
    : "/login";
  const item = activePortfolios.find((entry) => entry.slug === slug);

  if (!item) {
    return (
      <main className="bg-white">
        <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8" data-reveal>
          <div className="rounded-md border border-base-300 bg-base-200 p-8 text-center">
            <h1 className="text-2xl font-black text-neutral">{t("portfolioDetailNotFoundTitle")}</h1>
            <p className="mt-3 text-sm leading-6 text-neutral/65">{t("portfolioDetailNotFoundBody")}</p>
            <Link to="/portfolio" className="btn btn-primary mt-6 rounded-md text-white">
              <ArrowLeft size={17} />
              {t("portfolioDetailBack")}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const progress = Math.min(100, Math.round((item.raised / item.target) * 100));

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" data-reveal>
        <Link to="/portfolio" className="btn btn-ghost mb-6 rounded-md">
          <ArrowLeft size={17} />
          {t("portfolioDetailBack")}
        </Link>
        {showPreviewFallbackWarning ? (
          <div className="mb-6 rounded-md border border-warning/20 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
            {t("portfolioPreviewFallbackWarning")}
          </div>
        ) : null}

        <div className="relative overflow-hidden rounded-md border border-base-300">
          <img src={item.heroImage} alt={item.name} className="h-[340px] w-full object-cover sm:h-[420px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-x-6 bottom-6 text-white">
            <h1 className="text-3xl font-black sm:text-4xl">{item.name}</h1>
            <p className="mt-2 text-sm font-semibold text-white/90">{t(item.sectorKey)} - {item.city}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-md border border-base-300 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">{t("metricReturn")}</p>
            <p className="mt-1 text-2xl font-black">{percent(item.returnRate)}</p>
          </div>
          <div className="rounded-md border border-base-300 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">{t("metricRisk")}</p>
            <p className="mt-1 text-2xl font-black">{t(riskLabelKey(item.risk))}</p>
          </div>
          <div className="rounded-md border border-base-300 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">{t("metricMatch")}</p>
            <p className="mt-1 text-2xl font-black text-secondary">{percent(item.score)}</p>
          </div>
          <div className="rounded-md border border-base-300 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">{t("metricTarget")}</p>
            <p className="mt-1 text-2xl font-black">{compactCurrency(item.target)}</p>
          </div>
          <div className="rounded-md border border-base-300 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">{t("funded")}</p>
            <p className="mt-1 text-2xl font-black">{compactCurrency(item.raised)}</p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-base-300 bg-base-200 p-4">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-neutral/65">
            <span>{compactCurrency(item.raised)}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 rounded-full bg-base-300">
            <div className="h-3 rounded-full bg-primary transition-[width] duration-[420ms] ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-md border border-base-300 bg-white p-6" data-reveal>
            <h2 className="text-2xl font-black">{t("portfolioDetailSummaryTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-neutral/70">
              {t("portfolioDetailSummaryBody", {
                business: item.name,
                sector: t(item.sectorKey),
                city: item.city,
              })}
            </p>

            <h3 className="mt-8 text-xl font-black">{t("portfolioDetailFundsTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral/65">{t("portfolioDetailFundsBody")}</p>
            <div className="mt-4 grid gap-3">
              {item.funds.map((fund) => (
                <div key={`${item.slug}-${fund.labelKey}`} className="rounded-md border border-base-300 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-neutral/70">
                    <span>{t(fund.labelKey)}</span>
                    <span>{fund.percentage}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-base-200">
                    <div className="h-2.5 rounded-full bg-secondary transition-[width] duration-[420ms] ease-out" style={{ width: `${fund.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="grid gap-5">
            <article className="rounded-md border border-base-300 bg-white p-6" data-reveal>
              <h3 className="text-xl font-black">{t("portfolioDetailSignalsTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral/65">{t("portfolioDetailSignalsBody")}</p>
              <div className="mt-4 grid gap-2">
                {item.readiness.map((signal) => (
                  <div key={`${item.slug}-${signal}`} className="rounded-md bg-base-200 px-4 py-3 text-sm font-semibold text-neutral/75">
                    {t(signal)}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-md border border-base-300 bg-neutral p-6 text-white" data-reveal>
              <h3 className="text-xl font-black">{t("portfolioDetailActionTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">{t("portfolioDetailActionBody")}</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button className="btn btn-outline rounded-md border-white/30 bg-transparent text-white hover:border-white hover:bg-white hover:text-neutral">
                  <Bookmark size={17} />
                  {t("save")}
                </button>
                <Link to={startNowTarget} className="btn btn-primary rounded-md text-white">
                  {t("portfolioDetailStart")}
                  <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
