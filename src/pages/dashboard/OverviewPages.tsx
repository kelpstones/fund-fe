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
  submissionConfig,
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

const useDashboard = (role: "umkm" | "investor" | "admin", scopeKey?: string) =>
  useQuery({
    queryKey: ["dashboard-summary", role, scopeKey ?? "anonymous"],
    queryFn: () => directApi.get(`/dashboard/${role}`, null),
    enabled: Boolean(scopeKey),
    retry: false,
  });

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asEntityArray = (value: unknown): Entity[] => (Array.isArray(value) ? (value as Entity[]) : []);

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

type ViewportVariant = "mobile" | "tablet" | "desktop";

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

function MatchList({ submissions, isLoading = false }: { submissions: Entity[]; isLoading?: boolean }) {
  const { t } = useLanguage();
  const sorted = [...submissions].sort(
    (a, b) =>
      Number(b.match_score || b.skor_kecocokan || 0) -
      Number(a.match_score || a.skor_kecocokan || 0),
  );

  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black">{t("aiMatchScore")}</h3>
        </div>
        <Scale className="text-primary" size={24} />
      </div>
      <div className="mt-5 grid gap-3">
        {isLoading ? <ListSkeleton rows={3} /> : null}
        {!isLoading && sorted.length === 0 ? (
          <EmptyState title="dataUnavailable" body="matchDataEmpty" compact icon={Scale} />
        ) : null}
        {sorted.slice(0, 4).map((item) => {
          const score = Number(item.match_score || item.skor_kecocokan || 0);
          return (
            <div key={item.id} className="rounded-md border border-base-300 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black">
                    {textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "businessName"]))}
                  </p>
                  <p className="mt-1 text-sm text-neutral/55">
                    {t("metricReturn")} {percent(item.per_anual_return)} - {t("metricRisk")} {textValue(item.risk_level)}
                  </p>
                </div>
                <span className="badge badge-secondary badge-lg text-white">{score}%</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-base-200">
                <div
                  className="h-2 rounded-full bg-primary transition-[width] duration-[420ms] ease-out"
                  style={{ width: `${Math.min(score, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
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

export function UmkmOverviewPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const scopeKey = user?.id ? String(user.id) : undefined;
  const dashboardQuery = useDashboard("umkm", scopeKey);
  const dashboard = dashboardQuery.data;
  const d = asRecord(dashboard);
  const dashboardBusiness = asRecord(d.bisnis);
  const dashboardSubmission = asRecord(d.pengajuan);
  const dashboardInvestor = asRecord(d.investor);
  const penjualanChart = asEntityArray(d.penjualan_chart);

  const businessesQuery = useResource(myBusinessConfig, scopeKey);
  const submissionsQuery = useResource(submissionConfig, scopeKey);
  const negotiationsQuery = useResource(myNegotiationConfig, scopeKey);
  const businesses = businessesQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];
  const negotiations = negotiationsQuery.data ?? [];
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

  const totalSales =
    penjualanChart.reduce((sum, item) => sum + Number(item.total_penjualan || 0), 0) ||
    Number(d.total_penjualan ?? 0);
  const funded =
    Number(dashboardSubmission.total_pendanaan ?? 0) ||
    submissions.reduce((sum, item) => sum + Number(item.total_pendanaan || 0), 0);
  const bisnisCount = dashboardBusiness.id ? 1 : businesses.length;
  const investorCount = Number(dashboardInvestor.total ?? 0) || negotiations.length;
  const hasBusiness = bisnisCount > 0;
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
            imageSrc: "/images/overview-banners/umkm-lengkapi-profil-bisnis.webp",
            imageMobileSrc: "/images/overview-banners/umkm-lengkapi-profil-bisnis-mobile.webp",
            imageDesktopSrc: "/images/overview-banners/umkm-lengkapi-profil-bisnis-desktop.webp",
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
            imageSrc: "/images/overview-banners/umkm-buat-pengajuan-pendanaan.webp",
            imageMobileSrc: "/images/overview-banners/umkm-buat-pengajuan-pendanaan-mobile.webp",
            imageDesktopSrc: "/images/overview-banners/umkm-buat-pengajuan-pendanaan-desktop.webp",
            title: t("onboardingSubmissionTitle"),
            priority: 3,
          },
        ]
      : []),
    {
      key: "umkm-sales",
      to: "/dashboard/umkm/penjualan",
      imageSrc: "/images/overview-banners/umkm-update-laporan-penjualan.webp",
      imageMobileSrc: "/images/overview-banners/umkm-update-laporan-penjualan-mobile.webp",
      imageDesktopSrc: "/images/overview-banners/umkm-update-laporan-penjualan-desktop.webp",
      title: t("sales"),
      priority: 1,
    },
    {
      key: "umkm-notification",
      to: "/dashboard/umkm/notifikasi",
      imageSrc: "/images/overview-banners/umkm-cek-notifikasi-aktivitas.webp",
      imageMobileSrc: "/images/overview-banners/umkm-cek-notifikasi-aktivitas-mobile.webp",
      imageDesktopSrc: "/images/overview-banners/umkm-cek-notifikasi-aktivitas-desktop.webp",
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
        <StatCard label={t("business")} value={String(bisnisCount)} helper={t("activeProfile")} icon={Building2} loading={dashboardQuery.isLoading} />
        <StatCard label={t("totalFunding")} value={compactCurrency(funded)} helper={t("collected")} icon={CircleDollarSign} tone="green" loading={dashboardQuery.isLoading} />
        <StatCard label={t("sales")} value={compactCurrency(totalSales)} helper={t("fromReports")} icon={BarChart3} tone="amber" loading={dashboardQuery.isLoading} />
        <StatCard label={t("investor")} value={String(investorCount)} helper={t("relatedInvestors")} icon={Handshake} loading={dashboardQuery.isLoading} />
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
  const { t } = useLanguage();
  const { user } = useAuth();
  const scopeKey = user?.id ? String(user.id) : undefined;
  const dashboardQuery = useDashboard("investor", scopeKey);
  const dashboard = dashboardQuery.data;
  const d = asRecord(dashboard);
  const dashboardInvestment = asRecord(d.investasi);
  const dashboardProfit = asRecord(d.profit);
  const recentDistribution = asEntityArray(d.recent_distribusi);

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
  const submissions = submissionsQuery.data ?? [];
  const investments = investmentsQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const profits = profitsQuery.data ?? [];
  const negotiations = negotiationsQuery.data ?? [];

  const invested =
    Number(dashboardInvestment.total_nominal ?? 0) ||
    investments.reduce((sum, item) => sum + Number(item.nominal_investasi || 0), 0);
  const profitTotal =
    Number(dashboardProfit.total_diterima ?? 0) ||
    profits.reduce((sum, item) => sum + Number(item.nominal_profit || 0), 0);
  const pendingProfit = Number(dashboardProfit.total_pending ?? 0);
  const investmentCount = Number(dashboardInvestment.jumlah_aktif ?? 0) || investments.length;
  const accountReady = Boolean(user?.nama && user?.email);
  const hasPreferences = Boolean(preferencesQuery.data);
  const hasNegotiation = negotiations.length > 0;
  const hasInvestment = investmentCount > 0;
  const hasPendingInvoice = invoices.some((item) => {
    const rawStatus = readPath(item, ["status", "invoice_status"], "");
    const status = String(rawStatus || "").toLowerCase();
    return ["pending", "unpaid", "waiting_payment", "belum_dibayar"].includes(status);
  });

  const onboardingSteps: OverviewStep[] = [
    {
      key: "profile",
      titleKey: "investorStepProfileTitle",
      helperKey: accountReady ? "investorStepProfileDone" : "investorStepProfileTodo",
      href: "/dashboard/investor/profile",
      done: accountReady,
    },
    {
      key: "preferences",
      titleKey: "investorStepPreferenceTitle",
      helperKey: hasPreferences ? "investorStepPreferenceDone" : "investorStepPreferenceTodo",
      href: "/dashboard/investor/preferensi",
      done: hasPreferences,
    },
    {
      key: "survey",
      titleKey: "investorStepSurveyTitle",
      helperKey: "investorStepSurveyTodo",
      href: "/dashboard/investor/survey",
      done: hasPreferences,
      locked: !hasPreferences,
    },
    {
      key: "negotiation",
      titleKey: "investorStepNegotiationTitle",
      helperKey: hasNegotiation ? "investorStepNegotiationDone" : "investorStepNegotiationTodo",
      helperParams: { count: negotiations.length },
      href: "/dashboard/investor/negosiasi",
      done: hasNegotiation,
      locked: !hasPreferences,
    },
    {
      key: "portfolio",
      titleKey: "investorStepPortfolioTitle",
      helperKey: hasInvestment ? "investorStepPortfolioDone" : "investorStepPortfolioTodo",
      helperParams: { count: investmentCount },
      href: "/dashboard/investor/portfolio",
      done: hasInvestment,
      locked: !hasNegotiation,
    },
  ];

  const onboardingProgress = Math.round(
    (onboardingSteps.filter((step) => step.done).length / onboardingSteps.length) * 100,
  );
  const investorBannerItems: OverviewBannerItem[] = [
    ...(!hasPreferences
      ? [
          {
            key: "investor-survey",
            to: "/dashboard/investor/survey",
            imageSrc: "/images/overview-banners/investor-isi-survey-preferensi.webp",
            imageMobileSrc: "/images/overview-banners/investor-isi-survey-preferensi-mobile.webp",
            imageDesktopSrc: "/images/overview-banners/investor-isi-survey-preferensi-desktop.webp",
            title: t("dashboardSurvey"),
            priority: 3,
          },
        ]
      : []),
    ...(hasPendingInvoice
      ? [
          {
            key: "investor-invoice-pending",
            to: "/dashboard/investor/invoice",
            title: t("dashboardInvoices"),
            body: t("pendingCount", { count: invoices.filter((item) => {
              const rawStatus = readPath(item, ["status", "invoice_status"], "");
              const status = String(rawStatus || "").toLowerCase();
              return ["pending", "unpaid", "waiting_payment", "belum_dibayar"].includes(status);
            }).length }),
            icon: Receipt,
            priority: 3,
          },
        ]
      : []),
    {
      key: "investor-opportunity",
      to: "/dashboard/investor/peluang",
      imageSrc: "/images/overview-banners/investor-jelajahi-peluang-umkm.webp",
      imageMobileSrc: "/images/overview-banners/investor-jelajahi-peluang-umkm-mobile.webp",
      imageDesktopSrc: "/images/overview-banners/investor-jelajahi-peluang-umkm-desktop.webp",
      title: t("opportunities"),
      priority: 1,
    },
    {
      key: "investor-portfolio",
      to: "/dashboard/investor/portfolio",
      imageSrc: "/images/overview-banners/investor-pantau-portfolio-aktif.webp",
      imageMobileSrc: "/images/overview-banners/investor-pantau-portfolio-aktif-mobile.webp",
      imageDesktopSrc: "/images/overview-banners/investor-pantau-portfolio-aktif-desktop.webp",
      title: t("dashboardPortfolio"),
      priority: 1,
    },
  ];
  const isOnboardingLoading =
    preferencesQuery.isLoading || negotiationsQuery.isLoading || investmentsQuery.isLoading;

  return (
    <div className="space-y-6">
      <OverviewBannerRail items={investorBannerItems} />
      <PageHeader
        title="investorOverviewTitle"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        <StatCard label={t("investments")} value={compactCurrency(invested)} helper={t("activePortfolio")} icon={TrendingUp} tone="green" loading={dashboardQuery.isLoading} />
        <StatCard label={t("profit")} value={compactCurrency(profitTotal)} helper={t("pendingAmount", { amount: compactCurrency(pendingProfit) })} icon={CircleDollarSign} tone="amber" loading={dashboardQuery.isLoading} />
      </div>
      {isOnboardingLoading ? (
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <ListSkeleton rows={4} />
        </div>
      ) : (
        <OnboardingOverviewCard
          titleKey="investorOnboardingTitle"
          bodyKey="investorOnboardingBody"
          progress={onboardingProgress}
          steps={onboardingSteps}
        />
      )}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MatchList submissions={submissions} isLoading={submissionsQuery.isLoading} />
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">{t("activeInvestments")}</h3>
          <p className="mt-1 text-sm font-semibold text-neutral/55">{t("activeInvestmentCount", { count: investmentCount })}</p>
          <div className="mt-5 grid gap-3">
            {!investmentsQuery.isLoading &&
            recentDistribution.length === 0 &&
            investments.length === 0 ? (
              <EmptyState
                title="noActiveInvestments"
                body="noActiveInvestmentsBody"
                compact
                icon={TrendingUp}
              />
            ) : null}
            {(recentDistribution.length > 0 ? recentDistribution : investments).map((item) => (
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
      </div>
    </div>
  );
}

export function AdminOverviewPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const scopeKey = user?.id ? String(user.id) : undefined;
  const dashboardQuery = useDashboard("admin", scopeKey);
  const dashboard = dashboardQuery.data;
  const d = asRecord(dashboard);
  const dashboardBusiness = asRecord(d.bisnis);
  const dashboardUsers = asRecord(d.users);
  const dashboardSubmission = asRecord(d.pengajuan);
  const submissionByStatus = asRecord(dashboardSubmission.by_status);
  const recentSubmissions = asEntityArray(d.recent_pengajuan);

  const businessesQuery = useResource(businessConfig, scopeKey);
  const submissionsQuery = useResource(submissionConfig, scopeKey);
  const adminsQuery = useResource(adminConfig, scopeKey);
  const notificationsQuery = useResource(notificationConfig, scopeKey);
  const businesses = businessesQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];
  const admins = adminsQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];

  const bisnisCount = Number(dashboardBusiness.total ?? 0) || businesses.length;
  const submissionCount = Number(dashboardSubmission.total ?? 0) || submissions.length;
  const adminCount = Number(d.total_admin ?? 0) || admins.length;
  const userCount = Number(dashboardUsers.total ?? 0) || adminCount;
  const notifCount = Number(d.total_notifikasi ?? 0) || notifications.length;
  const pending =
    Number(submissionByStatus.pending ?? 0) ||
    submissions.filter((item) => String(readPath(item, ["approval.status", "approval_status", "status"])) === "pending").length;
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
        <StatCard label={t("business")} value={String(bisnisCount)} helper={t("registered")} icon={Building2} loading={dashboardQuery.isLoading} />
        <StatCard label={t("submissions")} value={String(submissionCount)} helper={t("pendingCount", { count: pending })} icon={FileCheck2} tone="neutral" loading={dashboardQuery.isLoading} />
        <StatCard label={t("users")} value={String(userCount)} helper={t("platformAccounts")} icon={Users} loading={dashboardQuery.isLoading} />
        <StatCard label={t("notifications")} value={String(notifCount)} helper={t("operational")} icon={Bell} tone="neutral" loading={dashboardQuery.isLoading} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">{t("submissionStatus")}</h3>
          <div className="mt-5 grid gap-3">
            {!submissionsQuery.isLoading &&
            recentSubmissions.length === 0 &&
            submissions.length === 0 ? (
              <EmptyState
                title="dataUnavailable"
                body="latestUpdatesEmpty"
                compact
                icon={FileCheck2}
              />
            ) : null}
            {(recentSubmissions.length > 0 ? recentSubmissions : submissions).map((item) => (
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
