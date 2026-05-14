import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Handshake,
  Landmark,
  PlayCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { compactCurrency } from "../../lib/format";
import { useLanguage } from "../../lib/i18n/LanguageProvider";

const proofPoints = [
  { label: "homeProofFunding", value: compactCurrency(1250000000) },
  { label: "homeProofScore", value: "88%" },
  { label: "homeProofUmkm", value: "240+" },
];

const steps = [
  {
    title: "homeStepProfileTitle",
    body: "homeStepProfileBody",
    icon: BarChart3,
  },
  {
    title: "homeStepInvestorTitle",
    body: "homeStepInvestorBody",
    icon: Target,
  },
  {
    title: "homeStepDealTitle",
    body: "homeStepDealBody",
    icon: Handshake,
  },
];

const trustBadges = [
  "homeTrustKominfo",
  "homeTrustBI",
  "homeTrustOJK",
  "homeTrustCommunity",
];

const testimonials = [
  {
    name: "Rani Prameswari",
    role: "homeTestimonialRoleUmkm",
    quote: "homeTestimonialRani",
    initials: "RP",
  },
  {
    name: "Dimas Arya",
    role: "homeTestimonialRoleInvestor",
    quote: "homeTestimonialDimas",
    initials: "DA",
  },
  {
    name: "Nadia Putri",
    role: "homeTestimonialRoleAdmin",
    quote: "homeTestimonialNadia",
    initials: "NP",
  },
];

function PhoneMockup() {
  const { t } = useLanguage();
  return (
    <div className="relative mx-auto h-[560px] w-[286px] rounded-[2.4rem] border-[12px] border-neutral bg-neutral shadow-soft">
      <div className="absolute left-1/2 top-3 h-7 w-24 -translate-x-1/2 rounded-full bg-neutral" />
      <div className="h-full overflow-hidden rounded-[1.7rem] bg-white">
        <div className="bg-primary px-5 pb-8 pt-12 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">FundRaise AI</span>
            <Sparkles size={18} />
          </div>
          <p className="mt-7 text-sm text-white/70">
            {t("homePhoneAllocation")}
          </p>
          <p className="mt-1 text-3xl font-black">Rp250jt</p>
          <div className="mt-5 h-2 rounded-full bg-white/20">
            <div className="h-2 w-[66%] rounded-full bg-accent" />
          </div>
        </div>
        <div className="-mt-4 mx-4 rounded-md bg-white p-4 shadow-soft">
          <h3 className="text-lg font-black">Kopi Nusa Rasa</h3>
          <p className="mt-1 text-xs text-neutral/55">
            {t("homePhoneBusinessMeta")}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-base-200 p-2">
              <p className="text-[10px] text-neutral/50">{t("metricMatch")}</p>
              <p className="font-black text-secondary">92%</p>
            </div>
            <div className="rounded-md bg-base-200 p-2">
              <p className="text-[10px] text-neutral/50">{t("metricReturn")}</p>
              <p className="font-black">18%</p>
            </div>
            <div className="rounded-md bg-base-200 p-2">
              <p className="text-[10px] text-neutral/50">{t("metricRisk")}</p>
              <p className="font-black">{t("riskMediumShort")}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {["homePhoneNegotiation", "homePhoneInvoice", "homePhoneProfit"].map(
            (item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-md border border-base-300 p-3"
              >
                <div className="grid h-8 w-8 place-items-center rounded-md bg-base-200 text-primary">
                  {index === 0 ? (
                    <Handshake size={16} />
                  ) : index === 1 ? (
                    <CircleDollarSign size={16} />
                  ) : (
                    <TrendingUp size={16} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">{t(item)}</p>
                  <p className="text-xs text-neutral/50">{t("updatedToday")}</p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { t } = useLanguage();
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.to(".hero-float", {
        y: -14,
        duration: 2.2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: 0.18,
      });
    }, heroRef);

    return () => context.revert();
  }, []);

  return (
    <main>
      <section ref={heroRef} className="relative overflow-hidden bg-white">
        <div className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="relative z-10">
            <h1 className="max-w-4xl font-display text-5xl font-black leading-[1.02] tracking-normal text-neutral sm:text-6xl lg:text-7xl">
              {t("homeHeroTitle")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral/65">
              {t("homeHeroBody")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="btn btn-primary h-12 rounded-md px-7 text-white"
              >
                {t("homePrimaryCta")}
                <ArrowRight size={18} />
              </Link>
              <a
                href="#features"
                className="btn btn-outline btn-secondary h-12 rounded-md px-7"
              >
                <PlayCircle size={18} />
                {t("homeSecondaryCta")}
              </a>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {proofPoints.map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-base-300 bg-white p-4"
                >
                  <p className="text-lg font-black text-neutral">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-neutral/55">
                    {t(item.label)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[620px]">
            <div className="hero-float absolute left-0 top-16 z-10 rounded-md border-2 border-neutral bg-accent px-4 py-3 text-sm font-black shadow-soft">
              {t("homeFloatCollected")}
            </div>
            <div className="hero-float absolute right-0 top-52 z-10 max-w-[210px] rotate-3 rounded-md border-2 border-neutral bg-white p-4 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-black">
                <CheckCircle2 size={18} className="text-success" />
                {t("homeFloatInvestorMatch")}
              </div>
              <p className="mt-2 text-3xl font-black text-secondary">92%</p>
            </div>
            <div className="hero-float absolute bottom-20 left-2 z-10 w-56 -rotate-3 rounded-md border-2 border-neutral bg-white p-4 shadow-soft">
              <p className="text-sm font-bold">{t("homeFloatComparison")}</p>
              <div className="mt-4 space-y-3">
                <div className="h-2 rounded-full bg-base-300">
                  <div className="h-2 w-3/4 rounded-full bg-accent" />
                </div>
                <div className="h-2 rounded-full bg-base-300">
                  <div className="h-2 w-1/2 rounded-full bg-neutral" />
                </div>
              </div>
            </div>
            <PhoneMockup />
          </div>
        </div>
      </section>

      <section className="border-y border-base-300 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-[0.7fr_1.3fr] md:items-center lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-neutral/40">
              {t("homeTrustEyebrow")}
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral/60">
              {t("homeTrustBody")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustBadges.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-md border border-base-300 bg-base-200 p-4"
              >
                <div className="grid h-10 w-10 place-items-center rounded-md bg-white text-primary">
                  <Landmark size={19} />
                </div>
                <div>
                  <p className="text-sm font-black">{t(item)}</p>
                  <p className="text-xs font-semibold text-neutral/45">
                    {t("homeTrustPlaceholder")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-base-300 bg-base-200">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-md bg-white p-6 shadow-sm"
              >
                <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <h2 className="mt-5 text-lg font-black">{t(step.title)}</h2>
                <p className="mt-3 text-sm leading-6 text-neutral/60">
                  {t(step.body)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <h2 className="text-4xl font-black tracking-normal">
              {t("homeWorkflowTitle")}
            </h2>
            <p className="mt-5 text-neutral/65">{t("homeWorkflowBody")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["roleUmkm", "homeWorkflowUmkm"],
              ["roleInvestor", "homeWorkflowInvestor"],
              ["Admin", "homeWorkflowAdmin"],
              ["AI Match", "homeWorkflowAi"],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-md border border-base-300 p-5"
              >
                <ShieldCheck className="text-primary" size={22} />
                <h3 className="mt-4 font-black">{t(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral/60">
                  {t(body)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-base-300 bg-base-200">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-primary">
              {t("homeDiagramEyebrow")}
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-normal">
              {t("homeDiagramTitle")}
            </h2>
            <p className="mt-4 text-sm leading-6 text-neutral/60">
              {t("homeDiagramBody")}
            </p>
          </div>
          <div className="grid gap-3">
            {[
              ["01", "homeDiagramProfile", BarChart3],
              ["02", "homeDiagramMatch", Target],
              ["03", "homeDiagramDeal", Handshake],
              ["04", "homeDiagramProfit", TrendingUp],
            ].map(([number, label, Icon]) => {
              const FlowIcon = Icon as typeof BarChart3;
              return (
                <div
                  key={String(label)}
                  className="grid gap-3 rounded-md border border-base-300 bg-white p-4 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <span className="text-2xl font-black text-primary">
                    {String(number)}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                      <FlowIcon size={19} />
                    </div>
                    <p className="font-black">{t(String(label))}</p>
                  </div>
                  <ArrowRight
                    className="hidden text-neutral/35 sm:block"
                    size={20}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-wide text-primary">
              {t("homeTestimonialsEyebrow")}
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-normal">
              {t("homeTestimonialsTitle")}
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="rounded-md border border-base-300 bg-white p-6 shadow-sm"
              >
                <Quote className="text-primary" size={24} />
                <p className="mt-5 text-sm leading-6 text-neutral/65">
                  {t(item.quote)}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-primary text-sm font-black text-white">
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-xs font-semibold text-neutral/50">
                      {t(item.role)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-md bg-neutral p-8 text-white lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-normal">
                {t("homeBottomCtaTitle")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                {t("homeBottomCtaBody")}
              </p>
            </div>
            <Link
              to="/register"
              className="btn btn-primary rounded-md text-white"
            >
              {t("homePrimaryCta")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
