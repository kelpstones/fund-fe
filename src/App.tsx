import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { AboutPage } from "./pages/public/AboutPage";
import { ContactPage } from "./pages/public/ContactPage";
import { HomePage } from "./pages/public/HomePage";
import { PortfolioPage } from "./pages/public/PortfolioPage";
import { PortfolioDetailPage } from "./pages/public/PortfolioDetailPage";
import { ServicesPage } from "./pages/public/ServicesPage";
import { HelpCenterPage } from "./pages/public/HelpCenterPage";
import { TrustSafetyPage } from "./pages/public/TrustSafetyPage";
import { TermsPage } from "./pages/public/TermsPage";
import { PrivacyPage } from "./pages/public/PrivacyPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { dashboardPathFor, useAuth } from "./lib/auth/AuthProvider";
import {
  AdminOverviewPage,
  InvestorOverviewPage,
  UmkmOverviewPage,
} from "./pages/dashboard/OverviewPages";
import { UmkmOnboardingPage } from "./pages/dashboard/UmkmOnboardingPage";
import { InvestorOnboardingPage } from "./pages/dashboard/InvestorOnboardingPage";
import {
  AdminsPage,
  BusinessesPage,
  ClassesPage,
  InvoicesPage,
  InvestmentsByProposalPage,
  InvestmentsPage,
  NegotiationsPage,
  NotificationsPage,
  ProfitsBySalesPage,
  ProfitsPage,
  SalesPage,
  SubmissionsPage,
  UsersPage,
} from "./pages/dashboard/ResourcePages";
import {
  AdminReviewQueuePage,
  AiRecommendationsPage,
  CompareOpportunitiesPage,
  DealRoomPage,
  OpportunitiesPage,
  OpportunityDetailPage,
  SavedOpportunitiesPage,
} from "./pages/dashboard/MarketplacePages";
import {
  ApiStatusPage,
  BusinessProfilePage,
  InvestorPreferencesPage,
  ProfilePage,
} from "./pages/dashboard/IntegrationPages";
import { InvestorSurveyPage } from "./pages/dashboard/InvestorSurveyPage";
import { DocumentCenterPage } from "./pages/dashboard/DocumentCenterPage";

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
            <Route path="notifikasi" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
