import type { Entity, ResourceConfig } from "../types";

const asObject = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const emptyFallback: Entity[] = [];

const normalizeFundingPlan = (value: unknown) => {
  if (!Array.isArray(value)) {
    throw new Error("Rencana penggunaan dana harus berupa array.");
  }

  const normalized = value
    .map((item) => {
      const objectItem = asObject(item);
      const kategori = String(
        objectItem.kategori ??
          objectItem.category ??
          objectItem.label ??
          "",
      ).trim();
      const jumlahRaw = Number(objectItem.jumlah ?? objectItem.amount ?? 0);
      if (!kategori || !Number.isFinite(jumlahRaw) || jumlahRaw <= 0) return null;
      return { kategori, jumlah: Math.round(jumlahRaw) };
    })
    .filter((item): item is { kategori: string; jumlah: number } => Boolean(item));

  if (normalized.length === 0) {
    throw new Error("Rencana penggunaan dana minimal berisi satu item valid.");
  }

  return normalized;
};

const toFundingPlan = (value: unknown) => {
  if (Array.isArray(value)) return normalizeFundingPlan(value);
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return normalizeFundingPlan(parsed);
  } catch {
    throw new Error(
      "Format rencana penggunaan dana tidak valid. Gunakan JSON array, contoh: [{\"kategori\":\"Marketing\",\"jumlah\":10000000}]",
    );
  }
};

export const businessConfig: ResourceConfig<Entity> = {
  key: "businesses",
  listPath: "/businesses?page=1&limit=50",
  createPath: "/businesses",
  updatePath: "/businesses/:id",
  deletePath: "/businesses/:id",
  detailPath: "/businesses/:id",
  createBody: (values) => ({
    nama: values.nama_bisnis ?? values.nama,
    tipe_usaha: values.tipe_usaha,
    alamat: values.alamat,
    no_telp: values.no_telp,
    email: values.email,
    kelas_id: values.kelas_id,
    deskripsi: values.deskripsi,
  }),
  updateBody: (item) => ({
    nama: item.nama_bisnis ?? item.nama,
    tipe_usaha: item.tipe_usaha,
    alamat: item.alamat,
    no_telp: item.no_telp,
    email: item.email,
    kelas_id: item.kelas_id ?? asObject(item.kelas).id,
    deskripsi: item.deskripsi,
  }),
  searchableFields: [
    "nama_bisnis",
    "nama",
    "tipe_usaha",
    "email",
    "no_telp",
    "alamat",
    "deskripsi",
    "kelas.nama_kelas",
  ],
  fallback: emptyFallback,
};

export const myBusinessConfig: ResourceConfig<Entity> = {
  ...businessConfig,
  key: "my-businesses",
  listPath: "/businesses/user",
};

export const adminBusinessConfig: ResourceConfig<Entity> = {
  ...businessConfig,
  key: "admin-businesses",
  listPath: "/businesses/all?page=1&limit=50",
  detailPath: "/businesses/:id",
  deletePath: "/businesses/:id",
};

export const submissionConfig: ResourceConfig<Entity> = {
  key: "submissions",
  listPath: "/businesses/proposals?page=1&limit=50",
  createPath: "/businesses/proposals",
  updatePath: "/businesses/proposals/:id",
  deletePath: "/businesses/proposals/:id",
  createBody: (values) => ({
    bisnis_id: values.bisnis_id,
    target_pendanaan: values.target_pendanaan,
    per_anual_return: values.per_anual_return,
    deskripsi_peluang: values.deskripsi_peluang,
    rencana_penggunaan_dana: toFundingPlan(values.rencana_penggunaan_dana),
  }),
  updateBody: (item) => ({
    target_pendanaan: item.target_pendanaan,
    total_pendanaan: item.total_pendanaan,
    per_anual_return: item.per_anual_return,
    deskripsi_peluang: item.deskripsi_peluang,
    rencana_penggunaan_dana: toFundingPlan(item.rencana_penggunaan_dana),
  }),
  searchableFields: [
    "id",
    "bisnis_id",
    "bisnis.nama_bisnis",
    "bisnis.nama",
    "bisnis_nama",
    "target_pendanaan",
    "total_pendanaan",
    "per_anual_return",
    "deskripsi_peluang",
    "status",
    "approval.status",
    "approval_status",
    "approval.catatan",
    "approval_catatan",
    "catatan",
  ],
  fallback: emptyFallback,
};

export const publishedSubmissionConfig: ResourceConfig<Entity> = {
  ...submissionConfig,
  key: "published-submissions",
  listPath: "/businesses/proposals?page=1&limit=50&status=published",
};

export const salesConfig: ResourceConfig<Entity> = {
  key: "sales",
  listPath: "/businesses/proposals/sales?page=1&limit=50",
  createPath: "/businesses/proposals/sales",
  updatePath: "/businesses/proposals/sales/:id",
  detailPath: "/businesses/proposals/sales/:id",
  searchableFields: [
    "periode",
    "pengajuans_id",
    "pengajuan.id",
    "total_penjualan",
    "laba_kotor",
    "laba_bersih",
    "jumlah_transaksi",
    "status",
    "nama_dokumen",
  ],
  fallback: emptyFallback,
};

export const salesByPengajuanConfig = (pengajuansId: string): ResourceConfig<Entity> => ({
  ...salesConfig,
  key: `sales-pengajuan-${pengajuansId}`,
  listPath: `/businesses/proposals/sales/sales-by-pengajuan/${encodeURIComponent(pengajuansId)}`,
  notFoundIsEmpty: true,
});

export const negotiationConfig: ResourceConfig<Entity> = {
  key: "negotiations",
  listPath: "/businesses/proposals/negotiations",
  createPath: "/businesses/proposals/negotiations/start",
  updatePath: (item) => `/businesses/proposals/negotiations/reply/${item.id}`,
  updateMethod: "POST",
  detailPath: (item) =>
    `/businesses/proposals/negotiations/${item.pengajuans_id || asObject(item.pengajuan).id || item.id}`,
  createBody: (values) => ({
    pengajuans_id: values.pengajuans_id,
    penawaran_return: values.penawaran_return,
    penawaran_nominal: values.penawaran_nominal,
    catatan: values.catatan,
  }),
  updateBody: (item) => {
    const last = asObject(item.negosiasi_terakhir);
    return {
      penawaran_return: item.penawaran_return ?? last.penawaran_return,
      penawaran_nominal: item.penawaran_nominal ?? last.penawaran_nominal,
      catatan: item.catatan ?? last.catatan,
    };
  },
  searchableFields: [
    "status",
    "catatan",
    "pengajuans_id",
    "pengajuan.id",
    "detail_pengajuan.id",
    "bisnis.nama",
    "bisnis.nama_bisnis",
    "investor.nama",
    "negosiasi_terakhir.catatan",
    "negosiasi_terakhir.penawaran_nominal",
    "negosiasi_terakhir.penawaran_return",
  ],
  fallback: emptyFallback,
};

export const myNegotiationConfig: ResourceConfig<Entity> = {
  ...negotiationConfig,
  key: "my-negotiations",
  listPath: "/businesses/proposals/negotiations/user",
  notFoundIsEmpty: true,
};

export const invoiceConfig: ResourceConfig<Entity> = {
  key: "invoices",
  listPath: "/invoices",
  updatePath: (item) => `/invoices/${item.id}/pay`,
  detailPath: "/invoices/:id",
  searchableFields: [
    "kode_pembayaran",
    "status",
    "invoice_status",
    "total_nominal",
    "nominal_tagihan",
    "pengajuan.bisnis.nama_bisnis",
    "bisnis.nama_bisnis",
    "bisnis",
  ],
  fallback: emptyFallback,
};

export const investorInvoiceConfig: ResourceConfig<Entity> = {
  ...invoiceConfig,
  listPath: "/invoices/investor",
};

export const investmentConfig: ResourceConfig<Entity> = {
  key: "investments",
  listPath: "/investasi",
  detailPath: "/investasi/:id",
  searchableFields: [
    "status",
    "nominal_investasi",
    "return_investasi",
    "pengajuans_id",
    "pengajuan.id",
    "bisnis.nama_bisnis",
    "pengajuan.bisnis.nama",
    "bisnis",
  ],
  fallback: emptyFallback,
};

export const investmentByPengajuanConfig = (pengajuansId: string): ResourceConfig<Entity> => ({
  ...investmentConfig,
  key: `investments-pengajuan-${pengajuansId}`,
  listPath: `/investasi/proposals?pengajuans_id=${encodeURIComponent(pengajuansId)}&page=1&limit=200`,
  detailPath: undefined,
});

export const investorInvestmentConfig: ResourceConfig<Entity> = {
  ...investmentConfig,
  listPath: "/investasi/investor",
  detailPath: undefined,
};

export const profitConfig: ResourceConfig<Entity> = {
  key: "profits",
  listPath: "/profit-distributions",
  updatePath: "/profit-distributions/:id/status",
  detailPath: "/profit-distributions/:id",
  updateBody: (item) => ({ status: item.status }),
  searchableFields: [
    "periode",
    "status",
    "nominal_profit",
    "penjualans_id",
    "penjualan.id",
    "penjualan.nama_bisnis",
    "bisnis",
    "investasi.id",
    "investasi_id",
  ],
  fallback: emptyFallback,
};

export const investorProfitConfig: ResourceConfig<Entity> = {
  ...profitConfig,
  listPath: "/profit-distributions/investor",
};

export const profitBySalesConfig = (penjualansId: string): ResourceConfig<Entity> => ({
  ...profitConfig,
  key: `profits-penjualan-${penjualansId}`,
  listPath: `/profit-distributions/sales?penjualans_id=${encodeURIComponent(penjualansId)}&page=1&limit=200`,
  detailPath: undefined,
  notFoundIsEmpty: true,
});

export const classConfig: ResourceConfig<Entity> = {
  key: "classes",
  listPath: "/businesses/classes?page=1&limit=50",
  createPath: "/businesses/classes",
  updatePath: "/businesses/classes/:id",
  deletePath: "/businesses/classes/:id",
  detailPath: "/businesses/classes/:id",
  searchableFields: ["nama_kelas", "deskripsi"],
  fallback: emptyFallback,
};

export const userClassConfig: ResourceConfig<Entity> = {
  ...classConfig,
  key: "user-classes",
};

export const adminConfig: ResourceConfig<Entity> = {
  key: "admins",
  listPath: "/admin?page=1&limit=50",
  createPath: "/admin",
  updatePath: "/admin/:id",
  deletePath: "/admin/:id",
  detailPath: "/admin/:id",
  searchableFields: ["nama", "email", "no_telp", "level"],
  fallback: emptyFallback,
};

export const userManagementConfig: ResourceConfig<Entity> = {
  key: "users",
  listPath: "/user/users?page=1&limit=50",
  updatePath: "/user/:id",
  detailPath: "/user/:id",
  searchableFields: [
    "nama",
    "email",
    "no_telp",
    "role.nama_role",
    "role_name",
    "role_id",
    "level",
  ],
  fallback: emptyFallback,
  updateBody: (item) => ({
    nama: item.nama,
    email: item.email,
    no_telp: item.no_telp,
  }),
};

export const notificationConfig: ResourceConfig<Entity> = {
  key: "notifications",
  listPath: "/notifications",
  updatePath: "/notifications/:id",
  deletePath: "/notifications/:id",
  searchableFields: [
    "title",
    "message",
    "type",
    "notification_type",
    "related_entity",
    "status",
  ],
  fallback: emptyFallback,
};

export const supportedBankPublicConfig: ResourceConfig<Entity> = {
  key: "supported-banks-public",
  listPath: "/banks",
  searchableFields: ["code", "name", "type"],
  fallback: emptyFallback,
};

export const adminBankConfig: ResourceConfig<Entity> = {
  key: "admin-banks",
  listPath: "/admin/banks?page=1&limit=50",
  createPath: "/admin/banks",
  updatePath: "/admin/banks/:id",
  deletePath: "/admin/banks/:id",
  detailPath: "/admin/banks/:id",
  fallback: emptyFallback,
  createBody: (values) => ({
    code: String(values.code ?? "").toUpperCase(),
    name: values.name,
    type: values.type,
    is_active: values.is_active !== "false",
    logo_url: values.logo_url || null,
  }),
  updateBody: (item) => ({
    code: String(item.code ?? "").toUpperCase(),
    name: item.name,
    type: item.type,
    is_active: item.is_active !== "false" && item.is_active !== false,
    logo_url: item.logo_url || null,
  }),
  searchableFields: ["code", "name", "type", "is_active"],
};

export const userBankAccountConfig: ResourceConfig<Entity> = {
  key: "user-bank-accounts",
  listPath: "/user/profile/bank-accounts",
  createPath: "/user/profile/bank-accounts",
  deletePath: "/user/profile/bank-accounts/:id",
  searchableFields: [
    "bank.name",
    "bank.code",
    "bank.type",
    "bank_account_number",
    "bank_account_holder",
    "is_primary",
  ],
  fallback: emptyFallback,
  createBody: (values) => ({
    bank_id: Number(values.bank_id),
    bank_account_number: values.bank_account_number,
    bank_account_holder: values.bank_account_holder,
    is_primary: values.is_primary,
  }),
};

export const adminWithdrawalConfig: ResourceConfig<Entity> = {
  key: "admin-withdrawals",
  listPath: "/wallet/withdrawals?page=1&limit=50",
  searchableFields: [
    "status",
    "amount",
    "nominal",
    "user.nama",
    "user.email",
    "bank_account.bank.name",
    "bank_account.bank_account_number",
  ],
  fallback: emptyFallback,
};
