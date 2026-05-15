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
  Scale,
  SlidersHorizontal,
  TrendingUp,
  Users,
  UserRound,
  Activity,
  ClipboardList,
  Bookmark,
  ClipboardCheck,
  ChevronRight,
  ChevronDown,
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

const roleLabelKeyByRole: Record<UserRole, TranslationKey> = {
  umkm: "roleUmkm",
  investor: "roleInvestor",
  admin: "roleAdmin",
  superadmin: "roleSuperadmin",
};

const initialsFromName = (name?: string) => {
  const value = (name || "").trim();
  if (!value) return "FR";
  const parts = value.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "FR";
};

function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const role = user?.role ?? "umkm";
  const groups = navByRole[role];
  const roleLabelKey = roleLabelKeyByRole[role];

  return (
    <aside className="flex min-h-full w-72 flex-col border-r border-base-300 bg-white">
      <div className="flex h-20 items-center border-b border-base-300 px-6">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-5 rounded-md border border-base-300 bg-base-200 p-4">
          <div className="min-w-0">
            <span className="badge badge-primary badge-sm text-white">{t(roleLabelKey)}</span>
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
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === dashboardPathFor(role)}
                      className={({ isActive }) =>
                        [
                          "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors duration-150 ease-out",
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

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const role = user?.role ?? "umkm";
  const isAdminRole = role === "admin" || role === "superadmin";
  const roleLabelKey = roleLabelKeyByRole[role];
  const groups = navByRole[role];
  const flatNav = groups.flatMap((group) => group.items);
  const activeItem =
    [...flatNav]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)) ??
    flatNav[0];
  const activeGroup =
    groups.find((group) => group.items.some((item) => item.to === activeItem.to)) ?? groups[0];
  const profilePath = `${dashboardPathFor(role)}/profile`;
  const notificationsPath = `${dashboardPathFor(role)}/notifikasi`;
  const initials = initialsFromName(user?.nama);

  return (
    <div className={`drawer min-h-screen bg-base-200 lg:drawer-open ${isAdminRole ? "fr-admin-neutral" : ""}`}>
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-base-300 bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <label htmlFor="dashboard-drawer" className="btn btn-square btn-ghost lg:hidden">
              <Menu size={22} />
            </label>
            <div>
              <h1 className="text-lg font-bold text-neutral">{t(activeItem.labelKey)}</h1>
              <nav className="mt-1 flex items-center gap-1 text-xs font-semibold text-neutral/45">
                <span>{t(activeGroup.labelKey)}</span>
                <ChevronRight size={12} />
                <span>{t(activeItem.labelKey)}</span>
              </nav>
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
      </div>
      <div className="drawer-side z-40">
        <label htmlFor="dashboard-drawer" aria-label={t("closeMenu")} className="drawer-overlay" />
        <Sidebar />
      </div>
    </div>
  );
}
