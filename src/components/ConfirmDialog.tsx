import { AlertTriangle } from "lucide-react";
import { useLanguage } from "../lib/i18n/LanguageProvider";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmTone?: "primary" | "danger";
  isProcessing?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  confirmTone = "primary",
  isProcessing = false,
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md rounded-md">
        <div className="flex gap-4">
          <div
            className={[
              "grid h-12 w-12 shrink-0 place-items-center rounded-md",
              confirmTone === "danger" ? "bg-error/10 text-error" : "bg-primary/10 text-primary",
            ].join(" ")}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral/60">{message}</p>
          </div>
        </div>
        <div className="modal-action">
          <button className="btn rounded-md" onClick={onCancel} disabled={isProcessing}>
            {t("cancel")}
          </button>
          <button
            className={[
              "btn rounded-md text-white",
              confirmTone === "danger" ? "btn-error" : "btn-primary",
            ].join(" ")}
            disabled={isProcessing}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <button className="modal-backdrop" onClick={onCancel}>
        close
      </button>
    </div>
  );
}
