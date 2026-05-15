import { Image } from "lucide-react";

export function ImgPlaceholder({
  ratio,
  label,
  fill = false,
  className = "",
}: {
  ratio?: string;
  label?: string;
  fill?: boolean;
  className?: string;
}) {
  const paddingBottom =
    ratio && !fill
      ? (() => {
          const [w, h] = ratio.split(":").map(Number);
          return `${(h / w) * 100}%`;
        })()
      : undefined;

  return (
    <div
      className={`overflow-hidden rounded-md border-2 border-dashed border-base-300 bg-base-200 ${fill ? "h-full w-full" : "relative w-full"} ${className}`}
      style={paddingBottom ? { paddingBottom } : undefined}
    >
      <div
        className={`${fill ? "" : "absolute inset-0"} flex flex-col items-center justify-center gap-2 text-neutral/30`}
      >
        <Image size={28} strokeWidth={1.5} />
        <span className="px-4 text-center text-[10px] font-bold uppercase tracking-widest">
          {label ?? (ratio ? `Ilustrasi ${ratio}` : "Ilustrasi")}
        </span>
      </div>
    </div>
  );
}
