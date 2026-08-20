import type { Player as PrismaPlayer } from "@prisma/client";
import type { Position } from "@/lib/positions";
import type { FootballPlayer } from "@/types/player";

export function toFootballPlayer(player: PrismaPlayer): FootballPlayer {
  return {
    id: player.id,
    name: player.name,
    nationality: player.nationality,
    overall: player.overall,
    positions: player.positions as Position[],
    pace: player.pace,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
    physical: player.physical,
    imageUrl: player.imageUrl,
  };
}
