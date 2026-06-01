import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Edit3,
  Eye,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type {
  Entity,
  ResourceAction,
  ResourceColumn,
  ResourceConfig,
  ResourceField,
  ResourceFormContext,
  ResourceSearchField,
} from "../types";
import { resourceApi } from "../lib/api/resources";
import { useAuth } from "../lib/auth/AuthProvider";
import { useLanguage } from "../lib/i18n/LanguageProvider";
import { useToast } from "./ToastProvider";
import { EmptyState } from "./EmptyState";
import { ListSkeleton, TableRowSkeleton } from "./PageSkeleton";
import { DashboardBreadcrumb } from "./DashboardBreadcrumb";
import { apiErrorMessage } from "../lib/format";

type ResourcePageProps<T extends Entity> = {
  title: string;
  description: string;
  config: ResourceConfig<T>;
  columns: ResourceColumn<T>[];
  fields?: ResourceField<T>[];
  createLabel?: string;
  readonly?: boolean;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  actions?: ResourceAction<T>[];
  emptyTitle?: string;
  emptyDescription?: string;
  searchableFields?: ResourceSearchField<T>[];
  pageSize?: number;
  staticData?: T[];
  maxCreateItems?: number;
  createLimitMessage?: string;
  rowFilter?: (item: T) => boolean;
  canEditRow?: (item: T) => boolean;
  editDisabledReason?: string | ((item: T) => string | undefined);
  hideDisabledEdit?: boolean;
  validateForm?: (values: Partial<T>, context: ResourceFormContext<T>) => string | undefined;
  extraInvalidateKeys?: Array<readonly unknown[]>;
  detailRenderer?: (data: unknown) => ReactNode;
  rowCardRenderer?: (
    item: T,
    context: {
      canDetail: boolean;
      canEdit: boolean;
      canDelete: boolean;
      editReason?: string;
      visibleActions: ResourceAction<T>[];
      isProcessing: boolean;
      onDetail: () => void;
      onEdit: () => void;
      onDelete: () => void;
      onAction: (action: ResourceAction<T>) => void;
      defaultActions: ReactNode;
    },
  ) => ReactNode;
  emptyAction?: ReactNode;
  statusFilterVariant?: "select" | "tabs";
  showTitle?: boolean;
  showBreadcrumb?: boolean;
  showSearch?: boolean;
  showStatusFilter?: boolean;
  formExtras?: (context: {
    editing: T | null;
    formValues: Record<string, unknown>;
    setFormValues: Dispatch<SetStateAction<Record<string, unknown>>>;
    isSaving: boolean;
  }) => ReactNode;
  onAfterCreate?: (
    created: T,
    context: {
      values: Partial<T>;
      rawValues: Record<string, unknown>;
    },
  ) => Promise<void> | void;
};

type ConfirmDialog = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => Promise<void>;
};

type LoadingAlert = {
  title: string;
  message: string;
};

const emptyForm = <T extends Entity>(fields: ResourceField<T>[] = []) =>
  fields.reduce<Record<string, unknown>>((state, field) => {
    state[field.name] = field.type === "funding_plan" ? [{ kategori: "", jumlah: "" }] : "";
    return state;
  }, {});

const formatCurrencyInput = (value: unknown) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
};

const parsePercentInput = (value: unknown) => {
  const normalized = String(value ?? "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

const coerceValues = <T extends Entity>(
  fields: ResourceField<T>[],
  values: Record<string, unknown>,
) => {
  return fields.reduce<Partial<T>>((payload, field) => {
    const value = values[field.name];
    if (value === "" || value === null || value === undefined) return payload;

    if (field.type === "funding_plan") {
      const rows = Array.isArray(value) ? value : [];
      const normalized = rows
        .map((item) => {
          const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          const kategori = String(row.kategori ?? "").trim();
          const jumlahDigits = String(row.jumlah ?? "").replace(/\D/g, "");
          const jumlah = jumlahDigits ? Number(jumlahDigits) : 0;
          if (!kategori || !Number.isFinite(jumlah) || jumlah <= 0) return null;
          return { kategori, jumlah };
        })
        .filter((item): item is { kategori: string; jumlah: number } => Boolean(item));

      if (normalized.length === 0) return payload;
      payload[field.name] = normalized as T[keyof T & string];
      return payload;
    }

    if (field.type === "currency") {
      const digits = String(value).replace(/\D/g, "");
      if (!digits) return payload;
      payload[field.name] = Number(digits) as T[keyof T & string];
      return payload;
    }

    if (field.type === "percent") {
      const percent = parsePercentInput(value);
      if (percent === null) return payload;
      payload[field.name] = percent as T[keyof T & string];
      return payload;
    }

    payload[field.name] = (field.type === "number" ? Number(value) : value) as T[keyof T & string];
    return payload;
  }, {});
};

const readFundingPlanRows = (value: unknown) => {
  const toRows = (raw: unknown, keepEmpty = false) => {
    if (!Array.isArray(raw)) return [];
    const rows = raw.map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const kategori = String(row.kategori ?? row.category ?? "").trim();
      const jumlahValue = row.jumlah ?? row.amount ?? "";
      const jumlahDigits = String(jumlahValue ?? "").replace(/\D/g, "");
      return { kategori, jumlah: jumlahDigits };
    });
    return keepEmpty ? rows : rows.filter((item) => item.kategori || item.jumlah);
  };

  if (Array.isArray(value)) {
    const rows = toRows(value, true);
    return rows.length > 0 ? rows : [{ kategori: "", jumlah: "" }];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [{ kategori: "", jumlah: "" }];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const rows = toRows(parsed);
      return rows.length > 0 ? rows : [{ kategori: "", jumlah: "" }];
    } catch {
      return [{ kategori: "", jumlah: "" }];
    }
  }

  return [{ kategori: "", jumlah: "" }];
};

function FundingPlanInput({
  fieldName,
  value,
  language,
  setFormValues,
}: {
  fieldName: string;
  value: unknown;
  language: "id" | "en";
  setFormValues: Dispatch<SetStateAction<Record<string, unknown>>>;
}) {
  const rows = useMemo(() => readFundingPlanRows(value), [value]);
  const updateRows = (nextRows: Array<{ kategori: string; jumlah: string }>) => {
    setFormValues((current) => ({ ...current, [fieldName]: nextRows }));
  };

  return (
    <div className="space-y-3 rounded-md bg-base-200/50 p-3">
      {rows.map((row, index) => (
        <div key={`${fieldName}-${index}`} className="rounded-md bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-neutral/45">
              {language === "id" ? `Item ${index + 1}` : `Item ${index + 1}`}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-xs rounded-md text-error"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (rows.length <= 1) {
                  updateRows([{ kategori: "", jumlah: "" }]);
                  return;
                }
                const nextRows = [...rows];
                nextRows.splice(index, 1);
                updateRows(nextRows);
              }}
              disabled={rows.length <= 1}
            >
              <Trash2 size={14} />
              {language === "id" ? "Hapus" : "Remove"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <input
              className="input input-bordered rounded-md bg-base-100"
              value={row.kategori}
              onChange={(event) => {
                const nextRows = [...rows];
                nextRows[index] = {
                  ...nextRows[index],
                  kategori: event.target.value,
                };
                updateRows(nextRows);
              }}
              placeholder={
                language === "id" ? "Kategori, misalnya Marketing" : "Category, e.g. Marketing"
              }
            />
            <div className="input input-bordered flex items-center gap-2 rounded-md bg-base-100">
              <span className="text-sm font-semibold text-neutral/60">IDR</span>
              <input
                className="w-full bg-transparent text-sm font-semibold outline-none"
                value={row.jumlah ? new Intl.NumberFormat("id-ID").format(Number(row.jumlah)) : ""}
                inputMode="numeric"
                onChange={(event) => {
                  const nextRows = [...rows];
                  nextRows[index] = {
                    ...nextRows[index],
                    jumlah: event.target.value.replace(/\D/g, ""),
                  };
                  updateRows(nextRows);
                }}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline btn-sm relative z-[1] rounded-md bg-white"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          updateRows([...rows, { kategori: "", jumlah: "" }]);
        }}
      >
        <Plus size={15} />
        {language === "id" ? "Tambah item" : "Add item"}
      </button>
    </div>
  );
}

const displayPreviewValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return `${value.length} item`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .slice(0, 3)
      .map(([key, item]) => `${key}: ${String(item ?? "-")}`);
    return entries.length > 0 ? entries.join(", ") : "-";
  }
  return String(value);
};

const nestedValue = (item: Entity, path: string) =>
  path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, item);

const genericStatus = (item: Entity) =>
  item.status ??
  item.approval_status ??
  nestedValue(item, "approval.status") ??
  (typeof item.is_read === "boolean" ? (item.is_read ? "read" : "unread") : undefined);

function DataPreview({ data }: { data: unknown }) {
  const { t } = useLanguage();

  if (Array.isArray(data)) {
    return (
      <div className="grid gap-3">
        {data.length === 0 ? (
          <div className="rounded-md border border-base-300 p-4 text-sm font-semibold text-neutral/55">
            {t("dataUnavailable")}
          </div>
        ) : (
          data.slice(0, 6).map((item, index) => (
            <div key={index} className="rounded-md border border-base-300 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">
                {t("item")} {index + 1}
              </p>
              <DataPreview data={item} />
            </div>
          ))
        )}
      </div>
    );
  }

  if (data && typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);

    return (
      <div className="overflow-hidden rounded-md border border-base-300">
        {entries.length === 0 ? (
          <div className="px-4 py-3 text-sm font-semibold text-neutral/55">{t("dataUnavailable")}</div>
        ) : (
          entries.map(([key, value]) => (
            <div
              key={key}
              className="grid gap-1 border-b border-base-300 px-4 py-3 last:border-b-0 sm:grid-cols-[0.35fr_0.65fr]"
            >
              <span className="break-words text-sm font-semibold text-neutral/55">{key}</span>
              <span className="break-words text-sm font-bold text-neutral">
                {displayPreviewValue(value)}
              </span>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-base-300 p-4 text-sm font-bold text-neutral">
      {displayPreviewValue(data)}
    </div>
  );
}

export function ResourcePage<T extends Entity>({
  title,
  description,
  config,
  columns,
  fields = [],
  createLabel = "Tambah Data",
  readonly = false,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  actions = [],
  emptyTitle = "Data belum tersedia",
  emptyDescription = "Belum ada data yang bisa ditampilkan untuk halaman ini.",
  searchableFields,
  pageSize = 10,
  staticData,
  maxCreateItems,
  createLimitMessage,
  rowFilter,
  canEditRow,
  editDisabledReason,
  hideDisabledEdit = false,
  validateForm,
  extraInvalidateKeys = [],
  detailRenderer,
  rowCardRenderer,
  emptyAction,
  statusFilterVariant = "select",
  showTitle = true,
  showBreadcrumb = true,
  showSearch = true,
  showStatusFilter = true,
  formExtras,
  onAfterCreate,
}: ResourcePageProps<T>) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const toast = useToast();
  const copy = useMemo(
    () => ({
      allStatus: t("resourceAllStatus"),
      search: t("resourceSearch"),
      actions: t("resourceActions"),
      loadError: t("resourceLoadError"),
      detail: t("detail"),
      edit: t("resourceEdit"),
      delete: t("delete"),
      choose: t("resourceChoose"),
      cancel: t("cancel"),
      save: t("save"),
      previous: t("resourcePrevious"),
      next: t("resourceNext"),
      showing: t("resourceShowing"),
      from: t("resourceFrom"),
      data: t("resourceData"),
    }),
    [t],
  );
  const queryClient = useQueryClient();
  const resourceQueryKey = ["resource", config.key, user?.id ?? "guest", user?.role ?? "guest"];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<T | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [resultModal, setResultModal] = useState<{ title: string; data: unknown } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [loadingAlert, setLoadingAlert] = useState<LoadingAlert | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>(() =>
    emptyForm(fields),
  );

  const query = useQuery({
    queryKey: resourceQueryKey,
    queryFn: () => resourceApi.list(config),
    enabled: !staticData,
    retry: false,
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: resourceQueryKey }),
      ...extraInvalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (values: Partial<T>) => resourceApi.create(config, values),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (item: T) => resourceApi.update(config, item),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (item: T) => resourceApi.remove(config, item),
    onSuccess: invalidate,
  });

  const detailMutation = useMutation({
    mutationFn: (item: T) => resourceApi.detail(config, item),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, item }: { action: ResourceAction<T>; item: T }) => {
      const path = typeof action.path === "function" ? action.path(item) : action.path;
      const body = typeof action.body === "function" ? action.body(item) : action.body;
      return resourceApi.request(action.method, path, body, item);
    },
    onSuccess: async (_data, variables) => {
      if (variables.action.invalidate !== false) await invalidate();
    },
  });

  const runWithLoading = async (
    loading: LoadingAlert,
    task: () => Promise<void>,
    success: { title: string; message: string },
  ) => {
    setLoadingAlert(loading);
    try {
      await task();
      toast.success(success.message, { title: success.title });
    } catch (error) {
      toast.error(apiErrorMessage(error, t("actionFailedMessage")), {
        title: t("actionFailed"),
      });
    } finally {
      setLoadingAlert(null);
    }
  };

  const loadedRows = useMemo(() => {
    const source = staticData ?? query.data ?? [];
    if (!rowFilter) return source;
    return source.filter((item) => rowFilter(item));
  }, [query.data, rowFilter, staticData]);

  useEffect(() => {
    setPage(1);
  }, [rowFilter]);

  const effectiveSearchableFields = searchableFields ?? config.searchableFields ?? [];

  const rows = useMemo(() => {
    const byStatus =
      statusFilter === "all"
        ? loadedRows
        : loadedRows.filter((item) => String(genericStatus(item)).toLowerCase() === statusFilter);
    if (!search.trim()) return byStatus;
    const needle = search.toLowerCase();
    return byStatus.filter((item) => {
      if (!effectiveSearchableFields.length) return false;
      return effectiveSearchableFields
        .map((field) => (typeof field === "function" ? field(item) : nestedValue(item, field)))
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [effectiveSearchableFields, loadedRows, search, statusFilter]);

  const statusOptions = useMemo(() => {
    const values = new Set<string>();
    loadedRows.forEach((item) => {
      const value = genericStatus(item);
      if (value !== undefined && value !== null && value !== "") {
        values.add(String(value).toLowerCase());
      }
    });
    return Array.from(values).sort();
  }, [loadedRows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalLoadedItems = loadedRows.length;
  const createLimitReached =
    typeof maxCreateItems === "number" &&
    Number.isFinite(maxCreateItems) &&
    maxCreateItems > 0 &&
    totalLoadedItems >= maxCreateItems;

  const openCreate = () => {
    setEditing(null);
    setFormValues(emptyForm(fields));
    setIsFormOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    const next = emptyForm(fields);
    fields.forEach((field) => {
      const value = field.getEditValue ? field.getEditValue(item) : item[field.name];
      if (field.type === "funding_plan") {
        next[field.name] = readFundingPlanRows(value);
        return;
      }
      if (field.type === "currency") {
        next[field.name] = String(value ?? "").replace(/\D/g, "");
        return;
      }
      if (field.type === "percent") {
        next[field.name] = String(value ?? "").replace(",", ".");
        return;
      }
      if (field.type === "textarea" && value && typeof value === "object") {
        next[field.name] = JSON.stringify(value, null, 2);
        return;
      }
      next[field.name] =
        typeof value === "number" || typeof value === "string" ? value : String(value ?? "");
    });
    setFormValues(next);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setFormValues(emptyForm(fields));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitFields = editing
      ? fields.filter((field) => !field.hideOnEdit)
      : fields;
    const values = coerceValues(submitFields, formValues);

    for (const field of submitFields) {
      if (field.type !== "funding_plan" || !field.required) continue;
      const plan = values[field.name];
      if (!Array.isArray(plan) || plan.length === 0) {
        toast.error(
          language === "id"
            ? `${t(field.label)} wajib diisi minimal 1 item.`
            : `${t(field.label)} requires at least 1 item.`,
          { title: t("saveFailed") },
        );
        return;
      }
    }

    const validationMessage = validateForm?.(values, { editing, fields: submitFields });
    if (validationMessage) {
      toast.error(t(validationMessage), { title: t("saveFailed") });
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ ...editing, ...values });
        toast.success(t("resourceUpdateSuccess", { title: t(title) }), {
          title: t("dataUpdated"),
        });
      } else {
        const created = await createMutation.mutateAsync(values);
        if (onAfterCreate) {
          try {
            await onAfterCreate(created, { values, rawValues: formValues });
          } catch (followUpError) {
            toast.error(
              apiErrorMessage(
                followUpError,
                language === "id"
                  ? "Data tersimpan, tetapi proses lanjutan gagal."
                  : "Data is saved, but follow-up process failed.",
              ),
              {
                title: language === "id" ? "Perlu Tindakan Lanjutan" : "Follow-up Needed",
              },
            );
          }
        }
        toast.success(t("resourceCreateSuccess", { title: t(title) }), {
          title: t("dataAdded"),
        });
      }
      closeForm();
    } catch (error) {
      toast.error(apiErrorMessage(error, t("saveFailedMessage")), {
        title: t("saveFailed"),
      });
    }
  };

  const remove = async (item: T) => {
    setConfirmDialog({
      title: t("deleteDataTitle"),
      message: t("deleteDataMessage"),
      confirmLabel: t("delete"),
      tone: "danger",
      onConfirm: () =>
        runWithLoading(
          {
            title: t("deletingData"),
            message: t("deletingDataMessage"),
          },
          async () => {
            await deleteMutation.mutateAsync(item);
          },
          {
            title: t("dataDeleted"),
            message: t("resourceDeleteSuccess", { title: t(title) }),
          },
        ),
    });
  };

  const runAction = async (action: ResourceAction<T>, item: T) => {
    const message = typeof action.confirm === "function" ? action.confirm(item) : action.confirm;
    const execute = async () => {
      await runWithLoading(
        {
          title: t("processingAction"),
          message: t("processingActionMessage", { action: t(action.label) }),
        },
        async () => {
          const data = await actionMutation.mutateAsync({ action, item });
          if (action.method === "GET" || !message) {
            setResultModal({ title: t(action.label), data });
          }
        },
        {
          title: t("actionSuccess"),
          message: t("actionSuccessMessage", { action: t(action.label) }),
        },
      );
    };

    if (!message) {
      await execute();
      return;
    }

    setConfirmDialog({
      title: t("confirmAction"),
      message: message ? t(message) : "",
      confirmLabel: t(action.label),
      tone: action.className?.includes("error") ? "danger" : "primary",
      onConfirm: execute,
    });
  };

  const showDetail = async (item: T) => {
    await runWithLoading(
      {
        title: t("loadingDetail"),
        message: t("loadingDetailMessage"),
      },
      async () => {
        const data = await detailMutation.mutateAsync(item);
        setResultModal({ title: t("detailData"), data });
      },
      {
        title: t("detailReady"),
        message: t("detailReadyMessage"),
      },
    );
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isProcessing = Boolean(loadingAlert);
  const canCreate =
    allowCreate &&
    !readonly &&
    fields.length > 0 &&
    Boolean(config.createPath) &&
    !createLimitReached;
  const canEdit = allowEdit && !readonly && fields.length > 0 && Boolean(config.updatePath);
  const canDelete = allowDelete && !readonly && Boolean(config.deletePath);
  const hasRowActions = canEdit || canDelete || actions.length > 0 || Boolean(config.detailPath);
  const colSpan = columns.length + (hasRowActions ? 1 : 0);
  const canShowStatusFilter = showStatusFilter && statusOptions.length > 1;
  const canShowSearchInput = showSearch;
  const hasTopControls = canShowStatusFilter || canShowSearchInput || canCreate;
  const showTopBar = showTitle || hasTopControls;

  const visibleActionsFor = (item: T) =>
    actions.filter((action) => !action.isVisible || action.isVisible(item));

  const renderActionButtons = (item: T) => {
    const isEditable = canEditRow ? canEditRow(item) : true;
    const editReason =
      typeof editDisabledReason === "function"
        ? editDisabledReason(item)
        : editDisabledReason;
    const visibleActions = visibleActionsFor(item);
    const disabledReasons = new Set<string>();
    if (!hideDisabledEdit && canEdit && !isEditable && editReason) disabledReasons.add(t(editReason));
    visibleActions.forEach((action) => {
      if (!action.isDisabled?.(item)) return;
      const reason =
        typeof action.disabledReason === "function"
          ? action.disabledReason(item)
          : action.disabledReason;
      if (reason) disabledReasons.add(t(reason));
    });
    const visibleDisabledReasons = Array.from(disabledReasons);

    return (
      <>
        {config.detailPath ? (
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={() => showDetail(item)}
            aria-label={copy.detail}
            title={copy.detail}
            disabled={isProcessing}
          >
            <Eye size={16} />
          </button>
        ) : null}
        {canEdit && (!hideDisabledEdit || isEditable) ? (
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={() => openEdit(item)}
            aria-label={copy.edit}
            title={!isEditable && editReason ? editReason : copy.edit}
            disabled={isProcessing || !isEditable}
          >
            <Edit3 size={16} />
          </button>
        ) : null}
        {canDelete ? (
          <button
            className="btn btn-square btn-ghost btn-sm text-error"
            onClick={() => remove(item)}
            aria-label={copy.delete}
            title={copy.delete}
            disabled={isProcessing}
          >
            <Trash2 size={16} />
          </button>
        ) : null}
        {visibleActions.map((action) => {
          const disabled = isProcessing || Boolean(action.isDisabled?.(item));
          const disabledReason =
            typeof action.disabledReason === "function"
              ? action.disabledReason(item)
              : action.disabledReason;
          return (
            <button
              key={`${item.id}-${action.label}`}
              className={action.className ?? "btn btn-outline btn-xs rounded-md"}
              onClick={() => runAction(action, item)}
              disabled={disabled}
              title={disabled && disabledReason ? t(disabledReason) : undefined}
            >
              {t(action.label)}
            </button>
          );
        })}
        {visibleDisabledReasons.map((reason) => (
          <span
            key={reason}
            className="basis-full rounded-md bg-base-200 px-2 py-1 text-right text-xs font-bold text-neutral/60"
          >
            {reason}
          </span>
        ))}
      </>
    );
  };

  const renderEmptyContent = (compact = false) => (
    <div className="grid justify-items-center gap-3">
      <EmptyState
        title={emptyTitle}
        body={search || statusFilter !== "all" ? "noFilterMatchInline" : emptyDescription}
        compact={compact}
      />
      {!search && statusFilter === "all" && emptyAction ? emptyAction : null}
    </div>
  );

  const renderRowCard = (item: T) => {
    if (!rowCardRenderer) return null;
    const isEditable = canEditRow ? canEditRow(item) : true;
    const editReason =
      typeof editDisabledReason === "function"
        ? editDisabledReason(item)
        : editDisabledReason;
    return rowCardRenderer(item, {
      canDetail: Boolean(config.detailPath),
      canEdit: canEdit && isEditable,
      canDelete,
      editReason,
      visibleActions: visibleActionsFor(item),
      isProcessing,
      onDetail: () => showDetail(item),
      onEdit: () => openEdit(item),
      onDelete: () => remove(item),
      onAction: (action) => runAction(action, item),
      defaultActions: renderActionButtons(item),
    });
  };

  return (
    <section className="space-y-5" data-page-description={t(description)}>
      {showTopBar ? (
        <div
          className={[
            "flex flex-col gap-4",
            showTitle ? "md:flex-row md:items-end md:justify-between" : "md:items-end md:justify-end",
          ].join(" ")}
        >
          {showTitle ? (
            <div>
              <h2 className="text-2xl font-black tracking-normal text-neutral">{t(title)}</h2>
              {showBreadcrumb ? <DashboardBreadcrumb /> : null}
            </div>
          ) : null}
          {hasTopControls ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {canShowStatusFilter && statusFilterVariant === "tabs" ? (
                <div className="flex flex-wrap gap-2" aria-label="Filter status">
                  {["all", ...statusOptions].map((status) => {
                    const active = statusFilter === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        className={[
                          "btn btn-sm rounded-md",
                          active ? "btn-neutral text-white" : "btn-outline bg-white",
                        ].join(" ")}
                        onClick={() => {
                          setStatusFilter(status);
                          setPage(1);
                        }}
                      >
                        {status === "all" ? copy.allStatus : t(status)}
                      </button>
                    );
                  })}
                </div>
              ) : canShowStatusFilter ? (
                <select
                  className="select select-bordered h-11 rounded-md bg-white text-sm font-semibold"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter status"
                >
                  <option value="all">{copy.allStatus}</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {t(status)}
                    </option>
                  ))}
                </select>
              ) : null}
              {canShowSearchInput ? (
                <label className="input input-bordered flex h-11 items-center gap-2 rounded-md bg-white">
                  <Search size={18} className="text-neutral/40" />
                  <input
                    className="w-full min-w-0"
                    placeholder={copy.search}
                    value={search}
                    aria-label={copy.search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                  />
                </label>
              ) : null}
              {canCreate ? (
                <button
                  className="btn btn-primary h-11 rounded-md text-white"
                  onClick={openCreate}
                  disabled={isProcessing}
                >
                  <Plus size={18} />
                  {t(createLabel)}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {createLimitReached && createLimitMessage ? (
        <p className="rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm font-semibold text-neutral/65">
          {t(createLimitMessage)}
        </p>
      ) : null}

      {rowCardRenderer ? (
        <div className="grid gap-3">
          {query.isLoading && !staticData ? (
            <ListSkeleton rows={4} />
          ) : query.isError && !staticData ? (
            <div className="flex min-h-28 items-center justify-center rounded-md border border-error/20 bg-error/10 p-4 text-center text-sm font-semibold text-error">
              {apiErrorMessage(query.error, copy.loadError)}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-md border border-base-300 bg-white p-6 shadow-sm">
              {renderEmptyContent()}
            </div>
          ) : (
            visibleRows.map((item) => renderRowCard(item))
          )}
        </div>
      ) : (
      <div className="overflow-hidden rounded-md border border-base-300 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr className="bg-base-200 text-xs uppercase tracking-wide text-neutral/60">
                {columns.map((column) => (
                  <th key={column.label} className={column.className}>
                    {t(column.label)}
                  </th>
                ))}
                {hasRowActions ? <th className="w-48 text-right">{copy.actions}</th> : null}
              </tr>
            </thead>
            <tbody>
              {query.isLoading && !staticData ? (
                <TableRowSkeleton rows={6} cols={colSpan} />
              ) : query.isError && !staticData ? (
                <tr>
                  <td colSpan={colSpan}>
                    <div className="flex h-28 items-center justify-center px-6 text-center text-error">
                      {apiErrorMessage(query.error, copy.loadError)}
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan}>
                    <div className="py-6">
                      {renderEmptyContent()}
                    </div>
                  </td>
                </tr>
              ) : (
                visibleRows.map((item) => (
                  <tr key={item.id} className="hover:bg-base-200/60">
                    {columns.map((column) => (
                      <td key={`${item.id}-${column.label}`} className={column.className}>
                        {column.render(item)}
                      </td>
                    ))}
                    {hasRowActions ? (
                      <td>
                        <div className="flex flex-wrap justify-end gap-1">
                          {renderActionButtons(item)}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {query.isLoading && !staticData ? (
            <ListSkeleton rows={4} />
          ) : query.isError && !staticData ? (
            <div className="flex min-h-28 items-center justify-center rounded-md border border-error/20 bg-error/10 p-4 text-center text-sm font-semibold text-error">
              {apiErrorMessage(query.error, copy.loadError)}
            </div>
          ) : rows.length === 0 ? (
            renderEmptyContent(true)
          ) : (
            visibleRows.map((item) => (
              <article key={item.id} className="rounded-md border border-base-300 p-4">
                <div className="grid gap-3">
                  {columns.map((column, index) => (
                    <div
                      key={`${item.id}-${column.label}`}
                      className={index === 0 ? "" : "border-t border-base-200 pt-3"}
                    >
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral/45">
                        {t(column.label)}
                      </p>
                      <div className="text-sm text-neutral">{column.render(item)}</div>
                    </div>
                  ))}
                </div>
                {hasRowActions ? (
                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-base-200 pt-3">
                    {renderActionButtons(item)}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
      )}

      {!(query.isLoading && !staticData) && !(query.isError && !staticData) && rows.length > pageSize ? (
        <div className="flex flex-col gap-3 rounded-md border border-base-300 bg-white p-3 text-sm font-semibold text-neutral/60 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {copy.showing} {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, rows.length)} {copy.from} {rows.length} {copy.data}
          </span>
          <div className="join">
            <button
              className="btn join-item btn-sm rounded-md"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
            >
              {copy.previous}
            </button>
            <button className="btn join-item btn-sm rounded-md" disabled>
              {currentPage}/{totalPages}
            </button>
            <button
              className="btn join-item btn-sm rounded-md"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
            >
              {copy.next}
            </button>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="modal modal-open">
          <div className="modal-box fr-modal-panel max-w-2xl rounded-md">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">{editing ? t("editData") : t(createLabel)}</h3>
                <p className="mt-1 text-sm text-neutral/55">{t(title)}</p>
              </div>
              <button className="btn btn-square btn-ghost btn-sm" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>
            <form className="grid gap-4" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                {fields
                  .filter((field) => !(editing && field.hideOnEdit))
                  .map((field) => {
                  const value = formValues[field.name] ?? "";
                  const isFullWidth =
                    field.type === "textarea" ||
                    field.type === "funding_plan" ||
                    field.colSpan === 2;
                  const inputValue =
                    typeof value === "number" || typeof value === "string" ? value : "";
                  const commonProps = {
                    id: field.name,
                    required: field.required,
                    value: inputValue,
                    onChange: (
                      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
                    ) =>
                      setFormValues((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      })),
                  };

                    return (
                      <div
                        key={field.name}
                        className={isFullWidth ? "form-control sm:col-span-2" : "form-control"}
                      >
                        <span className="label-text mb-2 font-semibold">{t(field.label)}</span>
                        {field.type === "textarea" ? (
                          <textarea
                            {...commonProps}
                            className="textarea textarea-bordered min-h-28 rounded-md"
                            placeholder={field.placeholder ? t(field.placeholder) : undefined}
                          />
                        ) : field.type === "funding_plan" ? (
                          <FundingPlanInput
                            fieldName={field.name}
                            value={value}
                            language={language}
                            setFormValues={setFormValues}
                          />
                        ) : field.type === "currency" ? (
                          <div className="input input-bordered flex items-center gap-2 rounded-md">
                            <span className="text-sm font-semibold text-neutral/60">IDR</span>
                            <input
                              id={field.name}
                              required={field.required}
                              className="w-full bg-transparent text-sm font-semibold outline-none"
                              inputMode="numeric"
                              value={formatCurrencyInput(inputValue)}
                              onChange={(event) =>
                                setFormValues((current) => ({
                                  ...current,
                                  [field.name]: event.target.value.replace(/\D/g, ""),
                                }))
                              }
                              placeholder={field.placeholder ? t(field.placeholder) : "0"}
                            />
                          </div>
                        ) : field.type === "percent" ? (
                          <div className="input input-bordered flex items-center gap-2 rounded-md">
                            <input
                              id={field.name}
                              required={field.required}
                              className="w-full bg-transparent text-sm font-semibold outline-none"
                              inputMode="decimal"
                              value={inputValue}
                              onChange={(event) =>
                                setFormValues((current) => ({
                                  ...current,
                                  [field.name]: event.target.value
                                    .replace(",", ".")
                                    .replace(/[^\d.]/g, ""),
                                }))
                              }
                              placeholder={field.placeholder ? t(field.placeholder) : "0"}
                            />
                            <span className="text-sm font-semibold text-neutral/60">%</span>
                          </div>
                        ) : field.type === "select" ? (
                          <select {...commonProps} className="select select-bordered rounded-md">
                            <option value="">{copy.choose}</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {t(option.label)}
                              </option>
                            ))}
                          </select>
                        ) : (
                        <input
                          {...commonProps}
                          type={field.type === "number" ? "number" : field.type ?? "text"}
                          className="input input-bordered rounded-md"
                          placeholder={field.placeholder ? t(field.placeholder) : undefined}
                          min={field.type === "number" ? field.min : undefined}
                          max={field.type === "number" ? field.max : undefined}
                          step={field.type === "number" ? field.step : undefined}
                        />
                      )}
                        {field.helperText ? (
                          <span className="mt-2 text-xs font-semibold text-neutral/50">
                            {t(field.helperText)}
                          </span>
                        ) : null}
                    </div>
                    );
                  })}
              </div>
              {formExtras
                ? formExtras({
                    editing,
                    formValues,
                    setFormValues,
                    isSaving,
                  })
                : null}
              <div className="modal-action">
                <button type="button" className="btn rounded-md" onClick={closeForm}>
                  {copy.cancel}
                </button>
                <button type="submit" className="btn btn-primary rounded-md text-white" disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
                  {copy.save}
                </button>
              </div>
            </form>
          </div>
          <button className="modal-backdrop fr-modal-backdrop" onClick={closeForm}>
            close
          </button>
        </div>
      ) : null}

      {confirmDialog ? (
        <div className="modal modal-open">
          <div className="modal-box fr-modal-panel max-w-md rounded-md">
            <div className="flex gap-4">
              <div
                className={[
                  "grid h-12 w-12 shrink-0 place-items-center rounded-md",
                  confirmDialog.tone === "danger"
                    ? "bg-error/10 text-error"
                    : "bg-primary/10 text-primary",
                ].join(" ")}
              >
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">{confirmDialog.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral/60">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn rounded-md"
                onClick={() => setConfirmDialog(null)}
                disabled={isProcessing}
              >
                {t("cancel")}
              </button>
              <button
                className={[
                  "btn rounded-md text-white",
                  confirmDialog.tone === "danger" ? "btn-error" : "btn-primary",
                ].join(" ")}
                disabled={isProcessing}
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
          <button className="modal-backdrop fr-modal-backdrop" onClick={() => setConfirmDialog(null)}>
            close
          </button>
        </div>
      ) : null}

      {resultModal ? (
        <div className="modal modal-open">
          <div className="modal-box fr-modal-panel max-w-3xl rounded-md">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-xl font-black">{resultModal.title}</h3>
              <button className="btn btn-square btn-ghost btn-sm" onClick={() => setResultModal(null)}>
                <X size={18} />
              </button>
            </div>
            {detailRenderer ? detailRenderer(resultModal.data) : <DataPreview data={resultModal.data} />}
          </div>
          <button className="modal-backdrop fr-modal-backdrop" onClick={() => setResultModal(null)}>
            close
          </button>
        </div>
      ) : null}

      {loadingAlert ? (
        <div className="modal modal-open">
          <div className="modal-box fr-modal-panel max-w-sm rounded-md text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <Loader2 className="animate-spin" size={34} />
            </div>
            <h3 className="mt-5 text-xl font-black">{loadingAlert.title}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral/60">{loadingAlert.message}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-base-200">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
