import type { ReactNode } from "react";

export type UserRole = "umkm" | "investor" | "admin" | "superadmin";

export type Entity = {
  id: number | string;
  [key: string]: unknown;
};

export type AuthUser = Entity & {
  nama: string;
  email: string;
  role: UserRole;
  role_id?: number;
  level?: "admin" | "superadmin";
  no_telp?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  role?: UserRole;
};

export type RegisterPayload = {
  nama: string;
  email: string;
  password: string;
  password_confirmation: string;
  nik: string;
  no_telp: string;
  role: "umkm" | "investor";
};

export type ApiEnvelope<T> = {
  status: "success" | "error" | "fail";
  message: string;
  data?: T;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  pagination?: {
    total_items: number;
    total_pages: number;
    current_page: number;
    limit: number;
    search?: string | null;
  };
};

export type ResourceField<T extends Entity> = {
  name: keyof T & string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  hideOnEdit?: boolean;
  min?: number;
  max?: number;
  step?: number;
  getEditValue?: (item: T) => string | number | undefined;
  colSpan?: 1 | 2;
  options?: Array<{ value: string | number; label: string }>;
};

export type ResourceColumn<T extends Entity> = {
  label: string;
  render: (item: T) => ReactNode;
  className?: string;
};

export type ResourceConfig<T extends Entity> = {
  key: string;
  listPath: string;
  createPath?: string | ((values: Partial<T>) => string);
  updatePath?: string | ((item: T) => string);
  updateMethod?: "PUT" | "POST";
  deletePath?: string | ((item: T) => string);
  detailPath?: string | ((item: T) => string);
  fallback: T[];
  notFoundIsEmpty?: boolean;
  createBody?: (values: Partial<T>) => Partial<T>;
  updateBody?: (item: T) => Partial<T>;
};

export type ResourceAction<T extends Entity> = {
  label: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string | ((item: T) => string);
  body?: Record<string, unknown> | ((item: T) => Record<string, unknown>);
  confirm?: string | ((item: T) => string);
  className?: string;
  invalidate?: boolean;
  isVisible?: (item: T) => boolean;
  isDisabled?: (item: T) => boolean;
  disabledReason?: string | ((item: T) => string);
};
