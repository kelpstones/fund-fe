import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { directApi } from "../../lib/api/direct";
import { apiClient, unwrap } from "../../lib/api/client";
import { resourceApi } from "../../lib/api/resources";
import { businessConfig, myBusinessConfig } from "../../lib/resourceConfigs";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <section className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-black">{t(title)}</h2>
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
        ? directApi.post("/admin/me", undefined, user)
        : directApi.get(user?.role === "investor" ? "/user/profile/investor" : "/user/profile", user),
  });

  const adminDetailQuery = useQuery({
    queryKey: ["profile", "admin-detail", user?.id],
    queryFn: () => directApi.get(`/admin/${user?.id}`, user),
    enabled: isAdmin && Boolean(user?.id),
  });

  const meRecord = asRecord(meQuery.data);
  const adminRecord = asRecord(adminDetailQuery.data);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const nama = form.nama.trim();
      const email = form.email.trim();
      const noTelp = form.no_telp.trim();
      const level = form.level.trim();

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

      return updateUser(localUpdates);
    },
    onSuccess: async () => {
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

  useEffect(() => {
    if (isProfileDirty || updateMutation.isPending) return;

    const source = isAdmin ? adminRecord : meRecord;
    const merged = {
      nama: String(source.nama ?? user?.nama ?? ""),
      email: String(source.email ?? user?.email ?? ""),
      no_telp: String(source.no_telp ?? user?.no_telp ?? ""),
      level: String(source.level ?? user?.level ?? "admin"),
    };

    setForm((current) => {
      if (
        current.nama === merged.nama &&
        current.email === merged.email &&
        current.no_telp === merged.no_telp &&
        current.level === merged.level
      ) {
        return current;
      }
      return merged;
    });
  }, [
    adminRecord,
    isAdmin,
    isProfileDirty,
    meRecord,
    updateMutation.isPending,
    user?.email,
    user?.level,
    user?.nama,
    user?.no_telp,
  ]);

  const profileRecord: Record<string, unknown> = {
    ...meRecord,
    ...adminRecord,
    ...(user ?? {}),
    ...(saveMessage
      ? {
        ...form,
        ...(isAdmin ? { level: form.level } : {}),
      }
      : {}),
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel
        title="Profile"
        description="profilePanelDescription"
      >
        <form className="grid gap-4" onSubmit={submit}>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">{t("name")}</span>
            <input
              className="input input-bordered rounded-md"
              value={form.nama}
              onChange={(event) => {
                setIsProfileDirty(true);
                setForm((current) => ({ ...current, nama: event.target.value }));
              }}
              disabled={!canEditProfile}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">{t("email")}</span>
            <input
              type="email"
              className="input input-bordered rounded-md"
              value={form.email}
              onChange={(event) => {
                setIsProfileDirty(true);
                setForm((current) => ({ ...current, email: event.target.value }));
              }}
              disabled={!canEditProfile}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">{t("phone")}</span>
            <input
              className="input input-bordered rounded-md"
              value={form.no_telp}
              onChange={(event) => {
                setIsProfileDirty(true);
                setForm((current) => ({ ...current, no_telp: event.target.value }));
              }}
              disabled={!canEditProfile}
            />
          </label>
          {isAdmin ? (
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("level")}</span>
              <select
                className="select select-bordered rounded-md"
                value={form.level}
                onChange={(event) => {
                  setIsProfileDirty(true);
                  setForm((current) => ({ ...current, level: event.target.value }));
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

export function BusinessProfilePage() {
  const { t } = useLanguage();
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
        label: `${displayValue(item.nama_bisnis ?? item.nama)} (#${displayValue(item.id)})`,
      })),
    [businessOptionsQuery.data],
  );

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
        class: Number(profileData.class ?? defaultBusinessProfileForm.class),
      };
  const activeBusinessProfile = isDirty ? form : savedBusinessProfile;

  const updateNumber = (key: keyof typeof form, value: string) => {
    setIsDirty(true);
    setForm({ ...activeBusinessProfile, [key]: Number(value) });
  };

  const businessProfile = {
    ...asRecord(profileQuery.data),
    ...activeBusinessProfile,
  };
  const mlProfiles = Array.isArray(mlProfilesQuery.data)
    ? (mlProfilesQuery.data as Record<string, unknown>[])
    : [];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel
          title="businessModelProfileTitle"
          description="businessModelProfileBody"
        >
          <div className="grid gap-4">
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">{t("business")}</span>
              <div className="flex gap-2">
                {businessOptions.length > 0 ? (
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
                        {option.label}
                      </option>
                    ))}
                  </select>
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
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["net_profit_margin", "Net Profit Margin"],
                ["kepuasan_pelanggan", "Kepuasan Pelanggan"],
                ["review_volatility", "Review Volatility"],
                ["repeat_order_rate", "Repeat Order Rate"],
                ["digital_adoption_score", "Digital Adoption Score"],
                ["year_revenue", "Year Revenue"],
                ["business_tenure_years", "Business Tenure"],
              ].map(([key, label]) => (
                <label className="form-control" key={key}>
                  <span className="label-text mb-2 font-semibold">{t(label)}</span>
                  <input
                    type="number"
                    className="input input-bordered rounded-md"
                    value={String(activeBusinessProfile[key as keyof typeof form])}
                    onChange={(event) => updateNumber(key as keyof typeof form, event.target.value)}
                    disabled={!isUmkm}
                  />
                </label>
              ))}
              <label className="form-control">
                <span className="label-text mb-2 font-semibold">{t("Peak Hour Latency")}</span>
                <select
                  className="select select-bordered rounded-md"
                  value={activeBusinessProfile.peak_hour_latency}
                  onChange={(event) => {
                    setIsDirty(true);
                    setForm({ ...activeBusinessProfile, peak_hour_latency: event.target.value });
                  }}
                  disabled={!isUmkm}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="form-control">
                <span className="label-text mb-2 font-semibold">{t("Class")}</span>
                <select
                  className="select select-bordered rounded-md"
                  value={activeBusinessProfile.class}
                  disabled
                >
                  <option value={0}>Critical</option>
                  <option value={1}>Struggling</option>
                  <option value={2}>Growth</option>
                  <option value={3}>Elite</option>
                </select>
                <span className="mt-2 text-xs font-semibold leading-5 text-neutral/45">{t("classPredictedByModel")}</span>
              </label>
            </div>
            {isUmkm ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn btn-primary rounded-md text-white"
                  onClick={() => upsertMutation.mutate()}
                  disabled={!activeBisnisId || upsertMutation.isPending}
                >
                  {upsertMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {t("saveProfile")}
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
        <Panel title="businessProfileSummary" description="businessProfileSummaryBody">
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
              ["Net Profit Margin", businessProfile.net_profit_margin],
              ["Kepuasan Pelanggan", businessProfile.kepuasan_pelanggan],
              ["Peak Hour Latency", businessProfile.peak_hour_latency],
              ["Review Volatility", businessProfile.review_volatility],
              ["Repeat Order Rate", businessProfile.repeat_order_rate],
              ["Digital Adoption Score", businessProfile.digital_adoption_score],
              ["Year Revenue", businessProfile.year_revenue],
              ["Business Tenure", businessProfile.business_tenure_years],
              ["Class", businessProfile.class],
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
