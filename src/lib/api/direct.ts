import { apiClient, unwrap } from "./client";
import axios from "axios";

export const directApi = {
  async get(path: string, fallback: unknown = null) {
    try {
      const response = await apiClient.get(path);
      return unwrap<unknown>(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) throw error;
      return fallback;
    }
  },

  async post(path: string, body?: Record<string, unknown>, fallback: unknown = null) {
    try {
      const response = await apiClient.post(path, body);
      return unwrap<unknown>(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) throw error;
      return fallback;
    }
  },

  async put(path: string, body?: Record<string, unknown>, fallback: unknown = null) {
    try {
      const response = await apiClient.put(path, body);
      return unwrap<unknown>(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) throw error;
      return fallback;
    }
  },

  async del(path: string, fallback: unknown = null) {
    try {
      const response = await apiClient.delete(path);
      return unwrap<unknown>(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) throw error;
      return fallback;
    }
  },
};
