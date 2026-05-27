import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { directApi } from "../../lib/api/direct";
import { apiClient, unwrap } from "../../lib/api/client";
import { resourceApi } from "../../lib/api/resources";
import { businessConfig, myBusinessConfig } from "../../lib/resourceConfigs";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { DashboardBreadcrumb } from "../../components/DashboardBreadcrumb";

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

const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return String(error.response.data.message);
  }
  return fallback;
};

type LocalizedCopy = { id: string; en: string };

const localeText = (text: LocalizedCopy, language: "id" | "en") =>
  language === "id" ? text.id : text.en;

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

  const profileRecord: Record<string, unknown> = {
    ...meRecord,
    ...adminRecord,
    ...(user ?? {}),
    ...(saveMessage
      ? {
        ...activeForm,
        ...(isAdmin ? { level: activeForm.level } : {}),
      }
      : {}),
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
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
      <div className="grid gap-5">
        <Panel title="accountSummary" description="accountSummaryDescription">
          <DetailRows
            rows={[
              ["name", profileRecord.nama],
              ["Email", profileRecord.email],
              ["Role", profileRecord.role || profileRecord.role_name || profileRecord.level || profileRecord.role_id],
              ["phone", profileRecord.no_telp],
              ["createdAt", profileRecord.created_at],
            ]}
          />
        </Panel>
      </div>
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
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "kepuasan_pelanggan", label: "Kepuasan Pelanggan", min: 1, max: 5, step: 0.1 },
  { key: "digital_adoption_score", label: "Digital Adoption Score", min: 1, max: 10, step: 1 },
  { key: "net_profit_margin", label: "Net Profit Margin", min: -35, max: 100, step: 0.1 },
  { key: "year_revenue", label: "Year Revenue", min: 18000000, max: 50000000000, step: 1000000 },
  { key: "business_tenure_years", label: "Business Tenure", min: 0, max: 50, step: 0.1 },
];

export function InvestorPreferencesPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InvestorPreferenceForm>(defaultInvestorPreference);
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const preferenceQuery = useQuery({
    queryKey: ["investor-preferences"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/user/investor/preferences");
        return unwrap<Record<string, unknown>>(response.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },
  });

  const savedPreference = preferenceQuery.data
    ? {
      kepuasan_pelanggan: Number(preferenceQuery.data.kepuasan_pelanggan ?? defaultInvestorPreference.kepuasan_pelanggan),
      digital_adoption_score: Number(preferenceQuery.data.digital_adoption_score ?? defaultInvestorPreference.digital_adoption_score),
      net_profit_margin: Number(preferenceQuery.data.net_profit_margin ?? defaultInvestorPreference.net_profit_margin),
      year_revenue: Number(preferenceQuery.data.year_revenue ?? defaultInvestorPreference.year_revenue),
      business_tenure_years: Number(preferenceQuery.data.business_tenure_years ?? defaultInvestorPreference.business_tenure_years),
    }
    : defaultInvestorPreference;
  const activeForm = isDirty ? form : savedPreference;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/user/investor/preferences", activeForm);
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setForm(activeForm);
      setIsDirty(false);
      setMessage(t("preferencesSaveSuccess"));
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["investor-preferences"] });
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
    setIsDirty(true);
    setForm({ ...activeForm, [key]: Number(value) });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel
        title="investorPreferencesTitle"
        description="investorPreferencesBody"
        showBreadcrumb
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {investorPreferenceFields.map((field) => (
              <label className="form-control" key={field.key}>
                <span className="label-text mb-2 font-semibold">{t(field.label)}</span>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  className="input input-bordered rounded-md"
                  value={String(activeForm[field.key])}
                  onChange={(event) => update(field.key, event.target.value)}
                  required
                />
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn btn-primary rounded-md text-white" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t("savePreferences")}
            </button>
            <button
              type="button"
              className="btn btn-secondary rounded-md text-white"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
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
      <div className="grid gap-5">
        <Panel title="activePreferences" description="activePreferencesBody">
          <div className="mb-4">
            <SyncStatus
              label="investorPreferences"
              isLoading={preferenceQuery.isLoading}
              isError={preferenceQuery.isError}
              hasData={Boolean(preferenceQuery.data)}
            />
          </div>
          <DetailRows
            rows={[
              ["Kepuasan Pelanggan", preferenceQuery.data?.kepuasan_pelanggan],
              ["Digital Adoption Score", preferenceQuery.data?.digital_adoption_score],
              ["Net Profit Margin", preferenceQuery.data?.net_profit_margin],
              ["Year Revenue", preferenceQuery.data?.year_revenue],
              ["Business Tenure", preferenceQuery.data?.business_tenure_years],
              ["Updated", preferenceQuery.data?.updated_at],
            ]}
          />
        </Panel>
      </div>
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

type BusinessCover = {
  id: number;
  bisnis_id: number;
  image_url: string;
  urutan: number;
  created_at?: string;
};

export function BusinessProfilePage() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [bisnisId, setBisnisId] = useState("");
  const [form, setForm] = useState(defaultBusinessProfileForm);
  const [isDirty, setIsDirty] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [coverError, setCoverError] = useState("");
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
  const coverQuery = useQuery({
    queryKey: ["business-covers"],
    queryFn: async () => {
      const response = await apiClient.get("/businesses/covers");
      const payload = unwrap<unknown>(response.data);
      if (Array.isArray(payload)) return payload as BusinessCover[];
      if (payload && typeof payload === "object") {
        const objectPayload = payload as Record<string, unknown>;
        if (Array.isArray(objectPayload.covers)) return objectPayload.covers as BusinessCover[];
      }
      return [] as BusinessCover[];
    },
    enabled: isUmkm,
    retry: false,
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
  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await apiClient.post("/businesses/covers", formData);
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setCoverError("");
      await queryClient.invalidateQueries({ queryKey: ["business-covers"] });
    },
    onError: (err) => {
      setCoverError(apiErrorMessage(err, "Upload cover gagal."));
    },
  });
  const deleteCoverMutation = useMutation({
    mutationFn: async (coverId: number) => {
      const response = await apiClient.delete(`/businesses/covers/${coverId}`);
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setCoverError("");
      await queryClient.invalidateQueries({ queryKey: ["business-covers"] });
    },
    onError: (err) => {
      setCoverError(apiErrorMessage(err, "Hapus cover gagal."));
    },
  });
  const reorderCoverMutation = useMutation({
    mutationFn: async (orders: Array<{ id: number; urutan: number }>) => {
      const response = await apiClient.patch("/businesses/covers/reorder", { orders });
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setCoverError("");
      await queryClient.invalidateQueries({ queryKey: ["business-covers"] });
    },
    onError: (err) => {
      setCoverError(apiErrorMessage(err, "Urutan cover gagal diperbarui."));
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
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const nextValue = Math.min(field.max, parsed);
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
  const covers = coverQuery.data ?? [];
  const moveCover = (coverId: number, direction: "up" | "down") => {
    const currentIndex = covers.findIndex((item) => Number(item.id) === Number(coverId));
    if (currentIndex < 0) return;
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= covers.length) return;

    const reordered = [...covers];
    [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
    const orders = reordered.map((item, index) => ({ id: Number(item.id), urutan: index }));
    reorderCoverMutation.mutate(orders);
  };

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
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {section.fields.map((field) => (
                      <label className="form-control" key={field.key}>
                        <span className="label-text mb-1 font-semibold">{localeText(field.label, language)}</span>
                        <span className="mb-2 text-xs font-semibold leading-5 text-neutral/50">
                          {localeText(field.help, language)}
                        </span>
                        <div className="relative">
                          {field.key === "year_revenue" ? (
                            <>
                              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-black text-neutral/55">
                                IDR
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="input input-bordered w-full rounded-md pl-14"
                                value={numberFormatter.format(Number(activeBusinessProfile[field.key] || 0))}
                                onChange={(event) =>
                                  updateNumber(field.key, event.target.value.replace(/[^\d]/g, ""))
                                }
                                disabled={!isUmkm}
                              />
                            </>
                          ) : field.key === "review_volatility" ||
                            field.key === "kepuasan_pelanggan" ||
                            field.key === "repeat_order_rate" ? (
                            <div className="grid gap-2 sm:grid-cols-[1fr_110px] sm:items-center">
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
                                <input
                                  type="number"
                                  min={field.min}
                                  max={field.max}
                                  step={field.step}
                                  className={`input input-bordered w-full rounded-md text-right ${field.unit ? "pr-10" : ""}`}
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
                              </div>
                            </div>
                          ) : (
                            <input
                              type="number"
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              className={`input input-bordered w-full rounded-md ${field.unit ? "pr-16" : ""}`}
                              value={String(activeBusinessProfile[field.key])}
                              onChange={(event) => updateNumber(field.key, event.target.value)}
                              disabled={!isUmkm}
                            />
                          )}
                          {field.unit &&
                          field.key !== "year_revenue" &&
                          field.key !== "kepuasan_pelanggan" &&
                          field.key !== "repeat_order_rate" ? (
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-black text-neutral/45">
                              {localeText(field.unit, language)}
                            </span>
                          ) : null}
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
      {isUmkm ? (
        <Panel title="Business Cover Gallery" description="Upload maksimal 5 foto cover untuk profil bisnis.">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral/60">
                {covers.length}/5 cover tersimpan
              </p>
              <label className="btn btn-primary rounded-md text-white">
                <ImagePlus size={17} />
                Upload Cover
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadCoverMutation.isPending || covers.length >= 5}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    uploadCoverMutation.mutate(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            {coverError ? (
              <div className="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
                {coverError}
              </div>
            ) : null}
            {coverQuery.isLoading ? (
              <div className="rounded-md border border-base-300 bg-base-100 p-4 text-sm font-semibold text-neutral/60">
                Memuat cover bisnis...
              </div>
            ) : null}
            {coverQuery.isError ? (
              <div className="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
                {apiErrorMessage(coverQuery.error, "Gagal memuat cover bisnis.")}
              </div>
            ) : null}
            {!coverQuery.isLoading && !coverQuery.isError && covers.length === 0 ? (
              <div className="rounded-md border border-base-300 bg-base-100 p-4 text-sm font-semibold text-neutral/60">
                Belum ada cover bisnis.
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {covers.map((cover, index) => (
                <article key={cover.id} className="overflow-hidden rounded-md border border-base-300 bg-white">
                  <div className="aspect-video bg-base-200">
                    <img
                      src={cover.image_url}
                      alt={`Cover bisnis ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="text-sm font-bold text-neutral/70">Urutan #{index + 1}</span>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => moveCover(Number(cover.id), "up")}
                        disabled={index === 0 || reorderCoverMutation.isPending}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => moveCover(Number(cover.id), "down")}
                        disabled={index === covers.length - 1 || reorderCoverMutation.isPending}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs btn-square text-error"
                        onClick={() => deleteCoverMutation.mutate(Number(cover.id))}
                        disabled={deleteCoverMutation.isPending}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Panel>
      ) : null}
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
