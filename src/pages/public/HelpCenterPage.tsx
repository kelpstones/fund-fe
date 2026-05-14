import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeHelp,
  Building2,
  HelpCircle,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const roles = [
  { key: "umkm", label: "roleUmkm", icon: Building2 },
  { key: "investor", label: "roleInvestor", icon: UserRound },
] as const;

const faqItems = {
  umkm: [
    ["faqUmkmProfileQ", "faqUmkmProfileA"],
    ["faqUmkmFundingQ", "faqUmkmFundingA"],
    ["faqUmkmSalesQ", "faqUmkmSalesA"],
    ["faqUmkmProfitQ", "faqUmkmProfitA"],
    ["faqUmkmVerifyQ", "faqUmkmVerifyA"],
  ],
  investor: [
    ["faqInvestorStartQ", "faqInvestorStartA"],
    ["faqInvestorMatchQ", "faqInvestorMatchA"],
    ["faqInvestorInvoiceQ", "faqInvestorInvoiceA"],
    ["faqInvestorRiskQ", "faqInvestorRiskA"],
    ["faqInvestorProfitQ", "faqInvestorProfitA"],
  ],
} as const;

const topicCards = [
  ["helpTopicInvestment", "helpTopicInvestmentBody", Users],
  ["helpTopicInvoice", "helpTopicInvoiceBody", BadgeHelp],
  ["helpTopicRisk", "helpTopicRiskBody", ShieldCheck],
  ["helpTopicVerification", "helpTopicVerificationBody", HelpCircle],
] as const;

export function HelpCenterPage() {
  const { t } = useLanguage();
  const [activeRole, setActiveRole] = useState<keyof typeof faqItems>("umkm");
  const [query, setQuery] = useState("");

  const filteredFaq = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const items = faqItems[activeRole];
    if (!needle) return items;
    return items.filter(([question, answer]) =>
      `${t(question)} ${t(answer)}`.toLowerCase().includes(needle),
    );
  }, [activeRole, query, t]);

  return (
    <main className="bg-white">
      <section className="border-b border-base-300 bg-base-200">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-primary">{t("helpEyebrow")}</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-tight tracking-normal">
              {t("helpTitle")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral/65">
              {t("helpBody")}
            </p>
          </div>
          <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
            <label className="input input-bordered flex items-center gap-2 rounded-md">
              <Search size={18} className="text-neutral/40" />
              <input
                className="w-full min-w-0 bg-transparent outline-none"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("helpSearchPlaceholder")}
              />
            </label>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {topicCards.map(([title, body, Icon]) => (
                <div key={title} className="rounded-md border border-base-300 p-4">
                  <Icon className="text-primary" size={20} />
                  <h2 className="mt-3 font-black">{t(title)}</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral/60">{t(body)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row">
          {roles.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`btn h-auto flex-1 justify-start rounded-md p-4 text-left ${
                activeRole === key ? "btn-primary text-white" : "btn-outline"
              }`}
              onClick={() => setActiveRole(key)}
            >
              <Icon size={20} />
              <span>{t(label)}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4">
          {filteredFaq.map(([question, answer]) => (
            <details key={question} className="group rounded-md border border-base-300 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black">
                {t(question)}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-base-200 text-primary group-open:bg-primary group-open:text-white">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-neutral/65">{t(answer)}</p>
            </details>
          ))}
          {filteredFaq.length === 0 ? (
            <div className="rounded-md border border-base-300 bg-base-200 p-6 text-center text-sm font-semibold text-neutral/55">
              {t("helpNoResults")}
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-white px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-md bg-neutral p-8 text-white lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-normal">{t("helpCtaTitle")}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{t("helpCtaBody")}</p>
            </div>
            <Link to="/kontak" className="btn btn-primary rounded-md text-white">
              {t("navContact")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
