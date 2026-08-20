"use client";

import { useMemo, useState } from "react";
import { FormationPitch } from "@/components/formation-pitch";
import { PlayerCard } from "@/components/player-card";
import { FORMATION_LIST, type FormationId } from "@/lib/formations";
import type { AnySlot } from "@/lib/formations";
import { isEligibleForSlot } from "@/lib/positions";
import type { FootballPlayer } from "@/types/player";

const SAMPLE_POOL: FootballPlayer[] = [
  {
    id: "1",
    name: "Lionel Messi",
    nationality: "Argentina",
    overall: 90,
    positions: ["RW", "CAM"],
    pace: 80,
    shooting: 88,
    passing: 90,
    dribbling: 94,
    defending: 34,
    physical: 65,
  },
  {
    id: "2",
    name: "Virgil van Dijk",
    nationality: "Netherlands",
    overall: 89,
    positions: ["CB"],
    pace: 78,
    shooting: 60,
    passing: 71,
    dribbling: 72,
    defending: 90,
    physical: 86,
  },
  {
    id: "3",
    name: "Kylian Mbappe",
    nationality: "France",
    overall: 91,
    positions: ["ST", "LW"],
    pace: 97,
    shooting: 89,
    passing: 80,
    dribbling: 92,
    defending: 36,
    physical: 76,
  },
];

export default function ComponentPreview() {
  const [formationId, setFormationId] = useState<FormationId>("4-3-3");
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [assignments, setAssignments] = useState<Partial<Record<string, FootballPlayer>>>({});

  const candidate = SAMPLE_POOL[candidateIndex];

  const isSquadFull = useMemo(() => {
    const formation = FORMATION_LIST.find((f) => f.id === formationId);
    return formation ? formation.slots.every((slot) => assignments[slot.id]) : false;
  }, [assignments, formationId]);

  function handleSlotClick(slot: AnySlot) {
    if (assignments[slot.id]) return;
    if (!isEligibleForSlot(candidate.positions, slot.position)) return;

    setAssignments((prev) => ({ ...prev, [slot.id]: candidate }));
    setCandidateIndex((i) => (i + 1) % SAMPLE_POOL.length);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-white">SquadBid</h1>
        <p className="text-sm text-gray-400">
          Formation + PlayerCard component preview — click an open slot the highlighted candidate is eligible for.
        </p>
      </header>

      <section className="flex flex-wrap gap-2">
        {FORMATION_LIST.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFormationId(f.id);
              setAssignments({});
              setCandidateIndex(0);
            }}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
              f.id === formationId
                ? "border-squad-accent bg-squad-accent/20 text-squad-accent"
                : "border-squad-border bg-squad-panel text-gray-300 hover:border-white/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
        <FormationPitch
          formationId={formationId}
          assignments={assignments}
          candidate={isSquadFull ? null : candidate}
          onSlotClick={handleSlotClick}
        />

        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {isSquadFull ? "Squad complete" : "Incoming player"}
          </span>
          {isSquadFull ? (
            <p className="text-center text-sm text-gray-400">
              Every slot in this formation is filled.
            </p>
          ) : (
            <PlayerCard player={candidate} highlightPositions={candidate.positions} />
          )}
        </div>
      </div>
    </main>
  );
}
