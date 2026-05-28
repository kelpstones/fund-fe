import axios from "axios";
import type { ApiEnvelope } from "../../types";

const apiKey = import.meta.env.VITE_API_KEY || "";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  timeout: 12_000,
});

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
