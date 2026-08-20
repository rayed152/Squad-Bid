"use client";

import { cn } from "@/lib/utils";
import { getFormation, getBenchSlots, type AnySlot, type FormationId } from "@/lib/formations";
import { isEligibleForSlot } from "@/lib/positions";
import type { FootballPlayer } from "@/types/player";
import { PlayerCard } from "@/components/player-card";

export type FormationPitchProps = {
  formationId: FormationId;
  /** Number of bench slots to render below the pitch — 0 renders none. */
  benchSize?: number;
  /** Footballer occupying each slot, keyed by slot id. */
  assignments?: Partial<Record<string, FootballPlayer>>;
  /** The currently popped-up candidate, used to highlight slots they're eligible for. */
  candidate?: Pick<FootballPlayer, "positions"> | null;
  selectedSlotId?: string | null;
  onSlotClick?: (slot: AnySlot) => void;
  className?: string;
};

export function FormationPitch({
  formationId,
  benchSize = 0,
  assignments = {},
  candidate = null,
  selectedSlotId = null,
  onSlotClick,
  className,
}: FormationPitchProps) {
  const formation = getFormation(formationId);
  const benchSlots = getBenchSlots(benchSize);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-squad-border bg-pitch-stripes shadow-inner">
        <PitchMarkings />

        {formation.slots.map((slot) => (
          <div
            key={slot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
          >
            <SlotButton
              slot={slot}
              occupant={assignments[slot.id]}
              candidate={candidate}
              selected={selectedSlotId === slot.id}
              onSlotClick={onSlotClick}
            />
          </div>
        ))}
      </div>

      {benchSlots.length > 0 && (
        <div className="rounded-xl border border-squad-border bg-squad-panel/60 p-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Bench</p>
          <div className="flex flex-wrap gap-2">
            {benchSlots.map((slot) => (
              <SlotButton
                key={slot.id}
                slot={slot}
                occupant={assignments[slot.id]}
                candidate={candidate}
                selected={selectedSlotId === slot.id}
                onSlotClick={onSlotClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SlotButton({
  slot,
  occupant,
  candidate,
  selected,
  onSlotClick,
}: {
  slot: AnySlot;
  occupant?: FootballPlayer;
  candidate: Pick<FootballPlayer, "positions"> | null;
  selected: boolean;
  onSlotClick?: (slot: AnySlot) => void;
}) {
  const eligible = candidate ? isEligibleForSlot(candidate.positions, slot.position) : false;
  const clickable = Boolean(onSlotClick) && (!candidate || eligible) && !occupant;

  return (
    <button
      type="button"
      disabled={!clickable && Boolean(onSlotClick)}
      onClick={() => onSlotClick?.(slot)}
      className={cn(
        "group flex flex-col items-center gap-1",
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
            selected && "ring-2 ring-squad-accent",
            clickable && "group-hover:border-white group-hover:bg-white/10"
          )}
        >
          {slot.position === "SUB" ? "SUB" : slot.position}
        </span>
      )}
    </button>
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
