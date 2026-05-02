import type { ComponentType } from "react";
import { useLanguage, type Language } from "../lib/i18n/LanguageProvider";

type LanguageSwitcherProps = {
  compact?: boolean;
  className?: string;
};

type FlagProps = {
  className?: string;
};

function IndonesiaFlag({ className = "" }: FlagProps) {
  return (
    <svg
      className={`h-6 w-6 shrink-0 overflow-hidden rounded-full border border-base-300 shadow-sm ${className}`}
      viewBox="0 0 28 20"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="28" height="10" fill="#ef4444" />
      <rect y="10" width="28" height="10" fill="#ffffff" />
    </svg>
  );
}

function UnitedKingdomFlag({ className = "" }: FlagProps) {
  return (
    <svg
      className={`h-6 w-6 shrink-0 overflow-hidden rounded-full border border-base-300 shadow-sm ${className}`}
      viewBox="0 0 60 36"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="60" height="36" fill="#012169" />
      <path d="M-6 0 60 39M66 0 0 39" stroke="#ffffff" strokeWidth="7" />
      <path d="M-6 0 60 39M66 0 0 39" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0v36M0 18h60" stroke="#ffffff" strokeWidth="11" />
      <path d="M30 0v36M0 18h60" stroke="#c8102e" strokeWidth="7" />
    </svg>
  );
}

const options: Array<{
  value: Language;
  label: string;
  shortLabel: string;
  Flag: ComponentType<FlagProps>;
}> = [
  { value: "id", label: "Indonesia", shortLabel: "ID", Flag: IndonesiaFlag },
  { value: "en", label: "English", shortLabel: "EN", Flag: UnitedKingdomFlag },
];

export function LanguageSwitcher({ compact = false, className = "" }: LanguageSwitcherProps) {
  const { language, languageLabel, setLanguage, t } = useLanguage();
  const activeOption = options.find((option) => option.value === language) ?? options[0];
  const ActiveFlag = activeOption.Flag;

  return (
    <div className={`dropdown dropdown-end ${className}`}>
      <button
        className={`btn btn-outline btn-sm justify-start rounded-md bg-white ${compact ? "w-24" : "w-40"}`}
        aria-label={t("language")}
      >
        <ActiveFlag />
        <span className={compact ? "w-6 text-left" : "w-24 text-left"}>
          {compact ? activeOption.shortLabel : languageLabel}
        </span>
      </button>
      <ul className="menu dropdown-content z-10 mt-2 w-44 rounded-md border border-base-300 bg-white p-2 shadow-soft">
        {options.map((option) => {
          const OptionFlag = option.Flag;
          return (
            <li key={option.value}>
              <button
                className={language === option.value ? "active" : ""}
                onClick={() => setLanguage(option.value)}
              >
                <OptionFlag />
                <span className="font-bold">{option.shortLabel}</span>
                <span>{option.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
