import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { ResourcePage } from "../../components/ResourcePage";
import { resourceApi } from "../../lib/api/resources";
import { directApi } from "../../lib/api/direct";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  adminConfig,
  adminBusinessConfig,
  businessConfig,
  classConfig,
  investmentConfig,
  investorInvestmentConfig,
  investorInvoiceConfig,
  investorProfitConfig,
  invoiceConfig,
  negotiationConfig,
  notificationConfig,
  profitConfig,
  publishedSubmissionConfig,
  salesConfig,
  salesByPengajuanConfig,
  submissionConfig,
  myBusinessConfig,
  myNegotiationConfig,
  userManagementConfig,
} from "../../lib/resourceConfigs";
import { currency, dateShort, percent, readPath, statusTone, textValue } from "../../lib/format";
import type { Entity, ResourceAction, ResourceColumn, ResourceConfig, ResourceField } from "../../types";

const badge = (status: unknown) => (
  <span className={`badge ${statusTone(status)}`}>{textValue(status)}</span>
);

const businessFields: ResourceField<Entity>[] = [
  { name: "nama_bisnis", label: "Nama Bisnis", required: true },
  {
    name: "tipe_usaha",
    label: "Tipe Usaha",
    type: "select",
    required: true,
    options: [
      { value: "kuliner", label: "Kuliner" },
      { value: "fashion", label: "Fashion" },
      { value: "kesehatan_kecantikan", label: "Kesehatan & Kecantikan" },
      { value: "teknologi", label: "Teknologi" },
      { value: "pendidikan", label: "Pendidikan" },
      { value: "pertanian", label: "Pertanian" },
      { value: "perdagangan", label: "Perdagangan" },
      { value: "jasa", label: "Jasa" },
      { value: "kerajinan", label: "Kerajinan" },
      { value: "lainnya", label: "Lainnya" },
    ],
  },
  { name: "alamat", label: "Alamat", required: true },
  { name: "no_telp", label: "No. Telp", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "kelas_id",
    label: "Kelas",
    type: "select",
    options: [
      { value: 1, label: "Critical" },
      { value: 2, label: "Struggling" },
      { value: 3, label: "Growth" },
      { value: 4, label: "Elite" },
    ],
  },
  { name: "deskripsi", label: "Deskripsi", type: "textarea" },
];

const businessColumns: ResourceColumn<Entity>[] = [
  {
    label: "Bisnis",
    render: (item) => (
      <div>
        <p className="font-black">{textValue(item.nama_bisnis || item.nama)}</p>
        <p className="mt-1 max-w-sm text-sm text-neutral/55">{textValue(item.deskripsi)}</p>
      </div>
    ),
  },
  { label: "Tipe Usaha", render: (item) => textValue(item.tipe_usaha) },
  { label: "Kelas", render: (item) => textValue(readPath(item, ["kelas.nama_kelas", "kelas_id"])) },
  {
    label: "Kontak",
    render: (item) => (
      <div className="text-sm">
        <p className="font-semibold">{textValue(item.email)}</p>
        <p className="text-neutral/50">{textValue(item.no_telp)}</p>
      </div>
    ),
  },
];

const submissionFields: ResourceField<Entity>[] = [
  { name: "bisnis_id", label: "ID Bisnis", type: "number", required: true },
  { name: "target_pendanaan", label: "Target Pendanaan", type: "number", required: true },
  { name: "total_pendanaan", label: "Total Pendanaan", type: "number" },
  { name: "per_anual_return", label: "Return Tahunan", type: "number", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "funded", label: "Funded" },
      { value: "rejected", label: "Rejected" },
    ],
  },
  {
    name: "approval_status",
    label: "Approval",
    type: "select",
    options: [
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
    ],
  },
];

const submissionColumns: ResourceColumn<Entity>[] = [
  {
    label: "Pengajuan",
    render: (item) => (
      <div>
        <p className="font-black">
          {textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "nama", "bisnis_id"]))}
        </p>
        <p className="mt-1 text-sm text-neutral/55">ID #{textValue(item.id)}</p>
      </div>
    ),
  },
  { label: "Target", render: (item) => currency(item.target_pendanaan) },
  { label: "Terkumpul", render: (item) => currency(item.total_pendanaan) },
  { label: "Return", render: (item) => percent(item.per_anual_return) },
  { label: "Status", render: (item) => badge(readPath(item, ["approval.status", "approval_status", "status"])) },
  { label: "Match", render: (item) => <span className="font-black text-secondary">{percent(item.match_score || item.skor_kecocokan)}</span> },
];

const salesFields: ResourceField<Entity>[] = [
  { name: "pengajuans_id", label: "ID Pengajuan", type: "number", required: true },
  { name: "periode", label: "Periode", required: true },
  { name: "total_penjualan", label: "Total Penjualan", type: "number", required: true },
  { name: "laba_kotor", label: "Laba Kotor", type: "number", required: true },
  { name: "laba_bersih", label: "Laba Bersih", type: "number", required: true },
  { name: "jumlah_transaksi", label: "Jumlah Transaksi", type: "number", required: true },
];

const salesColumns: ResourceColumn<Entity>[] = [
  { label: "Periode", render: (item) => <span className="font-black">{textValue(item.periode)}</span> },
  { label: "Pengajuan", render: (item) => `#${textValue(item.pengajuans_id)}` },
  { label: "Penjualan", render: (item) => currency(item.total_penjualan) },
  { label: "Laba Bersih", render: (item) => currency(item.laba_bersih) },
  { label: "Transaksi", render: (item) => textValue(item.jumlah_transaksi) },
];

const negotiationFields: ResourceField<Entity>[] = [
  { name: "pengajuans_id", label: "ID Pengajuan", type: "number", required: true },
  { name: "penawaran_nominal", label: "Penawaran Nominal", type: "number", required: true },
  { name: "penawaran_return", label: "Penawaran Return", type: "number", required: true },
  { name: "catatan", label: "Catatan", type: "textarea" },
];

const negotiationColumns: ResourceColumn<Entity>[] = [
  {
    label: "Negosiasi",
    render: (item) => (
      <div>
        <p className="font-black">{textValue(readPath(item, ["investor.nama", "investor"]))}</p>
        <p className="mt-1 text-sm text-neutral/55">
          {textValue(readPath(item, ["bisnis.nama", "bisnis.nama_bisnis", "bisnis_owner.nama", "bisnis"]))}
        </p>
      </div>
    ),
  },
  { label: "Nominal", render: (item) => currency(readPath(item, ["negosiasi_terakhir.penawaran_nominal", "penawaran_nominal"])) },
  { label: "Return", render: (item) => percent(readPath(item, ["negosiasi_terakhir.penawaran_return", "penawaran_return"])) },
  { label: "Status", render: (item) => badge(item.status) },
  { label: "Update", render: (item) => dateShort(item.updated_at || item.created_at) },
];

const _invoiceFields: ResourceField<Entity>[] = [
  { name: "nominal_tagihan", label: "Nominal Tagihan", type: "number", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "pending", label: "Pending" },
      { value: "paid", label: "Paid" },
    ],
  },
  { name: "due_date", label: "Due Date" },
];

const invoiceColumns: ResourceColumn<Entity>[] = [
  { label: "Invoice", render: (item) => <span className="font-black">{textValue(item.kode_pembayaran || `#${item.id}`)}</span> },
  { label: "Pengajuan", render: (item) => `#${textValue(readPath(item, ["detail_pengajuan.id", "pengajuans_id"]))}` },
  { label: "Nominal", render: (item) => currency(item.total_nominal || item.nominal_tagihan) },
  { label: "Due", render: (item) => dateShort(item.tenggat_waktu || item.due_date) },
  { label: "Status", render: (item) => badge(item.status) },
];

const investmentColumns: ResourceColumn<Entity>[] = [
  { label: "Bisnis", render: (item) => <span className="font-black">{textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis", "pengajuan.bisnis.nama"]))}</span> },
  { label: "Nominal", render: (item) => currency(item.nominal_investasi) },
  { label: "Return", render: (item) => percent(item.return_investasi) },
  { label: "Status", render: (item) => badge(readPath(item, ["negosiasi.status", "status"])) },
  { label: "Tanggal", render: (item) => dateShort(item.created_at) },
];

const profitFields: ResourceField<Entity>[] = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "pending", label: "Pending" },
      { value: "distributed", label: "Distributed" },
    ],
  },
];

const profitColumns: ResourceColumn<Entity>[] = [
  { label: "Bisnis", render: (item) => <span className="font-black">{textValue(readPath(item, ["penjualan.nama_bisnis", "bisnis"]))}</span> },
  { label: "Periode", render: (item) => textValue(item.periode) },
  { label: "Nominal Profit", render: (item) => currency(item.nominal_profit) },
  { label: "Investasi", render: (item) => `#${textValue(readPath(item, ["investasi.id", "investasi_id"]))}` },
  { label: "Status", render: (item) => badge(item.status) },
];

const classFields: ResourceField<Entity>[] = [
  { name: "nama_kelas", label: "Nama Kelas", required: true },
  { name: "deskripsi", label: "Deskripsi", type: "textarea", required: true },
];

const classColumns: ResourceColumn<Entity>[] = [
  { label: "Kelas", render: (item) => <span className="font-black">{textValue(item.nama_kelas)}</span> },
  { label: "Deskripsi", render: (item) => <span className="text-neutral/60">{textValue(item.deskripsi)}</span> },
];

const adminFields: ResourceField<Entity>[] = [
  { name: "nama", label: "Nama", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "password", label: "Password" },
  { name: "no_telp", label: "No. Telp", required: true },
  {
    name: "level",
    label: "Level",
    type: "select",
    options: [
      { value: "admin", label: "Admin" },
      { value: "superadmin", label: "Superadmin" },
    ],
  },
];

const adminColumns: ResourceColumn<Entity>[] = [
  { label: "Nama", render: (item) => <span className="font-black">{textValue(item.nama)}</span> },
  { label: "Email", render: (item) => textValue(item.email) },
  { label: "No. Telp", render: (item) => textValue(item.no_telp) },
  { label: "Level", render: (item) => badge(item.level) },
];

const _notificationFields: ResourceField<Entity>[] = [
  { name: "title", label: "Title", required: true },
  { name: "message", label: "Message", type: "textarea", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "unread", label: "Unread" },
      { value: "read", label: "Read" },
    ],
  },
];

const notificationColumns: ResourceColumn<Entity>[] = [
  {
    label: "Notifikasi",
    render: (item) => (
      <div>
        <p className="font-black">{textValue(item.title || item.type)}</p>
        <p className="mt-1 max-w-lg text-sm text-neutral/55">{textValue(item.message)}</p>
      </div>
    ),
  },
  { label: "Tanggal", render: (item) => dateShort(item.created_at) },
  { label: "Status", render: (item) => badge(item.is_read ? "read" : item.status || "unread") },
];

const submissionActions: ResourceAction<Entity>[] = [
  {
    label: "Approve",
    method: "PUT",
    path: (item) => `/businesses/proposals/${item.id}/status`,
    body: { status: "approved", catatan: "Pengajuan disetujui dari dashboard." },
    confirm: "Setujui pengajuan ini?",
    className: "btn btn-success btn-xs rounded-md text-white",
  },
  {
    label: "Reject",
    method: "PUT",
    path: (item) => `/businesses/proposals/${item.id}/status`,
    body: { status: "rejected", catatan: "Pengajuan ditolak dari dashboard." },
    confirm: "Tolak pengajuan ini?",
    className: "btn btn-error btn-xs rounded-md text-white",
  },
];

const salesActions: ResourceAction<Entity>[] = [
  {
    label: "By Pengajuan",
    method: "GET",
    path: (item) => `/businesses/proposals/sales/pengajuan?pengajuans_id=${item.pengajuans_id}`,
    className: "btn btn-outline btn-xs rounded-md",
  },
];

const negotiationActions: ResourceAction<Entity>[] = [
  {
    label: "Accept",
    method: "POST",
    path: (item) => `/businesses/proposals/negotiations/accept/${item.id}`,
    body: { catatan: "Negosiasi disetujui dari dashboard." },
    confirm: "Setujui negosiasi ini?",
    className: "btn btn-success btn-xs rounded-md text-white",
  },
  {
    label: "Reject",
    method: "POST",
    path: (item) => `/businesses/proposals/negotiations/reject/${item.id}`,
    body: { catatan: "Negosiasi ditolak dari dashboard." },
    confirm: "Tolak negosiasi ini?",
    className: "btn btn-error btn-xs rounded-md text-white",
  },
];

const invoiceActions: ResourceAction<Entity>[] = [
  {
    label: "Pay",
    method: "PUT",
    path: (item) => `/invoices/${item.kode_pembayaran || item.id}/pay`,
    confirm: "Bayar invoice ini?",
    className: "btn btn-success btn-xs rounded-md text-white",
  },
];

const investmentActions: ResourceAction<Entity>[] = [
  {
    label: "By Pengajuan",
    method: "GET",
    path: (item) => `/investasi/proposals?pengajuans_id=${item.pengajuans_id || item.pengajuan_id || item.id}`,
    className: "btn btn-outline btn-xs rounded-md",
  },
];

const profitActions: ResourceAction<Entity>[] = [
  {
    label: "By Penjualan",
    method: "GET",
    path: (item) => `/profit-distributions/sales?penjualans_id=${item.penjualans_id || item.penjualan_id || readPath(item, ["penjualan.id"]) || item.id}`,
    className: "btn btn-outline btn-xs rounded-md",
  },
];

const notificationActions: ResourceAction<Entity>[] = [
  {
    label: "Read",
    method: "PUT",
    path: (item) => `/notifications/${item.id}`,
    className: "btn btn-outline btn-xs rounded-md",
  },
];

export function BusinessesPage({
  scope = "all",
}: {
  scope?: "all" | "mine" | "admin";
}) {
  const { user } = useAuth();
  const config: ResourceConfig<Entity> =
    scope === "mine" ? myBusinessConfig : scope === "admin" ? adminBusinessConfig : businessConfig;
  const isAdminScope = scope === "admin";
  const isUmkmOwner = user?.role === "umkm" && !isAdminScope;

  return (
    <ResourcePage
      title="Bisnis"
      description="Kelola profil bisnis UMKM, kontak, sektor, kelas, dan deskripsi usaha."
      config={config}
      columns={businessColumns}
      fields={businessFields}
      createLabel="Tambah Bisnis"
      allowCreate={isUmkmOwner}
      allowEdit={isUmkmOwner}
      allowDelete={isUmkmOwner || user?.role === "superadmin"}
    />
  );
}

export function SubmissionsPage({ admin = false }: { admin?: boolean }) {
  return (
    <ResourcePage
      title="Pengajuan Dana"
      description="Kelola target pendanaan, return tahunan, progress pendanaan, status publikasi, dan approval."
      config={submissionConfig}
      columns={submissionColumns}
      fields={submissionFields}
      createLabel="Tambah Pengajuan"
      actions={admin ? submissionActions : []}
      allowCreate={!admin}
      allowDelete={admin}
    />
  );
}

export function SalesPage() {
  const { user } = useAuth();
  const [pengajuanId, setPengajuanId] = useState("");

  if (user?.role === "umkm" && !pengajuanId.trim()) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral">Laporan Penjualan</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
            Masukkan ID pengajuan untuk melihat laporan penjualan yang tersedia di backend.
          </p>
        </div>
        <label className="form-control max-w-sm">
          <span className="label-text mb-2 font-semibold">ID Pengajuan</span>
          <input
            className="input input-bordered rounded-md bg-white"
            value={pengajuanId}
            onChange={(event) => setPengajuanId(event.target.value)}
            placeholder="Contoh: 101"
          />
        </label>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {user?.role === "umkm" ? (
        <label className="form-control max-w-sm">
          <span className="label-text mb-2 font-semibold">ID Pengajuan</span>
          <input
            className="input input-bordered rounded-md bg-white"
            value={pengajuanId}
            onChange={(event) => setPengajuanId(event.target.value)}
          />
        </label>
      ) : null}
      <ResourcePage
        title="Laporan Penjualan"
        description="Catat periode penjualan, laba, dan transaksi untuk kebutuhan distribusi profit."
        config={user?.role === "umkm" ? salesByPengajuanConfig(pengajuanId) : salesConfig}
        columns={salesColumns}
        fields={salesFields}
        createLabel="Tambah Laporan"
        actions={user?.role === "umkm" ? [] : salesActions}
        allowCreate={user?.role === "umkm"}
        allowEdit={user?.role === "umkm"}
        allowDelete={false}
      />
    </div>
  );
}

export function NegotiationsPage({ mine = false }: { mine?: boolean }) {
  return (
    <ResourcePage
      title="Negosiasi"
      description="Kelola penawaran nominal, return, status, dan catatan antara investor dan pemilik bisnis."
      config={mine ? myNegotiationConfig : negotiationConfig}
      columns={negotiationColumns}
      fields={negotiationFields}
      createLabel="Mulai Negosiasi"
      actions={negotiationActions}
    />
  );
}

export function OpportunitiesPage() {
  return (
    <ResourcePage
      title="Peluang Pendanaan"
      description="Daftar pengajuan UMKM yang sudah dipublikasikan dan siap untuk investasi."
      config={publishedSubmissionConfig}
      columns={submissionColumns}
      readonly
    />
  );
}

export function AiRecommendationsPage() {
  const [risk, setRisk] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const { data: recommendationsPayload = null } = useQuery({
    queryKey: ["ai-recommendations", "backend"],
    queryFn: () => directApi.get("/user/investor/recommendations", null),
  });
  const backendRecommendations = useMemo(() => {
    if (Array.isArray(recommendationsPayload)) return recommendationsPayload as Entity[];
    if (recommendationsPayload && typeof recommendationsPayload === "object") {
      const payload = recommendationsPayload as Record<string, unknown>;
      if (Array.isArray(payload.rekomendasi)) return payload.rekomendasi as Entity[];
    }
    return [];
  }, [recommendationsPayload]);
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ["ai-recommendations", "fallback"],
    queryFn: () => resourceApi.list(publishedSubmissionConfig),
    enabled: backendRecommendations.length === 0,
  });
  const sourceData = backendRecommendations.length > 0 ? backendRecommendations : allSubmissions;
  const data = useMemo(
    () =>
      sourceData.filter((item) => {
        const riskValue = textValue(readPath(item, ["risk_level", "matched_class", "bisnis.kelas.nama_kelas"])).toLowerCase();
        const riskMatch = risk === "all" || riskValue === risk;
        return riskMatch && Number(item.match_score || item.skor_kecocokan || 0) >= minScore;
      }),
    [minScore, risk, sourceData],
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral">AI Matchmaking</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
            Rekomendasi peluang berdasarkan skor kecocokan, risiko, return, dan
            kebutuhan pendanaan.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-11 items-center gap-2 rounded-md border border-base-300 bg-white px-3">
            <Filter size={18} />
            <select
              className="bg-transparent text-sm font-semibold outline-none"
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
            >
              <option value="all">Semua risiko</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="input input-bordered flex h-11 items-center gap-2 rounded-md bg-white">
            <span className="text-sm font-bold">Min</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-16"
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
            />
            <span className="text-sm font-bold">%</span>
          </label>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {data.map((item) => (
          <article key={item.id} className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">
                  {textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "bisnis_id"]))}
                </h3>
                <p className="mt-1 text-sm text-neutral/55">
                  {textValue(readPath(item, ["bisnis.kelas.nama_kelas", "matched_class", "risk_level"]))}
                </p>
              </div>
              <span className="badge badge-secondary badge-lg text-white">
                {percent(item.match_score || item.skor_kecocokan)}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-base-200 p-3">
                <p className="text-neutral/50">Target</p>
                <p className="font-black">{currency(item.target_pendanaan || readPath(item, ["bisnis.target_pendanaan"]))}</p>
              </div>
              <div className="rounded-md bg-base-200 p-3">
                <p className="text-neutral/50">Return</p>
                <p className="font-black">{percent(item.per_anual_return)}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-neutral/60">
              Cocok untuk investor dengan preferensi pertumbuhan stabil,
              toleransi risiko {textValue(item.risk_level).toLowerCase()}, dan
              target return menengah.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function InvoicesPage({ investor = false }: { investor?: boolean }) {
  return (
    <ResourcePage
      title="Invoice"
      description="Pantau tagihan investasi dan status pembayaran invoice."
      config={investor ? investorInvoiceConfig : invoiceConfig}
      columns={invoiceColumns}
      fields={[]}
      createLabel="Update Invoice"
      actions={investor ? invoiceActions : []}
      readonly
    />
  );
}

export function InvestmentsPage({ investor = false }: { investor?: boolean }) {
  return (
    <ResourcePage
      title="Investasi"
      description="Daftar investasi aktif berdasarkan invoice yang telah dibayar."
      config={investor ? investorInvestmentConfig : investmentConfig}
      columns={investmentColumns}
      actions={investor ? [] : investmentActions}
      readonly
    />
  );
}

export function ProfitsPage({ investor = false }: { investor?: boolean }) {
  return (
    <ResourcePage
      title="Distribusi Profit"
      description="Pantau pembagian profit per periode dan status distribusinya."
      config={investor ? investorProfitConfig : profitConfig}
      columns={profitColumns}
      fields={investor ? [] : profitFields}
      readonly={investor}
      createLabel="Update Profit"
      actions={profitActions}
      allowCreate={false}
      allowDelete={false}
    />
  );
}

export function ClassesPage() {
  return (
    <ResourcePage
      title="Kelas Bisnis"
      description="Kelola kelas bisnis yang dipakai sebagai sinyal risiko dan kualitas usaha."
      config={classConfig}
      columns={classColumns}
      fields={classFields}
      createLabel="Tambah Kelas"
    />
  );
}

const userColumns: ResourceColumn<Entity>[] = [
  { label: "Nama", render: (item) => <span className="font-black">{textValue(item.nama)}</span> },
  { label: "Email", render: (item) => textValue(item.email) },
  { label: "Role", render: (item) => textValue(readPath(item, ["role.nama_role", "role_name", "level", "role_id"])) },
  { label: "No. Telp", render: (item) => textValue(item.no_telp) },
];

const _userFields: ResourceField<Entity>[] = [
  { name: "nama", label: "Nama", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "no_telp", label: "No. Telp" },
];

export function UsersPage() {
  return (
    <ResourcePage
      title="Users"
      description="Kelola data user, role, dan informasi kontak akun platform."
      config={userManagementConfig}
      columns={userColumns}
      fields={[]}
      createLabel="Update User"
      readonly
    />
  );
}

export function AdminsPage() {
  const { user } = useAuth();
  const canMutate = user?.role === "superadmin";

  return (
    <ResourcePage
      title="Admin Management"
      description="Kelola akun admin dan superadmin untuk operasional platform."
      config={adminConfig}
      columns={adminColumns}
      fields={adminFields}
      createLabel="Tambah Admin"
      allowCreate={canMutate}
      allowEdit={canMutate}
      allowDelete={canMutate}
    />
  );
}

export function NotificationsPage() {
  return (
    <ResourcePage
      title="Notifikasi"
      description="Kelola notifikasi operasional dan tandai status baca."
      config={notificationConfig}
      columns={notificationColumns}
      fields={[]}
      createLabel="Tambah Notifikasi"
      actions={notificationActions}
      allowCreate={false}
      allowEdit={false}
    />
  );
}
