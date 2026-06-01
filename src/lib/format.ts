import axios from "axios";
import type { Entity, UserRole } from "../types";

export const currency = (value: unknown) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const compactCurrency = (value: unknown) =>
  new Intl.NumberFormat("id-ID", {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

export const percent = (value: unknown) => `${Number(value || 0).toFixed(0)}%`;

export const dateShort = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const textValue = (value: unknown, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

export const readPath = (item: Entity, paths: string[], fallback = "-") => {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, segment) => {
      if (current && typeof current === "object" && segment in current) {
        return (current as Record<string, unknown>)[segment];
      }
      return undefined;
    }, item);

    if (value !== undefined && value !== null && value !== "") return value;
  }

  return fallback;
};

export const roleLabel = (role: UserRole) => {
  const labels: Record<UserRole, string> = {
    umkm: "UMKM",
    investor: "Investor",
    admin: "Admin",
    superadmin: "Superadmin",
  };

  return labels[role] ?? role;
};

export const statusTone = (status: unknown) => {
  const normalized = String(status || "").toLowerCase();
  if (["approved", "paid", "published", "deal", "completed", "distributed", "read"].includes(normalized)) {
    return "badge-success";
  }
  if (["pending", "active", "draft", "unread"].includes(normalized)) return "badge-warning";
  if (["rejected", "failed", "unpaid"].includes(normalized)) return "badge-error";
  return "badge-neutral";
};

export const apiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data) {
      return String((data as Record<string, unknown>).message);
    }
    if (typeof data === "string") return data;
  }
  return fallback;
};
