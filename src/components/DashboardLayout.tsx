import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  FileCheck2,
  Handshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Scale,
  ShieldCheck,
  TrendingUp,
  Users,
  UserRound,
  Activity,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "./Logo";
import { dashboardPathFor, useAuth } from "../lib/auth/AuthProvider";
import type { UserRole } from "../types";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navByRole: Record<UserRole, NavItem[]> = {
  umkm: [
    { to: "/dashboard/umkm", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/umkm/profile", label: "Profile", icon: UserRound },
    { to: "/dashboard/umkm/bisnis", label: "Bisnis", icon: Building2 },
    { to: "/dashboard/umkm/bisnis-profile", label: "Profil Model", icon: Activity },
    { to: "/dashboard/umkm/pengajuan", label: "Pengajuan", icon: FileCheck2 },
    { to: "/dashboard/umkm/penjualan", label: "Penjualan", icon: BarChart3 },
    { to: "/dashboard/umkm/negosiasi", label: "Negosiasi", icon: Handshake },
    { to: "/dashboard/umkm/notifikasi", label: "Notifikasi", icon: Bell },
  ],
  investor: [
    { to: "/dashboard/investor", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/investor/profile", label: "Profile", icon: UserRound },
    { to: "/dashboard/investor/peluang", label: "Peluang", icon: BriefcaseBusiness },
    { to: "/dashboard/investor/rekomendasi", label: "AI Match", icon: Scale },
    { to: "/dashboard/investor/negosiasi", label: "Negosiasi", icon: Handshake },
    { to: "/dashboard/investor/invoice", label: "Invoice", icon: Receipt },
    { to: "/dashboard/investor/portfolio", label: "Portfolio", icon: TrendingUp },
    { to: "/dashboard/investor/profit", label: "Profit", icon: CircleDollarSign },
  ],
  admin: [
    { to: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/admin/profile", label: "Profile", icon: UserRound },
    { to: "/dashboard/admin/api-status", label: "Status Sistem", icon: Activity },
    { to: "/dashboard/admin/users", label: "Users", icon: Users },
    { to: "/dashboard/admin/bisnis", label: "Bisnis", icon: Building2 },
    { to: "/dashboard/admin/bisnis-profile", label: "Profil Model", icon: Activity },
    { to: "/dashboard/admin/pengajuan", label: "Pengajuan", icon: FileCheck2 },
    { to: "/dashboard/admin/penjualan", label: "Penjualan", icon: BarChart3 },
    { to: "/dashboard/admin/negosiasi", label: "Negosiasi", icon: Handshake },
    { to: "/dashboard/admin/kelas", label: "Kelas", icon: Scale },
    { to: "/dashboard/admin/invoice", label: "Invoice", icon: Receipt },
    { to: "/dashboard/admin/investasi", label: "Investasi", icon: TrendingUp },
    { to: "/dashboard/admin/profit", label: "Profit", icon: CircleDollarSign },
    { to: "/dashboard/admin/admins", label: "Admin", icon: Users },
    { to: "/dashboard/admin/notifikasi", label: "Notifikasi", icon: Bell },
  ],
  superadmin: [
    { to: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/admin/profile", label: "Profile", icon: UserRound },
    { to: "/dashboard/admin/api-status", label: "Status Sistem", icon: Activity },
    { to: "/dashboard/admin/users", label: "Users", icon: Users },
    { to: "/dashboard/admin/bisnis", label: "Bisnis", icon: Building2 },
    { to: "/dashboard/admin/bisnis-profile", label: "Profil Model", icon: Activity },
    { to: "/dashboard/admin/pengajuan", label: "Pengajuan", icon: FileCheck2 },
    { to: "/dashboard/admin/penjualan", label: "Penjualan", icon: BarChart3 },
    { to: "/dashboard/admin/negosiasi", label: "Negosiasi", icon: Handshake },
    { to: "/dashboard/admin/kelas", label: "Kelas", icon: Scale },
    { to: "/dashboard/admin/invoice", label: "Invoice", icon: Receipt },
    { to: "/dashboard/admin/investasi", label: "Investasi", icon: TrendingUp },
    { to: "/dashboard/admin/profit", label: "Profit", icon: CircleDollarSign },
    { to: "/dashboard/admin/admins", label: "Admin", icon: Users },
    { to: "/dashboard/admin/notifikasi", label: "Notifikasi", icon: Bell },
  ],
};

function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role ?? "umkm";
  const nav = navByRole[role];

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
        <nav className="grid gap-1">
          {nav.map((item) => {
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
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-base-300 p-4">
        <button className="btn btn-ghost w-full justify-start rounded-md" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export function DashboardLayout() {
  const { user } = useAuth();

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
              <h1 className="text-lg font-bold text-neutral">FundRaise Workspace</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-square btn-ghost" aria-label="Notifikasi">
              <Bell size={20} />
            </button>
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
        <label htmlFor="dashboard-drawer" aria-label="Tutup menu" className="drawer-overlay" />
        <Sidebar />
      </div>
    </div>
  );
}
