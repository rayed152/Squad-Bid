import { prisma } from "@/lib/prisma";

const K_FACTOR = 32;

/** Applies an ELO update and win/loss/draw record after a completed match. `winnerId` null means a draw. */
export async function applyEloAndRecord(
  player1Id: string,
  player2Id: string,
  winnerId: string | null
) {
  const [p1, p2] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: player1Id } }),
    prisma.user.findUniqueOrThrow({ where: { id: player2Id } }),
  ]);

  const expected1 = 1 / (1 + 10 ** ((p2.elo - p1.elo) / 400));
  const expected2 = 1 - expected1;

  const score1 = winnerId === player1Id ? 1 : winnerId === player2Id ? 0 : 0.5;
  const score2 = 1 - score1;

  const newElo1 = Math.round(p1.elo + K_FACTOR * (score1 - expected1));
  const newElo2 = Math.round(p2.elo + K_FACTOR * (score2 - expected2));

  await prisma.$transaction([
    prisma.user.update({
      where: { id: player1Id },
      data: {
        elo: newElo1,
        wins: { increment: score1 === 1 ? 1 : 0 },
        losses: { increment: score1 === 0 ? 1 : 0 },
        draws: { increment: score1 === 0.5 ? 1 : 0 },
      },
    }),
    prisma.user.update({
      where: { id: player2Id },
      data: {
        elo: newElo2,
        wins: { increment: score2 === 1 ? 1 : 0 },
        losses: { increment: score2 === 0 ? 1 : 0 },
        draws: { increment: score2 === 0.5 ? 1 : 0 },
      },
    }),
  ]);
}
