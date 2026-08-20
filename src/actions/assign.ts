"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllSlots, type FormationId } from "@/lib/formations";
import { isEligibleForSlot } from "@/lib/positions";
import { ensureMatchProgress } from "@/lib/match-engine";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function assignSlot(matchRoundId: string, slotId: string) {
  const userId = await requireUserId();

  const round = await prisma.matchRound.findUnique({
    where: { id: matchRoundId },
    include: { match: true, player: true },
  });
  if (!round) return { error: "Round not found" };
  if (round.status !== "RESOLVED" || round.winnerId !== userId) {
    return { error: "You didn't win this round" };
  }

  const existing = await prisma.matchSquad.findFirst({ where: { matchRoundId } });
  if (existing) return { error: "This round has already been assigned" };

  const formationId = (
    userId === round.match.player1Id ? round.match.formation1 : round.match.formation2
  ) as FormationId | null;
  if (!formationId) return { error: "No formation set" };

  const slots = getAllSlots(formationId, round.match.benchSize);
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return { error: "Invalid slot" };
  if (!isEligibleForSlot(round.player.positions, slot.position)) {
    return { error: `${round.player.name} isn't eligible for ${slot.position}` };
  }

  const filled = await prisma.matchSquad.findFirst({
    where: { matchId: round.matchId, userId, assignedPosition: slotId },
  });
  if (filled) return { error: "That slot is already filled" };

  await prisma.matchSquad.create({
    data: {
      matchId: round.matchId,
      userId,
      playerId: round.playerId,
      matchRoundId: round.id,
      assignedPosition: slotId,
      roundNumber: round.roundNumber,
      bidAmount: round.winningBid,
    },
  });

  await ensureMatchProgress(round.matchId);
  return {};
}
