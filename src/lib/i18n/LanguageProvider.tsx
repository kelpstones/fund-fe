import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "id" | "en";

export type TranslationKey = string;

const labels: Record<Language, string> = {
  id: "Indonesia",
  en: "English",
};

const translations: Record<Language, Record<TranslationKey, string>> = {
  id: {
    language: "Bahasa",
    logout: "Logout",
    workspaceTitle: "FundRaise Workspace",
    loginTitle: "Login",
    loginSubtitle: "Masuk ke dashboard FundRaise.",
    email: "Email",
    password: "Password",
    loginButton: "Login",
    loginError: "Login gagal. Periksa email dan password.",
    noAccount: "Belum punya akun?",
    registerLink: "Register",
    registerTitle: "Register",
    registerSubtitle: "Buat akun UMKM atau investor.",
    roleUmkm: "UMKM",
    roleInvestor: "Investor",
    name: "Nama",
    nik: "NIK",
    phone: "No. Telp",
    confirmPassword: "Konfirmasi Password",
    registerButton: "Register",
    hasAccount: "Sudah punya akun?",
    loginLink: "Login",
    navHome: "Beranda",
    navAbout: "Tentang",
    navServices: "Layanan",
    navPortfolio: "Portfolio",
    navContact: "Kontak",
    getStarted: "Mulai",
    navigation: "Navigasi",
    dashboardOverview: "Overview",
    dashboardOnboarding: "Onboarding",
    dashboardProfile: "Profile",
    dashboardBusiness: "Bisnis",
    dashboardBusinessModel: "Profil Model",
    dashboardSubmissions: "Pengajuan",
    dashboardSales: "Penjualan",
    dashboardNegotiations: "Negosiasi",
    dashboardNotifications: "Notifikasi",
    dashboardOpportunities: "Peluang",
    dashboardRecommendations: "AI Match",
    dashboardPreferences: "Preferensi",
    dashboardSurvey: "Survey",
    dashboardSaved: "Tersimpan",
    dashboardCompare: "Compare",
    dashboardDealRoom: "Deal Room",
    dashboardReviewQueue: "Review Queue",
    dashboardInvoices: "Invoice",
    dashboardPortfolio: "Portfolio",
    dashboardProfit: "Profit",
    dashboardSystemStatus: "Status Sistem",
    dashboardUsers: "Users",
    dashboardClasses: "Kelas",
    dashboardInvestments: "Investasi",
    dashboardAdmins: "Admin",
    dashboardGroupMain: "Utama",
    dashboardGroupAccount: "Akun",
    dashboardGroupBusiness: "Bisnis",
    dashboardGroupFunding: "Pendanaan",
    dashboardGroupTransactions: "Transaksi",
    dashboardGroupSystem: "Sistem",
  },
  en: {
    language: "Language",
    logout: "Logout",
    workspaceTitle: "FundRaise Workspace",
    loginTitle: "Login",
    loginSubtitle: "Sign in to your FundRaise dashboard.",
    email: "Email",
    password: "Password",
    loginButton: "Login",
    loginError: "Login failed. Check your email and password.",
    noAccount: "Don't have an account?",
    registerLink: "Register",
    registerTitle: "Register",
    registerSubtitle: "Create an UMKM or investor account.",
    roleUmkm: "UMKM",
    roleInvestor: "Investor",
    name: "Name",
    nik: "NIK",
    phone: "Phone Number",
    confirmPassword: "Confirm Password",
    registerButton: "Register",
    hasAccount: "Already have an account?",
    loginLink: "Login",
    navHome: "Home",
    navAbout: "About",
    navServices: "Services",
    navPortfolio: "Portfolio",
    navContact: "Contact",
    getStarted: "Get Started",
    navigation: "Navigation",
    dashboardOverview: "Overview",
    dashboardOnboarding: "Onboarding",
    dashboardProfile: "Profile",
    dashboardBusiness: "Business",
    dashboardBusinessModel: "Model Profile",
    dashboardSubmissions: "Submissions",
    dashboardSales: "Sales",
    dashboardNegotiations: "Negotiations",
    dashboardNotifications: "Notifications",
    dashboardOpportunities: "Opportunities",
    dashboardRecommendations: "AI Match",
    dashboardPreferences: "Preferences",
    dashboardSurvey: "Survey",
    dashboardSaved: "Saved",
    dashboardCompare: "Compare",
    dashboardDealRoom: "Deal Room",
    dashboardReviewQueue: "Review Queue",
    dashboardInvoices: "Invoices",
    dashboardPortfolio: "Portfolio",
    dashboardProfit: "Profit",
    dashboardSystemStatus: "System Status",
    dashboardUsers: "Users",
    dashboardClasses: "Classes",
    dashboardInvestments: "Investments",
    dashboardAdmins: "Admins",
    dashboardGroupMain: "Main",
    dashboardGroupAccount: "Account",
    dashboardGroupBusiness: "Business",
    dashboardGroupFunding: "Funding",
    dashboardGroupTransactions: "Transactions",
    dashboardGroupSystem: "System",
  },
};

Object.assign(translations.id, {
  homeHeroTitle: "Pendanaan UMKM yang lebih tepat dengan AI Matchmaking",
  homeHeroBody:
    "FundRaise membantu UMKM membangun profil pendanaan dan membantu investor menemukan peluang yang sesuai dengan preferensi, risiko, dan target return.",
  homePrimaryCta: "Mulai Sekarang",
  homeSecondaryCta: "Lihat Alur",
  homeProofFunding: "Pendanaan termonitor",
  homeProofScore: "Skor match rata-rata",
  homeProofUmkm: "UMKM aktif",
  homePhoneAllocation: "Alokasi tersedia",
  homePhoneNegotiation: "Negosiasi aktif",
  homePhoneInvoice: "Invoice pending",
  homePhoneProfit: "Distribusi profit",
  homeFloatCollected: "Rp164jt terkumpul",
  homeFloatInvestorMatch: "Investor match",
  homeFloatComparison: "Comparison",
  homeStepProfileTitle: "Profil bisnis dibaca sistem",
  homeStepProfileBody:
    "Data sektor, performa penjualan, risiko, kebutuhan modal, dan proyeksi return dirangkum menjadi sinyal pendanaan.",
  homeStepInvestorTitle: "Investor mendapat rekomendasi",
  homeStepInvestorBody:
    "Preferensi nominal, toleransi risiko, minat sektor, dan target return dipakai untuk membuat daftar peluang yang relevan.",
  homeStepDealTitle: "Negosiasi sampai investasi",
  homeStepDealBody:
    "Penawaran, invoice, investasi, dan distribusi profit dipantau dalam satu dashboard multi-role.",
  homeWorkflowTitle: "Dari proposal sampai profit sharing",
  homeWorkflowBody:
    "UMKM, investor, dan admin mendapat ruang kerja yang berbeda namun tetap tersambung pada data pengajuan, negosiasi, invoice, investasi, dan distribusi profit.",
  homeWorkflowUmkm:
    "Profil bisnis, pengajuan dana, laporan penjualan, negosiasi.",
  homeWorkflowInvestor:
    "Peluang pendanaan, rekomendasi AI, invoice, portfolio.",
  homeWorkflowAdmin:
    "Approval pengajuan, kelas bisnis, admin management, monitoring.",
  homeWorkflowAi:
    "Skor kecocokan, alasan rekomendasi, filter risiko dan return.",
  updatedToday: "Diperbarui hari ini",
  metricMatch: "Match",
  metricReturn: "Return",
  metricRisk: "Risk",
  metricTarget: "Target",
  footerBody:
    "Platform pendanaan UMKM dengan rekomendasi investasi yang lebih relevan melalui AI-based matchmaking.",
  footerWorkspaceBody:
    "Matching UMKM, investor, negosiasi, invoice, investasi, dan distribusi profit dalam satu workspace.",
  footerCopyright: "© {year} FundRaise. Seluruh hak cipta dilindungi.",
  footerBuiltBy: "Dibangun oleh Tim Kelpstone.",
  openMenu: "Buka menu",
  closeMenu: "Tutup menu",
  subject: "Subjek",
  message: "Pesan",
  sendMessage: "Kirim Pesan",
  aboutHeroTitle: "Infrastruktur pendanaan untuk UMKM dan investor modern",
  aboutHeroBody:
    "FundRaise dibuat untuk mempertemukan pemilik usaha dan investor melalui data bisnis, preferensi investasi, negosiasi yang jelas, dan monitoring investasi yang rapi.",
  aboutImageAlt: "Ekosistem FundRaise",
  aboutTeamTitle: "Capstone Project Tim Kelpstone",
  aboutTeamBody:
    "FundRaise adalah capstone project dari tim Kelpstone. Proyek ini dikembangkan untuk Coding Camp 2026 powered by DBS Foundation.",
  aboutMemberAlt: "Foto {name}",
  aboutValueContextTitle: "Konteks bisnis dibaca utuh",
  aboutValueContextBody:
    "Profil UMKM tidak hanya dilihat dari nominal pendanaan, tapi juga performa, kelas bisnis, dan sinyal risiko.",
  aboutValuePreferenceTitle: "Preferensi investor dihormati",
  aboutValuePreferenceBody:
    "Investor dapat memprioritaskan sektor, target return, nominal, dan toleransi risiko yang masuk akal.",
  aboutValueScoreTitle: "Rekomendasi berbasis skor",
  aboutValueScoreBody:
    "Matchmaking menampilkan skor kecocokan agar keputusan investasi lebih transparan.",
  aboutValueAdminTitle: "Proses terkontrol admin",
  aboutValueAdminBody:
    "Admin menjaga kualitas data bisnis, approval pengajuan, invoice, investasi, dan profit sharing.",
  servicesHeroTitle: "Satu sistem untuk alur pendanaan UMKM",
  servicesHeroBody:
    "Semua modul utama MVP disusun untuk mendukung alur dari registrasi, profil bisnis, pengajuan, matching, negosiasi, invoice, sampai distribusi profit.",
  servicesImageAlt: "Operasional pendanaan FundRaise",
  servicesBusinessTitle: "Profil Bisnis UMKM",
  servicesBusinessBody:
    "Data bisnis, kelas, performa tahunan, dan indikator operasional.",
  servicesSubmissionTitle: "Pengajuan Pendanaan",
  servicesSubmissionBody:
    "Target modal, progress pendanaan, return tahunan, dan approval admin.",
  servicesAiTitle: "AI Matchmaking",
  servicesAiBody:
    "Skor kecocokan investor dan UMKM berdasarkan preferensi dan risiko.",
  servicesNegotiationTitle: "Negosiasi",
  servicesNegotiationBody:
    "Penawaran nominal, return, catatan, accept, reject, dan riwayat interaksi.",
  servicesInvoiceTitle: "Invoice & Investasi",
  servicesInvoiceBody:
    "Invoice investor, pembayaran, pencatatan investasi, dan portfolio.",
  servicesProfitTitle: "Distribusi Profit",
  servicesProfitBody:
    "Profit dari laporan penjualan dipantau untuk investor dan admin.",
  contactHeroTitle: "Hubungkan tim, UMKM, dan investor",
  contactHeroBody:
    "FundRaise disiapkan sebagai platform MVP yang dapat berkembang mengikuti kebutuhan operasional pendanaan.",
  contactImageAlt: "Tim FundRaise",
  portfolioHeroTitle: "Preview marketplace peluang UMKM",
  portfolioHeroBody:
    "Investor dapat menelusuri peluang, menyimpan kandidat, membandingkan UMKM, lalu membuka detail sebelum memulai negosiasi.",
  portfolioCta: "Mulai Sebagai Investor",
  portfolioSearchPlaceholder: "Cari sektor, kota, atau nama UMKM",
  portfolioMarketplaceTitle:
    "Discovery seperti marketplace, proses seperti deal platform",
  portfolioMarketplaceBody:
    "Public preview ini menunjukkan arah produk: investor dapat menemukan peluang, membandingkan, menyimpan, lalu masuk ke dashboard untuk survey, detail, negosiasi, invoice, dan portfolio.",
  investorWorkflow: "Investor workflow",
  allRisk: "Semua risiko",
  allSectors: "Semua sektor",
  save: "Simpan",
  saved: "Tersimpan",
  detail: "Detail",
  compare: "Compare",
  photoPlaceholder: "Placeholder foto",
  photoPlaceholderBody: "Ganti area ini dengan foto asli",
});

Object.assign(translations.en, {
  homeHeroTitle: "Smarter UMKM funding with AI matchmaking",
  homeHeroBody:
    "FundRaise helps UMKM build funding profiles and helps investors find opportunities that match their preferences, risk appetite, and return targets.",
  homePrimaryCta: "Start Now",
  homeSecondaryCta: "View Flow",
  homeProofFunding: "Tracked funding",
  homeProofScore: "Average match score",
  homeProofUmkm: "Active UMKM",
  homePhoneAllocation: "Available allocation",
  homePhoneNegotiation: "Active negotiation",
  homePhoneInvoice: "Pending invoice",
  homePhoneProfit: "Profit distribution",
  homeFloatCollected: "Rp164m collected",
  homeFloatInvestorMatch: "Investor match",
  homeFloatComparison: "Comparison",
  homeStepProfileTitle: "Business profiles are read by the system",
  homeStepProfileBody:
    "Sector data, sales performance, risk, capital needs, and projected returns are summarized into funding signals.",
  homeStepInvestorTitle: "Investors get recommendations",
  homeStepInvestorBody:
    "Nominal preferences, risk tolerance, sector interests, and return targets shape a relevant opportunity list.",
  homeStepDealTitle: "Negotiate through investment",
  homeStepDealBody:
    "Offers, invoices, investments, and profit distributions are tracked in one multi-role dashboard.",
  homeWorkflowTitle: "From proposal to profit sharing",
  homeWorkflowBody:
    "UMKM, investors, and admins get different workspaces while staying connected through submissions, negotiations, invoices, investments, and profit distributions.",
  homeWorkflowUmkm:
    "Business profile, funding submissions, sales reports, negotiations.",
  homeWorkflowInvestor:
    "Funding opportunities, AI recommendations, invoices, portfolio.",
  homeWorkflowAdmin:
    "Submission approvals, business classes, admin management, monitoring.",
  homeWorkflowAi:
    "Match scores, recommendation reasons, risk and return filters.",
  updatedToday: "Updated today",
  metricMatch: "Match",
  metricReturn: "Return",
  metricRisk: "Risk",
  metricTarget: "Target",
  footerBody:
    "UMKM funding platform with more relevant investment recommendations through AI-based matchmaking.",
  footerWorkspaceBody:
    "UMKM matching, investors, negotiations, invoices, investments, and profit distribution in one workspace.",
  footerCopyright: "© {year} FundRaise. All rights reserved.",
  footerBuiltBy: "Built by Team Kelpstone.",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  subject: "Subject",
  message: "Message",
  sendMessage: "Send Message",
  aboutHeroTitle: "Funding infrastructure for modern UMKM and investors",
  aboutHeroBody:
    "FundRaise connects business owners and investors through business data, investment preferences, clear negotiations, and organized investment monitoring.",
  aboutImageAlt: "FundRaise ecosystem",
  aboutTeamTitle: "Kelpstone Team Capstone Project",
  aboutTeamBody:
    "FundRaise is the capstone project from Team Kelpstone, developed for Coding Camp 2026 powered by DBS Foundation.",
  aboutMemberAlt: "Photo of {name}",
  "Full-Stack Web Developer": "Full-Stack Web Developer",
  "Data Scientist": "Data Scientist",
  "AI Engineer": "AI Engineer",
  aboutValueContextTitle: "Business context is read fully",
  aboutValueContextBody:
    "UMKM profiles are assessed beyond funding amount, including performance, business class, and risk signals.",
  aboutValuePreferenceTitle: "Investor preferences are respected",
  aboutValuePreferenceBody:
    "Investors can prioritize sectors, return targets, nominal ranges, and reasonable risk tolerance.",
  aboutValueScoreTitle: "Score-based recommendations",
  aboutValueScoreBody:
    "Matchmaking shows compatibility scores so investment decisions are more transparent.",
  aboutValueAdminTitle: "Admin-controlled process",
  aboutValueAdminBody:
    "Admins maintain business data quality, submission approval, invoices, investments, and profit sharing.",
  servicesHeroTitle: "One system for the UMKM funding flow",
  servicesHeroBody:
    "Core MVP modules support the flow from registration, business profiles, submissions, matching, negotiations, invoices, to profit distribution.",
  servicesImageAlt: "FundRaise funding operations",
  servicesBusinessTitle: "UMKM Business Profile",
  servicesBusinessBody:
    "Business data, classes, annual performance, and operational indicators.",
  servicesSubmissionTitle: "Funding Submissions",
  servicesSubmissionBody:
    "Capital target, funding progress, annual return, and admin approval.",
  servicesAiTitle: "AI Matchmaking",
  servicesAiBody:
    "Investor and UMKM compatibility scores based on preferences and risk.",
  servicesNegotiationTitle: "Negotiation",
  servicesNegotiationBody:
    "Offer nominal, return, notes, accept, reject, and interaction history.",
  servicesInvoiceTitle: "Invoices & Investments",
  servicesInvoiceBody:
    "Investor invoices, payments, investment records, and portfolio.",
  servicesProfitTitle: "Profit Distribution",
  servicesProfitBody:
    "Profit from sales reports is tracked for investors and admins.",
  contactHeroTitle: "Connect teams, UMKM, and investors",
  contactHeroBody:
    "FundRaise is prepared as an MVP platform that can evolve with operational funding needs.",
  contactImageAlt: "FundRaise team",
  portfolioHeroTitle: "UMKM opportunity marketplace preview",
  portfolioHeroBody:
    "Investors can browse opportunities, save candidates, compare UMKM, then open details before starting negotiations.",
  portfolioCta: "Start as Investor",
  portfolioSearchPlaceholder: "Search sector, city, or UMKM name",
  portfolioMarketplaceTitle:
    "Marketplace-style discovery, deal-platform process",
  portfolioMarketplaceBody:
    "This public preview shows the product direction: investors can discover opportunities, compare, save, then enter the dashboard for surveys, details, negotiations, invoices, and portfolio.",
  investorWorkflow: "Investor workflow",
  allRisk: "All risks",
  allSectors: "All sectors",
  save: "Save",
  saved: "Saved",
  detail: "Detail",
  compare: "Compare",
  photoPlaceholder: "Photo placeholder",
  photoPlaceholderBody: "Replace this area with a real photo",
});

Object.assign(translations.id, {
  forgotPasswordLink: "Lupa password?",
  forgotPasswordTitle: "Lupa Password",
  forgotPasswordSubtitle:
    "Masukkan email terdaftar. Kami akan mengirimkan link reset password.",
  forgotPasswordSuccessPrefix: "Link reset password telah dikirim ke",
  forgotPasswordSuccessSuffix: "Periksa inbox atau folder spam kamu.",
  forgotPasswordError:
    "Gagal mengirim email. Periksa alamat email dan coba lagi.",
  sendResetLink: "Kirim Link Reset",
  backToLogin: "Kembali ke Login",
  passwordConfirmationMismatch: "Konfirmasi password tidak cocok.",
  registerSuccessVerifyEmail:
    "Registrasi berhasil. Cek email kamu untuk verifikasi sebelum login.",
  registerError: "Registrasi gagal. Periksa data kamu dan coba lagi.",
  resetUnavailable: "Fitur reset password belum tersedia saat ini.",
  resetPasswordTitle: "Reset Password",
  resetPasswordSubtitle: "Masukkan password baru untuk akun kamu.",
  resetToken: "Token Reset",
  tokenFromEmail: "Token dari email",
  newPassword: "Password Baru",
  resetPasswordButton: "Reset Password",
  resetPasswordSuccess: "Password berhasil direset. Silakan login.",
  resetPasswordError: "Gagal mereset password. Token mungkin sudah kadaluarsa.",
  verifyTokenMissing: "Token verifikasi tidak ditemukan di URL.",
  verifySuccessMessage: "Email berhasil diverifikasi! Kamu sudah bisa login.",
  verifyUnavailable: "Fitur verifikasi email belum tersedia saat ini.",
  verifyFailedMessage:
    "Verifikasi gagal. Token mungkin sudah kadaluarsa atau tidak valid.",
  verifyResendSuccess:
    "Email verifikasi baru telah dikirim. Periksa inbox kamu.",
  featureUnavailable: "Fitur ini belum tersedia saat ini.",
  verifyResendError: "Gagal mengirim ulang. Coba beberapa saat lagi.",
  verifyLoading: "Memverifikasi email kamu...",
  verifySuccessTitle: "Email Terverifikasi",
  verifyFailedTitle: "Verifikasi Gagal",
  verifyResendLabel: "Kirim ulang email verifikasi:",
  yourEmail: "Email kamu",
  send: "Kirim",
  loginNow: "Masuk Sekarang",
  dataUnavailable: "Data belum tersedia",
  item: "Item",
  actionFailed: "Aksi gagal",
  actionFailedMessage:
    "Terjadi kendala saat memproses aksi. Coba ulangi beberapa saat lagi.",
  dataUpdated: "Data diperbarui",
  dataAdded: "Data ditambahkan",
  dataDeleted: "Data dihapus",
  saveFailed: "Gagal menyimpan",
  saveFailedMessage:
    "Perubahan belum berhasil diproses. Coba ulangi beberapa saat lagi.",
  resourceUpdateSuccess: "{title} berhasil diperbarui.",
  resourceCreateSuccess: "{title} berhasil ditambahkan.",
  resourceDeleteSuccess: "{title} berhasil dihapus.",
  deleteDataTitle: "Hapus data?",
  deleteDataMessage:
    "Data yang dihapus tidak bisa dikembalikan dari tampilan ini.",
  delete: "Hapus",
  deletingData: "Menghapus data",
  deletingDataMessage: "Mohon tunggu, sistem sedang memproses penghapusan.",
  processingAction: "Memproses aksi",
  processingActionMessage: "{action} sedang diproses. Mohon tunggu sebentar.",
  actionSuccess: "Aksi berhasil",
  actionSuccessMessage: "{action} berhasil diproses.",
  confirmAction: "Konfirmasi aksi",
  loadingDetail: "Mengambil detail",
  loadingDetailMessage: "Mohon tunggu, detail data sedang disiapkan.",
  detailData: "Detail Data",
  detailReady: "Detail siap",
  detailReadyMessage: "Detail data berhasil dimuat.",
  editData: "Edit Data",
  cancel: "Batal",
  loading: "Memuat",
  loadingData: "Memuat data",
  noFilterMatchInline: "Tidak ada data yang cocok dengan filter saat ini.",
  available: "Tersedia",
  unavailable: "Belum tersedia",
});

Object.assign(translations.en, {
  forgotPasswordLink: "Forgot password?",
  forgotPasswordTitle: "Forgot Password",
  forgotPasswordSubtitle:
    "Enter your registered email. We will send a password reset link.",
  forgotPasswordSuccessPrefix: "A reset password link has been sent to",
  forgotPasswordSuccessSuffix: "Check your inbox or spam folder.",
  forgotPasswordError:
    "Failed to send email. Check the email address and try again.",
  sendResetLink: "Send Reset Link",
  backToLogin: "Back to Login",
  passwordConfirmationMismatch: "Password confirmation does not match.",
  registerSuccessVerifyEmail:
    "Registration successful. Check your email for verification before logging in.",
  registerError: "Registration failed. Check your data and try again.",
  resetUnavailable: "Password reset is not available right now.",
  resetPasswordTitle: "Reset Password",
  resetPasswordSubtitle: "Enter a new password for your account.",
  resetToken: "Reset Token",
  tokenFromEmail: "Token from email",
  newPassword: "New Password",
  resetPasswordButton: "Reset Password",
  resetPasswordSuccess: "Password has been reset. Please log in.",
  resetPasswordError: "Failed to reset password. The token may have expired.",
  verifyTokenMissing: "Verification token was not found in the URL.",
  verifySuccessMessage: "Email verified successfully! You can now log in.",
  verifyUnavailable: "Email verification is not available right now.",
  verifyFailedMessage:
    "Verification failed. The token may have expired or is invalid.",
  verifyResendSuccess:
    "A new verification email has been sent. Check your inbox.",
  featureUnavailable: "This feature is not available right now.",
  verifyResendError: "Failed to resend. Try again in a moment.",
  verifyLoading: "Verifying your email...",
  verifySuccessTitle: "Email Verified",
  verifyFailedTitle: "Verification Failed",
  verifyResendLabel: "Resend verification email:",
  yourEmail: "Your email",
  send: "Send",
  loginNow: "Log In Now",
  dataUnavailable: "Data is not available",
  item: "Item",
  actionFailed: "Action failed",
  actionFailedMessage:
    "Something went wrong while processing the action. Try again later.",
  dataUpdated: "Data updated",
  dataAdded: "Data added",
  dataDeleted: "Data deleted",
  saveFailed: "Save failed",
  saveFailedMessage: "The changes could not be processed. Try again later.",
  resourceUpdateSuccess: "{title} was updated successfully.",
  resourceCreateSuccess: "{title} was added successfully.",
  resourceDeleteSuccess: "{title} was deleted successfully.",
  deleteDataTitle: "Delete data?",
  deleteDataMessage: "Deleted data cannot be restored from this view.",
  delete: "Delete",
  deletingData: "Deleting data",
  deletingDataMessage: "Please wait while the system processes the deletion.",
  processingAction: "Processing action",
  processingActionMessage: "{action} is being processed. Please wait.",
  actionSuccess: "Action successful",
  actionSuccessMessage: "{action} was processed successfully.",
  confirmAction: "Confirm action",
  loadingDetail: "Loading detail",
  loadingDetailMessage: "Please wait while the detail is prepared.",
  detailData: "Data Detail",
  detailReady: "Detail ready",
  detailReadyMessage: "Detail data was loaded successfully.",
  editData: "Edit Data",
  cancel: "Cancel",
  loading: "Loading",
  loadingData: "Loading data",
  noFilterMatchInline: "No data matches the current filters.",
  available: "Available",
  unavailable: "Unavailable",
});

Object.assign(translations.id, {
  aiMatchScore: "AI Match Score",
  matchDataEmpty:
    "Belum ada data match. Lengkapi data bisnis atau preferensi investor terlebih dahulu.",
  latestUpdates: "Update terakhir",
  latestUpdatesEmpty: "Belum ada update terbaru.",
  umkmOverviewTitle: "Pantau bisnis, pengajuan, dan investor yang cocok",
  umkmOverviewBody:
    "Workspace UMKM menampilkan kesehatan bisnis, status pengajuan, laporan penjualan, serta interaksi negosiasi dengan investor.",
  investorOverviewTitle: "Temukan peluang UMKM yang sesuai preferensi",
  investorOverviewBody:
    "Investor melihat peluang pendanaan, rekomendasi AI, negosiasi, invoice, portfolio investasi, dan distribusi profit.",
  adminOverviewTitle: "Kontrol kualitas data dan proses pendanaan",
  adminOverviewBody:
    "Admin mengelola bisnis, pengajuan, kelas, invoice, investasi, distribusi profit, admin management, dan notifikasi operasional.",
  business: "Bisnis",
  sales: "Penjualan",
  investor: "Investor",
  investors: "Investor",
  totalFunding: "Total Pendanaan",
  activeProfile: "Profil aktif",
  collected: "Terkumpul",
  fromReports: "Dari laporan",
  relatedInvestors: "Investor terkait",
  umkmReadinessTitle: "UMKM onboarding readiness",
  umkmReadinessBody:
    "Ikuti urutan profil bisnis, model scoring, pengajuan dana, review admin, dan negosiasi agar peluang siap masuk marketplace investor.",
  progress: "Progress",
  openOnboarding: "Buka Onboarding",
  opportunities: "Peluang",
  availableSubmissions: "Pengajuan tersedia",
  investments: "Investasi",
  activePortfolio: "Portfolio aktif",
  profit: "Profit",
  invoice: "Invoice",
  investorBills: "Tagihan investor",
  pendingAmount: "{amount} pending",
  activeInvestments: "Investasi aktif",
  activeInvestmentCount: "{count} investasi aktif",
  noActiveInvestments: "Belum ada investasi aktif",
  noActiveInvestmentsBody:
    "Investasi aktif akan muncul setelah ada invoice yang dibayar dan deal berjalan.",
  registered: "Terdaftar",
  submissions: "Pengajuan",
  pendingCount: "{count} pending",
  users: "Users",
  platformAccounts: "Akun platform",
  notifications: "Notifikasi",
  operational: "Operasional",
  submissionStatus: "Status pengajuan",
});

Object.assign(translations.en, {
  aiMatchScore: "AI Match Score",
  matchDataEmpty:
    "No match data yet. Complete business data or investor preferences first.",
  latestUpdates: "Latest updates",
  latestUpdatesEmpty: "No recent updates yet.",
  umkmOverviewTitle: "Monitor business, submissions, and matching investors",
  umkmOverviewBody:
    "The UMKM workspace shows business health, submission status, sales reports, and negotiation interactions with investors.",
  investorOverviewTitle: "Find UMKM opportunities that match your preferences",
  investorOverviewBody:
    "Investors see funding opportunities, AI recommendations, negotiations, invoices, investment portfolio, and profit distributions.",
  adminOverviewTitle: "Control data quality and funding operations",
  adminOverviewBody:
    "Admins manage businesses, submissions, classes, invoices, investments, profit distributions, admin management, and operational notifications.",
  business: "Business",
  sales: "Sales",
  investor: "Investor",
  investors: "Investors",
  totalFunding: "Total Funding",
  activeProfile: "Active profile",
  collected: "Collected",
  fromReports: "From reports",
  relatedInvestors: "Related investors",
  umkmReadinessTitle: "UMKM onboarding readiness",
  umkmReadinessBody:
    "Follow the sequence of business profile, scoring model, funding submission, admin review, and negotiation so opportunities are ready for the investor marketplace.",
  progress: "Progress",
  openOnboarding: "Open Onboarding",
  opportunities: "Opportunities",
  availableSubmissions: "Available submissions",
  investments: "Investments",
  activePortfolio: "Active portfolio",
  profit: "Profit",
  invoice: "Invoice",
  investorBills: "Investor bills",
  pendingAmount: "{amount} pending",
  activeInvestments: "Active investments",
  activeInvestmentCount: "{count} active investments",
  noActiveInvestments: "No active investments yet",
  noActiveInvestmentsBody:
    "Active investments will appear after invoices are paid and deals are running.",
  registered: "Registered",
  submissions: "Submissions",
  pendingCount: "{count} pending",
  users: "Users",
  platformAccounts: "Platform accounts",
  notifications: "Notifications",
  operational: "Operational",
  submissionStatus: "Submission status",
});

Object.assign(translations.id, {
  removeBookmark: "Hapus bookmark",
  saveOpportunity: "Simpan peluang",
  opportunityDefaultReason:
    "Peluang pendanaan UMKM dengan data bisnis, risiko, target modal, dan return yang bisa dibandingkan.",
  matchScoreValue: "Match score {score}",
  noOpportunities: "Belum ada peluang",
  noOpportunitiesBody:
    "Peluang UMKM akan tampil setelah pengajuan dipublikasikan atau rekomendasi investor tersedia.",
  marketplaceOpportunitiesTitle: "Marketplace Peluang UMKM",
  marketplaceOpportunitiesBody:
    "Telusuri peluang pendanaan seperti katalog investasi: simpan peluang, bandingkan UMKM, lalu buka detail sebelum memulai negosiasi.",
  savedCount: "Tersimpan ({count})",
  compareCount: "Compare ({count})",
  searchUmkmSectorCity: "Cari UMKM, sektor, kota",
  loadingOpportunities: "Memuat peluang",
  loadOpportunitiesError: "Gagal memuat peluang dari backend.",
  aiMatchMarketplaceTitle: "AI Match Marketplace",
  aiMatchMarketplaceBody:
    "Rekomendasi personal dari preferensi investor, disajikan sebagai katalog peluang dengan skor dan alasan match.",
  fillSurvey: "Isi Survey",
  refresh: "Refresh",
  minScore: "Min score",
  loadingRecommendations: "Memuat rekomendasi",
  recommendationsUnavailable:
    "Rekomendasi belum tersedia. Isi survey atau preferensi investor terlebih dahulu.",
  noRecommendations: "Belum ada rekomendasi",
  noRecommendationsBody:
    "Isi survey investor untuk menyiapkan preferensi matching.",
  startSurvey: "Mulai Survey",
  savedOpportunitiesInfo:
    "{count} peluang tersimpan. Buka halaman tersimpan untuk membandingkan pilihan.",
  savedOpportunitiesTitle: "Peluang Tersimpan",
  savedOpportunitiesBody:
    "Bookmark peluang UMKM yang ingin kamu review lagi sebelum masuk ke negosiasi.",
  compareAll: "Compare Semua",
  compareUmkmTitle: "Compare UMKM",
  compareUmkmBody:
    "Bandingkan peluang berdasarkan target pendanaan, return, risiko, progress, dan skor match sebelum mengambil keputusan.",
  addOpportunity: "Tambah Peluang",
  noCompareItems: "Belum ada peluang untuk dibandingkan",
  noCompareItemsBody: "Simpan atau pilih minimal dua peluang dari marketplace.",
  metric: "Metrik",
  sector: "Sektor",
  funded: "Terkumpul",
  risk: "Risiko",
  actions: "Aksi",
  opportunityNotFoundTitle: "Peluang tidak ditemukan",
  opportunityNotFoundBody:
    "Data peluang tidak tersedia di backend atau bookmark lokal.",
  backToMarketplace: "Kembali ke Marketplace",
  opportunityDetailBody:
    "Detail peluang UMKM untuk membantu investor memahami profil usaha, kebutuhan modal, risiko, dan langkah negosiasi.",
  location: "Lokasi",
  submissionId: "ID Pengajuan",
  status: "Status",
  documentsAndRiskSignals: "Dokumen dan sinyal risiko",
  businessProfile: "Profil Bisnis",
  salesReport: "Laporan Penjualan",
  riskMemo: "Risk Memo",
  startNegotiation: "Mulai Negosiasi",
  startNegotiationBody:
    "Ajukan nominal dan return yang kamu tawarkan ke UMKM. Setelah dibuat, lanjutkan proses di Deal Room.",
  offerNominal: "Nominal Penawaran",
  offerReturn: "Return Penawaran",
  notes: "Catatan",
  sendOffer: "Kirim Penawaran",
  viewNegotiations: "Lihat Negosiasi",
  negotiationStartedMessage:
    "Negosiasi berhasil dimulai. Buka Deal Room untuk memantau prosesnya.",
  negotiationStartError: "Negosiasi belum berhasil dibuat.",
  loadingOpportunityDetail: "Memuat detail peluang",
  dealRoomTitle: "Deal Room",
  dealRoomBody:
    "Ruang kerja satu transaksi: negosiasi, invoice, pembayaran, investasi, dan profit distribution dalam satu alur.",
  allNegotiations: "Semua Negosiasi",
  loadingDealRoom: "Memuat deal room",
  noActiveDeal: "Belum ada deal aktif",
  noActiveDealBody:
    "Mulai negosiasi dari halaman detail peluang untuk membuat deal room.",
  currentStatus: "Status saat ini",
  nominal: "Nominal",
  dealPipeline: "Pipeline Deal",
  negotiation: "Negosiasi",
  investment: "Investasi",
  dealPipelineNegotiation: "Penawaran dan counter offer investor-UMKM.",
  dealPipelineInvoice: "Tagihan dibuat setelah deal disetujui.",
  dealPipelineInvestment: "Pembayaran invoice mengaktifkan portfolio.",
  dealPipelineProfit:
    "Distribusi profit berjalan setelah penjualan dilaporkan.",
  adminReviewQueueTitle: "Admin Review Queue",
  adminReviewQueueBody:
    "Antrian review pengajuan yang membutuhkan keputusan admin. Fokus pada approval, bukan table generic.",
  viewAllSubmissions: "Lihat Semua Pengajuan",
  loadingReviewQueue: "Memuat review queue",
  loadReviewQueueError: "Gagal memuat review queue.",
  noPendingSubmissions: "Tidak ada pengajuan pending",
  noPendingSubmissionsBody:
    "Semua pengajuan sudah direview atau belum ada pengajuan baru.",
});

Object.assign(translations.en, {
  removeBookmark: "Remove bookmark",
  saveOpportunity: "Save opportunity",
  opportunityDefaultReason:
    "UMKM funding opportunity with comparable business data, risk, capital target, and return.",
  matchScoreValue: "Match score {score}",
  noOpportunities: "No opportunities yet",
  noOpportunitiesBody:
    "UMKM opportunities will appear after submissions are published or investor recommendations are available.",
  marketplaceOpportunitiesTitle: "UMKM Opportunity Marketplace",
  marketplaceOpportunitiesBody:
    "Browse funding opportunities like an investment catalog: save opportunities, compare UMKM, then open details before starting negotiations.",
  savedCount: "Saved ({count})",
  compareCount: "Compare ({count})",
  searchUmkmSectorCity: "Search UMKM, sector, city",
  loadingOpportunities: "Loading opportunities",
  loadOpportunitiesError: "Failed to load opportunities from backend.",
  aiMatchMarketplaceTitle: "AI Match Marketplace",
  aiMatchMarketplaceBody:
    "Personal recommendations from investor preferences, presented as an opportunity catalog with scores and match reasons.",
  fillSurvey: "Fill Survey",
  refresh: "Refresh",
  minScore: "Min score",
  loadingRecommendations: "Loading recommendations",
  recommendationsUnavailable:
    "Recommendations are not available yet. Fill in the investor survey or preferences first.",
  noRecommendations: "No recommendations yet",
  noRecommendationsBody:
    "Fill in the investor survey to prepare matching preferences.",
  startSurvey: "Start Survey",
  savedOpportunitiesInfo:
    "{count} saved opportunities. Open the saved page to compare choices.",
  savedOpportunitiesTitle: "Saved Opportunities",
  savedOpportunitiesBody:
    "Bookmarked UMKM opportunities you want to review again before negotiation.",
  compareAll: "Compare All",
  compareUmkmTitle: "Compare UMKM",
  compareUmkmBody:
    "Compare opportunities by funding target, return, risk, progress, and match score before deciding.",
  addOpportunity: "Add Opportunity",
  noCompareItems: "No opportunities to compare",
  noCompareItemsBody:
    "Save or select at least two opportunities from the marketplace.",
  metric: "Metric",
  sector: "Sector",
  funded: "Funded",
  risk: "Risk",
  actions: "Actions",
  opportunityNotFoundTitle: "Opportunity not found",
  opportunityNotFoundBody:
    "Opportunity data is not available from the backend or local bookmarks.",
  backToMarketplace: "Back to Marketplace",
  opportunityDetailBody:
    "UMKM opportunity detail to help investors understand the business profile, capital needs, risk, and negotiation steps.",
  location: "Location",
  submissionId: "Submission ID",
  status: "Status",
  documentsAndRiskSignals: "Documents and risk signals",
  businessProfile: "Business Profile",
  salesReport: "Sales Report",
  riskMemo: "Risk Memo",
  startNegotiation: "Start Negotiation",
  startNegotiationBody:
    "Submit the nominal amount and return you offer to the UMKM. After it is created, continue the process in Deal Room.",
  offerNominal: "Offer Nominal",
  offerReturn: "Offer Return",
  notes: "Notes",
  sendOffer: "Send Offer",
  viewNegotiations: "View Negotiations",
  negotiationStartedMessage:
    "Negotiation started successfully. Open Deal Room to monitor the process.",
  negotiationStartError: "Negotiation could not be created.",
  loadingOpportunityDetail: "Loading opportunity detail",
  dealRoomTitle: "Deal Room",
  dealRoomBody:
    "One transaction workspace: negotiation, invoice, payment, investment, and profit distribution in one flow.",
  allNegotiations: "All Negotiations",
  loadingDealRoom: "Loading deal room",
  noActiveDeal: "No active deal yet",
  noActiveDealBody:
    "Start a negotiation from an opportunity detail page to create a deal room.",
  currentStatus: "Current status",
  nominal: "Nominal",
  dealPipeline: "Deal Pipeline",
  negotiation: "Negotiation",
  investment: "Investment",
  dealPipelineNegotiation: "Investor-UMKM offers and counter offers.",
  dealPipelineInvoice: "Invoice is created after a deal is approved.",
  dealPipelineInvestment: "Invoice payment activates the portfolio.",
  dealPipelineProfit: "Profit distribution runs after sales are reported.",
  adminReviewQueueTitle: "Admin Review Queue",
  adminReviewQueueBody:
    "Submission review queue requiring admin decisions. Focused on approval, not a generic table.",
  viewAllSubmissions: "View All Submissions",
  loadingReviewQueue: "Loading review queue",
  loadReviewQueueError: "Failed to load review queue.",
  noPendingSubmissions: "No pending submissions",
  noPendingSubmissionsBody:
    "All submissions have been reviewed or there are no new submissions.",
});

Object.assign(translations.id, {
  umkmOnboardingProgress: "Progress onboarding UMKM",
  done: "Selesai",
  locked: "Terkunci",
  next: "Berikutnya",
  step: "Step",
  umkmOnboarding: "UMKM Onboarding",
  umkmOnboardingTitle: "Siapkan bisnis sampai layak tampil ke investor",
  umkmOnboardingBody:
    "Halaman ini menyatukan urutan kerja UMKM: profil akun, profil bisnis, scoring model, pengajuan dana, review admin, negosiasi, sampai laporan penjualan.",
  reviewSubmission: "Review Pengajuan",
  backToOverview: "Kembali ke Overview",
  registeredProfiles: "Profil terdaftar",
  fundingProposals: "Proposal pendanaan",
  fundingTarget: "Target Dana",
  totalCapitalNeeds: "Total kebutuhan modal",
  investorInteractions: "Interaksi investor",
  preparationChecklist: "Checklist persiapan",
  preparationChecklistBody:
    "Checklist lokal untuk menyiapkan materi sebelum review admin.",
  onboardingDocIdentity: "KTP pemilik dan NIK sesuai akun",
  onboardingDocContact: "Nomor telepon dan email aktif",
  onboardingDocBusiness: "Deskripsi bisnis dan alamat operasional",
  onboardingDocFunding: "Target pendanaan dan estimasi return",
  onboardingDocSales: "Ringkasan penjualan atau omzet terakhir",
  onboardingDocPhoto: "Foto produk, toko, atau aktivitas usaha",
  submissionSnapshotBody: "Ringkasan kesiapan proposal untuk investor.",
  noFundingSubmissions: "Belum ada pengajuan dana.",
  onboardingAccountTitle: "Lengkapi identitas akun",
  onboardingAccountBody:
    "Pastikan nama, email, dan nomor telepon UMKM sudah benar agar admin dan investor bisa menghubungi kamu.",
  reviewProfile: "Review Profile",
  completeProfile: "Lengkapi Profile",
  onboardingAccountDone: "Identitas dasar akun sudah tersedia.",
  onboardingAccountTodo: "Nomor telepon atau data akun belum lengkap.",
  onboardingBusinessTitle: "Daftarkan profil bisnis",
  onboardingBusinessBody:
    "Buat data bisnis utama berisi nama usaha, tipe usaha, alamat, kontak, kelas, dan deskripsi.",
  manageBusiness: "Kelola Bisnis",
  addBusiness: "Tambah Bisnis",
  onboardingBusinessDone: "{count} bisnis terhubung ke akun ini.",
  onboardingBusinessTodo: "Profil bisnis wajib dibuat sebelum pengajuan dana.",
  onboardingModelTitle: "Isi profil model bisnis",
  onboardingModelBody:
    "Lengkapi margin, omzet, repeat order, adopsi digital, dan tenure agar scoring bisnis lebih kuat.",
  reviewModel: "Review Model",
  fillModel: "Isi Model",
  onboardingModelDone: "Data model bisnis sudah tersimpan untuk scoring.",
  onboardingModelTodo:
    "Data model belum lengkap, investor belum mendapat sinyal kualitas yang cukup.",
  createBusinessFirst: "Buat profil bisnis terlebih dahulu.",
  onboardingSubmissionTitle: "Buat pengajuan pendanaan",
  onboardingSubmissionBody:
    "Masukkan target pendanaan dan return tahunan agar peluang bisa direview admin.",
  manageSubmission: "Kelola Pengajuan",
  createSubmission: "Buat Pengajuan",
  onboardingSubmissionDone: "{count} pengajuan sudah dibuat.",
  onboardingSubmissionTodo:
    "Pengajuan menjadi pintu masuk ke marketplace investor.",
  onboardingReviewTitle: "Siap review admin",
  onboardingReviewBody:
    "Pantau status approval. Setelah disetujui atau dipublikasikan, peluang mulai layak muncul di katalog investor.",
  checkStatus: "Cek Status",
  onboardingReviewDone:
    "Ada pengajuan yang sudah approved, published, atau funded.",
  onboardingReviewPending: "Ada pengajuan pending. Tunggu keputusan admin.",
  onboardingReviewTodo: "Belum ada pengajuan yang masuk tahap review.",
  onboardingNegotiationTitle: "Kelola negosiasi investor",
  onboardingNegotiationBody:
    "Balas penawaran investor dan jaga semua percakapan deal di satu tempat.",
  openNegotiations: "Buka Negosiasi",
  onboardingNegotiationDone: "{count} negosiasi tercatat.",
  onboardingNegotiationTodo:
    "Negosiasi akan muncul setelah investor tertarik pada peluang bisnis.",
  onboardingSalesTitle: "Siapkan laporan penjualan",
  onboardingSalesBody:
    "Setelah ada investasi berjalan, laporan penjualan menjadi dasar distribusi profit.",
  inputSales: "Input Penjualan",
  onboardingSalesTodo:
    "Laporan penjualan dipakai untuk transparansi performa dan profit sharing.",
});

Object.assign(translations.en, {
  umkmOnboardingProgress: "UMKM onboarding progress",
  done: "Done",
  locked: "Locked",
  next: "Next",
  step: "Step",
  umkmOnboarding: "UMKM Onboarding",
  umkmOnboardingTitle: "Prepare your business until it is investor-ready",
  umkmOnboardingBody:
    "This page connects the UMKM workflow: account profile, business profile, scoring model, funding submission, admin review, negotiation, and sales reporting.",
  reviewSubmission: "Review Submission",
  backToOverview: "Back to Overview",
  registeredProfiles: "Registered profiles",
  fundingProposals: "Funding proposals",
  fundingTarget: "Funding Target",
  totalCapitalNeeds: "Total capital needs",
  investorInteractions: "Investor interactions",
  preparationChecklist: "Preparation checklist",
  preparationChecklistBody:
    "Local checklist to prepare materials before admin review.",
  onboardingDocIdentity: "Owner ID card and NIK match the account",
  onboardingDocContact: "Active phone number and email",
  onboardingDocBusiness: "Business description and operating address",
  onboardingDocFunding: "Funding target and estimated return",
  onboardingDocSales: "Recent sales or revenue summary",
  onboardingDocPhoto: "Product, store, or business activity photos",
  submissionSnapshotBody: "Proposal readiness summary for investors.",
  noFundingSubmissions: "No funding submissions yet.",
  onboardingAccountTitle: "Complete account identity",
  onboardingAccountBody:
    "Make sure the UMKM name, email, and phone number are correct so admins and investors can contact you.",
  reviewProfile: "Review Profile",
  completeProfile: "Complete Profile",
  onboardingAccountDone: "Basic account identity is available.",
  onboardingAccountTodo: "Phone number or account data is incomplete.",
  onboardingBusinessTitle: "Register business profile",
  onboardingBusinessBody:
    "Create the main business data with business name, type, address, contact, class, and description.",
  manageBusiness: "Manage Business",
  addBusiness: "Add Business",
  onboardingBusinessDone:
    "{count} business profiles are connected to this account.",
  onboardingBusinessTodo:
    "A business profile is required before funding submission.",
  onboardingModelTitle: "Fill business model profile",
  onboardingModelBody:
    "Complete margin, revenue, repeat orders, digital adoption, and tenure so scoring is stronger.",
  reviewModel: "Review Model",
  fillModel: "Fill Model",
  onboardingModelDone: "Business model data has been saved for scoring.",
  onboardingModelTodo:
    "Model data is incomplete, so investors do not have enough quality signals yet.",
  createBusinessFirst: "Create a business profile first.",
  onboardingSubmissionTitle: "Create funding submission",
  onboardingSubmissionBody:
    "Enter the funding target and annual return so the opportunity can be reviewed by admin.",
  manageSubmission: "Manage Submission",
  createSubmission: "Create Submission",
  onboardingSubmissionDone: "{count} submissions have been created.",
  onboardingSubmissionTodo:
    "Submission is the entry point to the investor marketplace.",
  onboardingReviewTitle: "Ready for admin review",
  onboardingReviewBody:
    "Monitor approval status. Once approved or published, the opportunity is eligible for the investor catalog.",
  checkStatus: "Check Status",
  onboardingReviewDone:
    "A submission is already approved, published, or funded.",
  onboardingReviewPending: "A submission is pending. Wait for admin decision.",
  onboardingReviewTodo: "No submission has entered the review stage yet.",
  onboardingNegotiationTitle: "Manage investor negotiations",
  onboardingNegotiationBody:
    "Reply to investor offers and keep all deal conversations in one place.",
  openNegotiations: "Open Negotiations",
  onboardingNegotiationDone: "{count} negotiations are recorded.",
  onboardingNegotiationTodo:
    "Negotiations will appear after investors show interest in the opportunity.",
  onboardingSalesTitle: "Prepare sales reports",
  onboardingSalesBody:
    "After an investment is running, sales reports become the basis for profit distribution.",
  inputSales: "Input Sales",
  onboardingSalesTodo:
    "Sales reports are used for performance transparency and profit sharing.",
});

Object.assign(translations.id, {
  investorSurveyTitle: "Survey Investor",
  investorSurveyBody:
    "Mock survey untuk menangkap preferensi investor sebelum sistem menampilkan UMKM yang paling cocok. Flow ini disiapkan agar nanti mudah disambungkan ke backend matchmaking.",
  investorSurveyMockMode:
    "Mode mock: memakai data peluang backend jika tersedia, lalu contoh UMKM lokal jika backend masih kosong.",
  favoriteSector: "Sektor yang paling diminati",
  idealInvestmentNominal: "Nominal investasi ideal",
  minimumAnnualReturn: "Minimum return tahunan",
  riskTolerance: "Toleransi risiko",
  investmentHorizon: "Horizon investasi",
  digitalAdoptionPreference: "Preferensi adopsi digital UMKM",
  conservative: "Konservatif",
  balanced: "Seimbang",
  aggressive: "Agresif",
  lessThanOneYear: "Kurang dari 1 tahun",
  oneToThreeYears: "1-3 tahun",
  moreThanThreeYears: "Lebih dari 3 tahun",
  viewMatch: "Lihat Match",
  reset: "Reset",
  surveySavedTemporary: "Survey tersimpan sementara di halaman ini.",
  match: "Match",
  matchScore: "Skor kecocokan",
  surveyMatchReason:
    "Cocok karena sektor {sector} mendekati preferensi, target {target}, dan return {return}.",
  surveyMatchResultsTitle: "Hasil Matching Survey",
  surveyMatchResultsBody:
    "Ranking UMKM berdasarkan jawaban survey investor. Data ini masih mock dan siap disambungkan ke endpoint backend matchmaking.",
  noMatchResults: "Belum ada hasil matching",
  fillSurveyFirst: "Isi survey terlebih dahulu untuk melihat rekomendasi UMKM.",
  sectorCulinary: "Kuliner",
  sectorTechnology: "Teknologi",
  sectorEducation: "Pendidikan",
  sectorAgriculture: "Pertanian",
  sectorServices: "Jasa",
  sectorOther: "Lainnya",
});

Object.assign(translations.en, {
  investorSurveyTitle: "Investor Survey",
  investorSurveyBody:
    "Mock survey to capture investor preferences before the system displays the best matching UMKM. This flow is prepared so it can later connect easily to backend matchmaking.",
  investorSurveyMockMode:
    "Mock mode: uses backend opportunity data when available, then local sample UMKM if the backend is still empty.",
  favoriteSector: "Most preferred sector",
  idealInvestmentNominal: "Ideal investment nominal",
  minimumAnnualReturn: "Minimum annual return",
  riskTolerance: "Risk tolerance",
  investmentHorizon: "Investment horizon",
  digitalAdoptionPreference: "UMKM digital adoption preference",
  conservative: "Conservative",
  balanced: "Balanced",
  aggressive: "Aggressive",
  lessThanOneYear: "Less than 1 year",
  oneToThreeYears: "1-3 years",
  moreThanThreeYears: "More than 3 years",
  viewMatch: "View Match",
  reset: "Reset",
  surveySavedTemporary: "Survey is temporarily saved on this page.",
  match: "Match",
  matchScore: "Match score",
  surveyMatchReason:
    "Relevant because the {sector} sector is close to your preference, target is {target}, and return is {return}.",
  surveyMatchResultsTitle: "Survey Matching Results",
  surveyMatchResultsBody:
    "UMKM ranking based on investor survey answers. This is still mock data and ready to connect to backend matchmaking endpoints.",
  noMatchResults: "No matching results yet",
  fillSurveyFirst: "Fill in the survey first to view UMKM recommendations.",
  sectorCulinary: "Culinary",
  Fashion: "Fashion",
  sectorTechnology: "Technology",
  sectorEducation: "Education",
  sectorAgriculture: "Agriculture",
  sectorServices: "Services",
  sectorOther: "Other",
});

Object.assign(translations.id, {
  profilePanelDescription:
    "Kelola informasi akun yang dipakai di seluruh workspace FundRaise.",
  profileSaveSuccess: "Profile berhasil disimpan.",
  profileSaveError: "Profile belum berhasil disimpan.",
  saveProfile: "Simpan Profile",
  adminProfileReadonly:
    "Admin biasa hanya dapat melihat profile. Update admin hanya tersedia untuk superadmin.",
  accountSummary: "Ringkasan Akun",
  accountSummaryDescription:
    "Informasi akun aktif yang tersambung ke dashboard.",
  createdAt: "Dibuat",
  dataStatus: "Status Data",
  sessionData: "Data sesi",
  adminData: "Data admin",
  localProfile: "Profile lokal",
  level: "Level",
  investorPreferencesTitle: "Preferensi Investor",
  investorPreferencesBody:
    "Preferensi ini dipakai backend untuk menghasilkan rekomendasi UMKM.",
  preferencesSaveSuccess: "Preferensi berhasil disimpan.",
  preferencesSaveError: "Preferensi belum berhasil disimpan.",
  recommendationsRefreshSuccess: "Rekomendasi berhasil diperbarui.",
  recommendationsRefreshError: "Rekomendasi belum bisa diperbarui.",
  savePreferences: "Simpan Preferensi",
  refreshRecommendations: "Refresh Rekomendasi",
  activePreferences: "Preferensi Aktif",
  activePreferencesBody: "Data yang tersimpan di backend untuk akun investor.",
  investorPreferences: "Preferensi investor",
  businessModelProfileTitle: "Profil Model Bisnis",
  businessModelProfileBody:
    "Kelola variabel kesehatan bisnis, performa digital, dan kelas risiko usaha.",
  businessProfileSaveSuccess: "Profil bisnis berhasil disimpan.",
  businessProfileSaveError: "Profil bisnis belum berhasil disimpan.",
  businessClassUpdateSuccess: "Class bisnis berhasil diperbarui.",
  businessClassUpdateError: "Class bisnis belum berhasil diperbarui.",
  enterBusinessId: "Masukkan ID bisnis",
  noBusinessOptions:
    "Belum ada bisnis yang bisa dipilih. Buat profil bisnis terlebih dahulu.",
  updateClass: "Update Class",
  businessModelReadonly: "Role ini hanya dapat melihat profil model bisnis.",
  businessProfileSummary: "Ringkasan Profil Bisnis",
  businessProfileSummaryBody:
    "Nilai model bisnis yang sedang aktif untuk proses scoring.",
  allModelProfiles: "Semua Profil Model",
  allModelProfilesBody: "Data profil bisnis yang tersedia untuk proses ML.",
  mlProfile: "Profil ML",
  systemStatusTitle: "Status Sistem",
  systemStatusBody:
    "Pantau kesiapan layanan utama dan status data operasional.",
  application: "Aplikasi",
  businessClasses: "Kelas bisnis",
  classDetail: "Detail kelas",
  adminDashboard: "Dashboard admin",
});

Object.assign(translations.en, {
  profilePanelDescription:
    "Manage account information used across the FundRaise workspace.",
  profileSaveSuccess: "Profile saved successfully.",
  profileSaveError: "Profile could not be saved.",
  saveProfile: "Save Profile",
  adminProfileReadonly:
    "Regular admins can only view the profile. Admin updates are only available to superadmins.",
  accountSummary: "Account Summary",
  accountSummaryDescription:
    "Active account information connected to the dashboard.",
  createdAt: "Created",
  dataStatus: "Data Status",
  sessionData: "Session data",
  adminData: "Admin data",
  localProfile: "Local profile",
  level: "Level",
  investorPreferencesTitle: "Investor Preferences",
  investorPreferencesBody:
    "These preferences are used by the backend to generate UMKM recommendations.",
  preferencesSaveSuccess: "Preferences saved successfully.",
  preferencesSaveError: "Preferences could not be saved.",
  recommendationsRefreshSuccess: "Recommendations refreshed successfully.",
  recommendationsRefreshError: "Recommendations could not be refreshed.",
  savePreferences: "Save Preferences",
  refreshRecommendations: "Refresh Recommendations",
  activePreferences: "Active Preferences",
  activePreferencesBody: "Data stored in the backend for the investor account.",
  investorPreferences: "Investor preferences",
  businessModelProfileTitle: "Business Model Profile",
  businessModelProfileBody:
    "Manage business health variables, digital performance, and business risk class.",
  businessProfileSaveSuccess: "Business profile saved successfully.",
  businessProfileSaveError: "Business profile could not be saved.",
  businessClassUpdateSuccess: "Business class updated successfully.",
  businessClassUpdateError: "Business class could not be updated.",
  enterBusinessId: "Enter business ID",
  noBusinessOptions:
    "No business can be selected yet. Create a business profile first.",
  updateClass: "Update Class",
  businessModelReadonly: "This role can only view business model profiles.",
  businessProfileSummary: "Business Profile Summary",
  businessProfileSummaryBody: "Active business model values used for scoring.",
  allModelProfiles: "All Model Profiles",
  allModelProfilesBody: "Business profile data available for ML processing.",
  mlProfile: "ML Profile",
  systemStatusTitle: "System Status",
  systemStatusBody:
    "Monitor core service readiness and operational data status.",
  application: "Application",
  businessClasses: "Business classes",
  classDetail: "Class detail",
  adminDashboard: "Admin dashboard",
});

Object.assign(translations.id, {
  salesReportSubmitSuccess: "Laporan penjualan berhasil dikirim.",
  salesReportSubmitError: "Laporan penjualan belum berhasil dikirim.",
  umkmSalesDescription:
    "Kirim laporan penjualan ke backend. Daftar laporan per pengajuan belum ditampilkan karena endpoint list BE masih perlu perbaikan.",
  chooseSubmission: "Pilih pengajuan",
  chooseSalesReport: "Pilih laporan penjualan",
  periodPlaceholder: "Contoh: 2026-05",
  investmentBySubmissionPrompt:
    "Masukkan ID pengajuan untuk melihat investasi yang masuk ke proposal bisnis.",
  profitBySalesPrompt:
    "Masukkan ID penjualan untuk melihat distribusi profit yang dibuat backend.",
  example101: "Contoh: 101",
  example201: "Contoh: 201",
});

Object.assign(translations.en, {
  salesReportSubmitSuccess: "Sales report submitted successfully.",
  salesReportSubmitError: "Sales report could not be submitted.",
  umkmSalesDescription:
    "Submit sales reports to the backend. The per-submission report list is not shown yet because the backend list endpoint still needs improvement.",
  chooseSubmission: "Choose submission",
  chooseSalesReport: "Choose sales report",
  periodPlaceholder: "Example: 2026-05",
  investmentBySubmissionPrompt:
    "Enter a submission ID to view investments attached to the business proposal.",
  profitBySalesPrompt:
    "Enter a sales ID to view profit distributions generated by the backend.",
  example101: "Example: 101",
  example201: "Example: 201",

  Bisnis: "Business",
  "Kelola profil bisnis UMKM, kontak, sektor, kelas, dan deskripsi usaha.":
    "Manage UMKM business profiles, contact, sector, class, and business description.",
  "Tambah Bisnis": "Add Business",
  "Belum ada bisnis": "No business yet",
  "Belum ada bisnis terdaftar": "No registered businesses yet",
  "Tambahkan bisnis pertama agar kamu bisa membuat pengajuan pendanaan.":
    "Add your first business so you can create a funding submission.",
  "Data bisnis akan muncul setelah UMKM mendaftarkan profil usaha.":
    "Business data will appear after UMKM register their business profiles.",
  "Nama Bisnis": "Business Name",
  "Tipe Usaha": "Business Type",
  Kuliner: "Culinary",
  "Kesehatan & Kecantikan": "Health & Beauty",
  Teknologi: "Technology",
  Pendidikan: "Education",
  Pertanian: "Agriculture",
  Perdagangan: "Trade",
  Jasa: "Services",
  Kerajinan: "Crafts",
  Lainnya: "Other",
  Alamat: "Address",
  "No. Telp": "Phone Number",
  Kelas: "Class",
  Deskripsi: "Description",
  Kontak: "Contact",

  "Pengajuan Dana": "Funding Submissions",
  "Kelola target pendanaan, return tahunan, progress pendanaan, status publikasi, dan approval.":
    "Manage funding target, annual return, funding progress, publication status, and approval.",
  Pengajuan: "Submission",
  "Target Pendanaan": "Funding Target",
  "Total Pendanaan": "Total Funding",
  "Return Tahunan": "Annual Return",
  Approval: "Approval",
  "Tambah Pengajuan": "Add Submission",
  "Belum ada pengajuan": "No submissions yet",
  "Belum ada pengajuan dana": "No funding submissions yet",
  "Pengajuan UMKM akan muncul di sini untuk proses review.":
    "UMKM submissions will appear here for review.",
  "Buat pengajuan setelah profil bisnis tersedia agar investor bisa melihat peluang pendanaan.":
    "Create a submission after a business profile exists so investors can see the funding opportunity.",
  Target: "Target",
  Terkumpul: "Collected",
  Match: "Match",

  "Laporan Penjualan": "Sales Reports",
  "Catat periode penjualan, laba, dan transaksi untuk kebutuhan distribusi profit.":
    "Record sales periods, profit, and transactions for profit distribution needs.",
  "Tambah Laporan": "Add Report",
  "Belum ada laporan penjualan": "No sales reports yet",
  "Laporan penjualan UMKM akan tampil setelah backend menyediakan daftar data untuk role ini.":
    "UMKM sales reports will appear after the backend provides a list endpoint for this role.",
  Periode: "Period",
  Penjualan: "Sales",
  "Total Penjualan": "Total Sales",
  "Laba Kotor": "Gross Profit",
  "Laba Bersih": "Net Profit",
  "Jumlah Transaksi": "Transaction Count",
  Transaksi: "Transactions",

  Negosiasi: "Negotiation",
  "Kelola penawaran nominal, return, status, dan catatan antara investor dan pemilik bisnis.":
    "Manage nominal offers, returns, statuses, and notes between investors and business owners.",
  "Mulai Negosiasi": "Start Negotiation",
  "Belum ada negosiasi": "No negotiations yet",
  "Mulai negosiasi dari peluang pendanaan yang tersedia.":
    "Start a negotiation from available funding opportunities.",
  "Negosiasi investor akan muncul di sini setelah ada penawaran.":
    "Investor negotiations will appear here after offers are made.",
  "Penawaran Nominal": "Offer Nominal",
  "Penawaran Return": "Offer Return",
  Update: "Update",
  Accept: "Accept",
  Reject: "Reject",
  "Setujui negosiasi ini?": "Accept this negotiation?",
  "Tolak negosiasi ini?": "Reject this negotiation?",

  "Peluang Pendanaan": "Funding Opportunities",
  "Daftar pengajuan UMKM yang sudah dipublikasikan dan siap untuk investasi.":
    "List of published UMKM submissions ready for investment.",
  "Belum ada peluang pendanaan": "No funding opportunities yet",
  "Peluang akan muncul setelah pengajuan UMKM dipublikasikan.":
    "Opportunities will appear after UMKM submissions are published.",

  Invoice: "Invoice",
  "Pantau tagihan investasi dan status pembayaran invoice.":
    "Monitor investment bills and invoice payment status.",
  "Update Invoice": "Update Invoice",
  "Belum ada invoice": "No invoices yet",
  "Invoice investasi akan muncul setelah negosiasi berlanjut ke proses pembayaran.":
    "Investment invoices will appear after negotiation continues to payment.",
  "Invoice platform akan muncul setelah ada transaksi investasi.":
    "Platform invoices will appear after investment transactions exist.",
  "Nominal Tagihan": "Bill Nominal",
  "Due Date": "Due Date",
  Due: "Due",
  Pay: "Pay",
  "Bayar invoice ini?": "Pay this invoice?",

  Investasi: "Investments",
  "Daftar investasi aktif berdasarkan invoice yang telah dibayar.":
    "List of active investments based on paid invoices.",
  "Belum ada investasi": "No investments yet",
  "Portfolio investasi akan muncul setelah invoice dibayar.":
    "Investment portfolio will appear after invoices are paid.",
  "Investasi akan muncul setelah investor menyelesaikan pembayaran invoice.":
    "Investments will appear after investors complete invoice payment.",
  Tanggal: "Date",
  "By Pengajuan": "By Submission",
  "Investasi Pengajuan": "Submission Investments",
  "Investasi yang tercatat untuk pengajuan bisnis tertentu.":
    "Investments recorded for a specific business submission.",
  "Belum ada investasi untuk pengajuan ini":
    "No investments for this submission yet",
  "Investasi akan muncul setelah investor menyelesaikan pembayaran untuk pengajuan yang dipilih.":
    "Investments will appear after investors complete payment for the selected submission.",

  "Distribusi Profit": "Profit Distribution",
  "Pantau pembagian profit per periode dan status distribusinya.":
    "Monitor profit sharing by period and distribution status.",
  "Update Profit": "Update Profit",
  "Belum ada distribusi profit": "No profit distributions yet",
  "Distribusi profit akan muncul setelah laporan penjualan dan investasi tersedia.":
    "Profit distributions will appear after sales reports and investments are available.",
  "Nominal Profit": "Profit Nominal",
  "By Penjualan": "By Sales",
  "Profit Penjualan": "Sales Profit",
  "Distribusi profit investor berdasarkan laporan penjualan tertentu.":
    "Investor profit distribution based on a specific sales report.",
  "Belum ada profit untuk penjualan ini": "No profit for this sales report yet",
  "Distribusi profit akan muncul setelah backend membuat distribusi untuk laporan yang dipilih.":
    "Profit distribution will appear after the backend creates distribution for the selected report.",

  "Kelas Bisnis": "Business Classes",
  "Kelola kelas bisnis yang dipakai sebagai sinyal risiko dan kualitas usaha.":
    "Manage business classes used as risk and business quality signals.",
  "Tambah Kelas": "Add Class",
  "Belum ada kelas bisnis": "No business classes yet",
  "Kelas bisnis dipakai untuk klasifikasi risiko dan kualitas usaha.":
    "Business classes are used to classify risk and business quality.",
  "Nama Kelas": "Class Name",

  Users: "Users",
  "Kelola data user, role, dan informasi kontak akun platform.":
    "Manage user data, roles, and platform account contact information.",
  "Update User": "Update User",
  "Belum ada user": "No users yet",
  "Data user platform akan muncul setelah akun UMKM atau investor terdaftar.":
    "Platform user data will appear after UMKM or investor accounts register.",

  "Admin Management": "Admin Management",
  "Kelola akun admin dan superadmin untuk operasional platform.":
    "Manage admin and superadmin accounts for platform operations.",
  "Tambah Admin": "Add Admin",
  "Belum ada admin": "No admins yet",
  "Akun admin operasional akan muncul di sini.":
    "Operational admin accounts will appear here.",

  Notifikasi: "Notifications",
  "Kelola notifikasi operasional dan tandai status baca.":
    "Manage operational notifications and mark read status.",
  "Tambah Notifikasi": "Add Notification",
  "Belum ada notifikasi": "No notifications yet",
  "Notifikasi sistem dan aktivitas user akan muncul di sini.":
    "System notifications and user activity will appear here.",
  Read: "Read",
  "Tambah Data": "Add Data",
  "Data belum tersedia": "Data is not available",
  "Belum ada data yang bisa ditampilkan untuk halaman ini.":
    "There is no data to display on this page yet.",
  UMKM: "UMKM",
  Skor: "Score",
  Alasan: "Reason",
  Profile: "Profile",
  Email: "Email",
  Role: "Role",
  Dibuat: "Created",
  "Kepuasan Pelanggan": "Customer Satisfaction",
  "Digital Adoption Score": "Digital Adoption Score",
  "Net Profit Margin": "Net Profit Margin",
  "Year Revenue": "Year Revenue",
  "Business Tenure": "Business Tenure",
  Updated: "Updated",
  "Peak Hour Latency": "Peak Hour Latency",
  "Review Volatility": "Review Volatility",
  "Repeat Order Rate": "Repeat Order Rate",
  Class: "Class",
  Margin: "Margin",
  Revenue: "Revenue",
  Digital: "Digital",
  Low: "Low",
  Medium: "Medium",
  High: "High",
  Critical: "Critical",
  Struggling: "Struggling",
  Growth: "Growth",
  Elite: "Elite",
  Draft: "Draft",
  Published: "Published",
  Funded: "Funded",
  Rejected: "Rejected",
  Pending: "Pending",
  Approved: "Approved",
  Paid: "Paid",
  Distributed: "Distributed",
  Unread: "Unread",
  Title: "Title",
  Message: "Message",
  pending: "Pending",
  draft: "Draft",
  approved: "Approved",
  rejected: "Rejected",
  published: "Published",
  funded: "Funded",
  paid: "Paid",
  distributed: "Distributed",
  read: "Read",
  unread: "Unread",
  active: "Active",
  deal: "Deal",
  completed: "Completed",
});

Object.assign(translations.id, {
  homePhoneBusinessMeta: "Kuliner, Bandung",
  homeTrustEyebrow: "Capstone project program",
  homeTrustBody:
    "FundRaise dibuat sebagai capstone project Coding Camp 2026 dari DBS Foundation dan Dicoding.",
  homeProgramCodingCamp: "Program capstone",
  homeProgramDbs: "Inisiator program",
  homeProgramDicoding: "Mitra edukasi",
  homeJourneyTitle: "Dari profil bisnis sampai investasi jalan",
  homeJourneyBody:
    "Tiga langkah sederhana yang menghubungkan UMKM dan investor melalui data, AI matching, dan dashboard terintegrasi.",
  homeStepProfileTitle: "Daftarkan bisnis & isi profil",
  homeStepProfileBody:
    "Data sektor, performa tahunan, kebutuhan modal, dan indikator risiko dirangkum jadi sinyal pendanaan yang terbaca sistem.",
  homeStepInvestorTitle: "Sistem AI baca & cocokkan",
  homeStepInvestorBody:
    "Preferensi investor dicocokkan dengan profil UMKM secara otomatis menghasilkan skor kecocokan yang transparan.",
  homeStepDealTitle: "Negosiasi, invoice, investasi",
  homeStepDealBody:
    "Penawaran, pembayaran, pencatatan investasi, dan distribusi profit dipantau dalam satu workspace multi-role.",
  homeOpportunitiesTitle: "Peluang yang tersedia",
  homeOpportunitiesBody:
    "Contoh peluang UMKM yang bisa investor lihat, bandingkan, lalu lanjutkan ke proses negosiasi.",
  homeOpportunitiesCta: "Lihat Semua Peluang",
  homeRoleSectionTitle: "Dirancang untuk UMKM dan investor",
  homeRoleSectionBody:
    "Setiap role mendapatkan workspace yang fokus, tetapi tetap tersambung dalam alur pendanaan yang sama.",
  homeRoleUmkmTitle: "Untuk UMKM",
  homeRoleUmkmBody:
    "UMKM mengelola kesiapan bisnis dari profil sampai negosiasi dalam alur yang jelas.",
  homeRoleUmkmPoint1: "Lengkapi profil bisnis dan data operasional.",
  homeRoleUmkmPoint2: "Kirim pengajuan pendanaan dan laporan penjualan.",
  homeRoleUmkmPoint3: "Kelola negosiasi dan pantau status deal.",
  homeRoleInvestorTitle: "Untuk Investor",
  homeRoleInvestorBody:
    "Investor menemukan peluang relevan, mengevaluasi risiko, lalu mengeksekusi investasi dalam satu dashboard.",
  homeRoleInvestorPoint1: "Dapatkan rekomendasi peluang dari AI matching.",
  homeRoleInvestorPoint2: "Bandingkan sektor, risiko, return, dan progres pendanaan.",
  homeRoleInvestorPoint3: "Pantau invoice, investasi aktif, dan distribusi profit.",
  homeDiagramTitle: "Satu jalur kerja yang mudah dipahami",
  homeDiagramBody:
    "Landing page kini memperlihatkan gambaran proses sebelum pengguna masuk ke dashboard, dari profil bisnis sampai distribusi profit.",
  homeDiagramProfile: "UMKM melengkapi profil dan pengajuan",
  homeDiagramMatch: "Investor mengisi preferensi dan mendapat match",
  homeDiagramDeal: "Kedua pihak masuk ke negosiasi dan invoice",
  homeDiagramProfit: "Investasi dan profit sharing dimonitor",
  homeTestimonialsTitle: "Dipercaya oleh pelaku usaha",
  homeTestimonialRoleUmkm: "Pemilik UMKM",
  homeTestimonialRoleInvestor: "Investor ritel",
  homeTestimonialRoleAdmin: "Admin operasional",
  homeTestimonialRani:
    "Dashboardnya membantu saya menjelaskan kebutuhan modal dengan lebih rapi sebelum bertemu investor.",
  homeTestimonialDimas:
    "Saya bisa membandingkan peluang berdasarkan sektor, risiko, return, dan progress pendanaan tanpa membuka banyak file.",
  homeTestimonialNadia:
    "Review pengajuan terasa lebih terstruktur karena data UMKM, negosiasi, invoice, dan investasi berada di satu alur.",
  homeBottomCtaTitle: "Siap mulai membangun alur pendanaan?",
  homeBottomCtaBody:
    "Buat akun untuk masuk ke dashboard UMKM atau investor dan lanjutkan proses pendanaan dari workspace FundRaise.",
  aboutMissionTitle: "Misi Kami",
  aboutMissionBody:
    "Membuat proses pendanaan UMKM lebih transparan, terukur, dan mudah dipertemukan dengan investor yang sesuai.",
  aboutTimelineTitle: "Perjalanan Produk",
  aboutTimelineResearch:
    "Riset kebutuhan UMKM dan investor untuk menemukan alur pendanaan yang praktis dan bisa diawasi.",
  aboutTimelinePrototype:
    "Prototype marketplace, dashboard multi-role, dan modul AI matching mulai disusun sebagai satu produk.",
  aboutTimelineCapstone:
    "FundRaise dikembangkan sebagai capstone project dengan fokus pada flow end-to-end dari onboarding sampai profit sharing.",
  servicesComparisonTitle: "Fitur berbeda untuk kebutuhan yang berbeda",
  servicesComparisonBody:
    "UMKM dan investor memakai alur yang saling tersambung, tetapi setiap role tetap mendapatkan kontrol yang relevan.",
  servicesUmkmFeature1: "Membuat profil bisnis dan kelas risiko usaha.",
  servicesUmkmFeature2: "Mengirim pengajuan pendanaan dan laporan penjualan.",
  servicesUmkmFeature3: "Menjawab negosiasi dan memantau progress pendanaan.",
  servicesInvestorFeature1: "Menelusuri peluang dan hasil rekomendasi AI.",
  servicesInvestorFeature2: "Membandingkan UMKM sebelum masuk negosiasi.",
  servicesInvestorFeature3:
    "Membayar invoice dan memantau portfolio investasi.",
  servicesBottomCtaTitle: "Siap mulai dari role kamu?",
  servicesBottomCtaBody:
    "Daftar sebagai UMKM atau investor, lalu masuk ke dashboard yang sesuai dengan kebutuhan pendanaanmu.",
  contactFormSuccessTitle: "Pesan siap dikirim",
  contactFormSuccessBody:
    "Terima kasih. Untuk demo ini, form menampilkan feedback lokal tanpa mengirim data ke backend.",
  contactMapTitle: "Area operasional Jakarta",
  contactMapBody:
    "Placeholder peta disiapkan untuk embed lokasi kantor atau area layanan FundRaise.",
  portfolioDemoMode:
    "Demo mode: data portfolio masih contoh statis untuk memperlihatkan pengalaman marketplace.",
  portfolioEmpty: "Tidak ada peluang yang cocok dengan filter saat ini.",
  portfolioCompareTitle: "Bandingkan Peluang",
  portfolioCompareBody:
    "Gunakan tabel ini untuk melihat perbedaan sektor, lokasi, target, return, risiko, dan skor match.",
  portfolioSectorFoodBeverage: "Kuliner",
  portfolioSectorFashion: "Fashion",
  portfolioSectorAgribusiness: "Agribisnis",
  portfolioStepSave: "Simpan",
  portfolioStepCompare: "Bandingkan",
  portfolioStepNegotiate: "Negosiasi",
  riskLow: "Rendah",
  riskModerate: "Sedang",
  riskHigh: "Tinggi",
  riskMediumShort: "Sed",
  socialInstagram: "Instagram FundRaise",
  socialLinkedin: "LinkedIn FundRaise",
  socialEmail: "Email FundRaise",
  close: "Tutup",
  Admin: "Admin",
  footerCopyright: "Copyright {year} FundRaise. Seluruh hak cipta dilindungi.",
});

Object.assign(translations.en, {
  homeHeroImageAlt: "FundRaise operations illustration for UMKM and investors",
  homePhoneBusinessMeta: "Culinary, Bandung",
  homeTrustEyebrow: "Capstone project program",
  homeTrustBody:
    "FundRaise was built as a Coding Camp 2026 capstone project within the DBS Foundation and Dicoding learning ecosystem.",
  homeProgramCodingCamp: "Capstone program",
  homeProgramDbs: "Program initiator",
  homeProgramDicoding: "Education partner",
  homeJourneyTitle: "From business profile to active investment",
  homeJourneyBody:
    "Three simple steps that connect UMKM and investors through data, AI matching, and an integrated dashboard.",
  homeStepProfileTitle: "Register business & complete profile",
  homeStepProfileBody:
    "Sector data, annual performance, capital needs, and risk indicators are summarized into funding signals the system can read.",
  homeStepInvestorTitle: "AI reads & matches profiles",
  homeStepInvestorBody:
    "Investor preferences are automatically matched with UMKM profiles, producing transparent compatibility scores.",
  homeStepDealTitle: "Negotiate, invoice, invest",
  homeStepDealBody:
    "Offers, payments, investment records, and profit distributions are monitored in one multi-role workspace.",
  homeOpportunitiesTitle: "Available opportunities",
  homeOpportunitiesBody:
    "Sample UMKM opportunities investors can review, compare, and continue into negotiation.",
  homeOpportunitiesCta: "View All Opportunities",
  homeRoleSectionTitle: "Designed for UMKM and investors",
  homeRoleSectionBody:
    "Each role gets a focused workspace while staying connected in one funding flow.",
  homeRoleUmkmTitle: "For UMKM",
  homeRoleUmkmBody:
    "UMKM can manage readiness from business profile to negotiation in a clear workflow.",
  homeRoleUmkmPoint1: "Complete business profile and operational data.",
  homeRoleUmkmPoint2: "Submit funding proposals and sales reports.",
  homeRoleUmkmPoint3: "Manage negotiations and monitor deal status.",
  homeRoleInvestorTitle: "For Investors",
  homeRoleInvestorBody:
    "Investors discover relevant opportunities, evaluate risk, and execute investments in one dashboard.",
  homeRoleInvestorPoint1: "Get opportunities from AI matching recommendations.",
  homeRoleInvestorPoint2: "Compare sector, risk, return, and funding progress.",
  homeRoleInvestorPoint3: "Track invoices, active investments, and profit distributions.",
  homeDiagramTitle: "One workflow that is easy to understand",
  homeDiagramBody:
    "The landing page now shows the process before users enter the dashboard, from business profile to profit distribution.",
  homeDiagramProfile: "UMKM complete profile and funding submission",
  homeDiagramMatch: "Investors submit preferences and receive matches",
  homeDiagramDeal: "Both parties move into negotiation and invoice",
  homeDiagramProfit: "Investment and profit sharing are monitored",
  homeTestimonialsTitle: "Trusted by business owners",
  homeTestimonialRoleUmkm: "UMKM owner",
  homeTestimonialRoleInvestor: "Retail investor",
  homeTestimonialRoleAdmin: "Operational admin",
  homeTestimonialRani:
    "The dashboard helps me explain capital needs more clearly before meeting investors.",
  homeTestimonialDimas:
    "I can compare opportunities by sector, risk, return, and funding progress without opening many files.",
  homeTestimonialNadia:
    "Submission review feels more structured because UMKM data, negotiations, invoices, and investments sit in one flow.",
  homeBottomCtaTitle: "Ready to build your funding flow?",
  homeBottomCtaBody:
    "Create an account to enter the UMKM or investor dashboard and continue the funding process from the FundRaise workspace.",
  aboutMissionTitle: "Our Mission",
  aboutMissionBody:
    "Make UMKM funding more transparent, measurable, and easier to match with suitable investors.",
  aboutTimelineTitle: "Product Journey",
  aboutTimelineResearch:
    "Researched UMKM and investor needs to find a practical funding flow that can be monitored.",
  aboutTimelinePrototype:
    "Marketplace prototype, multi-role dashboard, and AI matching modules were shaped into one product.",
  aboutTimelineCapstone:
    "FundRaise is developed as a capstone project focused on an end-to-end flow from onboarding to profit sharing.",
  servicesComparisonTitle: "Different features for different needs",
  servicesComparisonBody:
    "UMKM and investors use connected flows, while each role still gets controls relevant to their work.",
  servicesUmkmFeature1: "Create a business profile and risk class.",
  servicesUmkmFeature2: "Submit funding proposals and sales reports.",
  servicesUmkmFeature3: "Reply to negotiations and monitor funding progress.",
  servicesInvestorFeature1: "Browse opportunities and AI recommendations.",
  servicesInvestorFeature2: "Compare UMKM before entering negotiation.",
  servicesInvestorFeature3:
    "Pay invoices and monitor the investment portfolio.",
  servicesBottomCtaTitle: "Ready to start from your role?",
  servicesBottomCtaBody:
    "Register as UMKM or investor, then enter the dashboard that matches your funding needs.",
  contactFormSuccessTitle: "Message ready",
  contactFormSuccessBody:
    "Thank you. For this demo, the form shows local feedback without sending data to the backend.",
  contactMapTitle: "Jakarta operating area",
  contactMapBody:
    "Map placeholder prepared for an office embed or FundRaise service area.",
  portfolioDemoMode:
    "Demo mode: portfolio data is still static sample data to show the marketplace experience.",
  portfolioEmpty: "No opportunities match the current filters.",
  portfolioCompareTitle: "Compare Opportunities",
  portfolioCompareBody:
    "Use this table to compare sector, location, target, return, risk, and match score.",
  portfolioSectorFoodBeverage: "Food & Beverage",
  portfolioSectorFashion: "Fashion",
  portfolioSectorAgribusiness: "Agribusiness",
  portfolioStepSave: "Save",
  portfolioStepCompare: "Compare",
  portfolioStepNegotiate: "Negotiate",
  riskLow: "Low",
  riskModerate: "Moderate",
  riskHigh: "High",
  riskMediumShort: "Med",
  socialInstagram: "FundRaise Instagram",
  socialLinkedin: "FundRaise LinkedIn",
  socialEmail: "FundRaise email",
  close: "Close",
  Admin: "Admin",
  footerCopyright: "Copyright {year} FundRaise. All rights reserved.",
});

Object.assign(translations.id, {
  investorSurveyBody:
    "Isi preferensi investor yang sudah sesuai dengan kontrak backend. Setelah disimpan, sistem akan meminta rekomendasi UMKM dari endpoint AI matchmaking.",
  investorSurveyBackendMode:
    "Backend mode: tersimpan ke /user/investor/preferences dan rekomendasi dibaca dari /user/investor/recommendations.",
  surveyCustomerSatisfaction: "Minimal Kepuasan Pelanggan",
  surveyCustomerSatisfactionHelp:
    "Skala 1-5 untuk preferensi kualitas pelanggan UMKM.",
  surveyDigitalScore: "Minimal Digital Adoption Score",
  surveyDigitalScoreHelp:
    "Skala 1-10 untuk kesiapan digital UMKM yang kamu inginkan.",
  surveyNetMargin: "Minimal Net Profit Margin",
  surveyNetMarginHelp:
    "Rentang margin laba bersih yang masih sesuai dengan toleransi investasi.",
  surveyAnnualRevenue: "Minimal Year Revenue",
  surveyAnnualRevenueHelp:
    "Pendapatan tahunan UMKM yang menjadi preferensi awal.",
  surveyBusinessTenure: "Minimal Business Tenure",
  surveyBusinessTenureHelp: "Usia bisnis minimum yang kamu rasa cukup matang.",
  yearUnit: "th",
  saveAndViewMatch: "Simpan & Lihat Match",
  surveySubmitSuccess:
    "Survey berhasil disimpan. Rekomendasi akan diperbarui dari backend.",
  surveySubmitError: "Survey belum berhasil disimpan.",
  surveySyncedBackend:
    "Preferensi ini sudah tersinkron ke backend dan siap dipakai untuk matching.",
  surveyBackendEmpty:
    "Preferensi sudah bisa disimpan, tetapi backend belum mengembalikan rekomendasi. Jalankan refresh setelah data UMKM dan layanan ML tersedia.",
  recommendationDefaultReason:
    "UMKM ini muncul karena cocok dengan preferensi investor yang tersimpan.",
  matchedAt: "Matched",
  openRecommendationPage: "Buka Halaman Rekomendasi",
  bookmarkLoadError: "Bookmark backend belum bisa dimuat.",
  loadingBookmarks: "Memuat bookmark",
  saveUnavailable: "Bisnis ID tidak tersedia untuk bookmark",
  compareMinimumWarning:
    "Endpoint compare backend membutuhkan minimal 2 peluang. Pilih satu peluang lagi dari marketplace.",
  compareBackendFallback:
    "Compare backend belum mengembalikan data, FE menampilkan fallback dari daftar peluang.",
  classPredictedByModel:
    "Class dihitung oleh backend/ML saat profil bisnis disimpan.",
});

Object.assign(translations.en, {
  investorSurveyBody:
    "Fill investor preferences that match the backend contract. After saving, the system requests UMKM recommendations from the AI matchmaking endpoint.",
  investorSurveyBackendMode:
    "Backend mode: saved to /user/investor/preferences and recommendations read from /user/investor/recommendations.",
  surveyCustomerSatisfaction: "Minimum Customer Satisfaction",
  surveyCustomerSatisfactionHelp:
    "Scale 1-5 for the preferred UMKM customer quality.",
  surveyDigitalScore: "Minimum Digital Adoption Score",
  surveyDigitalScoreHelp:
    "Scale 1-10 for the UMKM digital readiness you expect.",
  surveyNetMargin: "Minimum Net Profit Margin",
  surveyNetMarginHelp:
    "Net profit margin range that still fits your investment tolerance.",
  surveyAnnualRevenue: "Minimum Year Revenue",
  surveyAnnualRevenueHelp:
    "Annual UMKM revenue used as the initial preference.",
  surveyBusinessTenure: "Minimum Business Tenure",
  surveyBusinessTenureHelp: "Minimum business age you consider mature enough.",
  yearUnit: "yr",
  saveAndViewMatch: "Save & View Match",
  surveySubmitSuccess:
    "Survey saved successfully. Recommendations will refresh from the backend.",
  surveySubmitError: "Survey could not be saved.",
  surveySyncedBackend:
    "These preferences are synced to the backend and ready for matching.",
  surveyBackendEmpty:
    "Preferences can be saved, but the backend has not returned recommendations yet. Refresh after UMKM data and the ML service are available.",
  recommendationDefaultReason:
    "This UMKM appears because it matches the saved investor preferences.",
  matchedAt: "Matched",
  openRecommendationPage: "Open Recommendation Page",
  bookmarkLoadError: "Backend bookmarks could not be loaded.",
  loadingBookmarks: "Loading bookmarks",
  saveUnavailable: "Business ID is unavailable for bookmark",
  compareMinimumWarning:
    "The backend compare endpoint requires at least 2 opportunities. Select one more opportunity from the marketplace.",
  compareBackendFallback:
    "Backend compare has not returned data, so the FE shows a fallback from the opportunity list.",
  classPredictedByModel:
    "Class is calculated by the backend/ML when the business profile is saved.",
});

Object.assign(translations.id, {
  navHelp: "Bantuan",
  navTrust: "Keamanan",
  dashboardDocuments: "Dokumen",
  helpEyebrow: "Help Center",
  helpTitle: "Pusat Bantuan FundRaise",
  helpBody:
    "Temukan jawaban untuk alur UMKM, investor, dan admin: mulai dari verifikasi akun, cara investasi, invoice, risiko, sampai profit sharing.",
  helpSearchPlaceholder: "Cari pertanyaan, invoice, risiko, verifikasi...",
  helpTopicInvestment: "Cara investasi",
  helpTopicInvestmentBody:
    "Alur dari melihat peluang, membandingkan UMKM, negosiasi, sampai invoice.",
  helpTopicInvoice: "Invoice & pembayaran",
  helpTopicInvoiceBody:
    "Penjelasan status invoice, pembayaran investor, dan pencatatan investasi.",
  helpTopicRisk: "Risiko & return",
  helpTopicRiskBody:
    "Bagaimana risiko, kelas bisnis, dan return tahunan sebaiknya dibaca.",
  helpTopicVerification: "Verifikasi akun",
  helpTopicVerificationBody:
    "Panduan registrasi, verifikasi email, dan kelengkapan profil.",
  faqUmkmProfileQ: "Bagaimana UMKM mulai memakai FundRaise?",
  faqUmkmProfileA:
    "UMKM perlu registrasi, verifikasi email, melengkapi profil bisnis, mengisi profil model bisnis, lalu membuat pengajuan pendanaan.",
  faqUmkmFundingQ: "Kapan pengajuan UMKM bisa dilihat investor?",
  faqUmkmFundingA:
    "Pengajuan perlu direview admin. Setelah status disetujui dan dipublikasikan, peluang dapat muncul di marketplace investor.",
  faqUmkmSalesQ: "Mengapa laporan penjualan dibutuhkan?",
  faqUmkmSalesA:
    "Laporan penjualan dipakai untuk monitoring performa bisnis dan menjadi dasar perhitungan distribusi profit.",
  faqUmkmProfitQ: "Bagaimana profit sharing berjalan?",
  faqUmkmProfitA:
    "Profit distribution dibuat dari data penjualan dan investasi, lalu statusnya dipantau sampai distributed.",
  faqUmkmVerifyQ: "Bagaimana jika email verifikasi gagal?",
  faqUmkmVerifyA:
    "Gunakan halaman verifikasi untuk mengirim ulang email. Jika akun sudah terverifikasi, sistem akan meminta kamu login.",
  faqInvestorStartQ: "Bagaimana investor mulai mencari peluang?",
  faqInvestorStartA:
    "Investor melengkapi survey/preferensi, membuka peluang marketplace, menyimpan atau membandingkan UMKM, lalu masuk ke detail peluang.",
  faqInvestorMatchQ: "Apa fungsi AI Match?",
  faqInvestorMatchA:
    "AI Match memakai preferensi investor dan profil UMKM untuk menampilkan rekomendasi dengan skor kecocokan.",
  faqInvestorInvoiceQ: "Kapan investor mendapat invoice?",
  faqInvestorInvoiceA:
    "Invoice muncul setelah negosiasi masuk ke proses transaksi. Investor dapat membayar invoice dari dashboard.",
  faqInvestorRiskQ: "Apakah investasi pasti untung?",
  faqInvestorRiskA:
    "Tidak. FundRaise membantu menampilkan data dan risiko, tetapi return tetap bergantung pada performa UMKM dan kesepakatan investasi.",
  faqInvestorProfitQ: "Bagaimana investor melihat profit?",
  faqInvestorProfitA:
    "Investor dapat melihat distribusi profit dari dashboard profit setelah laporan penjualan dan distribusi dibuat.",
  faqAdminReviewQ: "Apa tugas admin pada pengajuan?",
  faqAdminReviewA:
    "Admin mereview pengajuan, memeriksa data bisnis, lalu memberi status approved, rejected, atau pending.",
  faqAdminBusinessQ: "Apa yang perlu dipantau admin dari bisnis?",
  faqAdminBusinessA:
    "Admin memantau profil bisnis, kelas, profil model bisnis, pengajuan, negosiasi, invoice, investasi, dan profit distribution.",
  faqAdminInvoiceQ: "Apakah admin mengedit pembayaran investor?",
  faqAdminInvoiceA:
    "Pembayaran invoice dilakukan oleh investor. Admin lebih fokus memantau transaksi dan status operasional.",
  faqAdminProfitQ: "Apa peran admin di profit distribution?",
  faqAdminProfitA:
    "Admin memantau data distribusi, status pending/distributed, dan kelengkapan data penjualan serta investasi.",
  faqAdminUsersQ: "Siapa yang bisa mengelola user dan admin?",
  faqAdminUsersA:
    "Admin dapat melihat user. Mutasi admin operasional dibatasi untuk superadmin.",
  helpNoResults: "Tidak ada FAQ yang cocok dengan pencarian ini.",
  helpCtaTitle: "Masih butuh bantuan?",
  helpCtaBody:
    "Hubungi tim FundRaise agar alur akun, invoice, negosiasi, atau dokumen bisa ditinjau lebih lanjut.",
  trustEyebrow: "Trust & Safety",
  trustTitle: "Kepercayaan dibangun dari data, review, dan transparansi risiko",
  trustBody:
    "FundRaise dirancang untuk membantu UMKM dan investor bekerja dengan alur yang lebih jelas: profil bisnis, review admin, negosiasi, invoice, investasi, dan monitoring profit.",
  trustAssessmentTitle: "Penilaian UMKM",
  trustAssessmentBody:
    "Profil bisnis membaca margin, kepuasan pelanggan, adopsi digital, revenue, dan usia bisnis.",
  trustReviewTitle: "Review admin",
  trustReviewBody:
    "Pengajuan dana melewati proses approval sebelum tampil sebagai peluang investasi.",
  trustRiskTitle: "Risiko terbuka",
  trustRiskBody:
    "Investor melihat indikator risiko, return, progress pendanaan, dan status transaksi sebelum mengambil keputusan.",
  trustPrivacyTitle: "Perlindungan data",
  trustPrivacyBody:
    "Data akun, dokumen, dan transaksi perlu dipakai sesuai kebutuhan operasional platform.",
  trustFlowTitle: "Bagaimana peluang dinilai",
  trustFlowBody:
    "Flow ini membantu pengguna memahami kenapa sebuah peluang dapat masuk ke marketplace dan bagaimana prosesnya diawasi.",
  trustStepProfile: "Profil bisnis dilengkapi",
  trustStepProfileBody:
    "UMKM mengisi data usaha, profil model bisnis, dan dokumen pendukung.",
  trustStepSubmission: "Pengajuan direview",
  trustStepSubmissionBody:
    "Admin memeriksa target pendanaan, return, dan kelengkapan data sebelum publikasi.",
  trustStepNegotiation: "Negosiasi dicatat",
  trustStepNegotiationBody:
    "Penawaran nominal, return, catatan, accept, reject, dan status deal tersimpan di dashboard.",
  trustStepMonitoring: "Investasi dimonitor",
  trustStepMonitoringBody:
    "Invoice, pembayaran, investasi aktif, laporan penjualan, dan profit distribution dapat dipantau.",
  trustProtectionTitle: "Lapisan perlindungan platform",
  trustProtectionBody:
    "Halaman ini menjelaskan sinyal kepercayaan yang perlu terlihat sebelum platform menyentuh transaksi uang.",
  trustProtectionVerification: "Verifikasi dan identitas",
  trustProtectionVerificationBody:
    "Email verification dan data profil membantu memastikan akun siap memakai dashboard.",
  trustProtectionInvoice: "Invoice dan bukti bayar",
  trustProtectionInvoiceBody:
    "Investor melihat invoice dan status pembayaran sebagai bagian dari jejak transaksi.",
  trustProtectionProfit: "Profit distribution",
  trustProtectionProfitBody:
    "Distribusi profit perlu terhubung dengan laporan penjualan dan investasi yang valid.",
  trustProtectionData: "Kontrol data sensitif",
  trustProtectionDataBody:
    "Dokumen dan data transaksi sebaiknya dibatasi sesuai role dan kebutuhan operasional.",
  documentCenterTitle: "Document Center",
  documentCenterUmkmBody:
    "Kelola metadata dokumen usaha, proposal, laporan penjualan, dan rekening sebelum backend dokumen tersedia.",
  documentCenterInvestorBody:
    "Kelola metadata dokumen investor, bukti pembayaran, invoice, dan agreement summary sebelum backend dokumen tersedia.",
  documentCompleteness: "Kelengkapan",
  documentUploaded: "Terunggah",
  documentRequired: "Wajib",
  documentLocalMode: "Mode lokal",
  umkmLegalDoc: "Legalitas usaha",
  umkmLegalDocBody: "NIB, izin usaha, atau dokumen pendukung identitas bisnis.",
  umkmProposalDoc: "Proposal pendanaan",
  umkmProposalDocBody:
    "Ringkasan kebutuhan modal, target pendanaan, penggunaan dana, dan return.",
  umkmSalesDoc: "Laporan penjualan",
  umkmSalesDocBody:
    "Dokumen pendukung performa penjualan bulanan atau periode tertentu.",
  umkmBankDoc: "Informasi rekening",
  umkmBankDocBody: "Rekening bisnis untuk kebutuhan rekonsiliasi transaksi.",
  investorIdentityDoc: "Identitas investor",
  investorIdentityDocBody:
    "Dokumen identitas untuk kebutuhan verifikasi akun investor.",
  investorPaymentDoc: "Bukti pembayaran",
  investorPaymentDocBody: "Bukti transfer atau pembayaran invoice investasi.",
  investorAgreementDoc: "Agreement summary",
  investorAgreementDocBody:
    "Ringkasan kesepakatan nominal, return, dan catatan deal.",
  investorPortfolioDoc: "Statement portfolio",
  investorPortfolioDocBody:
    "Ringkasan investasi aktif dan distribusi profit yang diterima.",
  required: "Wajib",
  recommended: "Disarankan",
  upload: "Upload",
  replace: "Ganti",
  documentLocalNoticeTitle: "Belum tersambung backend",
  documentLocalNoticeBody:
    "Upload di halaman ini menyimpan metadata file di browser untuk kebutuhan demo. File asli belum dikirim ke server.",
  documentConnectedFlowTitle: "Dokumen yang terkait flow",
  documentFlowInvoice: "Invoice investasi",
  documentFlowPayment: "Bukti pembayaran",
  documentFlowContract: "Kontrak atau summary deal",
  documentFlowProfit: "Laporan profit sharing",
  dealTimelineNegotiation:
    "Penawaran, return, dan catatan negosiasi menjadi awal deal room.",
  dealTimelineInvoice:
    "Invoice ditampilkan saat negosiasi lanjut ke proses transaksi.",
  dealTimelinePayment:
    "Status paid menjadi sinyal bahwa investasi siap dicatat.",
  dealTimelineInvestment:
    "Investasi aktif muncul setelah invoice dibayar dan tercatat.",
  dealTimelineProfit:
    "Profit distribution dipantau setelah laporan penjualan tersedia.",
  payment: "Pembayaran",
  dealInvoicePayment: "Invoice & Pembayaran",
  dealInvestmentProfit: "Investasi & Profit",
  dealDocuments: "Dokumen Deal",
  dealDocInvoice: "Invoice",
  dealDocPaymentProof: "Bukti bayar",
  dealDocAgreement: "Summary kesepakatan",
  dealDocProfitReport: "Laporan profit",
  dealNotesTitle: "Catatan Deal",
  dealNotesPlaceholder: "Tambahkan catatan internal untuk deal ini",
  dealNotesEmpty: "Belum ada catatan untuk deal ini.",
  pending: "Pending",
  completed: "Selesai",
});

Object.assign(translations.en, {
  navHelp: "Help",
  navTrust: "Safety",
  dashboardDocuments: "Documents",
  helpEyebrow: "Help Center",
  helpTitle: "FundRaise Help Center",
  helpBody:
    "Find answers for UMKM, investors, and admins: account verification, investing, invoices, risk, and profit sharing.",
  helpSearchPlaceholder: "Search questions, invoice, risk, verification...",
  helpTopicInvestment: "How investing works",
  helpTopicInvestmentBody:
    "The flow from browsing opportunities, comparing UMKM, negotiating, to invoices.",
  helpTopicInvoice: "Invoices & payments",
  helpTopicInvoiceBody:
    "Explanation of invoice status, investor payment, and investment records.",
  helpTopicRisk: "Risk & return",
  helpTopicRiskBody:
    "How risk, business classes, and annual returns should be read.",
  helpTopicVerification: "Account verification",
  helpTopicVerificationBody:
    "Guidance for registration, email verification, and profile completion.",
  faqUmkmProfileQ: "How does an UMKM start using FundRaise?",
  faqUmkmProfileA:
    "UMKM register, verify email, complete business profile, fill business model profile, then create a funding submission.",
  faqUmkmFundingQ: "When can investors see an UMKM submission?",
  faqUmkmFundingA:
    "The submission must be reviewed by admin. Once approved and published, it can appear in the investor marketplace.",
  faqUmkmSalesQ: "Why are sales reports needed?",
  faqUmkmSalesA:
    "Sales reports are used to monitor business performance and support profit distribution calculations.",
  faqUmkmProfitQ: "How does profit sharing work?",
  faqUmkmProfitA:
    "Profit distribution is created from sales and investment data, then tracked until distributed.",
  faqUmkmVerifyQ: "What if email verification fails?",
  faqUmkmVerifyA:
    "Use the verification page to resend email. If the account is already verified, the system will ask you to log in.",
  faqInvestorStartQ: "How does an investor start finding opportunities?",
  faqInvestorStartA:
    "Investors complete survey/preferences, open the marketplace, save or compare UMKM, then enter an opportunity detail.",
  faqInvestorMatchQ: "What does AI Match do?",
  faqInvestorMatchA:
    "AI Match uses investor preferences and UMKM profiles to display recommendations with compatibility scores.",
  faqInvestorInvoiceQ: "When does an investor receive an invoice?",
  faqInvestorInvoiceA:
    "Invoices appear after negotiation moves into transaction. Investors can pay invoices from the dashboard.",
  faqInvestorRiskQ: "Is investment profit guaranteed?",
  faqInvestorRiskA:
    "No. FundRaise helps display data and risks, but returns still depend on UMKM performance and investment agreements.",
  faqInvestorProfitQ: "How does an investor see profit?",
  faqInvestorProfitA:
    "Investors can see profit distributions from the profit dashboard after sales reports and distributions are created.",
  faqAdminReviewQ: "What is the admin role in submissions?",
  faqAdminReviewA:
    "Admins review submissions, check business data, then set approved, rejected, or pending status.",
  faqAdminBusinessQ: "What should admins monitor from businesses?",
  faqAdminBusinessA:
    "Admins monitor business profiles, classes, model profiles, submissions, negotiations, invoices, investments, and profit distributions.",
  faqAdminInvoiceQ: "Does admin edit investor payments?",
  faqAdminInvoiceA:
    "Invoice payment is done by investors. Admins focus on monitoring transactions and operational status.",
  faqAdminProfitQ: "What is admin's role in profit distribution?",
  faqAdminProfitA:
    "Admins monitor distributions, pending/distributed status, and data completeness across sales and investments.",
  faqAdminUsersQ: "Who can manage users and admins?",
  faqAdminUsersA:
    "Admins can view users. Operational admin mutations are limited to superadmins.",
  helpNoResults: "No FAQ matches this search.",
  helpCtaTitle: "Still need help?",
  helpCtaBody:
    "Contact the FundRaise team so account, invoice, negotiation, or document flows can be reviewed further.",
  trustEyebrow: "Trust & Safety",
  trustTitle: "Trust is built from data, review, and risk transparency",
  trustBody:
    "FundRaise is designed to help UMKM and investors work through clearer flows: business profiles, admin review, negotiations, invoices, investments, and profit monitoring.",
  trustAssessmentTitle: "UMKM assessment",
  trustAssessmentBody:
    "Business profiles read margin, customer satisfaction, digital adoption, revenue, and business tenure.",
  trustReviewTitle: "Admin review",
  trustReviewBody:
    "Funding submissions pass approval before appearing as investment opportunities.",
  trustRiskTitle: "Visible risk",
  trustRiskBody:
    "Investors see risk indicators, return, funding progress, and transaction status before deciding.",
  trustPrivacyTitle: "Data protection",
  trustPrivacyBody:
    "Account, document, and transaction data should be used only for platform operational needs.",
  trustFlowTitle: "How opportunities are assessed",
  trustFlowBody:
    "This flow helps users understand why an opportunity enters the marketplace and how the process is monitored.",
  trustStepProfile: "Business profile completed",
  trustStepProfileBody:
    "UMKM fill business data, model profile, and supporting documents.",
  trustStepSubmission: "Submission reviewed",
  trustStepSubmissionBody:
    "Admins check funding target, return, and data completeness before publication.",
  trustStepNegotiation: "Negotiation recorded",
  trustStepNegotiationBody:
    "Offer nominal, return, notes, accept, reject, and deal status are stored in the dashboard.",
  trustStepMonitoring: "Investment monitored",
  trustStepMonitoringBody:
    "Invoices, payments, active investments, sales reports, and profit distributions can be tracked.",
  trustProtectionTitle: "Platform protection layers",
  trustProtectionBody:
    "This page explains trust signals that should be visible before the platform handles money movement.",
  trustProtectionVerification: "Verification and identity",
  trustProtectionVerificationBody:
    "Email verification and profile data help ensure accounts are ready to use the dashboard.",
  trustProtectionInvoice: "Invoices and payment proof",
  trustProtectionInvoiceBody:
    "Investors see invoices and payment status as part of the transaction trail.",
  trustProtectionProfit: "Profit distribution",
  trustProtectionProfitBody:
    "Profit distribution should connect with valid sales reports and investments.",
  trustProtectionData: "Sensitive data control",
  trustProtectionDataBody:
    "Documents and transaction data should be limited by role and operational need.",
  documentCenterTitle: "Document Center",
  documentCenterUmkmBody:
    "Manage local metadata for business legality, proposals, sales reports, and bank details before document backend is available.",
  documentCenterInvestorBody:
    "Manage local metadata for investor documents, payment proof, invoices, and agreement summaries before document backend is available.",
  documentCompleteness: "Completeness",
  documentUploaded: "Uploaded",
  documentRequired: "Required",
  documentLocalMode: "Local mode",
  umkmLegalDoc: "Business legality",
  umkmLegalDocBody:
    "NIB, business license, or supporting business identity documents.",
  umkmProposalDoc: "Funding proposal",
  umkmProposalDocBody:
    "Summary of capital needs, funding target, fund usage, and return.",
  umkmSalesDoc: "Sales report",
  umkmSalesDocBody:
    "Supporting document for monthly or period sales performance.",
  umkmBankDoc: "Bank account information",
  umkmBankDocBody: "Business bank account for transaction reconciliation.",
  investorIdentityDoc: "Investor identity",
  investorIdentityDocBody:
    "Identity document for investor account verification.",
  investorPaymentDoc: "Payment proof",
  investorPaymentDocBody: "Transfer or invoice payment proof for investment.",
  investorAgreementDoc: "Agreement summary",
  investorAgreementDocBody: "Summary of nominal, return, and deal notes.",
  investorPortfolioDoc: "Portfolio statement",
  investorPortfolioDocBody:
    "Summary of active investments and received profit distributions.",
  required: "Required",
  recommended: "Recommended",
  upload: "Upload",
  replace: "Replace",
  documentLocalNoticeTitle: "Not connected to backend yet",
  documentLocalNoticeBody:
    "Uploads on this page store file metadata in the browser for demo needs. Actual files are not sent to the server yet.",
  documentConnectedFlowTitle: "Documents tied to the flow",
  documentFlowInvoice: "Investment invoice",
  documentFlowPayment: "Payment proof",
  documentFlowContract: "Contract or deal summary",
  documentFlowProfit: "Profit sharing report",
  dealTimelineNegotiation:
    "Offer, return, and negotiation notes start the deal room.",
  dealTimelineInvoice:
    "Invoices appear when negotiation moves into transaction.",
  dealTimelinePayment:
    "Paid status signals that investment is ready to be recorded.",
  dealTimelineInvestment:
    "Active investment appears after the invoice is paid and recorded.",
  dealTimelineProfit:
    "Profit distribution is monitored after sales reports are available.",
  payment: "Payment",
  dealInvoicePayment: "Invoice & Payment",
  dealInvestmentProfit: "Investment & Profit",
  dealDocuments: "Deal Documents",
  dealDocInvoice: "Invoice",
  dealDocPaymentProof: "Payment proof",
  dealDocAgreement: "Agreement summary",
  dealDocProfitReport: "Profit report",
  dealNotesTitle: "Deal Notes",
  dealNotesPlaceholder: "Add an internal note for this deal",
  dealNotesEmpty: "No notes for this deal yet.",
  pending: "Pending",
  completed: "Completed",
});

Object.assign(translations.id, {
  investorOnboarding: "Onboarding Investor",
  investorOnboardingTitle: "Mulai perjalanan investasi kamu",
  investorOnboardingBody:
    "Ikuti langkah berikut agar profil investor kamu siap dan peluang yang tepat bisa ditemukan melalui AI matchmaking.",
  investorOnboardingProgress: "Progress onboarding investor",
  investorStepProfileTitle: "Lengkapi Profil Akun",
  investorStepProfileBody:
    "Pastikan nama, email, dan nomor telepon sudah terisi agar identitas kamu valid di platform.",
  investorStepProfileTodo:
    "Profil akun belum lengkap. Lengkapi nama dan nomor telepon.",
  investorStepProfileDone: "Profil akun sudah lengkap.",
  investorStepPreferenceTitle: "Atur Preferensi Investasi",
  investorStepPreferenceBody:
    "Tentukan sektor, nominal minimum, toleransi risiko, dan target return agar sistem bisa memberi rekomendasi yang relevan.",
  investorStepPreferenceTodo: "Preferensi investasi belum diatur.",
  investorStepPreferenceDone: "Preferensi investasi sudah disimpan.",
  investorStepSurveyTitle: "Isi Survey Investor",
  investorStepSurveyBody:
    "Survey singkat untuk membantu sistem memahami pola investasi dan profil risiko kamu lebih dalam.",
  investorStepSurveyTodo: "Lengkapi survey agar rekomendasi AI lebih akurat.",
  investorStepOpportunityTitle: "Telusuri Peluang UMKM",
  investorStepOpportunityBody:
    "Jelajahi marketplace peluang, gunakan filter sektor dan risiko, lalu simpan kandidat yang menarik.",
  investorStepOpportunityTodo:
    "Mulai telusuri dan simpan peluang UMKM yang sesuai.",
  investorStepNegotiationTitle: "Mulai Negosiasi",
  investorStepNegotiationBody:
    "Kirim penawaran investasi, diskusikan nominal dan return, lalu tunggu konfirmasi dari UMKM.",
  investorStepNegotiationTodo:
    "Buka peluang yang kamu minati dan kirim penawaran awal.",
  investorStepNegotiationDone: "{count} negosiasi aktif.",
  investorStepPortfolioTitle: "Pantau Portfolio & Profit",
  investorStepPortfolioBody:
    "Setelah negosiasi selesai, investasi akan dicatat. Pantau invoice, nilai investasi, dan distribusi profit dari sini.",
  investorStepPortfolioTodo:
    "Portfolio akan terisi setelah negosiasi pertama selesai.",
  investorStepPortfolioDone: "{count} investasi aktif dalam portfolio.",
  browseOpportunities: "Telusuri Peluang",
  viewPortfolio: "Lihat Portfolio",
  setPreferences: "Atur Preferensi",
  reviewPreferences: "Review Preferensi",
  completeSurvey: "Isi Survey",
  reviewSurvey: "Review Survey",
  navTerms: "Syarat Layanan",
  navPrivacy: "Kebijakan Privasi",
});

Object.assign(translations.en, {
  investorOnboarding: "Investor Onboarding",
  investorOnboardingTitle: "Start your investment journey",
  investorOnboardingBody:
    "Follow these steps to get your investor profile ready and let the AI matchmaking surface the right UMKM opportunities for you.",
  investorOnboardingProgress: "Investor onboarding progress",
  investorStepProfileTitle: "Complete Account Profile",
  investorStepProfileBody:
    "Make sure your name, email, and phone number are filled in so your identity is valid on the platform.",
  investorStepProfileTodo:
    "Account profile is incomplete. Add your name and phone number.",
  investorStepProfileDone: "Account profile is complete.",
  investorStepPreferenceTitle: "Set Investment Preferences",
  investorStepPreferenceBody:
    "Define sectors, minimum nominal, risk tolerance, and return targets so the system can give relevant recommendations.",
  investorStepPreferenceTodo: "Investment preferences have not been set.",
  investorStepPreferenceDone: "Investment preferences saved.",
  investorStepSurveyTitle: "Complete Investor Survey",
  investorStepSurveyBody:
    "A quick survey to help the system understand your investment patterns and risk profile in depth.",
  investorStepSurveyTodo:
    "Complete the survey for more accurate AI recommendations.",
  investorStepOpportunityTitle: "Browse UMKM Opportunities",
  investorStepOpportunityBody:
    "Explore the opportunity marketplace, use sector and risk filters, then save interesting candidates.",
  investorStepOpportunityTodo:
    "Start browsing and saving relevant UMKM opportunities.",
  investorStepNegotiationTitle: "Start a Negotiation",
  investorStepNegotiationBody:
    "Send an investment offer, discuss the nominal and return, then wait for confirmation from the UMKM.",
  investorStepNegotiationTodo:
    "Open an opportunity you like and send an initial offer.",
  investorStepNegotiationDone: "{count} active negotiations.",
  investorStepPortfolioTitle: "Monitor Portfolio & Profit",
  investorStepPortfolioBody:
    "After a negotiation closes, the investment is recorded. Track invoices, investment value, and profit distributions here.",
  investorStepPortfolioTodo:
    "Portfolio will fill after the first negotiation completes.",
  investorStepPortfolioDone: "{count} active investments in portfolio.",
  browseOpportunities: "Browse Opportunities",
  viewPortfolio: "View Portfolio",
  setPreferences: "Set Preferences",
  reviewPreferences: "Review Preferences",
  completeSurvey: "Complete Survey",
  reviewSurvey: "Review Survey",
  navTerms: "Terms of Service",
  navPrivacy: "Privacy Policy",
});

type TranslateParams = Record<string, string | number>;

type LanguageContextValue = {
  language: Language;
  languageLabel: string;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslateParams) => string;
};

const storageKey = "fundraise_language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

const detectLanguage = (): Language => {
  const stored = localStorage.getItem(storageKey);
  if (stored === "id" || stored === "en") return stored;
  return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    detectLanguage(),
  );

  useEffect(() => {
    localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslateParams) => {
      const template =
        translations[language][key] ?? translations.id[key] ?? key;
      if (!params) return template;
      return Object.entries(params).reduce(
        (text, [paramKey, value]) =>
          text.replaceAll(`{${paramKey}}`, String(value)),
        template,
      );
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      languageLabel: labels[language],
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
