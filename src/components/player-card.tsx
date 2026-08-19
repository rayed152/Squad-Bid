"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatBar } from "@/components/ui/stat-bar";
import type { FootballPlayer } from "@/types/player";

function overallTier(overall: number) {
  if (overall >= 85) return { label: "gold", ring: "ring-amber-300/60", text: "text-amber-300" };
  if (overall >= 75) return { label: "silver", ring: "ring-slate-300/60", text: "text-slate-200" };
  return { label: "bronze", ring: "ring-orange-500/50", text: "text-orange-400" };
}

const STAT_ORDER = [
  ["pace", "PAC"],
  ["shooting", "SHO"],
  ["passing", "PAS"],
  ["dribbling", "DRI"],
  ["defending", "DEF"],
  ["physical", "PHY"],
] as const;

export type PlayerCardProps = {
  player: FootballPlayer;
  variant?: "full" | "compact";
  /** Compact-only: stack the badge above the name (for pitch slots) instead of side-by-side (for lists). */
  layout?: "row" | "col";
  /** Positions this player is eligible for that are relevant to the current context (e.g. highlighted open slots). */
  highlightPositions?: string[];
  selected?: boolean;
  className?: string;
  onClick?: () => void;
};

export function PlayerCard({
  player,
  variant = "full",
  layout = "row",
  highlightPositions = [],
  selected = false,
  className,
  onClick,
}: PlayerCardProps) {
  const tier = overallTier(player.overall);

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-squad-border bg-squad-panel text-left transition",
          layout === "row" ? "w-full px-2 py-1.5" : "w-full flex-col gap-0.5 px-1.5 py-1 text-center",
          onClick && "hover:border-squad-accent/60 hover:bg-white/5",
          selected && "border-squad-accent ring-1 ring-squad-accent",
          className
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/30 text-sm font-bold ring-2",
            tier.ring,
            tier.text
          )}
        >
          {player.overall}
        </span>
        <span className={cn("min-w-0", layout === "row" ? "flex-1" : "w-full")}>
          <span className="block truncate text-sm font-semibold text-gray-100">{player.name}</span>
          <span className="block truncate text-[11px] text-gray-400">
            {player.positions.join(" / ")}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "w-64 animate-pop-in overflow-hidden rounded-2xl border border-squad-border bg-gradient-to-b from-squad-panel to-[#0d1526] shadow-xl",
        selected && "ring-2 ring-squad-accent",
        className
      )}
    >
      <div className="flex items-start justify-between px-4 pt-4">
        <div className="flex flex-col items-center">
          <span className={cn("text-3xl font-black leading-none", tier.text)}>
            {player.overall}
          </span>
          <span className="mt-1 flex flex-wrap justify-center gap-1">
            {player.positions.map((pos) => (
              <Badge
                key={pos}
                variant={highlightPositions.includes(pos) ? "accent" : "outline"}
              >
                {pos}
              </Badge>
            ))}
          </span>
        </div>

        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/10 bg-black/30">
          {player.imageUrl ? (
            <Image
              src={player.imageUrl}
              alt={player.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-500">
              {player.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-2">
        <h3 className="truncate text-base font-bold text-white">{player.name}</h3>
        <p className="truncate text-xs text-gray-400">{player.nationality}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 px-4 pb-4">
        {STAT_ORDER.map(([key, label]) => (
          <StatBar key={key} label={label} value={player[key]} />
        ))}
      </div>
    </div>
  );
}
