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
  LogOut,
  Menu,
  Receipt,
  Rocket,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Users,
  UserRound,
  Activity,
  ClipboardList,
  Bookmark,
  ClipboardCheck,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { dashboardPathFor, useAuth } from "../lib/auth/AuthProvider";
import { useLanguage, type TranslationKey } from "../lib/i18n/LanguageProvider";
import type { UserRole } from "../types";

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
        { to: "/dashboard/umkm/onboarding", labelKey: "dashboardOnboarding", icon: Rocket },
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
        { to: "/dashboard/umkm/kelas", labelKey: "dashboardClasses", icon: Scale },
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
        { to: "/dashboard/investor/onboarding", labelKey: "dashboardOnboarding", icon: Rocket },
      ],
    },
    {
      labelKey: "dashboardGroupAccount",
      items: [
        { to: "/dashboard/investor/profile", labelKey: "dashboardProfile", icon: UserRound },
        { to: "/dashboard/investor/dokumen", labelKey: "dashboardDocuments", icon: FileText },
        { to: "/dashboard/investor/preferensi", labelKey: "dashboardPreferences", icon: SlidersHorizontal },
        { to: "/dashboard/investor/survey", labelKey: "dashboardSurvey", icon: ClipboardList },
        { to: "/dashboard/investor/notifikasi", labelKey: "dashboardNotifications", icon: Bell },
      ],
    },
    {
      labelKey: "dashboardGroupFunding",
      items: [
        { to: "/dashboard/investor/peluang", labelKey: "dashboardOpportunities", icon: BriefcaseBusiness },
        { to: "/dashboard/investor/saved", labelKey: "dashboardSaved", icon: Bookmark },
        { to: "/dashboard/investor/compare", labelKey: "dashboardCompare", icon: Scale },
        { to: "/dashboard/investor/rekomendasi", labelKey: "dashboardRecommendations", icon: Scale },
        { to: "/dashboard/investor/negosiasi", labelKey: "dashboardNegotiations", icon: Handshake },
        { to: "/dashboard/investor/deal-room/active", labelKey: "dashboardDealRoom", icon: Handshake },
        { to: "/dashboard/investor/kelas", labelKey: "dashboardClasses", icon: Scale },
      ],
    },
    {
      labelKey: "dashboardGroupTransactions",
      items: [
        { to: "/dashboard/investor/invoice", labelKey: "dashboardInvoices", icon: Receipt },
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

function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const role = user?.role ?? "umkm";
  const groups = navByRole[role];

  return (
    <aside className="flex min-h-full w-72 flex-col border-r border-base-300 bg-white">
      <div className="flex h-20 items-center border-b border-base-300 px-6">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-5 rounded-md border border-base-300 bg-base-200 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-white">
              <ShieldCheck size={19} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.nama}</p>
              <p className="truncate text-xs text-neutral/55">{user?.email}</p>
            </div>
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
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === dashboardPathFor(role)}
                      className={({ isActive }) =>
                        [
                          "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition",
                          isActive
                            ? "bg-primary text-white"
                            : "text-neutral/70 hover:bg-base-200 hover:text-neutral",
                        ].join(" ")
                      }
                    >
                      <Icon size={18} />
                      {t(item.labelKey)}
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
        <button className="btn btn-ghost w-full justify-start rounded-md" onClick={logout}>
          <LogOut size={18} />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}

export function DashboardLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const role = user?.role ?? "umkm";
  const groups = navByRole[role];
  const flatNav = groups.flatMap((group) => group.items);
  const activeItem =
    [...flatNav]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)) ??
    flatNav[0];
  const notificationsPath = `${dashboardPathFor(role)}/notifikasi`;

  return (
    <div className="drawer min-h-screen bg-base-200 lg:drawer-open">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-base-300 bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <label htmlFor="dashboard-drawer" className="btn btn-square btn-ghost lg:hidden">
              <Menu size={22} />
            </label>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-neutral/40">{t("workspaceTitle")}</p>
              <h1 className="text-lg font-bold text-neutral">{t(activeItem.labelKey)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact className="hidden sm:block" />
            <NavLink
              to={notificationsPath}
              className="btn btn-square btn-ghost"
              aria-label={t("dashboardNotifications")}
              title={t("dashboardNotifications")}
            >
              <Bell size={20} />
            </NavLink>
            <div className="avatar placeholder">
              <div className="w-10 rounded-md bg-neutral text-white">
                <span className="text-sm">{user?.nama?.slice(0, 2).toUpperCase() ?? "FR"}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <div className="drawer-side z-40">
        <label htmlFor="dashboard-drawer" aria-label={t("closeMenu")} className="drawer-overlay" />
        <Sidebar />
      </div>
    </div>
  );
}
