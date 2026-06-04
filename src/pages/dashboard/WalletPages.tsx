import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Wallet } from "lucide-react";
import { DashboardBreadcrumb } from "../../components/DashboardBreadcrumb";
import { ResourcePage } from "../../components/ResourcePage";
import { useToast } from "../../components/ToastProvider";
import { apiClient, unwrap } from "../../lib/api/client";
import { resourceApi } from "../../lib/api/resources";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage, type Language } from "../../lib/i18n/LanguageProvider";
import {
  adminBankConfig,
  adminWithdrawalConfig,
  supportedBankPublicConfig,
  userBankAccountConfig,
} from "../../lib/resourceConfigs";
import { apiErrorMessage, currency, dateShort, readPath, statusTone, textValue } from "../../lib/format";
import type { Entity, ResourceAction, ResourceColumn, ResourceField } from "../../types";

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

const TOP_UP_MIN_AMOUNT = 10000;
const WITHDRAW_MIN_AMOUNT = 50000;

const keepDigits = (value: string) => value.replace(/\D/g, "");

const amountFromInput = (value: string) => {
  const digits = keepDigits(value);
  if (!digits) return 0;
  return Number(digits);
};

const displayAmountInput = (value: string) => {
  const amount = amountFromInput(value);
  return amount > 0 ? new Intl.NumberFormat("id-ID").format(amount) : "";
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
    withdrawalAccountsEyebrow: string;
    withdrawalAccountsTitle: string;
    topupTitle: string;
    amountLabel: string;
    amountHint: (minAmount: number) => string;
    amountPreview: (amount: number) => string;
    createTopupInvoice: string;
    topupSuccess: string;
    topupError: string;
    topupValidationError: string;
    withdrawTitle: string;
    destinationAccount: string;
    selectAccountPlaceholder: string;
    usePrimaryAccountHint: string;
    noAccountHint: string;
    addAccountCta: string;
    primaryAccountTag: string;
    submitWithdrawal: string;
    withdrawSuccess: string;
    withdrawError: string;
    withdrawValidationError: string;
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
  }
> = {
  id: {
    pageTitle: "Dompet Investor",
    pageBody:
      "Kelola saldo untuk top up, penarikan dana, dan pembayaran invoice investasi.",
    walletBalance: "Saldo Dompet",
    transactionsRecorded: (count) => `${count} transaksi tercatat`,
    activeAccounts: "Rekening Aktif",
    activeAccountsBody: "Dikelola di bagian Rekening Penarikan",
    withdrawalAccountsEyebrow: "Rekening",
    withdrawalAccountsTitle: "Rekening Penarikan",
    topupTitle: "Top Up Saldo",
    amountLabel: "Nominal",
    amountHint: (minAmount) => `Minimal ${currency(minAmount)}`,
    amountPreview: (amount) => `Estimasi nominal: ${currency(amount)}`,
    createTopupInvoice: "Buat Invoice Top Up",
    topupSuccess: "Permintaan top up berhasil dibuat.",
    topupError: "Top up gagal diproses.",
    topupValidationError: "Nominal top up belum valid.",
    withdrawTitle: "Tarik Dana",
    destinationAccount: "Rekening Tujuan",
    selectAccountPlaceholder: "Pilih rekening tujuan (opsional)",
    usePrimaryAccountHint: "Kosongkan untuk memakai rekening utama yang aktif.",
    noAccountHint: "Belum ada rekening tersimpan. Tambahkan rekening dulu agar penarikan lebih aman.",
    addAccountCta: "Tambah rekening",
    primaryAccountTag: "Utama",
    submitWithdrawal: "Ajukan Penarikan",
    withdrawSuccess: "Permintaan penarikan dana berhasil diajukan.",
    withdrawError: "Penarikan dana gagal diproses.",
    withdrawValidationError: "Nominal penarikan belum valid.",
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
  },
  en: {
    pageTitle: "Investor Wallet",
    pageBody:
      "Manage balance for top up, withdrawals, and investment invoice payments.",
    walletBalance: "Wallet Balance",
    transactionsRecorded: (count) => `${count} transactions recorded`,
    activeAccounts: "Active Accounts",
    activeAccountsBody: "Managed in Withdrawal Accounts section",
    withdrawalAccountsEyebrow: "Accounts",
    withdrawalAccountsTitle: "Withdrawal Accounts",
    topupTitle: "Top Up Balance",
    amountLabel: "Amount",
    amountHint: (minAmount) => `Minimum ${currency(minAmount)}`,
    amountPreview: (amount) => `Estimated amount: ${currency(amount)}`,
    createTopupInvoice: "Create Top Up Invoice",
    topupSuccess: "Top up request has been created.",
    topupError: "Top up request failed.",
    topupValidationError: "Top up amount is not valid.",
    withdrawTitle: "Withdraw Funds",
    destinationAccount: "Destination Account",
    selectAccountPlaceholder: "Select destination account (optional)",
    usePrimaryAccountHint: "Leave empty to use active primary account.",
    noAccountHint: "No bank account saved yet. Add one first to make withdrawals safer.",
    addAccountCta: "Add bank account",
    primaryAccountTag: "Primary",
    submitWithdrawal: "Submit Withdrawal",
    withdrawSuccess: "Withdrawal request has been submitted.",
    withdrawError: "Withdrawal request failed.",
    withdrawValidationError: "Withdrawal amount is not valid.",
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
  },
};

export function InvestorWalletPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const copy = walletInvestorCopy[language];
  const toast = useToast();
  const queryClient = useQueryClient();
  const [topupForm, setTopupForm] = useState<WalletForm>({ jumlah: "100000" });
  const [withdrawForm, setWithdrawForm] = useState<WithdrawForm>({
    jumlah: "50000",
    user_bank_account_id: "",
  });
  const topUpAmount = amountFromInput(topupForm.jumlah);
  const withdrawAmount = amountFromInput(withdrawForm.jumlah);
  const walletQueryKey = ["wallet-dashboard", user?.id ?? "guest"];
  const bankAccountsQueryKey = ["wallet-bank-accounts", user?.id ?? "guest"];

  const walletQuery = useQuery({
    queryKey: walletQueryKey,
    queryFn: async (): Promise<WalletDashboard> => {
      const response = await apiClient.get("/wallet/dashboard?page=1&limit=50");
      const payload = unwrap<Record<string, unknown>>(response.data);
      return {
        saldo: Number(payload.saldo ?? 0),
        transactions: Array.isArray(payload.data) ? (payload.data as Entity[]) : [],
      };
    },
  });

  const hasPendingTx = useMemo(() => {
    return (walletQuery.data?.transactions ?? []).some(
      (tx) => String(tx.status).toLowerCase() === "pending"
    );
  }, [walletQuery.data?.transactions]);

  // Dynamically update query options for polling
  useEffect(() => {
    if (hasPendingTx) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: walletQueryKey });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [hasPendingTx, queryClient, walletQueryKey]);

  const bankAccountsQuery = useQuery({
    queryKey: bankAccountsQueryKey,
    queryFn: () => resourceApi.list(userBankAccountConfig),
    retry: false,
  });

  const topUpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/wallet/topup", {
        jumlah: topUpAmount,
      });
      return unwrap<Record<string, unknown>>(response.data);
    },
    onSuccess: async (data) => {
      const paymentUrl = textValue(data.payment_url);
      toast.success(copy.topupSuccess);
      if (paymentUrl && paymentUrl !== "-") {
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
      }
      await queryClient.invalidateQueries({ queryKey: walletQueryKey });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, copy.topupError));
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        jumlah: withdrawAmount,
      };
      if (withdrawForm.user_bank_account_id) {
        payload.user_bank_account_id = Number(withdrawForm.user_bank_account_id);
      }
      const response = await apiClient.post("/wallet/withdraw", payload);
      return unwrap(response.data);
    },
    onSuccess: async () => {
      toast.success(copy.withdrawSuccess);
      await queryClient.invalidateQueries({ queryKey: walletQueryKey });
      await queryClient.invalidateQueries({ queryKey: bankAccountsQueryKey });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, copy.withdrawError));
    },
  });

  const transactions = walletQuery.data?.transactions ?? [];
  const saldo = walletQuery.data?.saldo ?? 0;
  const bankAccounts = bankAccountsQuery.data ?? [];
  const hasBankAccounts = bankAccounts.length > 0;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black tracking-normal text-neutral">{copy.pageTitle}</h2>
        <DashboardBreadcrumb />
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
          <p className="mt-2 text-3xl font-black">{bankAccounts.length}</p>
          <p className="mt-2 text-xs font-semibold text-neutral/45">
            {copy.activeAccountsBody}
          </p>
        </article>
      </div>

      <div
        id="rekening"
        className="scroll-mt-24 rounded-md border border-base-300 bg-white p-5 shadow-sm"
      >
        <InvestorBankAccountsManager embedded />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form
          className="rounded-md border border-base-300 bg-white p-5 shadow-sm"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (topUpAmount < TOP_UP_MIN_AMOUNT) {
              toast.error(copy.topupValidationError);
              return;
            }
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
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={displayAmountInput(topupForm.jumlah)}
                  onChange={(event) =>
                    setTopupForm((current) => ({ ...current, jumlah: keepDigits(event.target.value) }))
                  }
                  required
                />
                <span className="mt-2 text-xs font-semibold text-neutral/55">
                  {copy.amountHint(TOP_UP_MIN_AMOUNT)}
                </span>
                <span className="mt-1 text-xs font-semibold text-neutral/55">
                  {copy.amountPreview(topUpAmount)}
                </span>
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
              </div>
        </form>

        <form
          className="rounded-md border border-base-300 bg-white p-5 shadow-sm"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (withdrawAmount < WITHDRAW_MIN_AMOUNT) {
              toast.error(copy.withdrawValidationError);
              return;
            }
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
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={displayAmountInput(withdrawForm.jumlah)}
                  onChange={(event) =>
                    setWithdrawForm((current) => ({ ...current, jumlah: keepDigits(event.target.value) }))
                  }
                  required
                />
                <span className="mt-2 text-xs font-semibold text-neutral/55">
                  {copy.amountHint(WITHDRAW_MIN_AMOUNT)}
                </span>
                <span className="mt-1 text-xs font-semibold text-neutral/55">
                  {copy.amountPreview(withdrawAmount)}
                </span>
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
                  <option value="">{copy.selectAccountPlaceholder}</option>
                  {bankAccounts.map((account) => (
                    <option key={String(account.id)} value={String(account.id)}>
                      {textValue(account.bank_name)} - {textValue(account.bank_account_number)}
                      {account.is_primary ? ` (${copy.primaryAccountTag})` : ""}
                    </option>
                  ))}
                </select>
                <span className="mt-2 text-xs font-semibold text-neutral/55">
                  {copy.usePrimaryAccountHint}
                </span>
                {!hasBankAccounts ? (
                  <span className="mt-2 rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning-content">
                    {copy.noAccountHint}{" "}
                    <a className="underline" href="#rekening">
                      {copy.addAccountCta}
                    </a>
                  </span>
                ) : null}
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
                    <td className="max-w-sm whitespace-normal break-words [overflow-wrap:anywhere] leading-6">
                      {textValue(item.deskripsi)}
                    </td>
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
          {textValue(item.bank_code)} - {textValue(item.bank_type)}
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

function InvestorBankAccountsManager({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();
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
      title={embedded ? "Rekening Penarikan" : "Rekening Investor"}
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
      emptyAction={
        <a href="#rekening" className="btn btn-primary btn-sm rounded-md text-white">
          {language === "id" ? "Tambah rekening sekarang" : "Add account now"}
        </a>
      }
      searchableFields={["bank_name", "bank_account_number", "bank_account_holder", "bank_code"]}
      showTitle
      showBreadcrumb={!embedded}
      extraInvalidateKeys={[["wallet-bank-accounts"]]}
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
