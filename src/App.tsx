import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { dashboardPathFor, useAuth } from "./lib/auth/AuthProvider";

const DashboardLayout = lazy(() =>
  import("./components/DashboardLayout").then((module) => ({ default: module.DashboardLayout })),
);
const PublicLayout = lazy(() =>
  import("./components/PublicLayout").then((module) => ({ default: module.PublicLayout })),
);

const LoginPage = lazy(() =>
  import("./pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./pages/auth/RegisterPage").then((module) => ({ default: module.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/auth/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/auth/ResetPasswordPage").then((module) => ({ default: module.ResetPasswordPage })),
);
const VerifyEmailPage = lazy(() =>
  import("./pages/auth/VerifyEmailPage").then((module) => ({ default: module.VerifyEmailPage })),
);

const HomePage = lazy(() =>
  import("./pages/public/HomePage").then((module) => ({ default: module.HomePage })),
);
const AboutPage = lazy(() =>
  import("./pages/public/AboutPage").then((module) => ({ default: module.AboutPage })),
);
const ServicesPage = lazy(() =>
  import("./pages/public/ServicesPage").then((module) => ({ default: module.ServicesPage })),
);
const PortfolioPage = lazy(() =>
  import("./pages/public/PortfolioPage").then((module) => ({ default: module.PortfolioPage })),
);
const PortfolioDetailPage = lazy(() =>
  import("./pages/public/PortfolioDetailPage").then((module) => ({ default: module.PortfolioDetailPage })),
);
const HelpCenterPage = lazy(() =>
  import("./pages/public/HelpCenterPage").then((module) => ({ default: module.HelpCenterPage })),
);
const TrustSafetyPage = lazy(() =>
  import("./pages/public/TrustSafetyPage").then((module) => ({ default: module.TrustSafetyPage })),
);
const TermsPage = lazy(() =>
  import("./pages/public/TermsPage").then((module) => ({ default: module.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import("./pages/public/PrivacyPage").then((module) => ({ default: module.PrivacyPage })),
);
const ContactPage = lazy(() =>
  import("./pages/public/ContactPage").then((module) => ({ default: module.ContactPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })),
);

const overviewPagesModule = () => import("./pages/dashboard/OverviewPages");
const UmkmOverviewPage = lazy(() =>
  overviewPagesModule().then((module) => ({ default: module.UmkmOverviewPage })),
);
const InvestorOverviewPage = lazy(() =>
  overviewPagesModule().then((module) => ({ default: module.InvestorOverviewPage })),
);
const AdminOverviewPage = lazy(() =>
  overviewPagesModule().then((module) => ({ default: module.AdminOverviewPage })),
);

const UmkmOnboardingPage = lazy(() =>
  import("./pages/dashboard/UmkmOnboardingPage").then((module) => ({ default: module.UmkmOnboardingPage })),
);
const InvestorOnboardingPage = lazy(() =>
  import("./pages/dashboard/InvestorOnboardingPage").then((module) => ({ default: module.InvestorOnboardingPage })),
);
const InvestorSurveyPage = lazy(() =>
  import("./pages/dashboard/InvestorSurveyPage").then((module) => ({ default: module.InvestorSurveyPage })),
);
const DocumentCenterPage = lazy(() =>
  import("./pages/dashboard/DocumentCenterPage").then((module) => ({ default: module.DocumentCenterPage })),
);

const resourcePagesModule = () => import("./pages/dashboard/ResourcePages");
const AdminsPage = lazy(() => resourcePagesModule().then((module) => ({ default: module.AdminsPage })));
const BusinessesPage = lazy(() =>
  resourcePagesModule().then((module) => ({ default: module.BusinessesPage })),
);
const ClassesPage = lazy(() => resourcePagesModule().then((module) => ({ default: module.ClassesPage })));
const InvoicesPage = lazy(() => resourcePagesModule().then((module) => ({ default: module.InvoicesPage })));
const InvestmentsByProposalPage = lazy(() =>
  resourcePagesModule().then((module) => ({ default: module.InvestmentsByProposalPage })),
);
const InvestmentsPage = lazy(() =>
  resourcePagesModule().then((module) => ({ default: module.InvestmentsPage })),
);
const NegotiationsPage = lazy(() =>
  resourcePagesModule().then((module) => ({ default: module.NegotiationsPage })),
);
const NotificationsPage = lazy(() =>
  resourcePagesModule().then((module) => ({ default: module.NotificationsPage })),
);
const ProfitsBySalesPage = lazy(() =>
  resourcePagesModule().then((module) => ({ default: module.ProfitsBySalesPage })),
);
const ProfitsPage = lazy(() => resourcePagesModule().then((module) => ({ default: module.ProfitsPage })));
const SalesPage = lazy(() => resourcePagesModule().then((module) => ({ default: module.SalesPage })));
const SubmissionsPage = lazy(() =>
  resourcePagesModule().then((module) => ({ default: module.SubmissionsPage })),
);
const UsersPage = lazy(() => resourcePagesModule().then((module) => ({ default: module.UsersPage })));

const marketplacePagesModule = () => import("./pages/dashboard/MarketplacePages");
const AdminReviewQueuePage = lazy(() =>
  marketplacePagesModule().then((module) => ({ default: module.AdminReviewQueuePage })),
);
const AiRecommendationsPage = lazy(() =>
  marketplacePagesModule().then((module) => ({ default: module.AiRecommendationsPage })),
);
const CompareOpportunitiesPage = lazy(() =>
  marketplacePagesModule().then((module) => ({ default: module.CompareOpportunitiesPage })),
);
const DealRoomPage = lazy(() =>
  marketplacePagesModule().then((module) => ({ default: module.DealRoomPage })),
);
const OpportunitiesPage = lazy(() =>
  marketplacePagesModule().then((module) => ({ default: module.OpportunitiesPage })),
);
const OpportunityDetailPage = lazy(() =>
  marketplacePagesModule().then((module) => ({ default: module.OpportunityDetailPage })),
);
const SavedOpportunitiesPage = lazy(() =>
  marketplacePagesModule().then((module) => ({ default: module.SavedOpportunitiesPage })),
);

const integrationPagesModule = () => import("./pages/dashboard/IntegrationPages");
const ApiStatusPage = lazy(() =>
  integrationPagesModule().then((module) => ({ default: module.ApiStatusPage })),
);
const BusinessProfilePage = lazy(() =>
  integrationPagesModule().then((module) => ({ default: module.BusinessProfilePage })),
);
const InvestorPreferencesPage = lazy(() =>
  integrationPagesModule().then((module) => ({ default: module.InvestorPreferencesPage })),
);
const ProfilePage = lazy(() =>
  integrationPagesModule().then((module) => ({ default: module.ProfilePage })),
);

const walletPagesModule = () => import("./pages/dashboard/WalletPages");
const AdminBanksPage = lazy(() =>
  walletPagesModule().then((module) => ({ default: module.AdminBanksPage })),
);
const AdminWithdrawalsPage = lazy(() =>
  walletPagesModule().then((module) => ({ default: module.AdminWithdrawalsPage })),
);
const InvestorBankAccountsPage = lazy(() =>
  walletPagesModule().then((module) => ({ default: module.InvestorBankAccountsPage })),
);
const InvestorWalletPage = lazy(() =>
  walletPagesModule().then((module) => ({ default: module.InvestorWalletPage })),
);

function RoleRedirect() {
  const { user } = useAuth();
  return <Navigate to={dashboardPathFor(user?.role ?? "umkm")} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm font-semibold text-neutral/60">Loading...</div>}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/tentang" element={<AboutPage />} />
            <Route path="/layanan" element={<ServicesPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/portfolio/:slug" element={<PortfolioDetailPage />} />
            <Route path="/bantuan" element={<HelpCenterPage />} />
            <Route path="/keamanan" element={<TrustSafetyPage />} />
            <Route path="/trust" element={<TrustSafetyPage />} />
            <Route path="/syarat" element={<TermsPage />} />
            <Route path="/privasi" element={<PrivacyPage />} />
            <Route path="/kontak" element={<ContactPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<RoleRedirect />} />
          </Route>

          <Route element={<ProtectedRoute roles={["umkm"]} />}>
            <Route path="/dashboard/umkm" element={<DashboardLayout />}>
              <Route index element={<UmkmOverviewPage />} />
              <Route path="onboarding" element={<UmkmOnboardingPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="dokumen" element={<DocumentCenterPage />} />
              <Route path="bisnis" element={<BusinessesPage scope="mine" />} />
              <Route path="bisnis-profile" element={<BusinessProfilePage />} />
              <Route path="pengajuan" element={<SubmissionsPage />} />
              <Route path="penjualan" element={<SalesPage />} />
              <Route path="investasi" element={<InvestmentsByProposalPage />} />
              <Route path="profit" element={<ProfitsBySalesPage />} />
              <Route path="negosiasi" element={<NegotiationsPage mine />} />
              <Route path="notifikasi" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["investor"]} />}>
            <Route path="/dashboard/investor" element={<DashboardLayout />}>
              <Route index element={<InvestorOverviewPage />} />
              <Route path="onboarding" element={<InvestorOnboardingPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="rekening" element={<InvestorBankAccountsPage />} />
              <Route path="dokumen" element={<DocumentCenterPage />} />
              <Route path="preferensi" element={<InvestorPreferencesPage />} />
              <Route path="survey" element={<InvestorSurveyPage />} />
              <Route path="peluang" element={<OpportunitiesPage />} />
              <Route path="peluang/:id" element={<OpportunityDetailPage />} />
              <Route path="saved" element={<SavedOpportunitiesPage />} />
              <Route path="compare" element={<CompareOpportunitiesPage />} />
              <Route path="rekomendasi" element={<AiRecommendationsPage />} />
              <Route path="negosiasi" element={<NegotiationsPage mine />} />
              <Route path="deal-room/:id" element={<DealRoomPage />} />
              <Route path="kelas" element={<ClassesPage />} />
              <Route path="wallet" element={<InvestorWalletPage />} />
              <Route path="invoice" element={<InvoicesPage investor />} />
              <Route path="portfolio" element={<InvestmentsPage investor />} />
              <Route path="profit" element={<ProfitsPage investor />} />
              <Route path="notifikasi" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["admin", "superadmin"]} />}>
            <Route path="/dashboard/admin" element={<DashboardLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="api-status" element={<ApiStatusPage />} />
              <Route path="review" element={<AdminReviewQueuePage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="bisnis" element={<BusinessesPage scope="admin" />} />
              <Route path="bisnis-profile" element={<BusinessProfilePage />} />
              <Route path="pengajuan" element={<SubmissionsPage admin />} />
              <Route path="penjualan" element={<SalesPage />} />
              <Route path="negosiasi" element={<NegotiationsPage />} />
              <Route path="kelas" element={<ClassesPage />} />
              <Route path="invoice" element={<InvoicesPage />} />
              <Route path="investasi" element={<InvestmentsPage />} />
              <Route path="profit" element={<ProfitsPage />} />
              <Route path="admins" element={<AdminsPage />} />
              <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="banks" element={<AdminBanksPage />} />
              <Route path="notifikasi" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
