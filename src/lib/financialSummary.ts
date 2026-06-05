export type FinancialSummaryPayload = {
  net_profit_margin: number;
  kepuasan_pelanggan: number;
  peak_hour_latency: string;
  review_volatility: number;
  repeat_order_rate: number;
  digital_adoption_score: number;
  year_revenue: number;
  business_tenure_years: number;
};

const defaultModelUrl = "https://krzpztrk-api-model-fundraise-v3.hf.space";
const requestTimeoutMs = 60_000;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");

const stripHtml = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "");

const summaryHeadings: Record<string, string> = {
  "ringkasan performa": "Ringkasan performa",
  "analisis kesehatan & keunggulan": "Kesehatan dan keunggulan",
  "analisis kesehatan dan keunggulan": "Kesehatan dan keunggulan",
  "kesehatan & keunggulan": "Kesehatan dan keunggulan",
  "kesehatan dan keunggulan": "Kesehatan dan keunggulan",
  "analisis risiko": "Catatan risiko",
  "catatan risiko": "Catatan risiko",
  "peluang pertumbuhan": "Peluang pertumbuhan",
  "rekomendasi": "Rekomendasi",
};

const genericIntroPattern =
  /^(berikut\s+(?:adalah\s+)?(?:analisis|ringkasan)[\w\s-]*(?:untuk\s+investor|bisnis|umkm)?\s*:|here(?:'s| is)\s+(?:a\s+)?(?:brief\s+)?(?:analysis|summary)[\w\s-]*:?)$/i;

const normalizeSummaryLine = (rawLine: string) => {
  const line = rawLine
    .trim()
    .replace(/^\s*[-*]\s+/, "")
    .replace(/\s+/g, " ");

  if (!line || genericIntroPattern.test(line)) return "";

  const headingKey = line.replace(/:$/, "").trim().toLowerCase();
  if (summaryHeadings[headingKey]) return summaryHeadings[headingKey];

  return line
    .replace(/^Status Kesehatan\s*:/i, "Status kesehatan:")
    .replace(/^Keunggulan Utama\s*:/i, "Keunggulan utama:")
    .replace(/^Risiko Utama\s*:/i, "Risiko utama:")
    .replace(/^Rekomendasi Investor\s*:/i, "Rekomendasi investor:");
};

const cleanSummaryText = (value: string) => {
  const cleaned = decodeHtmlEntities(stripHtml(value))
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*+/g, "")
    .replace(/_{2,}/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  const lines: string[] = [];

  for (const rawLine of cleaned.split(/\r?\n/)) {
    const line = normalizeSummaryLine(rawLine);
    if (!line) continue;

    const isHeading = Object.values(summaryHeadings).includes(line);
    if (isHeading && lines.length && lines[lines.length - 1] !== "") {
      lines.push("");
    }

    lines.push(line);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const extractSummary = (payload: unknown): string => {
  if (typeof payload === "string") return cleanSummaryText(payload);
  if (!isRecord(payload)) return "";

  const summary = payload.summary ?? payload.result ?? payload.response ?? payload.message;
  if (typeof summary === "string") return cleanSummaryText(summary);
  return "";
};

const fetchWithTimeout = async (url: string, init: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const readErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as unknown;
    const summary = extractSummary(payload);
    if (summary) return summary;
    if (isRecord(payload) && typeof payload.detail === "string") return payload.detail;
  } catch {
    // Fall through to status text.
  }

  return response.statusText || `Request failed with status ${response.status}`;
};

export const generateFinancialSummary = async (payload: FinancialSummaryPayload) => {
  const baseUrl = trimTrailingSlash(
    (import.meta.env.VITE_ML_MODEL_URL ?? defaultModelUrl).trim() || defaultModelUrl,
  );
  const response = await fetchWithTimeout(`${baseUrl}/generate-financial-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const responsePayload = (await response.json()) as unknown;
  const summary = extractSummary(responsePayload);
  if (!summary) throw new Error("Financial summary returned an empty response.");
  return summary;
};
