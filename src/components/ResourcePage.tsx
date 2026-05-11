import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
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
} from "../types";
import { resourceApi } from "../lib/api/resources";

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

type Notice = {
  tone: "success" | "error";
  title: string;
  message: string;
};

const emptyForm = <T extends Entity>(fields: ResourceField<T>[] = []) =>
  fields.reduce<Record<string, string | number>>((state, field) => {
    state[field.name] = "";
    return state;
  }, {});

const coerceValues = <T extends Entity>(
  fields: ResourceField<T>[],
  values: Record<string, string | number>,
) => {
  return fields.reduce<Partial<T>>((payload, field) => {
    const value = values[field.name];
    if (value === "") return payload;
    payload[field.name] = (field.type === "number" ? Number(value) : value) as T[keyof T & string];
    return payload;
  }, {});
};

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

function DataPreview({ data }: { data: unknown }) {
  if (Array.isArray(data)) {
    return (
      <div className="grid gap-3">
        {data.length === 0 ? (
          <div className="rounded-md border border-base-300 p-4 text-sm font-semibold text-neutral/55">
            Data belum tersedia
          </div>
        ) : (
          data.slice(0, 6).map((item, index) => (
            <div key={index} className="rounded-md border border-base-300 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">
                Item {index + 1}
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
          <div className="px-4 py-3 text-sm font-semibold text-neutral/55">Data belum tersedia</div>
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
}: ResourcePageProps<T>) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<T | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [resultModal, setResultModal] = useState<{ title: string; data: unknown } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [loadingAlert, setLoadingAlert] = useState<LoadingAlert | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number>>(() =>
    emptyForm(fields),
  );

  const query = useQuery({
    queryKey: ["resource", config.key],
    queryFn: () => resourceApi.list(config),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["resource", config.key] });
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
    success: Notice,
  ) => {
    setLoadingAlert(loading);
    setNotice(null);
    try {
      await task();
      setNotice(success);
    } catch {
      setNotice({
        tone: "error",
        title: "Aksi gagal",
        message: "Terjadi kendala saat memproses aksi. Coba ulangi beberapa saat lagi.",
      });
    } finally {
      setLoadingAlert(null);
    }
  };

  const rows = useMemo(() => {
    const data = query.data ?? [];
    if (!search.trim()) return data;
    const needle = search.toLowerCase();
    return data.filter((item) => JSON.stringify(item).toLowerCase().includes(needle));
  }, [query.data, search]);

  const openCreate = () => {
    setEditing(null);
    setFormValues(emptyForm(fields));
    setIsFormOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    const next = emptyForm(fields);
    fields.forEach((field) => {
      const value = item[field.name];
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
    const values = coerceValues(fields, formValues);
    setNotice(null);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ ...editing, ...values });
        setNotice({
          tone: "success",
          title: "Data diperbarui",
          message: `${title} berhasil diperbarui.`,
        });
      } else {
        await createMutation.mutateAsync(values);
        setNotice({
          tone: "success",
          title: "Data ditambahkan",
          message: `${title} berhasil ditambahkan.`,
        });
      }
      closeForm();
    } catch {
      setNotice({
        tone: "error",
        title: "Gagal menyimpan",
        message: "Perubahan belum berhasil diproses. Coba ulangi beberapa saat lagi.",
      });
    }
  };

  const remove = async (item: T) => {
    setConfirmDialog({
      title: "Hapus data?",
      message: "Data yang dihapus tidak bisa dikembalikan dari tampilan ini.",
      confirmLabel: "Hapus",
      tone: "danger",
      onConfirm: () =>
        runWithLoading(
          {
            title: "Menghapus data",
            message: "Mohon tunggu, sistem sedang memproses penghapusan.",
          },
          async () => {
            await deleteMutation.mutateAsync(item);
          },
          {
            tone: "success",
            title: "Data dihapus",
            message: `${title} berhasil dihapus.`,
          },
        ),
    });
  };

  const runAction = async (action: ResourceAction<T>, item: T) => {
    const message = typeof action.confirm === "function" ? action.confirm(item) : action.confirm;
    const execute = async () => {
      await runWithLoading(
        {
          title: "Memproses aksi",
          message: `${action.label} sedang diproses. Mohon tunggu sebentar.`,
        },
        async () => {
          const data = await actionMutation.mutateAsync({ action, item });
          if (action.method === "GET" || !message) {
            setResultModal({ title: action.label, data });
          }
        },
        {
          tone: "success",
          title: "Aksi berhasil",
          message: `${action.label} berhasil diproses.`,
        },
      );
    };

    if (!message) {
      await execute();
      return;
    }

    setConfirmDialog({
      title: "Konfirmasi aksi",
      message,
      confirmLabel: action.label,
      tone: action.className?.includes("error") ? "danger" : "primary",
      onConfirm: execute,
    });
  };

  const showDetail = async (item: T) => {
    await runWithLoading(
      {
        title: "Mengambil detail",
        message: "Mohon tunggu, detail data sedang disiapkan.",
      },
      async () => {
        const data = await detailMutation.mutateAsync(item);
        setResultModal({ title: "Detail Data", data });
      },
      {
        tone: "success",
        title: "Detail siap",
        message: "Detail data berhasil dimuat.",
      },
    );
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isProcessing = Boolean(loadingAlert);
  const canCreate = allowCreate && !readonly && fields.length > 0 && Boolean(config.createPath);
  const canEdit = allowEdit && !readonly && fields.length > 0 && Boolean(config.updatePath);
  const canDelete = allowDelete && !readonly && Boolean(config.deletePath);
  const hasRowActions = canEdit || canDelete || actions.length > 0 || Boolean(config.detailPath);

  return (
    <section className="space-y-5">
      {notice ? (
        <div
          className={[
            "flex items-start justify-between gap-4 rounded-md border p-4 shadow-sm",
            notice.tone === "success"
              ? "border-success/20 bg-success/10 text-success"
              : "border-error/20 bg-error/10 text-error",
          ].join(" ")}
        >
          <div className="flex gap-3">
            {notice.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            ) : (
              <AlertTriangle className="mt-0.5 shrink-0" size={20} />
            )}
            <div>
              <p className="font-black">{notice.title}</p>
              <p className="mt-1 text-sm font-semibold opacity-80">{notice.message}</p>
            </div>
          </div>
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={() => setNotice(null)}
            aria-label="Tutup alert"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral/60">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="input input-bordered flex h-11 items-center gap-2 rounded-md bg-white">
            <Search size={18} className="text-neutral/40" />
            <input
              className="w-full min-w-0"
              placeholder="Cari"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          {canCreate ? (
            <button
              className="btn btn-primary h-11 rounded-md text-white"
              onClick={openCreate}
              disabled={isProcessing}
            >
              <Plus size={18} />
              {createLabel}
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-base-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="bg-base-200 text-xs uppercase tracking-wide text-neutral/60">
                {columns.map((column) => (
                  <th key={column.label} className={column.className}>
                    {column.label}
                  </th>
                ))}
                {hasRowActions ? <th className="w-48 text-right">Aksi</th> : null}
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <div className="flex h-28 items-center justify-center gap-2 text-neutral/50">
                      <Loader2 className="animate-spin" size={18} />
                      Memuat data
                    </div>
                  </td>
                </tr>
              ) : query.isError ? (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <div className="flex h-28 items-center justify-center text-error">
                      Gagal memuat data dari backend
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1}>
                    <div className="flex h-28 items-center justify-center text-neutral/50">
                      Data belum tersedia
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className="hover:bg-base-200/60">
                    {columns.map((column) => (
                      <td key={`${item.id}-${column.label}`} className={column.className}>
                        {column.render(item)}
                      </td>
                    ))}
                    {hasRowActions ? (
                      <td>
                        <div className="flex flex-wrap justify-end gap-1">
                          {config.detailPath ? (
                            <button
                              className="btn btn-square btn-ghost btn-sm"
                              onClick={() => showDetail(item)}
                              aria-label="Detail"
                              disabled={isProcessing}
                            >
                              <Eye size={16} />
                            </button>
                          ) : null}
                          {canEdit ? (
                            <button
                              className="btn btn-square btn-ghost btn-sm"
                              onClick={() => openEdit(item)}
                              aria-label="Edit"
                              disabled={isProcessing}
                            >
                              <Edit3 size={16} />
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              className="btn btn-square btn-ghost btn-sm text-error"
                              onClick={() => remove(item)}
                              aria-label="Hapus"
                              disabled={isProcessing}
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : null}
                          {actions.map((action) => (
                            <button
                              key={`${item.id}-${action.label}`}
                              className={action.className ?? "btn btn-outline btn-xs rounded-md"}
                              onClick={() => runAction(action, item)}
                              disabled={isProcessing}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen ? (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl rounded-md">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">{editing ? "Edit Data" : createLabel}</h3>
                <p className="mt-1 text-sm text-neutral/55">{title}</p>
              </div>
              <button className="btn btn-square btn-ghost btn-sm" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>
            <form className="grid gap-4" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => {
                  const value = formValues[field.name] ?? "";
                  const commonProps = {
                    id: field.name,
                    required: field.required,
                    value,
                    onChange: (
                      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
                    ) =>
                      setFormValues((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      })),
                  };

                  return (
                    <label
                      key={field.name}
                      className={field.type === "textarea" ? "form-control sm:col-span-2" : "form-control"}
                    >
                      <span className="label-text mb-2 font-semibold">{field.label}</span>
                      {field.type === "textarea" ? (
                        <textarea
                          {...commonProps}
                          className="textarea textarea-bordered min-h-28 rounded-md"
                          placeholder={field.placeholder}
                        />
                      ) : field.type === "select" ? (
                        <select {...commonProps} className="select select-bordered rounded-md">
                          <option value="">Pilih</option>
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          {...commonProps}
                          type={field.type ?? "text"}
                          className="input input-bordered rounded-md"
                          placeholder={field.placeholder}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
              <div className="modal-action">
                <button type="button" className="btn rounded-md" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary rounded-md text-white" disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
                  Simpan
                </button>
              </div>
            </form>
          </div>
          <button className="modal-backdrop" onClick={closeForm}>
            close
          </button>
        </div>
      ) : null}

      {confirmDialog ? (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-md">
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
                Batal
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
          <button className="modal-backdrop" onClick={() => setConfirmDialog(null)}>
            close
          </button>
        </div>
      ) : null}

      {resultModal ? (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl rounded-md">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-xl font-black">{resultModal.title}</h3>
              <button className="btn btn-square btn-ghost btn-sm" onClick={() => setResultModal(null)}>
                <X size={18} />
              </button>
            </div>
            <DataPreview data={resultModal.data} />
          </div>
          <button className="modal-backdrop" onClick={() => setResultModal(null)}>
            close
          </button>
        </div>
      ) : null}

      {loadingAlert ? (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm rounded-md text-center">
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
