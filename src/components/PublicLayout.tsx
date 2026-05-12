import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowUpRight, Instagram, Linkedin, Mail, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../lib/auth/AuthProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "../lib/i18n/LanguageProvider";

const links = [
  { to: "/", labelKey: "navHome" },
  { to: "/tentang", labelKey: "navAbout" },
  { to: "/layanan", labelKey: "navServices" },
  { to: "/portfolio", labelKey: "navPortfolio" },
  { to: "/kontak", labelKey: "navContact" },
] as const;

const socialLinks = [
  { labelKey: "socialInstagram", href: "https://www.instagram.com/fundraise.id", icon: Instagram },
  { labelKey: "socialLinkedin", href: "https://www.linkedin.com/company/fundraise-id", icon: Linkedin },
  { labelKey: "socialEmail", href: "mailto:hello@fundraise.id", icon: Mail },
] as const;

export function PublicLayout() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const dashboardPath =
    user?.role === "investor"
      ? "/dashboard/investor"
      : user?.role === "admin" || user?.role === "superadmin"
        ? "/dashboard/admin"
        : "/dashboard/umkm";

  return (
    <div className="min-h-screen bg-base-100 text-neutral">
      <header className="sticky top-0 z-40 border-b border-base-300/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-4 text-sm font-semibold lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    "inline-flex h-10 w-20 items-center justify-center text-center transition",
                    isActive ? "text-primary" : "text-neutral hover:text-primary",
                  ].join(" ")
                }
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher compact />
            <Link to="/login" className="btn btn-ghost btn-sm w-20">
              {t("loginLink")}
            </Link>
            <Link
              to={isAuthenticated ? dashboardPath : "/register"}
              className="btn btn-primary btn-sm w-40 rounded-md text-white"
            >
              <span className="w-24 text-center">{t("getStarted")}</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="lg:hidden">
            <button
              className="btn btn-square btn-ghost"
              aria-label={t("openMenu")}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-neutral/40 backdrop-blur-sm transition-opacity lg:hidden ${
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-80 max-w-[calc(100vw-2rem)] flex-col border-l border-base-300 bg-white shadow-soft transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-base-300 px-5">
          <Logo />
          <button
            className="btn btn-square btn-ghost"
            aria-label={t("closeMenu")}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 px-4 py-5">
          <div className="grid gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex h-12 items-center rounded-md px-4 text-sm font-bold transition",
                    isActive
                      ? "bg-primary text-white"
                      : "text-neutral/70 hover:bg-base-200 hover:text-neutral",
                  ].join(" ")
                }
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="grid gap-3 border-t border-base-300 p-4">
          <div className="flex items-center justify-between rounded-md border border-base-300 p-3">
            <span className="text-sm font-bold text-neutral/70">{t("language")}</span>
            <LanguageSwitcher compact />
          </div>
          <Link
            to="/login"
            className="btn btn-outline rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {t("loginLink")}
          </Link>
          <Link
            to={isAuthenticated ? dashboardPath : "/register"}
            className="btn btn-primary rounded-md text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="w-24 text-center">{t("getStarted")}</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </aside>

      <Outlet />
      <footer className="border-t border-neutral bg-neutral text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
          <div>
            <Logo variant="white" />
            <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
              {t("footerBody")}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t("navigation")}</h3>
            <div className="mt-4 grid gap-2 text-sm text-white/65">
              {links.map((link) => (
                <Link key={link.to} to={link.to} className="hover:text-accent">
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">FundRaise</h3>
            <p className="mt-4 text-sm leading-6 text-white/65">
              {t("footerWorkspaceBody")}
            </p>
            <div className="mt-5 flex gap-2">
              {socialLinks.map(({ labelKey, href, icon: Icon }) => (
                <a
                  key={labelKey}
                  href={href}
                  aria-label={t(labelKey)}
                  className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/10 text-white/70 transition hover:border-accent hover:text-accent"
                  rel="noreferrer"
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-white/55 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <p>{t("footerCopyright", { year: currentYear })}</p>
            <p>{t("footerBuiltBy")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
