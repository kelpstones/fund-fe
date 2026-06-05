import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2, RefreshCw, Save } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { directApi } from "../../lib/api/direct";
import { apiClient, unwrap } from "../../lib/api/client";
import { resourceApi } from "../../lib/api/resources";
import { openInvestorQuickSetupPrompt } from "../../lib/investorQuickSetup";
import { businessConfig, myBusinessConfig } from "../../lib/resourceConfigs";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { DashboardBreadcrumb } from "../../components/DashboardBreadcrumb";
import { apiErrorMessage } from "../../lib/format";

function Panel({
  title,
  description,
  showBreadcrumb = false,
  children,
}: {
  title: string;
  description?: string;
  showBreadcrumb?: boolean;
  children: ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <section className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-black">{t(title)}</h2>
        {showBreadcrumb ? <DashboardBreadcrumb /> : null}
        {description ? <p className="mt-2 text-sm leading-6 text-neutral/60">{t(description)}</p> : null}
      </div>
      {children}
    </section>
  );
}

const asRecord = (data: unknown): Record<string, unknown> =>
  data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

type LocalizedCopy = { id: string; en: string };

const localeText = (text: LocalizedCopy, language: "id" | "en") =>
  language === "id" ? text.id : text.en;

const getUnitPaddingClass = (unit: LocalizedCopy | undefined, language: "id" | "en") => {
  if (!unit) return "";
  const text = localeText(unit, language);
  if (text.length > 3) return "pr-12";
  if (text.length > 1) return "pr-10";
  return "pr-8";
};

function DetailRows({ rows }: { rows: Array<[string, unknown]> }) {
  const { t } = useLanguage();

  return (
    <div className="overflow-hidden rounded-md border border-base-300">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid gap-1 border-b border-base-300 px-4 py-3 last:border-b-0 sm:grid-cols-[0.45fr_0.55fr]"
        >
          <span className="text-sm font-semibold text-neutral/55">{t(label)}</span>
          <span className="text-sm font-bold text-neutral">{displayValue(value)}</span>
        </div>
      ))}
    </div>
  );
}

function SyncStatus({
  label,
  isLoading,
  isError,
  hasData,
}: {
  label: string;
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
}) {
  const { t } = useLanguage();
  const tone = isLoading
    ? "badge-warning"
    : isError || !hasData
      ? "badge-error"
      : "badge-success";
  const text = isLoading ? "loading" : isError || !hasData ? "unavailable" : "available";

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-base-300 p-4">
      <span className="text-sm font-bold">{t(label)}</span>
      <span className={`badge ${tone} text-white`}>{t(text)}</span>
    </div>
  );
}

export function ProfilePage() {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const canEditProfile = !isAdmin || user?.role === "superadmin";
  const readonlyNotice = isAdmin ? t("adminProfileReadonly") : t("userProfileReadonly");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [form, setForm] = useState<{
    nama: string;
    email: string;
    no_telp: string;
    level: string;
  }>({
    nama: user?.nama ?? "",
    email: user?.email ?? "",
    no_telp: user?.no_telp ?? "",
    level: user?.level ?? "admin",
  });

  const meQuery = useQuery({
    queryKey: ["profile", "me", user?.role],
    queryFn: () =>
      isAdmin
        ? directApi.get("/admin/me", user)
        : directApi.get(user?.role === "investor" ? "/user/profile/investor" : "/user/profile", user),
  });

  const adminDetailQuery = useQuery({
    queryKey: ["profile", "admin-detail", user?.id],
    queryFn: () => directApi.get(`/admin/${user?.id}`, user),
    enabled: isAdmin && Boolean(user?.id),
  });

  const meRecord = asRecord(meQuery.data);
  const adminRecord = asRecord(adminDetailQuery.data);
  const syncedForm = useMemo(
    () => {
      const source = isAdmin ? adminRecord : meRecord;
      return {
        nama: String(source.nama ?? user?.nama ?? ""),
        email: String(source.email ?? user?.email ?? ""),
        no_telp: String(source.no_telp ?? user?.no_telp ?? ""),
        level: String(source.level ?? user?.level ?? "admin"),
      };
    },
    [
      adminRecord,
      isAdmin,
      meRecord,
      user?.email,
      user?.level,
      user?.nama,
      user?.no_telp,
    ],
  );
  const activeForm = isProfileDirty ? form : syncedForm;

  const updateMutation = useMutation({
    mutationFn: async () => {
      const nama = activeForm.nama.trim();
      const email = activeForm.email.trim();
      const noTelp = activeForm.no_telp.trim();
      const level = activeForm.level.trim();

      const localUpdates: Partial<{
        nama: string;
        email: string;
        no_telp: string;
        level: "admin" | "superadmin";
      }> = {};

      if (nama) localUpdates.nama = nama;
      if (email) localUpdates.email = email;
      if (noTelp) localUpdates.no_telp = noTelp;
      if (isAdmin && (level === "admin" || level === "superadmin")) {
        localUpdates.level = level;
      }

      if (!localUpdates.nama || !localUpdates.email) {
        throw new Error(t("profileSaveError"));
      }

      if (isAdmin && user?.id) {
        const response = await apiClient.put(`/admin/${user.id}`, localUpdates);
        unwrap<unknown>(response.data);
      } else {
        const response = await apiClient.put("/user/profile", localUpdates);
        unwrap<unknown>(response.data);
      }

      updateUser(localUpdates);
      return localUpdates;
    },
    onSuccess: async () => {
      setForm(activeForm);
      setIsProfileDirty(false);
      setSaveMessage(t("profileSaveSuccess"));
      setSaveError("");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => {
      setSaveMessage("");
      setSaveError(apiErrorMessage(err, t("profileSaveError")));
    },
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canEditProfile) updateMutation.mutate();
  };

  return (
    <div className="grid gap-5">
      <Panel
        title="Profile"
        description="profilePanelDescription"
        showBreadcrumb
      >
        <form className="grid gap-4" onSubmit={submit}>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">{t("name")}</span>
            <input
              className="input input-bordered rounded-md"
              value={activeForm.nama}
              onChange={(event) => {
                setIsProfileDirty(true);
                setForm((current) => ({ ...activeForm, ...current, nama: event.target.value }));
              }}
              disabled={!canEditProfile}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">{t("email")}</span>
            <input
              type="email"
              className="input input-bordered rounded-md"
              value={activeForm.email}
              onChange={(event) => {
                setIsProfileDirty(true);
                setForm((current) => ({ ...activeForm, ...current, email: event.target.value }));
              }}
              disabled={!canEditProfile}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">{t("phone")}</span>
            <input
              className="input input-bordered rounded-md"
              value={activeForm.no_telp}
              onChange={(event) => {
                setIsProfileDirty(true);
                setForm((current) => ({ ...activeForm, ...current, no_telp: event.target.value }));
              }}
              disabled={!canEditProfile}
            />
          </label>
          {isAdmin ? (
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("level")}</span>
              <select
                className="select select-bordered rounded-md"
                value={activeForm.level}
                onChange={(event) => {
                  setIsProfileDirty(true);
                  setForm((current) => ({ ...activeForm, ...current, level: event.target.value }));
                }}
                disabled={!canEditProfile}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </label>
          ) : null}
          {canEditProfile ? (
            <button
              className="btn btn-primary rounded-md text-white"
              disabled={updateMutation.isPending || !isProfileDirty}
            >
              {updateMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t("saveProfile")}
            </button>
          ) : (
            <div className="rounded-md border border-info/20 bg-info/10 px-4 py-3 text-sm font-semibold text-info">
              {readonlyNotice}
            </div>
          )}
          {saveMessage ? (
            <div className="rounded-md border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
              {saveMessage}
            </div>
          ) : null}
          {saveError ? (
            <div className="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
              {saveError}
            </div>
          ) : null}
        </form>
      </Panel>
    </div>
  );
}

type InvestorPreferenceForm = {
  kepuasan_pelanggan: number;
  digital_adoption_score: number;
  net_profit_margin: number;
  year_revenue: number;
  business_tenure_years: number;
};

const defaultInvestorPreference: InvestorPreferenceForm = {
  kepuasan_pelanggan: 3.5,
  digital_adoption_score: 7,
  net_profit_margin: 15,
  year_revenue: 500000000,
  business_tenure_years: 3,
};

const investorPreferenceFields: Array<{
  key: keyof InvestorPreferenceForm;
  label: LocalizedCopy;
  help: LocalizedCopy;
  min: number;
  max: number;
  step: number;
  unit?: LocalizedCopy;
}> = [
  {
    key: "year_revenue",
    label: { id: "Target omzet tahunan", en: "Target yearly revenue" },
    help: { id: "Estimasi omzet dalam 12 bulan terakhir.", en: "Estimated revenue in the last 12 months." },
    min: 18000000,
    max: 50000000000,
    step: 1000000,
    unit: { id: "Rp", en: "IDR" },
  },
  {
    key: "kepuasan_pelanggan",
    label: { id: "Target kepuasan pelanggan", en: "Target customer satisfaction" },
    help: { id: "Skor 1-5 dari kualitas layanan.", en: "Score 1-5 based on service quality." },
    min: 1,
    max: 5,
    step: 0.1,
    unit: { id: "/5", en: "/5" },
  },
  {
    key: "digital_adoption_score",
    label: { id: "Target kematangan digital", en: "Target digital maturity" },
    help: { id: "Skor 1-10 untuk kesiapan digital bisnis.", en: "Score 1-10 for business digital readiness." },
    min: 1,
    max: 10,
    step: 1,
    unit: { id: "/10", en: "/10" },
  },
  {
    key: "net_profit_margin",
    label: { id: "Target margin laba bersih", en: "Target net profit margin" },
    help: { id: "Persentase laba bersih terhadap omzet.", en: "Net profit percentage against revenue." },
    min: -35,
    max: 100,
    step: 0.1,
    unit: { id: "%", en: "%" },
  },
  {
    key: "business_tenure_years",
    label: { id: "Lama usaha", en: "Business tenure" },
    help: { id: "Total usia usaha dalam tahun.", en: "Total business age in years." },
    min: 0,
    max: 50,
    step: 0.1,
    unit: { id: "tahun", en: "years" },
  },
];

const investorPreferenceFieldByKey = Object.fromEntries(
  investorPreferenceFields.map((field) => [field.key, field]),
) as Record<keyof InvestorPreferenceForm, (typeof investorPreferenceFields)[number]>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const decimalFromStep = (step: number) => {
  const stepText = String(step);
  return stepText.includes(".") ? stepText.split(".")[1].length : 0;
};

const sanitizePreferenceValue = (rawValue: unknown, field: (typeof investorPreferenceFields)[number]) => {
  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue)) return field.min;
  const clampedValue = clamp(parsedValue, field.min, field.max);
  const decimals = decimalFromStep(field.step);
  return Number(clampedValue.toFixed(decimals));
};

const sanitizePreferenceForm = (source: Record<string, unknown> | InvestorPreferenceForm) =>
  investorPreferenceFields.reduce<InvestorPreferenceForm>(
    (accumulator, field) => ({
      ...accumulator,
      [field.key]: sanitizePreferenceValue(source[field.key], field),
    }),
    defaultInvestorPreference,
  );

export function InvestorPreferencesPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const revenueNumberFormatter = useMemo(
    () => new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US"),
    [language],
  );
  const [form, setForm] = useState<InvestorPreferenceForm>(defaultInvestorPreference);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const preferenceQueryKey = ["investor-preferences", user?.id ?? "guest"];

  const preferenceQuery = useQuery({
    queryKey: preferenceQueryKey,
    queryFn: async () => {
      try {
        const response = await apiClient.get("/user/investor/preferences");
        return unwrap<Record<string, unknown>>(response.data);
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err as { response?: { status?: number } }).response?.status === 404
        ) {
          return null;
        }
        throw err;
      }
    },
  });

  const savedPreference = preferenceQuery.data
    ? sanitizePreferenceForm(preferenceQuery.data)
    : defaultInvestorPreference;
  const activeForm = isDirty ? form : savedPreference;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = sanitizePreferenceForm(activeForm);
      const response = await apiClient.post("/user/investor/preferences", payload);
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setForm(sanitizePreferenceForm(activeForm));
      setIsDirty(false);
      setMessage(t("preferencesSaveSuccess"));
      setError("");
      await queryClient.invalidateQueries({ queryKey: preferenceQueryKey });
      await queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
    },
    onError: (err) => {
      setMessage("");
      setError(apiErrorMessage(err, t("preferencesSaveError")));
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/user/investor/preferences/refresh");
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setMessage(t("recommendationsRefreshSuccess"));
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
    },
    onError: (err) => {
      setMessage("");
      setError(apiErrorMessage(err, t("recommendationsRefreshError")));
    },
  });

  const update = (key: keyof InvestorPreferenceForm, value: string) => {
    const field = investorPreferenceFieldByKey[key];
    const parsedValue = Number(value.replace(",", "."));
    setIsDirty(true);
    setForm({
      ...activeForm,
      [key]: Number.isFinite(parsedValue) ? parsedValue : field.min,
    });
  };
  const canSave = isDirty && !saveMutation.isPending && !preferenceQuery.isLoading;
  const hasSavedPreference = Boolean(preferenceQuery.data);
  const canRefresh = hasSavedPreference && !isDirty && !refreshMutation.isPending;

  return (
    <div className="grid gap-5">
      <Panel
        title="investorPreferencesTitle"
        description="investorPreferencesBody"
        showBreadcrumb
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) return;
            saveMutation.mutate();
          }}
        >
          {preferenceQuery.isError ? (
            <div className="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
              {apiErrorMessage(preferenceQuery.error, t("preferencesSaveError"))}
            </div>
          ) : null}
          <div className="rounded-md border border-base-300 bg-base-100 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black text-neutral">
                  {language === "id" ? "Survey preferensi cepat" : "Quick preference survey"}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral/55">
                  {language === "id"
                    ? "Ingin ubah jawaban 5 pertanyaan? Buka ulang survey cepat."
                    : "Want to update your 5 survey answers? Reopen the quick survey."}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline rounded-md"
                onClick={openInvestorQuickSetupPrompt}
              >
                <ClipboardList size={17} />
                {language === "id" ? "Isi/Ubah Survey" : "Open Survey"}
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {investorPreferenceFields.map((field) => (
              <label
                className={`form-control ${field.key === "year_revenue" ? "sm:col-span-2" : ""}`}
                key={field.key}
              >
                <span className="label-text mb-2 font-semibold">
                  {localeText(field.label, language)}
                </span>
                {field.key === "year_revenue" ? (
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-black text-neutral/55">
                      IDR
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input input-bordered w-full rounded-md pl-14"
                      value={revenueNumberFormatter.format(Number(activeForm[field.key] || 0))}
                      onChange={(event) =>
                        update(field.key, event.target.value.replace(/[^\d]/g, ""))
                      }
                      required
                    />
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-[1fr_120px] sm:items-center">
                    <input
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      className="range range-neutral range-sm"
                      value={Number(activeForm[field.key] || 0)}
                      onChange={(event) => update(field.key, event.target.value)}
                      aria-label={localeText(field.label, language)}
                    />
                    <div className="relative">
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        className={`input input-bordered w-full rounded-md text-right ${getUnitPaddingClass(field.unit, language)}`}
                        value={String(activeForm[field.key])}
                        onChange={(event) => update(field.key, event.target.value)}
                        required
                      />
                      {field.unit ? (
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-black text-neutral/45">
                          {localeText(field.unit, language)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
                <span className="mt-2 text-xs font-semibold text-neutral/55">
                  {localeText(field.help, language)}{" "}
                  {field.unit ? `(${localeText(field.unit, language)})` : ""}
                  {" - "}
                  {language === "id"
                    ? `Rentang ${field.min} - ${field.max}`
                    : `Range ${field.min} - ${field.max}`}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn btn-primary rounded-md text-white" disabled={!canSave}>
              {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t("savePreferences")}
            </button>
            <button
              type="button"
              className="btn btn-secondary rounded-md text-white"
              onClick={() => refreshMutation.mutate()}
              disabled={!canRefresh}
            >
              {refreshMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              {t("refreshRecommendations")}
            </button>
          </div>
          {message ? (
            <div className="rounded-md border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
              {error}
            </div>
          ) : null}
        </form>
      </Panel>
    </div>
  );
}

const defaultBusinessProfileForm = {
  net_profit_margin: 15.5,
  kepuasan_pelanggan: 3.5,
  peak_hour_latency: "medium",
  review_volatility: 0.8,
  repeat_order_rate: 65,
  digital_adoption_score: 7,
  year_revenue: 500000000,
  business_tenure_years: 2.5,
  class: 2,
};

type BusinessNumericFieldKey =
  | "year_revenue"
  | "net_profit_margin"
  | "business_tenure_years"
  | "kepuasan_pelanggan"
  | "repeat_order_rate"
  | "review_volatility"
  | "digital_adoption_score";

type BusinessFieldSection = "financial" | "customer" | "growth";

type BusinessFieldMeta = {
  key: BusinessNumericFieldKey;
  section: BusinessFieldSection;
  label: LocalizedCopy;
  help: LocalizedCopy;
  min: number;
  max: number;
  step: number;
  unit?: LocalizedCopy;
};

const numericStepPrecision = (step: number) => {
  const stepText = String(step);
  return stepText.includes(".") ? stepText.split(".")[1].length : 0;
};

const sanitizeBusinessFieldValue = (
  rawValue: number,
  field: BusinessFieldMeta,
) => {
  if (!Number.isFinite(rawValue)) return field.min;
  const clamped = Math.min(field.max, Math.max(field.min, rawValue));
  const precision = numericStepPrecision(field.step);
  return Number(clamped.toFixed(precision));
};

const businessProfileSections: Array<{
  key: BusinessFieldSection;
  title: LocalizedCopy;
}> = [
  {
    key: "financial",
    title: { id: "Keuangan dasar", en: "Financial basics" },
  },
  {
    key: "customer",
    title: { id: "Pelanggan & operasional", en: "Customer & operations" },
  },
  {
    key: "growth",
    title: { id: "Kesiapan pertumbuhan", en: "Growth readiness" },
  },
];

const businessProfileFields: BusinessFieldMeta[] = [
  {
    key: "year_revenue",
    section: "financial",
    label: { id: "Omset tahunan", en: "Yearly revenue" },
    help: {
      id: "Total omset dalam 1 tahun terakhir.",
      en: "Total revenue from the latest 1 year period.",
    },
    min: 18000000,
    max: 50000000000,
    step: 1000000,
    unit: { id: "Rp", en: "IDR" },
  },
  {
    key: "net_profit_margin",
    section: "financial",
    label: { id: "Margin laba bersih", en: "Net profit margin" },
    help: {
      id: "Persentase laba bersih terhadap penjualan.",
      en: "Net profit percentage against sales.",
    },
    min: -35,
    max: 100,
    step: 0.1,
    unit: { id: "%", en: "%" },
  },
  {
    key: "kepuasan_pelanggan",
    section: "customer",
    label: { id: "Kepuasan pelanggan", en: "Customer satisfaction" },
    help: {
      id: "Skor kepuasan pelanggan (1 sampai 5).",
      en: "Customer satisfaction score (1 to 5).",
    },
    min: 1,
    max: 5,
    step: 0.1,
    unit: { id: "/5", en: "/5" },
  },
  {
    key: "repeat_order_rate",
    section: "customer",
    label: { id: "Repeat order rate", en: "Repeat order rate" },
    help: {
      id: "Persentase pelanggan yang membeli kembali.",
      en: "Percentage of customers who reorder.",
    },
    min: 0,
    max: 100,
    step: 1,
    unit: { id: "%", en: "%" },
  },
  {
    key: "review_volatility",
    section: "customer",
    label: { id: "Volatilitas review", en: "Review volatility" },
    help: {
      id: "Stabilitas nilai review pelanggan (semakin kecil semakin stabil).",
      en: "Customer review stability (lower means more stable).",
    },
    min: 0,
    max: 5,
    step: 0.1,
  },
  {
    key: "digital_adoption_score",
    section: "growth",
    label: { id: "Skor adopsi digital", en: "Digital adoption score" },
    help: {
      id: "Seberapa jauh bisnis memakai tools digital (1 sampai 10).",
      en: "How far the business adopts digital tools (1 to 10).",
    },
    min: 1,
    max: 10,
    step: 1,
    unit: { id: "/10", en: "/10" },
  },
  {
    key: "business_tenure_years",
    section: "growth",
    label: { id: "Usia bisnis", en: "Business age" },
    help: {
      id: "Lama bisnis berjalan dalam tahun.",
      en: "Business operating duration in years.",
    },
    min: 0,
    max: 50,
    step: 0.5,
    unit: { id: "tahun", en: "years" },
  },
];

const peakLatencyOptions: Array<{ value: string; label: LocalizedCopy }> = [
  { value: "low", label: { id: "Rendah", en: "Low" } },
  { value: "medium", label: { id: "Sedang", en: "Medium" } },
  { value: "high", label: { id: "Tinggi", en: "High" } },
];

export function BusinessProfilePage() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [bisnisId, setBisnisId] = useState("");
  const [form, setForm] = useState(defaultBusinessProfileForm);
  const [isDirty, setIsDirty] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const isUmkm = user?.role === "umkm";
  const canSeeMlProfiles = user?.role === "admin" || user?.role === "superadmin";
  const businessOptionsQuery = useQuery({
    queryKey: ["business-profile", "business-options", user?.role],
    queryFn: () => resourceApi.list(canSeeMlProfiles ? businessConfig : myBusinessConfig),
  });
  const businessOptions = useMemo(
    () =>
      (businessOptionsQuery.data ?? []).map((item) => ({
        id: String(item.id),
        label: `${displayValue(item.nama_bisnis ?? item.nama)}`,
      })),
    [businessOptionsQuery.data],
  );
  const hasSingleBusinessOption = businessOptions.length === 1;

  const activeBisnisId = bisnisId || businessOptions[0]?.id || "";

  const profileQuery = useQuery({
    queryKey: ["business-profile", activeBisnisId],
    queryFn: () => directApi.get(`/businesses/${activeBisnisId}/profile`, form),
    enabled: Boolean(activeBisnisId),
  });

  const mlProfilesQuery = useQuery({
    queryKey: ["business-profile", "ml"],
    queryFn: () => directApi.get("/businesses/ml", []),
    enabled: canSeeMlProfiles,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/businesses/${activeBisnisId}/profile`, {
        net_profit_margin: activeBusinessProfile.net_profit_margin,
        kepuasan_pelanggan: activeBusinessProfile.kepuasan_pelanggan,
        peak_hour_latency: activeBusinessProfile.peak_hour_latency,
        review_volatility: activeBusinessProfile.review_volatility,
        repeat_order_rate: activeBusinessProfile.repeat_order_rate,
        digital_adoption_score: activeBusinessProfile.digital_adoption_score,
        year_revenue: activeBusinessProfile.year_revenue,
        business_tenure_years: activeBusinessProfile.business_tenure_years,
      });
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setForm(activeBusinessProfile);
      setIsDirty(false);
      setProfileMessage(t("businessProfileSaveSuccess"));
      setProfileError("");
      await queryClient.invalidateQueries({ queryKey: ["business-profile", activeBisnisId] });
    },
    onError: (err) => {
      setProfileMessage("");
      setProfileError(apiErrorMessage(err, t("businessProfileSaveError")));
    },
  });

  const profileData = asRecord(profileQuery.data);
  const savedBusinessProfile =
    profileData.net_profit_margin === undefined
      ? defaultBusinessProfileForm
      : {
        net_profit_margin: Number(profileData.net_profit_margin ?? defaultBusinessProfileForm.net_profit_margin),
        kepuasan_pelanggan: Number(profileData.kepuasan_pelanggan ?? defaultBusinessProfileForm.kepuasan_pelanggan),
        peak_hour_latency: String(profileData.peak_hour_latency ?? defaultBusinessProfileForm.peak_hour_latency),
        review_volatility: Number(profileData.review_volatility ?? defaultBusinessProfileForm.review_volatility),
        repeat_order_rate: Number(profileData.repeat_order_rate ?? defaultBusinessProfileForm.repeat_order_rate),
        digital_adoption_score: Number(profileData.digital_adoption_score ?? defaultBusinessProfileForm.digital_adoption_score),
        year_revenue: Number(profileData.year_revenue ?? defaultBusinessProfileForm.year_revenue),
        business_tenure_years: Number(profileData.business_tenure_years ?? defaultBusinessProfileForm.business_tenure_years),
        class: Number.isFinite(Number(profileData.class))
          ? Number(profileData.class)
          : defaultBusinessProfileForm.class,
      };
  const activeBusinessProfile = isDirty ? form : savedBusinessProfile;

  const groupedFields = useMemo(
    () =>
      businessProfileSections.map((section) => ({
        ...section,
        fields: businessProfileFields.filter((field) => field.section === section.key),
      })),
    [],
  );

  const updateNumber = (key: BusinessNumericFieldKey, value: string) => {
    const field = businessProfileFields.find((item) => item.key === key);
    if (!field) return;
    const parsed = Number(value.replace(",", "."));
    if (!Number.isFinite(parsed)) return;
    const nextValue = sanitizeBusinessFieldValue(parsed, field);
    setIsDirty(true);
    setForm({ ...activeBusinessProfile, [key]: nextValue });
  };

  const updateNumberFromText = (key: BusinessNumericFieldKey, value: string) => {
    const field = businessProfileFields.find((item) => item.key === key);
    if (!field) return;
    const parsed = Number(value.replace(/[^\d-]/g, ""));
    if (!Number.isFinite(parsed)) return;
    const nextValue = sanitizeBusinessFieldValue(parsed, field);
    setIsDirty(true);
    setForm({ ...activeBusinessProfile, [key]: nextValue });
  };

  const businessProfile = {
    ...asRecord(profileQuery.data),
    ...activeBusinessProfile,
  };
  const idrFormatter = useMemo(
    () =>
      new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }),
    [language],
  );
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(language === "id" ? "id-ID" : "en-US"),
    [language],
  );
  const mlProfiles = Array.isArray(mlProfilesQuery.data)
    ? (mlProfilesQuery.data as Record<string, unknown>[])
    : [];
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel
          title="businessModelProfileTitle"
          showBreadcrumb
        >
          <div className="grid gap-4">
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("business")}</span>
              <div className="flex gap-2">
                {businessOptions.length > 1 ? (
                  <select
                    className="select select-bordered flex-1 rounded-md"
                    value={activeBisnisId}
                    onChange={(event) => {
                      setBisnisId(event.target.value);
                      setIsDirty(false);
                    }}
                  >
                    {businessOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} (#{option.id})
                      </option>
                    ))}
                  </select>
                ) : hasSingleBusinessOption ? (
                  <input
                    className="input input-bordered flex-1 rounded-md bg-base-200/60 text-neutral/80"
                    value={`${businessOptions[0].label} (#${businessOptions[0].id})`}
                    readOnly
                  />
                ) : (
                  <input
                    className="input input-bordered flex-1 rounded-md"
                    value={activeBisnisId}
                    onChange={(event) => {
                      setBisnisId(event.target.value);
                      setIsDirty(false);
                    }}
                    placeholder={t("enterBusinessId")}
                  />
                )}
                <button
                  className="btn btn-outline rounded-md"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["business-profile", activeBisnisId] })}
                  disabled={!activeBisnisId || profileQuery.isLoading}
                >
                  <RefreshCw size={18} />
                </button>
              </div>
              {!businessOptionsQuery.isLoading && businessOptions.length === 0 ? (
                <span className="mt-2 text-xs font-semibold text-warning">
                  {t("noBusinessOptions")}
                </span>
              ) : null}
            </label>
            <div className="rounded-md border border-base-300 bg-base-200/55 px-4 py-3">
              <h3 className="text-sm font-black text-neutral">
                {language === "id" ? "Cara isi profil bisnis" : "How to complete business profile"}
              </h3>
              <ol className="mt-2 space-y-1.5 text-xs font-semibold leading-5 text-neutral/70">
                <li>
                  1.{" "}
                  {language === "id"
                    ? "Pilih bisnis yang ingin diperbarui."
                    : "Choose the business you want to update."}
                </li>
                <li>
                  2.{" "}
                  {language === "id"
                    ? "Isi angka berdasarkan data 12 bulan terakhir."
                    : "Fill values based on your latest 12 months data."}
                </li>
                <li>
                  3.{" "}
                  {language === "id"
                    ? "Klik simpan lalu cek ringkasan di panel kanan."
                    : "Save and review the summary on the right panel."}
                </li>
              </ol>
            </div>

            <div className="grid gap-4">
              {groupedFields.map((section) => (
                <div key={section.key} className="rounded-md border border-base-300 p-4">
                  <h3 className="text-sm font-black text-neutral">{localeText(section.title, language)}</h3>
                  <div className="mt-3 grid gap-4">
                    {section.fields.map((field) => (
                      <label className="form-control" key={field.key}>
                        <span className="label-text mb-1 font-semibold">{localeText(field.label, language)}</span>
                        <span className="mb-2 text-xs font-semibold leading-5 text-neutral/50">
                          {localeText(field.help, language)}
                        </span>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(190px,220px)] sm:items-center">
                          <input
                            type="range"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            className="range range-neutral range-sm"
                            value={Number(activeBusinessProfile[field.key] || 0)}
                            onChange={(event) => updateNumber(field.key, event.target.value)}
                            disabled={!isUmkm}
                            aria-label={localeText(field.label, language)}
                          />
                          <div className="relative">
                            {field.key === "year_revenue" ? (
                              <>
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-black text-neutral/55">
                                  IDR
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  className="input input-bordered w-full rounded-md pl-12 text-right tabular-nums"
                                  value={numberFormatter.format(Number(activeBusinessProfile[field.key] || 0))}
                                  onChange={(event) =>
                                    updateNumberFromText(field.key, event.target.value)
                                  }
                                  disabled={!isUmkm}
                                  aria-label={localeText(field.label, language)}
                                />
                              </>
                            ) : (
                              <>
                                <input
                                  type="number"
                                  min={field.min}
                                  max={field.max}
                                  step={field.step}
                                  className={`input input-bordered w-full rounded-md text-right ${getUnitPaddingClass(field.unit, language)}`}
                                  value={String(activeBusinessProfile[field.key])}
                                  onChange={(event) => updateNumber(field.key, event.target.value)}
                                  disabled={!isUmkm}
                                  aria-label={localeText(field.label, language)}
                                />
                                {field.unit ? (
                                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-black text-neutral/45">
                                    {localeText(field.unit, language)}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                        {field.key === "review_volatility" ? (
                          <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-neutral/50">
                            <span>{language === "id" ? "0 = Stabil" : "0 = Stable"}</span>
                            <span>{language === "id" ? "5 = Fluktuatif" : "5 = Volatile"}</span>
                          </div>
                        ) : null}
                        {field.key === "kepuasan_pelanggan" ? (
                          <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-neutral/50">
                            <span>{language === "id" ? "1 = Rendah" : "1 = Low"}</span>
                            <span>{language === "id" ? "5 = Sangat puas" : "5 = Very satisfied"}</span>
                          </div>
                        ) : null}
                        {field.key === "repeat_order_rate" ? (
                          <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-neutral/50">
                            <span>{language === "id" ? "0% = Rendah" : "0% = Low"}</span>
                            <span>{language === "id" ? "100% = Sangat loyal" : "100% = Very loyal"}</span>
                          </div>
                        ) : null}
                        <span className="mt-1 text-[11px] font-semibold text-neutral/45">
                          {language === "id"
                            ? `Rentang ${field.min} - ${field.max}`
                            : `Range ${field.min} - ${field.max}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <label className="form-control">
                <span className="label-text mb-1 font-semibold">{language === "id" ? "Beban jam sibuk" : "Peak hour load"}</span>
                <span className="mb-2 text-xs font-semibold leading-5 text-neutral/50">
                  {language === "id"
                    ? "Pilih tingkat beban operasional saat jam paling ramai."
                    : "Select operational load level during peak hours."}
                </span>
                <select
                  className="select select-bordered rounded-md"
                  value={activeBusinessProfile.peak_hour_latency}
                  onChange={(event) => {
                    setIsDirty(true);
                    setForm({ ...activeBusinessProfile, peak_hour_latency: event.target.value });
                  }}
                  disabled={!isUmkm}
                >
                  {peakLatencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {localeText(option.label, language)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {isUmkm ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn btn-primary rounded-md text-white"
                  onClick={() => upsertMutation.mutate()}
                  disabled={!activeBisnisId || upsertMutation.isPending || !isDirty}
                >
                  {upsertMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {language === "id" ? "Simpan profil bisnis" : "Save business profile"}
                </button>
                <button
                  className="btn btn-outline rounded-md"
                  onClick={() => {
                    setForm(savedBusinessProfile);
                    setIsDirty(false);
                    setProfileMessage("");
                    setProfileError("");
                  }}
                  disabled={upsertMutation.isPending}
                >
                  {language === "id" ? "Reset perubahan" : "Reset changes"}
                </button>
              </div>
            ) : (
              <div className="rounded-md border border-info/20 bg-info/10 px-4 py-3 text-sm font-semibold text-info">
                {t("businessModelReadonly")}
              </div>
            )}
            {profileMessage ? (
              <div className="rounded-md border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                {profileMessage}
              </div>
            ) : null}
            {profileError ? (
              <div className="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
                {profileError}
              </div>
            ) : null}
          </div>
        </Panel>
        <Panel title="businessProfileSummary">
          <div className="mb-4">
            <SyncStatus
              label="businessProfile"
              isLoading={profileQuery.isLoading}
              isError={profileQuery.isError}
              hasData={Boolean(profileQuery.data)}
            />
          </div>
          <DetailRows
            rows={[
              [
                language === "id" ? "Omset tahunan" : "Yearly revenue",
                idrFormatter.format(Number(businessProfile.year_revenue ?? 0)),
              ],
              [
                language === "id" ? "Margin laba bersih" : "Net profit margin",
                `${displayValue(businessProfile.net_profit_margin)}%`,
              ],
              [
                language === "id" ? "Kepuasan pelanggan" : "Customer satisfaction",
                `${displayValue(businessProfile.kepuasan_pelanggan)}/5`,
              ],
              [language === "id" ? "Repeat order rate" : "Repeat order rate", `${displayValue(businessProfile.repeat_order_rate)}%`],
              [language === "id" ? "Volatilitas review" : "Review volatility", displayValue(businessProfile.review_volatility)],
              [language === "id" ? "Skor adopsi digital" : "Digital adoption score", `${displayValue(businessProfile.digital_adoption_score)}/10`],
              [
                language === "id" ? "Usia bisnis" : "Business age",
                `${displayValue(businessProfile.business_tenure_years)} ${language === "id" ? "tahun" : "years"}`,
              ],
              [language === "id" ? "Beban jam sibuk" : "Peak hour load", displayValue(businessProfile.peak_hour_latency)],
            ]}
          />
        </Panel>
      </div>
      {canSeeMlProfiles ? (
        <Panel title="allModelProfiles" description="allModelProfilesBody">
          <div className="mb-4">
            <SyncStatus
              label="mlProfile"
              isLoading={mlProfilesQuery.isLoading}
              isError={mlProfilesQuery.isError}
              hasData={mlProfiles.length > 0}
            />
          </div>
          <div className="overflow-x-auto rounded-md border border-base-300">
            <table className="table">
              <thead>
                <tr className="bg-base-200 text-xs uppercase tracking-wide text-neutral/60">
                  <th>{t("business")}</th>
                  <th>Class</th>
                  <th>Margin</th>
                  <th>Revenue</th>
                  <th>Digital</th>
                </tr>
              </thead>
              <tbody>
                {mlProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-neutral/55">
                      {t("dataUnavailable")}
                    </td>
                  </tr>
                ) : (
                  mlProfiles.map((item) => {
                    const bisnis = asRecord(item.bisnis);
                    return (
                      <tr key={String(item.id)}>
                        <td className="font-black">{displayValue(bisnis.nama_bisnis)}</td>
                        <td>{displayValue(item.class_label ?? item.class)}</td>
                        <td>{displayValue(item.net_profit_margin)}</td>
                        <td>{displayValue(item.year_revenue)}</td>
                        <td>{displayValue(item.digital_adoption_score)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

export function ApiStatusPage() {
  const rootQuery = useQuery({
    queryKey: ["api-status", "root"],
    queryFn: () => directApi.get("/", { status: "offline" }),
  });
  const userClassesQuery = useQuery({
    queryKey: ["api-status", "bisnis-kelas"],
    queryFn: () => directApi.get("/businesses/classes?page=1&limit=10", []),
  });
  const userClassDetailQuery = useQuery({
    queryKey: ["api-status", "bisnis-kelas-detail"],
    queryFn: () => directApi.get("/businesses/classes/1", null),
  });
  const adminDashboardQuery = useQuery({
    queryKey: ["api-status", "dashboard-admin"],
    queryFn: () => directApi.get("/dashboard/admin", null),
  });
  const mlProfilesQuery = useQuery({
    queryKey: ["api-status", "businesses-ml"],
    queryFn: () => directApi.get("/businesses/ml", []),
  });

  return (
    <div className="grid gap-5">
      <Panel
        title="systemStatusTitle"
        description="systemStatusBody"
        showBreadcrumb
      >
        <div className="grid gap-3 md:grid-cols-2">
          <SyncStatus
            label="application"
            isLoading={rootQuery.isLoading}
            isError={rootQuery.isError}
            hasData={Boolean(rootQuery.data)}
          />
          <SyncStatus
            label="businessClasses"
            isLoading={userClassesQuery.isLoading}
            isError={userClassesQuery.isError}
            hasData={Boolean(userClassesQuery.data)}
          />
          <SyncStatus
            label="classDetail"
            isLoading={userClassDetailQuery.isLoading}
            isError={userClassDetailQuery.isError}
            hasData={Boolean(userClassDetailQuery.data)}
          />
          <SyncStatus
            label="adminDashboard"
            isLoading={adminDashboardQuery.isLoading}
            isError={adminDashboardQuery.isError}
            hasData={Boolean(adminDashboardQuery.data)}
          />
          <SyncStatus
            label="mlProfile"
            isLoading={mlProfilesQuery.isLoading}
            isError={mlProfilesQuery.isError}
            hasData={Boolean(mlProfilesQuery.data)}
          />
        </div>
      </Panel>
    </div>
  );
}
