export type AdvisorMessage = {
  role: "user" | "assistant";
  content: string;
};

type AdvisorPayload = {
  message: string;
  history: AdvisorMessage[];
  context?: Record<string, unknown>;
};

const requestTimeoutMs = 45_000;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const normalizeApiName = (value: string) => value.replace(/^\/+/, "") || "predict";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const extractText = (payload: unknown): string => {
  if (typeof payload === "string") return payload.trim();
  if (typeof payload === "number" || typeof payload === "boolean") return String(payload);

  if (Array.isArray(payload)) {
    return payload
      .map((item) => extractText(item))
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  if (!isRecord(payload)) return "";

  const priorityKeys = [
    "answer",
    "reply",
    "response",
    "message",
    "output",
    "result",
    "text",
    "content",
    "prediction",
    "data",
  ];

  for (const key of priorityKeys) {
    const text = extractText(payload[key]);
    if (text) return text;
  }

  const choices = payload.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const firstChoice = choices[0];
    if (isRecord(firstChoice)) {
      const message = firstChoice.message;
      if (isRecord(message)) {
        const text = extractText(message.content);
        if (text) return text;
      }
      const text = extractText(firstChoice.text);
      if (text) return text;
    }
  }

  return "";
};

const cleanAdvisorText = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/\*+/g, "")
    .replace(/_{2,}/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const parseGradioEventStream = (streamText: string): unknown => {
  const lines = streamText.split(/\r?\n/);
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  for (let index = dataLines.length - 1; index >= 0; index -= 1) {
    const raw = dataLines[index];
    if (!raw || raw === "null" || raw === "[DONE]") continue;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }

  return streamText;
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
    const message = extractText(payload);
    if (message) return message;
  } catch {
    // Fall through to status text.
  }

  return response.statusText || `Request failed with status ${response.status}`;
};

const callJsonAdvisor = async (endpointUrl: string, payload: AdvisorPayload) => {
  const response = await fetchWithTimeout(endpointUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: payload.message,
      question: payload.message,
      prompt: payload.message,
      history: payload.history,
      context: payload.context,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const responsePayload = (await response.json()) as unknown;
  const answer = cleanAdvisorText(extractText(responsePayload));
  if (!answer) throw new Error("AI advisor returned an empty response.");
  return answer;
};

const callGradioAdvisor = async (
  baseUrl: string,
  apiName: string,
  payload: AdvisorPayload,
) => {
  const normalizedBase = trimTrailingSlash(baseUrl.replace(/\/gradio_api\/?.*$/, ""));
  const normalizedApiName = normalizeApiName(apiName);
  const callUrl = `${normalizedBase}/gradio_api/call/${normalizedApiName}`;

  const submitResponse = await fetchWithTimeout(callUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [payload.message] }),
  });

  if (!submitResponse.ok) {
    throw new Error(await readErrorMessage(submitResponse));
  }

  const submitPayload = (await submitResponse.json()) as unknown;
  const eventId = isRecord(submitPayload) ? String(submitPayload.event_id ?? "") : "";
  if (!eventId) throw new Error("AI advisor did not return an event id.");

  const resultResponse = await fetchWithTimeout(`${callUrl}/${encodeURIComponent(eventId)}`, {
    method: "GET",
    headers: { Accept: "text/event-stream, application/json, text/plain" },
  });

  if (!resultResponse.ok) {
    throw new Error(await readErrorMessage(resultResponse));
  }

  const streamText = await resultResponse.text();
  const answer = cleanAdvisorText(extractText(parseGradioEventStream(streamText)));
  if (!answer) throw new Error("AI advisor returned an empty response.");
  return answer;
};

export const advisorConfig = {
  url: (import.meta.env.VITE_AI_ADVISOR_URL ?? "").trim(),
  mode: (import.meta.env.VITE_AI_ADVISOR_MODE ?? "auto").trim().toLowerCase(),
  apiName: (import.meta.env.VITE_AI_ADVISOR_API_NAME ?? "predict").trim(),
};

export const askAiAdvisor = async (payload: AdvisorPayload) => {
  if (!advisorConfig.url) {
    throw new Error("AI advisor URL is not configured.");
  }

  const jsonEndpoints = [
    advisorConfig.url,
    `${trimTrailingSlash(advisorConfig.url)}/chat`,
  ].filter((endpoint, index, endpoints) => endpoint && endpoints.indexOf(endpoint) === index);

  const shouldUseGradio =
    advisorConfig.mode === "gradio" ||
    advisorConfig.url.includes("/gradio_api/") ||
    (advisorConfig.mode === "auto" && advisorConfig.url.includes(".hf.space"));

  if (advisorConfig.mode === "json" || advisorConfig.mode === "auto" || !shouldUseGradio) {
    let jsonError: unknown;
    for (const endpoint of jsonEndpoints) {
      try {
        return await callJsonAdvisor(endpoint, payload);
      } catch (error) {
        jsonError = error;
      }
    }

    if (advisorConfig.mode !== "auto" || !shouldUseGradio) {
      throw jsonError;
    }
  }

  return callGradioAdvisor(advisorConfig.url, advisorConfig.apiName, payload);
};
