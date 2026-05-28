import {
  ArrowRight,
  BarChart3,
  FileCheck2,
  Handshake,
  LineChart,
  Receipt,
  Scale,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const services = [
  {
    title: "servicesBusinessTitle",
    body: "servicesBusinessBody",
    icon: FileCheck2,
    cardClass: "border-emerald-200 bg-emerald-500 text-white",
    iconClass: "bg-white text-emerald-600",
  },
  {
    title: "servicesSubmissionTitle",
    body: "servicesSubmissionBody",
    icon: BarChart3,
    cardClass: "border-blue-200 bg-blue-600 text-white",
    iconClass: "bg-white text-blue-600",
  },
  {
    title: "servicesAiTitle",
    body: "servicesAiBody",
    icon: Scale,
    cardClass: "border-cyan-200 bg-cyan-500 text-white",
    iconClass: "bg-white text-cyan-600",
  },
  {
    title: "servicesNegotiationTitle",
    body: "servicesNegotiationBody",
    icon: Handshake,
    cardClass: "border-amber-200 bg-amber-400 text-neutral",
    iconClass: "bg-white text-amber-600",
  },
  {
    title: "servicesInvoiceTitle",
    body: "servicesInvoiceBody",
    icon: Receipt,
    cardClass: "border-rose-200 bg-rose-500 text-white",
    iconClass: "bg-white text-rose-600",
  },
  {
    title: "servicesProfitTitle",
    body: "servicesProfitBody",
    icon: LineChart,
    cardClass: "border-lime-200 bg-lime-400 text-neutral",
    iconClass: "bg-white text-lime-700",
  },
];

export function ServicesPage() {
  const { t } = useLanguage();

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl font-black leading-tight tracking-normal">
              {t("servicesHeroTitle")}
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral/65">
              {t("servicesHeroBody")}
            </p>
          </div>
          <div className="aspect-video overflow-hidden rounded-md border border-base-300 bg-base-200 shadow-sm">
            <img
              src="/images/services.webp"
              alt={t("servicesImageAlt")}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ title, body, icon: Icon, cardClass, iconClass }) => (
            <div
              key={title}
              className={`flex gap-4 rounded-md border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft sm:p-6 md:block ${cardClass}`}
            >
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-md ${iconClass}`}
              >
                <Icon size={22} />
              </div>
              <div className="min-w-0 md:mt-5">
                <h2 className="text-lg font-black">{t(title)}</h2>
                <p className="mt-2 text-sm font-medium leading-6 opacity-82 md:mt-3">
                  {t(body)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="border-y border-base-300 bg-base-200">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black tracking-normal">
              {t("servicesComparisonTitle")}
            </h2>
            <p className="mt-4 text-sm leading-6 text-neutral/60">
              {t("servicesComparisonBody")}
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {[
              [
                "roleUmkm",
                [
                  "servicesUmkmFeature1",
                  "servicesUmkmFeature2",
                  "servicesUmkmFeature3",
                ],
              ],
              [
                "roleInvestor",
                [
                  "servicesInvestorFeature1",
                  "servicesInvestorFeature2",
                  "servicesInvestorFeature3",
                ],
              ],
            ].map(([title, items]) => (
              <div
                key={String(title)}
                className="rounded-md border border-base-300 bg-white p-6 shadow-sm"
              >
                <h3 className="text-2xl font-black">{t(String(title))}</h3>
                <div className="mt-5 grid gap-3">
                  {(items as string[]).map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-md bg-base-200 p-3"
                    >
                      <FileCheck2
                        className="mt-0.5 shrink-0 text-primary"
                        size={18}
                      />
                      <span className="text-sm font-semibold leading-5 text-neutral/70">
                        {t(item)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-md bg-neutral p-8 text-white lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-normal">
                {t("servicesBottomCtaTitle")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                {t("servicesBottomCtaBody")}
              </p>
            </div>
            <Link
              to="/register"
              className="btn btn-primary rounded-md text-white"
            >
              {t("getStarted")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
