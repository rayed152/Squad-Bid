"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { ensureMatchProgress, getOpenEligibleSlots, resolveRoundAsPass } from "@/lib/match-engine";
import { getBidWindowMs } from "@/lib/match-config";

async function loadActiveRound(matchRoundId: string, userId: string) {
  const round = await prisma.matchRound.findUnique({
    where: { id: matchRoundId },
    include: { match: true, player: true },
  });
  if (!round) return { error: "Round not found" as const };

  const { match } = round;
  if (match.player1Id !== userId && match.player2Id !== userId) {
    return { error: "Not a participant in this match" as const };
  }
  if (round.status !== "BIDDING") {
    return { error: "Bidding has closed for this round" as const };
  }
  if (round.biddingEndsAt && Date.now() >= round.biddingEndsAt.getTime()) {
    return { error: "Time's up for this turn" as const };
  }
  // Before anyone's bid, turnUserId is null and either player may open. Once
  // someone bids, it's set to whoever must respond next.
  if (round.turnUserId !== null && round.turnUserId !== userId) {
    return { error: "It's not your turn" as const };
  }

  return { round };
}

export async function submitBid(matchRoundId: string, amount: number) {
  const userId = await requireUserId();

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "Enter a positive whole number of coins" };
  }

  const loaded = await loadActiveRound(matchRoundId, userId);
  if ("error" in loaded) return { error: loaded.error };
  const { round } = loaded;
  const { match } = round;

  const openSlots = await getOpenEligibleSlots(match, userId, round.player.positions);
  if (openSlots.length === 0) {
    return { error: `You have no open slot for a ${round.player.positions.join("/")} player` };
  }

  const currentHigh = round.winningBid;
  if (currentHigh === null) {
    if (amount < match.minimumBid) {
      return { error: `Minimum opening bid for this match is ${match.minimumBid} coins` };
    }
  } else if (amount < currentHigh + match.bidIncrement) {
    return { error: `You must raise by at least ${match.bidIncrement} coins (to ${currentHigh + match.bidIncrement}+)` };
  }

  const spent = await prisma.matchRound.aggregate({
    _sum: { winningBid: true },
    where: { matchId: match.id, winnerId: userId },
  });
  const remaining = match.budget - (spent._sum.winningBid ?? 0);
  if (amount > remaining) {
    return { error: `You only have ${remaining} coins left` };
  }

  const otherUserId = userId === match.player1Id ? match.player2Id : match.player1Id;
  const bidCount = await prisma.bid.count({ where: { matchRoundId } });

  // Guard against a race where both players try to open the same round at once —
  // only apply this bid if the round's state hasn't moved since we validated it.
  const applied = await prisma.matchRound.updateMany({
    where: { id: matchRoundId, status: "BIDDING", winningBid: currentHigh, turnUserId: round.turnUserId },
    data: {
      winnerId: userId,
      winningBid: amount,
      turnUserId: otherUserId,
      biddingEndsAt: new Date(Date.now() + getBidWindowMs(bidCount + 1, match.bidTimeSeconds * 1000)),
    },
  });
  if (applied.count === 0) {
    return { error: "Someone else just bid — check the current bid and try again" };
  }

  await prisma.bid.create({ data: { matchRoundId, userId, amount } });
  await ensureMatchProgress(match.id);
  return {};
}

/** Decline to raise — ends the auction in the other player's favor (or unclaimed, if nobody's bid yet). */
export async function passBid(matchRoundId: string) {
  const userId = await requireUserId();

  const loaded = await loadActiveRound(matchRoundId, userId);
  if ("error" in loaded) return { error: loaded.error };
  if (loaded.round.turnUserId === null) {
    return { error: "Nobody's opened the bidding yet — place a bid or let the clock run out" };
  }

  await resolveRoundAsPass(matchRoundId);
  await ensureMatchProgress(loaded.round.match.id);
  return {};
}
