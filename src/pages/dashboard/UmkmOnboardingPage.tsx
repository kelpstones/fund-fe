import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Handshake,
  IdCard,
  LineChart,
  Lock,
  Rocket,
} from "lucide-react";
import { Link } from "react-router-dom";
import { directApi } from "../../lib/api/direct";
import { resourceApi } from "../../lib/api/resources";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  myBusinessConfig,
  myNegotiationConfig,
  submissionConfig,
} from "../../lib/resourceConfigs";
import { compactCurrency, currency, readPath, statusTone, textValue } from "../../lib/format";
import type { Entity } from "../../types";

type OnboardingStep = {
  key: string;
  title: string;
  description: string;
  href: string;
  action: string;
  icon: typeof Rocket;
  done: boolean;
  locked?: boolean;
  helper: string;
};

const docsStorageKey = "fundraise_umkm_onboarding_docs";

const documentChecklist = [
  "KTP pemilik dan NIK sesuai akun",
  "Nomor telepon dan email aktif",
  "Deskripsi bisnis dan alamat operasional",
  "Target pendanaan dan estimasi return",
  "Ringkasan penjualan atau omzet terakhir",
  "Foto produk, toko, atau aktivitas usaha",
];

const approvalStatus = (item: Entity) =>
  String(readPath(item, ["approval.status", "approval_status", "status"], "draft")).toLowerCase();

const isApprovedSubmission = (item: Entity) =>
  ["approved", "published", "funded"].includes(approvalStatus(item));

const isPendingSubmission = (item: Entity) => approvalStatus(item) === "pending";

function ProgressRing({ value }: { value: number }) {
  return (
    <div
      className="radial-progress text-primary"
      style={{ "--value": value, "--size": "7rem", "--thickness": "0.7rem" } as CSSProperties}
      role="progressbar"
      aria-label="Progress onboarding UMKM"
    >
      <span className="text-xl font-black text-neutral">{value}%</span>
    </div>
  );
}

function StepStatus({ done, locked }: { done: boolean; locked?: boolean }) {
  if (done) {
    return (
      <span className="badge badge-success gap-1 text-white">
        <CheckCircle2 size={14} />
        Selesai
      </span>
    );
  }

  if (locked) {
    return (
      <span className="badge badge-neutral gap-1">
        <Lock size={14} />
        Terkunci
      </span>
    );
  }

  return (
    <span className="badge badge-warning gap-1">
      <AlertCircle size={14} />
      Berikutnya
    </span>
  );
}

function StepCard({ step, index }: { step: OnboardingStep; index: number }) {
  const Icon = step.icon;

  return (
    <article
      className={[
        "rounded-md border bg-white p-5 shadow-sm",
        step.done ? "border-success/30" : step.locked ? "border-base-300 opacity-75" : "border-warning/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div
            className={[
              "grid h-11 w-11 shrink-0 place-items-center rounded-md",
              step.done ? "bg-success/10 text-success" : step.locked ? "bg-base-200 text-neutral/45" : "bg-warning/15 text-warning",
            ].join(" ")}
          >
            <Icon size={21} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-neutral/40">Step {index + 1}</p>
            <h3 className="mt-1 text-lg font-black text-neutral">{step.title}</h3>
          </div>
        </div>
        <StepStatus done={step.done} locked={step.locked} />
      </div>
      <p className="mt-4 text-sm leading-6 text-neutral/60">{step.description}</p>
      <p className="mt-3 rounded-md bg-base-200 px-3 py-2 text-xs font-semibold text-neutral/60">
        {step.helper}
      </p>
      <div className="mt-5">
        <Link
          to={step.href}
          className={[
            "btn h-10 rounded-md",
            step.locked ? "btn-disabled" : step.done ? "btn-outline" : "btn-primary text-white",
          ].join(" ")}
          aria-disabled={step.locked}
        >
          {step.action}
        </Link>
      </div>
    </article>
  );
}

function DocumentChecklist() {
  const [checkedDocs, setCheckedDocs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(docsStorageKey);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(docsStorageKey, JSON.stringify(checkedDocs));
  }, [checkedDocs]);

  const toggle = (item: string) => {
    setCheckedDocs((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  };

  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black">Checklist persiapan</h3>
          <p className="mt-1 text-sm text-neutral/55">Checklist lokal untuk menyiapkan materi sebelum review admin.</p>
        </div>
        <span className="badge badge-primary badge-lg text-white">
          {checkedDocs.length}/{documentChecklist.length}
        </span>
      </div>
      <div className="mt-5 grid gap-3">
        {documentChecklist.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-base-300 p-3 transition hover:bg-base-200"
          >
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm mt-0.5 rounded"
              checked={checkedDocs.includes(item)}
              onChange={() => toggle(item)}
            />
            <span className="text-sm font-semibold leading-5 text-neutral/70">{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SubmissionSnapshot({ submissions }: { submissions: Entity[] }) {
  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black">Status pengajuan</h3>
          <p className="mt-1 text-sm text-neutral/55">Ringkasan kesiapan proposal untuk investor.</p>
        </div>
        <FileCheck2 className="text-primary" size={24} />
      </div>
      <div className="mt-5 grid gap-3">
        {submissions.length === 0 ? (
          <div className="rounded-md border border-base-300 p-4 text-sm font-semibold text-neutral/55">
            Belum ada pengajuan dana.
          </div>
        ) : null}
        {submissions.slice(0, 4).map((item) => {
          const status = approvalStatus(item);
          return (
            <div key={item.id} className="rounded-md border border-base-300 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black">
                    {textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "nama", "bisnis_id"]))}
                  </p>
                  <p className="mt-1 text-sm text-neutral/55">{currency(item.target_pendanaan)}</p>
                </div>
                <span className={`badge ${statusTone(status)}`}>{status}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-base-200">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.min(
                      100,
                      (Number(item.total_pendanaan || 0) / Math.max(1, Number(item.target_pendanaan || 1))) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function UmkmOnboardingPage() {
  const { user } = useAuth();
  const businessesQuery = useQuery({
    queryKey: ["umkm-onboarding", "businesses"],
    queryFn: () => resourceApi.list(myBusinessConfig),
  });
  const submissionsQuery = useQuery({
    queryKey: ["umkm-onboarding", "submissions"],
    queryFn: () => resourceApi.list(submissionConfig),
  });
  const negotiationsQuery = useQuery({
    queryKey: ["umkm-onboarding", "negotiations"],
    queryFn: () => resourceApi.list(myNegotiationConfig),
  });

  const businesses = businessesQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];
  const negotiations = negotiationsQuery.data ?? [];
  const primaryBusiness = businesses[0];
  const primaryBusinessId = primaryBusiness?.id ? String(primaryBusiness.id) : "";

  const modelProfileQuery = useQuery({
    queryKey: ["umkm-onboarding", "business-profile", primaryBusinessId],
    queryFn: async () => {
      try {
        return await directApi.get(`/businesses/${primaryBusinessId}/profile`, null);
      } catch {
        return null;
      }
    },
    enabled: Boolean(primaryBusinessId),
  });

  const modelProfile = modelProfileQuery.data;
  const modelProfileRecord =
    modelProfile && typeof modelProfile === "object" && !Array.isArray(modelProfile)
      ? (modelProfile as Record<string, unknown>)
      : {};
  const accountReady = Boolean(user?.nama && user?.email && user?.no_telp);
  const hasBusiness = businesses.length > 0;
  const hasModelProfile = Boolean(
    modelProfileRecord.net_profit_margin !== undefined ||
      modelProfileRecord.year_revenue !== undefined ||
      modelProfileRecord.digital_adoption_score !== undefined,
  );
  const hasSubmission = submissions.length > 0;
  const hasReviewedSubmission = submissions.some(isApprovedSubmission);
  const hasPendingSubmission = submissions.some(isPendingSubmission);
  const hasNegotiation = negotiations.length > 0;

  const steps = useMemo<OnboardingStep[]>(
    () => [
      {
        key: "account",
        title: "Lengkapi identitas akun",
        description: "Pastikan nama, email, dan nomor telepon UMKM sudah benar agar admin dan investor bisa menghubungi kamu.",
        href: "/dashboard/umkm/profile",
        action: accountReady ? "Review Profile" : "Lengkapi Profile",
        icon: IdCard,
        done: accountReady,
        helper: accountReady ? "Identitas dasar akun sudah tersedia." : "Nomor telepon atau data akun belum lengkap.",
      },
      {
        key: "business",
        title: "Daftarkan profil bisnis",
        description: "Buat data bisnis utama berisi nama usaha, tipe usaha, alamat, kontak, kelas, dan deskripsi.",
        href: "/dashboard/umkm/bisnis",
        action: hasBusiness ? "Kelola Bisnis" : "Tambah Bisnis",
        icon: Building2,
        done: hasBusiness,
        helper: hasBusiness
          ? `${businesses.length} bisnis terhubung ke akun ini.`
          : "Profil bisnis wajib dibuat sebelum pengajuan dana.",
      },
      {
        key: "model",
        title: "Isi profil model bisnis",
        description: "Lengkapi margin, omzet, repeat order, adopsi digital, dan tenure agar scoring bisnis lebih kuat.",
        href: "/dashboard/umkm/bisnis-profile",
        action: hasModelProfile ? "Review Model" : "Isi Model",
        icon: LineChart,
        done: hasModelProfile,
        locked: !hasBusiness,
        helper: hasBusiness
          ? hasModelProfile
            ? "Data model bisnis sudah tersimpan untuk scoring."
            : "Data model belum lengkap, investor belum mendapat sinyal kualitas yang cukup."
          : "Buat profil bisnis terlebih dahulu.",
      },
      {
        key: "submission",
        title: "Buat pengajuan pendanaan",
        description: "Masukkan target pendanaan dan return tahunan agar peluang bisa direview admin.",
        href: "/dashboard/umkm/pengajuan",
        action: hasSubmission ? "Kelola Pengajuan" : "Buat Pengajuan",
        icon: FileCheck2,
        done: hasSubmission,
        locked: !hasBusiness,
        helper: hasSubmission
          ? `${submissions.length} pengajuan sudah dibuat.`
          : "Pengajuan menjadi pintu masuk ke marketplace investor.",
      },
      {
        key: "review",
        title: "Siap review admin",
        description: "Pantau status approval. Setelah disetujui atau dipublikasikan, peluang mulai layak muncul di katalog investor.",
        href: "/dashboard/umkm/pengajuan",
        action: "Cek Status",
        icon: ClipboardCheck,
        done: hasReviewedSubmission,
        locked: !hasSubmission,
        helper: hasReviewedSubmission
          ? "Ada pengajuan yang sudah approved, published, atau funded."
          : hasPendingSubmission
            ? "Ada pengajuan pending. Tunggu keputusan admin."
            : "Belum ada pengajuan yang masuk tahap review.",
      },
      {
        key: "negotiation",
        title: "Kelola negosiasi investor",
        description: "Balas penawaran investor dan jaga semua percakapan deal di satu tempat.",
        href: "/dashboard/umkm/negosiasi",
        action: "Buka Negosiasi",
        icon: Handshake,
        done: hasNegotiation,
        locked: !hasReviewedSubmission,
        helper: hasNegotiation
          ? `${negotiations.length} negosiasi tercatat.`
          : "Negosiasi akan muncul setelah investor tertarik pada peluang bisnis.",
      },
      {
        key: "sales",
        title: "Siapkan laporan penjualan",
        description: "Setelah ada investasi berjalan, laporan penjualan menjadi dasar distribusi profit.",
        href: "/dashboard/umkm/penjualan",
        action: "Input Penjualan",
        icon: BarChart3,
        done: false,
        locked: !hasReviewedSubmission,
        helper: "Laporan penjualan dipakai untuk transparansi performa dan profit sharing.",
      },
    ],
    [
      accountReady,
      businesses.length,
      hasBusiness,
      hasModelProfile,
      hasNegotiation,
      hasPendingSubmission,
      hasReviewedSubmission,
      hasSubmission,
      negotiations.length,
      submissions.length,
    ],
  );

  const completedSteps = steps.filter((step) => step.done).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const nextStep = steps.find((step) => !step.done && !step.locked);
  const activeFundingTarget = submissions.reduce(
    (sum, item) => sum + Number(item.target_pendanaan || 0),
    0,
  );

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
              <Rocket size={15} />
              UMKM Onboarding
            </div>
            <h2 className="text-3xl font-black tracking-normal text-neutral">
              Siapkan bisnis sampai layak tampil ke investor
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral/60">
              Halaman ini menyatukan urutan kerja UMKM: profil akun, profil bisnis, scoring model, pengajuan dana,
              review admin, negosiasi, sampai laporan penjualan.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={nextStep?.href ?? "/dashboard/umkm/pengajuan"}
                className="btn btn-primary rounded-md text-white"
              >
                {nextStep?.action ?? "Review Pengajuan"}
              </Link>
              <Link to="/dashboard/umkm" className="btn btn-outline rounded-md">
                Kembali ke Overview
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <ProgressRing value={progress} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral/50">Bisnis</p>
          <p className="mt-2 text-3xl font-black">{businessesQuery.isLoading ? "-" : businesses.length}</p>
          <p className="mt-1 text-sm text-neutral/55">Profil terdaftar</p>
        </div>
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral/50">Pengajuan</p>
          <p className="mt-2 text-3xl font-black">{submissionsQuery.isLoading ? "-" : submissions.length}</p>
          <p className="mt-1 text-sm text-neutral/55">Proposal pendanaan</p>
        </div>
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral/50">Target Dana</p>
          <p className="mt-2 text-3xl font-black">{compactCurrency(activeFundingTarget)}</p>
          <p className="mt-1 text-sm text-neutral/55">Total kebutuhan modal</p>
        </div>
        <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral/50">Negosiasi</p>
          <p className="mt-2 text-3xl font-black">{negotiationsQuery.isLoading ? "-" : negotiations.length}</p>
          <p className="mt-1 text-sm text-neutral/55">Interaksi investor</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          {steps.map((step, index) => (
            <StepCard key={step.key} step={step} index={index} />
          ))}
        </div>
        <div className="grid content-start gap-6">
          <DocumentChecklist />
          <SubmissionSnapshot submissions={submissions} />
        </div>
      </div>
    </section>
  );
}
