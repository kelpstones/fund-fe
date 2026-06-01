import type { Entity, ResourceConfig } from "../../types";
import { apiClient, unwrap } from "./client";
import axios from "axios";

export const pathFrom = <T extends Entity>(
  path: string | ((item: Partial<T> | T) => string) | undefined,
  item: Partial<T> | T,
) => {
  if (!path) return undefined;
  return typeof path === "function" ? path(item) : path.replace(":id", String(item.id));
};

const normalizeList = <T extends Entity>(value: unknown) => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    if (Array.isArray(objectValue.items)) return objectValue.items as T[];
    if (Array.isArray(objectValue.rows)) return objectValue.rows as T[];
    if (Array.isArray(objectValue.results)) return objectValue.results as T[];
    if ("id" in objectValue) return [objectValue as T];
  }
  return [];
};

const normalizeItem = <T extends Entity>(value: unknown, fallback: T) => {
  if (value && typeof value === "object" && "id" in value) return value as T;
  return fallback;
};

const unavailableEndpoint = (key: string) =>
  new Error(`Endpoint untuk resource "${key}" belum tersedia.`);

export const resourceApi = {
  async list<T extends Entity>(config: ResourceConfig<T>) {
    try {
      const response = await apiClient.get(config.listPath);
      return normalizeList<T>(unwrap<unknown>(response.data));
    } catch (error) {
      if (
        config.notFoundIsEmpty &&
        axios.isAxiosError(error) &&
        error.response?.status === 404
      ) {
        return config.fallback;
      }

      if (
        config.key.startsWith("sales-pengajuan-") &&
        axios.isAxiosError(error)
      ) {
        const pengajuansId = config.key.replace("sales-pengajuan-", "");
        if (pengajuansId) {
          try {
            const fallbackResponse = await apiClient.get(
              `/businesses/proposals/sales/pengajuan?pengajuans_id=${encodeURIComponent(pengajuansId)}&page=1&limit=200`,
            );
            return normalizeList<T>(unwrap<unknown>(fallbackResponse.data));
          } catch {
            try {
              const legacyFallbackResponse = await apiClient.get(
                `/businesses/proposals/sales/pengajuan/${encodeURIComponent(pengajuansId)}`,
              );
              return normalizeList<T>(unwrap<unknown>(legacyFallbackResponse.data));
            } catch (fallbackError) {
              if (
                config.notFoundIsEmpty &&
                axios.isAxiosError(fallbackError) &&
                fallbackError.response?.status === 404
              ) {
                return config.fallback;
              }
            }
          }
        }
      }
      throw error;
    }
  },

  async create<T extends Entity>(config: ResourceConfig<T>, values: Partial<T>) {
    const apiPath = pathFrom(config.createPath, values);
    if (!apiPath) throw unavailableEndpoint(config.key);

    const response = await apiClient.post(
      apiPath,
      config.createBody ? config.createBody(values) : values,
    );
    return normalizeItem<T>(unwrap<unknown>(response.data), { ...values, id: Date.now() } as T);
  },

  async update<T extends Entity>(config: ResourceConfig<T>, item: T) {
    const apiPath = pathFrom(config.updatePath as string | ((item: Partial<T> | T) => string) | undefined, item);
    if (!apiPath) throw unavailableEndpoint(config.key);

    const response = await apiClient.request({
      method: config.updateMethod ?? "PUT",
      url: apiPath,
      data: config.updateBody ? config.updateBody(item) : item,
    });
    return normalizeItem<T>(unwrap<unknown>(response.data), item);
  },

  async remove<T extends Entity>(config: ResourceConfig<T>, item: T) {
    const apiPath = pathFrom(config.deletePath as string | ((item: Partial<T> | T) => string) | undefined, item);
    if (!apiPath) throw unavailableEndpoint(config.key);

    await apiClient.delete(apiPath);
    return item;
  },

  async detail<T extends Entity>(config: ResourceConfig<T>, item: T) {
    const apiPath = pathFrom(
      config.detailPath as string | ((item: Partial<T> | T) => string) | undefined,
      item,
    );
    if (!apiPath) return item;

    try {
      const response = await apiClient.get(apiPath);
      return unwrap<unknown>(response.data);
    } catch (error) {
      if (
        config.key === "users" &&
        axios.isAxiosError(error) &&
        error.response?.status === 403
      ) {
        return item;
      }
      throw error;
    }
  },

  async request<T extends Entity>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
    fallback?: T,
  ) {
    const response = await apiClient.request({
      method,
      url: path,
      data: body,
    });
    return unwrap<unknown>(response.data) ?? fallback;
  },

  async action<T extends Entity>(
    config: ResourceConfig<T>,
    item: T,
    path: string,
    body?: Record<string, unknown>,
  ) {
    const response = await apiClient.put(path.replace(":id", String(item.id)), body);
    return normalizeItem<T>(unwrap<unknown>(response.data), item);
  },
};
