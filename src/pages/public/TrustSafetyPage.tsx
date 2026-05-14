import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FileCheck2,
  LockKeyhole,
  Scale,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const safetyCards = [
  ["trustAssessmentTitle", "trustAssessmentBody", Scale],
  ["trustReviewTitle", "trustReviewBody", ClipboardCheck],
  ["trustRiskTitle", "trustRiskBody", TrendingUp],
  ["trustPrivacyTitle", "trustPrivacyBody", LockKeyhole],
] as const;

const reviewSteps = [
  ["trustStepProfile", "trustStepProfileBody"],
  ["trustStepSubmission", "trustStepSubmissionBody"],
  ["trustStepNegotiation", "trustStepNegotiationBody"],
  ["trustStepMonitoring", "trustStepMonitoringBody"],
] as const;

const protectionRows = [
  ["trustProtectionVerification", "trustProtectionVerificationBody"],
  ["trustProtectionInvoice", "trustProtectionInvoiceBody"],
  ["trustProtectionProfit", "trustProtectionProfitBody"],
  ["trustProtectionData", "trustProtectionDataBody"],
] as const;

export function TrustSafetyPage() {
  const { t } = useLanguage();

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden border-b border-base-300 bg-neutral text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-accent">{t("trustEyebrow")}</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-tight tracking-normal">
              {t("trustTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">
              {t("trustBody")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/bantuan" className="btn btn-primary rounded-md text-white">
                {t("navHelp")}
                <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn btn-outline border-white/25 text-white hover:bg-white hover:text-neutral">
                {t("getStarted")}
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {safetyCards.map(([title, body, Icon]) => (
              <article key={title} className="rounded-md border border-white/10 bg-white/10 p-5">
                <Icon className="text-accent" size={24} />
                <h2 className="mt-4 text-lg font-black">{t(title)}</h2>
                <p className="mt-2 text-sm leading-6 text-white/65">{t(body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <ShieldCheck className="text-primary" size={32} />
            <h2 className="mt-5 text-4xl font-black tracking-normal">{t("trustFlowTitle")}</h2>
            <p className="mt-4 text-sm leading-6 text-neutral/60">{t("trustFlowBody")}</p>
          </div>
          <div className="grid gap-4">
            {reviewSteps.map(([title, body], index) => (
              <article key={title} className="grid gap-4 rounded-md border border-base-300 bg-white p-5 shadow-sm sm:grid-cols-[auto_1fr]">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-primary text-sm font-black text-white">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-black">{t(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral/60">{t(body)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-base-300 bg-base-200">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <FileCheck2 className="text-primary" size={30} />
            <h2 className="mt-5 text-4xl font-black tracking-normal">{t("trustProtectionTitle")}</h2>
            <p className="mt-4 text-sm leading-6 text-neutral/60">{t("trustProtectionBody")}</p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {protectionRows.map(([title, body]) => (
              <article key={title} className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
                <BadgeCheck className="text-success" size={22} />
                <h3 className="mt-4 font-black">{t(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral/60">{t(body)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
