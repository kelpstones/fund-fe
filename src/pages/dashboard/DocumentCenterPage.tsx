import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  Receipt,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { dateShort } from "../../lib/format";

type DocumentMeta = {
  name: string;
  size: number;
  type: string;
  uploaded_at: string;
};

const documentRequirements = {
  umkm: [
    ["umkmLegalDoc", "umkmLegalDocBody", "required"],
    ["umkmProposalDoc", "umkmProposalDocBody", "required"],
    ["umkmSalesDoc", "umkmSalesDocBody", "recommended"],
    ["umkmBankDoc", "umkmBankDocBody", "recommended"],
  ],
  investor: [
    ["investorIdentityDoc", "investorIdentityDocBody", "required"],
    ["investorPaymentDoc", "investorPaymentDocBody", "required"],
    ["investorAgreementDoc", "investorAgreementDocBody", "recommended"],
    ["investorPortfolioDoc", "investorPortfolioDocBody", "recommended"],
  ],
} as const;

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

export function DocumentCenterPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const role = user?.role === "investor" ? "investor" : "umkm";
  const requirements = documentRequirements[role];
  const [documents, setDocuments] = useState<Record<string, DocumentMeta>>(() => readDocuments(role));
  const uploadedCount = requirements.filter(([key]) => documents[key]).length;
  const progress = Math.round((uploadedCount / requirements.length) * 100);

  const summaryCards = useMemo<Array<[string, string, LucideIcon]>>(
    () => [
      ["documentUploaded", `${uploadedCount}/${requirements.length}`, CheckCircle2],
      ["documentRequired", String(requirements.filter(([, , status]) => status === "required").length), ShieldCheck],
      ["documentLocalMode", "FE", FileText],
    ],
    [requirements, uploadedCount],
  );

  const upload = (key: string, file: File | null) => {
    if (!file) return;
    const next = {
      ...documents,
      [key]: {
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
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral/60">
              {role === "investor" ? t("documentCenterInvestorBody") : t("documentCenterUmkmBody")}
            </p>
          </div>
          <div className="min-w-56">
            <div className="mb-2 flex justify-between text-xs font-black text-neutral/55">
              <span>{t("documentCompleteness")}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-base-200">
              <div className="h-3 rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map(([label, value, Icon]) => (
          <article key={label} className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
            <Icon className="text-primary" size={24} />
            <p className="mt-4 text-sm font-bold text-neutral/50">{t(String(label))}</p>
            <p className="mt-1 text-2xl font-black">{String(value)}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {requirements.map(([key, title, status]) => {
            const document = documents[key];
            return (
              <article key={key} className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-md ${document ? "bg-success text-white" : "bg-base-200 text-primary"}`}>
                      {document ? <CheckCircle2 size={22} /> : <FileText size={22} />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">{t(key)}</h3>
                        <span className={`badge ${status === "required" ? "badge-warning" : "badge-info"} text-white`}>
                          {t(status)}
                        </span>
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">{t(title)}</p>
                      {document ? (
                        <div className="mt-4 rounded-md bg-base-200 p-3 text-sm">
                          <p className="font-black">{document.name}</p>
                          <p className="mt-1 text-neutral/55">
                            {formatSize(document.size)} - {dateShort(document.uploaded_at)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <label className="btn btn-primary rounded-md text-white">
                      <UploadCloud size={17} />
                      {document ? t("replace") : t("upload")}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(event) => upload(key, event.target.files?.[0] ?? null)}
                      />
                    </label>
                    {document ? (
                      <button className="btn btn-outline rounded-md" onClick={() => remove(key)}>
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

        <aside className="grid content-start gap-5">
          <div className="rounded-md border border-info/20 bg-info/10 p-5 text-info">
            <ShieldCheck size={24} />
            <h3 className="mt-4 font-black">{t("documentLocalNoticeTitle")}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 opacity-80">{t("documentLocalNoticeBody")}</p>
          </div>
          <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
            <Receipt className="text-primary" size={24} />
            <h3 className="mt-4 font-black">{t("documentConnectedFlowTitle")}</h3>
            <div className="mt-4 grid gap-3">
              {["documentFlowInvoice", "documentFlowPayment", "documentFlowContract", "documentFlowProfit"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md bg-base-200 p-3">
                  <Download className="text-primary" size={17} />
                  <span className="text-sm font-semibold">{t(item)}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
