import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Handshake,
  IdCard,
  LineChart,
  Lock,
  Rocket,
} from "lucide-react";
import { Link } from "react-router-dom";
import { directApi } from "../../lib/api/direct";
import { resourceApi } from "../../lib/api/resources";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { DashboardBreadcrumb } from "../../components/DashboardBreadcrumb";
import {
  myBusinessConfig,
  myNegotiationConfig,
  submissionConfig,
} from "../../lib/resourceConfigs";
import { compactCurrency, currency, readPath, statusTone, textValue } from "../../lib/format";
import type { Entity } from "../../types";

type OnboardingStep = {
  key: string;
  title: string;
  description: string;
  href: string;
  action: string;
  icon: typeof Rocket;
  done: boolean;
  locked?: boolean;
  helper: string;
  helperParams?: Record<string, string | number>;
};

const docsStorageKey = "fundraise_umkm_onboarding_docs";

const documentChecklist = [
  "onboardingDocIdentity",
  "onboardingDocContact",
  "onboardingDocBusiness",
  "onboardingDocFunding",
  "onboardingDocSales",
  "onboardingDocPhoto",
];

const approvalStatus = (item: Entity) =>
  String(readPath(item, ["approval.status", "approval_status", "status"], "draft")).toLowerCase();

const isApprovedSubmission = (item: Entity) =>
  ["approved", "published", "funded"].includes(approvalStatus(item));

const isPendingSubmission = (item: Entity) => approvalStatus(item) === "pending";

function ProgressRing({ value }: { value: number }) {
  const { t } = useLanguage();

  return (
    <div
      className="radial-progress text-primary"
      style={{ "--value": value, "--size": "7rem", "--thickness": "0.7rem" } as CSSProperties}
      role="progressbar"
      aria-label={t("umkmOnboardingProgress")}
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

function StepCard({ step, index }: { step: OnboardingStep; index: number }) {
  const { t } = useLanguage();
  const Icon = step.icon;

  return (
    <article
      className={[
        "rounded-md border bg-white p-5 shadow-sm",
        step.done ? "border-success/30" : step.locked ? "border-base-300 opacity-75" : "border-warning/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div
            className={[
              "grid h-11 w-11 shrink-0 place-items-center rounded-md",
              step.done ? "bg-success/10 text-success" : step.locked ? "bg-base-200 text-neutral/45" : "bg-warning/15 text-warning",
            ].join(" ")}
          >
            <Icon size={21} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-neutral/40">{t("step")} {index + 1}</p>
            <h3 className="mt-1 text-lg font-black text-neutral">{t(step.title)}</h3>
          </div>
        </div>
        <StepStatus done={step.done} locked={step.locked} />
      </div>
      <p className="mt-4 text-sm leading-6 text-neutral/60">{t(step.description)}</p>
      <p className="mt-3 rounded-md bg-base-200 px-3 py-2 text-xs font-semibold text-neutral/60">
        {t(step.helper, step.helperParams)}
      </p>
      <div className="mt-5">
        <Link
          to={step.href}
          className={[
            "btn h-10 rounded-md",
            step.locked ? "btn-disabled" : step.done ? "btn-outline" : "btn-primary text-white",
          ].join(" ")}
          aria-disabled={step.locked}
        >
          {t(step.action)}
        </Link>
      </div>
    </article>
  );
}

function DocumentChecklist() {
  const { t } = useLanguage();
  const [checkedDocs, setCheckedDocs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(docsStorageKey);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(docsStorageKey, JSON.stringify(checkedDocs));
  }, [checkedDocs]);

  const toggle = (item: string) => {
    setCheckedDocs((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  };

  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black">{t("preparationChecklist")}</h3>
          <p className="mt-1 text-sm text-neutral/55">{t("preparationChecklistBody")}</p>
        </div>
        <span className="badge badge-primary badge-lg text-white">
          {checkedDocs.length}/{documentChecklist.length}
        </span>
      </div>
      <div className="mt-5 grid gap-3">
        {documentChecklist.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-base-300 p-3 transition hover:bg-base-200"
          >
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm mt-0.5 rounded"
              checked={checkedDocs.includes(item)}
              onChange={() => toggle(item)}
            />
            <span className="text-sm font-semibold leading-5 text-neutral/70">{t(item)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SubmissionSnapshot({ submissions }: { submissions: Entity[] }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black">{t("submissionStatus")}</h3>
          <p className="mt-1 text-sm text-neutral/55">{t("submissionSnapshotBody")}</p>
        </div>
        <FileCheck2 className="text-primary" size={24} />
      </div>
      <div className="mt-5 grid gap-3">
        {submissions.length === 0 ? (
          <div className="rounded-md border border-base-300 p-4 text-sm font-semibold text-neutral/55">
            {t("noFundingSubmissions")}
          </div>
        ) : null}
        {submissions.slice(0, 4).map((item) => {
          const status = approvalStatus(item);
          return (
            <div key={item.id} className="rounded-md border border-base-300 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black">
                    {textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "nama", "bisnis_id"]))}
                  </p>
                  <p className="mt-1 text-sm text-neutral/55">{currency(item.target_pendanaan)}</p>
                </div>
                <span className={`badge ${statusTone(status)}`}>{status}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-base-200">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.min(
                      100,
                      (Number(item.total_pendanaan || 0) / Math.max(1, Number(item.target_pendanaan || 1))) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function UmkmOnboardingPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const businessesQuery = useQuery({
    queryKey: ["umkm-onboarding", "businesses"],
    queryFn: () => resourceApi.list(myBusinessConfig),
  });
  const submissionsQuery = useQuery({
    queryKey: ["umkm-onboarding", "submissions"],
    queryFn: () => resourceApi.list(submissionConfig),
  });
  const negotiationsQuery = useQuery({
    queryKey: ["umkm-onboarding", "negotiations"],
    queryFn: () => resourceApi.list(myNegotiationConfig),
  });

  const businesses = businessesQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];
  const negotiations = negotiationsQuery.data ?? [];
  const primaryBusiness = businesses[0];
  const primaryBusinessId = primaryBusiness?.id ? String(primaryBusiness.id) : "";

  const modelProfileQuery = useQuery({
    queryKey: ["umkm-onboarding", "business-profile", primaryBusinessId],
    queryFn: async () => {
      try {
        return await directApi.get(`/businesses/${primaryBusinessId}/profile`, null);
      } catch {
        return null;
      }
    },
    enabled: Boolean(primaryBusinessId),
  });
  const documentsQuery = useQuery({
    queryKey: ["umkm-onboarding", "documents", primaryBusinessId],
    queryFn: async () => {
      try {
        const payload = await directApi.get("/businesses/documents", null);
        if (Array.isArray(payload)) return payload as Entity[];
        if (payload && typeof payload === "object") {
          const objectPayload = payload as Record<string, unknown>;
          if (Array.isArray(objectPayload.dokumen)) return objectPayload.dokumen as Entity[];
          if (Array.isArray(objectPayload.items)) return objectPayload.items as Entity[];
        }
      } catch {
        return [] as Entity[];
      }
      return [] as Entity[];
    },
    enabled: Boolean(primaryBusinessId),
    retry: false,
  });

  const modelProfile = modelProfileQuery.data;
  const modelProfileRecord =
    modelProfile && typeof modelProfile === "object" && !Array.isArray(modelProfile)
      ? (modelProfile as Record<string, unknown>)
      : {};
  const accountReady = Boolean(user?.nama && user?.email && user?.no_telp);
  const hasBusiness = businesses.length > 0;
  const hasModelProfile = Boolean(
    modelProfileRecord.net_profit_margin !== undefined ||
      modelProfileRecord.year_revenue !== undefined ||
      modelProfileRecord.digital_adoption_score !== undefined,
  );
  const hasSubmission = submissions.length > 0;
  const hasReviewedSubmission = submissions.some(isApprovedSubmission);
  const hasPendingSubmission = submissions.some(isPendingSubmission);
  const hasNegotiation = negotiations.length > 0;
  const businessVerified =
    primaryBusiness?.is_verified === true ||
    String(readPath(primaryBusiness ?? { id: "" }, ["is_verified"], "")).toLowerCase() === "true";
  const backendDocuments = documentsQuery.data ?? [];
  const validDocumentCount = backendDocuments.filter(
    (item) => String(readPath(item, ["status"], "")).toLowerCase() === "valid",
  ).length;
  const pendingDocumentCount = backendDocuments.filter(
    (item) => String(readPath(item, ["status"], "")).toLowerCase() === "pending",
  ).length;
  const invalidDocumentCount = backendDocuments.filter(
    (item) => String(readPath(item, ["status"], "")).toLowerCase() === "invalid",
  ).length;
  const verificationTone = businessVerified
    ? "border-success/25 bg-success/5 text-success"
    : invalidDocumentCount > 0
      ? "border-error/25 bg-error/5 text-error"
      : "border-warning/25 bg-warning/5 text-warning";

  const steps = useMemo<OnboardingStep[]>(
    () => [
      {
        key: "account",
        title: "onboardingAccountTitle",
        description: "onboardingAccountBody",
        href: "/dashboard/umkm/profile",
        action: accountReady ? "reviewProfile" : "completeProfile",
        icon: IdCard,
        done: accountReady,
        helper: accountReady ? "onboardingAccountDone" : "onboardingAccountTodo",
      },
      {
        key: "business",
        title: "onboardingBusinessTitle",
        description: "onboardingBusinessBody",
        href: "/dashboard/umkm/bisnis",
        action: hasBusiness ? "manageBusiness" : "addBusiness",
        icon: Building2,
        done: hasBusiness,
        helper: hasBusiness
          ? "onboardingBusinessDone"
          : "onboardingBusinessTodo",
        helperParams: { count: businesses.length },
      },
      {
        key: "model",
        title: "onboardingModelTitle",
        description: "onboardingModelBody",
        href: "/dashboard/umkm/bisnis-profile",
        action: hasModelProfile ? "reviewModel" : "fillModel",
        icon: LineChart,
        done: hasModelProfile,
        locked: !hasBusiness,
        helper: hasBusiness
          ? hasModelProfile
            ? "onboardingModelDone"
            : "onboardingModelTodo"
          : "createBusinessFirst",
      },
      {
        key: "submission",
        title: "onboardingSubmissionTitle",
        description: "onboardingSubmissionBody",
        href: "/dashboard/umkm/pengajuan",
        action: hasSubmission ? "manageSubmission" : "createSubmission",
        icon: FileCheck2,
        done: hasSubmission,
        locked: !hasBusiness || !businessVerified,
        helper: hasSubmission
          ? "onboardingSubmissionDone"
          : "onboardingSubmissionTodo",
        helperParams: { count: submissions.length },
      },
      {
        key: "review",
        title: "onboardingReviewTitle",
        description: "onboardingReviewBody",
        href: "/dashboard/umkm/pengajuan",
        action: "checkStatus",
        icon: ClipboardCheck,
        done: hasReviewedSubmission,
        locked: !hasSubmission,
        helper: hasReviewedSubmission
          ? "onboardingReviewDone"
          : hasPendingSubmission
            ? "onboardingReviewPending"
            : "onboardingReviewTodo",
      },
      {
        key: "negotiation",
        title: "onboardingNegotiationTitle",
        description: "onboardingNegotiationBody",
        href: "/dashboard/umkm/negosiasi",
        action: "openNegotiations",
        icon: Handshake,
        done: hasNegotiation,
        locked: !hasReviewedSubmission,
        helper: hasNegotiation
          ? "onboardingNegotiationDone"
          : "onboardingNegotiationTodo",
        helperParams: { count: negotiations.length },
      },
      {
        key: "sales",
        title: "onboardingSalesTitle",
        description: "onboardingSalesBody",
        href: "/dashboard/umkm/penjualan",
        action: "inputSales",
        icon: BarChart3,
        done: false,
        locked: !hasReviewedSubmission,
        helper: "onboardingSalesTodo",
      },
    ],
    [
      accountReady,
      businesses.length,
      hasBusiness,
      businessVerified,
      hasModelProfile,
      hasNegotiation,
      hasPendingSubmission,
      hasReviewedSubmission,
      hasSubmission,
      negotiations.length,
      submissions.length,
    ],
  );

  const completedSteps = steps.filter((step) => step.done).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const nextStep = steps.find((step) => !step.done && !step.locked);
  const activeFundingTarget = submissions.reduce(
    (sum, item) => sum + Number(item.target_pendanaan || 0),
    0,
  );

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
              <Rocket size={15} />
              {t("umkmOnboarding")}
            </div>
            <h2 className="text-3xl font-black tracking-normal text-neutral">
              {t("umkmOnboardingTitle")}
            </h2>
            <DashboardBreadcrumb />
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral/60">
              {t("umkmOnboardingBody")}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={nextStep?.href ?? "/dashboard/umkm/pengajuan"}
                className="btn btn-primary rounded-md text-white"
              >
                {t(nextStep?.action ?? "reviewSubmission")}
              </Link>
              <Link to="/dashboard/umkm" className="btn btn-outline rounded-md">
                {t("backToOverview")}
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <ProgressRing value={progress} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral/50">{t("business")}</p>
          <p className="mt-2 text-3xl font-black">{businessesQuery.isLoading ? "-" : businesses.length}</p>
          <p className="mt-1 text-sm text-neutral/55">{t("registeredProfiles")}</p>
        </div>
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral/50">{t("submissions")}</p>
          <p className="mt-2 text-3xl font-black">{submissionsQuery.isLoading ? "-" : submissions.length}</p>
          <p className="mt-1 text-sm text-neutral/55">{t("fundingProposals")}</p>
        </div>
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral/50">{t("fundingTarget")}</p>
          <p className="mt-2 text-3xl font-black">{compactCurrency(activeFundingTarget)}</p>
          <p className="mt-1 text-sm text-neutral/55">{t("totalCapitalNeeds")}</p>
        </div>
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral/50">{t("negotiation")}</p>
          <p className="mt-2 text-3xl font-black">{negotiationsQuery.isLoading ? "-" : negotiations.length}</p>
          <p className="mt-1 text-sm text-neutral/55">{t("investorInteractions")}</p>
        </div>
      </div>

      {hasBusiness ? (
        <div className={`rounded-md border p-5 shadow-sm ${verificationTone}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white/70">
                <ClipboardCheck size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide opacity-75">
                  {language === "id" ? "Status verifikasi bisnis" : "Business verification status"}
                </p>
                <h3 className="mt-1 text-xl font-black">
                  {businessVerified
                    ? language === "id"
                      ? "Bisnis sudah diverifikasi"
                      : "Business is verified"
                    : language === "id"
                      ? "Menunggu verifikasi admin"
                      : "Waiting for admin verification"}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 opacity-75">
                  {language === "id"
                    ? "Pengajuan dana baru bisa dibuat setelah admin memverifikasi bisnis dan dokumen pendukung."
                    : "Funding submissions can be created after admin verifies the business and supporting documents."}
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[360px]">
              <div className="rounded-md bg-white/75 p-3">
                <p className="text-xs font-bold opacity-60">{language === "id" ? "Valid" : "Valid"}</p>
                <p className="mt-1 text-2xl font-black">{documentsQuery.isLoading ? "-" : validDocumentCount}</p>
              </div>
              <div className="rounded-md bg-white/75 p-3">
                <p className="text-xs font-bold opacity-60">{language === "id" ? "Menunggu" : "Pending"}</p>
                <p className="mt-1 text-2xl font-black">{documentsQuery.isLoading ? "-" : pendingDocumentCount}</p>
              </div>
              <div className="rounded-md bg-white/75 p-3">
                <p className="text-xs font-bold opacity-60">{language === "id" ? "Perlu perbaikan" : "Needs revision"}</p>
                <p className="mt-1 text-2xl font-black">{documentsQuery.isLoading ? "-" : invalidDocumentCount}</p>
              </div>
            </div>
            {!businessVerified ? (
              <Link to="/dashboard/umkm/dokumen" className="btn btn-outline rounded-md bg-white">
                {language === "id" ? "Cek dokumen" : "Check documents"}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          {steps.map((step, index) => (
            <StepCard key={step.key} step={step} index={index} />
          ))}
        </div>
        <div className="grid content-start gap-6">
          <DocumentChecklist />
          <SubmissionSnapshot submissions={submissions} />
        </div>
      </div>
    </section>
  );
}
