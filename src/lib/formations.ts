import type { Position, SlotPosition } from "./positions";

export type FormationSlot = {
  /** Stable id for this slot within the formation, e.g. "cb-1". */
  id: string;
  position: Position;
  /** Pitch coordinates as percentages, 0-100, origin at the defensive (own) end. */
  x: number;
  y: number;
};

/** A bench slot — no pitch coordinates, since it renders off-field. Accepts any position. */
export type BenchSlot = {
  id: string;
  position: "SUB";
};

export type AnySlot = FormationSlot | BenchSlot;

/** Generates the host-configured number of bench slots, e.g. "sub-1", "sub-2". */
export function getBenchSlots(benchSize: number): BenchSlot[] {
  return Array.from({ length: Math.max(0, benchSize) }, (_, i) => ({
    id: `sub-${i + 1}`,
    position: "SUB" as const,
  }));
}

/** Every slot a squad has to fill: the formation's starting XI plus any configured bench. */
export function getAllSlots(formationId: FormationId, benchSize: number): AnySlot[] {
  return [...getFormation(formationId).slots, ...getBenchSlots(benchSize)];
}

export type FormationId = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1" | "5-3-2";

export type Formation = {
  id: FormationId;
  label: string;
  slots: FormationSlot[];
};

export const FORMATIONS: Record<FormationId, Formation> = {
  "4-3-3": {
    id: "4-3-3",
    label: "4-3-3",
    slots: [
      { id: "gk", position: "GK", x: 50, y: 5 },
      { id: "lb", position: "LB", x: 15, y: 22 },
      { id: "cb-1", position: "CB", x: 37, y: 18 },
      { id: "cb-2", position: "CB", x: 63, y: 18 },
      { id: "rb", position: "RB", x: 85, y: 22 },
      { id: "cm-1", position: "CM", x: 30, y: 45 },
      { id: "cm-2", position: "CM", x: 50, y: 40 },
      { id: "cm-3", position: "CM", x: 70, y: 45 },
      { id: "lw", position: "LW", x: 18, y: 75 },
      { id: "st", position: "ST", x: 50, y: 82 },
      { id: "rw", position: "RW", x: 82, y: 75 },
    ],
  },
  "4-4-2": {
    id: "4-4-2",
    label: "4-4-2",
    slots: [
      { id: "gk", position: "GK", x: 50, y: 5 },
      { id: "lb", position: "LB", x: 15, y: 22 },
      { id: "cb-1", position: "CB", x: 37, y: 18 },
      { id: "cb-2", position: "CB", x: 63, y: 18 },
      { id: "rb", position: "RB", x: 85, y: 22 },
      { id: "lm", position: "LM", x: 15, y: 50 },
      { id: "cm-1", position: "CM", x: 40, y: 47 },
      { id: "cm-2", position: "CM", x: 60, y: 47 },
      { id: "rm", position: "RM", x: 85, y: 50 },
      { id: "st-1", position: "ST", x: 38, y: 82 },
      { id: "st-2", position: "ST", x: 62, y: 82 },
    ],
  },
  "3-5-2": {
    id: "3-5-2",
    label: "3-5-2",
    slots: [
      { id: "gk", position: "GK", x: 50, y: 5 },
      { id: "cb-1", position: "CB", x: 25, y: 18 },
      { id: "cb-2", position: "CB", x: 50, y: 15 },
      { id: "cb-3", position: "CB", x: 75, y: 18 },
      { id: "lwb", position: "LWB", x: 10, y: 45 },
      { id: "cdm", position: "CDM", x: 50, y: 38 },
      { id: "cm-1", position: "CM", x: 35, y: 50 },
      { id: "cm-2", position: "CM", x: 65, y: 50 },
      { id: "rwb", position: "RWB", x: 90, y: 45 },
      { id: "st-1", position: "ST", x: 38, y: 82 },
      { id: "st-2", position: "ST", x: 62, y: 82 },
    ],
  },
  "4-2-3-1": {
    id: "4-2-3-1",
    label: "4-2-3-1",
    slots: [
      { id: "gk", position: "GK", x: 50, y: 5 },
      { id: "lb", position: "LB", x: 15, y: 22 },
      { id: "cb-1", position: "CB", x: 37, y: 18 },
      { id: "cb-2", position: "CB", x: 63, y: 18 },
      { id: "rb", position: "RB", x: 85, y: 22 },
      { id: "cdm-1", position: "CDM", x: 38, y: 38 },
      { id: "cdm-2", position: "CDM", x: 62, y: 38 },
      { id: "lw", position: "LW", x: 18, y: 62 },
      { id: "cam", position: "CAM", x: 50, y: 60 },
      { id: "rw", position: "RW", x: 82, y: 62 },
      { id: "st", position: "ST", x: 50, y: 85 },
    ],
  },
  "5-3-2": {
    id: "5-3-2",
    label: "5-3-2",
    slots: [
      { id: "gk", position: "GK", x: 50, y: 5 },
      { id: "lwb", position: "LWB", x: 8, y: 25 },
      { id: "cb-1", position: "CB", x: 28, y: 16 },
      { id: "cb-2", position: "CB", x: 50, y: 13 },
      { id: "cb-3", position: "CB", x: 72, y: 16 },
      { id: "rwb", position: "RWB", x: 92, y: 25 },
      { id: "cm-1", position: "CM", x: 30, y: 50 },
      { id: "cm-2", position: "CM", x: 50, y: 45 },
      { id: "cm-3", position: "CM", x: 70, y: 50 },
      { id: "st-1", position: "ST", x: 38, y: 82 },
      { id: "st-2", position: "ST", x: 62, y: 82 },
    ],
  },
};

export const FORMATION_LIST = Object.values(FORMATIONS);

export function getFormation(id: FormationId): Formation {
  return FORMATIONS[id];
}
