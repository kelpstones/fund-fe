import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useToast } from "./ToastProvider";
import { dashboardPathFor, useAuth } from "../lib/auth/AuthProvider";
import { directApi } from "../lib/api/direct";
import { apiErrorMessage } from "../lib/format";
import { useLanguage, type TranslationKey } from "../lib/i18n/LanguageProvider";
import { INVESTOR_QUICK_SETUP_OPEN_EVENT } from "../lib/investorQuickSetup";

type InvestorQuickPreferenceForm = {
  tujuan_investasi: string;
  risk_tolerance: string;
  tipe_umkm: string;
  cara_memilih: string;
  sektor: string;
};

type InvestorQuickPreferenceStep = {
  key: keyof InvestorQuickPreferenceForm;
  titleKey: TranslationKey;
  helpKey: TranslationKey;
  options: Array<{
    value: string;
    labelKey: TranslationKey;
    bodyKey: TranslationKey;
  }>;
};

type InvestorPreferenceMetricKey =
  | "kepuasan_pelanggan"
  | "digital_adoption_score"
  | "net_profit_margin"
  | "year_revenue"
  | "business_tenure_years";

const investorQuickPreferenceDefaults: InvestorQuickPreferenceForm = {
  tujuan_investasi: "campuran",
  risk_tolerance: "seimbang",
  tipe_umkm: "bertumbuh",
  cara_memilih: "data",
  sektor: "bebas",
};

const investorPreferenceMetricFields: Array<{
  key: InvestorPreferenceMetricKey;
  min: number;
  max: number;
}> = [
  { key: "kepuasan_pelanggan", min: 1, max: 5 },
  { key: "digital_adoption_score", min: 1, max: 10 },
  { key: "net_profit_margin", min: -35, max: 100 },
  { key: "business_tenure_years", min: 0, max: 50 },
  { key: "year_revenue", min: 18000000, max: 50000000000 },
];

const investorQuickPreferenceSteps: InvestorQuickPreferenceStep[] = [
  {
    key: "tujuan_investasi",
    titleKey: "investorQuickGoalTitle",
    helpKey: "investorQuickGoalHelp",
    options: [
      {
        value: "pendapatan_stabil",
        labelKey: "investorQuickGoalStable",
        bodyKey: "investorQuickGoalStableBody",
      },
      {
        value: "pertumbuhan_nilai",
        labelKey: "investorQuickGoalGrowth",
        bodyKey: "investorQuickGoalGrowthBody",
      },
      {
        value: "dampak_lokal",
        labelKey: "investorQuickGoalImpact",
        bodyKey: "investorQuickGoalImpactBody",
      },
      {
        value: "campuran",
        labelKey: "investorQuickGoalMixed",
        bodyKey: "investorQuickGoalMixedBody",
      },
    ],
  },
  {
    key: "risk_tolerance",
    titleKey: "investorQuickRiskTitle",
    helpKey: "investorQuickRiskHelp",
    options: [
      {
        value: "aman_stabil",
        labelKey: "investorQuickRiskSafe",
        bodyKey: "investorQuickRiskSafeBody",
      },
      {
        value: "seimbang",
        labelKey: "investorQuickRiskBalanced",
        bodyKey: "investorQuickRiskBalancedBody",
      },
      {
        value: "agresif",
        labelKey: "investorQuickRiskAggressive",
        bodyKey: "investorQuickRiskAggressiveBody",
      },
    ],
  },
  {
    key: "tipe_umkm",
    titleKey: "investorQuickUmkmTitle",
    helpKey: "investorQuickUmkmHelp",
    options: [
      {
        value: "stabil",
        labelKey: "investorQuickUmkmEstablished",
        bodyKey: "investorQuickUmkmEstablishedBody",
      },
      {
        value: "bertumbuh",
        labelKey: "investorQuickUmkmGrowing",
        bodyKey: "investorQuickUmkmGrowingBody",
      },
      {
        value: "berkembang",
        labelKey: "investorQuickUmkmPotential",
        bodyKey: "investorQuickUmkmPotentialBody",
      },
    ],
  },
  {
    key: "sektor",
    titleKey: "investorQuickSectorTitle",
    helpKey: "investorQuickSectorHelp",
    options: [
      {
        value: "kuliner",
        labelKey: "investorQuickSectorCulinary",
        bodyKey: "investorQuickSectorCulinaryBody",
      },
      {
        value: "fashion",
        labelKey: "investorQuickSectorFashion",
        bodyKey: "investorQuickSectorFashionBody",
      },
      {
        value: "agribisnis",
        labelKey: "investorQuickSectorAgribusiness",
        bodyKey: "investorQuickSectorAgribusinessBody",
      },
      {
        value: "jasa_teknologi",
        labelKey: "investorQuickSectorServiceTech",
        bodyKey: "investorQuickSectorServiceTechBody",
      },
      {
        value: "bebas",
        labelKey: "investorQuickSectorAny",
        bodyKey: "investorQuickSectorAnyBody",
      },
    ],
  },
  {
    key: "cara_memilih",
    titleKey: "investorQuickPickTitle",
    helpKey: "investorQuickPickHelp",
    options: [
      {
        value: "return",
        labelKey: "investorQuickPickReturn",
        bodyKey: "investorQuickPickReturnBody",
      },
      {
        value: "risiko",
        labelKey: "investorQuickPickRisk",
        bodyKey: "investorQuickPickRiskBody",
      },
      {
        value: "data",
        labelKey: "investorQuickPickData",
        bodyKey: "investorQuickPickDataBody",
      },
      {
        value: "minat",
        labelKey: "investorQuickPickInterest",
        bodyKey: "investorQuickPickInterestBody",
      },
    ],
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const investorPreferencesQueryKey = (userId?: string | number) =>
  ["investor-preferences", userId ?? "guest"] as const;

const hasCompleteInvestorPreference = (source: unknown) =>
  isRecord(source) &&
  investorPreferenceMetricFields.every((field) => {
    const value = Number(source[field.key]);
    return Number.isFinite(value) && value >= field.min && value <= field.max;
  });

const pickQuickPreferenceOption = (
  key: keyof InvestorQuickPreferenceForm,
  rawValue: unknown,
) => {
  const step = investorQuickPreferenceSteps.find((item) => item.key === key);
  const normalizedValue = String(rawValue ?? "");
  if (step?.options.some((option) => option.value === normalizedValue)) {
    return normalizedValue;
  }
  return investorQuickPreferenceDefaults[key];
};

const mapQuickPreferenceForm = (source: unknown): InvestorQuickPreferenceForm => {
  const data = isRecord(source) ? source : {};
  return {
    tujuan_investasi: pickQuickPreferenceOption("tujuan_investasi", data.tujuan_investasi),
    risk_tolerance: pickQuickPreferenceOption("risk_tolerance", data.risk_tolerance),
    tipe_umkm: pickQuickPreferenceOption("tipe_umkm", data.tipe_umkm),
    cara_memilih: pickQuickPreferenceOption("cara_memilih", data.cara_memilih),
    sektor: pickQuickPreferenceOption("sektor", data.sektor),
  };
};

export function InvestorPreferencePrompt() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<InvestorQuickPreferenceForm>(investorQuickPreferenceDefaults);
  const [manualOpen, setManualOpen] = useState(false);
  const [quickSetupResolved, setQuickSetupResolved] = useState(false);
  const [dismissedOverviewVisit, setDismissedOverviewVisit] = useState<string | null>(null);
  const role = user?.role;
  const investorOverviewPath = dashboardPathFor("investor");
  const overviewVisitKey = user?.id ? `${user.id}:${investorOverviewPath}:${location.key}` : "";

  useEffect(() => {
    setQuickSetupResolved(false);
  }, [user?.id]);

  const preferencesQuery = useQuery({
    queryKey: investorPreferencesQueryKey(user?.id),
    queryFn: async () => {
      try {
        return await directApi.get("/user/investor/preferences", null);
      } catch {
        return null;
      }
    },
    enabled: role === "investor" && Boolean(user?.id) && (!quickSetupResolved || manualOpen),
    retry: false,
  });

  const prefilledQuickForm = useMemo(
    () => mapQuickPreferenceForm(preferencesQuery.data),
    [preferencesQuery.data],
  );

  useEffect(() => {
    if (hasCompleteInvestorPreference(preferencesQuery.data)) {
      setQuickSetupResolved(true);
    }
  }, [preferencesQuery.data]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleManualOpen = () => {
      setForm(prefilledQuickForm);
      setActiveStep(0);
      setManualOpen(true);
    };

    window.addEventListener(INVESTOR_QUICK_SETUP_OPEN_EVENT, handleManualOpen);
    return () => {
      window.removeEventListener(INVESTOR_QUICK_SETUP_OPEN_EVENT, handleManualOpen);
    };
  }, [prefilledQuickForm]);

  const closeForVisit = (status: "skipped" | "completed") => {
    if (
      !manualOpen &&
      (status === "skipped" || status === "completed") &&
      overviewVisitKey &&
      location.pathname === investorOverviewPath
    ) {
      setDismissedOverviewVisit(overviewVisitKey);
    }
    setManualOpen(false);
    setActiveStep(0);
    setForm(prefilledQuickForm);
  };

  const shouldAutoOpen =
    role === "investor" &&
    Boolean(user?.id) &&
    !preferencesQuery.isLoading &&
    Boolean(overviewVisitKey) &&
    location.pathname === investorOverviewPath &&
    dismissedOverviewVisit !== overviewVisitKey &&
    !hasCompleteInvestorPreference(preferencesQuery.data);
  const shouldOpen = shouldAutoOpen || (role === "investor" && Boolean(user?.id) && manualOpen);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        tujuan_investasi: form.tujuan_investasi,
        risk_tolerance: form.risk_tolerance,
        tipe_umkm: form.tipe_umkm,
        cara_memilih: form.cara_memilih,
      };
      await directApi.post("/user/investor/preferences", payload);

      try {
        const sectorQuery = form.sektor && form.sektor !== "bebas"
          ? `?sektor=${encodeURIComponent(form.sektor)}`
          : "";
        await directApi.post(`/user/investor/preferences/refresh${sectorQuery}`);
        return { refreshFailed: false };
      } catch {
        return { refreshFailed: true };
      }
    },
    onSuccess: async (result) => {
      setQuickSetupResolved(true);
      closeForVisit("completed");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["investor-preferences"] }),
        queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] }),
      ]);

      if (result.refreshFailed) {
        toast.warning(t("investorQuickSetupRefreshWarning"));
        return;
      }
      toast.success(t("investorQuickSetupSuccess"));
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, t("investorQuickSetupError")));
    },
  });

  if (!shouldOpen) return null;

  const field = investorQuickPreferenceSteps[activeStep];
  const value = form[field.key];
  const progress = Math.round(((activeStep + 1) / investorQuickPreferenceSteps.length) * 100);
  const isLastStep = activeStep === investorQuickPreferenceSteps.length - 1;
  const valueIsValid = field.options.some((option) => option.value === value);

  const update = (nextValue: string) => {
    setForm((current) => ({
      ...current,
      [field.key]: nextValue,
    }));
  };

  const goNext = () => {
    if (!valueIsValid) return;
    if (!isLastStep) {
      setActiveStep((step) => step + 1);
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box fr-modal-panel w-[calc(100vw-1.5rem)] max-w-2xl rounded-md p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <ClipboardList size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="text-2xl font-black text-neutral sm:text-3xl">{t("investorQuickSetupTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral/60">{t("investorQuickSetupBody")}</p>
          </div>
        </div>

        <div className="mt-6 h-2 rounded-full bg-base-200">
          <div
            className="h-2 rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-6 rounded-md border border-base-300 bg-base-100 p-5">
          <div>
            <h4 className="text-lg font-black text-neutral">{t(field.titleKey)}</h4>
            <p className="mt-1 text-sm font-semibold leading-6 text-neutral/55">
              {t(field.helpKey)}
            </p>
          </div>
          <div className="mt-5 grid gap-3">
            {field.options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-md border p-4 text-left transition ${
                    isSelected
                      ? "border-primary bg-primary/10 text-neutral shadow-sm"
                      : "border-base-300 bg-white hover:border-primary/40 hover:bg-primary/5"
                  }`}
                  onClick={() => update(option.value)}
                  aria-pressed={isSelected}
                >
                  <span className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        isSelected ? "border-primary bg-primary" : "border-base-300 bg-white"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-black">{t(option.labelKey)}</span>
                      <span className="mt-1 block text-sm font-semibold leading-5 text-neutral/55">
                        {t(option.bodyKey)}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold leading-5 text-neutral/45">
          {t("investorQuickSetupEditHint")}
        </p>

        <div className="modal-action flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="btn btn-ghost rounded-md"
            onClick={() => closeForVisit("skipped")}
            disabled={saveMutation.isPending}
          >
            {t("investorQuickSetupSkip")}
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="btn btn-outline rounded-md"
              onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
              disabled={activeStep === 0 || saveMutation.isPending}
            >
              {t("back")}
            </button>
            <button
              type="button"
              className="btn btn-primary rounded-md text-white"
              onClick={goNext}
              disabled={!valueIsValid || saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : null}
              {isLastStep ? t("investorQuickSetupSave") : t("next")}
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="modal-backdrop fr-modal-backdrop"
        onClick={() => closeForVisit("skipped")}
        aria-label={t("investorQuickSetupSkip")}
      />
    </div>
  );
}
