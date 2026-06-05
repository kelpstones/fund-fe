import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  Handshake,
  Lock,
  Receipt,
  Rocket,
  Scale,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { EmptyState } from "../../components/EmptyState";
import { ListSkeleton } from "../../components/PageSkeleton";
import { DashboardBreadcrumb } from "../../components/DashboardBreadcrumb";
import { directApi } from "../../lib/api/direct";
import { resourceApi } from "../../lib/api/resources";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import {
  adminConfig,
  businessConfig,
  investorInvestmentConfig,
  investorInvoiceConfig,
  investorProfitConfig,
  myBusinessConfig,
  myNegotiationConfig,
  notificationConfig,
  salesConfig,
  submissionConfig,
  userManagementConfig,
} from "../../lib/resourceConfigs";
import { compactCurrency, currency, percent, readPath, statusTone, textValue } from "../../lib/format";
import type { Entity, ResourceConfig } from "../../types";

const useResource = (config: ResourceConfig<Entity>, scopeKey?: string) =>
  useQuery({
    queryKey: ["overview", scopeKey ?? "anonymous", config.key],
    queryFn: () => resourceApi.list(config),
    enabled: Boolean(scopeKey),
    retry: false,
  });

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asEntity = (value: unknown): Entity =>
  value && typeof value === "object" ? (value as Entity) : { id: "" };
const asRecommendationArray = (value: unknown): Entity[] => {
  if (Array.isArray(value)) return value as Entity[];
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    if (Array.isArray(objectValue.rekomendasi)) return objectValue.rekomendasi as Entity[];
    if (Array.isArray(objectValue.items)) return objectValue.items as Entity[];
    if (Array.isArray(objectValue.results)) return objectValue.results as Entity[];
    if (Array.isArray(objectValue.data)) return objectValue.data as Entity[];
    if ("id" in objectValue || "pengajuan_id" in objectValue) return [objectValue as Entity];
  }
  return [];
};
const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const readNumberPath = (item: Entity, paths: string[]) =>
  toNumber(readPath(item, paths, "__missing__"));
const proposalIdPaths = ["pengajuan_id", "proposal_id", "pengajuan.id", "pengajuans_id", "id"];
const businessIdPaths = ["bisnis.id", "bisnis_id"];
const targetValuePaths = [
  "target_pendanaan",
  "target",
  "bisnis.target_pendanaan",
  "pengajuan.target_pendanaan",
  "proposal.target_pendanaan",
];
const returnValuePaths = [
  "per_anual_return",
  "return",
  "return_investasi",
  "pengajuan.per_anual_return",
  "proposal.per_anual_return",
];
const fundedValuePaths = [
  "total_pendanaan",
  "terkumpul",
  "pengajuan.total_pendanaan",
  "proposal.total_pendanaan",
];
const entityTimestamp = (item: Entity) => {
  const updatedAt = new Date(String(readPath(item, ["updated_at"], ""))).getTime();
  if (Number.isFinite(updatedAt)) return updatedAt;
  const createdAt = new Date(String(readPath(item, ["created_at"], ""))).getTime();
  return Number.isFinite(createdAt) ? createdAt : 0;
};
const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const toTitleWords = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
const mergeBusinessForImage = (item: Entity, businessById: Map<string, Entity>) => {
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
      .map((cover) => (cover && typeof cover === "object" ? (cover as Entity) : ({ id: "" } as Entity)))
      .sort((first, second) => Number(first.urutan || 0) - Number(second.urutan || 0))[0];
    const coverUrl = textValue(readPath(firstCover ?? { id: "" }, ["image_url", "url"], ""), "");
    if (coverUrl) return coverUrl;
  }
  return "";
};

type OverviewStep = {
  key: string;
  titleKey: string;
  helperKey: string;
  href: string;
  done: boolean;
  locked?: boolean;
  helperParams?: Record<string, string | number>;
};

type OverviewBannerItem = {
  key: string;
  to: string;
  imageSrc?: string;
  imageMobileSrc?: string;
  imageDesktopSrc?: string;
  title: string;
  body?: string;
  priority?: number;
  icon?: typeof Bell;
};

type NextAction = {
  titleKey: string;
  bodyKey: string;
  buttonKey: string;
  href: string;
  icon?: typeof Rocket;
};

type ViewportVariant = "mobile" | "tablet" | "desktop";

const overviewBannerBasePath = (language: "id" | "en") =>
  language === "en" ? "/images/overview-banners/en" : "/images/overview-banners";

const resolveViewportVariant = (width: number): ViewportVariant => {
  if (width < 768) return "mobile";
  if (width >= 1280) return "desktop";
  return "tablet";
};

function useViewportVariant() {
  const [variant, setVariant] = useState<ViewportVariant>(() =>
    typeof window === "undefined" ? "desktop" : resolveViewportVariant(window.innerWidth),
  );

  useEffect(() => {
    const handleResize = () => {
      setVariant(resolveViewportVariant(window.innerWidth));
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return variant;
}

function PageHeader({
  title,
}: {
  title: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-normal text-neutral">{t(title)}</h2>
          <DashboardBreadcrumb />
        </div>
      </div>
    </div>
  );
}

function OverviewBannerRail({ items }: { items: OverviewBannerItem[] }) {
  const visible = useMemo(
    () => [...items].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
    [items],
  );
  const viewportVariant = useViewportVariant();
  const bannerAspectClass =
    viewportVariant === "mobile"
      ? "aspect-[3/1]"
      : viewportVariant === "desktop"
        ? "aspect-[5/1]"
        : "aspect-[4/1]";
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const lastNavAtRef = useRef(0);
  const currentIndex = visible.length > 0 ? activeIndex % visible.length : 0;

  useEffect(() => {
    if (visible.length <= 1 || paused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % visible.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [paused, visible.length]);

  if (visible.length === 0) {
    return null;
  }

  const canNavigate = () => {
    const now = Date.now();
    if (now - lastNavAtRef.current < 180) return false;
    lastNavAtRef.current = now;
    return true;
  };

  const prevSlide = () => {
    if (!canNavigate()) return;
    setActiveIndex((prev) => (prev - 1 + visible.length) % visible.length);
  };

  const nextSlide = () => {
    if (!canNavigate()) return;
    setActiveIndex((prev) => (prev + 1) % visible.length);
  };

  return (
    <div
      className="rounded-md border border-base-300 bg-white p-2 shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-md border border-base-300 bg-base-100">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
        {visible.map((item) => (
          <div key={item.key} className="w-full shrink-0">
            <Link to={item.to} className="group block">
              <div className={bannerAspectClass}>
                {item.imageSrc ? (
                  <img
                    src={
                      viewportVariant === "mobile"
                        ? item.imageMobileSrc || item.imageSrc || item.imageDesktopSrc
                        : viewportVariant === "desktop"
                          ? item.imageDesktopSrc || item.imageSrc || item.imageMobileSrc
                          : item.imageSrc || item.imageDesktopSrc || item.imageMobileSrc
                    }
                    alt={item.title}
                    loading="lazy"
                    className="block h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-between gap-4 bg-neutral px-6 text-neutral-content">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black sm:text-base">{item.title}</p>
                      {item.body ? (
                        <p className="mt-1 text-xs text-neutral-content/75 sm:text-sm">{item.body}</p>
                      ) : null}
                    </div>
                    {item.icon ? <item.icon className="shrink-0 text-neutral-content/80" size={22} /> : null}
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
        </div>
        {visible.length > 1 ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                prevSlide();
              }}
              className="btn btn-circle btn-sm absolute left-3 top-1/2 z-20 -translate-y-1/2 border border-white/40 bg-black/45 text-white hover:bg-black/60 touch-manipulation"
              aria-label="Previous banner"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                nextSlide();
              }}
              className="btn btn-circle btn-sm absolute right-3 top-1/2 z-20 -translate-y-1/2 border border-white/40 bg-black/45 text-white hover:bg-black/60 touch-manipulation"
              aria-label="Next banner"
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : null}
      </div>
      {visible.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {visible.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to banner ${index + 1}`}
              className={[
                "h-1.5 rounded-full transition-all",
                index === currentIndex ? "w-6 bg-primary" : "w-2 bg-base-300 hover:bg-base-content/25",
              ].join(" ")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MatchList({
  submissions,
  isLoading = false,
  isFallback = false,
}: {
  submissions: Entity[];
  isLoading?: boolean;
  isFallback?: boolean;
}) {
  const { t, language } = useLanguage();
  const items = useMemo(
    () =>
      submissions
        .map((item) => {
          const proposalId = textValue(
            readPath(item, proposalIdPaths, ""),
            "",
          );
          const rawName = textValue(
            readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "bisnis_nama", "nama", "business_name"], ""),
            "",
          );
          const businessName =
            rawName ||
            (proposalId
              ? `${language === "id" ? "Peluang UMKM" : "UMKM Opportunity"} #${proposalId}`
              : language === "id"
                ? "Peluang UMKM"
                : "UMKM Opportunity");
          const sector = textValue(readPath(item, ["bisnis.tipe_usaha", "tipe_usaha", "sektor"], ""), "");
          const city = textValue(readPath(item, ["bisnis.kota", "kota"], ""), "");
          const subtitle = [sector ? toTitleWords(sector) : "", city].filter(Boolean).join(" - ");
          const scoreValue = readNumberPath(item, ["match_score", "skor_kecocokan"]);
          const score = scoreValue !== null && scoreValue > 0 ? clampPercent(scoreValue) : null;
          const returnValue = readNumberPath(item, returnValuePaths);
          const targetValue = readNumberPath(item, targetValuePaths);
          const fundedValue = readNumberPath(item, fundedValuePaths);
          const hasFundingProgress =
            targetValue !== null &&
            targetValue > 0 &&
            fundedValue !== null &&
            fundedValue >= 0;
          const progress = hasFundingProgress
            ? clampPercent(Math.round((fundedValue / Math.max(targetValue, 1)) * 100))
            : null;
          const cardKey =
            proposalId ||
            textValue(readPath(item, ["id", "bisnis.id"], ""), "");
          return {
            id: cardKey,
            businessName,
            subtitle,
            score,
            returnValue,
            hasFundingProgress,
            fundedValue: fundedValue ?? 0,
            targetValue: targetValue ?? 0,
            progress,
            detailHref: proposalId ? `/dashboard/investor/peluang/${proposalId}` : "/dashboard/investor/peluang",
            imageSrc: businessImage(item),
          };
        })
        .sort((first, second) => {
          const firstScore = first.score ?? -1;
          const secondScore = second.score ?? -1;
          return secondScore - firstScore;
        }),
    [language, submissions],
  );

  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-black">{t("aiMatchScore")}</h3>
          {isFallback ? (
            <p className="mt-1 text-xs font-semibold text-neutral/55">
              {language === "id"
                ? "Rekomendasi AI belum lengkap. Menampilkan peluang umum terlebih dahulu."
                : "AI recommendations are not fully available yet. Showing general opportunities first."}
            </p>
          ) : null}
        </div>
        <Link to="/dashboard/investor/peluang" className="btn btn-outline btn-sm rounded-md">
          {t("investorNextOpportunityButton")}
        </Link>
      </div>
      <div className="mt-5">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <article
                key={`match-loading-${index}`}
                className="overflow-hidden rounded-md border border-base-300 bg-white shadow-sm"
              >
                <div className="skeleton h-52 w-full" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="skeleton h-5 w-4/5 rounded-md" />
                      <div className="skeleton h-4 w-3/5 rounded-md" />
                    </div>
                    <div className="skeleton h-8 w-16 rounded-md" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="skeleton h-16 rounded-md" />
                    <div className="skeleton h-16 rounded-md" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="skeleton h-3 w-full rounded-full" />
                    <div className="skeleton h-10 w-full rounded-md" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {!isLoading && items.length === 0 ? (
          <EmptyState title="dataUnavailable" body="matchDataEmpty" compact icon={Scale} />
        ) : null}
        {!isLoading && items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.slice(0, 3).map((item) => {
              const returnLabel =
                item.returnValue !== null && item.returnValue > 0
                  ? percent(item.returnValue)
                  : "-";
              const targetLabel =
                item.targetValue > 0
                  ? currency(item.targetValue)
                  : "-";
              return (
                <article
                  key={item.id}
                  className="flex h-full flex-col overflow-hidden rounded-md border border-base-300 bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out md:hover:-translate-y-0.5 md:hover:shadow-md"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-base-200">
                    {item.imageSrc ? (
                      <img
                        src={item.imageSrc}
                        alt={item.businessName}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = "/brand/logo-horizontal-transparent.png";
                          event.currentTarget.className = "h-full w-full object-contain p-8 opacity-70";
                        }}
                      />
                    ) : (
                      <div className="grid h-full place-items-center px-6 text-center">
                        <div>
                          <img
                            src="/brand/logo-icon-transparent.png"
                            alt=""
                            className="mx-auto h-12 w-12 object-contain opacity-70"
                          />
                          <p className="mt-3 text-sm font-bold text-neutral/50">{t("noBusinessImage")}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-black">{item.businessName}</h3>
                        <p className="mt-1 text-xs font-semibold text-neutral/55">
                          {item.subtitle || (language === "id" ? "Data bisnis aktif" : "Active business data")}
                        </p>
                      </div>
                      {item.score !== null && item.score > 0 ? (
                        <span className="badge badge-success border-transparent text-sm font-black text-white">
                          {percent(item.score)}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="min-w-0 rounded-md bg-base-200 p-2.5">
                        <p className="text-xs font-semibold text-neutral/55">{t("metricTarget")}</p>
                        <p className="mt-1 break-words text-sm font-black leading-tight">{targetLabel}</p>
                      </div>
                      <div className="min-w-0 rounded-md bg-base-200 p-2.5">
                        <p className="text-xs font-semibold text-neutral/55">{t("metricReturn")}</p>
                        <p className="mt-1 break-words text-sm font-black leading-tight">{returnLabel}</p>
                      </div>
                    </div>

                    {item.hasFundingProgress && item.progress !== null ? (
                      <div className="mt-3">
                        <div className="mb-2 flex justify-between text-sm font-semibold text-neutral/60">
                          <span>{currency(item.fundedValue)}</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-base-200">
                          <div
                            className="h-2 rounded-full bg-primary transition-[width] duration-[420ms] ease-out"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Link to={item.detailHref} className="btn btn-primary btn-sm flex-1 rounded-md text-white">
                        {t("detail")}
                      </Link>
                      <Link to="/dashboard/investor/peluang" className="btn btn-outline btn-sm rounded-md">
                        {t("viewAllOpportunities")}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ActivityPanel({ items, isLoading = false }: { items: Entity[]; isLoading?: boolean }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black">{t("latestUpdates")}</h3>
        </div>
        <Bell className="text-primary" size={24} />
      </div>
      <div className="mt-5 grid gap-3">
        {isLoading ? <ListSkeleton rows={3} /> : null}
        {!isLoading && items.length === 0 ? (
          <EmptyState title="dataUnavailable" body="latestUpdatesEmpty" compact icon={Bell} />
        ) : null}
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-md bg-base-200 p-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-bold">{textValue(item.title || item.status || item.periode)}</p>
              <p className="mt-1 text-xs leading-5 text-neutral/55">
                {textValue(item.message || item.catatan || item.bisnis || item.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OnboardingBadge({ done, locked }: { done: boolean; locked?: boolean }) {
  const { t } = useLanguage();

  if (done) {
    return (
      <span className="badge badge-success gap-1 text-white">
        <CheckCircle2 size={12} />
        {t("done")}
      </span>
    );
  }

  if (locked) {
    return (
      <span className="badge badge-neutral gap-1">
        <Lock size={12} />
        {t("locked")}
      </span>
    );
  }

  return (
    <span className="badge badge-warning gap-1">
      <AlertCircle size={12} />
      {t("next")}
    </span>
  );
}

function OnboardingOverviewCard({
  titleKey,
  bodyKey,
  progress,
  icon: Icon,
  steps,
}: {
  titleKey: string;
  bodyKey: string;
  progress: number;
  icon?: typeof Rocket;
  steps: OverviewStep[];
}) {
  const { t } = useLanguage();

  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {Icon ? (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <Icon size={24} />
            </div>
          ) : null}
          <div>
            <h3 className="text-xl font-black">{t(titleKey)}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral/60">{t(bodyKey)}</p>
          </div>
        </div>
        <div className="flex min-w-52 flex-col gap-3">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-black text-neutral/55">
              <span>{t("progress")}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-base-200">
              <div
                className="h-2 rounded-full bg-primary transition-[width] duration-[420ms] ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {steps.map((step) => {
          const content = (
            <div
              className={[
                "flex items-start justify-between gap-4 rounded-md border border-base-300 px-3 py-2",
                step.locked
                  ? "cursor-not-allowed border-neutral/35 bg-neutral/10"
                  : "bg-white",
              ].join(" ")}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {step.locked ? <Lock size={13} className="shrink-0 text-neutral/45" /> : null}
                  <p className={step.locked ? "text-sm font-bold text-neutral/50" : "text-sm font-bold text-neutral"}>
                    {t(step.titleKey)}
                  </p>
                </div>
                <p className={step.locked ? "mt-1 text-xs text-neutral/45" : "mt-1 text-xs text-neutral/55"}>
                  {t(step.helperKey, step.helperParams)}
                </p>
              </div>
              <OnboardingBadge done={step.done} locked={step.locked} />
            </div>
          );

          if (step.locked) {
            return (
              <div key={step.key} aria-disabled title={t("locked")}>
                {content}
              </div>
            );
          }

          return (
            <Link key={step.key} to={step.href} className="transition hover:-translate-y-0.5">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NextActionCard({ action }: { action: NextAction }) {
  const { t } = useLanguage();
  const Icon = action.icon ?? Rocket;

  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon size={24} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-primary">
              {t("investorNextActionLabel")}
            </p>
            <h3 className="mt-1 text-2xl font-black text-neutral">{t(action.titleKey)}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">{t(action.bodyKey)}</p>
          </div>
        </div>
        <Link to={action.href} className="btn btn-primary rounded-md text-white md:min-w-44">
          {t(action.buttonKey)}
        </Link>
      </div>
    </div>
  );
}

export function UmkmOverviewPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const bannerBasePath = overviewBannerBasePath(language);
  const scopeKey = user?.id ? String(user.id) : undefined;

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-umkm", scopeKey],
    queryFn: () => directApi.get("/dashboard/umkm"),
    enabled: Boolean(scopeKey),
  });
  const dbData = asRecord(dashboardQuery.data);

  const businessesQuery = useResource(myBusinessConfig, scopeKey);
  const submissionsQuery = useResource(submissionConfig, scopeKey);
  const negotiationsQuery = useResource(myNegotiationConfig, scopeKey);
  const salesQuery = useResource(salesConfig, scopeKey);
  const businesses = businessesQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];
  const negotiations = negotiationsQuery.data ?? [];
  const salesReports = salesQuery.data ?? [];
  const primaryBusinessId = businesses[0]?.id ? String(businesses[0].id) : "";

  const modelProfileQuery = useQuery({
    queryKey: ["overview", scopeKey ?? "anonymous", "umkm-profile", primaryBusinessId],
    queryFn: async () => {
      try {
        return await directApi.get(`/businesses/${primaryBusinessId}/profile`, null);
      } catch {
        return null;
      }
    },
    enabled: Boolean(scopeKey && primaryBusinessId),
    retry: false,
  });
  const modelProfile = asRecord(modelProfileQuery.data);

  const totalSales = salesReports.reduce(
    (sum, item) => sum + Number(readPath(item, ["total_penjualan"], "0") || 0),
    0,
  );
  const funded = submissions.reduce(
    (sum, item) => sum + Number(readPath(item, ["total_pendanaan"], "0") || 0),
    0,
  );
  const bisnisCount = businesses.length;
  const investorCount = negotiations.length;

  const dbFunded = dbData.pengajuan ? Number(asRecord(dbData.pengajuan).total_pendanaan || 0) : null;
  const displayFunded = dbFunded !== null ? dbFunded : funded;

  const dbSales = Array.isArray(dbData.penjualan_chart)
    ? dbData.penjualan_chart.reduce((sum: number, item: any) => sum + Number(item.total_penjualan || 0), 0)
    : null;
  const displaySales = dbSales !== null ? dbSales : totalSales;

  const dbBisnisCount = dbData.bisnis ? 1 : null;
  const displayBisnisCount = dbBisnisCount !== null ? dbBisnisCount : bisnisCount;

  const dbInvestorCount = dbData.investor ? Number(asRecord(dbData.investor).total || 0) : null;
  const displayInvestorCount = dbInvestorCount !== null ? dbInvestorCount : investorCount;

  const hasBusiness = displayBisnisCount > 0;
  const hasProfileIdentity = Boolean(user?.nama && user?.email && user?.no_telp);
  const hasModelProfile = Boolean(
    modelProfile.net_profit_margin !== undefined ||
      modelProfile.year_revenue !== undefined ||
      modelProfile.digital_adoption_score !== undefined,
  );
  const hasSubmission = submissions.length > 0;
  const hasPendingSubmission = submissions.some(
    (item) =>
      String(readPath(item, ["approval.status", "approval_status", "status"], "draft")).toLowerCase() ===
      "pending",
  );
  const hasApprovedSubmission = submissions.some((item) =>
    ["approved", "published", "funded"].includes(
      String(readPath(item, ["approval.status", "approval_status", "status"])).toLowerCase(),
    ),
  );
  const hasNegotiation = negotiations.length > 0;

  const onboardingSteps: OverviewStep[] = [
    {
      key: "account",
      titleKey: "onboardingAccountTitle",
      helperKey: hasProfileIdentity ? "onboardingAccountDone" : "onboardingAccountTodo",
      href: "/dashboard/umkm/profile",
      done: hasProfileIdentity,
    },
    {
      key: "business",
      titleKey: "onboardingBusinessTitle",
      helperKey: hasBusiness ? "onboardingBusinessDone" : "onboardingBusinessTodo",
      helperParams: { count: bisnisCount },
      href: "/dashboard/umkm/bisnis",
      done: hasBusiness,
    },
    {
      key: "model",
      titleKey: "onboardingModelTitle",
      helperKey: hasBusiness
        ? hasModelProfile
          ? "onboardingModelDone"
          : "onboardingModelTodo"
        : "createBusinessFirst",
      href: "/dashboard/umkm/bisnis-profile",
      done: hasModelProfile,
      locked: !hasBusiness,
    },
    {
      key: "submission",
      titleKey: "onboardingSubmissionTitle",
      helperKey: hasSubmission ? "onboardingSubmissionDone" : "onboardingSubmissionTodo",
      helperParams: { count: submissions.length },
      href: "/dashboard/umkm/pengajuan",
      done: hasSubmission,
      locked: !hasBusiness,
    },
    {
      key: "review",
      titleKey: "onboardingReviewTitle",
      helperKey: hasApprovedSubmission
        ? "onboardingReviewDone"
        : hasPendingSubmission
          ? "onboardingReviewPending"
          : "onboardingReviewTodo",
      href: "/dashboard/umkm/pengajuan",
      done: hasApprovedSubmission,
      locked: !hasSubmission,
    },
    {
      key: "negotiation",
      titleKey: "onboardingNegotiationTitle",
      helperKey: hasNegotiation ? "onboardingNegotiationDone" : "onboardingNegotiationTodo",
      helperParams: { count: negotiations.length },
      href: "/dashboard/umkm/negosiasi",
      done: hasNegotiation,
      locked: !hasApprovedSubmission,
    },
  ];

  const onboardingChecks = onboardingSteps.map((step) => step.done);
  const onboardingProgress = Math.round(
    (onboardingChecks.filter(Boolean).length / onboardingChecks.length) * 100,
  );
  const visibleOnboardingSteps = onboardingSteps.filter((step) => !step.done);
  const shouldShowOnboardingCard = visibleOnboardingSteps.length > 0;
  const umkmBannerItems: OverviewBannerItem[] = [
    ...(hasBusiness && !hasModelProfile
      ? [
          {
            key: "umkm-model",
            to: "/dashboard/umkm/bisnis-profile",
            imageSrc: `${bannerBasePath}/umkm-lengkapi-profil-bisnis.webp`,
            imageMobileSrc: `${bannerBasePath}/umkm-lengkapi-profil-bisnis-mobile.webp`,
            imageDesktopSrc: `${bannerBasePath}/umkm-lengkapi-profil-bisnis-desktop.webp`,
            title: t("onboardingModelTitle"),
            priority: 3,
          },
        ]
      : []),
    ...(hasBusiness && !hasSubmission
      ? [
          {
            key: "umkm-submission",
            to: "/dashboard/umkm/pengajuan",
            imageSrc: `${bannerBasePath}/umkm-buat-pengajuan-pendanaan.webp`,
            imageMobileSrc: `${bannerBasePath}/umkm-buat-pengajuan-pendanaan-mobile.webp`,
            imageDesktopSrc: `${bannerBasePath}/umkm-buat-pengajuan-pendanaan-desktop.webp`,
            title: t("onboardingSubmissionTitle"),
            priority: 3,
          },
        ]
      : []),
    {
      key: "umkm-sales",
      to: "/dashboard/umkm/penjualan",
      imageSrc: `${bannerBasePath}/umkm-update-laporan-penjualan.webp`,
      imageMobileSrc: `${bannerBasePath}/umkm-update-laporan-penjualan-mobile.webp`,
      imageDesktopSrc: `${bannerBasePath}/umkm-update-laporan-penjualan-desktop.webp`,
      title: t("sales"),
      priority: 1,
    },
    {
      key: "umkm-notification",
      to: "/dashboard/umkm/notifikasi",
      imageSrc: `${bannerBasePath}/umkm-cek-notifikasi-aktivitas.webp`,
      imageMobileSrc: `${bannerBasePath}/umkm-cek-notifikasi-aktivitas-mobile.webp`,
      imageDesktopSrc: `${bannerBasePath}/umkm-cek-notifikasi-aktivitas-desktop.webp`,
      title: t("notifications"),
      priority: 1,
    },
  ];
  const isOnboardingLoading =
    businessesQuery.isLoading ||
    submissionsQuery.isLoading ||
    negotiationsQuery.isLoading ||
    (Boolean(primaryBusinessId) && modelProfileQuery.isLoading);

  return (
    <div className="space-y-6">
      <OverviewBannerRail items={umkmBannerItems} />
      <PageHeader
        title="umkmOverviewTitle"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("business")} value={String(displayBisnisCount)} helper={t("activeProfile")} icon={Building2} loading={businessesQuery.isLoading || dashboardQuery.isLoading} />
        <StatCard label={t("totalFunding")} value={compactCurrency(displayFunded)} helper={t("collected")} icon={CircleDollarSign} tone="green" loading={submissionsQuery.isLoading || dashboardQuery.isLoading} />
        <StatCard label={t("sales")} value={compactCurrency(displaySales)} helper={t("fromReports")} icon={BarChart3} tone="amber" loading={salesQuery.isLoading || dashboardQuery.isLoading} />
        <StatCard label={t("investor")} value={String(displayInvestorCount)} helper={t("relatedInvestors")} icon={Handshake} loading={negotiationsQuery.isLoading || dashboardQuery.isLoading} />
      </div>
      {isOnboardingLoading ? (
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <ListSkeleton rows={4} />
        </div>
      ) : shouldShowOnboardingCard ? (
        <OnboardingOverviewCard
          titleKey="umkmReadinessTitle"
          bodyKey="umkmReadinessBody"
          progress={onboardingProgress}
          steps={visibleOnboardingSteps}
        />
      ) : null}
      <ActivityPanel items={negotiations} isLoading={negotiationsQuery.isLoading} />
    </div>
  );
}

export function InvestorOverviewPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const bannerBasePath = overviewBannerBasePath(language);
  const scopeKey = user?.id ? String(user.id) : undefined;

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-investor", scopeKey],
    queryFn: () => directApi.get("/dashboard/investor"),
    enabled: Boolean(scopeKey),
  });
  const dbData = asRecord(dashboardQuery.data);

  const submissionsQuery = useResource(submissionConfig, scopeKey);
  const investmentsQuery = useResource(investorInvestmentConfig, scopeKey);
  const invoicesQuery = useResource(investorInvoiceConfig, scopeKey);
  const profitsQuery = useResource(investorProfitConfig, scopeKey);
  const negotiationsQuery = useResource(myNegotiationConfig, scopeKey);
  const preferencesQuery = useQuery({
    queryKey: ["overview", scopeKey ?? "anonymous", "investor-preferences"],
    queryFn: async () => {
      try {
        return await directApi.get("/user/investor/preferences", null);
      } catch {
        return null;
      }
    },
    enabled: Boolean(scopeKey),
    retry: false,
  });
  const recommendationsQuery = useQuery({
    queryKey: ["overview", scopeKey ?? "anonymous", "investor-recommendations"],
    queryFn: async () => {
      try {
        return asRecommendationArray(await directApi.get("/user/investor/recommendations", null));
      } catch {
        return [] as Entity[];
      }
    },
    enabled: Boolean(scopeKey),
    retry: false,
  });
  const businessCoverQuery = useQuery({
    queryKey: ["overview", scopeKey ?? "anonymous", "investor-business-covers"],
    queryFn: async () => {
      try {
        return await resourceApi.list({
          ...businessConfig,
          listPath: "/businesses?page=1&limit=200",
        });
      } catch {
        return [] as Entity[];
      }
    },
    enabled: Boolean(scopeKey),
    retry: false,
  });
  const submissions = useMemo(
    () => submissionsQuery.data ?? [],
    [submissionsQuery.data],
  );
  const recommendations = useMemo(
    () => recommendationsQuery.data ?? [],
    [recommendationsQuery.data],
  );
  const businessById = useMemo(
    () => new Map((businessCoverQuery.data ?? []).map((item) => [String(item.id), item])),
    [businessCoverQuery.data],
  );
  const submissionsWithBusinessCover = useMemo(
    () => submissions.map((item) => mergeBusinessForImage(item, businessById)),
    [submissions, businessById],
  );
  const recommendationsWithBusinessCover = useMemo(
    () => recommendations.map((item) => mergeBusinessForImage(item, businessById)),
    [recommendations, businessById],
  );
  const submissionsByBusinessId = useMemo(
    () =>
      submissionsWithBusinessCover.reduce((map, item) => {
        const businessId = textValue(readPath(item, businessIdPaths, ""), "");
        if (!businessId) return map;
        const current = map.get(businessId);
        if (!current) {
          map.set(businessId, item);
          return map;
        }

        const currentTimestamp = entityTimestamp(current);
        const nextTimestamp = entityTimestamp(item);
        if (nextTimestamp >= currentTimestamp) {
          map.set(businessId, item);
        }
        return map;
      }, new Map<string, Entity>()),
    [submissionsWithBusinessCover],
  );
  const submissionsByProposalId = useMemo(
    () =>
      submissionsWithBusinessCover.reduce((map, item) => {
        const proposalId = textValue(readPath(item, proposalIdPaths, ""), "");
        if (!proposalId) return map;
        const current = map.get(proposalId);
        if (!current || entityTimestamp(item) >= entityTimestamp(current)) {
          map.set(proposalId, item);
        }
        return map;
      }, new Map<string, Entity>()),
    [submissionsWithBusinessCover],
  );
  const recommendationsWithProposalData = useMemo(
    () =>
      recommendationsWithBusinessCover.map((item) => {
        const recommendationProposalId = textValue(
          readPath(item, proposalIdPaths, ""),
          "",
        );
        const businessId = textValue(readPath(item, businessIdPaths, ""), "");
        const matchedSubmission =
          (recommendationProposalId
            ? submissionsByProposalId.get(recommendationProposalId)
            : null) ??
          (businessId ? submissionsByBusinessId.get(businessId) : null);
        if (!matchedSubmission) return item;

        const submissionProposalId = textValue(
          readPath(matchedSubmission, proposalIdPaths, ""),
          "",
        );
        const targetValue = readNumberPath(item, targetValuePaths);
        const fallbackTargetValue = readNumberPath(matchedSubmission, targetValuePaths);
        const returnValue = readNumberPath(item, returnValuePaths);
        const fallbackReturnValue = readNumberPath(matchedSubmission, returnValuePaths);
        const fundedValue = readNumberPath(item, fundedValuePaths);
        const fallbackFundedValue = readNumberPath(matchedSubmission, fundedValuePaths);
        const submissionBusinessId = textValue(readPath(matchedSubmission, businessIdPaths, ""), "");

        return {
          ...item,
          bisnis_id: businessId || submissionBusinessId || item.bisnis_id,
          pengajuan_id: recommendationProposalId || submissionProposalId || item.pengajuan_id,
          proposal_id: recommendationProposalId || submissionProposalId || item.proposal_id,
          target_pendanaan:
            targetValue !== null && targetValue > 0
              ? targetValue
              : fallbackTargetValue ?? "",
          per_anual_return:
            returnValue !== null && returnValue > 0
              ? returnValue
              : fallbackReturnValue ?? "",
          total_pendanaan:
            fundedValue !== null && fundedValue >= 0
              ? fundedValue
              : fallbackFundedValue ?? "",
        };
      }),
    [recommendationsWithBusinessCover, submissionsByBusinessId, submissionsByProposalId],
  );
  const investments = investmentsQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const profits = profitsQuery.data ?? [];
  const negotiations = negotiationsQuery.data ?? [];

  const invested = investments.reduce(
    (sum, item) =>
      sum +
      Number(readPath(item, ["nominal_investasi", "nominal", "total_investasi"], "0") || 0),
    0,
  );
  const profitTotal = profits.reduce(
    (sum, item) =>
      sum +
      Number(readPath(item, ["nominal_profit", "jumlah", "total_profit"], "0") || 0),
    0,
  );
  const pendingProfit = profits.reduce((sum, item) => {
    const status = String(readPath(item, ["status"], "")).toLowerCase();
    if (!["pending", "waiting", "unpaid", "belum_dibayar"].includes(status)) return sum;
    return sum + Number(readPath(item, ["nominal_profit", "jumlah", "total_profit"], "0") || 0);
  }, 0);

  const dbInvested = dbData.investasi ? Number(asRecord(dbData.investasi).total_nominal || 0) : null;
  const displayInvested = dbInvested !== null ? dbInvested : invested;

  const dbProfitTotal = dbData.profit ? Number(asRecord(dbData.profit).total_diterima || 0) : null;
  const displayProfitTotal = dbProfitTotal !== null ? dbProfitTotal : profitTotal;

  const dbPendingProfit = dbData.profit ? Number(asRecord(dbData.profit).total_pending || 0) : null;
  const displayPendingProfit = dbPendingProfit !== null ? dbPendingProfit : pendingProfit;

  const investmentCount = investments.length;
  const hasPreferences = Boolean(preferencesQuery.data);
  const hasRecommendationData = recommendationsWithProposalData.length > 0;
  const matchItems = hasRecommendationData ? recommendationsWithProposalData : submissionsWithBusinessCover;
  const hasNegotiation = negotiations.length > 0;
  const hasInvestment = investmentCount > 0;
  const pendingInvoices = invoices.filter((item) => {
    const rawStatus = readPath(item, ["status", "invoice_status"], "");
    const status = String(rawStatus || "").toLowerCase();
    return ["pending", "unpaid", "waiting_payment", "belum_dibayar"].includes(status);
  });
  const hasPendingInvoice = pendingInvoices.length > 0;
  const activeInvestmentItems = investments;
  const hasInvestmentActivity = activeInvestmentItems.length > 0;
  const shouldShowFinancialSummary =
    hasInvestment || displayInvested > 0 || displayProfitTotal > 0 || displayPendingProfit > 0;
  const nextAction: NextAction | null = !hasPreferences
    ? {
        titleKey: "investorNextPreferenceTitle",
        bodyKey: "investorNextPreferenceBody",
        buttonKey: "investorNextPreferenceButton",
        href: "/dashboard/investor/preferensi",
        icon: SlidersHorizontal,
      }
    : hasPendingInvoice
      ? {
          titleKey: "investorNextInvoiceTitle",
          bodyKey: "investorNextInvoiceBody",
          buttonKey: "investorNextInvoiceButton",
          href: "/dashboard/investor/invoice",
          icon: Receipt,
        }
      : !hasNegotiation
        ? {
            titleKey: "investorNextOpportunityTitle",
            bodyKey: "investorNextOpportunityBody",
            buttonKey: "investorNextOpportunityButton",
            href: "/dashboard/investor/peluang",
            icon: Rocket,
          }
        : !hasInvestment
          ? {
              titleKey: "investorNextNegotiationTitle",
              bodyKey: "investorNextNegotiationBody",
              buttonKey: "investorNextNegotiationButton",
              href: "/dashboard/investor/negosiasi",
              icon: Handshake,
            }
          : null;
  const investorBannerItems: OverviewBannerItem[] = [
    ...(!hasPreferences
      ? [
          {
            key: "investor-survey",
            to: "/dashboard/investor/preferensi",
            imageSrc: `${bannerBasePath}/investor-isi-survey-preferensi.webp`,
            imageMobileSrc: `${bannerBasePath}/investor-isi-survey-preferensi-mobile.webp`,
            imageDesktopSrc: `${bannerBasePath}/investor-isi-survey-preferensi-desktop.webp`,
            title: t("dashboardPreferences"),
            priority: 3,
          },
        ]
      : []),
    {
      key: "investor-opportunity",
      to: "/dashboard/investor/peluang",
      imageSrc: `${bannerBasePath}/investor-jelajahi-peluang-umkm.webp`,
      imageMobileSrc: `${bannerBasePath}/investor-jelajahi-peluang-umkm-mobile.webp`,
      imageDesktopSrc: `${bannerBasePath}/investor-jelajahi-peluang-umkm-desktop.webp`,
      title: t("opportunities"),
      priority: 1,
    },
    {
      key: "investor-portfolio",
      to: "/dashboard/investor/portfolio",
      imageSrc: `${bannerBasePath}/investor-pantau-portfolio-aktif.webp`,
      imageMobileSrc: `${bannerBasePath}/investor-pantau-portfolio-aktif-mobile.webp`,
      imageDesktopSrc: `${bannerBasePath}/investor-pantau-portfolio-aktif-desktop.webp`,
      title: t("dashboardPortfolio"),
      priority: 1,
    },
  ];
  const isInvestorStateLoading =
    preferencesQuery.isLoading || negotiationsQuery.isLoading || investmentsQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="investorOverviewTitle"
      />
      <OverviewBannerRail items={investorBannerItems} />

      {isInvestorStateLoading ? (
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <ListSkeleton rows={2} />
        </div>
      ) : nextAction ? (
        <NextActionCard action={nextAction} />
      ) : null}

      {shouldShowFinancialSummary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          <StatCard label={t("investments")} value={compactCurrency(displayInvested)} helper={t("activePortfolio")} icon={TrendingUp} tone="green" loading={investmentsQuery.isLoading || dashboardQuery.isLoading} />
          <StatCard label={t("profit")} value={compactCurrency(displayProfitTotal)} helper={t("pendingAmount", { amount: compactCurrency(displayPendingProfit) })} icon={CircleDollarSign} tone="amber" loading={profitsQuery.isLoading || dashboardQuery.isLoading} />
        </div>
      ) : null}

      {hasPreferences ? (
        <MatchList
          submissions={matchItems}
          isLoading={submissionsQuery.isLoading || recommendationsQuery.isLoading || businessCoverQuery.isLoading}
          isFallback={!hasRecommendationData}
        />
      ) : null}

      {hasInvestmentActivity ? (
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">{t("activeInvestments")}</h3>
          <p className="mt-1 text-sm font-semibold text-neutral/55">{t("activeInvestmentCount", { count: investmentCount })}</p>
          <div className="mt-5 grid gap-3">
            {activeInvestmentItems.map((item) => (
              <div key={item.id} className="rounded-md border border-base-300 p-4">
                <div className="flex justify-between gap-4">
                  <p className="font-black">
                    {textValue(readPath(item, ["bisnis.nama_bisnis", "penjualan.nama_bisnis", "bisnis", "periode"]))}
                  </p>
                  <span className={`badge ${statusTone(readPath(item, ["negosiasi.status", "status"]))}`}>
                    {textValue(readPath(item, ["negosiasi.status", "status"]))}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral/55">
                  {currency(item.nominal_investasi || item.nominal_profit)} - Return {percent(item.return_investasi)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminOverviewPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const scopeKey = user?.id ? String(user.id) : undefined;

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-admin", scopeKey],
    queryFn: () => directApi.get("/dashboard/admin"),
    enabled: Boolean(scopeKey),
  });
  const dbData = asRecord(dashboardQuery.data);

  const businessesQuery = useResource(businessConfig, scopeKey);
  const submissionsQuery = useResource(submissionConfig, scopeKey);
  const adminsQuery = useResource(adminConfig, scopeKey);
  const notificationsQuery = useResource(notificationConfig, scopeKey);
  const usersQuery = useResource(userManagementConfig, scopeKey);
  const businesses = businessesQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];
  const admins = adminsQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const bisnisCount = businesses.length;
  const submissionCount = submissions.length;
  const adminCount = admins.length;
  const userCount = users.length || adminCount;
  const notifCount = notifications.length;
  const pending = submissions.filter((item) => {
    const status = String(readPath(item, ["approval.status", "approval_status", "status"])).toLowerCase();
    return status === "pending";
  }).length;

  const dbBisnisCount = dbData.bisnis ? Number(asRecord(dbData.bisnis).total || 0) : null;
  const displayBisnisCount = dbBisnisCount !== null ? dbBisnisCount : bisnisCount;

  const dbSubmissionCount = dbData.pengajuan ? Number(asRecord(dbData.pengajuan).total || 0) : null;
  const displaySubmissionCount = dbSubmissionCount !== null ? dbSubmissionCount : submissionCount;

  const dbPending = dbData.pengajuan ? Number(asRecord(asRecord(dbData.pengajuan).by_status).pending || 0) : null;
  const displayPending = dbPending !== null ? dbPending : pending;

  const dbUserCount = dbData.users ? Number(asRecord(dbData.users).total || 0) : null;
  const displayUserCount = dbUserCount !== null ? dbUserCount : userCount;

  const displayRecentSubmissions = Array.isArray(dbData.recent_pengajuan) ? dbData.recent_pengajuan : submissions.slice(0, 5);
  const adminBannerItems: OverviewBannerItem[] = [
    ...(pending > 0
      ? [
          {
            key: "admin-review-pending",
            to: "/dashboard/admin/review",
            title: t("dashboardReviewQueue"),
            body: t("pendingCount", { count: pending }),
            icon: FileCheck2,
            priority: 3,
          },
        ]
      : []),
    ...(notifCount > 0
      ? [
          {
            key: "admin-notification",
            to: "/dashboard/admin/notifikasi",
            title: t("dashboardNotifications"),
            body: t("pendingCount", { count: notifCount }),
            icon: Bell,
            priority: 3,
          },
        ]
      : []),
    {
      key: "admin-submissions",
      to: "/dashboard/admin/pengajuan",
      title: t("dashboardSubmissions"),
      body: t("submissionStatus"),
      icon: FileCheck2,
      priority: 1,
    },
    {
      key: "admin-businesses",
      to: "/dashboard/admin/bisnis",
      title: t("dashboardBusiness"),
      body: t("registered"),
      icon: Building2,
      priority: 1,
    },
  ];

  return (
    <div className="space-y-6">
      <OverviewBannerRail items={adminBannerItems} />
      <PageHeader
        title="adminOverviewTitle"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("business")} value={String(displayBisnisCount)} helper={t("registered")} icon={Building2} loading={businessesQuery.isLoading || dashboardQuery.isLoading} />
        <StatCard label={t("submissions")} value={String(displaySubmissionCount)} helper={t("pendingCount", { count: displayPending })} icon={FileCheck2} tone="neutral" loading={submissionsQuery.isLoading || dashboardQuery.isLoading} />
        <StatCard label={t("users")} value={String(displayUserCount)} helper={t("platformAccounts")} icon={Users} loading={(usersQuery.isLoading && adminsQuery.isLoading) || dashboardQuery.isLoading} />
        <StatCard label={t("notifications")} value={String(notifCount)} helper={t("operational")} icon={Bell} tone="neutral" loading={notificationsQuery.isLoading} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">{t("submissionStatus")}</h3>
          <div className="mt-5 grid gap-3">
            {!(submissionsQuery.isLoading || dashboardQuery.isLoading) &&
            displayRecentSubmissions.length === 0 ? (
              <EmptyState
                title="dataUnavailable"
                body="latestUpdatesEmpty"
                compact
                icon={FileCheck2}
              />
            ) : null}
            {displayRecentSubmissions.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border border-base-300 p-4">
                <div>
                  <p className="font-black">
                    {textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "nama"]))}
                  </p>
                  <p className="mt-1 text-sm text-neutral/55">{currency(item.target_pendanaan)}</p>
                </div>
                <span className={`badge ${statusTone(readPath(item, ["approval.status", "approval_status", "status"]))}`}>
                  {textValue(readPath(item, ["approval.status", "approval_status", "status"]))}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ActivityPanel items={notifications} isLoading={notificationsQuery.isLoading} />
      </div>
    </div>
  );
}
