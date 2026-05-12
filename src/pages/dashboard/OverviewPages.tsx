import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Building2,
  CircleDollarSign,
  FileCheck2,
  Handshake,
  Receipt,
  Rocket,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { directApi } from "../../lib/api/direct";
import { resourceApi } from "../../lib/api/resources";
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
} from "../../lib/resourceConfigs";
import { compactCurrency, currency, percent, readPath, statusTone, textValue } from "../../lib/format";
import type { Entity, ResourceConfig } from "../../types";

const useResource = (config: ResourceConfig<Entity>) =>
  useQuery({
    queryKey: ["overview", config.key],
    queryFn: () => resourceApi.list(config),
  });

const useDashboard = (role: "umkm" | "investor" | "admin") =>
  useQuery({
    queryKey: ["dashboard-summary", role],
    queryFn: () => directApi.get(`/dashboard/${role}`, null),
  });

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asEntityArray = (value: unknown): Entity[] => (Array.isArray(value) ? (value as Entity[]) : []);

function PageHeader({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-normal text-neutral">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral/60">{body}</p>
        </div>
      </div>
    </div>
  );
}

function MatchList({ submissions }: { submissions: Entity[] }) {
  const sorted = [...submissions].sort(
    (a, b) =>
      Number(b.match_score || b.skor_kecocokan || 0) -
      Number(a.match_score || a.skor_kecocokan || 0),
  );

  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black">AI Match Score</h3>
        </div>
        <Scale className="text-primary" size={24} />
      </div>
      <div className="mt-5 grid gap-3">
        {sorted.length === 0 ? (
          <div className="rounded-md border border-base-300 p-4 text-sm font-semibold text-neutral/55">
            Belum ada data match. Lengkapi data bisnis atau preferensi investor terlebih dahulu.
          </div>
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
                    Return {percent(item.per_anual_return)} - Risk {textValue(item.risk_level)}
                  </p>
                </div>
                <span className="badge badge-secondary badge-lg text-white">{score}%</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-base-200">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(score, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityPanel({ items }: { items: Entity[] }) {
  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black">Update terakhir</h3>
        </div>
        <Bell className="text-primary" size={24} />
      </div>
      <div className="mt-5 grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-md border border-base-300 p-4 text-sm font-semibold text-neutral/55">
            Belum ada update terbaru.
          </div>
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

export function UmkmOverviewPage() {
  const dashboardQuery = useDashboard("umkm");
  const dashboard = dashboardQuery.data;
  const d = asRecord(dashboard);
  const dashboardBusiness = asRecord(d.bisnis);
  const dashboardSubmission = asRecord(d.pengajuan);
  const dashboardInvestor = asRecord(d.investor);
  const penjualanChart = asEntityArray(d.penjualan_chart);

  const businesses = useResource(myBusinessConfig).data ?? [];
  const submissions = useResource(submissionConfig).data ?? [];
  const sales = useResource(salesConfig).data ?? [];
  const negotiations = useResource(myNegotiationConfig).data ?? [];

  const totalSales =
    penjualanChart.reduce((sum, item) => sum + Number(item.total_penjualan || 0), 0) ||
    sales.reduce((sum, item) => sum + Number(item.total_penjualan || 0), 0);
  const funded =
    Number(dashboardSubmission.total_pendanaan ?? 0) ||
    submissions.reduce((sum, item) => sum + Number(item.total_pendanaan || 0), 0);
  const bisnisCount = dashboardBusiness.id ? 1 : businesses.length;
  const investorCount = Number(dashboardInvestor.total ?? 0) || negotiations.length;
  const hasApprovedSubmission = submissions.some((item) =>
    ["approved", "published", "funded"].includes(
      String(readPath(item, ["approval.status", "approval_status", "status"])).toLowerCase(),
    ),
  );
  const onboardingChecks = [
    bisnisCount > 0,
    totalSales > 0,
    submissions.length > 0,
    hasApprovedSubmission,
    negotiations.length > 0,
  ];
  const onboardingProgress = Math.round(
    (onboardingChecks.filter(Boolean).length / onboardingChecks.length) * 100,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pantau bisnis, pengajuan, dan investor yang cocok"
        body="Workspace UMKM menampilkan kesehatan bisnis, status pengajuan, laporan penjualan, serta interaksi negosiasi dengan investor."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bisnis" value={String(bisnisCount)} helper="Profil aktif" icon={Building2} loading={dashboardQuery.isLoading} />
        <StatCard label="Total Pendanaan" value={compactCurrency(funded)} helper="Terkumpul" icon={CircleDollarSign} tone="green" loading={dashboardQuery.isLoading} />
        <StatCard label="Penjualan" value={compactCurrency(totalSales)} helper="Dari laporan" icon={BarChart3} tone="amber" loading={dashboardQuery.isLoading} />
        <StatCard label="Investor" value={String(investorCount)} helper="Investor terkait" icon={Handshake} loading={dashboardQuery.isLoading} />
      </div>
      <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <Rocket size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black">UMKM onboarding readiness</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral/60">
                Ikuti urutan profil bisnis, model scoring, pengajuan dana, review admin, dan negosiasi agar peluang siap masuk marketplace investor.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-48">
              <div className="mb-2 flex items-center justify-between text-xs font-black text-neutral/55">
                <span>Progress</span>
                <span>{onboardingProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-base-200">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${onboardingProgress}%` }} />
              </div>
            </div>
            <Link to="/dashboard/umkm/onboarding" className="btn btn-primary rounded-md text-white">
              Buka Onboarding
            </Link>
          </div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MatchList submissions={submissions} />
        <ActivityPanel items={negotiations} />
      </div>
    </div>
  );
}

export function InvestorOverviewPage() {
  const dashboardQuery = useDashboard("investor");
  const dashboard = dashboardQuery.data;
  const d = asRecord(dashboard);
  const dashboardInvestment = asRecord(d.investasi);
  const dashboardProfit = asRecord(d.profit);
  const recentDistribution = asEntityArray(d.recent_distribusi);

  const submissions = useResource(submissionConfig).data ?? [];
  const investments = useResource(investorInvestmentConfig).data ?? [];
  const invoices = useResource(investorInvoiceConfig).data ?? [];
  const profits = useResource(investorProfitConfig).data ?? [];

  const invested =
    Number(dashboardInvestment.total_nominal ?? 0) ||
    investments.reduce((sum, item) => sum + Number(item.nominal_investasi || 0), 0);
  const profitTotal =
    Number(dashboardProfit.total_diterima ?? 0) ||
    profits.reduce((sum, item) => sum + Number(item.nominal_profit || 0), 0);
  const pendingProfit = Number(dashboardProfit.total_pending ?? 0);
  const peluangCount = Number(d.total_peluang ?? 0) || submissions.length;
  const investmentCount = Number(dashboardInvestment.jumlah_aktif ?? 0) || investments.length;
  const invoiceCount = Number(d.total_invoice ?? 0) || invoices.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Temukan peluang UMKM yang sesuai preferensi"
        body="Investor melihat peluang pendanaan, rekomendasi AI, negosiasi, invoice, portfolio investasi, dan distribusi profit."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Peluang" value={String(peluangCount)} helper="Pengajuan tersedia" icon={FileCheck2} loading={dashboardQuery.isLoading} />
        <StatCard label="Investasi" value={compactCurrency(invested)} helper="Portfolio aktif" icon={TrendingUp} tone="green" loading={dashboardQuery.isLoading} />
        <StatCard label="Profit" value={compactCurrency(profitTotal)} helper={`${compactCurrency(pendingProfit)} pending`} icon={CircleDollarSign} tone="amber" loading={dashboardQuery.isLoading} />
        <StatCard label="Invoice" value={String(invoiceCount)} helper="Tagihan investor" icon={Receipt} loading={dashboardQuery.isLoading} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MatchList submissions={submissions} />
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">Investasi aktif</h3>
          <p className="mt-1 text-sm font-semibold text-neutral/55">{investmentCount} investasi aktif</p>
          <div className="mt-5 grid gap-3">
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
  const dashboardQuery = useDashboard("admin");
  const dashboard = dashboardQuery.data;
  const d = asRecord(dashboard);
  const dashboardBusiness = asRecord(d.bisnis);
  const dashboardUsers = asRecord(d.users);
  const dashboardSubmission = asRecord(d.pengajuan);
  const submissionByStatus = asRecord(dashboardSubmission.by_status);
  const recentSubmissions = asEntityArray(d.recent_pengajuan);

  const businesses = useResource(businessConfig).data ?? [];
  const submissions = useResource(submissionConfig).data ?? [];
  const admins = useResource(adminConfig).data ?? [];
  const notifications = useResource(notificationConfig).data ?? [];

  const bisnisCount = Number(dashboardBusiness.total ?? 0) || businesses.length;
  const submissionCount = Number(dashboardSubmission.total ?? 0) || submissions.length;
  const adminCount = Number(d.total_admin ?? 0) || admins.length;
  const userCount = Number(dashboardUsers.total ?? 0) || adminCount;
  const notifCount = Number(d.total_notifikasi ?? 0) || notifications.length;
  const pending =
    Number(submissionByStatus.pending ?? 0) ||
    submissions.filter((item) => String(readPath(item, ["approval.status", "approval_status", "status"])) === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kontrol kualitas data dan proses pendanaan"
        body="Admin mengelola bisnis, pengajuan, kelas, invoice, investasi, distribusi profit, admin management, dan notifikasi operasional."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bisnis" value={String(bisnisCount)} helper="Terdaftar" icon={Building2} loading={dashboardQuery.isLoading} />
        <StatCard label="Pengajuan" value={String(submissionCount)} helper={`${pending} pending`} icon={FileCheck2} tone="amber" loading={dashboardQuery.isLoading} />
        <StatCard label="Users" value={String(userCount)} helper="Akun platform" icon={Users} loading={dashboardQuery.isLoading} />
        <StatCard label="Notifikasi" value={String(notifCount)} helper="Operasional" icon={Bell} tone="green" loading={dashboardQuery.isLoading} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">Status pengajuan</h3>
          <div className="mt-5 grid gap-3">
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
        <ActivityPanel items={notifications} />
      </div>
    </div>
  );
}
