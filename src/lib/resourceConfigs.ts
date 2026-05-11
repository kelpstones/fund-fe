import type { Entity, ResourceConfig } from "../types";
import {
  mockAdmins,
  mockBusinesses,
  mockClasses,
  mockInvoices,
  mockInvestments,
  mockNegotiations,
  mockNotifications,
  mockProfits,
  mockSales,
  mockSubmissions,
  mockUsers,
} from "./mockData";

const asObject = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

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
  fallback: mockBusinesses,
};

export const myBusinessConfig: ResourceConfig<Entity> = {
  ...businessConfig,
  key: "my-businesses",
  listPath: "/businesses/user",
};

export const adminBusinessConfig: ResourceConfig<Entity> = {
  ...businessConfig,
  key: "admin-businesses",
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
  }),
  updateBody: (item) => ({
    target_pendanaan: item.target_pendanaan,
    total_pendanaan: item.total_pendanaan,
    per_anual_return: item.per_anual_return,
  }),
  fallback: mockSubmissions,
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
  fallback: mockSales,
};

export const salesByPengajuanConfig = (pengajuansId: string): ResourceConfig<Entity> => ({
  ...salesConfig,
  key: `sales-pengajuan-${pengajuansId}`,
  listPath: `/businesses/proposals/sales/pengajuan?pengajuans_id=${encodeURIComponent(pengajuansId)}`,
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
  fallback: mockNegotiations,
};

export const myNegotiationConfig: ResourceConfig<Entity> = {
  ...negotiationConfig,
  key: "my-negotiations",
  listPath: "/businesses/proposals/negotiations/user",
};

export const invoiceConfig: ResourceConfig<Entity> = {
  key: "invoices",
  listPath: "/invoices",
  updatePath: (item) => `/invoices/${item.id}/pay`,
  detailPath: "/invoices/:id",
  fallback: mockInvoices,
};

export const investorInvoiceConfig: ResourceConfig<Entity> = {
  ...invoiceConfig,
  listPath: "/invoices/investor",
};

export const investmentConfig: ResourceConfig<Entity> = {
  key: "investments",
  listPath: "/investasi",
  detailPath: "/investasi/:id",
  fallback: mockInvestments,
};

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
  fallback: mockProfits,
};

export const investorProfitConfig: ResourceConfig<Entity> = {
  ...profitConfig,
  listPath: "/profit-distributions/investor",
};

export const classConfig: ResourceConfig<Entity> = {
  key: "classes",
  listPath: "/businesses/classes?page=1&limit=50",
  createPath: "/businesses/classes",
  updatePath: "/businesses/classes/:id",
  deletePath: "/businesses/classes/:id",
  detailPath: "/businesses/classes/:id",
  fallback: mockClasses,
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
  fallback: mockAdmins,
};

export const userManagementConfig: ResourceConfig<Entity> = {
  key: "users",
  listPath: "/user/users?page=1&limit=50",
  fallback: Object.values(mockUsers),
};

export const notificationConfig: ResourceConfig<Entity> = {
  key: "notifications",
  listPath: "/notifications",
  updatePath: "/notifications/:id",
  deletePath: "/notifications/:id",
  fallback: mockNotifications,
};
