import { apiClient, unwrap } from "./client";

export const directApi = {
  async get(path: string, fallback: unknown = null) {
    try {
      const response = await apiClient.get(path);
      return unwrap<unknown>(response.data);
    } catch {
      return fallback;
    }
  },

  async post(path: string, body?: Record<string, unknown>, fallback: unknown = null) {
    try {
      const response = await apiClient.post(path, body);
      return unwrap<unknown>(response.data);
    } catch {
      return fallback;
    }
  },

  async put(path: string, body?: Record<string, unknown>, fallback: unknown = null) {
    try {
      const response = await apiClient.put(path, body);
      return unwrap<unknown>(response.data);
    } catch {
      return fallback;
    }
  },

  async del(path: string, fallback: unknown = null) {
    try {
      const response = await apiClient.delete(path);
      return unwrap<unknown>(response.data);
    } catch {
      return fallback;
    }
  },
};
