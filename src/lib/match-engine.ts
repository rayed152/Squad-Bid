import type { Match } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getFormation, type FormationId } from "@/lib/formations";
import { isEligibleForSlot } from "@/lib/positions";
import { applyEloAndRecord } from "@/lib/elo";
import { INITIAL_BID_WINDOW_MS } from "@/lib/match-config";

/**
 * Lazily advances a match's round state. There's no background scheduler —
 * this is called from every state-reading API request instead, so whichever
 * player polls next (or bids / passes / picks a slot) is the one who ticks
 * the match forward. Every step here is written to be safe if two requests
 * from the two players race to call it at the same moment.
 *
 * Bidding is a turn-based ascending auction: on each round, one player is
 * on the clock and must either raise the current high bid or pass. Passing
 * (or letting the clock run out) resolves the round in the other player's
 * favor at whatever they last bid — or leaves it unclaimed if nobody ever
 * bid at all.
 */
export async function ensureMatchProgress(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.status !== "IN_PROGRESS") return;

  const latestRound = await prisma.matchRound.findFirst({
    where: { matchId },
    orderBy: { roundNumber: "desc" },
    include: { player: true },
  });

  if (!latestRound) {
    await startRound(match, 1);
    return;
  }

  if (latestRound.status === "BIDDING") {
    const expired = latestRound.biddingEndsAt
      ? Date.now() >= latestRound.biddingEndsAt.getTime()
      : false;
    // The player on the clock ran out of time — treat it as a pass.
    if (expired) {
      await resolveRoundAsPass(latestRound.id);
    }
    return;
  }

  if (latestRound.status === "RESOLVED") {
    if (latestRound.winnerId) {
      const assigned = await prisma.matchSquad.findFirst({
        where: { matchRoundId: latestRound.id },
      });
      if (!assigned) {
        const openSlots = await getOpenEligibleSlots(
          match,
          latestRound.winnerId,
          latestRound.player.positions
        );
        // Winner still has somewhere to put this player — wait for assignSlot().
        if (openSlots.length > 0) return;
      }
    }

    if (latestRound.roundNumber >= match.totalRounds) {
      await completeMatch(match.id);
    } else {
      await startRound(match, latestRound.roundNumber + 1);
    }
  }
}

async function startRound(match: Match, roundNumber: number) {
  const usedPlayerIds = (
    await prisma.matchRound.findMany({ where: { matchId: match.id }, select: { playerId: true } })
  ).map((r) => r.playerId);

  const poolSize = await prisma.player.count({
    where: usedPlayerIds.length ? { id: { notIn: usedPlayerIds } } : undefined,
  });
  if (poolSize === 0) {
    await completeMatch(match.id);
    return;
  }

  const skip = Math.floor(Math.random() * poolSize);
  const player = await prisma.player.findFirst({
    where: usedPlayerIds.length ? { id: { notIn: usedPlayerIds } } : undefined,
    skip,
  });
  if (!player) return;

  try {
    await prisma.matchRound.create({
      data: {
        matchId: match.id,
        roundNumber,
        playerId: player.id,
        status: "BIDDING",
        // No turnUserId yet — either player may place the opening bid. Once
        // someone does, it becomes strictly alternating raise-or-pass.
        turnUserId: null,
        biddingEndsAt: new Date(Date.now() + INITIAL_BID_WINDOW_MS),
      },
    });
  } catch (err) {
    // Unique (matchId, roundNumber) collision — the other player's poll won the race to start this round.
    if (!isUniqueConstraintError(err)) throw err;
  }
}

/** Ends a round's auction in favor of whoever's currently the high bidder (or unclaimed, if nobody ever bid). */
export async function resolveRoundAsPass(matchRoundId: string) {
  await prisma.matchRound.updateMany({
    where: { id: matchRoundId, status: "BIDDING" },
    data: { status: "RESOLVED", turnUserId: null },
  });
}

async function completeMatch(matchId: string) {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
  if (match.status === "COMPLETED") return;

  const squads = await prisma.matchSquad.findMany({
    where: { matchId },
    include: { player: true },
  });

  const totalSlots = match.formation1 ? getFormation(match.formation1 as FormationId).slots.length : 11;

  const score1 =
    squads.filter((s) => s.userId === match.player1Id).reduce((sum, s) => sum + s.player.overall, 0) /
    totalSlots;
  const score2 =
    squads.filter((s) => s.userId === match.player2Id).reduce((sum, s) => sum + s.player.overall, 0) /
    totalSlots;

  let winnerId: string | null = null;
  if (score1 > score2) winnerId = match.player1Id;
  else if (score2 > score1) winnerId = match.player2Id;

  const updated = await prisma.match.updateMany({
    where: { id: matchId, status: "IN_PROGRESS" },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      player1Score: score1,
      player2Score: score2,
      winnerId,
    },
  });

  // Only the request that actually flipped the status applies the ELO update, avoiding a double-award race.
  if (updated.count === 1) {
    await applyEloAndRecord(match.player1Id, match.player2Id, winnerId);
  }
}

export async function getOpenEligibleSlots(match: Match, userId: string, playerPositions: string[]) {
  const formationId = (userId === match.player1Id ? match.formation1 : match.formation2) as
    | FormationId
    | null;
  if (!formationId) return [];

  const formation = getFormation(formationId);
  const filled = await prisma.matchSquad.findMany({
    where: { matchId: match.id, userId },
    select: { assignedPosition: true },
  });
  const filledSet = new Set(filled.map((f) => f.assignedPosition));

  return formation.slots.filter(
    (slot) => !filledSet.has(slot.id) && isEligibleForSlot(playerPositions, slot.position)
  );
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";
}
