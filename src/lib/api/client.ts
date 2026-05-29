import axios from "axios";
import type { ApiEnvelope } from "../../types";

const apiKey = import.meta.env.VITE_API_KEY || "";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const userKey = "fundraise_user";
const tokenKey = "fundraise_token";
const refreshTokenKey = "fundraise_refresh_token";

export const authSessionExpiredEvent = "fundraise:session-expired";
export const authSessionRefreshedEvent = "fundraise:session-refreshed";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 12_000,
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 12_000,
});

type RetriableRequestConfig = NonNullable<Parameters<typeof apiClient.request>[0]> & {
  _retry?: boolean;
};

let refreshPromise: Promise<string> | null = null;

const setAuthHeader = (config: RetriableRequestConfig, token: string) => {
  const value = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  if (config.headers && "set" in config.headers && typeof config.headers.set === "function") {
    config.headers.set("Authorization", value);
    return;
  }

  config.headers = {
    ...config.headers,
    Authorization: value,
  };
};

apiClient.interceptors.request.use((config) => {
  config.headers.set("x-api-key", apiKey);

  const token = localStorage.getItem("fundraise_token");
  if (token) {
    config.headers.set(
      "Authorization",
      token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    );
  }

  return config;
});

refreshClient.interceptors.request.use((config) => {
  config.headers.set("x-api-key", apiKey);
  return config;
});

const clearStoredSession = () => {
  localStorage.removeItem(userKey);
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(refreshTokenKey);
};

const storedUserRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem(userKey) || "{}") as {
      role?: string;
      level?: string;
    };
    return String(user.role || user.level || "");
  } catch {
    return "";
  }
};

const isAuthPath = (url?: string) =>
  Boolean(url && ["/user/login", "/admin/login", "/user/register"].some((path) => url.includes(path)));

const isRefreshPath = (url?: string) =>
  Boolean(url && ["/user/refresh", "/admin/refresh"].some((path) => url.includes(path)));

const isLogoutPath = (url?: string) =>
  Boolean(url && ["/user/logout", "/admin/logout"].some((path) => url.includes(path)));

const shouldHandleUnauthorized = (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) return false;
  const url = error.config?.url;
  if (isAuthPath(url) || isLogoutPath(url)) return false;
  const message = String(error.response.data?.message || "").toLowerCase();
  if (message.includes("api key")) return false;
  return Boolean(localStorage.getItem(tokenKey) || localStorage.getItem(refreshTokenKey));
};

const dispatchExpiredSession = () => {
  clearStoredSession();
  window.dispatchEvent(new CustomEvent(authSessionExpiredEvent));
};

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const activeRefreshToken = localStorage.getItem(refreshTokenKey);
    if (!activeRefreshToken) {
      dispatchExpiredSession();
      throw new Error("Missing refresh token");
    }

    try {
      const role = storedUserRole();
      const refreshPath = role === "admin" || role === "superadmin" ? "/admin/refresh" : "/user/refresh";
      const response = await refreshClient.post(refreshPath, { refreshToken: activeRefreshToken });
      const {
        data,
        token,
        refreshToken,
      } = unwrapToken<Record<string, unknown>>(response.data);

      if (!token) throw new Error("Refresh response does not include token");
      localStorage.setItem(tokenKey, token);
      if (refreshToken) {
        localStorage.setItem(refreshTokenKey, refreshToken);
      }
      window.dispatchEvent(
        new CustomEvent(authSessionRefreshedEvent, {
          detail: { user: data, token, refreshToken: refreshToken ?? activeRefreshToken },
        }),
      );
      return token;
    } catch (refreshError) {
      dispatchExpiredSession();
      throw refreshError;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!shouldHandleUnauthorized(error)) throw error;

    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (!originalRequest || originalRequest._retry || isRefreshPath(originalRequest.url)) {
      dispatchExpiredSession();
      throw error;
    }

    originalRequest._retry = true;
    const nextToken = await refreshAccessToken();
    setAuthHeader(originalRequest, nextToken);
    return apiClient.request(originalRequest);
  },
);

export const unwrap = <T>(payload: ApiEnvelope<T> | T): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as ApiEnvelope<T>).data !== undefined
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

export const unwrapToken = <T>(payload: ApiEnvelope<T>) => ({
  data: unwrap<T>(payload),
  token: payload.accessToken ?? payload.token,
  refreshToken: payload.refreshToken,
});
