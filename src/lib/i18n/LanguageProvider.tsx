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

type TranslationKey =
  | "language"
  | "loginTitle"
  | "loginSubtitle"
  | "email"
  | "password"
  | "loginButton"
  | "loginError"
  | "noAccount"
  | "registerLink"
  | "registerTitle"
  | "registerSubtitle"
  | "roleUmkm"
  | "roleInvestor"
  | "name"
  | "nik"
  | "phone"
  | "confirmPassword"
  | "registerButton"
  | "hasAccount"
  | "loginLink"
  | "navHome"
  | "navAbout"
  | "navServices"
  | "navPortfolio"
  | "navContact"
  | "getStarted"
  | "navigation";

const labels: Record<Language, string> = {
  id: "Indonesia",
  en: "English",
};

const translations: Record<Language, Record<TranslationKey, string>> = {
  id: {
    language: "Bahasa",
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
  },
  en: {
    language: "Language",
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
  },
};

type LanguageContextValue = {
  language: Language;
  languageLabel: string;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const storageKey = "fundraise_language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

const detectLanguage = (): Language => {
  const stored = localStorage.getItem(storageKey);
  if (stored === "id" || stored === "en") return stored;
  return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => detectLanguage());

  useEffect(() => {
    localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[language][key],
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

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
