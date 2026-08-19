import type { Position } from "@/lib/positions";

export type PlayerStats = {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};

export type FootballPlayer = PlayerStats & {
  id: string;
  name: string;
  nationality: string;
  overall: number;
  positions: Position[];
  imageUrl?: string | null;
};
