import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { enTranslations } from "./locales/en";
import { idTranslations } from "./locales/id";

export type Language = "id" | "en";

export type TranslationKey = string;

const labels: Record<Language, string> = {
  id: "Indonesia",
  en: "English",
};

const translations: Record<Language, Record<TranslationKey, string>> = {
  id: idTranslations,
  en: enTranslations,
};

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
