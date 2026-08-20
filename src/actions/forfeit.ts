"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFormation, type FormationId } from "@/lib/formations";
import { applyEloAndRecord } from "@/lib/elo";

export async function forfeitMatch(matchId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Match not found" };
  if (match.player1Id !== userId && match.player2Id !== userId) {
    return { error: "Not a participant in this match" };
  }
  if (match.status !== "IN_PROGRESS") {
    return { error: "This match has already ended" };
  }

  const winnerId = userId === match.player1Id ? match.player2Id : match.player1Id;

  const squads = await prisma.matchSquad.findMany({ where: { matchId }, include: { player: true } });
  const totalSlots = match.formation1 ? getFormation(match.formation1 as FormationId).slots.length : 11;
  const player1Score =
    squads.filter((s) => s.userId === match.player1Id).reduce((sum, s) => sum + s.player.overall, 0) /
    totalSlots;
  const player2Score =
    squads.filter((s) => s.userId === match.player2Id).reduce((sum, s) => sum + s.player.overall, 0) /
    totalSlots;

  const updated = await prisma.match.updateMany({
    where: { id: matchId, status: "IN_PROGRESS" },
    data: { status: "COMPLETED", completedAt: new Date(), winnerId, player1Score, player2Score },
  });

  if (updated.count === 1) {
    await applyEloAndRecord(match.player1Id, match.player2Id, winnerId);
  }

  return {};
}
