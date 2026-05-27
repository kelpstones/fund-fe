import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import { Filter, Loader2, RefreshCw } from "lucide-react";
import { ResourcePage } from "../../components/ResourcePage";
import { resourceApi } from "../../lib/api/resources";
import { apiClient, unwrap } from "../../lib/api/client";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import {
  adminConfig,
  adminBusinessConfig,
  businessConfig,
  classConfig,
  investmentConfig,
  investmentByPengajuanConfig,
  investorInvestmentConfig,
  investorInvoiceConfig,
  investorProfitConfig,
  invoiceConfig,
  negotiationConfig,
  notificationConfig,
  profitConfig,
  profitBySalesConfig,
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

const isStatus = (item: Entity, statuses: string[]) =>
  statuses.includes(String(readPath(item, ["approval.status", "status", "approval_status"])).toLowerCase());

const entityLabel = (item: Entity, paths: string[]) =>
  `${textValue(readPath(item, paths))} (#${textValue(item.id)})`;

const asOptions = (items: Entity[], paths: string[]) =>
  items.map((item) => ({
    value: item.id,
    label: entityLabel(item, paths),
  }));

const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return String(error.response.data.message);
  }
  return fallback;
};

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
  { name: "alamat", label: "Alamat", required: true, colSpan: 2 },
  { name: "no_telp", label: "No. Telp", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "kelas_id",
    label: "Kelas",
    type: "select",
    colSpan: 2,
    options: [],
  },
  { name: "deskripsi", label: "Deskripsi", type: "textarea", colSpan: 2 },
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
  { name: "bisnis_id", label: "Bisnis", type: "number", required: true },
  { name: "target_pendanaan", label: "Target Pendanaan", type: "number", required: true },
  { name: "total_pendanaan", label: "Total Pendanaan", type: "number" },
  { name: "per_anual_return", label: "Return Tahunan", type: "number", required: true },
  { name: "deskripsi_peluang", label: "Deskripsi Peluang", type: "textarea", colSpan: 2 },
  {
    name: "rencana_penggunaan_dana",
    label: "Rencana Penggunaan Dana (JSON)",
    type: "textarea",
    placeholder:
      '[{"kategori":"Marketing","jumlah":10000000},{"kategori":"Operasional","jumlah":15000000}]',
    colSpan: 2,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draf" },
      { value: "published", label: "Dipublikasikan" },
      { value: "funded", label: "Didanai" },
      { value: "rejected", label: "Ditolak" },
    ],
  },
  {
    name: "approval_status",
    label: "Approval",
    type: "select",
    options: [
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Disetujui" },
      { value: "rejected", label: "Ditolak" },
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
  { label: "Peluang", render: (item) => textValue(item.deskripsi_peluang, "-") },
  { label: "Status", render: (item) => badge(readPath(item, ["approval.status", "approval_status", "status"])) },
  { label: "Match", render: (item) => <span className="font-black text-secondary">{percent(item.match_score || item.skor_kecocokan)}</span> },
];

const salesFields: ResourceField<Entity>[] = [
  { name: "pengajuans_id", label: "Pengajuan", type: "number", required: true },
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
  { name: "pengajuans_id", label: "Pengajuan", type: "number", required: true },
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
      { value: "unread", label: "Belum Dibaca" },
      { value: "read", label: "Dibaca" },
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
    label: "Setujui",
    method: "PUT",
    path: (item) => `/businesses/proposals/${item.id}/status`,
    body: { status: "approved", catatan: "Pengajuan disetujui dari dashboard." },
    confirm: "Setujui pengajuan ini?",
    className: "btn btn-success btn-xs rounded-md text-white",
    isVisible: (item) => isStatus(item, ["pending", "draft"]),
  },
  {
    label: "Tolak",
    method: "PUT",
    path: (item) => `/businesses/proposals/${item.id}/status`,
    body: { status: "rejected", catatan: "Pengajuan ditolak dari dashboard." },
    confirm: "Tolak pengajuan ini?",
    className: "btn btn-error btn-xs rounded-md text-white",
    isVisible: (item) => !isStatus(item, ["rejected", "approved", "published", "funded"]),
  },
];

const negotiationActions: ResourceAction<Entity>[] = [
  {
    label: "Setujui",
    method: "POST",
    path: (item) => `/businesses/proposals/negotiations/accept/${item.id}`,
    body: { catatan: "Negosiasi disetujui dari dashboard." },
    confirm: "Setujui negosiasi ini?",
    className: "btn btn-success btn-xs rounded-md text-white",
    isVisible: (item) => !isStatus(item, ["accepted", "rejected", "deal"]),
  },
  {
    label: "Tolak",
    method: "POST",
    path: (item) => `/businesses/proposals/negotiations/reject/${item.id}`,
    body: { catatan: "Negosiasi ditolak dari dashboard." },
    confirm: "Tolak negosiasi ini?",
    className: "btn btn-error btn-xs rounded-md text-white",
    isVisible: (item) => !isStatus(item, ["accepted", "rejected", "deal"]),
  },
];

const invoiceActions: ResourceAction<Entity>[] = [
  {
    label: "Bayar Invoice",
    method: "PUT",
    path: (item) => `/invoices/${item.id}/pay`,
    confirm: "Bayar invoice ini?",
    className: "btn btn-primary btn-xs rounded-md text-white",
    isVisible: (item) => !isStatus(item, ["paid", "completed"]),
  },
  {
    label: "Bayar via Dompet",
    method: "POST",
    path: (item) => `/wallet/pay-invoice/${item.kode_pembayaran || item.id}`,
    confirm: "Bayar invoice ini menggunakan saldo dompet?",
    className: "btn btn-success btn-xs rounded-md text-white",
    isVisible: (item) => !isStatus(item, ["paid", "completed"]),
  },
];

const investmentActions: ResourceAction<Entity>[] = [
  {
    label: "Per Pengajuan",
    method: "GET",
    path: (item) => `/investasi/proposals?pengajuans_id=${item.pengajuans_id || item.pengajuan_id || item.id}`,
    className: "btn btn-outline btn-xs rounded-md",
  },
];

const profitActions: ResourceAction<Entity>[] = [
  {
    label: "Per Penjualan",
    method: "GET",
    path: (item) => `/profit-distributions/sales?penjualans_id=${item.penjualans_id || item.penjualan_id || readPath(item, ["penjualan.id"]) || item.id}`,
    className: "btn btn-outline btn-xs rounded-md",
  },
];

const notificationActions: ResourceAction<Entity>[] = [
  {
    label: "Tandai Dibaca",
    method: "PUT",
    path: (item) => `/notifications/${item.id}`,
    className: "btn btn-outline btn-xs rounded-md",
    isVisible: (item) => !item.is_read && !isStatus(item, ["read"]),
  },
];

export function BusinessesPage({
  scope = "all",
}: {
  scope?: "all" | "mine" | "admin";
}) {
  const { user } = useAuth();
  const classOptionsQuery = useQuery({
    queryKey: ["business-class-options"],
    queryFn: () => resourceApi.list(classConfig),
    retry: false,
  });
  const config: ResourceConfig<Entity> =
    scope === "mine" ? myBusinessConfig : scope === "admin" ? adminBusinessConfig : businessConfig;
  const isAdminScope = scope === "admin";
  const isUmkmOwner = user?.role === "umkm" && !isAdminScope;
  const canDelete = isUmkmOwner || (isAdminScope && user?.role === "superadmin");
  const classOptions = useMemo(
    () =>
      (classOptionsQuery.data ?? []).map((item) => ({
        value: Number(item.id),
        label: `${textValue(item.nama_kelas)} - ${textValue(item.deskripsi, "-")}`,
      })),
    [classOptionsQuery.data],
  );
  const fields = useMemo<ResourceField<Entity>[]>(
    () =>
      businessFields.map((field) =>
        field.name === "kelas_id"
          ? {
              ...field,
              options: classOptions,
            }
          : field,
      ),
    [classOptions],
  );

  return (
    <ResourcePage
      title="Bisnis"
      description="Kelola profil bisnis UMKM, kontak, sektor, kelas, dan deskripsi usaha."
      config={config}
      columns={businessColumns}
      fields={fields}
      createLabel="Tambah Bisnis"
      allowCreate={isUmkmOwner}
      allowEdit={false}
      allowDelete={canDelete}
      emptyTitle={isUmkmOwner ? "Belum ada bisnis" : "Belum ada bisnis terdaftar"}
      emptyDescription={
        isUmkmOwner
          ? "Tambahkan bisnis pertama agar kamu bisa membuat pengajuan pendanaan."
          : "Data bisnis akan muncul setelah UMKM mendaftarkan profil usaha."
      }
      searchableFields={["nama_bisnis", "nama", "tipe_usaha", "email", "no_telp"]}
    />
  );
}

export function SubmissionsPage({ admin = false }: { admin?: boolean }) {
  const businessOptionsQuery = useQuery({
    queryKey: ["submission-business-options", admin],
    queryFn: () => resourceApi.list(admin ? businessConfig : myBusinessConfig),
    enabled: !admin,
  });
  const fields = useMemo<ResourceField<Entity>[]>(() => {
    if (admin) return submissionFields;
    return [
      {
        name: "bisnis_id",
        label: "Bisnis",
        type: "select",
        required: true,
        options: asOptions(businessOptionsQuery.data ?? [], ["nama_bisnis", "nama"]),
      },
      { name: "target_pendanaan", label: "Target Pendanaan", type: "number", required: true },
      { name: "per_anual_return", label: "Return Tahunan", type: "number", required: true },
      { name: "deskripsi_peluang", label: "Deskripsi Peluang", type: "textarea", colSpan: 2 },
      {
        name: "rencana_penggunaan_dana",
        label: "Rencana Penggunaan Dana (JSON)",
        type: "textarea",
        placeholder:
          '[{"kategori":"Marketing","jumlah":10000000},{"kategori":"Operasional","jumlah":15000000}]',
        colSpan: 2,
      },
    ];
  }, [admin, businessOptionsQuery.data]);

  return (
    <ResourcePage
      title="Pengajuan Dana"
      description="Kelola target pendanaan, return tahunan, progress pendanaan, status publikasi, dan approval."
      config={submissionConfig}
      columns={submissionColumns}
      fields={fields}
      createLabel="Tambah Pengajuan"
      actions={admin ? submissionActions : []}
      allowCreate={!admin}
      allowEdit={!admin}
      allowDelete={admin}
      emptyTitle={admin ? "Belum ada pengajuan" : "Belum ada pengajuan dana"}
      emptyDescription={
        admin
          ? "Pengajuan UMKM akan muncul di sini untuk proses review."
          : "Buat pengajuan setelah profil bisnis tersedia agar investor bisa melihat peluang pendanaan."
      }
      searchableFields={[
        "id",
        "target_pendanaan",
        "per_anual_return",
        "deskripsi_peluang",
        (item) => readPath(item, ["bisnis.nama_bisnis", "bisnis.nama"]),
      ]}
    />
  );
}

export function SalesPage() {
  const { user } = useAuth();

  if (user?.role === "umkm") return <UmkmSalesPage />;

  return (
    <ResourcePage
      title="Laporan Penjualan"
      description="Catat periode penjualan, laba, dan transaksi untuk kebutuhan distribusi profit."
      config={salesConfig}
      columns={salesColumns}
      fields={salesFields}
      createLabel="Tambah Laporan"
      actions={[]}
      allowCreate={false}
      allowEdit={false}
      allowDelete={false}
      emptyTitle="Belum ada laporan penjualan"
      emptyDescription="Laporan penjualan UMKM akan tampil setelah backend menyediakan daftar data untuk role ini."
      searchableFields={["periode", "pengajuans_id", "total_penjualan"]}
    />
  );
}

function UmkmSalesPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    pengajuans_id: "",
    periode: "",
    total_penjualan: "",
    laba_kotor: "",
    laba_bersih: "",
    jumlah_transaksi: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submissionsQuery = useQuery({
    queryKey: ["sales-submission-options"],
    queryFn: () => resourceApi.list(submissionConfig),
  });
  const submissionOptions = asOptions(submissionsQuery.data ?? [], [
    "bisnis.nama_bisnis",
    "bisnis.nama",
    "nama",
    "id",
  ]);
  const selectedPengajuanId = form.pengajuans_id.trim();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/businesses/proposals/sales", {
        pengajuans_id: Number(form.pengajuans_id),
        periode: form.periode,
        total_penjualan: Number(form.total_penjualan),
        laba_kotor: Number(form.laba_kotor),
        laba_bersih: Number(form.laba_bersih),
        jumlah_transaksi: Number(form.jumlah_transaksi),
      });
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      const selectedId = form.pengajuans_id;
      setMessage(t("salesReportSubmitSuccess"));
      setError("");
      setForm({
        pengajuans_id: selectedId,
        periode: "",
        total_penjualan: "",
        laba_kotor: "",
        laba_bersih: "",
        jumlah_transaksi: "",
      });
      if (selectedId) {
        await queryClient.invalidateQueries({
          queryKey: ["resource", `sales-pengajuan-${selectedId}`],
        });
      }
    },
    onError: (err) => {
      setMessage("");
      setError(apiErrorMessage(err, t("salesReportSubmitError")));
    },
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black tracking-normal text-neutral">{t("Laporan Penjualan")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
          {t("umkmSalesDescription")}
        </p>
      </div>
      <form className="rounded-md border border-base-300 bg-white p-5 shadow-sm" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          {salesFields.map((field) => (
            <label key={field.name} className="form-control">
              <span className="label-text mb-2 font-semibold">{t(field.label)}</span>
              {field.name === "pengajuans_id" && submissionOptions.length > 0 ? (
                <select
                  className="select select-bordered rounded-md"
                  value={form.pengajuans_id}
                  onChange={(event) => update("pengajuans_id", event.target.value)}
                  required
                >
                  <option value="">{t("chooseSubmission")}</option>
                  {submissionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input input-bordered rounded-md"
                  type={field.type ?? "text"}
                  value={form[field.name as keyof typeof form] ?? ""}
                  onChange={(event) => update(field.name as keyof typeof form, event.target.value)}
                  required={field.required}
                  placeholder={field.name === "periode" ? t("periodPlaceholder") : undefined}
                />
              )}
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="btn btn-primary rounded-md text-white" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : null}
            {t("Tambah Laporan")}
          </button>
          {message ? <span className="text-sm font-semibold text-success">{message}</span> : null}
          {error ? <span className="text-sm font-semibold text-error">{error}</span> : null}
        </div>
      </form>
      {selectedPengajuanId ? (
        <ResourcePage
          title="Riwayat Penjualan Pengajuan"
          description="Laporan penjualan untuk pengajuan yang sedang dipilih."
          config={salesByPengajuanConfig(selectedPengajuanId)}
          columns={salesColumns}
          fields={[]}
          readonly
          allowCreate={false}
          allowEdit={false}
          allowDelete={false}
          emptyTitle="Belum ada laporan untuk pengajuan ini"
          emptyDescription="Tambahkan laporan penjualan untuk melihat riwayat pada pengajuan yang dipilih."
          searchableFields={["periode", "total_penjualan", "laba_bersih", "jumlah_transaksi"]}
        />
      ) : null}
    </section>
  );
}

export function NegotiationsPage({ mine = false }: { mine?: boolean }) {
  const { user } = useAuth();
  const canNegotiate = user?.role === "umkm" || user?.role === "investor";
  const opportunitiesQuery = useQuery({
    queryKey: ["negotiation-opportunity-options"],
    queryFn: () => resourceApi.list(publishedSubmissionConfig),
    enabled: user?.role === "investor",
  });
  const fields = useMemo<ResourceField<Entity>[]>(() => {
    if (user?.role !== "investor") return negotiationFields.slice(1);
    return [
      {
        name: "pengajuans_id",
        label: "Pengajuan",
        type: "select",
        required: true,
        options: asOptions(opportunitiesQuery.data ?? [], ["bisnis.nama_bisnis", "bisnis.nama", "nama"]),
      },
      ...negotiationFields.slice(1),
    ];
  }, [opportunitiesQuery.data, user?.role]);

  return (
    <ResourcePage
      title="Negosiasi"
      description="Kelola penawaran nominal, return, status, dan catatan antara investor dan pemilik bisnis."
      config={mine ? myNegotiationConfig : negotiationConfig}
      columns={negotiationColumns}
      fields={fields}
      createLabel="Mulai Negosiasi"
      actions={canNegotiate ? negotiationActions : []}
      allowCreate={user?.role === "investor"}
      allowEdit={canNegotiate}
      allowDelete={false}
      emptyTitle="Belum ada negosiasi"
      emptyDescription={
        user?.role === "investor"
          ? "Mulai negosiasi dari peluang pendanaan yang tersedia."
          : "Negosiasi investor akan muncul di sini setelah ada penawaran."
      }
      searchableFields={["status", "catatan", (item) => readPath(item, ["investor.nama", "bisnis.nama", "bisnis.nama_bisnis"])]}
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
      emptyTitle="Belum ada peluang pendanaan"
      emptyDescription="Peluang akan muncul setelah pengajuan UMKM dipublikasikan."
      searchableFields={["target_pendanaan", "per_anual_return", (item) => readPath(item, ["bisnis.nama_bisnis", "bisnis.nama"])]}
    />
  );
}

export function AiRecommendationsPage() {
  const [risk, setRisk] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const queryClient = useQueryClient();
  const {
    data: recommendationsPayload = null,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["ai-recommendations", "backend"],
    queryFn: async () => {
      const response = await apiClient.get("/user/investor/recommendations");
      return unwrap<unknown>(response.data);
    },
  });
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/user/investor/preferences/refresh");
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setRefreshMessage("Rekomendasi berhasil diperbarui.");
      setRefreshError("");
      await queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
    },
    onError: (error) => {
      setRefreshMessage("");
      setRefreshError(apiErrorMessage(error, "Rekomendasi belum bisa diperbarui."));
    },
  });
  const backendRecommendations = useMemo(() => {
    if (Array.isArray(recommendationsPayload)) return recommendationsPayload as Entity[];
    if (recommendationsPayload && typeof recommendationsPayload === "object") {
      const payload = recommendationsPayload as Record<string, unknown>;
      if (Array.isArray(payload.rekomendasi)) return payload.rekomendasi as Entity[];
    }
    return [];
  }, [recommendationsPayload]);
  const data = useMemo(
    () =>
      backendRecommendations.filter((item) => {
        const riskValue = textValue(readPath(item, ["risk_level", "matched_class", "bisnis.kelas.nama_kelas"])).toLowerCase();
        const riskMatch = risk === "all" || riskValue === risk;
        return riskMatch && Number(item.match_score || item.skor_kecocokan || 0) >= minScore;
      }),
    [backendRecommendations, minScore, risk],
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
          <Link to="/dashboard/investor/preferensi" className="btn btn-outline h-11 rounded-md">
            Preferensi
          </Link>
          <button
            className="btn btn-primary h-11 rounded-md text-white"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            {refreshMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Refresh
          </button>
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
      {refreshMessage ? (
        <div className="rounded-md border border-info/20 bg-info/10 px-4 py-3 text-sm font-semibold text-info">
          {refreshMessage}
        </div>
      ) : null}
      {refreshError ? (
        <div className="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          {refreshError}
        </div>
      ) : null}
      {isError ? (
        <div className="rounded-md border border-warning/20 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          {apiErrorMessage(error, "Rekomendasi belum tersedia. Lengkapi preferensi investor terlebih dahulu.")}
        </div>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-3">
        {isLoading ? (
          <div className="rounded-md border border-base-300 bg-white p-5 text-sm font-semibold text-neutral/55">
            Memuat rekomendasi
          </div>
        ) : null}
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
              {textValue(
                readPath(item, ["reason", "alasan", "explanation", "match_reason"], ""),
                `Cocok dengan profil risiko ${textValue(
                  readPath(item, ["risk_level", "matched_class", "bisnis.kelas.nama_kelas"]),
                ).toLowerCase()} dan target return ${percent(item.per_anual_return)}.`,
              )}
            </p>
          </article>
        ))}
        {!isLoading && !isError && data.length === 0 ? (
          <div className="rounded-md border border-base-300 bg-white p-5 text-sm font-semibold text-neutral/55">
            Rekomendasi belum tersedia. Isi preferensi investor lalu jalankan refresh.
          </div>
        ) : null}
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
      emptyTitle="Belum ada invoice"
      emptyDescription={
        investor
          ? "Invoice investasi akan muncul setelah negosiasi berlanjut ke proses pembayaran."
          : "Invoice platform akan muncul setelah ada transaksi investasi."
      }
      searchableFields={["kode_pembayaran", "status", "total_nominal", "nominal_tagihan"]}
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
      emptyTitle="Belum ada investasi"
      emptyDescription={
        investor
          ? "Portfolio investasi akan muncul setelah invoice dibayar."
          : "Investasi akan muncul setelah investor menyelesaikan pembayaran invoice."
      }
      searchableFields={["status", "nominal_investasi", (item) => readPath(item, ["bisnis.nama_bisnis", "bisnis", "pengajuan.bisnis.nama"])]}
    />
  );
}

export function InvestmentsByProposalPage() {
  const { t } = useLanguage();
  const [pengajuanId, setPengajuanId] = useState("");
  const submissionsQuery = useQuery({
    queryKey: ["investments-submission-options"],
    queryFn: () => resourceApi.list(submissionConfig),
  });
  const submissionOptions = asOptions(submissionsQuery.data ?? [], [
    "bisnis.nama_bisnis",
    "bisnis.nama",
    "nama",
  ]);

  if (!pengajuanId.trim()) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral">{t("Investasi Pengajuan")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
            {t("investmentBySubmissionPrompt")}
          </p>
        </div>
        <label className="form-control max-w-sm">
          <span className="label-text mb-2 font-semibold">{t("Pengajuan")}</span>
          {submissionOptions.length > 0 ? (
            <select
              className="select select-bordered rounded-md bg-white"
              value={pengajuanId}
              onChange={(event) => setPengajuanId(event.target.value)}
            >
              <option value="">{t("chooseSubmission")}</option>
              {submissionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="input input-bordered rounded-md bg-white"
              value={pengajuanId}
              onChange={(event) => setPengajuanId(event.target.value)}
              placeholder={t("example101")}
            />
          )}
        </label>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <label className="form-control max-w-sm">
        <span className="label-text mb-2 font-semibold">{t("Pengajuan")}</span>
        {submissionOptions.length > 0 ? (
          <select
            className="select select-bordered rounded-md bg-white"
            value={pengajuanId}
            onChange={(event) => setPengajuanId(event.target.value)}
          >
            <option value="">{t("chooseSubmission")}</option>
            {submissionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="input input-bordered rounded-md bg-white"
            value={pengajuanId}
            onChange={(event) => setPengajuanId(event.target.value)}
          />
        )}
      </label>
      <ResourcePage
        title="Investasi Pengajuan"
        description="Investasi yang tercatat untuk pengajuan bisnis tertentu."
        config={investmentByPengajuanConfig(pengajuanId)}
        columns={investmentColumns}
        readonly
        emptyTitle="Belum ada investasi untuk pengajuan ini"
        emptyDescription="Investasi akan muncul setelah investor menyelesaikan pembayaran untuk pengajuan yang dipilih."
      />
    </div>
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
      emptyTitle="Belum ada distribusi profit"
      emptyDescription="Distribusi profit akan muncul setelah laporan penjualan dan investasi tersedia."
      searchableFields={["periode", "status", "nominal_profit", (item) => readPath(item, ["penjualan.nama_bisnis", "bisnis"])]}
    />
  );
}

export function ProfitsBySalesPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isUmkm = user?.role === "umkm";
  const [penjualanId, setPenjualanId] = useState("");
  const salesQuery = useQuery({
    queryKey: ["profit-sales-options"],
    queryFn: () => resourceApi.list(salesConfig),
    enabled: !isUmkm,
    retry: false,
  });
  const salesOptions = asOptions(salesQuery.data ?? [], ["periode", "pengajuans_id"]);

  if (!penjualanId.trim()) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral">{t("Profit Penjualan")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
            {t("profitBySalesPrompt")}
          </p>
        </div>
        <label className="form-control max-w-sm">
          <span className="label-text mb-2 font-semibold">{t("Penjualan")}</span>
          {salesOptions.length > 0 ? (
            <select
              className="select select-bordered rounded-md bg-white"
              value={penjualanId}
              onChange={(event) => setPenjualanId(event.target.value)}
            >
              <option value="">{t("chooseSalesReport")}</option>
              {salesOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="input input-bordered rounded-md bg-white"
              value={penjualanId}
              onChange={(event) => setPenjualanId(event.target.value)}
              placeholder={t("example201")}
            />
          )}
        </label>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <label className="form-control max-w-sm">
        <span className="label-text mb-2 font-semibold">{t("Penjualan")}</span>
        {salesOptions.length > 0 ? (
          <select
            className="select select-bordered rounded-md bg-white"
            value={penjualanId}
            onChange={(event) => setPenjualanId(event.target.value)}
          >
            <option value="">{t("chooseSalesReport")}</option>
            {salesOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="input input-bordered rounded-md bg-white"
            value={penjualanId}
            onChange={(event) => setPenjualanId(event.target.value)}
          />
        )}
      </label>
      <ResourcePage
        title="Profit Penjualan"
        description="Distribusi profit investor berdasarkan laporan penjualan tertentu."
        config={profitBySalesConfig(penjualanId)}
        columns={profitColumns}
        readonly
        emptyTitle="Belum ada profit untuk penjualan ini"
        emptyDescription="Distribusi profit akan muncul setelah backend membuat distribusi untuk laporan yang dipilih."
      />
    </div>
  );
}

export function ClassesPage() {
  const { user } = useAuth();
  const canMutate = user?.role === "admin" || user?.role === "superadmin";

  return (
    <ResourcePage
      title="Kelas Bisnis"
      description="Kelola kelas bisnis yang dipakai sebagai sinyal risiko dan kualitas usaha."
      config={classConfig}
      columns={classColumns}
      fields={classFields}
      createLabel="Tambah Kelas"
      allowCreate={canMutate}
      allowEdit={canMutate}
      allowDelete={canMutate}
      emptyTitle="Belum ada kelas bisnis"
      emptyDescription="Kelas bisnis dipakai untuk klasifikasi risiko dan kualitas usaha."
      searchableFields={["nama_kelas", "deskripsi"]}
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
      emptyTitle="Belum ada user"
      emptyDescription="Data user platform akan muncul setelah akun UMKM atau investor terdaftar."
      searchableFields={["nama", "email", "no_telp", (item) => readPath(item, ["role.nama_role", "role_name", "role_id"])]}
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
      emptyTitle="Belum ada admin"
      emptyDescription="Akun admin operasional akan muncul di sini."
      searchableFields={["nama", "email", "no_telp", "level"]}
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
      emptyTitle="Belum ada notifikasi"
      emptyDescription="Notifikasi sistem dan aktivitas user akan muncul di sini."
      searchableFields={["title", "message", "type", "status"]}
    />
  );
}
