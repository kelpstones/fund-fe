import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Filter,
  Handshake,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { CardSkeletonGrid, ListSkeleton } from "../../components/PageSkeleton";
import { DashboardBreadcrumb } from "../../components/DashboardBreadcrumb";
import { apiClient, unwrap } from "../../lib/api/client";
import { resourceApi } from "../../lib/api/resources";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useToast } from "../../components/ToastProvider";
import {
  businessConfig,
  myNegotiationConfig,
  submissionConfig,
} from "../../lib/resourceConfigs";
import { apiErrorMessage, compactCurrency, currency, dateShort, percent, readPath, textValue } from "../../lib/format";
import type { Entity } from "../../types";

type SavedOpportunity = Entity & {
  saved_at?: string;
  is_bookmark_only?: boolean;
};

const opportunityPageSize = 50;
const opportunityPageFetchLimit = 20;
const businessLookupLimit = 200;
const compareSelectionLimit = 4;

type ParsedCompareIds = {
  ids: string[];
  invalidCount: number;
  duplicateCount: number;
  overflowCount: number;
};

const asEntity = (value: unknown): Entity =>
  value && typeof value === "object" ? (value as Entity) : { id: "" };

const normalizeEntityList = (value: unknown) => {
  if (Array.isArray(value)) return value as Entity[];
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    if (Array.isArray(objectValue.items)) return objectValue.items as Entity[];
    if (Array.isArray(objectValue.rows)) return objectValue.rows as Entity[];
    if (Array.isArray(objectValue.results)) return objectValue.results as Entity[];
    if (Array.isArray(objectValue.rekomendasi)) return objectValue.rekomendasi as Entity[];
    if ("id" in objectValue || "pengajuan_id" in objectValue) return [objectValue as Entity];
  }
  return [];
};

const opportunityId = (item: Entity) =>
  textValue(readPath(item, ["pengajuan_id", "pengajuan.id", "id"], ""), "");
const bookmarkKey = (item: Entity) =>
  textValue(readPath(item, ["bisnis.id", "bisnis_id"], ""), "");
const compareItemKey = (item: Entity) => {
  const submissionId = opportunityId(item);
  if (submissionId) return `pengajuan:${submissionId}`;
  const savedBusinessId = bookmarkKey(item);
  if (savedBusinessId) return `bookmark:${savedBusinessId}`;
  const fallbackId = textValue(readPath(item, ["id"], ""), "");
  if (fallbackId) return `entity:${fallbackId}`;
  const fallbackName = textValue(readPath(item, ["nama", "bisnis.nama_bisnis", "bisnis_id"], ""), "unknown");
  const fallbackTime = textValue(readPath(item, ["saved_at", "created_at", "updated_at"], ""), "");
  return `entity:${fallbackName}:${fallbackTime}`;
};
const parseCompareIds = (rawValue: string | null): ParsedCompareIds => {
  const seen = new Set<string>();
  const ids: string[] = [];
  let invalidCount = 0;
  let duplicateCount = 0;

  for (const token of (rawValue ?? "").split(",")) {
    const value = token.trim();
    if (!value) continue;
    if (!/^\d+$/.test(value)) {
      invalidCount += 1;
      continue;
    }
    if (seen.has(value)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(value);
    ids.push(value);
  }

  const overflowCount = Math.max(0, ids.length - compareSelectionLimit);
  return {
    ids: ids.slice(0, compareSelectionLimit),
    invalidCount,
    duplicateCount,
    overflowCount,
  };
};
const businessName = (item: Entity) =>
  textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "bisnis_nama", "nama", "business_name", "bisnis_id"]));
const sector = (item: Entity) =>
  textValue(readPath(item, ["bisnis.tipe_usaha", "tipe_usaha", "sektor", "sector"]), "lainnya");
const city = (item: Entity) => {
  const location = textValue(readPath(item, ["bisnis.kota", "kota", "bisnis.alamat", "alamat"]), "Indonesia");
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts.at(-1) ?? location : location;
};
const target = (item: Entity) => Number(readPath(item, ["target_pendanaan", "bisnis.target_pendanaan"], "0"));
const funded = (item: Entity) => Number(readPath(item, ["total_pendanaan", "terkumpul"], "0"));
const returnRate = (item: Entity) => Number(readPath(item, ["per_anual_return", "return_investasi"], "0"));
const matchScore = (item: Entity) => Number(readPath(item, ["match_score", "skor_kecocokan"], "0"));
const progress = (item: Entity) => Math.min(100, Math.round((funded(item) / Math.max(target(item), 1)) * 100));
const businessImage = (item: Entity) => {
  const directImage = textValue(
    readPath(item, [
      "image_url",
      "cover_image_url",
      "cover.url",
      "cover.image_url",
      "bisnis.image_url",
      "bisnis.cover_image_url",
    ], ""),
    "",
  );
  if (directImage) return directImage;

  const covers = readPath(item, ["covers", "bisnis.covers"], "");
  if (Array.isArray(covers)) {
    const firstCover = covers
      .map((cover) => asEntity(cover))
      .sort((first, second) => Number(first.urutan || 0) - Number(second.urutan || 0))[0];
    const coverUrl = textValue(readPath(firstCover ?? { id: "" }, ["image_url", "url"], ""), "");
    if (coverUrl) return coverUrl;
  }

  return "";
};
const clampReturnFilter = (value: number) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
const mergeOpportunityBusiness = (item: Entity, businessById: Map<string, Entity>) => {
  const currentBusiness = asEntity(item.bisnis);
  const businessId = textValue(readPath(item, ["bisnis.id", "bisnis_id"], ""), "");
  const fullBusiness = businessById.get(businessId);
  if (!fullBusiness) return item;

  const fullBusinessCovers = readPath(fullBusiness, ["covers"], "");
  const currentBusinessCovers = readPath(currentBusiness, ["covers"], "");
  const covers = Array.isArray(fullBusinessCovers) ? fullBusinessCovers : currentBusinessCovers;

  return {
    ...item,
    bisnis: {
      ...fullBusiness,
      ...currentBusiness,
      covers,
    },
    covers,
  };
};

function useSavedOpportunities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userKey = String(user?.id ?? "guest");
  const query = useQuery({
    queryKey: ["investor-bookmarks", userKey],
    queryFn: async () => {
      const response = await apiClient.get("/user/investor/bookmarks");
      return normalizeEntityList(unwrap<unknown>(response.data)).map((item) => {
        const bisnis = asEntity(item.bisnis);
        return {
          ...item,
          id: bisnis.id ? `bookmark-${bisnis.id}` : item.id,
          bisnis,
          is_bookmark_only: true,
        } as SavedOpportunity;
      });
    },
    enabled: Boolean(user?.id),
    retry: false,
  });

  const saved = useMemo(() => query.data ?? [], [query.data]);
  const savedIds = useMemo(
    () => new Set(saved.map((item) => bookmarkKey(item)).filter(Boolean)),
    [saved],
  );

  const mutation = useMutation({
    mutationFn: async (item: Entity) => {
      const bisnisId = bookmarkKey(item);
      if (!bisnisId) throw new Error("bisnis_id is required");
      if (savedIds.has(bisnisId)) {
        await apiClient.delete(`/user/investor/bookmarks/${bisnisId}`);
        return;
      }
      await apiClient.post("/user/investor/bookmarks", { bisnis_id: Number(bisnisId) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["investor-bookmarks", userKey] });
    },
  });
  const savingId = mutation.isPending && mutation.variables ? bookmarkKey(mutation.variables) : "";

  return {
    saved,
    savedIds,
    toggle: (item: Entity) => mutation.mutate(item),
    isLoading: query.isLoading,
    isError: query.isError,
    isSaving: mutation.isPending,
    savingId,
    error: query.error ?? mutation.error,
  };
}

const fetchPublishedOpportunityPage = async (page: number) => {
  const response = await apiClient.get(
    `/businesses/proposals?page=${page}&limit=${opportunityPageSize}&status=published`,
  );
  return normalizeEntityList(unwrap<unknown>(response.data));
};

function usePublishedOpportunities() {
  return useQuery({
    queryKey: ["marketplace", "published-opportunities"],
    queryFn: async () => {
      const businessesPromise = resourceApi
        .list({ ...businessConfig, listPath: `/businesses?page=1&limit=${businessLookupLimit}` })
        .catch(() => []);
      const pages: Array<{ items: Entity[]; page: number; hasMore: boolean }> = [];

      for (let page = 1; page <= opportunityPageFetchLimit; page += 1) {
        const submissions = await fetchPublishedOpportunityPage(page);
        pages.push({
          items: submissions,
          page,
          hasMore: submissions.length === opportunityPageSize,
        });
        if (submissions.length < opportunityPageSize) break;
      }

      const businesses = await businessesPromise;
      const businessById = new Map(businesses.map((item) => [String(item.id), item]));
      const mergedPages = pages.map((page) => ({
        ...page,
        items: page.items.map((item) => mergeOpportunityBusiness(item, businessById)),
      }));

      return {
        pages: mergedPages,
        items: mergedPages.flatMap((page) => page.items),
        reachedFetchLimit:
          pages.length === opportunityPageFetchLimit &&
          Boolean(pages.at(-1)?.hasMore),
      };
    },
    retry: false,
  });
}

function MarketplaceHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral">{t(title)}</h2>
          <DashboardBreadcrumb />
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral/60">{t(description)}</p> : null}
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
  savingId,
  compareSelected,
  onToggleCompare,
}: {
  item: Entity;
  savedIds: Set<string>;
  onToggleSave: (item: Entity) => void;
  savingId?: string;
  compareSelected?: boolean;
  onToggleCompare?: (item: Entity) => void;
}) {
  const { t } = useLanguage();
  const id = opportunityId(item);
  const saveId = bookmarkKey(item);
  const isSaved = Boolean(saveId && savedIds.has(saveId));
  const canOpenDetail = !item.is_bookmark_only && Boolean(id);
  const canSave = Boolean(saveId);
  const score = matchScore(item);
  const imageSrc = businessImage(item);
  const isSavingThis = Boolean(savingId && savingId === saveId);
  const targetValue = target(item);
  const returnValue = returnRate(item);
  const fundedValue = funded(item);
  const progressValue = progress(item);
  const hasFundingProgress = targetValue > 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-base-300 bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out md:hover:-translate-y-0.5 md:hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-base-200">
        <button
          className={[
            "btn btn-circle btn-sm absolute right-3 top-3 z-20 shadow-sm backdrop-blur",
            isSaved
              ? "border-primary bg-primary text-white hover:bg-primary"
              : "border-white/70 bg-white/90 text-neutral hover:bg-white",
          ].join(" ")}
          onClick={() => onToggleSave(item)}
          disabled={!canSave || isSavingThis}
          aria-label={isSaved ? t("removeBookmark") : t("saveOpportunity")}
          title={!canSave ? t("saveUnavailable") : isSaved ? t("removeBookmark") : t("saveOpportunity")}
          type="button"
        >
          {isSavingThis ? (
            <Loader2 className="animate-spin" size={16} />
          ) : isSaved ? (
            <BookmarkCheck size={16} />
          ) : (
            <Bookmark size={16} />
          )}
        </button>
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <div>
            <img
              src="/brand/logo-icon-transparent.png"
              alt=""
              className="mx-auto h-12 w-12 object-contain opacity-70"
            />
            <p className="mt-3 text-sm font-bold text-neutral/50">{t("noBusinessImage")}</p>
          </div>
        </div>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={businessName(item)}
            className="relative z-10 h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black">{businessName(item)}</h3>
            <p className="mt-1 text-xs font-semibold text-neutral/55">{city(item)}</p>
          </div>
          {score > 0 ? (
            <span className="badge badge-success border-transparent text-sm font-black text-white">
              {percent(score)}
            </span>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="min-w-0 rounded-md bg-base-200 p-2.5">
            <p className="text-xs font-semibold text-neutral/55">{t("metricTarget")}</p>
            <p className="mt-1 break-words text-sm font-black leading-tight">
              {targetValue > 0 ? currency(targetValue) : "-"}
            </p>
          </div>
          <div className="min-w-0 rounded-md bg-base-200 p-2.5">
            <p className="text-xs font-semibold text-neutral/55">{t("metricReturn")}</p>
            <p className="mt-1 break-words text-sm font-black leading-tight">
              {returnValue > 0 ? percent(returnValue) : "-"}
            </p>
          </div>
        </div>

        {hasFundingProgress && fundedValue > 0 ? (
          <div className="mt-3">
            <div className="mb-2 flex justify-between text-sm font-semibold text-neutral/60">
              <span>{currency(fundedValue)}</span>
              <span>{progressValue}%</span>
            </div>
            <div className="h-2 rounded-full bg-base-200">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${progressValue}%` }} />
            </div>
          </div>
        ) : hasFundingProgress ? (
          <div className="mt-3 rounded-md bg-base-200 px-3 py-2 text-sm font-semibold text-neutral/55">
            {t("noFundingProgressYet")}
          </div>
        ) : null}
        <div className="mt-auto flex flex-col gap-3 pt-4">
          {onToggleCompare && canOpenDetail ? (
            <button
              className={[
                "btn btn-sm min-h-0 h-9 w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                compareSelected ? "btn-secondary text-white" : "btn-outline bg-white",
              ].join(" ")}
              onClick={() => onToggleCompare(item)}
              type="button"
            >
              {compareSelected ? <CheckCircle2 size={16} /> : null}
              {compareSelected ? t("selectedForCompare") : t("addToCompare")}
            </button>
          ) : null}
          {canOpenDetail ? (
            <Link
              to={`/dashboard/investor/peluang/${id}`}
              className="btn btn-primary h-12 w-full rounded-md text-base font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t("viewOpportunityDetail")}
            </Link>
          ) : (
            <button className="btn btn-disabled h-12 w-full rounded-md text-base font-black">
              {t("viewOpportunityDetail")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function CatalogGrid({
  items,
  emptyTitle = "noOpportunities",
  emptyBody = "noOpportunitiesBody",
  emptyAction,
  savedIds,
  onToggleSave,
  savingId,
  compareIds,
  onToggleCompare,
}: {
  items: Entity[];
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: ReactNode;
  savedIds: Set<string>;
  onToggleSave: (item: Entity) => void;
  savingId?: string;
  compareIds?: Set<string>;
  onToggleCompare?: (item: Entity) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState title={emptyTitle} body={emptyBody} />
        {emptyAction ? <div className="text-center">{emptyAction}</div> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <OpportunityCard
          key={opportunityId(item)}
          item={item}
          savedIds={savedIds}
          onToggleSave={onToggleSave}
          savingId={savingId}
          compareSelected={compareIds?.has(opportunityId(item))}
          onToggleCompare={onToggleCompare}
        />
      ))}
    </div>
  );
}

export function OpportunitiesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTabParam = searchParams.get("tab");
  const activeTab =
    rawTabParam === "rekomendasi" || rawTabParam === "recommendations"
      ? "recommendations"
      : "all";
  const searchParamsSnapshot = searchParams.toString();
  useEffect(() => {
    if (!rawTabParam || rawTabParam === "rekomendasi") return;
    const next = new URLSearchParams(searchParamsSnapshot);
    if (rawTabParam === "recommendations") {
      next.set("tab", "rekomendasi");
    } else {
      next.delete("tab");
    }
    setSearchParams(next, { replace: true });
  }, [rawTabParam, searchParamsSnapshot, setSearchParams]);
  const opportunitiesQuery = usePublishedOpportunities();
  const data = useMemo(
    () => opportunitiesQuery.data?.items ?? [],
    [opportunitiesQuery.data],
  );
  const { isLoading, isError, error, refetch, isFetching } = opportunitiesQuery;
  const savedState = useSavedOpportunities();
  const { saved, savedIds, toggle, savingId } = savedState;
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [minReturnInput, setMinReturnInput] = useState("0");
  const [minScore, setMinScore] = useState(0);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const minReturn = useMemo(() => clampReturnFilter(Number(minReturnInput)), [minReturnInput]);

  const recommendationsQuery = useQuery({
    queryKey: ["ai-recommendations", "marketplace", user?.id ?? "guest"],
    queryFn: async () => unwrap<unknown>((await apiClient.get("/user/investor/recommendations")).data),
    retry: false,
    enabled: Boolean(user?.id),
  });
  const businessesQuery = useQuery({
    queryKey: ["ai-recommendations", "business-covers"],
    queryFn: () => resourceApi.list(businessConfig),
    retry: false,
    enabled: activeTab === "recommendations" && Boolean(user?.id),
  });
  const refreshMutation = useMutation({
    mutationFn: async () => unwrap<unknown>((await apiClient.post("/user/investor/preferences/refresh")).data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
    },
    onError: (mutationError) => {
      toast.error(apiErrorMessage(mutationError, t("recommendationsRefreshError")));
    },
  });

  const businessById = useMemo(
    () => new Map((businessesQuery.data ?? []).map((item) => [String(item.id), item])),
    [businessesQuery.data],
  );

  const recommendations = useMemo(() => {
    let source: Entity[] = [];
    const payload = recommendationsQuery.data;
    if (Array.isArray(payload)) source = payload as Entity[];
    if (payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>).rekomendasi)) {
      source = (payload as Record<string, Entity[]>).rekomendasi;
    }

    return source.map((item) => {
      const bisnis = asEntity(item.bisnis);
      const bisnisId = textValue(readPath(item, ["bisnis.id", "bisnis_id"], ""), "");
      const fullBusiness = businessById.get(bisnisId);
      if (!fullBusiness) return item;

      const fullBusinessCovers = readPath(fullBusiness, ["covers"], "");
      const currentBusinessCovers = readPath(bisnis, ["covers"], "");
      const covers = Array.isArray(fullBusinessCovers) ? fullBusinessCovers : currentBusinessCovers;

      return {
        ...item,
        bisnis: {
          ...fullBusiness,
          ...bisnis,
          covers,
        },
        covers,
      };
    });
  }, [businessById, recommendationsQuery.data]);

  const recommendationFallback = activeTab === "recommendations" && recommendationsQuery.isError;
  const activeData = activeTab === "recommendations" && !recommendationFallback ? recommendations : data;
  const activeIsLoading =
    activeTab === "recommendations"
      ? recommendationFallback
        ? isLoading
        : recommendationsQuery.isLoading || businessesQuery.isLoading
      : isLoading;
  const activeIsError = activeTab === "all" && isError;

  const sectors = useMemo(
    () =>
      Array.from(
        activeData.reduce((options, item) => {
          const label = sector(item);
          options.set(label.toLowerCase(), label);
          return options;
        }, new Map<string, string>()),
      ).sort((first, second) => first[1].localeCompare(second[1])),
    [activeData],
  );
  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return activeData.filter((item) => {
      const matchesSearch = `${businessName(item)} ${sector(item)} ${city(item)}`.toLowerCase().includes(needle);
      const matchesSector = sectorFilter === "all" || sector(item).toLowerCase() === sectorFilter;
      const matchesReturn = returnRate(item) >= minReturn;
      const matchesScore = activeTab !== "recommendations" || matchScore(item) >= minScore;
      return matchesSearch && matchesSector && matchesReturn && matchesScore;
    });
  }, [activeData, activeTab, minReturn, minScore, search, sectorFilter]);

  const toggleCompare = (item: Entity) => {
    const id = opportunityId(item);
    if (!id) return;
    if (!compareIds.has(id) && compareIds.size >= compareSelectionLimit) {
      toast.warning(t("compareLimitMessage"), { title: t("compareLimitTitle") });
      return;
    }
    setCompareIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const compareUrl = `/dashboard/investor/compare?ids=${Array.from(compareIds).join(",")}`;
  const hasActiveFilters =
    Boolean(search.trim()) ||
    sectorFilter !== "all" ||
    minReturn > 0 ||
    (activeTab === "recommendations" && minScore > 0);
  const activeTabLabel =
    activeTab === "recommendations" ? t("recommendedForYou") : t("allOpportunities");
  const tabSummary =
    activeTab === "recommendations"
      ? t("recommendedForYouTabHint")
      : t("allOpportunitiesTabHint");
  const recommendationCount = recommendations.length;
  const allOpportunityCount = data.length;
  const recommendationTabRef = useRef<HTMLButtonElement | null>(null);
  const allTabRef = useRef<HTMLButtonElement | null>(null);
  const setTab = (tab: "all" | "recommendations") => {
    const next = new URLSearchParams(searchParams);
    if (tab === "recommendations") {
      next.set("tab", "rekomendasi");
    } else {
      next.delete("tab");
    }
    setSearchParams(next, { replace: true });
    setSearch("");
    setSectorFilter("all");
    setMinReturnInput("0");
    setMinScore(0);
  };
  const setTabAndFocus = (tab: "all" | "recommendations") => {
    setTab(tab);
    requestAnimationFrame(() => {
      const targetTab = tab === "recommendations" ? recommendationTabRef.current : allTabRef.current;
      targetTab?.focus();
    });
  };
  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setTabAndFocus(activeTab === "recommendations" ? "all" : "recommendations");
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setTabAndFocus(activeTab === "recommendations" ? "all" : "recommendations");
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setTabAndFocus("recommendations");
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setTabAndFocus("all");
    }
  };
  const clearFilters = () => {
    setSearch("");
    setSectorFilter("all");
    setMinReturnInput("0");
    setMinScore(0);
  };

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title="marketplaceOpportunitiesTitle"
        actions={
          <>
            <Link to="/dashboard/investor/saved" className="btn btn-outline rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <Bookmark size={17} />
              {t("savedCount", { count: saved.length })}
            </Link>
            {compareIds.size >= 2 ? (
              <Link to={compareUrl} className="btn btn-secondary rounded-md text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                {t("compareCount", { count: compareIds.size })}
              </Link>
            ) : (
              <button className="btn rounded-md" type="button" disabled>
                {t("compareCount", { count: compareIds.size })}
              </button>
            )}
          </>
        }
      />

      <div className="rounded-md border border-base-300 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div
              role="tablist"
              aria-orientation="horizontal"
              aria-label={t("marketplaceTablistLabel")}
              className="grid w-full gap-2 sm:grid-cols-2"
              onKeyDown={handleTabKeyDown}
            >
              <button
                ref={recommendationTabRef}
                id="marketplace-tab-recommendations"
                role="tab"
                type="button"
                aria-selected={activeTab === "recommendations"}
                aria-controls="marketplace-panel"
                tabIndex={activeTab === "recommendations" ? 0 : -1}
                className={[
                  "btn h-auto min-h-[3rem] justify-between rounded-md px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  activeTab === "recommendations"
                    ? "btn-primary text-white"
                    : "btn-ghost border border-base-300",
                ].join(" ")}
                onClick={() => setTab("recommendations")}
              >
                <span className="flex items-center gap-2 font-bold">
                  <Sparkles size={17} />
                  {t("recommendedForYou")}
                </span>
                <span
                  className={[
                    "badge badge-sm",
                    activeTab === "recommendations"
                      ? "border-white/30 bg-white/20 text-white"
                      : "badge-ghost",
                  ].join(" ")}
                >
                  {recommendationCount}
                </span>
              </button>
              <button
                ref={allTabRef}
                id="marketplace-tab-all"
                role="tab"
                type="button"
                aria-selected={activeTab === "all"}
                aria-controls="marketplace-panel"
                tabIndex={activeTab === "all" ? 0 : -1}
                className={[
                  "btn h-auto min-h-[3rem] justify-between rounded-md px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  activeTab === "all"
                    ? "btn-primary text-white"
                    : "btn-ghost border border-base-300",
                ].join(" ")}
                onClick={() => setTab("all")}
              >
                <span className="flex items-center gap-2 font-bold">
                  <ClipboardCheck size={17} />
                  {t("allOpportunities")}
                </span>
                <span
                  className={[
                    "badge badge-sm",
                    activeTab === "all"
                      ? "border-white/30 bg-white/20 text-white"
                      : "badge-ghost",
                  ].join(" ")}
                >
                  {allOpportunityCount}
                </span>
              </button>
            </div>
            <p className="mt-2 text-xs font-semibold text-neutral/55">{tabSummary}</p>
            <p className="sr-only" aria-live="polite">
              {t("marketplaceResultsCount", {
                count: filtered.length,
                mode: activeTabLabel,
              })}
            </p>
          </div>
          {activeTab === "recommendations" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/dashboard/investor/preferensi" className="btn btn-outline rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                {t("improveRecommendations")}
              </Link>
              <button
                className="btn btn-primary rounded-md text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                type="button"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
              >
                {refreshMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
                {t("refresh")}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div
        id="marketplace-panel"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={activeTab === "recommendations" ? "marketplace-tab-recommendations" : "marketplace-tab-all"}
        className="space-y-5"
      >
      <div className="rounded-md border border-base-300 bg-white p-4 shadow-sm">
        <div className={`grid gap-3 ${activeTab === "recommendations" ? "lg:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr]" : "lg:grid-cols-[1.2fr_0.8fr_0.7fr]"}`}>
          <label className="input input-bordered flex items-center gap-2 rounded-md focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
            <Search size={17} className="text-neutral/40" />
            <input
              className="w-full min-w-0 bg-transparent outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchUmkmSectorCity")}
              aria-label={t("searchUmkmSectorCity")}
            />
          </label>
          <label className="flex h-12 items-center gap-2 rounded-md border border-base-300 px-3 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
            <Filter size={17} className="text-neutral/45" />
            <select
              className="w-full bg-transparent outline-none"
              value={sectorFilter}
              onChange={(event) => setSectorFilter(event.target.value)}
              aria-label={t("allSectors")}
            >
              <option value="all">{t("allSectors")}</option>
              {sectors.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="input input-bordered flex items-center gap-2 rounded-md focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
            <span className="text-sm font-bold">{t("metricReturn")}</span>
            <input
              className="w-14 outline-none"
              type="number"
              min={0}
              max={100}
              value={minReturnInput}
              onBlur={(event) => setMinReturnInput(String(clampReturnFilter(Number(event.target.value))))}
              onChange={(event) => setMinReturnInput(event.target.value)}
              aria-label={t("minReturnFilter")}
            />
            <span className="text-sm font-bold">%</span>
          </label>
          {activeTab === "recommendations" ? (
            <label className="input input-bordered flex items-center gap-2 rounded-md focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
              <span className="text-sm font-bold">{t("minScore")}</span>
              <input
                className="w-14 outline-none"
                type="number"
                min={0}
                max={100}
                value={minScore}
                onBlur={(event) => setMinScore(clampReturnFilter(Number(event.target.value)))}
                onChange={(event) => setMinScore(Number(event.target.value))}
                aria-label={t("minScore")}
              />
              <span className="text-sm font-bold">%</span>
            </label>
          ) : null}
        </div>
      </div>

      {activeIsLoading ? (
        <CardSkeletonGrid count={6} />
      ) : null}
      {activeIsError ? (
        <div className="flex flex-col gap-3 rounded-md border border-error/20 bg-error/10 p-4 text-sm font-semibold text-error sm:flex-row sm:items-center sm:justify-between">
          <span>{apiErrorMessage(error, t("loadOpportunitiesError"))}</span>
          <button
            className="btn btn-error btn-sm rounded-md text-white"
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {t("tryAgain")}
          </button>
        </div>
      ) : null}
      {recommendationFallback ? (
        <div className="flex flex-col gap-3 rounded-md border border-warning/20 bg-warning/10 p-4 text-sm font-semibold text-warning-content sm:flex-row sm:items-center sm:justify-between">
          <span>{apiErrorMessage(recommendationsQuery.error, t("recommendationsFallbackBody"))}</span>
          <button className="btn btn-warning btn-sm rounded-md" type="button" onClick={() => setTab("all")}>
            {t("viewAllOpportunities")}
          </button>
        </div>
      ) : null}
      {savedState.isError ? (
        <div className="rounded-md border border-warning/20 bg-warning/10 p-4 text-sm font-semibold text-warning">
          {apiErrorMessage(savedState.error, t("bookmarkLoadError"))}
        </div>
      ) : null}
      {!activeIsLoading && !activeIsError ? (
        <CatalogGrid
          items={filtered}
          emptyTitle={
            activeData.length > 0 && hasActiveFilters
              ? "noFilteredOpportunities"
              : activeTab === "recommendations"
                ? "noRecommendations"
                : "noOpportunities"
          }
          emptyBody={
            activeData.length > 0 && hasActiveFilters
              ? "noFilteredOpportunitiesBody"
              : activeTab === "recommendations"
                ? "noRecommendationsBody"
                : "noOpportunitiesBody"
          }
          emptyAction={
            activeData.length > 0 && hasActiveFilters ? (
              <button className="btn btn-outline rounded-md" type="button" onClick={clearFilters}>
                {t("clearFilters")}
              </button>
            ) : activeTab === "recommendations" ? (
              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                <Link to="/dashboard/investor/preferensi" className="btn btn-primary rounded-md text-white">
                  {t("startSurvey")}
                </Link>
                <button className="btn btn-outline rounded-md" type="button" onClick={() => setTab("all")}>
                  {t("viewAllOpportunities")}
                </button>
              </div>
            ) : (
              <button
                className="btn btn-outline rounded-md"
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {isFetching ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                {t("refresh")}
              </button>
            )
          }
          savedIds={savedIds}
          onToggleSave={toggle}
          savingId={savingId}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
        />
      ) : null}
      {activeTab === "all" && !isLoading && !isError && opportunitiesQuery.data?.reachedFetchLimit ? (
        <div className="rounded-md border border-warning/20 bg-warning/10 p-4 text-sm font-semibold text-warning">
          {t("opportunityFetchLimitWarning")}
        </div>
      ) : null}
      </div>
    </section>
  );
}

export function SavedOpportunitiesPage() {
  const { t } = useLanguage();
  const opportunitiesQuery = usePublishedOpportunities();
  const savedState = useSavedOpportunities();
  const { saved, savedIds, toggle, savingId } = savedState;
  const opportunities = useMemo(
    () => opportunitiesQuery.data?.items ?? [],
    [opportunitiesQuery.data],
  );
  const mergedSaved = useMemo(() => {
    return saved.map((bookmark) => {
      const savedBusinessId = bookmarkKey(bookmark);
      const matchingOpportunity = opportunities.find((item) => bookmarkKey(item) === savedBusinessId);
      if (matchingOpportunity) return { ...matchingOpportunity, saved_at: bookmark.saved_at };
      return bookmark;
    });
  }, [opportunities, saved]);
  const compareAllIds = useMemo(
    () => Array.from(new Set(mergedSaved.map((item) => opportunityId(item)).filter((id) => /^\d+$/.test(id)))).slice(0, compareSelectionLimit),
    [mergedSaved],
  );
  const compareAllUrl =
    compareAllIds.length > 0
      ? `/dashboard/investor/compare?ids=${compareAllIds.join(",")}`
      : "/dashboard/investor/compare";

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title="savedOpportunitiesTitle"
        description="savedOpportunitiesBody"
        actions={
          compareAllIds.length >= 2 ? (
            <Link to={compareAllUrl} className="btn btn-secondary rounded-md text-white">
              {t("compareAll")}
            </Link>
          ) : (
            <button className="btn rounded-md" type="button" disabled>
              {t("compareAll")}
            </button>
          )
        }
      />
      {savedState.isLoading ? (
        <CardSkeletonGrid count={3} />
      ) : null}
      {savedState.isError ? (
        <div className="rounded-md border border-error/20 bg-error/10 p-4 text-sm font-semibold text-error">
          {apiErrorMessage(savedState.error, t("bookmarkLoadError"))}
        </div>
      ) : null}
      {!savedState.isLoading && !savedState.isError ? (
        <CatalogGrid
          items={mergedSaved}
          savedIds={savedIds}
          onToggleSave={toggle}
          savingId={savingId}
          emptyAction={
            <Link to="/dashboard/investor/peluang" className="btn btn-outline rounded-md">
              {t("viewAllOpportunities")}
            </Link>
          }
        />
      ) : null}
    </section>
  );
}

export function CompareOpportunitiesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedIds = useMemo(
    () => parseCompareIds(searchParams.get("ids")),
    [searchParams],
  );
  const ids = parsedIds.ids;
  const joinedIds = ids.join(",");
  const userKey = String(user?.id ?? "guest");
  const opportunitiesQuery = usePublishedOpportunities();
  const data = useMemo(
    () => opportunitiesQuery.data?.items ?? [],
    [opportunitiesQuery.data],
  );
  const savedState = useSavedOpportunities();
  const { saved } = savedState;
  const compareQuery = useQuery({
    queryKey: ["compare-opportunities", userKey, joinedIds],
    queryFn: async () => {
      const response = await apiClient.get(`/user/investor/compare?ids=${encodeURIComponent(joinedIds)}`);
      return normalizeEntityList(unwrap<unknown>(response.data));
    },
    enabled: ids.length >= 2,
    retry: false,
  });
  const source = [
    ...data,
    ...saved.map((bookmark) => {
      const savedBusinessId = bookmarkKey(bookmark);
      const matchingOpportunity = data.find((item) => bookmarkKey(item) === savedBusinessId);
      return matchingOpportunity ? { ...matchingOpportunity, saved_at: bookmark.saved_at } : bookmark;
    }),
  ];
  const unique = Array.from(
    new Map(source.map((item) => [compareItemKey(item), item])).values(),
  );
  const requestedIds = new Set(ids);
  const compared =
    compareQuery.data && compareQuery.data.length > 0
      ? compareQuery.data
      : ids.length > 0
        ? unique.filter((item) => requestedIds.has(opportunityId(item)))
        : unique.filter((item) => !item.is_bookmark_only).slice(0, compareSelectionLimit);
  const availableIds = new Set(
    compared.map((item) => opportunityId(item)).filter(Boolean),
  );
  const missingRequestedCount =
    ids.length > 0
      ? ids.filter((id) => !availableIds.has(id)).length
      : 0;
  const compareIsLoading =
    opportunitiesQuery.isLoading ||
    savedState.isLoading ||
    (ids.length >= 2 && compareQuery.isLoading);
  const removeCompared = (removedId: string) => {
    if (!removedId) return;
    const nextIds = ids.filter((id) => id !== removedId);
    const nextSearchParams = new URLSearchParams(searchParams);
    if (nextIds.length > 0) {
      nextSearchParams.set("ids", nextIds.join(","));
    } else {
      nextSearchParams.delete("ids");
    }
    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title="compareUmkmTitle"
        description="compareUmkmBody"
        actions={<Link to="/dashboard/investor/peluang" className="btn btn-outline rounded-md">{t("addOpportunity")}</Link>}
      />
      {ids.length === 1 ? (
        <div className="rounded-md border border-warning/20 bg-warning/10 p-4 text-sm font-semibold text-warning">
          {t("compareMinimumWarning")}
        </div>
      ) : null}
      {parsedIds.invalidCount + parsedIds.duplicateCount > 0 ? (
        <div className="rounded-md border border-warning/20 bg-warning/10 p-4 text-sm font-semibold text-warning">
          {t("compareInvalidIdsWarning", { count: parsedIds.invalidCount + parsedIds.duplicateCount })}
        </div>
      ) : null}
      {parsedIds.overflowCount > 0 ? (
        <div className="rounded-md border border-warning/20 bg-warning/10 p-4 text-sm font-semibold text-warning">
          {t("compareTrimmedIdsWarning", { count: compareSelectionLimit })}
        </div>
      ) : null}
      {compareQuery.isError ? (
        <div className="rounded-md border border-warning/20 bg-warning/10 p-4 text-sm font-semibold text-warning">
          {apiErrorMessage(compareQuery.error, t("compareBackendFallback"))}
        </div>
      ) : null}
      {ids.length === 0 && compared.length > 0 ? (
        <div className="rounded-md border border-info/20 bg-info/10 p-4 text-sm font-semibold text-info">
          {t("compareAutoSelectionInfo", { count: compared.length })}
        </div>
      ) : null}
      {missingRequestedCount > 0 && !compareIsLoading ? (
        <div className="rounded-md border border-warning/20 bg-warning/10 p-4 text-sm font-semibold text-warning">
          {t("compareMissingIdsWarning", { count: missingRequestedCount })}
        </div>
      ) : null}
      {compareIsLoading ? (
        <CardSkeletonGrid count={3} />
      ) : null}
      {!compareIsLoading && compared.length === 0 ? (
        <div className="space-y-4">
          <EmptyState title="noCompareItems" body="noCompareItemsBody" />
          <div className="text-center">
            <Link to="/dashboard/investor/peluang" className="btn btn-outline rounded-md">
              {t("addOpportunity")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 md:hidden">
            {compared.map((item) => {
              const id = opportunityId(item);
              return (
                <article key={compareItemKey(item)} className="rounded-md border border-base-300 bg-white p-4 shadow-sm">
                  <h3 className="text-base font-black">{businessName(item)}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-base-200 p-2">
                      <p className="text-xs text-neutral/50">{t("sector")}</p>
                      <p className="font-semibold">{sector(item)}</p>
                    </div>
                    <div className="rounded-md bg-base-200 p-2">
                      <p className="text-xs text-neutral/50">{t("metricTarget")}</p>
                      <p className="font-semibold">{currency(target(item))}</p>
                    </div>
                    <div className="rounded-md bg-base-200 p-2">
                      <p className="text-xs text-neutral/50">{t("metricReturn")}</p>
                      <p className="font-semibold">{percent(returnRate(item))}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {id ? (
                      <Link to={`/dashboard/investor/peluang/${id}`} className="btn btn-primary btn-sm rounded-md text-white">
                        {t("detail")}
                      </Link>
                    ) : (
                      <button className="btn btn-sm rounded-md" type="button" disabled>
                        {t("detail")}
                      </button>
                    )}
                    {id ? (
                      <button className="btn btn-outline btn-sm rounded-md" type="button" onClick={() => removeCompared(id)}>
                        {t("removeFromCompare")}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-md border border-base-300 bg-white shadow-sm md:block">
            <table className="table">
              <thead>
                <tr className="bg-base-200 text-xs uppercase tracking-wide text-neutral/60">
                  <th>{t("metric")}</th>
                  {compared.map((item) => <th key={compareItemKey(item)}>{businessName(item)}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ["sector", (item: Entity) => sector(item)],
                  ["metricTarget", (item: Entity) => currency(target(item))],
                  ["funded", (item: Entity) => currency(funded(item))],
                  ["progress", (item: Entity) => `${progress(item)}%`],
                  ["metricReturn", (item: Entity) => percent(returnRate(item))],
                  ["metricMatch", (item: Entity) => (matchScore(item) ? percent(matchScore(item)) : "-")],
                ].map(([label, render]) => (
                  <tr key={String(label)}>
                    <td className="font-black">{t(String(label))}</td>
                    {compared.map((item) => (
                      <td key={`${label}-${compareItemKey(item)}`} className="font-semibold">
                        {(render as (item: Entity) => string)(item)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="font-black">{t("actions")}</td>
                  {compared.map((item) => {
                    const id = opportunityId(item);
                    return (
                      <td key={`action-${compareItemKey(item)}`}>
                        <div className="flex flex-wrap gap-2">
                          {id ? (
                            <Link to={`/dashboard/investor/peluang/${id}`} className="btn btn-primary btn-sm rounded-md text-white">
                              {t("detail")}
                            </Link>
                          ) : (
                            <button className="btn btn-sm rounded-md" type="button" disabled>
                              {t("detail")}
                            </button>
                          )}
                          {id ? (
                            <button className="btn btn-outline btn-sm rounded-md" type="button" onClick={() => removeCompared(id)}>
                              {t("removeFromCompare")}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export function OpportunityDetailPage() {
  const { t, language } = useLanguage();
  const { id = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const opportunitiesQuery = usePublishedOpportunities();
  const data = useMemo(
    () => opportunitiesQuery.data?.items ?? [],
    [opportunitiesQuery.data],
  );
  const { savedIds, toggle } = useSavedOpportunities();
  const detailQuery = useQuery({
    queryKey: ["opportunity-detail", id, user?.role ?? "guest"],
    queryFn: async () => {
      const detailResponse = await apiClient.get(`/businesses/proposals/${encodeURIComponent(id)}`);
      const detailItem = asEntity(unwrap<unknown>(detailResponse.data));
      const detailBusinessId = textValue(
        readPath(detailItem, ["bisnis.id", "bisnis_id"], ""),
        "",
      );
      if (!detailBusinessId) return detailItem;

      let fullBusiness: Entity | null = null;
      try {
        const businessResponse = await apiClient.get(`/businesses/${encodeURIComponent(detailBusinessId)}`);
        fullBusiness = asEntity(unwrap<unknown>(businessResponse.data));
      } catch {
        fullBusiness = null;
      }

      if (!fullBusiness) {
        const searchName = textValue(
          readPath(detailItem, ["bisnis.nama_bisnis", "bisnis_nama"], ""),
          "",
        );
        const searchQuery = searchName
          ? `&search=${encodeURIComponent(searchName)}`
          : "";
        const businesses = await resourceApi
          .list({
            ...businessConfig,
            listPath: `/businesses?page=1&limit=${businessLookupLimit}${searchQuery}`,
          })
          .catch(() => [] as Entity[]);
        fullBusiness =
          businesses.find((item) => String(item.id) === detailBusinessId) ?? null;
      }

      if (!fullBusiness) return detailItem;

      const businessById = new Map<string, Entity>([
        [detailBusinessId, fullBusiness],
      ]);
      return mergeOpportunityBusiness(detailItem, businessById);
    },
    enabled: Boolean(id),
    retry: false,
  });
  const listOpportunity = data.find((item) => opportunityId(item) === id);
  const opportunity = detailQuery.data ?? listOpportunity;
  const isLoading = !opportunity && (detailQuery.isLoading || opportunitiesQuery.isLoading);
  const opportunityBusinessId = opportunity ? bookmarkKey(opportunity) : "";
  const [form, setForm] = useState({
    penawaran_nominal: "",
    penawaran_return: "",
    catatan: "",
  });
  const nominalFormatter = useMemo(
    () =>
      new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
      }),
    [],
  );
  const quickNominalOptions = useMemo(() => [10_000_000, 50_000_000, 100_000_000], []);
  const parseNominalDigits = (value: string) => value.replace(/\D+/g, "");
  const formatNominalInput = (value: string) => {
    const digits = parseNominalDigits(value);
    if (!digits) return "";
    return nominalFormatter.format(Number(digits));
  };
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const nominalValue = Number(parseNominalDigits(form.penawaran_nominal));
  const returnValue = Number(String(form.penawaran_return).replace(",", "."));
  const canSubmitNegotiation =
    /^\d+$/.test(id) &&
    Number.isFinite(nominalValue) &&
    nominalValue > 0 &&
    Number.isFinite(returnValue) &&
    returnValue >= 0 &&
    returnValue <= 100;
  const bookmarkStatusQuery = useQuery({
    queryKey: ["investor-bookmark-status", opportunityBusinessId],
    queryFn: async () => {
      const response = await apiClient.get(`/user/investor/bookmarks/${opportunityBusinessId}`);
      const payload = unwrap<unknown>(response.data);
      if (payload && typeof payload === "object" && "isBookmarked" in payload) {
        return Boolean((payload as Record<string, unknown>).isBookmarked);
      }
      return false;
    },
    enabled: Boolean(opportunityBusinessId),
    retry: false,
  });

  const negotiationMutation = useMutation({
    mutationFn: async () => {
      if (!canSubmitNegotiation) {
        throw new Error(t("negotiationStartError"));
      }
      const response = await apiClient.post("/businesses/proposals/negotiations/start", {
        pengajuans_id: Number(id),
        penawaran_nominal: nominalValue,
        penawaran_return: returnValue,
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
    return <ListSkeleton rows={3} />;
  }

  if (!opportunity) {
    return (
      <section className="space-y-5">
        <MarketplaceHeader title="opportunityNotFoundTitle" description="opportunityNotFoundBody" />
        <Link to="/dashboard/investor/peluang" className="btn btn-primary rounded-md text-white">{t("backToMarketplace")}</Link>
      </section>
    );
  }

  const isSaved = bookmarkStatusQuery.data ?? savedIds.has(opportunityBusinessId);
  const detailImageSrc = businessImage(opportunity);
  const opportunityDescription = textValue(
    readPath(opportunity, ["deskripsi_peluang", "proposal.deskripsi_peluang", "deskripsi", "description"], ""),
    "",
  );
  const addressValue = textValue(readPath(opportunity, ["bisnis.alamat", "alamat"], ""), "");
  const classValue = textValue(
    readPath(opportunity, ["bisnis.kelas.nama_kelas", "bisnis.kelas", "kelas.nama_kelas", "kelas", "class_label"], ""),
    "",
  );
  const fundingPlanRaw = readPath(
    opportunity,
    ["rencana_penggunaan_dana", "proposal.rencana_penggunaan_dana"],
    "",
  );
  const fundingPlanItems = Array.isArray(fundingPlanRaw)
    ? fundingPlanRaw
        .map((item) => asEntity(item))
        .map((item) => ({
          kategori: textValue(readPath(item, ["kategori", "category", "label"], ""), ""),
          jumlah: Number(readPath(item, ["jumlah", "amount"], "0")),
        }))
        .filter((item) => item.kategori && Number.isFinite(item.jumlah) && item.jumlah > 0)
    : [];

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title={businessName(opportunity)}
        description="opportunityDetailBody"
        actions={
          <>
            <button
              className="btn btn-outline rounded-md"
              disabled={!opportunityBusinessId}
              onClick={() => {
                toggle(opportunity);
                if (opportunityBusinessId) {
                  void queryClient.invalidateQueries({
                    queryKey: ["investor-bookmark-status", opportunityBusinessId],
                  });
                }
              }}
            >
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
          <div className="relative overflow-hidden rounded-md border border-base-300 bg-base-200">
            <div className="grid h-[240px] place-items-center px-6 text-center sm:h-[320px]">
              <div>
                <img
                  src="/brand/logo-icon-transparent.png"
                  alt=""
                  className="mx-auto h-14 w-14 object-contain opacity-70"
                />
                <p className="mt-3 text-sm font-bold text-neutral/50">{t("noBusinessImage")}</p>
              </div>
            </div>
            {detailImageSrc ? (
              <img
                src={detailImageSrc}
                alt={businessName(opportunity)}
                className="absolute inset-0 z-10 h-[240px] w-full object-cover sm:h-[320px]"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
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
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-base-300 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">{t(label)}</p>
                <p className="mt-2 font-black">{value}</p>
              </div>
            ))}
          </div>
          {(addressValue || classValue) ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {addressValue ? (
                <div className="rounded-md border border-base-300 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">Alamat</p>
                  <p className="mt-2 text-sm font-semibold text-neutral/80">{addressValue}</p>
                </div>
              ) : null}
              {classValue ? (
                <div className="rounded-md border border-base-300 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">Kelas</p>
                  <p className="mt-2 text-sm font-semibold text-neutral/80">{classValue}</p>
                </div>
              ) : null}
            </div>
          ) : null}
          {opportunityDescription ? (
            <div className="mt-6 rounded-md border border-base-300 p-5">
              <h3 className="font-black">{language === "id" ? "Deskripsi peluang" : "Opportunity description"}</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral/75">{opportunityDescription}</p>
            </div>
          ) : null}
          {fundingPlanItems.length > 0 ? (
            <div className="mt-4 rounded-md border border-base-300 p-5">
              <h3 className="font-black">
                {language === "id" ? "Rencana penggunaan dana" : "Fund usage plan"}
              </h3>
              <div className="mt-3 grid gap-2">
                {fundingPlanItems.map((plan, index) => (
                  <div
                    key={`${plan.kategori}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-md bg-base-200 px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-neutral/80">{plan.kategori}</p>
                    <p className="text-sm font-black">{currency(plan.jumlah)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
              <div className="input input-bordered flex items-center gap-2 rounded-md">
                <span className="text-sm font-bold text-neutral/50">IDR</span>
                <input
                  className="w-full min-w-0 bg-transparent outline-none"
                  type="text"
                  required
                  inputMode="numeric"
                  placeholder={t("offerNominalPlaceholder")}
                  value={form.penawaran_nominal}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      penawaran_nominal: formatNominalInput(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {quickNominalOptions.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="btn btn-xs rounded-md border border-base-300 bg-base-100 px-3 font-semibold text-neutral hover:border-base-content/20"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        penawaran_nominal: nominalFormatter.format(amount),
                      }))
                    }
                  >
                    {compactCurrency(amount)}
                  </button>
                ))}
              </div>
              <span className="mt-2 text-xs text-neutral/55">
                {t("offerNominalHint")}
              </span>
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("offerReturn")}</span>
              <div className="input input-bordered flex items-center gap-2 rounded-md">
                <input
                  className="w-full min-w-0 bg-transparent outline-none"
                  type="number"
                  required
                  min={0}
                  max={100}
                  step={0.1}
                  inputMode="decimal"
                  placeholder={t("offerReturnPlaceholder")}
                  value={form.penawaran_return}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      penawaran_return: event.target.value,
                    }))
                  }
                />
                <span className="text-sm font-bold text-neutral/50">%</span>
              </div>
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("notes")}</span>
              <textarea
                className="textarea textarea-bordered min-h-28 rounded-md"
                placeholder={t("notesPlaceholder")}
                value={form.catatan}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    catatan: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <button
            className="btn btn-primary mt-5 w-full rounded-md text-white"
            disabled={negotiationMutation.isPending || !canSubmitNegotiation}
          >
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

export function AdminReviewQueuePage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [documentRejectTarget, setDocumentRejectTarget] = useState<Entity | null>(null);
  const [documentRejectNote, setDocumentRejectNote] = useState("");
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
  const documentsQuery = useQuery({
    queryKey: ["admin-review-queue", "documents"],
    queryFn: async () => {
      const response = await apiClient.get("/businesses/documents/pending");
      const payload = unwrap<unknown>(response.data);
      if (Array.isArray(payload)) return payload as Entity[];
      if (payload && typeof payload === "object") {
        const objectPayload = payload as Record<string, unknown>;
        if (Array.isArray(objectPayload.dokumen)) return objectPayload.dokumen as Entity[];
      }
      return [];
    },
    retry: false,
  });
  const documentReviewMutation = useMutation({
    mutationFn: async ({
      item,
      status,
      note,
    }: {
      item: Entity;
      status: "valid" | "invalid";
      note?: string;
    }) => {
      const response = await apiClient.patch(`/businesses/documents/${item.id}/review`, {
        status,
        ...(status === "invalid" ? { catatan: note } : {}),
      });
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-review-queue", "documents"] });
    },
  });
  const verifyBusinessMutation = useMutation({
    mutationFn: async (bisnisId: string | number) => {
      const response = await apiClient.patch(`/businesses/documents/${bisnisId}/verify`);
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-review-queue", "documents"] });
    },
  });
  const pendingDocuments = documentsQuery.data ?? [];

  return (
    <section className="space-y-5">
      <MarketplaceHeader
        title="adminReviewQueueTitle"
        description="adminReviewQueueBody"
        actions={<Link to="/dashboard/admin/pengajuan" className="btn btn-outline rounded-md">{t("viewAllSubmissions")}</Link>}
      />
      {isLoading ? <ListSkeleton rows={4} /> : null}
      {isError ? (
        <div className="rounded-md border border-error/20 bg-error/10 p-4 text-sm font-semibold text-error">
          {apiErrorMessage(error, t("loadReviewQueueError"))}
        </div>
      ) : null}
      {!isLoading && !isError && reviewItems.length === 0 ? (
        <EmptyState title="noPendingSubmissions" body="noPendingSubmissionsBody" icon={ClipboardCheck} />
      ) : null}
      <div className="grid gap-4">
        {reviewItems.map((item) => (
          <article key={item.id} className="rounded-md border border-base-300 bg-white p-5 shadow-sm transition-[transform,box-shadow] duration-200 ease-out md:hover:-translate-y-0.5 md:hover:shadow-md">
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
      <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-black">Review dokumen UMKM</h3>
          <span className="badge badge-neutral text-white">{pendingDocuments.length}</span>
        </div>
        {documentsQuery.isLoading ? <ListSkeleton rows={3} /> : null}
        {documentsQuery.isError ? (
          <div className="mt-4 rounded-md border border-error/20 bg-error/10 p-4 text-sm font-semibold text-error">
            {apiErrorMessage(documentsQuery.error, "Gagal memuat dokumen pending.")}
          </div>
        ) : null}
        {!documentsQuery.isLoading && !documentsQuery.isError && pendingDocuments.length === 0 ? (
          <div className="mt-4 rounded-md border border-base-300 bg-base-100 p-4 text-sm font-semibold text-neutral/60">
            Tidak ada dokumen pending.
          </div>
        ) : null}
        <div className="mt-4 grid gap-3">
          {pendingDocuments.map((item) => (
            <article key={String(item.id)} className="rounded-md border border-base-300 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-black">
                    {textValue(item.nama_bisnis)} - {textValue(item.nama_dokumen)}
                  </p>
                  <p className="mt-1 text-sm text-neutral/55">
                    {textValue(item.jenis_dokumen)} - #{textValue(item.bisnis_id)} -{" "}
                    {dateShort(item.updated_at || item.created_at)}
                  </p>
                  {item.file_url ? (
                    <a
                      href={String(item.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline"
                    >
                      Lihat file
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    className="btn btn-success rounded-md text-white"
                    disabled={documentReviewMutation.isPending}
                    onClick={() => documentReviewMutation.mutate({ item, status: "valid" })}
                  >
                    <CheckCircle2 size={17} />
                    Validasi
                  </button>
                  <button
                    className="btn btn-error rounded-md text-white"
                    disabled={documentReviewMutation.isPending}
                    onClick={() => {
                      setDocumentRejectTarget(item);
                      setDocumentRejectNote("");
                    }}
                  >
                    <XCircle size={17} />
                    Tolak
                  </button>
                  <button
                    className="btn btn-outline rounded-md"
                    disabled={verifyBusinessMutation.isPending}
                    onClick={() => verifyBusinessMutation.mutate(String(item.bisnis_id))}
                  >
                    Verifikasi Bisnis
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      {documentRejectTarget ? (
        <div className="modal modal-open">
          <div className="modal-box fr-modal-panel max-w-lg rounded-md">
            <h3 className="text-xl font-black text-neutral">Catatan penolakan dokumen</h3>
            <p className="mt-2 text-sm leading-6 text-neutral/60">
              {textValue(documentRejectTarget.nama_bisnis)} - {textValue(documentRejectTarget.nama_dokumen)}
            </p>
            <label className="form-control mt-5">
              <span className="label-text mb-2 font-semibold">Alasan penolakan</span>
              <textarea
                className="textarea textarea-bordered min-h-32 rounded-md bg-white"
                value={documentRejectNote}
                onChange={(event) => setDocumentRejectNote(event.target.value)}
                placeholder="Contoh: dokumen kurang jelas atau data tidak sesuai."
                autoFocus
              />
            </label>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-outline rounded-md"
                disabled={documentReviewMutation.isPending}
                onClick={() => {
                  setDocumentRejectTarget(null);
                  setDocumentRejectNote("");
                }}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-error rounded-md text-white"
                disabled={documentReviewMutation.isPending || !documentRejectNote.trim()}
                onClick={() => {
                  if (!documentRejectTarget || !documentRejectNote.trim()) return;
                  documentReviewMutation.mutate(
                    {
                      item: documentRejectTarget,
                      status: "invalid",
                      note: documentRejectNote.trim(),
                    },
                    {
                      onSuccess: () => {
                        setDocumentRejectTarget(null);
                        setDocumentRejectNote("");
                      },
                    },
                  );
                }}
              >
                {documentReviewMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <XCircle size={17} />}
                Tolak Dokumen
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop fr-modal-backdrop"
            onClick={() => {
              setDocumentRejectTarget(null);
              setDocumentRejectNote("");
            }}
            aria-label="Tutup modal"
          />
        </div>
      ) : null}
    </section>
  );
}
