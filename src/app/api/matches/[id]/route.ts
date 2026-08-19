import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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
  if (match.player1Id !== session.user.id && match.player2Id !== session.user.id) {
    return NextResponse.json({ error: "Not a participant in this match" }, { status: 403 });
  }

  return NextResponse.json({
    id: match.id,
    status: match.status,
    formation1: match.formation1,
    formation2: match.formation2,
    player1: match.player1,
    player2: match.player2,
    viewerIsPlayer1: match.player1Id === session.user.id,
  });
}
