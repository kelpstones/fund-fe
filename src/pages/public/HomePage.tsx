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
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { compactCurrency } from "../../lib/format";

const proofPoints = [
  { label: "Pendanaan termonitor", value: compactCurrency(1250000000) },
  { label: "Skor match rata-rata", value: "88%" },
  { label: "UMKM aktif", value: "240+" },
];

const steps = [
  {
    title: "Profil bisnis dibaca sistem",
    body: "Data sektor, performa penjualan, risiko, kebutuhan modal, dan proyeksi return dirangkum menjadi sinyal pendanaan.",
    icon: BarChart3,
  },
  {
    title: "Investor mendapat rekomendasi",
    body: "Preferensi nominal, toleransi risiko, minat sektor, dan target return dipakai untuk membuat daftar peluang yang relevan.",
    icon: Target,
  },
  {
    title: "Negosiasi sampai investasi",
    body: "Penawaran, invoice, investasi, dan distribusi profit dipantau dalam satu dashboard multi-role.",
    icon: Handshake,
  },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto h-[560px] w-[286px] rounded-[2.4rem] border-[12px] border-neutral bg-neutral shadow-soft">
      <div className="absolute left-1/2 top-3 h-7 w-24 -translate-x-1/2 rounded-full bg-neutral" />
      <div className="h-full overflow-hidden rounded-[1.7rem] bg-white">
        <div className="bg-primary px-5 pb-8 pt-12 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">FundRaise AI</span>
            <Sparkles size={18} />
          </div>
          <p className="mt-7 text-sm text-white/70">Available allocation</p>
          <p className="mt-1 text-3xl font-black">Rp250jt</p>
          <div className="mt-5 h-2 rounded-full bg-white/20">
            <div className="h-2 w-[66%] rounded-full bg-accent" />
          </div>
        </div>
        <div className="-mt-4 mx-4 rounded-md bg-white p-4 shadow-soft">
          <h3 className="text-lg font-black">Kopi Nusa Rasa</h3>
          <p className="mt-1 text-xs text-neutral/55">Food & Beverage, Bandung</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-base-200 p-2">
              <p className="text-[10px] text-neutral/50">Match</p>
              <p className="font-black text-secondary">92%</p>
            </div>
            <div className="rounded-md bg-base-200 p-2">
              <p className="text-[10px] text-neutral/50">Return</p>
              <p className="font-black">18%</p>
            </div>
            <div className="rounded-md bg-base-200 p-2">
              <p className="text-[10px] text-neutral/50">Risk</p>
              <p className="font-black">Med</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {["Negosiasi aktif", "Invoice pending", "Distribusi profit"].map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-md border border-base-300 p-3">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-base-200 text-primary">
                {index === 0 ? <Handshake size={16} /> : index === 1 ? <CircleDollarSign size={16} /> : <TrendingUp size={16} />}
              </div>
              <div>
                <p className="text-sm font-bold">{item}</p>
                <p className="text-xs text-neutral/50">Updated today</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
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
              Pendanaan UMKM yang lebih tepat dengan AI Matchmaking
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral/65">
              FundRaise membantu UMKM membangun profil pendanaan dan membantu
              investor menemukan peluang yang sesuai dengan preferensi, risiko,
              dan target return.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn btn-primary h-12 rounded-md px-7 text-white">
                Mulai Sekarang
                <ArrowRight size={18} />
              </Link>
              <Link to="/layanan" className="btn btn-outline btn-secondary h-12 rounded-md px-7">
                <PlayCircle size={18} />
                Lihat Alur
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {proofPoints.map((item) => (
                <div key={item.label} className="rounded-md border border-base-300 bg-white p-4">
                  <p className="text-lg font-black text-neutral">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-neutral/55">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[620px]">
            <div className="hero-float absolute left-0 top-16 z-10 rounded-md border-2 border-neutral bg-accent px-4 py-3 text-sm font-black shadow-soft">
              Rp164jt collected
            </div>
            <div className="hero-float absolute right-0 top-52 z-10 max-w-[210px] rotate-3 rounded-md border-2 border-neutral bg-white p-4 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-black">
                <CheckCircle2 size={18} className="text-success" />
                Investor match
              </div>
              <p className="mt-2 text-3xl font-black text-secondary">92%</p>
            </div>
            <div className="hero-float absolute bottom-20 left-2 z-10 w-56 -rotate-3 rounded-md border-2 border-neutral bg-white p-4 shadow-soft">
              <p className="text-sm font-bold">Comparison</p>
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

      <section className="border-y border-base-300 bg-base-200">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-md bg-white p-6 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <h2 className="mt-5 text-lg font-black">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-neutral/60">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <h2 className="text-4xl font-black tracking-normal">Dari proposal sampai profit sharing</h2>
            <p className="mt-5 text-neutral/65">
              UMKM, investor, dan admin mendapat ruang kerja yang berbeda namun
              tetap tersambung pada data pengajuan, negosiasi, invoice, investasi,
              dan distribusi profit.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["UMKM", "Profil bisnis, pengajuan dana, laporan penjualan, negosiasi."],
              ["Investor", "Peluang pendanaan, rekomendasi AI, invoice, portfolio."],
              ["Admin", "Approval pengajuan, kelas bisnis, admin management, monitoring."],
              ["AI Match", "Skor kecocokan, alasan rekomendasi, filter risiko dan return."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-md border border-base-300 p-5">
                <ShieldCheck className="text-primary" size={22} />
                <h3 className="mt-4 font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral/60">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
