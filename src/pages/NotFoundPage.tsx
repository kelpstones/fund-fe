import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, HelpCircle } from "lucide-react";
import { Logo } from "../components/Logo";
import { useLanguage } from "../lib/i18n/LanguageProvider";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-base-200 px-4 py-16 text-center">
      <Logo />

      <div className="mt-12 w-full max-w-md">
        <h1 className="text-8xl font-black tracking-normal text-neutral">404</h1>
        <p className="mt-4 text-base leading-7 text-neutral/60">
          {t("notFoundBody")}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/" className="btn btn-primary h-12 rounded-md px-7 text-white">
            <Home size={18} /> {t("notFoundHome")}
          </Link>
          <button
            className="btn btn-outline h-12 rounded-md px-7"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} /> {t("notFoundBack")}
          </button>
        </div>

        <div className="mt-6">
          <Link to="/bantuan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <HelpCircle size={15} /> {t("notFoundHelp")}
          </Link>
        </div>
      </div>
    </main>
  );
}
