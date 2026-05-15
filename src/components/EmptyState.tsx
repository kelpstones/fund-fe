import type { LucideIcon } from "lucide-react";
import { FolderOpen } from "lucide-react";
import { useLanguage } from "../lib/i18n/LanguageProvider";

type EmptyStateProps = {
  title: string;
  body: string;
  icon?: LucideIcon;
  compact?: boolean;
};

export function EmptyState({
  title,
  body,
  icon: Icon = FolderOpen,
  compact = false,
}: EmptyStateProps) {
  const { t } = useLanguage();

  return (
    <div
      className={[
        "rounded-md border border-base-300 bg-base-200/60 text-center",
        compact ? "p-5" : "p-8",
      ].join(" ")}
    >
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-white text-primary">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 text-lg font-black text-neutral">{t(title)}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral/60">{t(body)}</p>
    </div>
  );
}
