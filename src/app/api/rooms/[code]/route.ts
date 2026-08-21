import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidUserId } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const userId = await getValidUserId();
  if (!userId) {
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
  if (room.hostId !== userId && room.guestId !== userId) {
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
    viewerIsHost: room.hostId === userId,
  });
}
