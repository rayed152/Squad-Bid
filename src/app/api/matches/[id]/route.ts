import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidUserId } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getValidUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (match.player1Id !== userId && match.player2Id !== userId) {
    return NextResponse.json({ error: "Not a participant in this match" }, { status: 403 });
  }

  return NextResponse.json({
    id: match.id,
    status: match.status,
    formation1: match.formation1,
    formation2: match.formation2,
    player1: match.player1,
    player2: match.player2,
    viewerIsPlayer1: match.player1Id === userId,
  });
}
