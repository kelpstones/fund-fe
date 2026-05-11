import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { directApi } from "../../lib/api/direct";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-black">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-neutral/60">{description}</p> : null}
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

function DetailRows({ rows }: { rows: Array<[string, unknown]> }) {
  return (
    <div className="overflow-hidden rounded-md border border-base-300">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid gap-1 border-b border-base-300 px-4 py-3 last:border-b-0 sm:grid-cols-[0.45fr_0.55fr]"
        >
          <span className="text-sm font-semibold text-neutral/55">{label}</span>
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
  const tone = isLoading
    ? "badge-warning"
    : isError || !hasData
      ? "badge-error"
      : "badge-success";
  const text = isLoading ? "Memuat" : isError || !hasData ? "Belum tersedia" : "Tersedia";

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-base-300 p-4">
      <span className="text-sm font-bold">{label}</span>
      <span className={`badge ${tone} text-white`}>{text}</span>
    </div>
  );
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const [saveMessage, setSaveMessage] = useState("");
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

  const updateMutation = useMutation({
    mutationFn: async () => {
      const localUpdates = {
        nama: form.nama,
        email: form.email,
        no_telp: form.no_telp,
        ...(isAdmin ? { level: form.level as "admin" | "superadmin" } : {}),
      };

      if (isAdmin && user?.id) {
        await directApi.put(`/admin/${user.id}`, form, { ...user, ...localUpdates });
      } else {
        await directApi.put("/user/profile", localUpdates, { ...user, ...localUpdates });
      }

      return updateUser(localUpdates);
    },
    onSuccess: async () => {
      setSaveMessage("Profile berhasil disimpan.");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateMutation.mutateAsync();
  };

  const profileRecord: Record<string, unknown> = {
    ...asRecord(meQuery.data),
    ...asRecord(adminDetailQuery.data),
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
        description="Kelola informasi akun yang dipakai di seluruh workspace FundRaise."
      >
        <form className="grid gap-4" onSubmit={submit}>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">Nama</span>
            <input
              className="input input-bordered rounded-md"
              value={form.nama}
              onChange={(event) => setForm((current) => ({ ...current, nama: event.target.value }))}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">Email</span>
            <input
              type="email"
              className="input input-bordered rounded-md"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">No. Telp</span>
            <input
              className="input input-bordered rounded-md"
              value={form.no_telp}
              onChange={(event) => setForm((current) => ({ ...current, no_telp: event.target.value }))}
            />
          </label>
          {isAdmin ? (
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">Level</span>
              <select
                className="select select-bordered rounded-md"
                value={form.level}
                onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </label>
          ) : null}
          <button className="btn btn-primary rounded-md text-white" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Simpan Profile
          </button>
          {saveMessage ? (
            <div className="rounded-md border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
              {saveMessage}
            </div>
          ) : null}
        </form>
      </Panel>
      <div className="grid gap-5">
        <Panel title="Ringkasan Akun" description="Informasi akun aktif yang tersambung ke dashboard.">
          <DetailRows
            rows={[
              ["Nama", profileRecord.nama],
              ["Email", profileRecord.email],
              ["Role", profileRecord.role || profileRecord.role_name || profileRecord.level || profileRecord.role_id],
              ["No. Telp", profileRecord.no_telp],
              ["Dibuat", profileRecord.created_at],
            ]}
          />
        </Panel>
        <Panel title="Status Data">
          <div className="grid gap-3">
            <SyncStatus
              label="Data sesi"
              isLoading={meQuery.isLoading}
              isError={meQuery.isError}
              hasData={Boolean(meQuery.data)}
            />
            <SyncStatus
              label={isAdmin ? "Data admin" : "Profile lokal"}
              isLoading={isAdmin ? adminDetailQuery.isLoading : false}
              isError={isAdmin ? adminDetailQuery.isError : false}
              hasData={isAdmin ? Boolean(adminDetailQuery.data) : Boolean(user)}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function BusinessProfilePage() {
  const queryClient = useQueryClient();
  const [bisnisId, setBisnisId] = useState("1");
  const [form, setForm] = useState({
    net_profit_margin: 15.5,
    kepuasan_pelanggan: 3.5,
    peak_hour_latency: "medium",
    review_volatility: 0.8,
    repeat_order_rate: 65,
    digital_adoption_score: 7,
    year_revenue: 500000000,
    business_tenure_years: 2.5,
    class: 2,
  });

  const profileQuery = useQuery({
    queryKey: ["business-profile", bisnisId],
    queryFn: () => directApi.get(`/businesses/${bisnisId}/profile`, form),
    enabled: Boolean(bisnisId),
  });

  const upsertMutation = useMutation({
    mutationFn: () =>
      directApi.post(`/businesses/${bisnisId}/profile`, {
        net_profit_margin: form.net_profit_margin,
        kepuasan_pelanggan: form.kepuasan_pelanggan,
        peak_hour_latency: form.peak_hour_latency,
        review_volatility: form.review_volatility,
        repeat_order_rate: form.repeat_order_rate,
        digital_adoption_score: form.digital_adoption_score,
        year_revenue: form.year_revenue,
        business_tenure_years: form.business_tenure_years,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["business-profile", bisnisId] });
    },
  });

  const classMutation = useMutation({
    mutationFn: () => directApi.put(`/businesses/${bisnisId}/profile/class`, { class: form.class }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["business-profile", bisnisId] });
    },
  });

  const updateNumber = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: Number(value) }));
  };

  const businessProfile = {
    ...form,
    ...asRecord(profileQuery.data),
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel
        title="Profil Model Bisnis"
        description="Kelola variabel kesehatan bisnis, performa digital, dan kelas risiko usaha."
      >
        <div className="grid gap-4">
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">ID Bisnis</span>
            <div className="flex gap-2">
              <input
                className="input input-bordered flex-1 rounded-md"
                value={bisnisId}
                onChange={(event) => setBisnisId(event.target.value)}
              />
              <button
                className="btn btn-outline rounded-md"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["business-profile", bisnisId] })}
              >
                <RefreshCw size={18} />
              </button>
            </div>
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
                <span className="label-text mb-2 font-semibold">{label}</span>
                <input
                  type="number"
                  className="input input-bordered rounded-md"
                  value={String(form[key as keyof typeof form])}
                  onChange={(event) => updateNumber(key as keyof typeof form, event.target.value)}
                />
              </label>
            ))}
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">Peak Hour Latency</span>
              <select
                className="select select-bordered rounded-md"
                value={form.peak_hour_latency}
                onChange={(event) =>
                  setForm((current) => ({ ...current, peak_hour_latency: event.target.value }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="form-control">
              <span className="label-text mb-2 font-semibold">Class</span>
              <select
                className="select select-bordered rounded-md"
                value={form.class}
                onChange={(event) => updateNumber("class", event.target.value)}
              >
                <option value={0}>Critical</option>
                <option value={1}>Struggling</option>
                <option value={2}>Growth</option>
                <option value={3}>Elite</option>
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="btn btn-primary rounded-md text-white"
              onClick={() => upsertMutation.mutate()}
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Simpan Profil
            </button>
            <button
              className="btn btn-secondary rounded-md text-white"
              onClick={() => classMutation.mutate()}
              disabled={classMutation.isPending}
            >
              Update Class
            </button>
          </div>
        </div>
      </Panel>
      <Panel title="Ringkasan Profil Bisnis" description="Nilai model bisnis yang sedang aktif untuk proses scoring.">
        <div className="mb-4">
          <SyncStatus
            label="Profil bisnis"
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

  return (
    <div className="grid gap-5">
      <Panel
        title="Status Sistem"
        description="Pantau kesiapan layanan utama dan status data operasional."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <SyncStatus
            label="Aplikasi"
            isLoading={rootQuery.isLoading}
            isError={rootQuery.isError}
            hasData={Boolean(rootQuery.data)}
          />
          <SyncStatus
            label="Kelas bisnis"
            isLoading={userClassesQuery.isLoading}
            isError={userClassesQuery.isError}
            hasData={Boolean(userClassesQuery.data)}
          />
          <SyncStatus
            label="Detail kelas"
            isLoading={userClassDetailQuery.isLoading}
            isError={userClassDetailQuery.isError}
            hasData={Boolean(userClassDetailQuery.data)}
          />
        </div>
      </Panel>
    </div>
  );
}
