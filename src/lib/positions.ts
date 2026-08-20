// Canonical position codes used across formations, players, and slots.
export const POSITIONS = [
  "GK",
  "CB",
  "LB",
  "RB",
  "LWB",
  "RWB",
  "CDM",
  "CM",
  "CAM",
  "LM",
  "RM",
  "LW",
  "RW",
  "CF",
  "ST",
] as const;

export type Position = (typeof POSITIONS)[number];

/** A formation slot is either a real position, or a bench slot that accepts any player. */
export type SlotPosition = Position | "SUB";

// Positions a footballer listed for one slot is also eligible to fill,
// e.g. a player marked "CM" can also drop into a CDM or CAM slot.
export const POSITION_COMPATIBILITY: Record<Position, Position[]> = {
  GK: ["GK"],
  CB: ["CB"],
  LB: ["LB", "LWB"],
  RB: ["RB", "RWB"],
  LWB: ["LWB", "LB", "LM"],
  RWB: ["RWB", "RB", "RM"],
  CDM: ["CDM", "CM"],
  CM: ["CM", "CDM", "CAM"],
  CAM: ["CAM", "CM"],
  LM: ["LM", "LWB", "LW"],
  RM: ["RM", "RWB", "RW"],
  LW: ["LW", "LM", "CF"],
  RW: ["RW", "RM", "CF"],
  CF: ["CF", "ST", "CAM"],
  ST: ["ST", "CF"],
};

/** Whether a footballer's listed positions make them eligible for a given slot. Bench ("SUB") slots take anyone. */
export function isEligibleForSlot(playerPositions: string[], slotPosition: SlotPosition): boolean {
  if (slotPosition === "SUB") return true;
  return playerPositions.some((pos) => {
    const compat = POSITION_COMPATIBILITY[pos as Position];
    return compat?.includes(slotPosition);
  });
}
