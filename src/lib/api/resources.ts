import type { Entity, ResourceConfig } from "../../types";
import {
  createLocal,
  getLocalList,
  removeLocal,
  syncLocalList,
  updateLocal,
} from "../mockData";
import { apiClient, unwrap } from "./client";

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

export const resourceApi = {
  async list<T extends Entity>(config: ResourceConfig<T>) {
    try {
      const response = await apiClient.get(config.listPath);
      const data = normalizeList<T>(unwrap<unknown>(response.data));
      if (data.length > 0) syncLocalList(config.key, data);
      return data.length > 0 ? data : getLocalList(config.key, config.fallback);
    } catch {
      return getLocalList(config.key, config.fallback);
    }
  },

  async create<T extends Entity>(config: ResourceConfig<T>, values: Partial<T>) {
    const localItem = createLocal(config.key, config.fallback, values);
    const apiPath = pathFrom(config.createPath, values);
    if (!apiPath) return localItem;

    try {
      const response = await apiClient.post(
        apiPath,
        config.createBody ? config.createBody(values) : values,
      );
      return normalizeItem<T>(unwrap<unknown>(response.data), localItem);
    } catch {
      return localItem;
    }
  },

  async update<T extends Entity>(config: ResourceConfig<T>, item: T) {
    const localItem = updateLocal(config.key, config.fallback, item);
    const apiPath = pathFrom(config.updatePath as string | ((item: Partial<T> | T) => string) | undefined, item);
    if (!apiPath) return localItem;

    try {
      const response = await apiClient.put(
        apiPath,
        config.updateBody ? config.updateBody(item) : item,
      );
      return normalizeItem<T>(unwrap<unknown>(response.data), localItem);
    } catch {
      return localItem;
    }
  },

  async remove<T extends Entity>(config: ResourceConfig<T>, item: T) {
    const localItem = removeLocal(config.key, config.fallback, item);
    const apiPath = pathFrom(config.deletePath as string | ((item: Partial<T> | T) => string) | undefined, item);
    if (!apiPath) return localItem;

    try {
      await apiClient.delete(apiPath);
      return localItem;
    } catch {
      return localItem;
    }
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
    } catch {
      return item;
    }
  },

  async request<T extends Entity>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
    fallback?: T,
  ) {
    try {
      const response = await apiClient.request({
        method,
        url: path,
        data: body,
      });
      return unwrap<unknown>(response.data);
    } catch {
      return fallback ?? { status: "offline", path, method, body };
    }
  },

  async action<T extends Entity>(
    config: ResourceConfig<T>,
    item: T,
    path: string,
    body?: Record<string, unknown>,
  ) {
    try {
      const response = await apiClient.put(path.replace(":id", String(item.id)), body);
      return normalizeItem<T>(unwrap<unknown>(response.data), item);
    } catch {
      return updateLocal(config.key, config.fallback, { ...item, ...body });
    }
  },
};
