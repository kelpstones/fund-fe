import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { apiErrorMessage, dateShort } from "../../lib/format";
import { apiClient, unwrap } from "../../lib/api/client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useToast } from "../../components/ToastProvider";
import { DashboardBreadcrumb } from "../../components/DashboardBreadcrumb";

type DocumentMeta = {
  name: string;
  size: number;
  type: string;
  uploaded_at: string;
};

type BackendDocument = {
  id: number;
  bisnis_id: number;
  jenis_dokumen: string;
  nama_dokumen: string;
  file_url: string;
  status: "pending" | "valid" | "invalid";
  catatan?: string | null;
  created_at?: string;
  updated_at?: string;
};

type BackendKelengkapan = {
  total?: number;
  sudah_upload?: number;
  belum_upload?: string[];
  persen?: number;
};

type Requirement = {
  key: string;
  title: { id: string; en: string };
  body: { id: string; en: string };
  status: "required" | "recommended";
  backend?: {
    jenis_dokumen: string;
    nama_dokumen: string;
  };
};

const umkmRequirements: Requirement[] = [
  {
    key: "doc-ktp",
    title: { id: "KTP Pemilik", en: "Owner ID Card" },
    body: {
      id: "Dokumen identitas pemilik usaha untuk validasi legalitas dasar.",
      en: "Owner identity document for basic legality validation.",
    },
    status: "required",
    backend: { jenis_dokumen: "legalitas_usaha", nama_dokumen: "KTP Pemilik" },
  },
  {
    key: "doc-nib",
    title: { id: "NIB", en: "NIB" },
    body: {
      id: "Nomor Induk Berusaha sebagai legalitas utama usaha.",
      en: "Business Identification Number as the primary business legality.",
    },
    status: "required",
    backend: { jenis_dokumen: "legalitas_usaha", nama_dokumen: "NIB" },
  },
  {
    key: "doc-npwp",
    title: { id: "NPWP", en: "Tax ID (NPWP)" },
    body: {
      id: "Dokumen perpajakan untuk memperkuat kepercayaan investor.",
      en: "Tax document to strengthen investor confidence.",
    },
    status: "recommended",
    backend: { jenis_dokumen: "legalitas_usaha", nama_dokumen: "NPWP" },
  },
  {
    key: "doc-proposal",
    title: { id: "Proposal Bisnis", en: "Business Proposal" },
    body: {
      id: "Ringkasan kebutuhan modal, rencana penggunaan dana, dan target pertumbuhan.",
      en: "Summary of funding needs, fund usage plan, and growth targets.",
    },
    status: "required",
    backend: { jenis_dokumen: "proposal_pendanaan", nama_dokumen: "Proposal Bisnis" },
  },
  {
    key: "doc-finance",
    title: { id: "Laporan Keuangan", en: "Financial Statement" },
    body: {
      id: "Dokumen dasar untuk melihat performa bisnis saat ini.",
      en: "Core document to review current business performance.",
    },
    status: "required",
    backend: { jenis_dokumen: "laporan_penjualan", nama_dokumen: "Laporan Keuangan" },
  },
  {
    key: "doc-monthly",
    title: { id: "Laporan Omset Bulanan", en: "Monthly Revenue Report" },
    body: {
      id: "Data omset bulanan untuk membaca tren operasional.",
      en: "Monthly revenue data to read operational trends.",
    },
    status: "required",
    backend: { jenis_dokumen: "laporan_penjualan", nama_dokumen: "Laporan Omset Bulanan" },
  },
  {
    key: "doc-yearly",
    title: { id: "Laporan Omset Tahunan", en: "Yearly Revenue Report" },
    body: {
      id: "Ringkasan performa tahunan sebagai sinyal stabilitas bisnis.",
      en: "Yearly performance summary as a business stability signal.",
    },
    status: "required",
    backend: { jenis_dokumen: "laporan_penjualan", nama_dokumen: "Laporan Omset Tahunan" },
  },
];

const investorRequirements: Requirement[] = [
  {
    key: "investorIdentityDoc",
    title: { id: "Identitas investor", en: "Investor identity" },
    body: {
      id: "Dokumen identitas untuk verifikasi akun investor.",
      en: "Identity document for investor account verification.",
    },
    status: "required",
  },
  {
    key: "investorPaymentDoc",
    title: { id: "Bukti pembayaran", en: "Payment proof" },
    body: {
      id: "Bukti transfer atau pembayaran invoice investasi.",
      en: "Transfer proof or payment record for investment invoices.",
    },
    status: "required",
  },
  {
    key: "investorAgreementDoc",
    title: { id: "Ringkasan agreement", en: "Agreement summary" },
    body: {
      id: "Ringkasan nominal, return, dan poin negosiasi utama.",
      en: "Summary of nominal, return, and key negotiation points.",
    },
    status: "recommended",
  },
  {
    key: "investorPortfolioDoc",
    title: { id: "Laporan portfolio", en: "Portfolio statement" },
    body: {
      id: "Ringkasan investasi aktif dan distribusi profit yang diterima.",
      en: "Summary of active investments and received profit distributions.",
    },
    status: "recommended",
  },
];

const storageKeyFor = (role: "umkm" | "investor") => `fundraise_document_center_${role}`;

const readDocuments = (role: "umkm" | "investor") => {
  try {
    const raw = localStorage.getItem(storageKeyFor(role));
    return raw ? (JSON.parse(raw) as Record<string, DocumentMeta>) : {};
  } catch {
    return {};
  }
};

const writeDocuments = (role: "umkm" | "investor", documents: Record<string, DocumentMeta>) => {
  localStorage.setItem(storageKeyFor(role), JSON.stringify(documents));
};

const formatSize = (size: number) => {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);
const allowedExtensions = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
];
const acceptedFileInputValue = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv";

const normalizeDocName = (value: unknown) => String(value ?? "").trim().toLowerCase();

const toTimestamp = (value: unknown) => {
  const time = new Date(String(value ?? "")).getTime();
  return Number.isFinite(time) ? time : 0;
};

const clampProgress = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const localizedText = (
  item: Requirement["title"] | Requirement["body"],
  language: "id" | "en",
) => item[language];

const backendStatusLabel = (
  status: BackendDocument["status"] | string,
  language: "id" | "en",
) => {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "pending") return language === "id" ? "Menunggu" : "Pending";
  if (normalized === "valid") return language === "id" ? "Valid" : "Valid";
  if (normalized === "invalid") return language === "id" ? "Perlu perbaikan" : "Needs revision";
  return language === "id" ? "Diproses" : "Processing";
};

export function DocumentCenterPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const role = user?.role === "investor" ? "investor" : "umkm";
  const isUmkm = role === "umkm";
  const requirements = isUmkm ? umkmRequirements : investorRequirements;
  const [documents, setDocuments] = useState<Record<string, DocumentMeta>>(() => readDocuments(role));
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);

  const backendQuery = useQuery({
    queryKey: ["document-center", "backend", role],
    queryFn: async () => {
      const response = await apiClient.get("/businesses/documents");
      const payload = unwrap<unknown>(response.data);
      const objectPayload =
        payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

      return {
        dokumen: Array.isArray(objectPayload.dokumen)
          ? (objectPayload.dokumen as BackendDocument[])
          : [],
        kelengkapan:
          objectPayload.kelengkapan && typeof objectPayload.kelengkapan === "object"
            ? (objectPayload.kelengkapan as BackendKelengkapan)
            : undefined,
      };
    },
    enabled: isUmkm,
    retry: false,
  });

  const uploadBackendMutation = useMutation({
    mutationFn: async (params: { requirement: Requirement; file: File }) => {
      if (!params.requirement.backend) {
        throw new Error("Backend mapping is missing for this document.");
      }
      const formData = new FormData();
      formData.append("jenis_dokumen", params.requirement.backend.jenis_dokumen);
      formData.append("nama_list", JSON.stringify([params.requirement.backend.nama_dokumen]));
      formData.append("files", params.file);

      const response = await apiClient.post("/businesses/documents", formData);
      return unwrap<unknown>(response.data);
    },
    onSuccess: async () => {
      toast.success(language === "id" ? "Dokumen berhasil diupload." : "Document uploaded successfully.");
      await queryClient.invalidateQueries({ queryKey: ["document-center", "backend"] });
    },
    onError: (error) => {
      toast.error(
        apiErrorMessage(
          error,
          language === "id" ? "Upload dokumen gagal." : "Failed to upload document.",
        ),
      );
    },
  });
  const uploadingRequirementKey =
    uploadBackendMutation.isPending && uploadBackendMutation.variables
      ? uploadBackendMutation.variables.requirement.key
      : null;

  const backendDocuments = backendQuery.data?.dokumen;
  const backendByDocName = useMemo(
    () => {
      const docs = [...(backendDocuments ?? [])].sort(
        (a, b) =>
          toTimestamp(b.updated_at ?? b.created_at) -
          toTimestamp(a.updated_at ?? a.created_at),
      );
      const map = new Map<string, BackendDocument>();
      for (const item of docs) {
        const key = normalizeDocName(item.nama_dokumen);
        if (!key || map.has(key)) continue;
        map.set(key, item);
      }
      return map;
    },
    [backendDocuments],
  );

  const progressEligibleStatuses = new Set(["valid", "pending"]);
  const completedCount = isUmkm
    ? requirements.filter((item) => {
        if (!item.backend) return false;
        const document = backendByDocName.get(normalizeDocName(item.backend.nama_dokumen));
        if (!document) return false;
        return progressEligibleStatuses.has(String(document.status ?? "").toLowerCase());
      }).length
    : requirements.filter((item) => documents[item.key]).length;

  const progress = clampProgress(
    Math.round((completedCount / Math.max(requirements.length, 1)) * 100),
  );

  const validateUploadFile = (file: File) => {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return language === "id"
        ? "Ukuran file maksimal 10 MB."
        : "Maximum file size is 10 MB.";
    }
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((extension) =>
      lowerName.endsWith(extension),
    );
    const hasAllowedMime = !file.type || allowedMimeTypes.has(file.type);
    if (!hasAllowedMime && !hasAllowedExtension) {
      return language === "id"
        ? "Format file tidak didukung. Gunakan PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX, atau CSV."
        : "Unsupported file format. Use PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX, or CSV.";
    }
    return null;
  };

  const upload = (requirement: Requirement, file: File | null) => {
    if (!file) return;
    const validationMessage = validateUploadFile(file);
    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }
    if (isUmkm) {
      uploadBackendMutation.mutate({ requirement, file });
      return;
    }

    const next = {
      ...documents,
      [requirement.key]: {
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        uploaded_at: new Date().toISOString(),
      },
    };
    setDocuments(next);
    writeDocuments(role, next);
  };

  const remove = (key: string) => {
    const next = { ...documents };
    delete next[key];
    setDocuments(next);
    writeDocuments(role, next);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-normal text-neutral">{t("documentCenterTitle")}</h2>
            <DashboardBreadcrumb />
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral/60">
              {role === "investor"
                ? t("documentCenterInvestorBody")
                : language === "id"
                  ? "Dokumen UMKM sekarang terhubung ke backend. Upload akan langsung dikirim untuk proses review admin."
                  : "UMKM documents are now connected to backend. Uploads are sent directly for admin review."}
            </p>
          </div>
          <div className="min-w-56">
            <div className="mb-2 flex justify-between text-xs font-black text-neutral/55">
              <span>{t("documentCompleteness")}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-base-200">
              <div
                className="h-3 rounded-full bg-primary transition-[width] duration-[420ms] ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {isUmkm && backendQuery.isError ? (
          <div className="rounded-md border border-error/20 bg-error/5 px-4 py-3 text-sm font-semibold text-error">
            {apiErrorMessage(
              backendQuery.error,
              language === "id"
                ? "Gagal memuat data dokumen backend. Coba muat ulang halaman."
                : "Failed to load backend documents. Please refresh the page.",
            )}
          </div>
        ) : null}
        {requirements.map((requirement) => {
          const document = documents[requirement.key];
          const backendDocument = requirement.backend
            ? backendByDocName.get(normalizeDocName(requirement.backend.nama_dokumen))
            : undefined;
          const status = requirement.status;
          const canRemove = !isUmkm && Boolean(document);
          const isPending = backendDocument?.status === "pending";
          const isValid = backendDocument?.status === "valid";
          const isInvalid = backendDocument?.status === "invalid";
          const isUploading = uploadingRequirementKey === requirement.key;
          const fileName = isUmkm ? backendDocument?.nama_dokumen : document?.name;
          const uploadDate = isUmkm
            ? backendDocument?.updated_at || backendDocument?.created_at
            : document?.uploaded_at;
          const fileSize = isUmkm ? null : document?.size;

          return (
            <article
              key={requirement.key}
              className={`rounded-md border bg-white p-5 shadow-sm transition-colors ${
                isUploading ? "border-primary/40" : "border-base-300"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-md ${
                      (isUmkm && backendDocument) || (!isUmkm && document)
                        ? "bg-success text-white"
                        : "bg-base-200 text-primary"
                    }`}
                  >
                    {(isUmkm && backendDocument) || (!isUmkm && document) ? (
                      <CheckCircle2 size={22} />
                    ) : (
                      <FileText size={22} />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{localizedText(requirement.title, language)}</h3>
                      <span
                        className={`badge ${status === "required" ? "badge-warning" : "badge-info"} text-white`}
                      >
                        {t(status)}
                      </span>
                      {isUmkm && backendDocument ? (
                        <span
                          className={`badge text-white ${
                            isValid
                              ? "badge-success"
                              : isInvalid
                                ? "badge-error"
                                : "badge-warning"
                          }`}
                        >
                          {backendStatusLabel(backendDocument.status, language)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
                      {localizedText(requirement.body, language)}
                    </p>
                    {isUmkm && isPending ? (
                      <p className="mt-2 text-xs font-semibold text-warning">
                        {language === "id" ? "Menunggu review admin" : "Waiting for admin review"}
                      </p>
                    ) : null}
                    {fileName ? (
                      <div className="mt-4 rounded-md bg-base-200 p-3 text-sm">
                        <p className="font-black">{fileName}</p>
                        <p className="mt-1 text-neutral/55">
                          {fileSize ? `${formatSize(fileSize)} - ` : ""}
                          {uploadDate ? dateShort(uploadDate) : "-"}
                        </p>
                        {isUmkm && backendDocument?.catatan ? (
                          <p className="mt-2 text-xs font-semibold text-error">
                            {backendDocument.catatan}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <label className="btn btn-primary rounded-md text-white">
                    {isUploading ? <Loader2 className="animate-spin" size={17} /> : <UploadCloud size={17} />}
                    {isUploading
                      ? t("uploading")
                      : (isUmkm ? backendDocument : document)
                        ? t("replace")
                        : t("upload")}
                    <input
                      type="file"
                      className="hidden"
                      accept={acceptedFileInputValue}
                      onChange={(event) => {
                        upload(requirement, event.target.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                      disabled={uploadBackendMutation.isPending}
                    />
                  </label>
                  {isUploading ? (
                    <span className="self-center text-xs font-semibold text-info">
                      {t("uploading")}
                    </span>
                  ) : null}
                  {isUmkm && backendDocument?.file_url ? (
                    <a
                      className="btn btn-outline rounded-md"
                      href={backendDocument.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Eye size={17} />
                      {language === "id" ? "Buka" : "Open"}
                    </a>
                  ) : null}
                  {canRemove ? (
                    <button
                      className="btn btn-outline rounded-md"
                      onClick={() => setPendingDeleteKey(requirement.key)}
                    >
                      <Trash2 size={17} />
                      {t("delete")}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <ConfirmDialog
        open={!isUmkm && Boolean(pendingDeleteKey)}
        title={t("deleteDataTitle")}
        message={t("deleteDataMessage")}
        confirmLabel={t("delete")}
        confirmTone="danger"
        onCancel={() => setPendingDeleteKey(null)}
        onConfirm={() => {
          if (pendingDeleteKey) remove(pendingDeleteKey);
          setPendingDeleteKey(null);
        }}
      />
    </section>
  );
}
