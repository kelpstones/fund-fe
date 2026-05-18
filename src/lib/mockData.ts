import type { AuthUser, Entity, UserRole } from "../types";

const prefix = "fundraise_mock_";

export const mockUsers: Record<UserRole, AuthUser> = {
  umkm: {
    id: 1,
    nama: "Danendra UMKM",
    email: "danen@mail.com",
    role: "umkm",
    role_id: 1,
    no_telp: "080808080809",
  },
  investor: {
    id: 2,
    nama: "Danendra Investor",
    email: "danen3@mail.com",
    role: "investor",
    role_id: 2,
    no_telp: "080808080811",
  },
  admin: {
    id: 3,
    nama: "Admin FundRaise",
    email: "john@example.com",
    role: "admin",
    level: "admin",
    no_telp: "0212341235",
  },
  superadmin: {
    id: 4,
    nama: "Superadmin FundRaise",
    email: "superadmin@fundraise.id",
    role: "superadmin",
    level: "superadmin",
    no_telp: "0212341236",
  },
};

export const mockBusinesses: Entity[] = [
  {
    id: 1,
    nama: "Kopi Nusa Rasa",
    user_id: 1,
    kelas_id: 3,
    kelas: { nama_kelas: "Growth" },
    alamat: "Bandung, Jawa Barat",
    no_telp: "081234567890",
    email: "kopinusa@mail.com",
    sektor: "Food & Beverage",
    deskripsi: "Kedai kopi lokal dengan repeat order kuat dan kanal penjualan digital.",
    created_at: "2026-03-08",
  },
  {
    id: 2,
    nama: "Batik Lestari",
    user_id: 5,
    kelas_id: 2,
    kelas: { nama_kelas: "Struggling" },
    alamat: "Solo, Jawa Tengah",
    no_telp: "081299998888",
    email: "batiklestari@mail.com",
    sektor: "Fashion",
    deskripsi: "Produsen batik rumahan dengan peluang ekspansi kanal digital.",
    created_at: "2026-02-17",
  },
  {
    id: 3,
    nama: "TaniHub Lokal",
    user_id: 6,
    kelas_id: 4,
    kelas: { nama_kelas: "Elite" },
    alamat: "Malang, Jawa Timur",
    no_telp: "081255551111",
    email: "tanihub@mail.com",
    sektor: "Agribusiness",
    deskripsi: "Aggregator komoditas sayur dengan kontrak pasokan restoran.",
    created_at: "2026-01-22",
  },
];

export const mockSubmissions: Entity[] = [
  {
    id: 101,
    bisnis_id: 1,
    bisnis: mockBusinesses[0],
    target_pendanaan: 250000000,
    total_pendanaan: 164000000,
    per_anual_return: 18,
    status: "published",
    approval_status: "approved",
    match_score: 92,
    risk_level: "Moderate",
    created_at: "2026-03-20",
  },
  {
    id: 102,
    bisnis_id: 2,
    bisnis: mockBusinesses[1],
    target_pendanaan: 120000000,
    total_pendanaan: 48000000,
    per_anual_return: 15,
    status: "draft",
    approval_status: "pending",
    match_score: 81,
    risk_level: "High",
    created_at: "2026-04-01",
  },
  {
    id: 103,
    bisnis_id: 3,
    bisnis: mockBusinesses[2],
    target_pendanaan: 400000000,
    total_pendanaan: 310000000,
    per_anual_return: 21,
    status: "published",
    approval_status: "approved",
    match_score: 88,
    risk_level: "Low",
    created_at: "2026-04-14",
  },
];

export const mockSales: Entity[] = [
  {
    id: 201,
    pengajuans_id: 101,
    periode: "Maret 2026",
    total_penjualan: 84000000,
    laba_kotor: 34000000,
    laba_bersih: 22000000,
    jumlah_transaksi: 1260,
  },
  {
    id: 202,
    pengajuans_id: 103,
    periode: "April 2026",
    total_penjualan: 132000000,
    laba_kotor: 56000000,
    laba_bersih: 39000000,
    jumlah_transaksi: 820,
  },
];

export const mockNegotiations: Entity[] = [
  {
    id: 301,
    pengajuans_id: 101,
    investor: { nama: "Aruna Capital" },
    bisnis_owner: { nama: "Kopi Nusa Rasa" },
    penawaran_nominal: 90000000,
    penawaran_return: 17,
    status: "active",
    catatan: "Butuh laporan penjualan dua bulan terakhir.",
    updated_at: "2026-04-21",
  },
  {
    id: 302,
    pengajuans_id: 103,
    investor: { nama: "Nusantara Growth Fund" },
    bisnis_owner: { nama: "TaniHub Lokal" },
    penawaran_nominal: 150000000,
    penawaran_return: 20,
    status: "deal",
    catatan: "Termin investasi disetujui.",
    updated_at: "2026-04-24",
  },
];

export const mockInvoices: Entity[] = [
  {
    id: 401,
    investor_id: 2,
    negosiasi_id: 302,
    pengajuans_id: 103,
    nominal_tagihan: 150000000,
    status: "pending",
    due_date: "2026-05-05",
  },
  {
    id: 402,
    investor_id: 2,
    negosiasi_id: 301,
    pengajuans_id: 101,
    nominal_tagihan: 90000000,
    status: "paid",
    due_date: "2026-04-25",
  },
];

export const mockInvestments: Entity[] = [
  {
    id: 501,
    investor_id: 2,
    pengajuans_id: 101,
    bisnis: "Kopi Nusa Rasa",
    nominal_investasi: 90000000,
    return_investasi: 17,
    status: "active",
    created_at: "2026-04-25",
  },
  {
    id: 502,
    investor_id: 2,
    pengajuans_id: 103,
    bisnis: "TaniHub Lokal",
    nominal_investasi: 150000000,
    return_investasi: 20,
    status: "active",
    created_at: "2026-04-26",
  },
];

export const mockProfits: Entity[] = [
  {
    id: 601,
    investasi_id: 501,
    periode: "Maret 2026",
    nominal_profit: 3740000,
    status: "pending",
    bisnis: "Kopi Nusa Rasa",
  },
  {
    id: 602,
    investasi_id: 502,
    periode: "April 2026",
    nominal_profit: 7800000,
    status: "completed",
    bisnis: "TaniHub Lokal",
  },
];

export const mockClasses: Entity[] = [
  { id: 1, nama_kelas: "Critical", deskripsi: "Bisnis butuh perbaikan fundamental." },
  { id: 2, nama_kelas: "Struggling", deskripsi: "Bisnis berjalan, namun risiko masih tinggi." },
  { id: 3, nama_kelas: "Growth", deskripsi: "Bisnis menunjukkan pertumbuhan sehat." },
  { id: 4, nama_kelas: "Elite", deskripsi: "Bisnis matang dengan performa kuat." },
];

export const mockAdmins: Entity[] = [
  {
    id: 701,
    nama: "Admin Operasional",
    email: "ops@fundraise.id",
    no_telp: "021556677",
    level: "admin",
  },
  {
    id: 702,
    nama: "Superadmin",
    email: "superadmin@fundraise.id",
    no_telp: "021889900",
    level: "superadmin",
  },
];

export const mockNotifications: Entity[] = [
  {
    id: 801,
    title: "Pengajuan baru",
    message: "Kopi Nusa Rasa mengajukan pendanaan baru.",
    status: "unread",
    created_at: "2026-04-27",
  },
  {
    id: 802,
    title: "Negosiasi disetujui",
    message: "Nusantara Growth Fund menyetujui termin investasi.",
    status: "read",
    created_at: "2026-04-25",
  },
  {
    id: 803,
    title: "Distribusi profit",
    message: "Distribusi profit April sudah tersedia.",
    status: "unread",
    created_at: "2026-04-24",
  },
];

export const fallbackMap: Record<string, Entity[]> = {
  businesses: mockBusinesses,
  submissions: mockSubmissions,
  sales: mockSales,
  negotiations: mockNegotiations,
  invoices: mockInvoices,
  investments: mockInvestments,
  profits: mockProfits,
  classes: mockClasses,
  admins: mockAdmins,
  notifications: mockNotifications,
};

const readStorage = <T extends Entity>(key: string): T[] | null => {
  try {
    const raw = localStorage.getItem(`${prefix}${key}`);
    return raw ? (JSON.parse(raw) as T[]) : null;
  } catch {
    return null;
  }
};

const writeStorage = <T extends Entity>(key: string, data: T[]) => {
  localStorage.setItem(`${prefix}${key}`, JSON.stringify(data));
};

export const getLocalList = <T extends Entity>(key: string, fallback: T[]) => {
  const stored = readStorage<T>(key);
  if (stored) return stored;
  writeStorage(key, fallback);
  return fallback;
};

export const syncLocalList = <T extends Entity>(key: string, data: T[]) => {
  writeStorage(key, data);
};

export const createLocal = <T extends Entity>(
  key: string,
  fallback: T[],
  values: Partial<T>,
) => {
  const list = getLocalList<T>(key, fallback);
  const item = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    ...values,
  } as unknown as T;
  const next = [item, ...list];
  writeStorage(key, next);
  return item;
};

export const updateLocal = <T extends Entity>(
  key: string,
  fallback: T[],
  item: T,
) => {
  const list = getLocalList<T>(key, fallback);
  const next = list.map((current) => (current.id === item.id ? item : current));
  writeStorage(key, next);
  return item;
};

export const removeLocal = <T extends Entity>(
  key: string,
  fallback: T[],
  item: T,
) => {
  const list = getLocalList<T>(key, fallback);
  const next = list.filter((current) => current.id !== item.id);
  writeStorage(key, next);
  return item;
};
