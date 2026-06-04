import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Filter, ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { ResourcePage } from "../../../components/ResourcePage";
import { DashboardBreadcrumb } from "../../../components/DashboardBreadcrumb";
import { useToast } from "../../../components/ToastProvider";
import { resourceApi } from "../../../lib/api/resources";
import { apiClient, unwrap } from "../../../lib/api/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { useLanguage } from "../../../lib/i18n/LanguageProvider";
import {
  adminConfig,
  adminBusinessConfig,
  businessConfig,
  classConfig,
  investmentConfig,
  investmentByPengajuanConfig,
  investorInvestmentConfig,
  investorInvoiceConfig,
  investorProfitConfig,
  invoiceConfig,
  negotiationConfig,
  notificationConfig,
  profitConfig,
  profitBySalesConfig,
  publishedSubmissionConfig,
  salesConfig,
  salesByPengajuanConfig,
  submissionConfig,
  myBusinessConfig,
  myNegotiationConfig,
  userManagementConfig,
} from "../../../lib/resourceConfigs";
import { apiErrorMessage, currency, dateShort, percent, readPath, statusTone, textValue } from "../../../lib/format";
import type { Entity, ResourceAction, ResourceColumn, ResourceConfig, ResourceField } from "../../../types";

const badge = (status: unknown) => (
  <span className={`badge ${statusTone(status)}`}>{textValue(status)}</span>
);

const isStatus = (item: Entity, statuses: string[]) =>
  statuses.includes(String(readPath(item, ["approval.status", "status", "approval_status"])).toLowerCase());

const entityLabel = (item: Entity, paths: string[]) =>
  `${textValue(readPath(item, paths))} (#${textValue(item.id)})`;

const asOptions = (items: Entity[], paths: string[]) =>
  items.map((item) => ({
    value: item.id,
    label: entityLabel(item, paths),
  }));

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const parseNumberInput = (value: string) => {
  const digits = onlyDigits(value);
  return digits ? Number(digits) : 0;
};

const formatNumberInput = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
};

const MAX_BUSINESS_COVER_FILES = 5;

const asCoverFiles = (value: unknown): File[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is File => item instanceof File);
};

type BusinessCover = {
  id: number;
  bisnis_id: number;
  image_url: string;
  urutan: number;
  created_at?: string;
};

function BusinessCoverGallerySection() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [coverError, setCoverError] = useState("");
  const isUmkm = user?.role === "umkm";
  const coverQuery = useQuery({
    queryKey: ["business-covers", user?.id ?? "guest"],
    queryFn: async () => {
      const response = await apiClient.get("/businesses/covers");
      const payload = unwrap<unknown>(response.data);
      if (Array.isArray(payload)) return payload as BusinessCover[];
      if (payload && typeof payload === "object") {
        const objectPayload = payload as Record<string, unknown>;
        if (Array.isArray(objectPayload.covers)) return objectPayload.covers as BusinessCover[];
      }
      return [] as BusinessCover[];
    },
    enabled: isUmkm,
    retry: false,
  });

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await apiClient.post("/businesses/covers", formData);
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setCoverError("");
      await queryClient.invalidateQueries({ queryKey: ["business-covers", user?.id ?? "guest"] });
      await queryClient.invalidateQueries({ queryKey: ["resource", "my-businesses"] });
    },
    onError: (err) => {
      setCoverError(
        apiErrorMessage(
          err,
          language === "id" ? "Upload cover gagal." : "Failed to upload cover.",
        ),
      );
    },
  });

  const deleteCoverMutation = useMutation({
    mutationFn: async (coverId: number) => {
      const response = await apiClient.delete(`/businesses/covers/${coverId}`);
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setCoverError("");
      await queryClient.invalidateQueries({ queryKey: ["business-covers", user?.id ?? "guest"] });
      await queryClient.invalidateQueries({ queryKey: ["resource", "my-businesses"] });
    },
    onError: (err) => {
      setCoverError(
        apiErrorMessage(
          err,
          language === "id" ? "Hapus cover gagal." : "Failed to delete cover.",
        ),
      );
    },
  });

  const reorderCoverMutation = useMutation({
    mutationFn: async (orders: Array<{ id: number; urutan: number }>) => {
      const response = await apiClient.patch("/businesses/covers/reorder", { orders });
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setCoverError("");
      await queryClient.invalidateQueries({ queryKey: ["business-covers", user?.id ?? "guest"] });
      await queryClient.invalidateQueries({ queryKey: ["resource", "my-businesses"] });
    },
    onError: (err) => {
      setCoverError(
        apiErrorMessage(
          err,
          language === "id" ? "Urutan cover gagal diperbarui." : "Failed to reorder covers.",
        ),
      );
    },
  });

  const covers = coverQuery.data ?? [];
  const moveCover = (coverId: number, direction: "up" | "down") => {
    const currentIndex = covers.findIndex((item) => Number(item.id) === Number(coverId));
    if (currentIndex < 0) return;
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= covers.length) return;

    const reordered = [...covers];
    [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
    const orders = reordered.map((item, index) => ({ id: Number(item.id), urutan: index }));
    reorderCoverMutation.mutate(orders);
  };

  return (
    <section className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">Business Cover Gallery</h3>
          <p className="mt-1 text-sm font-semibold text-neutral/55">
            {language === "id"
              ? "Upload maksimal 5 foto cover untuk profil bisnis."
              : "Upload up to 5 cover photos for your business profile."}
          </p>
        </div>
        <label className="btn btn-primary rounded-md text-white">
          <ImagePlus size={17} />
          {language === "id" ? "Upload Cover" : "Upload Cover"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadCoverMutation.isPending || covers.length >= 5}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              uploadCoverMutation.mutate(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      <p className="mb-4 text-sm font-semibold text-neutral/60">
        {covers.length}/5 {language === "id" ? "cover tersimpan" : "covers saved"}
      </p>
      {coverError ? (
        <div className="mb-4 rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          {coverError}
        </div>
      ) : null}
      {coverQuery.isLoading ? (
        <div className="rounded-md border border-base-300 bg-base-100 p-4 text-sm font-semibold text-neutral/60">
          {language === "id" ? "Memuat cover bisnis..." : "Loading business covers..."}
        </div>
      ) : null}
      {coverQuery.isError ? (
        <div className="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          {apiErrorMessage(
            coverQuery.error,
            language === "id" ? "Gagal memuat cover bisnis." : "Failed to load business covers.",
          )}
        </div>
      ) : null}
      {!coverQuery.isLoading && !coverQuery.isError && covers.length === 0 ? (
        <div className="rounded-md border border-base-300 bg-base-100 p-4 text-sm font-semibold text-neutral/60">
          {language === "id" ? "Belum ada cover bisnis." : "No business cover yet."}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {covers.map((cover, index) => (
          <article key={cover.id} className="overflow-hidden rounded-md border border-base-300 bg-white">
            <div className="aspect-video bg-base-200">
              <img
                src={cover.image_url}
                alt={`Cover bisnis ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <span className="text-sm font-bold text-neutral/70">
                {language === "id" ? "Urutan" : "Order"} #{index + 1}
              </span>
              <div className="flex gap-1">
                <button
                  className="btn btn-ghost btn-xs btn-square"
                  onClick={() => moveCover(Number(cover.id), "up")}
                  disabled={index === 0 || reorderCoverMutation.isPending}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  className="btn btn-ghost btn-xs btn-square"
                  onClick={() => moveCover(Number(cover.id), "down")}
                  disabled={index === covers.length - 1 || reorderCoverMutation.isPending}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  className="btn btn-ghost btn-xs btn-square text-error"
                  onClick={() => deleteCoverMutation.mutate(Number(cover.id))}
                  disabled={deleteCoverMutation.isPending}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const businessFields: ResourceField<Entity>[] = [
  { name: "nama_bisnis", label: "Nama Bisnis", required: true },
  {
    name: "tipe_usaha",
    label: "Tipe Usaha",
    type: "select",
    required: true,
    options: [
      { value: "kuliner", label: "Kuliner" },
      { value: "fashion", label: "Fashion" },
      { value: "kesehatan_kecantikan", label: "Kesehatan & Kecantikan" },
      { value: "teknologi", label: "Teknologi" },
      { value: "pendidikan", label: "Pendidikan" },
      { value: "pertanian", label: "Pertanian" },
      { value: "perdagangan", label: "Perdagangan" },
      { value: "jasa", label: "Jasa" },
      { value: "kerajinan", label: "Kerajinan" },
      { value: "lainnya", label: "Lainnya" },
    ],
  },
  { name: "alamat", label: "Alamat", required: true, colSpan: 2 },
  { name: "no_telp", label: "No. Telp" },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "kelas_id",
    label: "Kelas",
    type: "select",
    required: true,
    colSpan: 2,
    options: [],
  },
  { name: "deskripsi", label: "Deskripsi", type: "textarea", required: true, colSpan: 2 },
];

const businessColumns: ResourceColumn<Entity>[] = [
  {
    label: "Bisnis",
    render: (item) => (
      <div>
        <p className="font-black">{textValue(item.nama_bisnis || item.nama)}</p>
        <p className="mt-1 max-w-sm text-sm text-neutral/55">{textValue(item.deskripsi)}</p>
      </div>
    ),
  },
  { label: "Tipe Usaha", render: (item) => textValue(item.tipe_usaha) },
  { label: "Kelas", render: (item) => textValue(readPath(item, ["kelas.nama_kelas", "kelas_id"])) },
  {
    label: "Kontak",
    render: (item) => (
      <div className="text-sm">
        <p className="font-semibold">{textValue(item.email)}</p>
        <p className="text-neutral/50">{textValue(item.no_telp)}</p>
      </div>
    ),
  },
];

const submissionFields: ResourceField<Entity>[] = [
  { name: "bisnis_id", label: "Bisnis", type: "number", required: true },
  { name: "target_pendanaan", label: "Target Pendanaan", type: "number", required: true },
  { name: "total_pendanaan", label: "Total Pendanaan", type: "number" },
  { name: "per_anual_return", label: "Return Tahunan", type: "number", required: true },
  { name: "deskripsi_peluang", label: "Deskripsi Peluang", type: "textarea", colSpan: 2 },
  {
    name: "rencana_penggunaan_dana",
    label: "Rencana Penggunaan Dana",
    type: "funding_plan",
    colSpan: 2,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "draft", label: "Draf" },
      { value: "published", label: "Dipublikasikan" },
      { value: "funded", label: "Didanai" },
      { value: "rejected", label: "Ditolak" },
    ],
  },
  {
    name: "approval_status",
    label: "Approval",
    type: "select",
    options: [
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Disetujui" },
      { value: "rejected", label: "Ditolak" },
    ],
  },
];

const submissionColumns: ResourceColumn<Entity>[] = [
  {
    label: "Pengajuan",
    render: (item) => (
      <div>
        <p className="font-black">
          {textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "bisnis_nama", "nama", "bisnis_id"]))}
        </p>
        <p className="mt-1 text-sm text-neutral/55">ID #{textValue(item.id)}</p>
      </div>
    ),
  },
  { label: "Target", render: (item) => currency(item.target_pendanaan) },
  { label: "Terkumpul", render: (item) => currency(item.total_pendanaan) },
  { label: "Return", render: (item) => percent(item.per_anual_return) },
  { label: "Peluang", render: (item) => textValue(item.deskripsi_peluang, "-") },
  { label: "Status", render: (item) => badge(readPath(item, ["approval.status", "approval_status", "status"])) },
  {
    label: "Catatan",
    render: (item) => {
      const note = textValue(
        readPath(item, ["approval.catatan", "approval_catatan", "catatan"], ""),
        "",
      );
      return note ? (
        <span className="block max-w-xs whitespace-normal break-words text-sm font-semibold leading-5 text-neutral/60">
          {note}
        </span>
      ) : (
        <span className="text-neutral/35">-</span>
      );
    },
  },
  { label: "Match", render: (item) => <span className="font-black text-secondary">{percent(item.match_score || item.skor_kecocokan)}</span> },
];

const salesFields: ResourceField<Entity>[] = [
  { name: "pengajuans_id", label: "Pengajuan", type: "number", required: true },
  { name: "periode", label: "Periode", required: true },
  { name: "total_penjualan", label: "Total Penjualan", type: "number", required: true },
  { name: "laba_kotor", label: "Laba Kotor", type: "number", required: true },
  { name: "laba_bersih", label: "Laba Bersih", type: "number", required: true },
  { name: "jumlah_transaksi", label: "Jumlah Transaksi", type: "number", required: true },
];

const salesColumns: ResourceColumn<Entity>[] = [
  { label: "Periode", render: (item) => <span className="font-black">{textValue(item.periode)}</span> },
  { label: "Pengajuan", render: (item) => `#${textValue(item.pengajuans_id)}` },
  { label: "Penjualan", render: (item) => currency(item.total_penjualan) },
  { label: "Laba Bersih", render: (item) => currency(item.laba_bersih) },
  { label: "Transaksi", render: (item) => textValue(item.jumlah_transaksi) },
];

const negotiationFields: ResourceField<Entity>[] = [
  { name: "pengajuans_id", label: "Pengajuan", type: "number", required: true, hideOnEdit: true },
  {
    name: "penawaran_nominal",
    label: "Penawaran Nominal",
    type: "number",
    required: true,
    min: 1,
    step: 1,
    getEditValue: (item) => {
      const value = readPath(item, ["negosiasi_terakhir.penawaran_nominal", "penawaran_nominal"]);
      if (value === null || value === undefined || value === "") return undefined;
      return Number(value);
    },
  },
  {
    name: "penawaran_return",
    label: "Penawaran Return",
    type: "number",
    required: true,
    min: 0.01,
    max: 50,
    step: 0.01,
    getEditValue: (item) => {
      const value = readPath(item, ["negosiasi_terakhir.penawaran_return", "penawaran_return"]);
      if (value === null || value === undefined || value === "") return undefined;
      return Number(value);
    },
  },
  {
    name: "catatan",
    label: "Catatan",
    type: "textarea",
    getEditValue: (item) =>
      String(readPath(item, ["negosiasi_terakhir.catatan", "catatan"], "")),
  },
];

const negotiationStatus = (item: Entity) =>
  String(readPath(item, ["status"], "")).toLowerCase();

const latestOfferNominal = (item: Entity) =>
  readPath(item, ["negosiasi_terakhir.penawaran_nominal", "penawaran_nominal"], "0");

const latestOfferReturn = (item: Entity) =>
  readPath(item, ["negosiasi_terakhir.penawaran_return", "penawaran_return"], "0");

const latestOfferNote = (item: Entity) =>
  textValue(readPath(item, ["negosiasi_terakhir.catatan", "catatan"], ""), "-");

const negotiationBusinessName = (item: Entity) =>
  textValue(readPath(item, [
    "bisnis.nama_bisnis",
    "bisnis.nama",
    "pengajuan.bisnis.nama_bisnis",
    "pengajuan.bisnis.nama",
    "detail_pengajuan.bisnis.nama_bisnis",
    "bisnis_owner.nama",
    "nama_bisnis",
    "bisnis",
  ]));

const negotiationProposalId = (item: Entity) =>
  textValue(readPath(item, ["pengajuans_id", "pengajuan.id", "detail_pengajuan.id", "id"], ""));

const fundingTarget = (item: Entity) =>
  Number(readPath(item, [
    "pengajuan.target_pendanaan",
    "detail_pengajuan.target_pendanaan",
    "target_pendanaan",
  ], "0"));

const proposalReturn = (item: Entity) =>
  readPath(item, [
    "pengajuan.per_anual_return",
    "detail_pengajuan.per_anual_return",
    "per_anual_return",
  ], "0");

const isCurrentUserLastSender = (item: Entity, userId?: string | number) => {
  const lastBy = String(readPath(item, ["id_terakhir_oleh"], ""));
  const currentUserId = String(userId ?? "");
  return Boolean(lastBy && currentUserId && lastBy === currentUserId);
};

const negotiationTurnLabel = (item: Entity, userRole?: string, userId?: string | number, language: "id" | "en" = "id") => {
  const status = negotiationStatus(item);
  if (status === "deal" || status === "accepted") return language === "id" ? "Deal tercapai" : "Deal reached";
  if (status === "rejected") return language === "id" ? "Ditolak" : "Rejected";
  if (status !== "active") return language === "id" ? "Selesai" : "Closed";

  if (isCurrentUserLastSender(item, userId)) {
    if (userRole === "investor") return language === "id" ? "Menunggu UMKM membalas" : "Waiting for UMKM";
    if (userRole === "umkm") return language === "id" ? "Menunggu investor membalas" : "Waiting for investor";
    return language === "id" ? "Menunggu pihak lawan" : "Waiting for the other party";
  }

  return language === "id" ? "Perlu kamu tindak lanjuti" : "Your action is needed";
};

const negotiationStatusLabel = (item: Entity, language: "id" | "en" = "id") => {
  const status = negotiationStatus(item);
  const labels: Record<string, { id: string; en: string }> = {
    active: { id: "Aktif", en: "Active" },
    accepted: { id: "Disetujui", en: "Accepted" },
    deal: { id: "Deal", en: "Deal" },
    rejected: { id: "Ditolak", en: "Rejected" },
  };
  return labels[status]?.[language] ?? textValue(status, "-");
};

const negotiationStatusBadge = (item: Entity, language: "id" | "en" = "id") => (
  <span className={`badge ${statusTone(negotiationStatus(item))}`}>
    {negotiationStatusLabel(item, language)}
  </span>
);

const latestOfferSenderLabel = (item: Entity, userId?: string | number, language: "id" | "en" = "id") =>
  isCurrentUserLastSender(item, userId)
    ? language === "id"
      ? "Penawaran terakhir dari kamu"
      : "Latest offer from you"
    : language === "id"
      ? "Penawaran terakhir dari pihak lawan"
      : "Latest offer from the other party";

const nextNegotiationStep = (item: Entity, userRole?: string, userId?: string | number, language: "id" | "en" = "id") => {
  const status = negotiationStatus(item);
  if (status === "deal" || status === "accepted") {
    return {
      title: language === "id" ? "Lanjutkan ke deal room" : "Continue to deal room",
      body: language === "id" ? "Cek invoice, pembayaran, dan status investasi." : "Check invoice, payment, and investment status.",
      tone: "success",
    };
  }
  if (status === "rejected") {
    return {
      title: language === "id" ? "Negosiasi selesai" : "Negotiation closed",
      body: language === "id" ? "Tidak ada aksi lanjutan untuk penawaran ini." : "No further action is needed for this offer.",
      tone: "neutral",
    };
  }
  if (isCurrentUserLastSender(item, userId)) {
    return {
      title: userRole === "investor"
        ? language === "id" ? "Tunggu balasan UMKM" : "Wait for UMKM reply"
        : language === "id" ? "Tunggu balasan investor" : "Wait for investor reply",
      body: language === "id" ? "Aksi akan terbuka setelah pihak lawan membalas." : "Actions will open after the other party replies.",
      tone: "warning",
    };
  }
  return {
    title: language === "id" ? "Balas penawaran" : "Reply to offer",
    body: language === "id" ? "Kamu bisa counter offer, setujui, atau tolak." : "You can counter offer, accept, or reject.",
    tone: "primary",
  };
};

function NegotiationCard({
  item,
  userRole,
  currentUserId,
  language,
  context,
}: {
  item: Entity;
  userRole?: string;
  currentUserId?: string | number;
  language: "id" | "en";
  context: {
    canDetail: boolean;
    canEdit: boolean;
    visibleActions: ResourceAction<Entity>[];
    isProcessing: boolean;
    onDetail: () => void;
    onEdit: () => void;
    onAction: (action: ResourceAction<Entity>) => void;
  };
}) {
  const step = nextNegotiationStep(item, userRole, currentUserId, language);
  const target = fundingTarget(item);
  const status = negotiationStatus(item);
  const acceptAction = context.visibleActions.find((action) =>
    ["setujui", "accept"].includes(String(action.label).toLowerCase()),
  );
  const rejectAction = context.visibleActions.find((action) =>
    ["tolak", "reject"].includes(String(action.label).toLowerCase()),
  );
  const canAct = context.canEdit || Boolean(acceptAction || rejectAction);

  return (
    <article className="rounded-md border border-base-300 bg-white p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.7fr)_minmax(220px,0.8fr)] xl:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {negotiationStatusBadge(item, language)}
            <span className="text-xs font-bold uppercase tracking-wide text-neutral/45">
              #{negotiationProposalId(item)}
            </span>
          </div>
          <h3 className="truncate text-lg font-black text-neutral">{negotiationBusinessName(item)}</h3>
          <p className="mt-1 text-sm font-semibold text-neutral/55">
            {target > 0
              ? `${language === "id" ? "Target" : "Target"} ${currency(target)}`
              : language === "id"
                ? "Target belum tersedia"
                : "Target unavailable"}
          </p>
        </div>

        <div className="rounded-md bg-base-200/70 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">
            {language === "id" ? "Penawaran terakhir" : "Latest offer"}
          </p>
          <p className="mt-2 text-xl font-black text-neutral">{currency(latestOfferNominal(item))}</p>
          <p className="mt-1 text-sm font-semibold text-neutral/55">
            Return {percent(latestOfferReturn(item))}
          </p>
          {latestOfferNote(item) !== "-" ? (
            <p className="mt-2 line-clamp-2 text-sm font-semibold text-neutral/55">
              {latestOfferNote(item)}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black text-neutral">
            {negotiationTurnLabel(item, userRole, currentUserId, language)}
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral/55">
            {latestOfferSenderLabel(item, currentUserId, language)}
          </p>
          <div
            className={[
              "mt-3 rounded-md border px-3 py-2 text-sm",
              step.tone === "success"
                ? "border-success/20 bg-success/5 text-success"
                : step.tone === "primary"
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : step.tone === "warning"
                    ? "border-warning/30 bg-warning/10 text-warning-content"
                    : "border-base-300 bg-base-100 text-neutral/65",
            ].join(" ")}
          >
            <p className="font-black">{step.title}</p>
            <p className="mt-1 text-xs font-semibold leading-5 opacity-75">{step.body}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-base-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-neutral/40">
          {language === "id" ? "Update" : "Updated"} {dateShort(item.updated_at || item.created_at)}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {context.canDetail ? (
            <button
              type="button"
              className="btn btn-outline h-11 rounded-md"
              onClick={context.onDetail}
              disabled={context.isProcessing}
            >
              {language === "id" ? "Lihat detail" : "View detail"}
            </button>
          ) : null}
          {status === "active" ? (
            <button
              type="button"
              className="btn btn-primary h-11 rounded-md text-white"
              onClick={context.onEdit}
              disabled={context.isProcessing || !context.canEdit}
              title={
                !context.canEdit
                  ? negotiationTurnLabel(item, userRole, currentUserId, language)
                  : undefined
              }
            >
              {context.canEdit
                ? language === "id"
                  ? "Balas Penawaran"
                  : "Reply Offer"
                : language === "id"
                  ? "Menunggu Balasan"
                  : "Waiting Reply"}
            </button>
          ) : null}
          {canAct && acceptAction ? (
            <button
              type="button"
              className="btn btn-outline h-11 rounded-md border-success text-success hover:bg-success hover:text-white"
              onClick={() => context.onAction(acceptAction)}
              disabled={context.isProcessing}
            >
              {acceptAction.label}
            </button>
          ) : null}
          {canAct && rejectAction ? (
            <button
              type="button"
              className="btn btn-outline h-11 rounded-md border-error text-error hover:bg-error hover:text-white"
              onClick={() => context.onAction(rejectAction)}
              disabled={context.isProcessing}
            >
              {rejectAction.label}
            </button>
          ) : null}
          {userRole === "investor" && ["deal", "accepted"].includes(status) ? (
            <Link className="btn btn-outline h-11 rounded-md" to="/dashboard/investor/invoice">
              {language === "id" ? "Lihat invoice" : "View invoice"}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

const isNegotiationOpen = (item: Entity) => negotiationStatus(item) === "active";

const canRespondToNegotiation = (item: Entity, userId?: string | number) =>
  isNegotiationOpen(item) && !isCurrentUserLastSender(item, userId);

const _invoiceFields: ResourceField<Entity>[] = [
  { name: "nominal_tagihan", label: "Nominal Tagihan", type: "number", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "pending", label: "Pending" },
      { value: "paid", label: "Paid" },
    ],
  },
  { name: "due_date", label: "Due Date" },
];

const invoiceColumns: ResourceColumn<Entity>[] = [
  { label: "Invoice", render: (item) => <span className="font-black">{textValue(item.kode_pembayaran || `#${item.id}`)}</span> },
  { label: "Pengajuan", render: (item) => `#${textValue(readPath(item, ["detail_pengajuan.id", "pengajuans_id"]))}` },
  { label: "Nominal", render: (item) => currency(item.total_nominal || item.nominal_tagihan) },
  { label: "Due", render: (item) => dateShort(item.tenggat_waktu || item.due_date) },
  { label: "Status", render: (item) => badge(item.status) },
];

const investmentColumns: ResourceColumn<Entity>[] = [
  { label: "Bisnis", render: (item) => <span className="font-black">{textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis", "pengajuan.bisnis.nama"]))}</span> },
  { label: "Nominal", render: (item) => currency(item.nominal_investasi) },
  { label: "Return", render: (item) => percent(item.return_investasi) },
  { label: "Status", render: (item) => badge(readPath(item, ["negosiasi.status", "status"])) },
  { label: "Tanggal", render: (item) => dateShort(item.created_at) },
];

const profitFields: ResourceField<Entity>[] = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "pending", label: "Pending" },
      { value: "distributed", label: "Distributed" },
    ],
  },
];

const profitColumns: ResourceColumn<Entity>[] = [
  { label: "Bisnis", render: (item) => <span className="font-black">{textValue(readPath(item, ["penjualan.nama_bisnis", "bisnis"]))}</span> },
  { label: "Periode", render: (item) => textValue(item.periode) },
  { label: "Nominal Profit", render: (item) => currency(item.nominal_profit) },
  { label: "Investasi", render: (item) => `#${textValue(readPath(item, ["investasi.id", "investasi_id"]))}` },
  { label: "Status", render: (item) => badge(item.status) },
];

const classFields: ResourceField<Entity>[] = [
  { name: "nama_kelas", label: "Nama Kelas", required: true },
  { name: "deskripsi", label: "Deskripsi", type: "textarea", required: true },
];

const classColumns: ResourceColumn<Entity>[] = [
  { label: "Kelas", render: (item) => <span className="font-black">{textValue(item.nama_kelas)}</span> },
  { label: "Deskripsi", render: (item) => <span className="text-neutral/60">{textValue(item.deskripsi)}</span> },
];

const adminFields: ResourceField<Entity>[] = [
  { name: "nama", label: "Nama", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "password", label: "Password" },
  { name: "no_telp", label: "No. Telp", required: true },
  {
    name: "level",
    label: "Level",
    type: "select",
    options: [
      { value: "admin", label: "Admin" },
      { value: "superadmin", label: "Superadmin" },
    ],
  },
];

const adminColumns: ResourceColumn<Entity>[] = [
  { label: "Nama", render: (item) => <span className="font-black">{textValue(item.nama)}</span> },
  { label: "Email", render: (item) => textValue(item.email) },
  { label: "No. Telp", render: (item) => textValue(item.no_telp) },
  { label: "Level", render: (item) => badge(item.level) },
];

const _notificationFields: ResourceField<Entity>[] = [
  { name: "title", label: "Title", required: true },
  { name: "message", label: "Message", type: "textarea", required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "unread", label: "Belum Dibaca" },
      { value: "read", label: "Dibaca" },
    ],
  },
];

const dashboardBaseForRole = (role?: string) =>
  role === "admin" || role === "superadmin"
    ? "/dashboard/admin"
    : role === "investor"
      ? "/dashboard/investor"
      : "/dashboard/umkm";

const notificationDestination = (item: Entity, role?: string) => {
  const explicitPath = textValue(
    readPath(item, ["url", "link", "path", "deep_link", "target_url"], ""),
    "",
  );
  if (explicitPath.startsWith("/") && !explicitPath.startsWith("//")) {
    return explicitPath;
  }

  const base = dashboardBaseForRole(role);
  const content = [
    item.type,
    item.notification_type,
    item.related_entity,
    item.title,
    item.message,
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  if (content.includes("dokumen") || content.includes("document") || content.includes("verifikasi")) {
    return role === "admin" || role === "superadmin" ? `${base}/review` : `${base}/dokumen`;
  }
  if (content.includes("pengajuan") || content.includes("proposal") || content.includes("submission")) {
    if (role === "investor") return `${base}/peluang`;
    return role === "admin" || role === "superadmin" ? `${base}/pengajuan` : `${base}/pengajuan`;
  }
  if (content.includes("negosiasi") || content.includes("negotiation") || content.includes("deal")) {
    return `${base}/negosiasi`;
  }
  if (content.includes("invoice") || content.includes("tagihan") || content.includes("payment")) {
    return `${base}/invoice`;
  }
  if (content.includes("withdraw") || content.includes("penarikan")) {
    return role === "admin" || role === "superadmin" ? `${base}/withdrawals` : `${base}/wallet`;
  }
  if (content.includes("wallet") || content.includes("dompet") || content.includes("rekening")) {
    return role === "investor" ? `${base}/wallet` : base;
  }
  if (content.includes("profit") || content.includes("bagi hasil") || content.includes("distribusi")) {
    return `${base}/profit`;
  }
  if (content.includes("investasi") || content.includes("investment") || content.includes("portfolio")) {
    return role === "investor" ? `${base}/portfolio` : `${base}/investasi`;
  }
  if (content.includes("penjualan") || content.includes("sales")) {
    return `${base}/penjualan`;
  }
  if (content.includes("bisnis") || content.includes("business")) {
    return `${base}/bisnis`;
  }

  return base;
};

function NotificationDeepLink({ item }: { item: Entity }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const href = notificationDestination(item, user?.role);
  const fallbackBase = dashboardBaseForRole(user?.role);
  const hasSpecificDestination = href !== fallbackBase;

  return (
    <Link
      to={href}
      className={hasSpecificDestination ? "btn btn-outline btn-xs rounded-md" : "btn btn-ghost btn-xs rounded-md"}
    >
      {hasSpecificDestination
        ? language === "id"
          ? "Lihat detail"
          : "View detail"
        : language === "id"
          ? "Buka dashboard"
          : "Open dashboard"}
    </Link>
  );
}

const notificationColumns: ResourceColumn<Entity>[] = [
  {
    label: "Notifikasi",
    render: (item) => (
      <div>
        <p className="font-black">{textValue(item.title || item.type)}</p>
        <p className="mt-1 max-w-lg text-sm text-neutral/55">{textValue(item.message)}</p>
      </div>
    ),
  },
  { label: "Tanggal", render: (item) => dateShort(item.created_at) },
  { label: "Status", render: (item) => badge(item.is_read ? "read" : item.status || "unread") },
  { label: "Aksi", render: (item) => <NotificationDeepLink item={item} /> },
];

const submissionActions: ResourceAction<Entity>[] = [
  {
    label: "Setujui",
    method: "PUT",
    path: (item) => `/businesses/proposals/${item.id}/status`,
    body: { status: "approved", catatan: "Pengajuan disetujui dari dashboard." },
    confirm: "Setujui pengajuan ini?",
    className: "btn btn-success btn-xs rounded-md text-white",
    isVisible: (item) => isStatus(item, ["pending", "draft"]),
  },
  {
    label: "Tolak",
    method: "PUT",
    path: (item) => `/businesses/proposals/${item.id}/status`,
    body: { status: "rejected", catatan: "Pengajuan ditolak dari dashboard." },
    confirm: "Tolak pengajuan ini?",
    className: "btn btn-error btn-xs rounded-md text-white",
    isVisible: (item) => !isStatus(item, ["rejected", "approved", "published", "funded"]),
  },
];

const businessVerificationActions: ResourceAction<Entity>[] = [
  {
    label: "Verifikasi Bisnis",
    method: "PATCH",
    path: (item) => `/businesses/documents/${item.id}/verify`,
    confirm: "Verifikasi bisnis ini? Pastikan semua dokumen wajib sudah valid.",
    className: "btn btn-success btn-xs rounded-md text-white",
    isVisible: (item) => !Boolean(item.is_verified),
  },
];

const negotiationActionsFor = (
  userId?: string | number,
  language: "id" | "en" = "id",
): ResourceAction<Entity>[] => {
  return [
    {
      label: language === "id" ? "Setujui" : "Accept",
      method: "POST",
      path: (item) => `/businesses/proposals/negotiations/accept/${item.id}`,
      body: { catatan: "Negosiasi disetujui dari dashboard." },
      confirm: language === "id" ? "Setujui negosiasi ini?" : "Accept this negotiation?",
      className: "btn btn-success btn-xs rounded-md text-white",
      isVisible: (item) => canRespondToNegotiation(item, userId),
    },
    {
      label: language === "id" ? "Tolak" : "Reject",
      method: "POST",
      path: (item) => `/businesses/proposals/negotiations/reject/${item.id}`,
      body: { catatan: "Negosiasi ditolak dari dashboard." },
      confirm: language === "id" ? "Tolak negosiasi ini?" : "Reject this negotiation?",
      className: "btn btn-error btn-xs rounded-md text-white",
      isVisible: (item) => canRespondToNegotiation(item, userId),
    },
  ];
};

const invoiceActions: ResourceAction<Entity>[] = [
  {
    label: "Bayar Invoice",
    method: "PUT",
    path: (item) => `/invoices/${item.id}/pay`,
    confirm: "Bayar invoice ini?",
    className: "btn btn-primary btn-xs rounded-md text-white",
    isVisible: (item) => !isStatus(item, ["paid", "completed"]),
  },
  {
    label: "Bayar via Dompet",
    method: "POST",
    path: (item) => `/wallet/pay-invoice/${item.kode_pembayaran || item.id}`,
    confirm: "Bayar invoice ini menggunakan saldo dompet?",
    className: "btn btn-success btn-xs rounded-md text-white",
    isVisible: (item) => !isStatus(item, ["paid", "completed"]),
  },
];

const investmentActions: ResourceAction<Entity>[] = [
  {
    label: "Per Pengajuan",
    method: "GET",
    path: (item) => `/investasi/proposals?pengajuans_id=${item.pengajuans_id || item.pengajuan_id || item.id}`,
    className: "btn btn-outline btn-xs rounded-md",
  },
];

const profitActions: ResourceAction<Entity>[] = [
  {
    label: "Per Penjualan",
    method: "GET",
    path: (item) => `/profit-distributions/sales?penjualans_id=${item.penjualans_id || item.penjualan_id || readPath(item, ["penjualan.id"]) || item.id}`,
    className: "btn btn-outline btn-xs rounded-md",
  },
];

const notificationActions: ResourceAction<Entity>[] = [
  {
    label: "Tandai Dibaca",
    method: "PUT",
    path: (item) => `/notifications/${item.id}`,
    className: "btn btn-outline btn-xs rounded-md",
    isVisible: (item) => !item.is_read && !isStatus(item, ["read"]),
  },
];

function NegotiationDetailPreview({ data }: { data: unknown }) {
  const { language } = useLanguage();
  const items = useMemo(() => {
    if (Array.isArray(data)) return data as Entity[];
    if (data && typeof data === "object") {
      const objectData = data as Record<string, unknown>;
      if (Array.isArray(objectData.items)) return objectData.items as Entity[];
      if (Array.isArray(objectData.rows)) return objectData.rows as Entity[];
      return [objectData as Entity];
    }
    return [];
  }, [data]);

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-base-300 p-4 text-sm font-semibold text-neutral/55">
        {language === "id" ? "Detail negosiasi belum tersedia." : "Negotiation detail is not available yet."}
      </div>
    );
  }

  const latest = items[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-md border border-base-300 bg-base-100 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase text-neutral/45">{language === "id" ? "Bisnis" : "Business"}</p>
          <p className="mt-1 font-black text-neutral">{negotiationBusinessName(latest)}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-neutral/45">{language === "id" ? "Status" : "Status"}</p>
          <div className="mt-1">{negotiationStatusBadge(latest, language)}</div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-neutral/45">{language === "id" ? "Penawaran" : "Offer"}</p>
          <p className="mt-1 font-black text-neutral">
            {currency(latestOfferNominal(latest))} / {percent(latestOfferReturn(latest))}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-base-300">
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="grid gap-3 border-b border-base-300 p-4 last:border-b-0 sm:grid-cols-[0.22fr_1fr]"
          >
            <div>
              <p className="text-xs font-bold uppercase text-neutral/45">
                {language === "id" ? "Tahap" : "Step"} {index + 1}
              </p>
              <p className="mt-1 text-sm font-bold text-neutral/60">
                {dateShort(item.updated_at || item.created_at)}
              </p>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {negotiationStatusBadge(item, language)}
                <span className="text-sm font-bold text-neutral">
                  {currency(latestOfferNominal(item))} - {percent(latestOfferReturn(item))}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral/65">{latestOfferNote(item)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BusinessesPage({
  scope = "all",
}: {
  scope?: "all" | "mine" | "admin";
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const classOptionsQuery = useQuery({
    queryKey: ["business-class-options"],
    queryFn: () => resourceApi.list(classConfig),
    retry: false,
  });
  const config: ResourceConfig<Entity> =
    scope === "mine" ? myBusinessConfig : scope === "admin" ? adminBusinessConfig : businessConfig;
  const isAdminScope = scope === "admin";
  const isUmkmOwner = user?.role === "umkm" && !isAdminScope;
  const ownerBusinessQuery = useQuery({
    queryKey: ["umkm-business-check", user?.id ?? "guest"],
    queryFn: () => resourceApi.list(myBusinessConfig),
    enabled: isUmkmOwner,
    retry: false,
  });
  const canDelete = isUmkmOwner || (isAdminScope && user?.role === "superadmin");
  const hasOwnedBusiness = (ownerBusinessQuery.data ?? []).length > 0;
  const classOptions = useMemo(
    () =>
      (classOptionsQuery.data ?? []).map((item) => ({
        value: Number(item.id),
        label: `${textValue(item.nama_kelas)} - ${textValue(item.deskripsi, "-")}`,
      })),
    [classOptionsQuery.data],
  );
  const classOptionsFailed = classOptionsQuery.isError;
  const classOptionsEmpty = !classOptionsQuery.isLoading && classOptionsQuery.isSuccess && classOptions.length === 0;
  const classOptionsUnavailable = classOptionsFailed || classOptionsEmpty;
  const canCreateBusiness = isUmkmOwner && !classOptionsUnavailable;
  const businessDescription = classOptionsUnavailable
    ? "Data kelas bisnis belum tersedia. Muat ulang halaman lalu coba lagi."
    : "Data bisnis utama UMKM untuk pengajuan pendanaan investor.";
  const fields = useMemo<ResourceField<Entity>[]>(
    () =>
      businessFields.map((field) =>
        field.name === "kelas_id"
          ? {
              ...field,
              options: classOptions,
            }
          : field,
      ),
    [classOptions],
  );

  return (
    <div className="space-y-5">
      <ResourcePage
        title="Bisnis"
        description={businessDescription}
        config={config}
        columns={businessColumns}
        fields={fields}
        createLabel="Tambah Bisnis"
        allowCreate={canCreateBusiness}
        allowEdit={isUmkmOwner}
        allowDelete={canDelete}
        actions={isAdminScope ? businessVerificationActions : []}
        extraInvalidateKeys={
          isAdminScope ? [["admin-review-queue"], ["admin-review-queue", "documents"]] : undefined
        }
        emptyTitle={isUmkmOwner ? "Belum ada bisnis" : "Belum ada bisnis terdaftar"}
        emptyDescription={
          classOptionsUnavailable && isUmkmOwner
            ? "Kelas bisnis gagal dimuat. Periksa koneksi backend lalu muat ulang halaman."
            : isUmkmOwner
            ? "Tambahkan bisnis pertama agar kamu bisa membuat pengajuan pendanaan."
            : "Data bisnis akan muncul setelah UMKM mendaftarkan profil usaha."
        }
        searchableFields={["nama_bisnis", "nama", "tipe_usaha", "email", "no_telp"]}
        maxCreateItems={isUmkmOwner ? 1 : undefined}
        createLimitMessage="Setiap akun UMKM hanya dapat memiliki 1 bisnis. Gunakan aksi Edit untuk memperbarui bisnis yang sudah ada."
      formExtras={
        isUmkmOwner
          ? ({ editing, formValues, setFormValues, isSaving }) => {
              if (editing) return null;
              const coverFiles = asCoverFiles(formValues.__cover_files);
              return (
                <div className="space-y-3 rounded-md border border-base-300 bg-base-100 p-4">
                  <div>
                    <h4 className="text-sm font-black text-neutral">Cover Bisnis (Opsional)</h4>
                    <p className="mt-1 text-xs font-semibold text-neutral/60">
                      Pilih hingga 5 foto cover saat membuat bisnis.
                    </p>
                  </div>
                  <label className="btn btn-outline btn-sm rounded-md">
                    <ImagePlus size={16} />
                    Pilih Cover
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={isSaving || coverFiles.length >= MAX_BUSINESS_COVER_FILES}
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        if (files.length === 0) return;
                        setFormValues((current) => {
                          const existingFiles = asCoverFiles(current.__cover_files);
                          const nextFiles = [...existingFiles, ...files].slice(
                            0,
                            MAX_BUSINESS_COVER_FILES,
                          );
                          return { ...current, __cover_files: nextFiles };
                        });
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <p className="text-xs font-semibold text-neutral/60">
                    {coverFiles.length}/{MAX_BUSINESS_COVER_FILES} cover dipilih
                  </p>
                  {coverFiles.length > 0 ? (
                    <div className="space-y-2">
                      {coverFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-md border border-base-300 bg-white px-3 py-2 text-xs font-semibold text-neutral/70"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() =>
                              setFormValues((current) => {
                                const existingFiles = asCoverFiles(current.__cover_files);
                                const nextFiles = existingFiles.filter((_, fileIndex) => fileIndex !== index);
                                return { ...current, __cover_files: nextFiles };
                              })
                            }
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }
          : undefined
      }
      onAfterCreate={
        isUmkmOwner
          ? async (_created, context) => {
              const coverFiles = asCoverFiles(context.rawValues.__cover_files).slice(
                0,
                MAX_BUSINESS_COVER_FILES,
              );
              if (coverFiles.length === 0) return;

              for (const file of coverFiles) {
                const formData = new FormData();
                formData.append("image", file);
                await apiClient.post("/businesses/covers", formData);
              }

              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["business-covers", user?.id ?? "guest"] }),
                queryClient.invalidateQueries({ queryKey: ["umkm-business-check", user?.id ?? "guest"] }),
                queryClient.invalidateQueries({ queryKey: ["resource", "my-businesses"] }),
              ]);
            }
          : undefined
      }
    />
      {isUmkmOwner && hasOwnedBusiness ? <BusinessCoverGallerySection /> : null}
    </div>
  );
}

export function SubmissionsPage({ admin = false }: { admin?: boolean }) {
  const { user } = useAuth();
  const businessOptionsQuery = useQuery({
    queryKey: ["submission-business-options", admin, user?.id ?? "guest", user?.role ?? "guest"],
    queryFn: () => resourceApi.list(admin ? businessConfig : myBusinessConfig),
    enabled: !admin,
  });
  const availableBusinesses = useMemo(
    () => businessOptionsQuery.data ?? [],
    [businessOptionsQuery.data],
  );
  const myBusinessIds = useMemo(
    () =>
      new Set(
        availableBusinesses
          .map((item) => Number(item.id))
          .filter((value) => Number.isFinite(value)),
      ),
    [availableBusinesses],
  );
  const primaryBusiness = availableBusinesses[0];
  const profile = primaryBusiness?.profile;
  const hasBusinessProfile =
    profile &&
    typeof profile === "object" &&
    [
      "net_profit_margin",
      "kepuasan_pelanggan",
      "review_volatility",
      "repeat_order_rate",
      "digital_adoption_score",
      "year_revenue",
      "business_tenure_years",
      "tim_operasional",
    ].some((key) => {
      const value = (profile as Record<string, unknown>)[key];
      return value !== null && value !== undefined && value !== "";
    });
  const isBusinessVerified = Boolean(primaryBusiness?.is_verified);
  const hasBusiness = availableBusinesses.length > 0;
  const canCreateSubmission = admin
    ? false
    : hasBusiness && isBusinessVerified && Boolean(hasBusinessProfile);
  const submissionDescription = admin
    ? "Kelola review pengajuan UMKM, status approval, dan publikasi peluang."
    : !hasBusiness
    ? "Tambahkan bisnis terlebih dahulu sebelum membuat pengajuan pendanaan."
    : !isBusinessVerified
    ? "Bisnis belum terverifikasi admin. Pengajuan akan dibuka setelah verifikasi."
    : !hasBusinessProfile
    ? "Lengkapi bisnis profile terlebih dahulu agar pengajuan bisa dibuat."
    : "Kelola target pendanaan, return tahunan, dan detail peluang.";
  const umkmEmptyDescription = !hasBusiness
    ? "Tambahkan bisnis dulu agar bisa membuat pengajuan."
    : !isBusinessVerified
    ? "Tunggu verifikasi bisnis dari admin sebelum membuat pengajuan."
    : !hasBusinessProfile
    ? "Lengkapi bisnis profile sebelum membuat pengajuan."
    : "Buat pengajuan agar investor bisa melihat peluang pendanaan.";
  const fields = useMemo<ResourceField<Entity>[]>(() => {
    if (admin) return submissionFields;
    return [
      {
        name: "bisnis_id",
        label: "Bisnis",
        type: "select",
        required: true,
        hideOnEdit: true,
        options: asOptions(businessOptionsQuery.data ?? [], ["nama_bisnis", "nama"]),
      },
      {
        name: "target_pendanaan",
        label: "Target Pendanaan",
        type: "currency",
        required: true,
        placeholder: "250000000",
      },
      {
        name: "per_anual_return",
        label: "Return Tahunan",
        type: "percent",
        required: true,
        placeholder: "15.5",
        helperText: "Estimasi bagi hasil per tahun dalam persen.",
      },
      {
        name: "deskripsi_peluang",
        label: "Deskripsi Peluang",
        type: "textarea",
        colSpan: 2,
        placeholder:
          "Jelaskan peluang usaha, target pasar, rencana pertumbuhan, dan alasan investor perlu mendanai bisnis ini.",
      },
      {
        name: "rencana_penggunaan_dana",
        label: "Rencana Penggunaan Dana",
        type: "funding_plan",
        colSpan: 2,
      },
    ];
  }, [admin, businessOptionsQuery.data]);

  return (
    <ResourcePage
      title="Pengajuan Dana"
      description={submissionDescription}
      config={submissionConfig}
      columns={submissionColumns}
      fields={fields}
      createLabel="Tambah Pengajuan"
      actions={admin ? submissionActions : []}
      allowCreate={canCreateSubmission}
      allowEdit={!admin}
      allowDelete={admin}
      emptyTitle={admin ? "Belum ada pengajuan" : "Belum ada pengajuan dana"}
      emptyDescription={
        admin
          ? "Pengajuan UMKM akan muncul di sini untuk proses review."
          : umkmEmptyDescription
      }
      searchableFields={[
        "id",
        "target_pendanaan",
        "per_anual_return",
        "deskripsi_peluang",
        (item) => readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "bisnis_nama"]),
      ]}
      rowFilter={
        admin
          ? undefined
          : (item) => {
              const businessId = Number(readPath(item, ["bisnis_id", "bisnis.id"], ""));
              return Number.isFinite(businessId) && myBusinessIds.has(businessId);
            }
      }
      maxCreateItems={admin ? undefined : 1}
      createLimitMessage="Setiap bisnis hanya bisa memiliki 1 pengajuan aktif."
    />
  );
}

export function SalesPage() {
  const { user } = useAuth();

  if (user?.role === "umkm") return <UmkmSalesPage />;

  return (
    <ResourcePage
      title="Laporan Penjualan"
      description="Catat periode penjualan, laba, dan transaksi untuk kebutuhan distribusi profit."
      config={salesConfig}
      columns={salesColumns}
      fields={salesFields}
      createLabel="Tambah Laporan"
      actions={[]}
      allowCreate={false}
      allowEdit={false}
      allowDelete={false}
      emptyTitle="Belum ada laporan penjualan"
      emptyDescription="Laporan penjualan UMKM akan tampil setelah backend menyediakan daftar data untuk role ini."
      searchableFields={["periode", "pengajuans_id", "total_penjualan"]}
    />
  );
}

function UmkmSalesPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    pengajuans_id: "",
    periode: "",
    total_penjualan: "",
    laba_kotor: "",
    laba_bersih: "",
    jumlah_transaksi: "",
  });
  const [monthlySalesDoc, setMonthlySalesDoc] = useState<File | null>(null);
  const [yearlySalesDoc, setYearlySalesDoc] = useState<File | null>(null);
  const myBusinessesQuery = useQuery({
    queryKey: ["sales-business-options", user?.id ?? "guest", user?.role ?? "guest"],
    queryFn: () => resourceApi.list(myBusinessConfig),
    enabled: user?.role === "umkm",
    retry: false,
  });
  const submissionsQuery = useQuery({
    queryKey: ["sales-submission-options", user?.id ?? "guest", user?.role ?? "guest"],
    queryFn: () => resourceApi.list(submissionConfig),
    enabled: user?.role === "umkm",
    retry: false,
  });
  const ownBusinessIds = useMemo(
    () =>
      new Set(
        (myBusinessesQuery.data ?? [])
          .map((item) => Number(readPath(item, ["id"], "")))
          .filter((value) => Number.isFinite(value)),
      ),
    [myBusinessesQuery.data],
  );
  const ownSubmissions = useMemo(
    () =>
      (submissionsQuery.data ?? []).filter((item) => {
        const businessId = Number(readPath(item, ["bisnis_id", "bisnis.id"], ""));
        return Number.isFinite(businessId) && ownBusinessIds.has(businessId);
      }),
    [ownBusinessIds, submissionsQuery.data],
  );
  const submissionOptions = useMemo(
    () =>
      ownSubmissions.map((item) => {
        const businessLabel = textValue(
          readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "bisnis_nama", "nama", "id"]),
        );
        const statusRaw = textValue(
          readPath(item, ["approval.status", "approval_status", "status"]),
          "-",
        );
        const statusLabel = statusRaw === "-" ? statusRaw : t(statusRaw);
        const targetLabel = currency(readPath(item, ["target_pendanaan"]));
        return {
          value: item.id,
          label: `${businessLabel} | ${targetLabel} | ${statusLabel}`,
        };
      }),
    [ownSubmissions, t],
  );
  const isOptionsLoading = myBusinessesQuery.isLoading || submissionsQuery.isLoading;
  const isOptionsError = myBusinessesQuery.isError || submissionsQuery.isError;
  const hasBusiness = (myBusinessesQuery.data ?? []).length > 0;
  const hasSubmissions = ownSubmissions.length > 0;
  const selectPlaceholder = isOptionsLoading
    ? language === "id"
      ? "Memuat pengajuan..."
      : "Loading submissions..."
    : language === "id"
      ? "Pilih pengajuan"
      : "Choose submission";
  const selectedPengajuanId = form.pengajuans_id.trim();
  const activePengajuanId =
    !selectedPengajuanId ||
    submissionOptions.some((option) => String(option.value) === selectedPengajuanId)
      ? selectedPengajuanId
      : "";
  const submitDisabledReason = isOptionsLoading
    ? language === "id"
      ? "Data pengajuan masih dimuat."
      : "Submission data is still loading."
    : isOptionsError
      ? language === "id"
        ? "Perbaiki error data pengajuan terlebih dahulu."
        : "Fix submission data error first."
      : !hasBusiness
        ? language === "id"
          ? "Tambahkan bisnis terlebih dahulu."
          : "Create a business profile first."
        : !hasSubmissions
          ? language === "id"
            ? "Buat pengajuan pendanaan terlebih dahulu."
            : "Create a funding submission first."
          : !activePengajuanId
            ? language === "id"
              ? "Pilih pengajuan terlebih dahulu."
              : "Choose a submission first."
            : null;

  const uploadSalesDocMutation = useMutation({
    mutationFn: async (params: { type: "monthly" | "yearly"; file: File }) => {
      const documentName =
        params.type === "monthly" ? "Laporan Omset Bulanan" : "Laporan Omset Tahunan";
      const formData = new FormData();
      formData.append("jenis_dokumen", "laporan_penjualan");
      formData.append("nama_list", JSON.stringify([documentName]));
      formData.append("files", params.file);
      const response = await apiClient.post("/businesses/documents", formData);
      return unwrap<unknown>(response.data);
    },
    onSuccess: (_data, variables) => {
      if (variables.type === "monthly") setMonthlySalesDoc(null);
      if (variables.type === "yearly") setYearlySalesDoc(null);
      toast.success(
        language === "id"
          ? "Dokumen penjualan berhasil diupload."
          : "Sales document uploaded successfully.",
        { title: t("dataAdded") },
      );
    },
    onError: (error) => {
      toast.error(
        apiErrorMessage(
          error,
          language === "id"
            ? "Upload dokumen penjualan gagal."
            : "Failed to upload sales document.",
        ),
        { title: t("saveFailed") },
      );
    },
  });

  const uploadSalesDocument = (type: "monthly" | "yearly") => {
    const file = type === "monthly" ? monthlySalesDoc : yearlySalesDoc;
    if (!file) {
      toast.warning(
        language === "id"
          ? "Pilih file dokumen terlebih dahulu."
          : "Choose a document file first.",
      );
      return;
    }
    uploadSalesDocMutation.mutate({ type, file });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/businesses/proposals/sales", {
        pengajuans_id: Number(activePengajuanId),
        periode: form.periode,
        total_penjualan: parseNumberInput(form.total_penjualan),
        laba_kotor: parseNumberInput(form.laba_kotor),
        laba_bersih: parseNumberInput(form.laba_bersih),
        jumlah_transaksi: parseNumberInput(form.jumlah_transaksi),
      });
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      const selectedId = activePengajuanId;
      toast.success(t("salesReportSubmitSuccess"), { title: t("dataAdded") });
      setForm({
        pengajuans_id: selectedId,
        periode: "",
        total_penjualan: "",
        laba_kotor: "",
        laba_bersih: "",
        jumlah_transaksi: "",
      });
      if (selectedId) {
        await queryClient.invalidateQueries({
          queryKey: ["resource", `sales-pengajuan-${selectedId}`],
        });
      }
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, t("salesReportSubmitError")), {
        title: t("saveFailed"),
      });
    },
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black tracking-normal text-neutral">{t("Laporan Penjualan")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
          {t("umkmSalesDescription")}
        </p>
      </div>
      <form className="rounded-md border border-base-300 bg-white p-5 shadow-sm" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          {salesFields.map((field) => (
            <label key={field.name} className="form-control">
              <span className="label-text mb-2 font-semibold">{t(field.label)}</span>
              {field.name === "pengajuans_id" ? (
                <select
                  className="select select-bordered rounded-md"
                  value={activePengajuanId}
                  onChange={(event) => update("pengajuans_id", event.target.value)}
                  disabled={isOptionsLoading || isOptionsError || !hasSubmissions}
                  required
                >
                  <option value="">{selectPlaceholder}</option>
                  {submissionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.name === "periode" ? (
                <input
                  className="input input-bordered rounded-md"
                  type="month"
                  value={form.periode}
                  onChange={(event) => update("periode", event.target.value)}
                  required
                />
              ) : field.name === "total_penjualan" ||
                field.name === "laba_kotor" ||
                field.name === "laba_bersih" ? (
                <div className="input input-bordered flex items-center gap-2 rounded-md">
                  <span className="text-sm font-semibold text-neutral/60">Rp</span>
                  <input
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    inputMode="numeric"
                    pattern="[0-9.]*"
                    value={formatNumberInput(form[field.name as keyof typeof form] ?? "")}
                    onChange={(event) =>
                      update(
                        field.name as keyof typeof form,
                        onlyDigits(event.target.value),
                      )
                    }
                    placeholder="0"
                    required
                  />
                </div>
              ) : field.name === "jumlah_transaksi" ? (
                <input
                  className="input input-bordered rounded-md"
                  type="number"
                  min={0}
                  step={1}
                  value={form.jumlah_transaksi}
                  onChange={(event) =>
                    update("jumlah_transaksi", onlyDigits(event.target.value))
                  }
                  required
                />
              ) : (
                <input
                  className="input input-bordered rounded-md"
                  type={field.type ?? "text"}
                  value={form[field.name as keyof typeof form] ?? ""}
                  onChange={(event) => update(field.name as keyof typeof form, event.target.value)}
                  required={field.required}
                  placeholder={field.name === "periode" ? t("periodPlaceholder") : undefined}
                />
              )}
            </label>
          ))}
        </div>
        {isOptionsError ? (
          <div className="mt-4 rounded-md border border-error/20 bg-error/5 px-3 py-2 text-sm font-semibold text-error">
            {language === "id"
              ? "Gagal memuat data pengajuan. Coba muat ulang halaman."
              : "Failed to load submission data. Please refresh the page."}
          </div>
        ) : null}
        {!isOptionsLoading && !isOptionsError && !hasBusiness ? (
          <div className="mt-4 rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm font-semibold text-neutral/65">
            {language === "id"
              ? "Belum ada bisnis aktif. Tambahkan bisnis terlebih dahulu sebelum mengirim laporan penjualan."
              : "No active business found. Add a business first before submitting sales reports."}
          </div>
        ) : null}
        {!isOptionsLoading && !isOptionsError && hasBusiness && !hasSubmissions ? (
          <div className="mt-4 space-y-3 rounded-md border border-base-300 bg-base-100 px-3 py-2">
            <p className="text-sm font-semibold text-neutral/65">
              {language === "id"
                ? "Belum ada pengajuan untuk bisnis kamu."
                : "No submission found for your business yet."}
            </p>
            <Link className="btn btn-sm btn-primary rounded-md text-white" to="/dashboard/umkm/pengajuan">
              {language === "id" ? "Buka halaman pengajuan" : "Open submissions page"}
            </Link>
          </div>
        ) : null}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="btn btn-primary rounded-md text-white"
            disabled={mutation.isPending || isOptionsLoading || isOptionsError || !activePengajuanId}
          >
            {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : null}
            {t("Tambah Laporan")}
          </button>
          {submitDisabledReason ? (
            <span className="text-sm font-semibold text-neutral/60">{submitDisabledReason}</span>
          ) : null}
        </div>
      </form>
      <section className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-neutral">
            {language === "id" ? "Upload Dokumen Penjualan" : "Upload Sales Documents"}
          </h3>
          <p className="mt-1 text-sm text-neutral/60">
            {language === "id"
              ? "Upload dokumen omset bulanan dan tahunan untuk melengkapi data penjualan."
              : "Upload monthly and yearly revenue documents to complete your sales data."}
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-md border border-base-300 bg-base-100 p-4">
            <p className="text-sm font-semibold text-neutral">
              {language === "id" ? "Dokumen Omset Bulanan" : "Monthly Revenue Document"}
            </p>
            <input
              type="file"
              className="file-input file-input-bordered w-full rounded-md bg-white"
              onChange={(event) => setMonthlySalesDoc(event.target.files?.[0] ?? null)}
              disabled={uploadSalesDocMutation.isPending}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm rounded-md"
              onClick={() => uploadSalesDocument("monthly")}
              disabled={uploadSalesDocMutation.isPending || !monthlySalesDoc}
            >
              {uploadSalesDocMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {language === "id" ? "Upload Bulanan" : "Upload Monthly"}
            </button>
          </div>
          <div className="space-y-3 rounded-md border border-base-300 bg-base-100 p-4">
            <p className="text-sm font-semibold text-neutral">
              {language === "id" ? "Dokumen Omset Tahunan" : "Yearly Revenue Document"}
            </p>
            <input
              type="file"
              className="file-input file-input-bordered w-full rounded-md bg-white"
              onChange={(event) => setYearlySalesDoc(event.target.files?.[0] ?? null)}
              disabled={uploadSalesDocMutation.isPending}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm rounded-md"
              onClick={() => uploadSalesDocument("yearly")}
              disabled={uploadSalesDocMutation.isPending || !yearlySalesDoc}
            >
              {uploadSalesDocMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {language === "id" ? "Upload Tahunan" : "Upload Yearly"}
            </button>
          </div>
        </div>
      </section>
      {activePengajuanId ? (
        <ResourcePage
          title="Riwayat Penjualan Pengajuan"
          description="Laporan penjualan untuk pengajuan yang sedang dipilih."
          config={salesByPengajuanConfig(activePengajuanId)}
          columns={salesColumns}
          fields={[]}
          showTitle={false}
          showBreadcrumb={false}
          showStatusFilter={false}
          readonly
          allowCreate={false}
          allowEdit={false}
          allowDelete={false}
          emptyTitle="Belum ada laporan untuk pengajuan ini"
          emptyDescription="Tambahkan laporan penjualan untuk melihat riwayat pada pengajuan yang dipilih."
          searchableFields={["periode", "total_penjualan", "laba_bersih", "jumlah_transaksi"]}
        />
      ) : null}
    </section>
  );
}

export function NegotiationsPage({ mine = false }: { mine?: boolean }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const canNegotiate = user?.role === "umkm" || user?.role === "investor";
  const opportunitiesQuery = useQuery({
    queryKey: ["negotiation-opportunity-options", user?.id ?? "guest", user?.role ?? "guest"],
    queryFn: () => resourceApi.list(publishedSubmissionConfig),
    enabled: user?.role === "investor",
    retry: false,
  });
  const opportunities = useMemo(
    () => opportunitiesQuery.data ?? [],
    [opportunitiesQuery.data],
  );
  const canCreateNegotiation =
    user?.role === "investor" &&
    !opportunitiesQuery.isLoading &&
    !opportunitiesQuery.isError &&
    opportunities.length > 0;

  const isEditableNegotiation = (item: Entity) => {
    return canRespondToNegotiation(item, currentUserId);
  };

  const editNegotiationReason = (item: Entity) => {
    const status = negotiationStatus(item);
    if (status !== "active") {
      return language === "id"
        ? "Negosiasi sudah tidak aktif."
        : "Negotiation is no longer active.";
    }

    if (isCurrentUserLastSender(item, currentUserId)) {
      return negotiationTurnLabel(item, user?.role, currentUserId, language);
    }

    return undefined;
  };

  const negotiationColumnsForRole = useMemo<ResourceColumn<Entity>[]>(
    () => [
      {
        label: language === "id" ? "Peluang" : "Opportunity",
        render: (item) => (
          <div className="min-w-64">
            <p className="text-base font-black leading-tight text-neutral">{negotiationBusinessName(item)}</p>
            <p className="mt-1 text-sm font-semibold text-neutral/50">
              #{negotiationProposalId(item)}
              {fundingTarget(item) > 0 ? ` - ${currency(fundingTarget(item))}` : ""}
            </p>
          </div>
        ),
      },
      {
        label: language === "id" ? "Penawaran terakhir" : "Latest offer",
        render: (item) => (
          <div>
            <p className="text-base font-black leading-tight text-neutral">{currency(latestOfferNominal(item))}</p>
            <p className="mt-1 text-sm font-semibold text-neutral/55">
              {language === "id" ? "Return" : "Return"} {percent(latestOfferReturn(item))}
            </p>
          </div>
        ),
      },
      {
        label: language === "id" ? "Giliran" : "Turn",
        render: (item) => (
          <div className="min-w-56">
            <p className="font-black text-neutral">
              {negotiationTurnLabel(item, user?.role, currentUserId, language)}
            </p>
            <p className="mt-1 text-sm font-semibold text-neutral/55">
              {latestOfferSenderLabel(item, currentUserId, language)}
            </p>
          </div>
        ),
      },
      {
        label: language === "id" ? "Langkah berikutnya" : "Next step",
        render: (item) => {
          const step = nextNegotiationStep(item, user?.role, currentUserId, language);
          const toneClass =
            step.tone === "success"
              ? "border-success/20 bg-success/5 text-success"
              : step.tone === "primary"
                ? "border-primary/20 bg-primary/5 text-primary"
                : step.tone === "warning"
                  ? "border-warning/30 bg-warning/10 text-warning-content"
                  : "border-base-300 bg-base-100 text-neutral/65";
          return (
            <div className="min-w-64 space-y-2">
              <div className={`rounded-md border px-3 py-2 ${toneClass}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {negotiationStatusBadge(item, language)}
                  <span className="text-sm font-black">{step.title}</span>
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 opacity-75">{step.body}</p>
              </div>
              <p className="text-xs font-semibold text-neutral/45">
                {language === "id" ? "Update" : "Updated"} {dateShort(item.updated_at || item.created_at)}
              </p>
              {user?.role === "investor" && ["deal", "accepted"].includes(negotiationStatus(item)) ? (
                <Link
                  className="btn btn-outline btn-xs rounded-md"
                  to="/dashboard/investor/invoice"
                >
                  {language === "id" ? "Lihat invoice" : "View invoice"}
                </Link>
              ) : null}
            </div>
          );
        },
      },
    ],
    [currentUserId, language, user?.role],
  );

  const negotiationDescription =
    user?.role === "investor"
      ? opportunitiesQuery.isLoading
        ? language === "id"
          ? "Memuat peluang pendanaan yang bisa dinegosiasikan..."
          : "Loading funding opportunities that can be negotiated..."
        : opportunitiesQuery.isError
          ? language === "id"
            ? "Gagal memuat peluang pendanaan. Coba refresh halaman."
            : "Failed to load funding opportunities. Please refresh the page."
          : opportunities.length === 0
            ? language === "id"
              ? "Belum ada peluang pendanaan dipublikasikan untuk memulai negosiasi."
              : "No published opportunities are available to start negotiation."
            : "Kelola penawaran nominal, return, status, dan catatan antara investor dan pemilik bisnis."
      : "Kelola penawaran nominal, return, status, dan catatan antara investor dan pemilik bisnis.";
  const opportunityOptions = useMemo(
    () =>
      opportunities.map((item) => {
        const target = fundingTarget(item);
        const targetLabel = target > 0 ? currency(target) : "Target -";
        const returnLabel = percent(proposalReturn(item));
        return {
          value: item.id,
          label: `${negotiationBusinessName(item)} - ${targetLabel} - Return ${returnLabel}`,
        };
      }),
    [opportunities],
  );
  const fields = useMemo<ResourceField<Entity>[]>(() => {
    if (user?.role !== "investor") return negotiationFields.slice(1);
    return [
      {
        name: "pengajuans_id",
        label: "Pengajuan",
        type: "select",
        required: true,
        options: opportunityOptions,
      },
      ...negotiationFields.slice(1),
    ];
  }, [opportunityOptions, user?.role]);

  const validateNegotiationForm = (
    values: Partial<Entity>,
    context: { editing: Entity | null; fields: ResourceField<Entity>[] },
  ) => {
    const amount = Number(values.penawaran_nominal);
    if (!Number.isFinite(amount) || amount <= 0) {
      return language === "id"
        ? "Nominal penawaran harus lebih dari 0."
        : "Offer amount must be greater than 0.";
    }

    const returnValue = Number(values.penawaran_return);
    if (!Number.isFinite(returnValue) || returnValue <= 0 || returnValue > 50) {
      return language === "id"
        ? "Return penawaran harus berada di rentang 0,01 sampai 50 persen."
        : "Offer return must be between 0.01 and 50 percent.";
    }

    const selectedOpportunity = context.editing
      ? context.editing
      : opportunities.find((item) => String(item.id) === String(values.pengajuans_id));
    const maxAmount = selectedOpportunity ? fundingTarget(selectedOpportunity) : 0;
    if (maxAmount > 0 && amount > maxAmount) {
      return language === "id"
        ? `Nominal penawaran tidak boleh melebihi target pendanaan ${currency(maxAmount)}.`
        : `Offer amount cannot exceed the funding target ${currency(maxAmount)}.`;
    }

    return undefined;
  };

  const actions = useMemo(
    () => (canNegotiate ? negotiationActionsFor(currentUserId, language) : []),
    [canNegotiate, currentUserId, language],
  );

  const extraInvalidateKeys = useMemo(
    () => [
      ["resource", "my-negotiations"],
      ["resource", "negotiations"],
      ["resource", "investor-invoices"],
      ["resource", "invoices"],
      ["resource", "investor-investments"],
      ["resource", "investments"],
      ["overview"],
      ["sidebar-locks"],
      ["dashboard-notification-dot"],
      ["ai-recommendations"],
    ],
    [],
  );

  return (
    <ResourcePage
      title="Negosiasi"
      description={negotiationDescription}
      config={mine ? myNegotiationConfig : negotiationConfig}
      columns={negotiationColumnsForRole}
      fields={fields}
      createLabel="Mulai Negosiasi"
      actions={actions}
      allowCreate={canCreateNegotiation}
      allowEdit={canNegotiate}
      canEditRow={isEditableNegotiation}
      editDisabledReason={editNegotiationReason}
      hideDisabledEdit
      allowDelete={false}
      validateForm={validateNegotiationForm}
      extraInvalidateKeys={extraInvalidateKeys}
      detailRenderer={(data) => <NegotiationDetailPreview data={data} />}
      rowCardRenderer={
        canNegotiate
          ? (item, context) => (
              <NegotiationCard
                item={item}
                userRole={user?.role}
                currentUserId={currentUserId}
                language={language}
                context={context}
              />
            )
          : undefined
      }
      statusFilterVariant="tabs"
      emptyTitle="Belum ada negosiasi"
      emptyDescription={
        user?.role === "investor"
          ? opportunitiesQuery.isError
            ? "Peluang pendanaan gagal dimuat. Coba refresh halaman lalu ulangi."
            : opportunities.length === 0
              ? "Belum ada peluang pendanaan untuk memulai negosiasi."
              : "Mulai negosiasi dari peluang pendanaan yang tersedia."
          : "Negosiasi investor akan muncul di sini setelah ada penawaran."
      }
      emptyAction={
        user?.role === "investor" ? (
          <Link className="btn btn-primary btn-sm rounded-md text-white" to="/dashboard/investor/peluang">
            {language === "id" ? "Lihat peluang UMKM" : "View UMKM opportunities"}
          </Link>
        ) : undefined
      }
      searchableFields={["status", "catatan", (item) => readPath(item, ["investor.nama", "bisnis.nama", "bisnis.nama_bisnis"])]}
    />
  );
}

export function OpportunitiesPage() {
  return (
    <ResourcePage
      title="Peluang Pendanaan"
      description="Daftar pengajuan UMKM yang sudah dipublikasikan dan siap untuk investasi."
      config={publishedSubmissionConfig}
      columns={submissionColumns}
      readonly
      emptyTitle="Belum ada peluang pendanaan"
      emptyDescription="Peluang akan muncul setelah pengajuan UMKM dipublikasikan."
      searchableFields={["target_pendanaan", "per_anual_return", (item) => readPath(item, ["bisnis.nama_bisnis", "bisnis.nama"])]}
    />
  );
}

export function AiRecommendationsPage() {
  const [risk, setRisk] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const queryClient = useQueryClient();
  const {
    data: recommendationsPayload = null,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["ai-recommendations", "backend"],
    queryFn: async () => {
      const response = await apiClient.get("/user/investor/recommendations");
      return unwrap<unknown>(response.data);
    },
  });
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/user/investor/preferences/refresh");
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      setRefreshMessage("Rekomendasi berhasil diperbarui.");
      setRefreshError("");
      await queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
    },
    onError: (error) => {
      setRefreshMessage("");
      setRefreshError(apiErrorMessage(error, "Rekomendasi belum bisa diperbarui."));
    },
  });
  const backendRecommendations = useMemo(() => {
    if (Array.isArray(recommendationsPayload)) return recommendationsPayload as Entity[];
    if (recommendationsPayload && typeof recommendationsPayload === "object") {
      const payload = recommendationsPayload as Record<string, unknown>;
      if (Array.isArray(payload.rekomendasi)) return payload.rekomendasi as Entity[];
    }
    return [];
  }, [recommendationsPayload]);
  const data = useMemo(
    () =>
      backendRecommendations.filter((item) => {
        const riskValue = textValue(readPath(item, ["risk_level", "matched_class", "bisnis.kelas.nama_kelas"])).toLowerCase();
        const riskMatch = risk === "all" || riskValue === risk;
        return riskMatch && Number(item.match_score || item.skor_kecocokan || 0) >= minScore;
      }),
    [backendRecommendations, minScore, risk],
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral">AI Matchmaking</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
            Rekomendasi peluang berdasarkan skor kecocokan, risiko, return, dan
            kebutuhan pendanaan.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/dashboard/investor/preferensi" className="btn btn-outline h-11 rounded-md">
            Preferensi
          </Link>
          <button
            className="btn btn-primary h-11 rounded-md text-white"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            {refreshMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Refresh
          </button>
          <label className="flex h-11 items-center gap-2 rounded-md border border-base-300 bg-white px-3">
            <Filter size={18} />
            <select
              className="bg-transparent text-sm font-semibold outline-none"
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
            >
              <option value="all">Semua risiko</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="input input-bordered flex h-11 items-center gap-2 rounded-md bg-white">
            <span className="text-sm font-bold">Min</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-16"
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
            />
            <span className="text-sm font-bold">%</span>
          </label>
        </div>
      </div>
      {refreshMessage ? (
        <div className="rounded-md border border-info/20 bg-info/10 px-4 py-3 text-sm font-semibold text-info">
          {refreshMessage}
        </div>
      ) : null}
      {refreshError ? (
        <div className="rounded-md border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          {refreshError}
        </div>
      ) : null}
      {isError ? (
        <div className="flex flex-col gap-3 rounded-md border border-warning/20 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning sm:flex-row sm:items-center sm:justify-between">
          <span>
            {apiErrorMessage(
              error,
              "Layanan rekomendasi belum merespons. Coba lagi setelah beberapa saat.",
            )}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline rounded-md"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Coba lagi
          </button>
        </div>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-3">
        {isLoading ? (
          <div className="rounded-md border border-base-300 bg-white p-5 text-sm font-semibold text-neutral/55">
            Memuat rekomendasi
          </div>
        ) : null}
        {data.map((item) => (
          <article key={item.id} className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">
                  {textValue(readPath(item, ["bisnis.nama_bisnis", "bisnis.nama", "bisnis_id"]))}
                </h3>
                <p className="mt-1 text-sm text-neutral/55">
                  {textValue(readPath(item, ["bisnis.kelas.nama_kelas", "matched_class", "risk_level"]))}
                </p>
              </div>
              <span className="badge badge-secondary badge-lg text-white">
                {percent(item.match_score || item.skor_kecocokan)}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-base-200 p-3">
                <p className="text-neutral/50">Target</p>
                <p className="font-black">{currency(item.target_pendanaan || readPath(item, ["bisnis.target_pendanaan"]))}</p>
              </div>
              <div className="rounded-md bg-base-200 p-3">
                <p className="text-neutral/50">Return</p>
                <p className="font-black">{percent(item.per_anual_return)}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-neutral/60">
              {textValue(
                readPath(item, ["reason", "alasan", "explanation", "match_reason"], ""),
                `Cocok dengan profil risiko ${textValue(
                  readPath(item, ["risk_level", "matched_class", "bisnis.kelas.nama_kelas"]),
                ).toLowerCase()} dan target return ${percent(item.per_anual_return)}.`,
              )}
            </p>
          </article>
        ))}
        {!isLoading && !isError && data.length === 0 ? (
          <div className="rounded-md border border-base-300 bg-white p-5 text-sm font-semibold text-neutral/55">
            Rekomendasi belum tersedia. Isi preferensi investor lalu jalankan refresh.
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function InvoicesPage({ investor = false }: { investor?: boolean }) {
  const { language } = useLanguage();
  const summaryQuery = useQuery({
    queryKey: ["investor-invoice-summary"],
    queryFn: () => resourceApi.list(investor ? investorInvoiceConfig : invoiceConfig),
    retry: false,
    enabled: investor,
  });

  const invoiceRows = summaryQuery.data ?? [];
  const pendingInvoices = invoiceRows.filter((item) => {
    const normalized = String(readPath(item, ["status", "invoice_status"], "")).toLowerCase();
    return ["pending", "unpaid", "waiting_payment", "belum_dibayar"].includes(normalized);
  });
  const paidInvoices = invoiceRows.filter((item) => {
    const normalized = String(readPath(item, ["status", "invoice_status"], "")).toLowerCase();
    return ["paid", "completed", "settled", "lunas"].includes(normalized);
  });
  const pendingNominal = pendingInvoices.reduce(
    (sum, item) => sum + Number(readPath(item, ["total_nominal", "nominal_tagihan"], "0") || 0),
    0,
  );

  if (investor) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral">Invoice</h2>
          <DashboardBreadcrumb />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-neutral/55">
              {language === "id" ? "Perlu Dibayar" : "Pending Payment"}
            </p>
            <p className="mt-2 text-3xl font-black">{pendingInvoices.length}</p>
            <p className="mt-1 text-xs font-semibold text-neutral/45">
              {language === "id" ? "Invoice belum lunas" : "Unpaid investor invoices"}
            </p>
          </article>
          <article className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-neutral/55">
              {language === "id" ? "Sudah Dibayar" : "Paid"}
            </p>
            <p className="mt-2 text-3xl font-black">{paidInvoices.length}</p>
            <p className="mt-1 text-xs font-semibold text-neutral/45">
              {language === "id" ? "Status pembayaran selesai" : "Completed payments"}
            </p>
          </article>
          <article className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-neutral/55">
              {language === "id" ? "Total Tagihan Aktif" : "Active Invoice Amount"}
            </p>
            <p className="mt-2 text-3xl font-black">{currency(pendingNominal)}</p>
            <p className="mt-1 text-xs font-semibold text-neutral/45">
              {language === "id" ? "Akumulasi invoice pending" : "Sum of pending invoices"}
            </p>
          </article>
        </div>

        <ResourcePage
          title="Invoice"
          description="Pantau tagihan investasi dan status pembayaran invoice."
          config={investorInvoiceConfig}
          columns={invoiceColumns}
          fields={[]}
          createLabel="Update Invoice"
          actions={invoiceActions}
          readonly
          emptyTitle="Belum ada invoice"
          emptyDescription="Invoice investasi akan muncul setelah negosiasi berlanjut ke proses pembayaran."
          searchableFields={[
            "kode_pembayaran",
            "status",
            "total_nominal",
            "nominal_tagihan",
            (item) => readPath(item, ["pengajuan.bisnis.nama_bisnis", "bisnis.nama_bisnis", "bisnis"]),
          ]}
          showTitle={false}
          showBreadcrumb={false}
          statusFilterVariant="tabs"
          emptyAction={
            <Link to="/dashboard/investor/negosiasi" className="btn btn-sm btn-primary rounded-md text-white">
              {language === "id" ? "Lanjut ke Negosiasi" : "Go to Negotiations"}
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <ResourcePage
      title="Invoice"
      description="Pantau tagihan investasi dan status pembayaran invoice."
      config={invoiceConfig}
      columns={invoiceColumns}
      fields={[]}
      createLabel="Update Invoice"
      actions={[]}
      readonly
      emptyTitle="Belum ada invoice"
      emptyDescription="Invoice platform akan muncul setelah ada transaksi investasi."
      searchableFields={["kode_pembayaran", "status", "total_nominal", "nominal_tagihan"]}
    />
  );
}

export function InvestmentsPage({ investor = false }: { investor?: boolean }) {
  return (
    <ResourcePage
      title="Investasi"
      description="Daftar investasi aktif berdasarkan invoice yang telah dibayar."
      config={investor ? investorInvestmentConfig : investmentConfig}
      columns={investmentColumns}
      actions={investor ? [] : investmentActions}
      readonly
      emptyTitle="Belum ada investasi"
      emptyDescription={
        investor
          ? "Portfolio investasi akan muncul setelah invoice dibayar."
          : "Investasi akan muncul setelah investor menyelesaikan pembayaran invoice."
      }
      searchableFields={["status", "nominal_investasi", (item) => readPath(item, ["bisnis.nama_bisnis", "bisnis", "pengajuan.bisnis.nama"])]}
    />
  );
}

export function InvestmentsByProposalPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [pengajuanId, setPengajuanId] = useState("");
  const myBusinessesQuery = useQuery({
    queryKey: ["investments-business-options", user?.id ?? "guest", user?.role ?? "guest"],
    queryFn: () => resourceApi.list(myBusinessConfig),
    enabled: user?.role === "umkm",
    retry: false,
  });
  const submissionsQuery = useQuery({
    queryKey: ["investments-submission-options", user?.id ?? "guest", user?.role ?? "guest"],
    queryFn: () => resourceApi.list(submissionConfig),
    retry: false,
  });
  const ownBusinessIds = useMemo(
    () =>
      new Set(
        (myBusinessesQuery.data ?? [])
          .map((item) => Number(readPath(item, ["id"], "")))
          .filter((value) => Number.isFinite(value)),
      ),
    [myBusinessesQuery.data],
  );
  const ownSubmissions = useMemo(
    () =>
      (submissionsQuery.data ?? []).filter((item) => {
        const businessId = Number(readPath(item, ["bisnis_id", "bisnis.id"], ""));
        return Number.isFinite(businessId) && ownBusinessIds.has(businessId);
      }),
    [ownBusinessIds, submissionsQuery.data],
  );
  const submissionOptions = asOptions(ownSubmissions, [
    "bisnis.nama_bisnis",
    "bisnis.nama",
    "bisnis_nama",
    "nama",
    "bisnis_id",
  ]);
  const isOptionsLoading =
    myBusinessesQuery.isLoading || submissionsQuery.isLoading;
  const isOptionsError = myBusinessesQuery.isError || submissionsQuery.isError;
  const hasBusiness = (myBusinessesQuery.data ?? []).length > 0;
  const hasSubmissions = ownSubmissions.length > 0;
  const selectPlaceholder = isOptionsLoading
    ? language === "id"
      ? "Memuat pengajuan..."
      : "Loading submissions..."
    : language === "id"
    ? "Pilih pengajuan"
    : "Choose submission";
  const selectedPengajuanId =
    !pengajuanId || submissionOptions.some((option) => String(option.value) === pengajuanId)
      ? pengajuanId
      : "";
  const activePengajuanId =
    selectedPengajuanId || (submissionOptions[0] ? String(submissionOptions[0].value) : "");

  return (
    <div className="space-y-5">
      <label className="form-control max-w-sm">
        <span className="label-text mb-2 font-semibold">{t("Pengajuan")}</span>
        {submissionOptions.length > 0 ? (
          <select
            className="select select-bordered rounded-md bg-white"
            value={activePengajuanId}
            onChange={(event) => setPengajuanId(event.target.value)}
            disabled={isOptionsLoading}
          >
            <option value="">{selectPlaceholder}</option>
            {submissionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <select
            className="select select-bordered rounded-md bg-white"
            value=""
            disabled
          >
            <option value="">{selectPlaceholder}</option>
          </select>
        )}
      </label>
      <p className="text-xs font-semibold text-neutral/45">
        {language === "id"
          ? "Menampilkan maksimum 200 data investasi terbaru untuk pengajuan terpilih."
          : "Showing up to 200 latest investment records for the selected submission."}
      </p>
      {!activePengajuanId.trim() ? (
        <section className="space-y-3 rounded-md border border-base-300 bg-base-100 p-4">
          {isOptionsError ? (
            <div className="rounded-md border border-error/20 bg-error/5 px-3 py-2 text-sm font-semibold text-error">
              {language === "id"
                ? "Gagal memuat data pengajuan. Coba muat ulang halaman."
                : "Failed to load submission data. Please refresh the page."}
            </div>
          ) : null}
          {!isOptionsLoading && !isOptionsError && !hasBusiness ? (
            <p className="text-sm font-semibold text-neutral/65">
              {language === "id"
                ? "Belum ada bisnis aktif. Tambahkan bisnis terlebih dahulu sebelum melihat investasi per pengajuan."
                : "No active business found. Add a business first before viewing investments by submission."}
            </p>
          ) : null}
          {!isOptionsLoading && !isOptionsError && hasBusiness && !hasSubmissions ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-neutral/65">
                {language === "id"
                  ? "Belum ada pengajuan untuk bisnis kamu."
                  : "No submission found for your business yet."}
              </p>
              <Link className="btn btn-sm btn-primary rounded-md text-white" to="/dashboard/umkm/pengajuan">
                {language === "id" ? "Buka halaman pengajuan" : "Open submissions page"}
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <div className="rounded-md border border-info/20 bg-info/5 p-4 text-sm font-semibold leading-6 text-info">
            {language === "id"
              ? "Dana investasi tercatat setelah invoice investor berhasil dibayar. Tim admin akan membantu proses rekonsiliasi dan pencairan sesuai status investasi."
              : "Investment funds are recorded after the investor invoice is paid. Admin will support reconciliation and disbursement based on the investment status."}
          </div>
          <ResourcePage
            title="Investasi Pengajuan"
            description="Investasi yang tercatat untuk pengajuan bisnis tertentu."
            config={investmentByPengajuanConfig(activePengajuanId)}
            columns={investmentColumns}
            readonly
            emptyTitle="Belum ada investasi untuk pengajuan ini"
            emptyDescription="Investasi akan muncul setelah investor menyelesaikan pembayaran untuk pengajuan yang dipilih."
          />
        </>
      )}
    </div>
  );
}

export function ProfitsPage({ investor = false }: { investor?: boolean }) {
  return (
    <ResourcePage
      title="Distribusi Profit"
      description="Pantau pembagian profit per periode dan status distribusinya."
      config={investor ? investorProfitConfig : profitConfig}
      columns={profitColumns}
      fields={investor ? [] : profitFields}
      readonly={investor}
      createLabel="Update Profit"
      actions={profitActions}
      allowCreate={false}
      allowDelete={false}
      emptyTitle="Belum ada distribusi profit"
      emptyDescription="Distribusi profit akan muncul setelah laporan penjualan dan investasi tersedia."
      searchableFields={["periode", "status", "nominal_profit", (item) => readPath(item, ["penjualan.nama_bisnis", "bisnis"])]}
    />
  );
}

export function ProfitsBySalesPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const isUmkm = user?.role === "umkm";
  const [penjualanId, setPenjualanId] = useState("");
  const myBusinessesQuery = useQuery({
    queryKey: ["profit-business-options", user?.id ?? "guest", user?.role ?? "guest"],
    queryFn: () => resourceApi.list(myBusinessConfig),
    enabled: isUmkm,
    retry: false,
  });
  const submissionsQuery = useQuery({
    queryKey: ["profit-submission-options", user?.id ?? "guest", user?.role ?? "guest"],
    queryFn: () => resourceApi.list(submissionConfig),
    enabled: isUmkm,
    retry: false,
  });
  const salesQuery = useQuery({
    queryKey: ["profit-sales-options", user?.id ?? "guest", user?.role ?? "guest"],
    queryFn: () => resourceApi.list(salesConfig),
    retry: false,
  });
  const ownBusinessIds = useMemo(
    () =>
      new Set(
        (myBusinessesQuery.data ?? [])
          .map((item) => Number(readPath(item, ["id"], "")))
          .filter((value) => Number.isFinite(value)),
      ),
    [myBusinessesQuery.data],
  );
  const ownSubmissionIds = useMemo(
    () =>
      new Set(
        (submissionsQuery.data ?? [])
          .filter((item) => {
            const businessId = Number(readPath(item, ["bisnis_id", "bisnis.id"], ""));
            return Number.isFinite(businessId) && ownBusinessIds.has(businessId);
          })
          .map((item) => Number(readPath(item, ["id"], "")))
          .filter((value) => Number.isFinite(value)),
      ),
    [ownBusinessIds, submissionsQuery.data],
  );
  const salesOptions = useMemo(() => {
    const source = isUmkm
      ? (salesQuery.data ?? []).filter((item) => {
          const submissionId = Number(readPath(item, ["pengajuans_id", "pengajuan.id"], ""));
          return Number.isFinite(submissionId) && ownSubmissionIds.has(submissionId);
        })
      : salesQuery.data ?? [];

    return source.map((item) => {
      const periodLabel = textValue(readPath(item, ["periode", "period"]), "-");
      const totalLabel = currency(readPath(item, ["total_penjualan"]));
      const submissionId = textValue(readPath(item, ["pengajuans_id", "pengajuan.id"]), "-");
      return {
        value: item.id,
        label: `${periodLabel} | ${totalLabel} | #${submissionId}`,
      };
    });
  }, [isUmkm, ownSubmissionIds, salesQuery.data]);
  const isOptionsLoading =
    salesQuery.isLoading || (isUmkm && (myBusinessesQuery.isLoading || submissionsQuery.isLoading));
  const isOptionsError =
    salesQuery.isError || (isUmkm && (myBusinessesQuery.isError || submissionsQuery.isError));
  const hasBusiness = !isUmkm || (myBusinessesQuery.data ?? []).length > 0;
  const hasSubmissions = !isUmkm || ownSubmissionIds.size > 0;
  const hasSales = salesOptions.length > 0;
  const selectPlaceholder = isOptionsLoading
    ? language === "id"
      ? "Memuat laporan penjualan..."
      : "Loading sales reports..."
    : language === "id"
      ? "Pilih laporan penjualan"
      : "Choose sales report";
  const activePenjualanId =
    !penjualanId || salesOptions.some((option) => String(option.value) === penjualanId)
      ? penjualanId
      : "";

  if (!activePenjualanId.trim()) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral">{t("Profit Penjualan")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
            {t("profitBySalesPrompt")}
          </p>
        </div>
        <label className="form-control max-w-sm">
          <span className="label-text mb-2 font-semibold">{t("Penjualan")}</span>
          <select
            className="select select-bordered rounded-md bg-white"
            value={activePenjualanId}
            onChange={(event) => setPenjualanId(event.target.value)}
            disabled={isOptionsLoading || isOptionsError || !hasSales}
          >
            <option value="">{selectPlaceholder}</option>
            {salesOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {isOptionsError ? (
          <div className="rounded-md border border-error/20 bg-error/5 px-3 py-2 text-sm font-semibold text-error">
            {language === "id"
              ? "Gagal memuat laporan penjualan. Coba muat ulang halaman."
              : "Failed to load sales reports. Please refresh the page."}
          </div>
        ) : null}
        {!isOptionsLoading && !isOptionsError && !hasBusiness ? (
          <div className="rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm font-semibold text-neutral/65">
            {language === "id"
              ? "Belum ada bisnis aktif. Tambahkan bisnis terlebih dahulu."
              : "No active business found. Add a business first."}
          </div>
        ) : null}
        {!isOptionsLoading && !isOptionsError && hasBusiness && !hasSubmissions ? (
          <div className="space-y-3 rounded-md border border-base-300 bg-base-100 px-3 py-2">
            <p className="text-sm font-semibold text-neutral/65">
              {language === "id"
                ? "Belum ada pengajuan untuk bisnis kamu."
                : "No submission found for your business yet."}
            </p>
            <Link className="btn btn-sm btn-primary rounded-md text-white" to="/dashboard/umkm/pengajuan">
              {language === "id" ? "Buka halaman pengajuan" : "Open submissions page"}
            </Link>
          </div>
        ) : null}
        {!isOptionsLoading && !isOptionsError && hasSubmissions && !hasSales ? (
          <div className="space-y-3 rounded-md border border-base-300 bg-base-100 px-3 py-2">
            <p className="text-sm font-semibold text-neutral/65">
              {language === "id"
                ? "Belum ada laporan penjualan untuk pengajuan kamu."
                : "No sales report found for your submissions yet."}
            </p>
            <Link className="btn btn-sm btn-primary rounded-md text-white" to="/dashboard/umkm/penjualan">
              {language === "id" ? "Input laporan penjualan" : "Input sales report"}
            </Link>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <label className="form-control max-w-sm">
        <span className="label-text mb-2 font-semibold">{t("Penjualan")}</span>
        <select
          className="select select-bordered rounded-md bg-white"
          value={activePenjualanId}
          onChange={(event) => setPenjualanId(event.target.value)}
          disabled={isOptionsLoading}
        >
          <option value="">{selectPlaceholder}</option>
          {salesOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs font-semibold text-neutral/45">
        {language === "id"
          ? "Menampilkan maksimum 200 data distribusi terbaru untuk laporan penjualan yang dipilih."
          : "Showing up to 200 latest distribution records for the selected sales report."}
      </p>
      <ResourcePage
        title="Profit Penjualan"
        description="Distribusi profit untuk laporan penjualan yang dipilih."
        config={profitBySalesConfig(activePenjualanId)}
        columns={profitColumns}
        showTitle={false}
        showBreadcrumb={false}
        showStatusFilter={false}
        readonly
        emptyTitle="Belum ada profit untuk penjualan ini"
        emptyDescription="Distribusi profit akan muncul setelah backend membuat distribusi untuk laporan yang dipilih."
      />
    </div>
  );
}

export function ClassesPage() {
  const { user } = useAuth();
  const canMutate = user?.role === "admin" || user?.role === "superadmin";

  return (
    <ResourcePage
      title="Kelas Bisnis"
      description="Kelola kelas bisnis yang dipakai sebagai sinyal risiko dan kualitas usaha."
      config={classConfig}
      columns={classColumns}
      fields={classFields}
      createLabel="Tambah Kelas"
      allowCreate={canMutate}
      allowEdit={canMutate}
      allowDelete={canMutate}
      emptyTitle="Belum ada kelas bisnis"
      emptyDescription="Kelas bisnis dipakai untuk klasifikasi risiko dan kualitas usaha."
      searchableFields={["nama_kelas", "deskripsi"]}
    />
  );
}

const userColumns: ResourceColumn<Entity>[] = [
  { label: "Nama", render: (item) => <span className="font-black">{textValue(item.nama)}</span> },
  { label: "Email", render: (item) => textValue(item.email) },
  { label: "Role", render: (item) => textValue(readPath(item, ["role.nama_role", "role_name", "level", "role_id"])) },
  { label: "No. Telp", render: (item) => textValue(item.no_telp) },
];

const userFields: ResourceField<Entity>[] = [
  { name: "nama", label: "Nama", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "no_telp", label: "No. Telp" },
];

export function UsersPage() {
  const { user } = useAuth();
  const canMutate = user?.role === "admin" || user?.role === "superadmin";

  return (
    <ResourcePage
      title="Users"
      description="Kelola data user, role, dan informasi kontak akun platform."
      config={userManagementConfig}
      columns={userColumns}
      fields={userFields}
      createLabel="Update User"
      allowCreate={false}
      allowEdit={canMutate}
      allowDelete={false}
      emptyTitle="Belum ada user"
      emptyDescription="Data user platform akan muncul setelah akun UMKM atau investor terdaftar."
      searchableFields={["nama", "email", "no_telp", (item) => readPath(item, ["role.nama_role", "role_name", "role_id"])]}
    />
  );
}

export function AdminsPage() {
  const { user } = useAuth();
  const canMutate = user?.role === "superadmin";

  return (
    <ResourcePage
      title="Admin Management"
      description="Kelola akun admin dan superadmin untuk operasional platform."
      config={adminConfig}
      columns={adminColumns}
      fields={adminFields}
      createLabel="Tambah Admin"
      allowCreate={canMutate}
      allowEdit={canMutate}
      allowDelete={canMutate}
      emptyTitle="Belum ada admin"
      emptyDescription="Akun admin operasional akan muncul di sini."
      searchableFields={["nama", "email", "no_telp", "level"]}
    />
  );
}

export function NotificationsPage() {
  return (
    <ResourcePage
      title="Notifikasi"
      description="Kelola notifikasi operasional dan tandai status baca."
      config={notificationConfig}
      columns={notificationColumns}
      fields={[]}
      createLabel="Tambah Notifikasi"
      actions={notificationActions}
      allowCreate={false}
      allowEdit={false}
      allowDelete={false}
      emptyTitle="Belum ada notifikasi"
      emptyDescription="Notifikasi sistem dan aktivitas user akan muncul di sini."
      searchableFields={["title", "message", "type", "status"]}
    />
  );
}
