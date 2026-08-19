import { cn } from "@/lib/utils";

function statColor(value: number) {
  if (value >= 85) return "bg-emerald-400";
  if (value >= 70) return "bg-lime-400";
  if (value >= 55) return "bg-amber-400";
  return "bg-rose-400";
}

export function StatBar({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <span className="w-6 shrink-0 font-semibold uppercase text-gray-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full", statColor(value))}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right font-semibold text-gray-200">{value}</span>
    </div>
  );
}
