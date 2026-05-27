import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Wallet } from "lucide-react";
import { DashboardBreadcrumb } from "../../components/DashboardBreadcrumb";
import { ResourcePage } from "../../components/ResourcePage";
import { useToast } from "../../components/ToastProvider";
import { apiClient, unwrap } from "../../lib/api/client";
import { resourceApi } from "../../lib/api/resources";
import { useLanguage, type Language } from "../../lib/i18n/LanguageProvider";
import {
  adminBankConfig,
  adminWithdrawalConfig,
  supportedBankPublicConfig,
  userBankAccountConfig,
} from "../../lib/resourceConfigs";
import { currency, dateShort, readPath, statusTone, textValue } from "../../lib/format";
import type { Entity, ResourceAction, ResourceColumn, ResourceField } from "../../types";

const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return String(error.response.data.message);
  }
  return fallback;
};

type WalletDashboard = {
  saldo: number;
  transactions: Entity[];
};

type WalletForm = {
  jumlah: string;
};

type WithdrawForm = WalletForm & {
  user_bank_account_id: string;
};

const walletInvestorCopy: Record<
  Language,
  {
    pageTitle: string;
    pageBody: string;
    walletBalance: string;
    transactionsRecorded: (count: number) => string;
    activeAccounts: string;
    activeAccountsBody: string;
    topupTitle: string;
    amountLabel: string;
    createTopupInvoice: string;
    mockTopup: string;
    topupSuccess: string;
    topupError: string;
    withdrawTitle: string;
    destinationAccount: string;
    usePrimaryAccount: string;
    primaryAccountTag: string;
    submitWithdrawal: string;
    withdrawSuccess: string;
    withdrawError: string;
    historyTitle: string;
    tableId: string;
    tableType: string;
    tableAmount: string;
    tableStatus: string;
    tableDate: string;
    tableDescription: string;
    tableLoading: string;
    tableLoadError: string;
    tableEmpty: string;
    mockTopupSuccess: string;
  }
> = {
  id: {
    pageTitle: "Dompet Investor",
    pageBody:
      "Kelola saldo untuk top up, penarikan dana, dan pembayaran invoice investasi.",
    walletBalance: "Saldo Dompet",
    transactionsRecorded: (count) => `${count} transaksi tercatat`,
    activeAccounts: "Rekening Aktif",
    activeAccountsBody: "Kelola rekening di menu Rekening",
    topupTitle: "Top Up Saldo",
    amountLabel: "Nominal",
    createTopupInvoice: "Buat Invoice Top Up",
    mockTopup: "Mock Top Up",
    topupSuccess: "Permintaan top up berhasil dibuat.",
    topupError: "Top up gagal diproses.",
    withdrawTitle: "Tarik Dana",
    destinationAccount: "Rekening Tujuan",
    usePrimaryAccount: "Gunakan rekening utama",
    primaryAccountTag: "Utama",
    submitWithdrawal: "Ajukan Penarikan",
    withdrawSuccess: "Permintaan penarikan dana berhasil diajukan.",
    withdrawError: "Penarikan dana gagal diproses.",
    historyTitle: "Riwayat Transaksi",
    tableId: "ID",
    tableType: "Tipe",
    tableAmount: "Nominal",
    tableStatus: "Status",
    tableDate: "Tanggal",
    tableDescription: "Deskripsi",
    tableLoading: "Memuat transaksi...",
    tableLoadError: "Gagal memuat data dompet.",
    tableEmpty: "Belum ada transaksi.",
    mockTopupSuccess: "Mock top up berhasil.",
  },
  en: {
    pageTitle: "Investor Wallet",
    pageBody:
      "Manage balance for top up, withdrawals, and investment invoice payments.",
    walletBalance: "Wallet Balance",
    transactionsRecorded: (count) => `${count} transactions recorded`,
    activeAccounts: "Active Accounts",
    activeAccountsBody: "Manage accounts in Bank Accounts menu",
    topupTitle: "Top Up Balance",
    amountLabel: "Amount",
    createTopupInvoice: "Create Top Up Invoice",
    mockTopup: "Mock Top Up",
    topupSuccess: "Top up request has been created.",
    topupError: "Top up request failed.",
    withdrawTitle: "Withdraw Funds",
    destinationAccount: "Destination Account",
    usePrimaryAccount: "Use primary account",
    primaryAccountTag: "Primary",
    submitWithdrawal: "Submit Withdrawal",
    withdrawSuccess: "Withdrawal request has been submitted.",
    withdrawError: "Withdrawal request failed.",
    historyTitle: "Transaction History",
    tableId: "ID",
    tableType: "Type",
    tableAmount: "Amount",
    tableStatus: "Status",
    tableDate: "Date",
    tableDescription: "Description",
    tableLoading: "Loading transactions...",
    tableLoadError: "Failed to load wallet data.",
    tableEmpty: "No transactions yet.",
    mockTopupSuccess: "Mock top up completed.",
  },
};

export function InvestorWalletPage() {
  const { language } = useLanguage();
  const copy = walletInvestorCopy[language];
  const toast = useToast();
  const queryClient = useQueryClient();
  const [topupForm, setTopupForm] = useState<WalletForm>({ jumlah: "100000" });
  const [withdrawForm, setWithdrawForm] = useState<WithdrawForm>({
    jumlah: "50000",
    user_bank_account_id: "",
  });

  const walletQuery = useQuery({
    queryKey: ["wallet-dashboard"],
    queryFn: async (): Promise<WalletDashboard> => {
      const response = await apiClient.get("/wallet/dashboard?page=1&limit=50");
      const payload = unwrap<Record<string, unknown>>(response.data);
      return {
        saldo: Number(payload.saldo ?? 0),
        transactions: Array.isArray(payload.data) ? (payload.data as Entity[]) : [],
      };
    },
  });

  const bankAccountsQuery = useQuery({
    queryKey: ["wallet-bank-accounts"],
    queryFn: () => resourceApi.list(userBankAccountConfig),
    retry: false,
  });

  const topUpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/wallet/topup", {
        jumlah: Number(topupForm.jumlah),
      });
      return unwrap<Record<string, unknown>>(response.data);
    },
    onSuccess: async (data) => {
      const paymentUrl = textValue(data.payment_url);
      toast.success(copy.topupSuccess);
      if (paymentUrl && paymentUrl !== "-") {
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
      }
      await queryClient.invalidateQueries({ queryKey: ["wallet-dashboard"] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, copy.topupError));
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        jumlah: Number(withdrawForm.jumlah),
      };
      if (withdrawForm.user_bank_account_id) {
        payload.user_bank_account_id = Number(withdrawForm.user_bank_account_id);
      }
      const response = await apiClient.post("/wallet/withdraw", payload);
      return unwrap(response.data);
    },
    onSuccess: async () => {
      toast.success(copy.withdrawSuccess);
      await queryClient.invalidateQueries({ queryKey: ["wallet-dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["wallet-bank-accounts"] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, copy.withdrawError));
    },
  });

  const mockTopUpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/wallet/mock-topup", { jumlah: 1000000 });
      return unwrap(response.data);
    },
    onSuccess: async () => {
      toast.success(copy.mockTopupSuccess);
      await queryClient.invalidateQueries({ queryKey: ["wallet-dashboard"] });
    },
    onError: () => undefined,
  });

  const transactions = walletQuery.data?.transactions ?? [];
  const saldo = walletQuery.data?.saldo ?? 0;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black tracking-normal text-neutral">{copy.pageTitle}</h2>
        <DashboardBreadcrumb />
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
          {copy.pageBody}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-md border border-base-300 bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-sm font-semibold text-neutral/55">{copy.walletBalance}</p>
          <p className="mt-2 text-3xl font-black">{currency(saldo)}</p>
          <p className="mt-2 text-xs font-semibold text-neutral/45">
            {copy.transactionsRecorded(transactions.length)}
          </p>
        </article>
        <article className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral/55">{copy.activeAccounts}</p>
          <p className="mt-2 text-3xl font-black">{bankAccountsQuery.data?.length ?? 0}</p>
          <p className="mt-2 text-xs font-semibold text-neutral/45">
            {copy.activeAccountsBody}
          </p>
        </article>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form
          className="rounded-md border border-base-300 bg-white p-5 shadow-sm"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            topUpMutation.mutate();
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <ArrowUpCircle size={18} />
            <h3 className="text-lg font-black">{copy.topupTitle}</h3>
          </div>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">{copy.amountLabel}</span>
            <input
              className="input input-bordered rounded-md"
              type="number"
              min={10000}
              step={1000}
              value={topupForm.jumlah}
              onChange={(event) =>
                setTopupForm((current) => ({ ...current, jumlah: event.target.value }))
              }
              required
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className="btn btn-primary rounded-md text-white"
              type="submit"
              disabled={topUpMutation.isPending}
            >
              {topUpMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Wallet size={18} />}
              {copy.createTopupInvoice}
            </button>
            <button
              className="btn btn-outline rounded-md"
              type="button"
              onClick={() => mockTopUpMutation.mutate()}
              disabled={mockTopUpMutation.isPending}
            >
              {mockTopUpMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : null}
              {copy.mockTopup}
            </button>
          </div>
        </form>

        <form
          className="rounded-md border border-base-300 bg-white p-5 shadow-sm"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            withdrawMutation.mutate();
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <ArrowDownCircle size={18} />
            <h3 className="text-lg font-black">{copy.withdrawTitle}</h3>
          </div>
          <label className="form-control">
            <span className="label-text mb-2 font-semibold">{copy.amountLabel}</span>
            <input
              className="input input-bordered rounded-md"
              type="number"
              min={50000}
              step={1000}
              value={withdrawForm.jumlah}
              onChange={(event) =>
                setWithdrawForm((current) => ({ ...current, jumlah: event.target.value }))
              }
              required
            />
          </label>
          <label className="form-control mt-4">
            <span className="label-text mb-2 font-semibold">{copy.destinationAccount}</span>
            <select
              className="select select-bordered rounded-md"
              value={withdrawForm.user_bank_account_id}
              onChange={(event) =>
                setWithdrawForm((current) => ({
                  ...current,
                  user_bank_account_id: event.target.value,
                }))
              }
            >
              <option value="">{copy.usePrimaryAccount}</option>
              {(bankAccountsQuery.data ?? []).map((account) => (
                <option key={String(account.id)} value={String(account.id)}>
                  {textValue(account.bank_name)} - {textValue(account.bank_account_number)}
                  {account.is_primary ? ` (${copy.primaryAccountTag})` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-5">
            <button
              className="btn btn-primary rounded-md text-white"
              type="submit"
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Wallet size={18} />}
              {copy.submitWithdrawal}
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-md border border-base-300 bg-white shadow-sm">
        <div className="border-b border-base-300 px-5 py-4">
          <h3 className="text-lg font-black">{copy.historyTitle}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="bg-base-200 text-xs uppercase tracking-wide text-neutral/60">
                <th>{copy.tableId}</th>
                <th>{copy.tableType}</th>
                <th>{copy.tableAmount}</th>
                <th>{copy.tableStatus}</th>
                <th>{copy.tableDate}</th>
                <th>{copy.tableDescription}</th>
              </tr>
            </thead>
            <tbody>
              {walletQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral/55">
                    {copy.tableLoading}
                  </td>
                </tr>
              ) : walletQuery.isError ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-error">
                    {apiErrorMessage(walletQuery.error, copy.tableLoadError)}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral/55">
                    {copy.tableEmpty}
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={String(item.id)}>
                    <td>#{textValue(item.id)}</td>
                    <td className="font-semibold">{textValue(item.tipe)}</td>
                    <td>{currency(item.jumlah)}</td>
                    <td>
                      <span className={`badge ${statusTone(item.status)}`}>{textValue(item.status)}</span>
                    </td>
                    <td>{dateShort(item.created_at)}</td>
                    <td className="max-w-sm">{textValue(item.deskripsi)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const bankAccountColumns: ResourceColumn<Entity>[] = [
  {
    label: "Bank",
    render: (item) => (
      <div>
        <p className="font-black">{textValue(item.bank_name || item.name)}</p>
        <p className="mt-1 text-xs font-semibold text-neutral/55">
          {textValue(item.bank_code)} · {textValue(item.bank_type)}
        </p>
      </div>
    ),
  },
  {
    label: "No. Rekening",
    render: (item) => (
      <div>
        <p className="font-semibold">{textValue(item.bank_account_number)}</p>
        <p className="mt-1 text-xs text-neutral/55">{textValue(item.bank_account_holder)}</p>
      </div>
    ),
  },
  {
    label: "Primary",
    render: (item) =>
      item.is_primary ? (
        <span className="badge badge-success text-white">Utama</span>
      ) : (
        <span className="badge badge-outline">Cadangan</span>
      ),
  },
];

export function InvestorBankAccountsPage() {
  const banksQuery = useQuery({
    queryKey: ["supported-banks-public"],
    queryFn: () => resourceApi.list(supportedBankPublicConfig),
    retry: false,
  });

  const fields = useMemo<ResourceField<Entity>[]>(
    () => [
      {
        name: "bank_id",
        label: "Bank",
        type: "select",
        required: true,
        options: (banksQuery.data ?? []).map((bank) => ({
          value: Number(bank.id),
          label: `${textValue(bank.code)} - ${textValue(bank.name)}`,
        })),
      },
      {
        name: "bank_account_number",
        label: "No. Rekening",
        required: true,
      },
      {
        name: "bank_account_holder",
        label: "Nama Pemilik",
        required: true,
      },
    ],
    [banksQuery.data],
  );

  const actions: ResourceAction<Entity>[] = [
    {
      label: "Jadikan Utama",
      method: "PUT",
      path: (item) => `/user/profile/bank-accounts/${item.id}/primary`,
      className: "btn btn-outline btn-xs rounded-md",
      isVisible: (item) => !item.is_primary,
      confirm: "Set rekening ini sebagai rekening utama?",
    },
  ];

  return (
    <ResourcePage
      title="Rekening Investor"
      description="Kelola rekening bank atau e-wallet tujuan penarikan dana dompet."
      config={userBankAccountConfig}
      columns={bankAccountColumns}
      fields={fields}
      createLabel="Tambah Rekening"
      actions={actions}
      allowCreate
      allowEdit={false}
      allowDelete
      emptyTitle="Belum ada rekening terdaftar"
      emptyDescription="Tambahkan minimal satu rekening untuk proses penarikan dana dompet."
      searchableFields={["bank_name", "bank_account_number", "bank_account_holder", "bank_code"]}
    />
  );
}

const withdrawalColumns: ResourceColumn<Entity>[] = [
  { label: "ID", render: (item) => <span className="font-black">#{textValue(item.id)}</span> },
  {
    label: "Investor",
    render: (item) => (
      <div>
        <p className="font-black">{textValue(readPath(item, ["user.nama", "nama_user"]))}</p>
        <p className="mt-1 text-xs text-neutral/55">{textValue(readPath(item, ["user.email", "email_user"]))}</p>
      </div>
    ),
  },
  { label: "Nominal", render: (item) => currency(item.jumlah) },
  { label: "Rekening", render: (item) => `${textValue(item.bank_name)} - ${textValue(item.bank_account_number)}` },
  { label: "Status", render: (item) => <span className={`badge ${statusTone(item.status)}`}>{textValue(item.status)}</span> },
  { label: "Tanggal", render: (item) => dateShort(item.created_at) },
];

const withdrawalActions: ResourceAction<Entity>[] = [
  {
    label: "Approve",
    method: "PUT",
    path: (item) => `/wallet/withdrawals/${item.id}/status`,
    body: { status: "completed" },
    className: "btn btn-success btn-xs rounded-md text-white",
    isVisible: (item) => String(item.status).toLowerCase() === "pending",
    confirm: "Setujui penarikan dana ini?",
  },
  {
    label: "Reject",
    method: "PUT",
    path: (item) => `/wallet/withdrawals/${item.id}/status`,
    body: { status: "failed", alasan: "Ditolak admin" },
    className: "btn btn-error btn-xs rounded-md text-white",
    isVisible: (item) => String(item.status).toLowerCase() === "pending",
    confirm: "Tolak penarikan dana ini?",
  },
];

export function AdminWithdrawalsPage() {
  return (
    <ResourcePage
      title="Withdrawal Queue"
      description="Review dan proses permintaan penarikan dana investor."
      config={adminWithdrawalConfig}
      columns={withdrawalColumns}
      actions={withdrawalActions}
      readonly
      allowCreate={false}
      allowEdit={false}
      allowDelete={false}
      emptyTitle="Belum ada permintaan penarikan"
      emptyDescription="Permintaan penarikan investor akan muncul di sini."
      searchableFields={["status", "bank_name", "bank_account_number", "deskripsi"]}
    />
  );
}

const bankFields: ResourceField<Entity>[] = [
  { name: "code", label: "Kode", required: true },
  { name: "name", label: "Nama", required: true },
  {
    name: "type",
    label: "Tipe",
    type: "select",
    required: true,
    options: [
      { value: "bank", label: "Bank" },
      { value: "ewallet", label: "E-Wallet" },
    ],
  },
  {
    name: "is_active",
    label: "Status",
    type: "select",
    options: [
      { value: "true", label: "Aktif" },
      { value: "false", label: "Nonaktif" },
    ],
  },
  { name: "logo_url", label: "Logo URL" },
];

const bankColumns: ResourceColumn<Entity>[] = [
  {
    label: "Bank",
    render: (item) => (
      <div>
        <p className="font-black">{textValue(item.name)}</p>
        <p className="mt-1 text-xs text-neutral/55">{textValue(item.code)}</p>
      </div>
    ),
  },
  { label: "Tipe", render: (item) => textValue(item.type) },
  {
    label: "Status",
    render: (item) =>
      item.is_active ? (
        <span className="badge badge-success text-white">Aktif</span>
      ) : (
        <span className="badge badge-outline">Nonaktif</span>
      ),
  },
  { label: "Logo", render: (item) => textValue(item.logo_url, "-") },
];

export function AdminBanksPage() {
  return (
    <ResourcePage
      title="Bank & E-Wallet"
      description="Kelola daftar bank/e-wallet yang dapat dipakai investor untuk pencairan dana."
      config={adminBankConfig}
      columns={bankColumns}
      fields={bankFields}
      createLabel="Tambah Bank"
      allowCreate
      allowEdit
      allowDelete
      emptyTitle="Belum ada data bank"
      emptyDescription="Tambahkan bank atau e-wallet yang didukung platform."
      searchableFields={["code", "name", "type"]}
    />
  );
}
