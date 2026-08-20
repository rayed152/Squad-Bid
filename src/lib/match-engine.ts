import type { Match, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getFormation, getAllSlots, type FormationId } from "@/lib/formations";
import { isEligibleForSlot } from "@/lib/positions";
import { applyEloAndRecord } from "@/lib/elo";

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
 *
 * There's no fixed round cap — the match keeps popping players until both
 * squads are completely full (or the player pool runs dry, as a safety net).
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

    if (await bothSquadsFull(match)) {
      await completeMatch(match.id);
    } else {
      await startRound(match, latestRound.roundNumber + 1);
    }
  }
}

async function bothSquadsFull(match: Match): Promise<boolean> {
  if (!match.formation1 || !match.formation2) return false;

  // Includes bench slots — a match shouldn't end while there's still bench
  // capacity a player could have used to absorb a duplicate-position bid.
  const slots1 = getAllSlots(match.formation1 as FormationId, match.benchSize).length;
  const slots2 = getAllSlots(match.formation2 as FormationId, match.benchSize).length;

  const [count1, count2] = await Promise.all([
    prisma.matchSquad.count({ where: { matchId: match.id, userId: match.player1Id } }),
    prisma.matchSquad.count({ where: { matchId: match.id, userId: match.player2Id } }),
  ]);

  return count1 >= slots1 && count2 >= slots2;
}

async function startRound(match: Match, roundNumber: number) {
  const usedPlayerIds = (
    await prisma.matchRound.findMany({ where: { matchId: match.id }, select: { playerId: true } })
  ).map((r) => r.playerId);

  // Empty poolPlayerIds means "all players" (the original, unrestricted behavior).
  const where: Prisma.PlayerWhereInput = {
    ...(usedPlayerIds.length ? { id: { notIn: usedPlayerIds } } : {}),
    ...(match.poolPlayerIds.length ? { id: { in: match.poolPlayerIds } } : {}),
  };

  const poolSize = await prisma.player.count({ where });
  if (poolSize === 0) {
    await completeMatch(match.id);
    return;
  }

  const skip = Math.floor(Math.random() * poolSize);
  const player = await prisma.player.findFirst({ where, skip });
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
        biddingEndsAt: new Date(Date.now() + match.bidTimeSeconds * 1000),
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

  // Deliberately the starting XI only, not bench slots — bench absorbs
  // duplicate-position wins without inflating a squad's average rating.
  const xiSlotIds1 = new Set(
    (match.formation1 ? getFormation(match.formation1 as FormationId).slots : []).map((s) => s.id)
  );
  const xiSlotIds2 = new Set(
    (match.formation2 ? getFormation(match.formation2 as FormationId).slots : []).map((s) => s.id)
  );
  const score1 =
    squads
      .filter((s) => s.userId === match.player1Id && xiSlotIds1.has(s.assignedPosition))
      .reduce((sum, s) => sum + s.player.overall, 0) / (xiSlotIds1.size || 11);
  const score2 =
    squads
      .filter((s) => s.userId === match.player2Id && xiSlotIds2.has(s.assignedPosition))
      .reduce((sum, s) => sum + s.player.overall, 0) / (xiSlotIds2.size || 11);

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

  const slots = getAllSlots(formationId, match.benchSize);
  const filled = await prisma.matchSquad.findMany({
    where: { matchId: match.id, userId },
    select: { assignedPosition: true },
  });
  const filledSet = new Set(filled.map((f) => f.assignedPosition));

  return slots.filter(
    (slot) => !filledSet.has(slot.id) && isEligibleForSlot(playerPositions, slot.position)
  );
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";
}
