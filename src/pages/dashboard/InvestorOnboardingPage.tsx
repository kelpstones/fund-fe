import { type CSSProperties, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Handshake,
  LineChart,
  Lock,
  Rocket,
  Settings2,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { apiClient } from "../../lib/api/client";
import { resourceApi } from "../../lib/api/resources";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { DashboardBreadcrumb } from "../../components/DashboardBreadcrumb";
import {
  investorInvestmentConfig,
  myNegotiationConfig,
} from "../../lib/resourceConfigs";
import type { Entity } from "../../types";

type InvestorStep = {
  key: string;
  titleKey: string;
  descriptionKey: string;
  href: string;
  actionKey: string;
  icon: typeof Rocket;
  done: boolean;
  locked?: boolean;
  helperKey: string;
  helperParams?: Record<string, string | number>;
};

function ProgressRing({ value }: { value: number }) {
  const { t } = useLanguage();

  return (
    <div
      className="radial-progress text-primary"
      style={{ "--value": value, "--size": "7rem", "--thickness": "0.7rem" } as CSSProperties}
      role="progressbar"
      aria-label={t("investorOnboardingProgress")}
    >
      <span className="text-xl font-black text-neutral">{value}%</span>
    </div>
  );
}

function StepStatus({ done, locked }: { done: boolean; locked?: boolean }) {
  const { t } = useLanguage();

  if (done) {
    return (
      <span className="badge badge-success gap-1 text-white">
        <CheckCircle2 size={14} />
        {t("done")}
      </span>
    );
  }

  if (locked) {
    return (
      <span className="badge badge-neutral gap-1">
        <Lock size={14} />
        {t("locked")}
      </span>
    );
  }

  return (
    <span className="badge badge-warning gap-1">
      <AlertCircle size={14} />
      {t("next")}
    </span>
  );
}

function StepCard({ step, index }: { step: InvestorStep; index: number }) {
  const { t } = useLanguage();
  const Icon = step.icon;

  return (
    <article
      className={[
        "rounded-md border bg-white p-5 shadow-sm",
        step.done
          ? "border-success/30"
          : step.locked
            ? "border-base-300 opacity-75"
            : "border-warning/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div
            className={[
              "grid h-11 w-11 shrink-0 place-items-center rounded-md",
              step.done
                ? "bg-success/10 text-success"
                : step.locked
                  ? "bg-base-200 text-neutral/45"
                  : "bg-warning/15 text-warning",
            ].join(" ")}
          >
            <Icon size={21} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-neutral/40">
              {t("step")} {index + 1}
            </p>
            <h3 className="mt-1 text-lg font-black text-neutral">
              {t(step.titleKey)}
            </h3>
          </div>
        </div>
        <StepStatus done={step.done} locked={step.locked} />
      </div>
      <p className="mt-4 text-sm leading-6 text-neutral/60">
        {t(step.descriptionKey)}
      </p>
      <p className="mt-3 rounded-md bg-base-200 px-3 py-2 text-xs font-semibold text-neutral/60">
        {t(step.helperKey, step.helperParams)}
      </p>
      <div className="mt-5">
        <Link
          to={step.href}
          className={[
            "btn h-10 rounded-md",
            step.locked
              ? "btn-disabled"
              : step.done
                ? "btn-outline"
                : "btn-primary text-white",
          ].join(" ")}
          aria-disabled={step.locked}
        >
          {t(step.actionKey)}
        </Link>
      </div>
    </article>
  );
}

function InvestorStats({
  negotiationCount,
  investmentCount,
  isLoading,
}: {
  negotiationCount: number;
  investmentCount: number;
  isLoading: boolean;
}) {
  const { t } = useLanguage();
  const dash = isLoading ? "-" : undefined;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-neutral/50">{t("negotiation")}</p>
        <p className="mt-2 text-3xl font-black">
          {dash ?? negotiationCount}
        </p>
        <p className="mt-1 text-sm text-neutral/55">{t("investorInteractions")}</p>
      </div>
      <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-neutral/50">{t("investments")}</p>
        <p className="mt-2 text-3xl font-black">
          {dash ?? investmentCount}
        </p>
        <p className="mt-1 text-sm text-neutral/55">{t("activePortfolio")}</p>
      </div>
      <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-neutral/50">{t("progress")}</p>
        <p className="mt-2 text-3xl font-black">
          {negotiationCount + investmentCount > 0 ? t("available") : "-"}
        </p>
        <p className="mt-1 text-sm text-neutral/55">{t("investorOnboardingProgress")}</p>
      </div>
    </div>
  );
}

export function InvestorOnboardingPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const scopeKey = user?.id ? String(user.id) : undefined;

  const preferencesQuery = useQuery({
    queryKey: ["investor-onboarding", scopeKey ?? "anonymous", "preferences"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/user/investor/preferences");
        return response.data as Entity | null;
      } catch {
        return null;
      }
    },
    enabled: Boolean(scopeKey),
  });

  const negotiationsQuery = useQuery({
    queryKey: ["investor-onboarding", scopeKey ?? "anonymous", "negotiations"],
    queryFn: () => resourceApi.list(myNegotiationConfig),
    enabled: Boolean(scopeKey),
  });

  const investmentsQuery = useQuery({
    queryKey: ["investor-onboarding", scopeKey ?? "anonymous", "investments"],
    queryFn: () => resourceApi.list(investorInvestmentConfig),
    enabled: Boolean(scopeKey),
  });

  const negotiations = negotiationsQuery.data ?? [];
  const investments = investmentsQuery.data ?? [];

  const accountReady = Boolean(user?.nama && user?.email);
  const hasPreferences = Boolean(preferencesQuery.data);
  const hasNegotiation = negotiations.length > 0;
  const hasInvestment = investments.length > 0;

  const steps = useMemo<InvestorStep[]>(
    () => [
      {
        key: "account",
        titleKey: "investorStepProfileTitle",
        descriptionKey: "investorStepProfileBody",
        href: "/dashboard/investor/profile",
        actionKey: accountReady ? "reviewProfile" : "completeProfile",
        icon: UserRound,
        done: accountReady,
        helperKey: accountReady
          ? "investorStepProfileDone"
          : "investorStepProfileTodo",
      },
      {
        key: "preferences",
        titleKey: "investorStepPreferenceTitle",
        descriptionKey: "investorStepPreferenceBody",
        href: "/dashboard/investor/preferensi",
        actionKey: hasPreferences ? "reviewPreferences" : "setPreferences",
        icon: Settings2,
        done: hasPreferences,
        helperKey: hasPreferences
          ? "investorStepPreferenceDone"
          : "investorStepPreferenceTodo",
      },
      {
        key: "survey",
        titleKey: "investorStepSurveyTitle",
        descriptionKey: "investorStepSurveyBody",
        href: "/dashboard/investor/preferensi",
        actionKey: "completeSurvey",
        icon: BookOpen,
        done: false,
        locked: !hasPreferences,
        helperKey: "investorStepSurveyTodo",
      },
      {
        key: "opportunities",
        titleKey: "investorStepOpportunityTitle",
        descriptionKey: "investorStepOpportunityBody",
        href: "/dashboard/investor/peluang",
        actionKey: "browseOpportunities",
        icon: LineChart,
        done: false,
        locked: !hasPreferences,
        helperKey: "investorStepOpportunityTodo",
      },
      {
        key: "negotiation",
        titleKey: "investorStepNegotiationTitle",
        descriptionKey: "investorStepNegotiationBody",
        href: "/dashboard/investor/negosiasi",
        actionKey: "openNegotiations",
        icon: Handshake,
        done: hasNegotiation,
        locked: !hasPreferences,
        helperKey: hasNegotiation
          ? "investorStepNegotiationDone"
          : "investorStepNegotiationTodo",
        helperParams: { count: negotiations.length },
      },
      {
        key: "portfolio",
        titleKey: "investorStepPortfolioTitle",
        descriptionKey: "investorStepPortfolioBody",
        href: "/dashboard/investor/portfolio",
        actionKey: "viewPortfolio",
        icon: BarChart3,
        done: hasInvestment,
        locked: !hasNegotiation,
        helperKey: hasInvestment
          ? "investorStepPortfolioDone"
          : "investorStepPortfolioTodo",
        helperParams: { count: investments.length },
      },
    ],
    [
      accountReady,
      hasPreferences,
      hasNegotiation,
      hasInvestment,
      negotiations.length,
      investments.length,
    ],
  );

  const completedSteps = steps.filter((step) => step.done).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const nextStep = steps.find((step) => !step.done && !step.locked);

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
              <Rocket size={15} />
              {t("investorOnboarding")}
            </div>
            <h2 className="text-3xl font-black tracking-normal text-neutral">
              {t("investorOnboardingTitle")}
            </h2>
            <DashboardBreadcrumb />
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral/60">
              {t("investorOnboardingBody")}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={nextStep?.href ?? "/dashboard/investor/peluang"}
                className="btn btn-primary rounded-md text-white"
              >
                {t(nextStep?.actionKey ?? "browseOpportunities")}
              </Link>
              <Link to="/dashboard/investor" className="btn btn-outline rounded-md">
                {t("backToOverview")}
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <ProgressRing value={progress} />
          </div>
        </div>
      </div>

      <InvestorStats
        negotiationCount={negotiations.length}
        investmentCount={investments.length}
        isLoading={negotiationsQuery.isLoading || investmentsQuery.isLoading}
      />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => (
          <StepCard key={step.key} step={step} index={index} />
        ))}
      </div>
    </section>
  );
}
