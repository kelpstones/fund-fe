import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Filter,
  Handshake,
  Loader2,
  Receipt,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { apiClient, unwrap } from "../../lib/api/client";
import { resourceApi } from "../../lib/api/resources";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import {
  myNegotiationConfig,
  publishedSubmissionConfig,
  submissionConfig,
} from "../../lib/resourceConfigs";
import { currency, percent, readPath, statusTone, textValue } from "../../lib/format";
import type { Entity } from "../../types";

const savedKey = "fundraise_saved_opportunities";

type SavedOpportunity = Entity & {
  saved_at?: string;
};

const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return String(error.response.data.message);
  }
  return fallback;
};

const readSaved = (): SavedOpportunity[] => {
  try {
    const raw = localStorage.getItem(savedKey);
    return raw ? (JSON.parse(raw) as SavedOpportunity[]) : [];
  } catch {
    return [];
  }
};

const writeSaved = (items: SavedOpportunity[]) => {
  localStorage.setItem(savedKey, JSON.stringify(items));
};

const opportunityId = (item: Entity) => String(item.id ?? readPath(item, ["pengajuan.id"], ""));
const businessName = (item: Entity) =>
  textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "nama", "business_name", "bisnis_id"]));
const sector = (item: Entity) =>
  textValue(readPath(item, ["bisnis.tipe_usaha", "tipe_usaha", "sektor", "sector"]), "lainnya");
const city = (item: Entity) => textValue(readPath(item, ["bisnis.kota", "bisnis.alamat", "alamat"]), "Indonesia");
const risk = (item: Entity) =>
  textValue(readPath(item, ["risk_level", "matched_class", "bisnis.kelas.nama_kelas", "kelas.nama_kelas"]), "moderate");
const target = (item: Entity) => Number(readPath(item, ["target_pendanaan", "bisnis.target_pendanaan"], "0"));
const funded = (item: Entity) => Number(readPath(item, ["total_pendanaan", "terkumpul"], "0"));
const returnRate = (item: Entity) => Number(readPath(item, ["per_anual_return", "return_investasi"], "0"));
const matchScore = (item: Entity) => Number(readPath(item, ["match_score", "skor_kecocokan"], "0"));
const progress = (item: Entity) => Math.min(100, Math.round((funded(item) / Math.max(target(item), 1)) * 100));

function useSavedOpportunities() {
  const [saved, setSaved] = useState<SavedOpportunity[]>(() => readSaved());
  const savedIds = useMemo(() => new Set(saved.map((item) => opportunityId(item))), [saved]);

  const toggle = (item: Entity) => {
    const id = opportunityId(item);
    const next = savedIds.has(id)
      ? saved.filter((current) => opportunityId(current) !== id)
      : [{ ...item, saved_at: new Date().toISOString() }, ...saved];
    setSaved(next);
    writeSaved(next);
  };

  return { saved, savedIds, toggle };
}

function usePublishedOpportunities() {
  return useQuery({
    queryKey: ["marketplace", "published-opportunities"],
    queryFn: () => resourceApi.list(publishedSubmissionConfig),
    retry: false,
  });
}

function MarketplaceHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral">{t(title)}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral/60">{t(description)}</p>
        </div>
        {actions ? <div className="flex flex-col gap-2 sm:flex-row">{actions}</div> : null}
      </div>
    </div>
  );
}

function OpportunityCard({
  item,
  savedIds,
  onToggleSave,
  compareSelected,
  onToggleCompare,
}: {
  item: Entity;
  savedIds: Set<string>;
  onToggleSave: (item: Entity) => void;
  compareSelected?: boolean;
  onToggleCompare?: (item: Entity) => void;
}) {
  const { t } = useLanguage();
  const id = opportunityId(item);
  const isSaved = savedIds.has(id);
  const score = matchScore(item);

  return (
    <article className="flex h-full flex-col rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-neutral/40">{sector(item)}</p>
          <h3 className="mt-2 text-xl font-black">{businessName(item)}</h3>
          <p className="mt-1 text-sm text-neutral/55">{city(item)}</p>
        </div>
        <button
          className={`btn btn-square btn-sm rounded-md ${isSaved ? "btn-primary text-white" : "btn-outline"}`}
          onClick={() => onToggleSave(item)}
          aria-label={isSaved ? t("removeBookmark") : t("saveOpportunity")}
          title={isSaved ? t("removeBookmark") : t("saveOpportunity")}
        >
          {isSaved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-md bg-base-200 p-3">
          <p className="text-neutral/50">{t("metricTarget")}</p>
          <p className="mt-1 font-black">{currency(target(item))}</p>
        </div>
        <div className="rounded-md bg-base-200 p-3">
          <p className="text-neutral/50">{t("metricReturn")}</p>
          <p className="mt-1 font-black">{percent(returnRate(item))}</p>
        </div>
        <div className="rounded-md bg-base-200 p-3">
          <p className="text-neutral/50">{t("metricRisk")}</p>
          <p className="mt-1 font-black">{risk(item)}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm font-semibold text-neutral/60">
          <span>{currency(funded(item))}</span>
          <span>{progress(item)}%</span>
        </div>
        <div className="h-3 rounded-full bg-base-200">
          <div className="h-3 rounded-full bg-primary" style={{ width: `${progress(item)}%` }} />
        </div>
      </div>

      <p className="mt-5 flex-1 text-sm leading-6 text-neutral/60">
        {textValue(
          readPath(item, ["reason", "alasan", "explanation", "match_reason"], ""),
          t("opportunityDefaultReason"),
        )}
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link to={`/dashboard/investor/peluang/${id}`} className="btn btn-primary flex-1 rounded-md text-white">
          {t("detail")}
          <ArrowRight size={17} />
        </Link>
        {onToggleCompare ? (
          <button
            className={`btn rounded-md ${compareSelected ? "btn-secondary text-white" : "btn-outline"}`}
            onClick={() => onToggleCompare(item)}
          >
            {t("compare")}
          </button>
        ) : null}
      </div>

      {score > 0 ? (
        <div className="mt-4 rounded-md border border-secondary/20 bg-secondary/10 p-3">
          <p className="text-sm font-bold text-secondary">{t("matchScoreValue", { score: percent(score) })}</p>
        </div>
      ) : null}
    </article>
  );
}

function CatalogGrid({
  items,
  savedIds,
  onToggleSave,
  compareIds,
  onToggleCompare,
}: {
  items: Entity[];
  savedIds: Set<string>;
  onToggleSave: (item: Entity) => void;
  compareIds?: Set<string>;
  onToggleCompare?: (item: Entity) => void;
}) {
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-base-300 bg-white p-8 text-center shadow-sm">
        <h3 className="text-xl font-black">{t("noOpportunities")}</h3>
        <p className="mt-2 text-sm text-neutral/55">
          {t("noOpportunitiesBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {items.map((item) => (
        <OpportunityCard
          key={opportunityId(item)}
          item={item}
          savedIds={savedIds}
          onToggleSave={onToggleSave}
          compareSelected={compareIds?.has(opportunityId(item))}
          onToggleCompare={onToggleCompare}
        />
      ))}
    </div>
  );
}

export function OpportunitiesPage() {
  const { t } = useLanguage();
  const { data = [], isLoading, isError, error } = usePublishedOpportunities();
  const { saved, savedIds, toggle } = useSavedOpportunities();
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [minReturn, setMinReturn] = useState(0);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const sectors = useMemo(
    () => Array.from(new Set(data.map((item) => sector(item).toLowerCase()).filter(Boolean))).sort(),
    [data],
  );

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return data.filter((item) => {
      const matchesSearch = `${businessName(item)} ${sector(item)} ${city(item)}`.toLowerCase().includes(needle);
      const matchesSector = sectorFilter === "all" || sector(item).toLowerCase() === sectorFilter;
      const matchesRisk = riskFilter === "all" || risk(item).toLowerCase() === riskFilter;
      const matchesReturn = returnRate(item) >= minReturn;
      return matchesSearch && matchesSector && matchesRisk && matchesReturn;
    });
  }, [data, minReturn, riskFilter, search, sectorFilter]);

  const toggleCompare = (item: Entity) => {
    const id = opportunityId(item);
    setCompareIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const compareUrl = `/dashboard/investor/compare?ids=${Array.from(compareIds).join(",")}`;

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title="marketplaceOpportunitiesTitle"
        description="marketplaceOpportunitiesBody"
        actions={
          <>
            <Link to="/dashboard/investor/saved" className="btn btn-outline rounded-md">
              <Bookmark size={17} />
              {t("savedCount", { count: saved.length })}
            </Link>
            <Link
              to={compareUrl}
              className={`btn rounded-md ${compareIds.size >= 2 ? "btn-secondary text-white" : "btn-disabled"}`}
            >
              {t("compareCount", { count: compareIds.size })}
            </Link>
          </>
        }
      />

      <div className="rounded-md border border-base-300 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr]">
          <label className="input input-bordered flex items-center gap-2 rounded-md">
            <Search size={17} className="text-neutral/40" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchUmkmSectorCity")} />
          </label>
          <label className="flex h-12 items-center gap-2 rounded-md border border-base-300 px-3">
            <Filter size={17} className="text-neutral/45" />
            <select className="w-full bg-transparent outline-none" value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
              <option value="all">{t("allSectors")}</option>
              {sectors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <select className="select select-bordered rounded-md" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
            <option value="all">{t("allRisk")}</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="growth">Growth</option>
            <option value="elite">Elite</option>
          </select>
          <label className="input input-bordered flex items-center gap-2 rounded-md">
            <span className="text-sm font-bold">{t("metricReturn")}</span>
            <input className="w-14" type="number" min={0} max={100} value={minReturn} onChange={(event) => setMinReturn(Number(event.target.value))} />
            <span className="text-sm font-bold">%</span>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-md border border-base-300 bg-white p-6 text-sm font-semibold text-neutral/55">{t("loadingOpportunities")}</div>
      ) : null}
      {isError ? (
        <div className="rounded-md border border-error/20 bg-error/10 p-4 text-sm font-semibold text-error">
          {apiErrorMessage(error, t("loadOpportunitiesError"))}
        </div>
      ) : null}
      {!isLoading && !isError ? (
        <CatalogGrid
          items={filtered}
          savedIds={savedIds}
          onToggleSave={toggle}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
        />
      ) : null}
    </section>
  );
}

export function AiRecommendationsPage() {
  const { t } = useLanguage();
  const [riskFilter, setRiskFilter] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const { saved, savedIds, toggle } = useSavedOpportunities();
  const queryClient = useQueryClient();
  const { data: payload = null, isLoading, isError, error } = useQuery({
    queryKey: ["ai-recommendations", "marketplace"],
    queryFn: async () => unwrap<unknown>((await apiClient.get("/user/investor/recommendations")).data),
    retry: false,
  });
  const refreshMutation = useMutation({
    mutationFn: async () => unwrap<unknown>((await apiClient.post("/user/investor/preferences/refresh")).data),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] }),
  });

  const recommendations = useMemo(() => {
    if (Array.isArray(payload)) return payload as Entity[];
    if (payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>).rekomendasi)) {
      return (payload as Record<string, Entity[]>).rekomendasi;
    }
    return [];
  }, [payload]);

  const filtered = recommendations.filter((item) => {
    const matchesRisk = riskFilter === "all" || risk(item).toLowerCase() === riskFilter;
    return matchesRisk && matchScore(item) >= minScore;
  });

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title="aiMatchMarketplaceTitle"
        description="aiMatchMarketplaceBody"
        actions={
          <>
            <Link to="/dashboard/investor/survey" className="btn btn-outline rounded-md">
              <Sparkles size={17} />
              {t("fillSurvey")}
            </Link>
            <button
              className="btn btn-primary rounded-md text-white"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              {refreshMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
              {t("refresh")}
            </button>
          </>
        }
      />

      <div className="rounded-md border border-base-300 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <select className="select select-bordered rounded-md" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
            <option value="all">{t("allRisk")}</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
          <label className="input input-bordered flex items-center gap-2 rounded-md">
            <span className="text-sm font-bold">{t("minScore")}</span>
            <input className="w-14" type="number" min={0} max={100} value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} />
            <span className="text-sm font-bold">%</span>
          </label>
        </div>
      </div>

      {isLoading ? <div className="rounded-md border border-base-300 bg-white p-6 text-sm font-semibold text-neutral/55">{t("loadingRecommendations")}</div> : null}
      {isError ? (
        <div className="rounded-md border border-warning/20 bg-warning/10 p-4 text-sm font-semibold text-warning">
          {apiErrorMessage(error, t("recommendationsUnavailable"))}
        </div>
      ) : null}
      {!isLoading && !isError && filtered.length === 0 ? (
        <div className="rounded-md border border-base-300 bg-white p-8 text-center shadow-sm">
          <h3 className="text-xl font-black">{t("noRecommendations")}</h3>
          <p className="mt-2 text-sm text-neutral/55">{t("noRecommendationsBody")}</p>
          <Link to="/dashboard/investor/survey" className="btn btn-primary mt-5 rounded-md text-white">
            {t("startSurvey")}
          </Link>
        </div>
      ) : null}
      {!isLoading && !isError && filtered.length > 0 ? (
        <CatalogGrid items={filtered} savedIds={savedIds} onToggleSave={toggle} />
      ) : null}
      {saved.length > 0 ? (
        <div className="rounded-md border border-info/20 bg-info/10 p-4 text-sm font-semibold text-info">
          {t("savedOpportunitiesInfo", { count: saved.length })}
        </div>
      ) : null}
    </section>
  );
}

export function SavedOpportunitiesPage() {
  const { t } = useLanguage();
  const { saved, savedIds, toggle } = useSavedOpportunities();

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title="savedOpportunitiesTitle"
        description="savedOpportunitiesBody"
        actions={
          <Link to="/dashboard/investor/compare" className="btn btn-secondary rounded-md text-white">
            {t("compareAll")}
          </Link>
        }
      />
      <CatalogGrid items={saved} savedIds={savedIds} onToggleSave={toggle} />
    </section>
  );
}

export function CompareOpportunitiesPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const { data = [] } = usePublishedOpportunities();
  const { saved } = useSavedOpportunities();
  const source = [...data, ...saved];
  const unique = Array.from(new Map(source.map((item) => [opportunityId(item), item])).values());
  const compared = ids.length > 0 ? unique.filter((item) => ids.includes(opportunityId(item))) : unique.slice(0, 4);

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title="compareUmkmTitle"
        description="compareUmkmBody"
        actions={<Link to="/dashboard/investor/peluang" className="btn btn-outline rounded-md">{t("addOpportunity")}</Link>}
      />
      {compared.length === 0 ? (
        <div className="rounded-md border border-base-300 bg-white p-8 text-center shadow-sm">
          <h3 className="text-xl font-black">{t("noCompareItems")}</h3>
          <p className="mt-2 text-sm text-neutral/55">{t("noCompareItemsBody")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-base-300 bg-white shadow-sm">
          <table className="table">
            <thead>
              <tr className="bg-base-200 text-xs uppercase tracking-wide text-neutral/60">
                <th>{t("metric")}</th>
                {compared.map((item) => <th key={opportunityId(item)}>{businessName(item)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["sector", (item: Entity) => sector(item)],
                ["metricTarget", (item: Entity) => currency(target(item))],
                ["funded", (item: Entity) => currency(funded(item))],
                ["progress", (item: Entity) => `${progress(item)}%`],
                ["metricReturn", (item: Entity) => percent(returnRate(item))],
                ["risk", (item: Entity) => risk(item)],
                ["metricMatch", (item: Entity) => (matchScore(item) ? percent(matchScore(item)) : "-")],
              ].map(([label, render]) => (
                <tr key={String(label)}>
                  <td className="font-black">{t(String(label))}</td>
                  {compared.map((item) => (
                    <td key={`${label}-${opportunityId(item)}`} className="font-semibold">
                      {(render as (item: Entity) => string)(item)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="font-black">{t("actions")}</td>
                {compared.map((item) => (
                  <td key={`action-${opportunityId(item)}`}>
                    <Link to={`/dashboard/investor/peluang/${opportunityId(item)}`} className="btn btn-primary btn-sm rounded-md text-white">
                      {t("detail")}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function OpportunityDetailPage() {
  const { t } = useLanguage();
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = usePublishedOpportunities();
  const { saved, savedIds, toggle } = useSavedOpportunities();
  const opportunity = [...data, ...saved].find((item) => opportunityId(item) === id);
  const [form, setForm] = useState({
    penawaran_nominal: "",
    penawaran_return: "",
    catatan: "",
  });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const negotiationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/businesses/proposals/negotiations/start", {
        pengajuans_id: Number(id),
        penawaran_nominal: Number(form.penawaran_nominal),
        penawaran_return: Number(form.penawaran_return),
        catatan: form.catatan,
      });
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setMessage(t("negotiationStartedMessage"));
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: ["resource", myNegotiationConfig.key] });
    },
    onError: (error) => {
      setMessage("");
      setErrorMessage(apiErrorMessage(error, t("negotiationStartError")));
    },
  });

  if (isLoading && !opportunity) {
    return <div className="rounded-md border border-base-300 bg-white p-6 text-sm font-semibold text-neutral/55">{t("loadingOpportunityDetail")}</div>;
  }

  if (!opportunity) {
    return (
      <section className="space-y-5">
        <MarketplaceHeader title="opportunityNotFoundTitle" description="opportunityNotFoundBody" />
        <Link to="/dashboard/investor/peluang" className="btn btn-primary rounded-md text-white">{t("backToMarketplace")}</Link>
      </section>
    );
  }

  const isSaved = savedIds.has(opportunityId(opportunity));

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title={businessName(opportunity)}
        description="opportunityDetailBody"
        actions={
          <>
            <button className="btn btn-outline rounded-md" onClick={() => toggle(opportunity)}>
              {isSaved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
              {isSaved ? t("saved") : t("save")}
            </button>
            <Link to={`/dashboard/investor/compare?ids=${opportunityId(opportunity)}`} className="btn btn-secondary rounded-md text-white">
              {t("compare")}
            </Link>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-md bg-base-200 p-4">
              <CircleDollarSign className="text-primary" size={22} />
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-neutral/45">{t("metricTarget")}</p>
              <p className="mt-1 font-black">{currency(target(opportunity))}</p>
            </div>
            <div className="rounded-md bg-base-200 p-4">
              <TrendingUp className="text-primary" size={22} />
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-neutral/45">{t("metricReturn")}</p>
              <p className="mt-1 font-black">{percent(returnRate(opportunity))}</p>
            </div>
            <div className="rounded-md bg-base-200 p-4">
              <Scale className="text-primary" size={22} />
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-neutral/45">{t("risk")}</p>
              <p className="mt-1 font-black">{risk(opportunity)}</p>
            </div>
            <div className="rounded-md bg-base-200 p-4">
              <Sparkles className="text-primary" size={22} />
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-neutral/45">{t("metricMatch")}</p>
              <p className="mt-1 font-black">{matchScore(opportunity) ? percent(matchScore(opportunity)) : "-"}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm font-semibold text-neutral/60">
              <span>{currency(funded(opportunity))}</span>
              <span>{progress(opportunity)}%</span>
            </div>
            <div className="h-3 rounded-full bg-base-200">
              <div className="h-3 rounded-full bg-primary" style={{ width: `${progress(opportunity)}%` }} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["sector", sector(opportunity)],
              ["location", city(opportunity)],
              ["submissionId", `#${opportunityId(opportunity)}`],
              ["status", textValue(readPath(opportunity, ["approval.status", "status", "approval_status"]))],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-base-300 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">{t(label)}</p>
                <p className="mt-2 font-black">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-md border border-base-300 p-5">
            <h3 className="font-black">{t("documentsAndRiskSignals")}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {["businessProfile", "salesReport", "riskMemo"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md bg-base-200 p-3">
                  <FileText size={18} className="text-primary" />
                  <span className="text-sm font-bold">{t(item)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form className="rounded-md border border-base-300 bg-white p-6 shadow-sm" onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          negotiationMutation.mutate();
        }}>
          <Handshake className="text-primary" size={28} />
          <h3 className="mt-4 text-xl font-black">{t("startNegotiation")}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral/60">
            {t("startNegotiationBody")}
          </p>
          <div className="mt-5 grid gap-4">
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("offerNominal")}</span>
              <input className="input input-bordered rounded-md" type="number" required value={form.penawaran_nominal} onChange={(event) => setForm((current) => ({ ...current, penawaran_nominal: event.target.value }))} />
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("offerReturn")}</span>
              <input className="input input-bordered rounded-md" type="number" required value={form.penawaran_return} onChange={(event) => setForm((current) => ({ ...current, penawaran_return: event.target.value }))} />
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("notes")}</span>
              <textarea className="textarea textarea-bordered min-h-28 rounded-md" value={form.catatan} onChange={(event) => setForm((current) => ({ ...current, catatan: event.target.value }))} />
            </label>
          </div>
          <button className="btn btn-primary mt-5 w-full rounded-md text-white" disabled={negotiationMutation.isPending}>
            {negotiationMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <Handshake size={17} />}
            {t("sendOffer")}
          </button>
          <Link to="/dashboard/investor/negosiasi" className="btn btn-outline mt-3 w-full rounded-md">
            {t("viewNegotiations")}
          </Link>
          {message ? <p className="mt-4 rounded-md bg-success/10 p-3 text-sm font-semibold text-success">{message}</p> : null}
          {errorMessage ? <p className="mt-4 rounded-md bg-error/10 p-3 text-sm font-semibold text-error">{errorMessage}</p> : null}
        </form>
      </div>
    </section>
  );
}

export function DealRoomPage() {
  const { t } = useLanguage();
  const { id = "" } = useParams();
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["deal-room", id],
    queryFn: () => resourceApi.list(myNegotiationConfig),
    retry: false,
  });
  const deal = data.find((item) => opportunityId(item) === id || String(item.id) === id) ?? data[0];
  const status = textValue(readPath(deal ?? {}, ["status", "negosiasi_terakhir.status"]), "draft");

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title="dealRoomTitle"
        description="dealRoomBody"
        actions={<Link to="/dashboard/investor/negosiasi" className="btn btn-outline rounded-md">{t("allNegotiations")}</Link>}
      />
      {isLoading ? <div className="rounded-md border border-base-300 bg-white p-6 text-sm font-semibold text-neutral/55">{t("loadingDealRoom")}</div> : null}
      {isError || !deal ? (
        <div className="rounded-md border border-base-300 bg-white p-8 text-center shadow-sm">
          <h3 className="text-xl font-black">{t("noActiveDeal")}</h3>
          <p className="mt-2 text-sm text-neutral/55">{t("noActiveDealBody")}</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black">{businessName(deal)}</h3>
            <p className="mt-2 text-sm text-neutral/55">{t("currentStatus")}</p>
            <span className={`badge mt-3 ${statusTone(status)}`}>{status}</span>
            <div className="mt-6 grid gap-3">
              {[
                ["nominal", currency(readPath(deal, ["negosiasi_terakhir.penawaran_nominal", "penawaran_nominal"], "0"))],
                ["metricReturn", percent(readPath(deal, ["negosiasi_terakhir.penawaran_return", "penawaran_return"], "0"))],
                ["notes", textValue(readPath(deal, ["negosiasi_terakhir.catatan", "catatan"]))],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-base-300 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">{t(label)}</p>
                  <p className="mt-2 font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black">{t("dealPipeline")}</h3>
            <div className="mt-5 grid gap-3">
              {[
                ["negotiation", "dealPipelineNegotiation", Handshake, "active"],
                ["invoice", "dealPipelineInvoice", Receipt, status === "deal" ? "active" : "pending"],
                ["investment", "dealPipelineInvestment", TrendingUp, "pending"],
                ["profit", "dealPipelineProfit", CircleDollarSign, "pending"],
              ].map(([title, body, Icon, tone]) => {
                const StepIcon = Icon as typeof Handshake;
                return (
                  <div key={String(title)} className="flex gap-4 rounded-md border border-base-300 p-4">
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${tone === "active" ? "bg-primary text-white" : "bg-base-200 text-neutral/45"}`}>
                      <StepIcon size={20} />
                    </div>
                    <div>
                      <p className="font-black">{t(String(title))}</p>
                      <p className="mt-1 text-sm leading-6 text-neutral/55">{t(String(body))}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function AdminReviewQueuePage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-review-queue"],
    queryFn: () => resourceApi.list(submissionConfig),
    retry: false,
  });
  const reviewItems = data.filter((item) => String(readPath(item, ["approval.status", "approval_status", "status"])).toLowerCase() === "pending");
  const actionMutation = useMutation({
    mutationFn: async ({ item, status }: { item: Entity; status: "approved" | "rejected" }) => {
      const response = await apiClient.put(`/businesses/proposals/${item.id}/status`, {
        status,
        catatan: status === "approved" ? "Disetujui dari review queue." : "Ditolak dari review queue.",
      });
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin-review-queue"] }),
  });

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title="adminReviewQueueTitle"
        description="adminReviewQueueBody"
        actions={<Link to="/dashboard/admin/pengajuan" className="btn btn-outline rounded-md">{t("viewAllSubmissions")}</Link>}
      />
      {isLoading ? <div className="rounded-md border border-base-300 bg-white p-6 text-sm font-semibold text-neutral/55">{t("loadingReviewQueue")}</div> : null}
      {isError ? (
        <div className="rounded-md border border-error/20 bg-error/10 p-4 text-sm font-semibold text-error">
          {apiErrorMessage(error, t("loadReviewQueueError"))}
        </div>
      ) : null}
      {!isLoading && !isError && reviewItems.length === 0 ? (
        <div className="rounded-md border border-base-300 bg-white p-8 text-center shadow-sm">
          <ClipboardCheck className="mx-auto text-success" size={34} />
          <h3 className="mt-4 text-xl font-black">{t("noPendingSubmissions")}</h3>
          <p className="mt-2 text-sm text-neutral/55">{t("noPendingSubmissionsBody")}</p>
        </div>
      ) : null}
      <div className="grid gap-4">
        {reviewItems.map((item) => (
          <article key={item.id} className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-black">{businessName(item)}</h3>
                <p className="mt-1 text-sm text-neutral/55">
                  {t("metricTarget")} {currency(target(item))} - {t("metricReturn")} {percent(returnRate(item))} - {sector(item)}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn btn-success rounded-md text-white"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate({ item, status: "approved" })}
                >
                  <CheckCircle2 size={17} />
                  Approve
                </button>
                <button
                  className="btn btn-error rounded-md text-white"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate({ item, status: "rejected" })}
                >
                  <XCircle size={17} />
                  Reject
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
