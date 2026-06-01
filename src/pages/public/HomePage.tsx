import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Handshake,
  PlayCircle,
  Quote,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { compactCurrency, percent } from "../../lib/format";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { useScrollReveal } from "../../lib/ui/useScrollReveal";
import { dashboardPathFor, useAuth } from "../../lib/auth/AuthProvider";

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

const featuredOpportunities = [
  {
    name: "Kopi Nusa Rasa",
    sectorKey: "portfolioSectorFoodBeverage",
    city: "Bandung",
    raised: 164000000,
    target: 250000000,
    score: 92,
    returnRate: 18,
    risk: "Moderate",
    image:
      "https://unsplash.com/photos/8jlQWO01vGU/download?force=true&w=1200",
  },
  {
    name: "Batik Lestari",
    sectorKey: "portfolioSectorFashion",
    city: "Solo",
    raised: 48000000,
    target: 120000000,
    score: 81,
    returnRate: 15,
    risk: "High",
    image:
      "https://unsplash.com/photos/XOvNsILkVCo/download?force=true&w=1200",
  },
  {
    name: "TaniHub Lokal",
    sectorKey: "portfolioSectorAgribusiness",
    city: "Malang",
    raised: 310000000,
    target: 400000000,
    score: 88,
    returnRate: 21,
    risk: "Low",
    image:
      "https://unsplash.com/photos/9zMPGHBiFxg/download?force=true&w=1200",
  },
];

const programLogos = [
  {
    name: "Coding Camp 2026",
    image: "/partners/coding-camp.webp",
  },
  {
    name: "DBS Foundation",
    image: "/partners/dbs-foundation.webp",
  },
  {
    name: "Dicoding",
    image: "/partners/dicoding.webp",
  },
];

const testimonials = [
  {
    name: "Rani Prameswari",
    role: "homeTestimonialRoleUmkm",
    quote: "homeTestimonialRani",
    image: "/testimonials/rani-prameswari.webp",
  },
  {
    name: "Dimas Arya",
    role: "homeTestimonialRoleInvestor",
    quote: "homeTestimonialDimas",
    image: "/testimonials/dimas-arya.webp",
  },
  {
    name: "Nadia Putri",
    role: "homeTestimonialRoleAdmin",
    quote: "homeTestimonialNadia",
    image: "/testimonials/nadia-putri.webp",
  },
];

const roleCards = [
  {
    title: "homeRoleUmkmTitle",
    image: "/images/roles/umkm.webp",
    points: ["homeRoleUmkmPoint1", "homeRoleUmkmPoint2", "homeRoleUmkmPoint3"],
  },
  {
    title: "homeRoleInvestorTitle",
    image: "/images/roles/investor.webp",
    points: [
      "homeRoleInvestorPoint1",
      "homeRoleInvestorPoint2",
      "homeRoleInvestorPoint3",
    ],
  },
] as const;

const riskLabelKey = (risk: string) => `risk${risk}`;

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
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const heroRef = useRef<HTMLDivElement | null>(null);
  useScrollReveal();
  const startNowTarget = isAuthenticated
    ? dashboardPathFor(user?.role ?? "umkm")
    : "/login";

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
                to={startNowTarget}
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

      <section className="border-y border-base-300 bg-white" data-reveal>
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-[0.7fr_1.3fr] md:items-center lg:px-8">
          <div>
            <p className="mt-2 text-sm leading-6 text-neutral/60">
              {t("homeTrustBody")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {programLogos.map((item) => (
              <div
                key={item.name}
                className="flex h-14 items-center justify-center rounded-md bg-white px-2 sm:h-16 sm:px-5"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="max-h-8 w-full object-contain sm:max-h-16"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-y border-base-300 bg-base-200"
        data-reveal
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black tracking-normal">
              {t("homeJourneyTitle")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral/65">
              {t("homeJourneyBody")}
            </p>
          </div>
          <div className="mt-8 grid max-w-4xl gap-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative rounded-md bg-white p-6 shadow-sm"
                  data-reveal
                  data-reveal-delay={String(index * 40)}
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black">{t(step.title)}</h2>
                      <p className="mt-2 text-sm leading-6 text-neutral/60">
                        {t(step.body)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white" data-reveal>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-black tracking-normal">
                {t("homeOpportunitiesTitle")}
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral/65">
                {t("homeOpportunitiesBody")}
              </p>
            </div>
            <Link
              to="/portfolio"
              className="btn btn-outline btn-secondary rounded-md"
            >
              {t("homeOpportunitiesCta")}
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {featuredOpportunities.map((item) => {
              const progress = Math.min(
                100,
                Math.round((item.raised / item.target) * 100),
              );
              return (
                <Link
                  key={item.name}
                  to="/portfolio"
                  className="group flex h-full flex-col overflow-hidden rounded-md border border-base-300 bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out md:hover:-translate-y-0.5 md:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  data-reveal
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-base-200">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute right-3 top-3 rounded-md bg-success px-2.5 py-1 text-sm font-black text-white">
                      {percent(item.score)}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black">{item.name}</h3>
                      <p className="mt-1 text-xs font-semibold text-neutral/55">{item.city}</p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="min-w-0 rounded-md bg-base-200 p-2.5">
                        <p className="text-xs font-semibold text-neutral/55">{t("metricTarget")}</p>
                        <p className="mt-1 break-words text-sm font-black leading-tight">
                          {compactCurrency(item.target)}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-md bg-base-200 p-2.5">
                        <p className="text-xs font-semibold text-neutral/55">{t("metricReturn")}</p>
                        <p className="mt-1 break-words text-sm font-black leading-tight">
                          {percent(item.returnRate)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-2 flex justify-between text-sm font-semibold text-neutral/60">
                        <span>{compactCurrency(item.raised)}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-base-200">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral/55">
                        {t(item.sectorKey)} - {t(riskLabelKey(item.risk))}
                      </span>
                      <span className="btn btn-primary btn-xs rounded-md text-white">
                        {t("detail")}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-base-300 bg-base-200" data-reveal>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black tracking-normal">
              {t("homeRoleSectionTitle")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral/65">
              {t("homeRoleSectionBody")}
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {roleCards.map((roleCard) => (
              <article
                key={roleCard.title}
                className="overflow-hidden rounded-md border border-base-300 bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out md:hover:-translate-y-0.5 md:hover:shadow-md"
                data-reveal
              >
                <div className="aspect-[16/8] overflow-hidden bg-base-200">
                  <img
                    src={roleCard.image}
                    alt={t(roleCard.title)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black">{t(roleCard.title)}</h3>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-neutral/70 marker:text-neutral/40">
                    {roleCard.points.map((point) => (
                      <li key={point}>{t(point)}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white" data-reveal>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div>
            <h2 className="mt-3 text-4xl font-black tracking-normal">
              {t("homeTestimonialsTitle")}
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="rounded-md border border-base-300 bg-white p-6 shadow-sm transition-[transform,box-shadow] duration-200 ease-out md:hover:-translate-y-0.5 md:hover:shadow-md"
                data-reveal
              >
                <Quote className="text-primary" size={24} />
                <p className="mt-5 text-sm leading-6 text-neutral/65">
                  {t(item.quote)}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
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

      <section className="relative -mt-px bg-white px-4 pb-16 sm:px-6 lg:px-8" data-reveal>
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
              to={startNowTarget}
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
