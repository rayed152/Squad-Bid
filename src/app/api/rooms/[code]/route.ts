import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const room = await prisma.room.findUnique({
    where: { code: params.code.toUpperCase() },
    include: {
      host: { select: { id: true, username: true, image: true, elo: true } },
      guest: { select: { id: true, username: true, image: true, elo: true } },
      match: { select: { id: true } },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.hostId !== session.user.id && room.guestId !== session.user.id) {
    return NextResponse.json({ error: "Not a participant in this room" }, { status: 403 });
  }

  return NextResponse.json({
    id: room.id,
    code: room.code,
    status: room.status,
    isPublic: room.isPublic,
    name: room.name,
    description: room.description,
    scheduledAt: room.scheduledAt,
    poolSize: room.poolPlayerIds.length,
    budget: room.budget,
    minimumBid: room.minimumBid,
    bidTimeSeconds: room.bidTimeSeconds,
    bidIncrement: room.bidIncrement,
    benchSize: room.benchSize,
    hostReady: room.hostReady,
    guestReady: room.guestReady,
    host: room.host,
    guest: room.guest,
    matchId: room.match?.id ?? null,
    viewerIsHost: room.hostId === session.user.id,
  });
}
