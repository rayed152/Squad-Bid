"use client";

import { cn } from "@/lib/utils";
import { getFormation, type FormationId, type FormationSlot } from "@/lib/formations";
import { isEligibleForSlot } from "@/lib/positions";
import type { FootballPlayer } from "@/types/player";
import { PlayerCard } from "@/components/player-card";

export type FormationPitchProps = {
  formationId: FormationId;
  /** Footballer occupying each slot, keyed by slot id. */
  assignments?: Partial<Record<string, FootballPlayer>>;
  /** The currently popped-up candidate, used to highlight slots they're eligible for. */
  candidate?: Pick<FootballPlayer, "positions"> | null;
  selectedSlotId?: string | null;
  onSlotClick?: (slot: FormationSlot) => void;
  className?: string;
};

export function FormationPitch({
  formationId,
  assignments = {},
  candidate = null,
  selectedSlotId = null,
  onSlotClick,
  className,
}: FormationPitchProps) {
  const formation = getFormation(formationId);

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-squad-border bg-pitch-stripes shadow-inner",
        className
      )}
    >
      <PitchMarkings />

      {formation.slots.map((slot) => {
        const occupant = assignments[slot.id];
        const eligible = candidate ? isEligibleForSlot(candidate.positions, slot.position) : false;
        const clickable = Boolean(onSlotClick) && (!candidate || eligible) && !occupant;

        return (
          <button
            key={slot.id}
            type="button"
            disabled={!clickable && Boolean(onSlotClick)}
            onClick={() => onSlotClick?.(slot)}
            style={{
              left: `${slot.x}%`,
              top: `${100 - slot.y}%`,
            }}
            className={cn(
              "group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1",
              onSlotClick && clickable && "cursor-pointer",
              onSlotClick && !clickable && "cursor-not-allowed"
            )}
          >
            {occupant ? (
              <div className="w-20">
                <PlayerCard player={occupant} variant="compact" layout="col" />
              </div>
            ) : (
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed text-[11px] font-bold text-white/70 transition",
                  candidate && eligible
                    ? "border-squad-accent bg-squad-accent/25 text-squad-accent animate-pulse"
                    : "border-white/30 bg-black/20",
                  selectedSlotId === slot.id && "ring-2 ring-squad-accent",
                  clickable && "group-hover:border-white group-hover:bg-white/10"
                )}
              >
                {slot.position}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PitchMarkings() {
  return (
    <svg
      viewBox="0 0 100 150"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
    >
      <rect x="1" y="1" width="98" height="148" fill="none" stroke="white" strokeWidth="0.5" />
      <line x1="1" y1="75" x2="99" y2="75" stroke="white" strokeWidth="0.5" />
      <circle cx="50" cy="75" r="9" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="24" y="1" width="52" height="18" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="24" y="131" width="52" height="18" fill="none" stroke="white" strokeWidth="0.5" />
    </svg>
  );
}
