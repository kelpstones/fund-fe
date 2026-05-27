import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CheckCircle2,
  Download,
  FileText,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { dateShort } from "../../lib/format";
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

const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return String(error.response.data.message);
  }
  return fallback;
};

const localizedText = (
  item: Requirement["title"] | Requirement["body"],
  language: "id" | "en",
) => item[language];

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

  const backendDocuments = backendQuery.data?.dokumen;
  const backendByDocName = useMemo(
    () => new Map((backendDocuments ?? []).map((item) => [item.nama_dokumen, item])),
    [backendDocuments],
  );

  const uploadedCount = isUmkm
    ? requirements.filter((item) => item.backend && backendByDocName.has(item.backend.nama_dokumen)).length
    : requirements.filter((item) => documents[item.key]).length;

  const progress = isUmkm
    ? Number(
        backendQuery.data?.kelengkapan?.persen ??
          Math.round((uploadedCount / Math.max(requirements.length, 1)) * 100),
      )
    : Math.round((uploadedCount / Math.max(requirements.length, 1)) * 100);

  const upload = (requirement: Requirement, file: File | null) => {
    if (!file) return;
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
        {requirements.map((requirement) => {
          const document = documents[requirement.key];
          const backendDocument = requirement.backend
            ? backendByDocName.get(requirement.backend.nama_dokumen)
            : undefined;
          const status = requirement.status;
          const canRemove = !isUmkm && Boolean(document);
          const isPending = backendDocument?.status === "pending";
          const isValid = backendDocument?.status === "valid";
          const isInvalid = backendDocument?.status === "invalid";
          const fileName = isUmkm ? backendDocument?.nama_dokumen : document?.name;
          const uploadDate = isUmkm
            ? backendDocument?.updated_at || backendDocument?.created_at
            : document?.uploaded_at;
          const fileSize = isUmkm ? null : document?.size;

          return (
            <article key={requirement.key} className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
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
                          {backendDocument.status}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">
                      {localizedText(requirement.body, language)}
                    </p>
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
                    <UploadCloud size={17} />
                    {(isUmkm ? backendDocument : document) ? t("replace") : t("upload")}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) => upload(requirement, event.target.files?.[0] ?? null)}
                      disabled={uploadBackendMutation.isPending}
                    />
                  </label>
                  {isUmkm && backendDocument?.file_url ? (
                    <a
                      className="btn btn-outline rounded-md"
                      href={backendDocument.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={17} />
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
                  {isUmkm && isPending ? (
                    <span className="self-center text-xs font-semibold text-warning">
                      {language === "id" ? "Menunggu review admin" : "Waiting for admin review"}
                    </span>
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
