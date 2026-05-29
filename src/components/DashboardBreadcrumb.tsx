import { ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLanguage, type TranslationKey } from "../lib/i18n/LanguageProvider";

type Crumb = {
  groupKey: TranslationKey;
  pageKey: TranslationKey;
};

const umkmCrumbs: Record<string, Crumb> = {
  "": { groupKey: "dashboardGroupMain", pageKey: "dashboardOverview" },
  onboarding: { groupKey: "dashboardGroupMain", pageKey: "dashboardOnboarding" },
  profile: { groupKey: "dashboardGroupAccount", pageKey: "dashboardProfile" },
  dokumen: { groupKey: "dashboardGroupAccount", pageKey: "dashboardDocuments" },
  notifikasi: { groupKey: "dashboardGroupAccount", pageKey: "dashboardNotifications" },
  bisnis: { groupKey: "dashboardGroupBusiness", pageKey: "dashboardBusiness" },
  "bisnis-profile": { groupKey: "dashboardGroupBusiness", pageKey: "dashboardBusinessModel" },
  pengajuan: { groupKey: "dashboardGroupFunding", pageKey: "dashboardSubmissions" },
  negosiasi: { groupKey: "dashboardGroupFunding", pageKey: "dashboardNegotiations" },
  investasi: { groupKey: "dashboardGroupFunding", pageKey: "dashboardInvestments" },
  penjualan: { groupKey: "dashboardGroupTransactions", pageKey: "dashboardSales" },
  profit: { groupKey: "dashboardGroupTransactions", pageKey: "dashboardProfit" },
};

const investorCrumbs: Record<string, Crumb> = {
  "": { groupKey: "dashboardGroupMain", pageKey: "dashboardOverview" },
  onboarding: { groupKey: "dashboardGroupMain", pageKey: "dashboardOnboarding" },
  profile: { groupKey: "dashboardGroupAccount", pageKey: "dashboardProfile" },
  dokumen: { groupKey: "dashboardGroupAccount", pageKey: "dashboardDocuments" },
  preferensi: { groupKey: "dashboardGroupAccount", pageKey: "dashboardPreferences" },
  survey: { groupKey: "dashboardGroupAccount", pageKey: "dashboardSurvey" },
  notifikasi: { groupKey: "dashboardGroupAccount", pageKey: "dashboardNotifications" },
  peluang: { groupKey: "dashboardGroupFunding", pageKey: "dashboardOpportunities" },
  saved: { groupKey: "dashboardGroupFunding", pageKey: "dashboardSaved" },
  compare: { groupKey: "dashboardGroupFunding", pageKey: "dashboardCompare" },
  negosiasi: { groupKey: "dashboardGroupFunding", pageKey: "dashboardNegotiations" },
  kelas: { groupKey: "dashboardGroupFunding", pageKey: "dashboardClasses" },
  wallet: { groupKey: "dashboardGroupTransactions", pageKey: "dashboardWallet" },
  invoice: { groupKey: "dashboardGroupTransactions", pageKey: "dashboardInvoices" },
  portfolio: { groupKey: "dashboardGroupTransactions", pageKey: "dashboardPortfolio" },
  profit: { groupKey: "dashboardGroupTransactions", pageKey: "dashboardProfit" },
};

const adminCrumbs: Record<string, Crumb> = {
  "": { groupKey: "dashboardGroupMain", pageKey: "dashboardOverview" },
  profile: { groupKey: "dashboardGroupAccount", pageKey: "dashboardProfile" },
  notifikasi: { groupKey: "dashboardGroupAccount", pageKey: "dashboardNotifications" },
  users: { groupKey: "dashboardGroupBusiness", pageKey: "dashboardUsers" },
  bisnis: { groupKey: "dashboardGroupBusiness", pageKey: "dashboardBusiness" },
  "bisnis-profile": { groupKey: "dashboardGroupBusiness", pageKey: "dashboardBusinessModel" },
  kelas: { groupKey: "dashboardGroupBusiness", pageKey: "dashboardClasses" },
  banks: { groupKey: "dashboardGroupBusiness", pageKey: "dashboardSupportedBanks" },
  pengajuan: { groupKey: "dashboardGroupFunding", pageKey: "dashboardSubmissions" },
  review: { groupKey: "dashboardGroupFunding", pageKey: "dashboardReviewQueue" },
  negosiasi: { groupKey: "dashboardGroupFunding", pageKey: "dashboardNegotiations" },
  investasi: { groupKey: "dashboardGroupFunding", pageKey: "dashboardInvestments" },
  penjualan: { groupKey: "dashboardGroupTransactions", pageKey: "dashboardSales" },
  withdrawals: { groupKey: "dashboardGroupTransactions", pageKey: "dashboardWithdrawals" },
  invoice: { groupKey: "dashboardGroupTransactions", pageKey: "dashboardInvoices" },
  profit: { groupKey: "dashboardGroupTransactions", pageKey: "dashboardProfit" },
  "api-status": { groupKey: "dashboardGroupSystem", pageKey: "dashboardSystemStatus" },
  admins: { groupKey: "dashboardGroupSystem", pageKey: "dashboardAdmins" },
};

const crumbsByRole: Record<"umkm" | "investor" | "admin", Record<string, Crumb>> = {
  umkm: umkmCrumbs,
  investor: investorCrumbs,
  admin: adminCrumbs,
};

const dashboardRole = (roleSegment: string | undefined): "umkm" | "investor" | "admin" => {
  if (roleSegment === "investor") return "investor";
  if (roleSegment === "admin") return "admin";
  return "umkm";
};

export function DashboardBreadcrumb({ className }: { className?: string }) {
  const { t } = useLanguage();
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments[0] !== "dashboard") return null;

  const role = dashboardRole(segments[1]);
  const pageSegment = segments[2] ?? "";
  const crumb =
    crumbsByRole[role][pageSegment] ??
    crumbsByRole[role][""] ??
    ({ groupKey: "dashboardGroupMain", pageKey: "dashboardOverview" } as Crumb);

  const groupLabel = t(crumb.groupKey);
  const pageLabel = t(crumb.pageKey);
  const showGroup = groupLabel.trim().toLowerCase() !== pageLabel.trim().toLowerCase();

  return (
    <nav
      className={
        className ??
        "mt-1 flex items-center gap-1 text-xs font-semibold text-neutral/45"
      }
      aria-label="Breadcrumb"
    >
      {showGroup ? (
        <>
          <span>{groupLabel}</span>
          <ChevronRight size={12} />
        </>
      ) : null}
      <span>{pageLabel}</span>
    </nav>
  );
}
