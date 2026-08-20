import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureMatchProgress } from "@/lib/match-engine";
import { toFootballPlayer } from "@/lib/player-mapper";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  await ensureMatchProgress(params.id);

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
      squads: { include: { player: true } },
      rounds: {
        orderBy: { roundNumber: "desc" },
        take: 1,
        include: { player: true, bids: true },
      },
    },
  });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (match.player1Id !== userId && match.player2Id !== userId) {
    return NextResponse.json({ error: "Not a participant in this match" }, { status: 403 });
  }

  const viewerIsPlayer1 = match.player1Id === userId;
  const opponentId = viewerIsPlayer1 ? match.player2Id : match.player1Id;

  const spentByUser = (uid: string) =>
    match.squads.filter((s) => s.userId === uid).reduce((sum, s) => sum + (s.bidAmount ?? 0), 0);

  const round = match.rounds[0] ?? null;

  const awaitingSlotFrom =
    round?.status === "RESOLVED" && round.winnerId && !match.squads.some((s) => s.matchRoundId === round.id)
      ? round.winnerId
      : null;

  return NextResponse.json({
    id: match.id,
    status: match.status,
    formation1: match.formation1,
    formation2: match.formation2,
    budget: match.budget,
    minimumBid: match.minimumBid,
    bidTimeSeconds: match.bidTimeSeconds,
    bidIncrement: match.bidIncrement,
    benchSize: match.benchSize,
    player1: match.player1,
    player2: match.player2,
    viewerIsPlayer1,
    player1Score: match.player1Score,
    player2Score: match.player2Score,
    winnerId: match.winnerId,
    squads: match.squads.map((s) => ({
      userId: s.userId,
      assignedPosition: s.assignedPosition,
      player: toFootballPlayer(s.player),
    })),
    myBudgetRemaining: match.budget - spentByUser(userId),
    opponentBudgetRemaining: match.budget - spentByUser(opponentId),
    round: round && {
      id: round.id,
      roundNumber: round.roundNumber,
      status: round.status,
      biddingEndsAt: round.biddingEndsAt,
      bidCount: round.bids.length,
      player: toFootballPlayer(round.player),
      turnUserId: round.turnUserId,
      // Before anyone's bid, turnUserId is null and either player may open.
      isMyTurn: round.status === "BIDDING" && (round.turnUserId === userId || round.turnUserId === null),
      highBid: round.winningBid,
      highBidderId: round.winnerId,
      awaitingSlotFrom,
    },
  });
}
