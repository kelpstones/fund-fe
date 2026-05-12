import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { Building2, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "../lib/i18n/LanguageProvider";

type PhotoPlaceholderProps = {
  title: string;
  caption?: string;
  icon?: LucideIcon;
  className?: string;
  dense?: boolean;
  ratio?: "1:1" | "4:3" | "3:4" | "16:9" | "16:10";
};

const ratioClass = {
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "3:4": "aspect-[3/4]",
  "16:9": "aspect-video",
  "16:10": "aspect-[16/10]",
};

export function PhotoPlaceholder({
  title,
  caption,
  icon: Icon = Building2,
  className,
  dense = false,
  ratio,
}: PhotoPlaceholderProps) {
  const { t } = useLanguage();
  const displayedRatio = ratio ?? (dense ? "16:10" : "4:3");

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-md border border-base-300 bg-base-200 shadow-sm",
        ratioClass[displayedRatio],
        className,
      )}
    >
      <div className="absolute inset-0 bg-base-200" />
      <div className="absolute inset-4 rounded-md border border-dashed border-base-300 bg-base-100/55" />
      <div className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-md border border-base-300 bg-white text-neutral/45">
        <Icon size={22} />
      </div>
      <div className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-md border border-base-300 bg-white text-neutral/45">
        <ImageIcon size={18} />
      </div>

      <div className="absolute inset-x-8 top-1/2 -translate-y-1/2">
        <div className="mx-auto grid max-w-xs place-items-center rounded-md border border-base-300 bg-white/70 px-4 py-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral/45">{t("photoPlaceholder")}</p>
          <p className="mt-2 text-2xl font-black text-neutral/55">{displayedRatio}</p>
          <p className="mt-1 text-xs leading-5 text-neutral/45">{t("photoPlaceholderBody")}</p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-base-300 bg-white/90 p-5 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-black text-neutral">{title}</h3>
          <span className="rounded-md bg-base-200 px-2 py-1 text-xs font-bold text-neutral/55">
            {displayedRatio}
          </span>
        </div>
        {caption ? <p className="mt-1 text-sm leading-6 text-neutral/60">{caption}</p> : null}
      </div>
    </div>
  );
}
