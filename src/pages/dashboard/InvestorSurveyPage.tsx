import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { ListSkeleton } from "../../components/PageSkeleton";
import { DashboardBreadcrumb } from "../../components/DashboardBreadcrumb";
import { apiClient, unwrap } from "../../lib/api/client";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { dateShort, percent, readPath, textValue } from "../../lib/format";
import type { Entity } from "../../types";

type InvestorPreferenceForm = {
  kepuasan_pelanggan: number;
  digital_adoption_score: number;
  net_profit_margin: number;
  year_revenue: number;
  business_tenure_years: number;
};

const defaultSurvey: InvestorPreferenceForm = {
  kepuasan_pelanggan: 4,
  digital_adoption_score: 7,
  net_profit_margin: 15,
  year_revenue: 500000000,
  business_tenure_years: 3,
};

const surveyFields: Array<{
  key: keyof InvestorPreferenceForm;
  label: string;
  help: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}> = [
  {
    key: "kepuasan_pelanggan",
    label: "surveyCustomerSatisfaction",
    help: "surveyCustomerSatisfactionHelp",
    min: 1,
    max: 5,
    step: 0.1,
    unit: "/5",
  },
  {
    key: "digital_adoption_score",
    label: "surveyDigitalScore",
    help: "surveyDigitalScoreHelp",
    min: 1,
    max: 10,
    step: 1,
    unit: "/10",
  },
  {
    key: "net_profit_margin",
    label: "surveyNetMargin",
    help: "surveyNetMarginHelp",
    min: -35,
    max: 100,
    step: 0.1,
    unit: "%",
  },
  {
    key: "year_revenue",
    label: "surveyAnnualRevenue",
    help: "surveyAnnualRevenueHelp",
    min: 18000000,
    max: 50000000000,
    step: 1000000,
  },
  {
    key: "business_tenure_years",
    label: "surveyBusinessTenure",
    help: "surveyBusinessTenureHelp",
    min: 0,
    max: 50,
    step: 0.5,
    unit: "yearUnit",
  },
];

const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return String(error.response.data.message);
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeRecommendations = (value: unknown): Entity[] => {
  if (Array.isArray(value)) return value as Entity[];
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    if (Array.isArray(objectValue.rekomendasi)) return objectValue.rekomendasi as Entity[];
    if (Array.isArray(objectValue.results)) return objectValue.results as Entity[];
    if (Array.isArray(objectValue.items)) return objectValue.items as Entity[];
  }
  return [];
};

const businessName = (item: Entity) =>
  textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "nama", "bisnis_id"]));

const businessClass = (item: Entity) =>
  textValue(readPath(item, ["bisnis.kelas.nama_kelas", "matched_class", "risk_level"]));

const matchScore = (item: Entity) => Number(readPath(item, ["skor_kecocokan", "match_score"], "0"));

export function InvestorSurveyPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InvestorPreferenceForm>(defaultSurvey);
  const [isDirty, setIsDirty] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const preferenceQuery = useQuery({
    queryKey: ["investor-preferences"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/user/investor/preferences");
        return unwrap<Record<string, unknown>>(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
    retry: false,
  });

  const recommendationsQuery = useQuery({
    queryKey: ["ai-recommendations", "survey"],
    queryFn: async () => {
      const response = await apiClient.get("/user/investor/recommendations");
      return unwrap<unknown>(response.data);
    },
    enabled: preferenceQuery.isSuccess && Boolean(preferenceQuery.data),
    retry: false,
  });

  const recommendations = useMemo(
    () =>
      normalizeRecommendations(recommendationsQuery.data).sort(
        (a, b) => matchScore(b) - matchScore(a),
      ),
    [recommendationsQuery.data],
  );

  const savedPreference = useMemo<InvestorPreferenceForm>(() => {
    if (!preferenceQuery.data) return defaultSurvey;
    return {
      kepuasan_pelanggan: Number(preferenceQuery.data.kepuasan_pelanggan ?? defaultSurvey.kepuasan_pelanggan),
      digital_adoption_score: Number(preferenceQuery.data.digital_adoption_score ?? defaultSurvey.digital_adoption_score),
      net_profit_margin: Number(preferenceQuery.data.net_profit_margin ?? defaultSurvey.net_profit_margin),
      year_revenue: Number(preferenceQuery.data.year_revenue ?? defaultSurvey.year_revenue),
      business_tenure_years: Number(preferenceQuery.data.business_tenure_years ?? defaultSurvey.business_tenure_years),
    };
  }, [preferenceQuery.data]);
  const activeForm = isDirty ? form : savedPreference;
  const hasSavedPreference = Boolean(preferenceQuery.data);
  const isFormValid = surveyFields.every((field) => {
    const value = Number(activeForm[field.key]);
    return Number.isFinite(value) && value >= field.min && value <= field.max;
  });
  const canSave = !preferenceQuery.isLoading && isFormValid && (isDirty || !hasSavedPreference);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sanitized = surveyFields.reduce<InvestorPreferenceForm>((payload, field) => {
        const raw = Number(activeForm[field.key]);
        if (!Number.isFinite(raw)) {
          throw new Error(t("surveySubmitError"));
        }
        payload[field.key] = clampValue(raw, field.min, field.max);
        return payload;
      }, {} as InvestorPreferenceForm);

      const response = await apiClient.post("/user/investor/preferences", sanitized);
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setSubmitted(true);
      setIsDirty(false);
      try {
        await apiClient.post("/user/investor/preferences/refresh");
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(apiErrorMessage(error, t("recommendationsRefreshError")));
      }
      setMessage(t("surveySubmitSuccess"));
      await queryClient.invalidateQueries({ queryKey: ["investor-preferences"] });
      await queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
    },
    onError: (error) => {
      setSubmitted(false);
      setMessage("");
      setErrorMessage(apiErrorMessage(error, t("surveySubmitError")));
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/user/investor/preferences/refresh");
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setMessage(t("recommendationsRefreshSuccess"));
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
    },
    onError: (error) => {
      setMessage("");
      setErrorMessage(apiErrorMessage(error, t("recommendationsRefreshError")));
    },
  });

  const update = (key: keyof InvestorPreferenceForm, value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const field = surveyFields.find((item) => item.key === key);
    if (!field) return;

    setIsDirty(true);
    setForm({ ...activeForm, [key]: clampValue(parsed, field.min, field.max) });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || saveMutation.isPending) return;
    saveMutation.mutate();
  };

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">
              <ClipboardList size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-normal text-neutral">{t("investorSurveyTitle")}</h2>
            <DashboardBreadcrumb />
          </div>
          <div className="rounded-md border border-info/20 bg-info/10 px-4 py-3 text-sm font-semibold text-info">
            {t("investorSurveyBackendMode")}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="rounded-md border border-base-300 bg-white p-6 shadow-sm" onSubmit={submit}>
          {preferenceQuery.isLoading ? (
            <div className="mb-4 rounded-md border border-base-300 bg-base-200 px-4 py-3 text-sm font-semibold text-neutral/65">
              {t("loading")}...
            </div>
          ) : null}
          {preferenceQuery.isError ? (
            <div className="mb-4 rounded-md border border-warning/20 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
              {apiErrorMessage(preferenceQuery.error, t("dataUnavailable"))}
            </div>
          ) : null}
          <div className="grid gap-5">
            {surveyFields.map((field) => (
              <label className="form-control" key={field.key}>
                <span className="label-text mb-2 font-semibold">{t(field.label)}</span>
                <div className="grid gap-3 sm:grid-cols-[1fr_8rem] sm:items-center">
                  <input
                    className="range range-primary"
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={activeForm[field.key]}
                    onChange={(event) => update(field.key, event.target.value)}
                  />
                  <div className="input input-bordered flex items-center gap-1 rounded-md bg-base-100">
                    <input
                      className="w-full"
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={activeForm[field.key]}
                      onChange={(event) => update(field.key, event.target.value)}
                      required
                    />
                    {field.unit ? (
                      <span className="text-xs font-bold text-neutral/45">
                        {field.unit === "yearUnit" ? t("yearUnit") : field.unit}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="mt-2 text-xs font-semibold leading-5 text-neutral/45">{t(field.help)}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="btn btn-primary rounded-md text-white" disabled={!canSave || saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
              {t("saveAndViewMatch")}
            </button>
            <button
              className="btn btn-outline rounded-md"
              type="button"
              onClick={() => {
                setForm(hasSavedPreference ? savedPreference : defaultSurvey);
                setIsDirty(false);
                setSubmitted(false);
                setMessage("");
                setErrorMessage("");
              }}
            >
              <RefreshCw size={18} />
              {t("reset")}
            </button>
          </div>

          {message ? (
            <div
              className="mt-5 flex gap-3 rounded-md border border-success/20 bg-success/10 p-4 text-success"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
              <p className="text-sm font-semibold">{message}</p>
            </div>
          ) : null}
          {errorMessage ? (
            <div
              className="mt-5 rounded-md border border-error/20 bg-error/10 p-4 text-sm font-semibold text-error"
              role="alert"
              aria-live="assertive"
            >
              {errorMessage}
            </div>
          ) : null}
          {submitted ? (
            <p className="mt-4 text-sm font-semibold text-neutral/55">{t("surveySyncedBackend")}</p>
          ) : null}
        </form>

        <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-black">{t("surveyMatchResultsTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral/60">{t("surveyMatchResultsBody")}</p>
            </div>
            <button
              className="btn btn-secondary rounded-md text-white"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending || !hasSavedPreference}
            >
              {refreshMutation.isPending ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
              {t("refresh")}
            </button>
          </div>

          {recommendationsQuery.isLoading ? (
            <div className="mt-5">
              <ListSkeleton rows={3} />
            </div>
          ) : null}
          {recommendationsQuery.isError ? (
            <div className="mt-5 rounded-md border border-warning/20 bg-warning/10 p-4 text-sm font-semibold text-warning">
              {apiErrorMessage(recommendationsQuery.error, t("recommendationsUnavailable"))}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            {recommendations.slice(0, 3).map((item, index) => (
              <article key={String(item.id)} className="rounded-md border border-base-300 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-neutral/40">
                      {t("match")} #{index + 1}
                    </p>
                    <h4 className="mt-2 text-lg font-black">{businessName(item)}</h4>
                    <p className="mt-1 text-sm text-neutral/55">{businessClass(item)}</p>
                  </div>
                  <span className="badge badge-secondary badge-lg text-white">
                    {percent(matchScore(item))}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-neutral/60">
                  {textValue(readPath(item, ["bisnis.deskripsi", "reason", "match_reason"], ""), t("recommendationDefaultReason"))}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-neutral/45">
                    {t("matchedAt")} {dateShort(readPath(item, ["matched_at"], ""))}
                  </span>
                  <Sparkles className="text-secondary" size={18} />
                </div>
              </article>
            ))}
          </div>

          {!recommendationsQuery.isLoading && !recommendationsQuery.isError && recommendations.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="noRecommendations"
                body={hasSavedPreference ? "surveyBackendEmpty" : "fillSurveyFirst"}
                compact
              />
            </div>
          ) : null}

          <Link to="/dashboard/investor/rekomendasi" className="btn btn-outline mt-5 w-full rounded-md">
            {t("openRecommendationPage")}
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
