import { useEffect, useRef, useState, type ComponentType } from "react";
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeOption = options.find((option) => option.value === language) ?? options[0];
  const ActiveFlag = activeOption.Flag;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className={`btn btn-outline btn-sm rounded-md bg-white ${
          compact
            ? "h-10 min-w-[96px] justify-center gap-2 px-3"
            : "h-10 w-40 justify-start gap-3 px-3"
        }`}
        aria-label={t("language")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <ActiveFlag className="h-5 w-5" />
        <span
          className={`font-semibold leading-none ${
            compact ? "min-w-[2ch] text-center" : "w-24 text-left"
          }`}
        >
          {compact ? activeOption.shortLabel : languageLabel}
        </span>
      </button>
      {open ? (
        <ul className="menu absolute right-0 z-[1300] mt-2 w-44 rounded-md border border-base-300 bg-white p-2 shadow-soft">
          {options.map((option) => {
            const OptionFlag = option.Flag;
            const active = language === option.value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  className={active ? "active" : ""}
                  onClick={() => {
                    setLanguage(option.value);
                    setOpen(false);
                  }}
                >
                  <OptionFlag />
                  <span className="font-bold">{option.shortLabel}</span>
                  <span>{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
