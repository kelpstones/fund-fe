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

export const businessConfig: ResourceConfig<Entity> = {
  key: "businesses",
  listPath: "/bisnis?page=1&limit=50",
  createPath: "/bisnis",
  updatePath: "/bisnis/:id",
  deletePath: "/bisnis/:id",
  detailPath: "/bisnis/:id",
  fallback: mockBusinesses,
};

export const myBusinessConfig: ResourceConfig<Entity> = {
  ...businessConfig,
  key: "my-businesses",
  listPath: "/bisnis/user",
};

export const adminBusinessConfig: ResourceConfig<Entity> = {
  ...businessConfig,
  key: "admin-businesses",
  detailPath: "/user/bisnis/:id",
  deletePath: "/user/bisnis/:id",
};

export const submissionConfig: ResourceConfig<Entity> = {
  key: "submissions",
  listPath: "/bisnis/pengajuan?page=1&limit=50",
  createPath: (values) => `/bisnis/pengajuan/${values.bisnis_id || 1}`,
  updatePath: "/bisnis/pengajuan/:id",
  deletePath: "/bisnis/pengajuan/:id",
  detailPath: (item) => `/bisnis/pengajuan/${item.bisnis_id || item.id}`,
  createBody: (values) => ({
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
  listPath: "/bisnis/pengajuan?page=1&limit=50&status=published",
};

export const salesConfig: ResourceConfig<Entity> = {
  key: "sales",
  listPath: "/bisnis/pengajuan/penjualan",
  createPath: "/bisnis/pengajuan/penjualan",
  updatePath: "/bisnis/pengajuan/penjualan/:id",
  detailPath: "/bisnis/pengajuan/penjualan/:id",
  fallback: mockSales,
};

export const negotiationConfig: ResourceConfig<Entity> = {
  key: "negotiations",
  listPath: "/bisnis/pengajuan/negosiasi",
  createPath: "/bisnis/pengajuan/negosiasi/start",
  updatePath: (item) => `/bisnis/pengajuan/negosiasi/reply/${item.id}`,
  detailPath: (item) => `/bisnis/pengajuan/negosiasi/${item.pengajuans_id || item.id}`,
  fallback: mockNegotiations,
};

export const myNegotiationConfig: ResourceConfig<Entity> = {
  ...negotiationConfig,
  key: "my-negotiations",
  listPath: "/bisnis/pengajuan/negosiasi/user",
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
};

export const profitConfig: ResourceConfig<Entity> = {
  key: "profits",
  listPath: "/distribusi-profit",
  updatePath: "/distribusi-profit/:id/status",
  detailPath: "/distribusi-profit/:id",
  updateBody: (item) => ({ status: item.status }),
  fallback: mockProfits,
};

export const investorProfitConfig: ResourceConfig<Entity> = {
  ...profitConfig,
  listPath: "/distribusi-profit/investor",
};

export const classConfig: ResourceConfig<Entity> = {
  key: "classes",
  listPath: "/bisnis/kelas?page=1&limit=50",
  createPath: "/bisnis/kelas",
  updatePath: "/bisnis/kelas/:id",
  deletePath: "/bisnis/kelas/:id",
  detailPath: "/bisnis/kelas/:id",
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
  updatePath: "/user/:id",
  detailPath: "/user/:id",
  fallback: Object.values(mockUsers),
};

export const notificationConfig: ResourceConfig<Entity> = {
  key: "notifications",
  listPath: "/notifications",
  updatePath: "/notifications/:id",
  deletePath: "/notifications/:id",
  fallback: mockNotifications,
};
