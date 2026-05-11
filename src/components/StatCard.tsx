import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  tone?: "primary" | "green" | "amber" | "neutral";
  loading?: boolean;
};

const toneClass = {
  primary: "bg-primary/10 text-primary",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  neutral: "bg-neutral text-white",
};

export function StatCard({ label, value, helper, icon: Icon, tone = "primary", loading = false }: StatCardProps) {
  return (
    <div className="rounded-md border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-neutral/60">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-28 animate-pulse rounded-md bg-base-300" />
          ) : (
            <p className="mt-2 text-2xl font-black tracking-normal text-neutral">{value}</p>
          )}
          {helper ? <p className="mt-2 text-sm text-neutral/55">{loading ? "Memuat data" : helper}</p> : null}
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${toneClass[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
