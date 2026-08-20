"use client";

import { cn } from "@/lib/utils";

export type SideNavItem = {
  key: string;
  label: string;
  description?: string;
  /** Renders the item unclickable with a "Soon" badge, for sections that aren't built yet. */
  locked?: boolean;
};

export function SideNav({
  items,
  activeKey,
  onSelect,
  className,
}: {
  items: SideNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:pb-0",
        className
      )}
    >
      {items.map((item) => {
        const active = item.key === activeKey && !item.locked;
        return (
          <button
            key={item.key}
            type="button"
            disabled={item.locked}
            aria-disabled={item.locked}
            onClick={() => onSelect(item.key)}
            className={cn(
              "flex shrink-0 flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition md:shrink",
              active && "border-squad-accent bg-squad-accent/10 text-squad-accent",
              !active && !item.locked && "border-squad-border bg-squad-panel text-gray-300 hover:border-white/30 hover:text-gray-100",
              item.locked && "cursor-not-allowed border-squad-border/60 bg-squad-panel/40 text-gray-600"
            )}
          >
            <span className="flex items-center justify-between gap-2 text-sm font-bold">
              {item.label}
              {item.locked && (
                <span className="rounded-full border border-gray-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                  Soon
                </span>
              )}
            </span>
            {item.description && (
              <span className={cn("text-xs", item.locked ? "text-gray-700" : "text-gray-500")}>
                {item.description}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
