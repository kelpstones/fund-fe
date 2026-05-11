import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Building2,
  CircleDollarSign,
  FileCheck2,
  Handshake,
  Receipt,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { resourceApi } from "../../lib/api/resources";
import {
  adminConfig,
  businessConfig,
  investorInvestmentConfig,
  investorInvoiceConfig,
  investorProfitConfig,
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
                    Return {percent(item.per_anual_return)} · Risk {textValue(item.risk_level)}
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
  const d: Record<string, unknown> = {};

  const businesses = useResource(businessConfig).data ?? [];
  const submissions = useResource(submissionConfig).data ?? [];
  const sales = useResource(salesConfig).data ?? [];
  const negotiations = useResource(myNegotiationConfig).data ?? [];

  const totalSales = Number(d.total_penjualan ?? 0) || sales.reduce((sum, item) => sum + Number(item.total_penjualan || 0), 0);
  const funded = Number(d.total_pendanaan ?? 0) || submissions.reduce((sum, item) => sum + Number(item.total_pendanaan || 0), 0);
  const bisnisCount = Number(d.total_bisnis ?? 0) || businesses.length;
  const negosiasiCount = Number(d.total_negosiasi ?? 0) || negotiations.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pantau bisnis, pengajuan, dan investor yang cocok"
        body="Workspace UMKM menampilkan kesehatan bisnis, status pengajuan, laporan penjualan, serta interaksi negosiasi dengan investor."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bisnis" value={String(bisnisCount)} helper="Profil aktif" icon={Building2} />
        <StatCard label="Total Pendanaan" value={compactCurrency(funded)} helper="Terkumpul" icon={CircleDollarSign} tone="green" />
        <StatCard label="Penjualan" value={compactCurrency(totalSales)} helper="Dari laporan" icon={BarChart3} tone="amber" />
        <StatCard label="Negosiasi" value={String(negosiasiCount)} helper="Interaksi aktif" icon={Handshake} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MatchList submissions={submissions} />
        <ActivityPanel items={negotiations} />
      </div>
    </div>
  );
}

export function InvestorOverviewPage() {
  const d: Record<string, unknown> = {};

  const submissions = useResource(submissionConfig).data ?? [];
  const investments = useResource(investorInvestmentConfig).data ?? [];
  const invoices = useResource(investorInvoiceConfig).data ?? [];
  const profits = useResource(investorProfitConfig).data ?? [];

  const invested = Number(d.total_investasi ?? 0) || investments.reduce((sum, item) => sum + Number(item.nominal_investasi || 0), 0);
  const profitTotal = Number(d.total_profit ?? 0) || profits.reduce((sum, item) => sum + Number(item.nominal_profit || 0), 0);
  const peluangCount = Number(d.total_peluang ?? 0) || submissions.length;
  const invoiceCount = Number(d.total_invoice ?? 0) || invoices.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Temukan peluang UMKM yang sesuai preferensi"
        body="Investor melihat peluang pendanaan, rekomendasi AI, negosiasi, invoice, portfolio investasi, dan distribusi profit."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Peluang" value={String(peluangCount)} helper="Pengajuan tersedia" icon={FileCheck2} />
        <StatCard label="Investasi" value={compactCurrency(invested)} helper="Portfolio aktif" icon={TrendingUp} tone="green" />
        <StatCard label="Profit" value={compactCurrency(profitTotal)} helper="Distribusi" icon={CircleDollarSign} tone="amber" />
        <StatCard label="Invoice" value={String(invoiceCount)} helper="Tagihan investor" icon={Receipt} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MatchList submissions={submissions} />
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">Investasi aktif</h3>
          <div className="mt-5 grid gap-3">
            {investments.map((item) => (
              <div key={item.id} className="rounded-md border border-base-300 p-4">
                <div className="flex justify-between gap-4">
                  <p className="font-black">{textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis"]))}</p>
                  <span className={`badge ${statusTone(readPath(item, ["negosiasi.status", "status"]))}`}>
                    {textValue(readPath(item, ["negosiasi.status", "status"]))}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral/55">
                  {currency(item.nominal_investasi)} · Return {percent(item.return_investasi)}
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
  const d: Record<string, unknown> = {};

  const businesses = useResource(businessConfig).data ?? [];
  const submissions = useResource(submissionConfig).data ?? [];
  const admins = useResource(adminConfig).data ?? [];
  const notifications = useResource(notificationConfig).data ?? [];

  const bisnisCount = Number(d.total_bisnis ?? 0) || businesses.length;
  const submissionCount = Number(d.total_pengajuan ?? 0) || submissions.length;
  const adminCount = Number(d.total_admin ?? 0) || admins.length;
  const notifCount = Number(d.total_notifikasi ?? 0) || notifications.length;
  const pending =
    Number(d.total_pending ?? 0) ||
    submissions.filter((item) => String(readPath(item, ["approval.status", "approval_status", "status"])) === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kontrol kualitas data dan proses pendanaan"
        body="Admin mengelola bisnis, pengajuan, kelas, invoice, investasi, distribusi profit, admin management, dan notifikasi operasional."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bisnis" value={String(bisnisCount)} helper="Terdaftar" icon={Building2} />
        <StatCard label="Pengajuan" value={String(submissionCount)} helper={`${pending} pending`} icon={FileCheck2} tone="amber" />
        <StatCard label="Admin" value={String(adminCount)} helper="Akun pengelola" icon={Users} />
        <StatCard label="Notifikasi" value={String(notifCount)} helper="Operasional" icon={Bell} tone="green" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">Status pengajuan</h3>
          <div className="mt-5 grid gap-3">
            {submissions.map((item) => (
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
