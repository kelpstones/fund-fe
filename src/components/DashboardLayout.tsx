import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Handshake,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Receipt,
  Scale,
  SlidersHorizontal,
  TrendingUp,
  Users,
  UserRound,
  Activity,
  ClipboardList,
  Bookmark,
  ClipboardCheck,
  ChevronDown,
  Lock,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useToast } from "./ToastProvider";
import { dashboardPathFor, useAuth } from "../lib/auth/AuthProvider";
import { useLanguage, type TranslationKey } from "../lib/i18n/LanguageProvider";
import { directApi } from "../lib/api/direct";
import { resourceApi } from "../lib/api/resources";
import { readPath } from "../lib/format";
import { INVESTOR_QUICK_SETUP_OPEN_EVENT } from "../lib/investorQuickSetup";
import {
  investorInvestmentConfig,
  myBusinessConfig,
  myNegotiationConfig,
  notificationConfig,
  submissionConfig,
} from "../lib/resourceConfigs";
import type { Entity, UserRole } from "../types";

type InvestorQuickPreferenceForm = {
  tujuan_investasi: string;
  risk_tolerance: string;
  tipe_umkm: string;
  cara_memilih: string;
  sektor: string;
};

type InvestorQuickPreferenceStep = {
  key: keyof InvestorQuickPreferenceForm;
  titleKey: TranslationKey;
  helpKey: TranslationKey;
  options: Array<{
    value: string;
    labelKey: TranslationKey;
    bodyKey: TranslationKey;
  }>;
};

type InvestorPreferenceMetricKey =
  | "kepuasan_pelanggan"
  | "digital_adoption_score"
  | "net_profit_margin"
  | "year_revenue"
  | "business_tenure_years";

type NavItem = {
  to: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
};

type NavGroup = {
  labelKey: TranslationKey;
  items: NavItem[];
};

const navByRole: Record<UserRole, NavGroup[]> = {
  umkm: [
    {
      labelKey: "dashboardGroupMain",
      items: [
        { to: "/dashboard/umkm", labelKey: "dashboardOverview", icon: LayoutDashboard },
      ],
    },
    {
      labelKey: "dashboardGroupAccount",
      items: [
        { to: "/dashboard/umkm/profile", labelKey: "dashboardProfile", icon: UserRound },
        { to: "/dashboard/umkm/dokumen", labelKey: "dashboardDocuments", icon: FileText },
        { to: "/dashboard/umkm/notifikasi", labelKey: "dashboardNotifications", icon: Bell },
      ],
    },
    {
      labelKey: "dashboardGroupBusiness",
      items: [
        { to: "/dashboard/umkm/bisnis", labelKey: "dashboardBusiness", icon: Building2 },
        { to: "/dashboard/umkm/bisnis-profile", labelKey: "dashboardBusinessModel", icon: Activity },
      ],
    },
    {
      labelKey: "dashboardGroupFunding",
      items: [
        { to: "/dashboard/umkm/pengajuan", labelKey: "dashboardSubmissions", icon: FileCheck2 },
        { to: "/dashboard/umkm/negosiasi", labelKey: "dashboardNegotiations", icon: Handshake },
        { to: "/dashboard/umkm/investasi", labelKey: "dashboardInvestments", icon: TrendingUp },
      ],
    },
    {
      labelKey: "dashboardGroupTransactions",
      items: [
        { to: "/dashboard/umkm/penjualan", labelKey: "dashboardSales", icon: BarChart3 },
        { to: "/dashboard/umkm/profit", labelKey: "dashboardProfit", icon: CircleDollarSign },
      ],
    },
  ],
  investor: [
    {
      labelKey: "dashboardGroupMain",
      items: [
        { to: "/dashboard/investor", labelKey: "dashboardOverview", icon: LayoutDashboard },
      ],
    },
    {
      labelKey: "dashboardGroupAccount",
      items: [
        { to: "/dashboard/investor/profile", labelKey: "dashboardProfile", icon: UserRound },
        { to: "/dashboard/investor/preferensi", labelKey: "dashboardPreferences", icon: SlidersHorizontal },
        { to: "/dashboard/investor/wallet", labelKey: "dashboardWallet", icon: CircleDollarSign },
        { to: "/dashboard/investor/notifikasi", labelKey: "dashboardNotifications", icon: Bell },
      ],
    },
    {
      labelKey: "dashboardGroupOpportunities",
      items: [
        { to: "/dashboard/investor/peluang", labelKey: "dashboardOpportunities", icon: BriefcaseBusiness },
        { to: "/dashboard/investor/saved", labelKey: "dashboardSaved", icon: Bookmark },
        { to: "/dashboard/investor/compare", labelKey: "dashboardCompare", icon: Scale },
      ],
    },
    {
      labelKey: "dashboardGroupProcess",
      items: [
        { to: "/dashboard/investor/negosiasi", labelKey: "dashboardNegotiations", icon: Handshake },
        { to: "/dashboard/investor/invoice", labelKey: "dashboardInvoices", icon: Receipt },
      ],
    },
    {
      labelKey: "dashboardGroupPortfolio",
      items: [
        { to: "/dashboard/investor/portfolio", labelKey: "dashboardPortfolio", icon: TrendingUp },
        { to: "/dashboard/investor/profit", labelKey: "dashboardProfit", icon: CircleDollarSign },
      ],
    },
  ],
  admin: [
    {
      labelKey: "dashboardGroupMain",
      items: [{ to: "/dashboard/admin", labelKey: "dashboardOverview", icon: LayoutDashboard }],
    },
    {
      labelKey: "dashboardGroupAccount",
      items: [
        { to: "/dashboard/admin/profile", labelKey: "dashboardProfile", icon: UserRound },
        { to: "/dashboard/admin/notifikasi", labelKey: "dashboardNotifications", icon: Bell },
      ],
    },
    {
      labelKey: "dashboardGroupBusiness",
      items: [
        { to: "/dashboard/admin/users", labelKey: "dashboardUsers", icon: Users },
        { to: "/dashboard/admin/bisnis", labelKey: "dashboardBusiness", icon: Building2 },
        { to: "/dashboard/admin/bisnis-profile", labelKey: "dashboardBusinessModel", icon: Activity },
        { to: "/dashboard/admin/kelas", labelKey: "dashboardClasses", icon: Scale },
        { to: "/dashboard/admin/banks", labelKey: "dashboardSupportedBanks", icon: Building2 },
      ],
    },
    {
      labelKey: "dashboardGroupFunding",
      items: [
        { to: "/dashboard/admin/pengajuan", labelKey: "dashboardSubmissions", icon: FileCheck2 },
        { to: "/dashboard/admin/review", labelKey: "dashboardReviewQueue", icon: ClipboardCheck },
        { to: "/dashboard/admin/negosiasi", labelKey: "dashboardNegotiations", icon: Handshake },
        { to: "/dashboard/admin/investasi", labelKey: "dashboardInvestments", icon: TrendingUp },
      ],
    },
    {
      labelKey: "dashboardGroupTransactions",
      items: [
        { to: "/dashboard/admin/penjualan", labelKey: "dashboardSales", icon: BarChart3 },
        { to: "/dashboard/admin/withdrawals", labelKey: "dashboardWithdrawals", icon: CircleDollarSign },
        { to: "/dashboard/admin/invoice", labelKey: "dashboardInvoices", icon: Receipt },
        { to: "/dashboard/admin/profit", labelKey: "dashboardProfit", icon: CircleDollarSign },
      ],
    },
    {
      labelKey: "dashboardGroupSystem",
      items: [
        { to: "/dashboard/admin/api-status", labelKey: "dashboardSystemStatus", icon: Activity },
        { to: "/dashboard/admin/admins", labelKey: "dashboardAdmins", icon: Users },
      ],
    },
  ],
  superadmin: [
    {
      labelKey: "dashboardGroupMain",
      items: [{ to: "/dashboard/admin", labelKey: "dashboardOverview", icon: LayoutDashboard }],
    },
    {
      labelKey: "dashboardGroupAccount",
      items: [
        { to: "/dashboard/admin/profile", labelKey: "dashboardProfile", icon: UserRound },
        { to: "/dashboard/admin/notifikasi", labelKey: "dashboardNotifications", icon: Bell },
      ],
    },
    {
      labelKey: "dashboardGroupBusiness",
      items: [
        { to: "/dashboard/admin/users", labelKey: "dashboardUsers", icon: Users },
        { to: "/dashboard/admin/bisnis", labelKey: "dashboardBusiness", icon: Building2 },
        { to: "/dashboard/admin/bisnis-profile", labelKey: "dashboardBusinessModel", icon: Activity },
        { to: "/dashboard/admin/kelas", labelKey: "dashboardClasses", icon: Scale },
        { to: "/dashboard/admin/banks", labelKey: "dashboardSupportedBanks", icon: Building2 },
      ],
    },
    {
      labelKey: "dashboardGroupFunding",
      items: [
        { to: "/dashboard/admin/pengajuan", labelKey: "dashboardSubmissions", icon: FileCheck2 },
        { to: "/dashboard/admin/review", labelKey: "dashboardReviewQueue", icon: ClipboardCheck },
        { to: "/dashboard/admin/negosiasi", labelKey: "dashboardNegotiations", icon: Handshake },
        { to: "/dashboard/admin/investasi", labelKey: "dashboardInvestments", icon: TrendingUp },
      ],
    },
    {
      labelKey: "dashboardGroupTransactions",
      items: [
        { to: "/dashboard/admin/penjualan", labelKey: "dashboardSales", icon: BarChart3 },
        { to: "/dashboard/admin/withdrawals", labelKey: "dashboardWithdrawals", icon: CircleDollarSign },
        { to: "/dashboard/admin/invoice", labelKey: "dashboardInvoices", icon: Receipt },
        { to: "/dashboard/admin/profit", labelKey: "dashboardProfit", icon: CircleDollarSign },
      ],
    },
    {
      labelKey: "dashboardGroupSystem",
      items: [
        { to: "/dashboard/admin/api-status", labelKey: "dashboardSystemStatus", icon: Activity },
        { to: "/dashboard/admin/admins", labelKey: "dashboardAdmins", icon: Users },
      ],
    },
  ],
};

const roleLabelKeyByRole: Record<UserRole, TranslationKey> = {
  umkm: "roleUmkm",
  investor: "roleInvestor",
  admin: "roleAdmin",
  superadmin: "roleSuperadmin",
};

const investorQuickPreferenceDefaults: InvestorQuickPreferenceForm = {
  tujuan_investasi: "campuran",
  risk_tolerance: "seimbang",
  tipe_umkm: "bertumbuh",
  cara_memilih: "data",
  sektor: "bebas",
};

const investorPreferenceMetricFields: Array<{
  key: InvestorPreferenceMetricKey;
  min: number;
  max: number;
}> = [
  {
    key: "kepuasan_pelanggan",
    min: 1,
    max: 5,
  },
  {
    key: "digital_adoption_score",
    min: 1,
    max: 10,
  },
  {
    key: "net_profit_margin",
    min: -35,
    max: 100,
  },
  {
    key: "business_tenure_years",
    min: 0,
    max: 50,
  },
  {
    key: "year_revenue",
    min: 18000000,
    max: 50000000000,
  },
];

const investorQuickPreferenceSteps: InvestorQuickPreferenceStep[] = [
  {
    key: "tujuan_investasi",
    titleKey: "investorQuickGoalTitle",
    helpKey: "investorQuickGoalHelp",
    options: [
      {
        value: "pendapatan_stabil",
        labelKey: "investorQuickGoalStable",
        bodyKey: "investorQuickGoalStableBody",
      },
      {
        value: "pertumbuhan_nilai",
        labelKey: "investorQuickGoalGrowth",
        bodyKey: "investorQuickGoalGrowthBody",
      },
      {
        value: "dampak_lokal",
        labelKey: "investorQuickGoalImpact",
        bodyKey: "investorQuickGoalImpactBody",
      },
      {
        value: "campuran",
        labelKey: "investorQuickGoalMixed",
        bodyKey: "investorQuickGoalMixedBody",
      },
    ],
  },
  {
    key: "risk_tolerance",
    titleKey: "investorQuickRiskTitle",
    helpKey: "investorQuickRiskHelp",
    options: [
      {
        value: "aman_stabil",
        labelKey: "investorQuickRiskSafe",
        bodyKey: "investorQuickRiskSafeBody",
      },
      {
        value: "seimbang",
        labelKey: "investorQuickRiskBalanced",
        bodyKey: "investorQuickRiskBalancedBody",
      },
      {
        value: "agresif",
        labelKey: "investorQuickRiskAggressive",
        bodyKey: "investorQuickRiskAggressiveBody",
      },
    ],
  },
  {
    key: "tipe_umkm",
    titleKey: "investorQuickUmkmTitle",
    helpKey: "investorQuickUmkmHelp",
    options: [
      {
        value: "stabil",
        labelKey: "investorQuickUmkmEstablished",
        bodyKey: "investorQuickUmkmEstablishedBody",
      },
      {
        value: "bertumbuh",
        labelKey: "investorQuickUmkmGrowing",
        bodyKey: "investorQuickUmkmGrowingBody",
      },
      {
        value: "berkembang",
        labelKey: "investorQuickUmkmPotential",
        bodyKey: "investorQuickUmkmPotentialBody",
      },
    ],
  },
  {
    key: "sektor",
    titleKey: "investorQuickSectorTitle",
    helpKey: "investorQuickSectorHelp",
    options: [
      {
        value: "kuliner",
        labelKey: "investorQuickSectorCulinary",
        bodyKey: "investorQuickSectorCulinaryBody",
      },
      {
        value: "fashion",
        labelKey: "investorQuickSectorFashion",
        bodyKey: "investorQuickSectorFashionBody",
      },
      {
        value: "agribisnis",
        labelKey: "investorQuickSectorAgribusiness",
        bodyKey: "investorQuickSectorAgribusinessBody",
      },
      {
        value: "jasa_teknologi",
        labelKey: "investorQuickSectorServiceTech",
        bodyKey: "investorQuickSectorServiceTechBody",
      },
      {
        value: "bebas",
        labelKey: "investorQuickSectorAny",
        bodyKey: "investorQuickSectorAnyBody",
      },
    ],
  },
  {
    key: "cara_memilih",
    titleKey: "investorQuickPickTitle",
    helpKey: "investorQuickPickHelp",
    options: [
      {
        value: "return",
        labelKey: "investorQuickPickReturn",
        bodyKey: "investorQuickPickReturnBody",
      },
      {
        value: "risiko",
        labelKey: "investorQuickPickRisk",
        bodyKey: "investorQuickPickRiskBody",
      },
      {
        value: "data",
        labelKey: "investorQuickPickData",
        bodyKey: "investorQuickPickDataBody",
      },
      {
        value: "minat",
        labelKey: "investorQuickPickInterest",
        bodyKey: "investorQuickPickInterestBody",
      },
    ],
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const pickQuickPreferenceOption = (
  key: keyof InvestorQuickPreferenceForm,
  rawValue: unknown,
) => {
  const step = investorQuickPreferenceSteps.find((item) => item.key === key);
  const normalizedValue = String(rawValue ?? "");
  if (step?.options.some((option) => option.value === normalizedValue)) {
    return normalizedValue;
  }
  return investorQuickPreferenceDefaults[key];
};

const mapQuickPreferenceForm = (source: unknown): InvestorQuickPreferenceForm => {
  const data = isRecord(source) ? source : {};
  return {
    tujuan_investasi: pickQuickPreferenceOption("tujuan_investasi", data.tujuan_investasi),
    risk_tolerance: pickQuickPreferenceOption("risk_tolerance", data.risk_tolerance),
    tipe_umkm: pickQuickPreferenceOption("tipe_umkm", data.tipe_umkm),
    cara_memilih: pickQuickPreferenceOption("cara_memilih", data.cara_memilih),
    sektor: pickQuickPreferenceOption("sektor", data.sektor),
  };
};

const investorPreferencesQueryKey = (userId?: string | number) =>
  ["investor-preferences", userId ?? "guest"] as const;

const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (isRecord(data) && typeof data.message === "string") return data.message;
    if (typeof data === "string") return data;
  }

  return fallback;
};

const hasCompleteInvestorPreference = (source: unknown) =>
  isRecord(source) &&
  investorPreferenceMetricFields.every((field) => {
    const value = Number(source[field.key]);
    return Number.isFinite(value) && value >= field.min && value <= field.max;
  });

const initialsFromName = (name?: string) => {
  const value = (name || "").trim();
  if (!value) return "FR";
  const parts = value.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "FR";
};

const approvalStatus = (item: Entity) =>
  String(readPath(item, ["approval.status", "approval_status", "status"], "draft")).toLowerCase();

const isApprovedSubmission = (item: Entity) =>
  ["approved", "published", "funded"].includes(approvalStatus(item));

const isUnreadNotification = (item: Entity) => {
  if (typeof item.is_read === "boolean") return !item.is_read;
  const status = String(readPath(item, ["status"], "")).toLowerCase();
  return status === "unread" || status === "new";
};

function useNavState(role: UserRole) {
  const { user } = useAuth();
  const umkmBusinessesQuery = useQuery({
    queryKey: ["sidebar-locks", "umkm", "businesses"],
    queryFn: () => resourceApi.list(myBusinessConfig),
    enabled: role === "umkm",
    retry: false,
  });

  const umkmSubmissionsQuery = useQuery({
    queryKey: ["sidebar-locks", "umkm", "submissions"],
    queryFn: () => resourceApi.list(submissionConfig),
    enabled: role === "umkm",
    retry: false,
  });

  const investorPreferencesQuery = useQuery({
    queryKey: investorPreferencesQueryKey(user?.id),
    queryFn: async () => {
      try {
        return await directApi.get("/user/investor/preferences", null);
      } catch {
        return null;
      }
    },
    enabled: role === "investor" && Boolean(user?.id),
    retry: false,
  });

  const investorNegotiationsQuery = useQuery({
    queryKey: ["sidebar-locks", "investor", "negotiations"],
    queryFn: () => resourceApi.list(myNegotiationConfig),
    enabled: role === "investor",
    retry: false,
  });

  const investorInvestmentsQuery = useQuery({
    queryKey: ["sidebar-locks", "investor", "investments"],
    queryFn: () => resourceApi.list(investorInvestmentConfig),
    enabled: role === "investor",
    retry: false,
  });

  return useMemo(() => {
    const locked = new Set<string>();
    const hidden = new Set<string>();

    if (role === "umkm") {
      const businesses = umkmBusinessesQuery.data ?? [];
      const submissions = umkmSubmissionsQuery.data ?? [];
      const hasBusiness = businesses.length > 0;
      const hasApprovedSubmission = submissions.some(isApprovedSubmission);

      if (!hasBusiness) {
        locked.add("/dashboard/umkm/bisnis-profile");
        locked.add("/dashboard/umkm/pengajuan");
      }

      if (!hasApprovedSubmission) {
        locked.add("/dashboard/umkm/negosiasi");
        locked.add("/dashboard/umkm/investasi");
        locked.add("/dashboard/umkm/penjualan");
        locked.add("/dashboard/umkm/profit");
      }
    }

    if (role === "investor") {
      const hasPreferences = Boolean(investorPreferencesQuery.data);
      const hasNegotiation = (investorNegotiationsQuery.data ?? []).length > 0;
      const hasInvestment = (investorInvestmentsQuery.data ?? []).length > 0;

      if (!hasPreferences) {
        hidden.add("/dashboard/investor/peluang");
        hidden.add("/dashboard/investor/saved");
        hidden.add("/dashboard/investor/compare");
        hidden.add("/dashboard/investor/negosiasi");
        hidden.add("/dashboard/investor/invoice");
        hidden.add("/dashboard/investor/portfolio");
        hidden.add("/dashboard/investor/profit");
      }

      if (hasPreferences && !hasNegotiation) {
        hidden.add("/dashboard/investor/negosiasi");
        hidden.add("/dashboard/investor/invoice");
        hidden.add("/dashboard/investor/portfolio");
        hidden.add("/dashboard/investor/profit");
      }

      if (hasNegotiation && !hasInvestment) {
        hidden.add("/dashboard/investor/portfolio");
        hidden.add("/dashboard/investor/profit");
      }
    }

    if (role === "admin") {
      locked.add("/dashboard/admin/admins");
    }

    return { locked, hidden };
  }, [
    investorInvestmentsQuery.data,
    investorNegotiationsQuery.data,
    investorPreferencesQuery.data,
    role,
    umkmBusinessesQuery.data,
    umkmSubmissionsQuery.data,
  ]);
}

function Sidebar({ hasUnreadNotifications }: { hasUnreadNotifications: boolean }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const role = user?.role ?? "umkm";
  const isAdminRole = role === "admin" || role === "superadmin";
  const navState = useNavState(role);
  const groups = useMemo(
    () =>
      navByRole[role]
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => !navState.hidden.has(item.to)),
        }))
        .filter((group) => group.items.length > 0),
    [navState.hidden, role],
  );
  const roleLabelKey = roleLabelKeyByRole[role];
  const location = useLocation();
  const lockedPaths = navState.locked;

  return (
    <aside className="flex min-h-full w-72 flex-col border-r border-base-300 bg-white">
      <div className="flex h-20 items-center border-b border-base-300 px-6">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-5 rounded-md border border-base-300 bg-base-200 p-4">
          <div className="min-w-0">
            <span className={isAdminRole ? "badge badge-neutral badge-outline badge-sm" : "badge badge-primary badge-sm text-white"}>
              {t(roleLabelKey)}
            </span>
            <p className="mt-3 truncate text-sm font-bold">{user?.nama}</p>
            <p className="truncate text-xs text-neutral/55">{user?.email}</p>
          </div>
        </div>
        <nav className="grid gap-5">
          {groups.map((group) => (
            <div key={group.labelKey}>
              <p className="mb-2 px-3 text-xs font-black uppercase tracking-wide text-neutral/35">
                {t(group.labelKey)}
              </p>
              <div className="grid gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isLocked = lockedPaths.has(item.to);
                  const showNotificationDot =
                    hasUnreadNotifications && item.labelKey === "dashboardNotifications";
                  const isActive =
                    location.pathname === item.to ||
                    location.pathname.startsWith(`${item.to}/`);

                  if (isLocked) {
                    return (
                      <div
                        key={item.to}
                        className={[
                          "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold",
                          "cursor-not-allowed border border-dashed border-base-300 bg-base-200/60 text-neutral/45",
                          isActive ? "border-base-300 bg-base-300/70 text-neutral/60" : "",
                        ].join(" ")}
                        aria-disabled
                        title={t("locked")}
                      >
                        <Icon size={18} />
                        <span className="truncate">{t(item.labelKey)}</span>
                        {showNotificationDot ? (
                          <span
                            className="ml-auto inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500"
                            aria-hidden
                          />
                        ) : null}
                        <Lock size={14} className={`${showNotificationDot ? "ml-2" : "ml-auto"} shrink-0`} />
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === dashboardPathFor(role)}
                      className={({ isActive }) =>
                        [
                          "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors duration-150 ease-out",
                          isActive
                            ? isAdminRole
                              ? "border border-base-300 bg-base-300 text-neutral"
                              : "bg-primary text-white"
                            : "text-neutral/70 hover:bg-base-200 hover:text-neutral",
                        ].join(" ")
                      }
                    >
                      <Icon size={18} />
                      <span className="truncate">{t(item.labelKey)}</span>
                      {showNotificationDot ? (
                        <span
                          className="ml-auto inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500"
                          aria-hidden
                        />
                      ) : null}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-base-300 p-4">
        <div className="mb-3 lg:hidden">
          <LanguageSwitcher compact />
        </div>
        <button
          className="btn btn-ghost w-full justify-start rounded-md text-error hover:bg-error/10 hover:text-error"
          onClick={logout}
        >
          <LogOut size={18} />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}

function InvestorPreferencePrompt() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<InvestorQuickPreferenceForm>(investorQuickPreferenceDefaults);
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissedOverviewVisit, setDismissedOverviewVisit] = useState<string | null>(null);
  const role = user?.role;
  const investorOverviewPath = dashboardPathFor("investor");
  const overviewVisitKey = user?.id ? `${user.id}:${investorOverviewPath}:${location.key}` : "";

  const preferencesQuery = useQuery({
    queryKey: investorPreferencesQueryKey(user?.id),
    queryFn: async () => {
      try {
        return await directApi.get("/user/investor/preferences", null);
      } catch {
        return null;
      }
    },
    enabled: role === "investor" && Boolean(user?.id),
    retry: false,
  });
  const prefilledQuickForm = useMemo(
    () => mapQuickPreferenceForm(preferencesQuery.data),
    [preferencesQuery.data],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleManualOpen = () => {
      setForm(prefilledQuickForm);
      setActiveStep(0);
      setManualOpen(true);
    };

    window.addEventListener(INVESTOR_QUICK_SETUP_OPEN_EVENT, handleManualOpen);
    return () => {
      window.removeEventListener(INVESTOR_QUICK_SETUP_OPEN_EVENT, handleManualOpen);
    };
  }, [prefilledQuickForm]);

  const closeForVisit = (status: "skipped" | "completed") => {
    if (
      !manualOpen &&
      (status === "skipped" || status === "completed") &&
      overviewVisitKey &&
      location.pathname === investorOverviewPath
    ) {
      setDismissedOverviewVisit(overviewVisitKey);
    }
    setManualOpen(false);
    setActiveStep(0);
    setForm(prefilledQuickForm);
  };

  const shouldAutoOpen =
    role === "investor" &&
    Boolean(user?.id) &&
    !preferencesQuery.isLoading &&
    Boolean(overviewVisitKey) &&
    location.pathname === investorOverviewPath &&
    dismissedOverviewVisit !== overviewVisitKey &&
    !hasCompleteInvestorPreference(preferencesQuery.data);
  const shouldOpen = shouldAutoOpen || (role === "investor" && Boolean(user?.id) && manualOpen);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        tujuan_investasi: form.tujuan_investasi,
        risk_tolerance: form.risk_tolerance,
        tipe_umkm: form.tipe_umkm,
        cara_memilih: form.cara_memilih,
      };
      await directApi.post("/user/investor/preferences", payload);

      try {
        const sectorQuery = form.sektor && form.sektor !== "bebas"
          ? `?sektor=${encodeURIComponent(form.sektor)}`
          : "";
        await directApi.post(`/user/investor/preferences/refresh${sectorQuery}`);
        return { refreshFailed: false };
      } catch {
        return { refreshFailed: true };
      }
    },
    onSuccess: async (result) => {
      closeForVisit("completed");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["investor-preferences"] }),
        queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] }),
      ]);

      if (result.refreshFailed) {
        toast.warning(t("investorQuickSetupRefreshWarning"));
        return;
      }
      toast.success(t("investorQuickSetupSuccess"));
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, t("investorQuickSetupError")));
    },
  });

  if (!shouldOpen) return null;

  const field = investorQuickPreferenceSteps[activeStep];
  const value = form[field.key];
  const progress = Math.round(((activeStep + 1) / investorQuickPreferenceSteps.length) * 100);
  const isLastStep = activeStep === investorQuickPreferenceSteps.length - 1;
  const valueIsValid = field.options.some((option) => option.value === value);

  const update = (nextValue: string) => {
    setForm((current) => ({
      ...current,
      [field.key]: nextValue,
    }));
  };

  const goNext = () => {
    if (!valueIsValid) return;
    if (!isLastStep) {
      setActiveStep((step) => step + 1);
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box fr-modal-panel w-[calc(100vw-1.5rem)] max-w-2xl rounded-md p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <ClipboardList size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="text-2xl font-black text-neutral sm:text-3xl">{t("investorQuickSetupTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral/60">{t("investorQuickSetupBody")}</p>
          </div>
        </div>

        <div className="mt-6 h-2 rounded-full bg-base-200">
          <div
            className="h-2 rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-6 rounded-md border border-base-300 bg-base-100 p-5">
          <div>
            <h4 className="text-lg font-black text-neutral">{t(field.titleKey)}</h4>
            <p className="mt-1 text-sm font-semibold leading-6 text-neutral/55">
              {t(field.helpKey)}
            </p>
          </div>
          <div className="mt-5 grid gap-3">
            {field.options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-md border p-4 text-left transition ${
                    isSelected
                      ? "border-primary bg-primary/10 text-neutral shadow-sm"
                      : "border-base-300 bg-white hover:border-primary/40 hover:bg-primary/5"
                  }`}
                  onClick={() => update(option.value)}
                  aria-pressed={isSelected}
                >
                  <span className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        isSelected ? "border-primary bg-primary" : "border-base-300 bg-white"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-black">{t(option.labelKey)}</span>
                      <span className="mt-1 block text-sm font-semibold leading-5 text-neutral/55">
                        {t(option.bodyKey)}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold leading-5 text-neutral/45">
          {t("investorQuickSetupEditHint")}
        </p>

        <div className="modal-action flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="btn btn-ghost rounded-md"
            onClick={() => closeForVisit("skipped")}
            disabled={saveMutation.isPending}
          >
            {t("investorQuickSetupSkip")}
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="btn btn-outline rounded-md"
              onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
              disabled={activeStep === 0 || saveMutation.isPending}
            >
              {t("back")}
            </button>
            <button
              type="button"
              className="btn btn-primary rounded-md text-white"
              onClick={goNext}
              disabled={!valueIsValid || saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : null}
              {isLastStep ? t("investorQuickSetupSave") : t("next")}
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="modal-backdrop fr-modal-backdrop"
        onClick={() => closeForVisit("skipped")}
        aria-label={t("investorQuickSetupSkip")}
      />
    </div>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const role = user?.role ?? "umkm";
  const isAdminRole = role === "admin" || role === "superadmin";
  const roleLabelKey = roleLabelKeyByRole[role];
  const profilePath = `${dashboardPathFor(role)}/profile`;
  const notificationsPath = `${dashboardPathFor(role)}/notifikasi`;
  const initials = initialsFromName(user?.nama);
  const notificationsQuery = useQuery({
    queryKey: ["dashboard-notification-dot", role, user?.id],
    queryFn: async () => {
      try {
        return await resourceApi.list(notificationConfig);
      } catch {
        return [];
      }
    },
    enabled: Boolean(user?.id),
    retry: false,
    refetchInterval: 30_000,
  });
  const unreadCount = useMemo(
    () => (notificationsQuery.data ?? []).filter(isUnreadNotification).length,
    [notificationsQuery.data],
  );
  const hasUnreadNotifications = unreadCount > 0;

  return (
    <div className={`drawer min-h-screen bg-base-200 lg:drawer-open ${isAdminRole ? "fr-admin-neutral" : ""}`}>
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-base-300 bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center">
            <label htmlFor="dashboard-drawer" className="btn btn-square btn-ghost lg:hidden">
              <Menu size={22} />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact className="hidden sm:block" />
            <NavLink
              to={notificationsPath}
              className="btn btn-square btn-ghost relative"
              aria-label={t("dashboardNotifications")}
              title={t("dashboardNotifications")}
            >
              <Bell size={20} />
              {hasUnreadNotifications ? (
                <span
                  className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white"
                  aria-hidden
                />
              ) : null}
            </NavLink>
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost h-10 rounded-md px-2">
                <div className="avatar placeholder">
                  <div className="w-9 rounded-md bg-neutral text-white">
                    <span className="text-sm">{initials}</span>
                  </div>
                </div>
                <ChevronDown size={16} className="text-neutral/60" />
              </button>
              <ul
                tabIndex={0}
                className="menu dropdown-content z-[1200] mt-2 w-56 rounded-md border border-base-300 bg-white p-2 shadow-lg"
              >
                <li className="menu-title px-2 py-1">
                  <span className="truncate text-sm font-bold text-neutral">{user?.nama}</span>
                  <span className="text-xs font-semibold text-neutral/55">{t(roleLabelKey)}</span>
                </li>
                <li>
                  <NavLink to={profilePath} className="rounded-md">
                    {t("dashboardProfile")}
                  </NavLink>
                </li>
                <li className="mt-1 border-t border-base-300 pt-1">
                  <button
                    type="button"
                    className="rounded-md text-error hover:bg-error/10 hover:text-error"
                    onClick={logout}
                  >
                    <LogOut size={16} />
                    {t("logout")}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <InvestorPreferencePrompt />
      </div>
      <div className="drawer-side z-40">
        <label htmlFor="dashboard-drawer" aria-label={t("closeMenu")} className="drawer-overlay" />
        <Sidebar hasUnreadNotifications={hasUnreadNotifications} />
      </div>
    </div>
  );
}
