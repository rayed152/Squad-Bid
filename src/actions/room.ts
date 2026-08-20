"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/room-code";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return session.user.id;
}

type RoomSettings = {
  budget?: number;
  minimumBid?: number;
  bidTimeSeconds?: number;
  bidIncrement?: number;
  benchSize?: number;
};

async function createRoom(hostId: string, isPublic: boolean, settings?: RoomSettings) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.room.create({
        data: {
          code: generateRoomCode(),
          hostId,
          isPublic,
          budget: settings?.budget,
          minimumBid: settings?.minimumBid,
          bidTimeSeconds: settings?.bidTimeSeconds,
          bidIncrement: settings?.bidIncrement,
          benchSize: settings?.benchSize,
        },
      });
    } catch (err) {
      // Unique constraint collision on `code` — extremely unlikely, just retry.
      if (attempt === 4) throw err;
    }
  }
  throw new Error("Failed to create room");
}

/** "Find Random Match" — join an open public room if one exists, otherwise host a new one. */
export async function findRandomMatch() {
  const userId = await requireUserId();

  for (let attempt = 0; attempt < 3; attempt++) {
    const openRoom = await prisma.room.findFirst({
      where: { isPublic: true, status: "WAITING", guestId: null, hostId: { not: userId } },
      orderBy: { createdAt: "asc" },
    });

    if (openRoom) {
      const claimed = await prisma.room.updateMany({
        where: { id: openRoom.id, guestId: null },
        data: { guestId: userId, status: "READY" },
      });
      if (claimed.count === 1) {
        redirect(`/room/${openRoom.code}`);
      }
      // Someone else claimed it between our read and write — try again.
      continue;
    }

    const room = await createRoom(userId, true);
    redirect(`/room/${room.code}`);
  }

  throw new Error("Could not find or create a match right now — try again.");
}

const MIN_BUDGET = 100;
const MAX_BUDGET = 10_000;
const MIN_MINIMUM_BID = 0;
const MAX_MINIMUM_BID = 5_000;
const MIN_BID_TIME = 5;
const MAX_BID_TIME = 60;
const MIN_BID_INCREMENT = 1;
const MAX_BID_INCREMENT = 500;
const MIN_BENCH_SIZE = 0;
const MAX_BENCH_SIZE = 10;

/** "Play with Friends" — host a private room, configured with the settings picked on the setup screen. */
export async function createFriendRoom(settings: {
  budget: number;
  minimumBid: number;
  bidTimeSeconds: number;
  bidIncrement: number;
  benchSize: number;
}) {
  const userId = await requireUserId();
  const { budget, minimumBid, bidTimeSeconds, bidIncrement, benchSize } = settings;

  if (!Number.isInteger(budget) || budget < MIN_BUDGET || budget > MAX_BUDGET) {
    return { error: `Starting coins must be between ${MIN_BUDGET} and ${MAX_BUDGET}` };
  }
  if (!Number.isInteger(minimumBid) || minimumBid < MIN_MINIMUM_BID || minimumBid > MAX_MINIMUM_BID) {
    return { error: `Minimum bid must be between ${MIN_MINIMUM_BID} and ${MAX_MINIMUM_BID}` };
  }
  if (!Number.isInteger(bidTimeSeconds) || bidTimeSeconds < MIN_BID_TIME || bidTimeSeconds > MAX_BID_TIME) {
    return { error: `Turn time must be between ${MIN_BID_TIME} and ${MAX_BID_TIME} seconds` };
  }
  if (!Number.isInteger(bidIncrement) || bidIncrement < MIN_BID_INCREMENT || bidIncrement > MAX_BID_INCREMENT) {
    return { error: `Minimum raise must be between ${MIN_BID_INCREMENT} and ${MAX_BID_INCREMENT}` };
  }
  if (!Number.isInteger(benchSize) || benchSize < MIN_BENCH_SIZE || benchSize > MAX_BENCH_SIZE) {
    return { error: `Bench size must be between ${MIN_BENCH_SIZE} and ${MAX_BENCH_SIZE}` };
  }

  const room = await createRoom(userId, false, { budget, minimumBid, bidTimeSeconds, bidIncrement, benchSize });
  redirect(`/room/${room.code}`);
}

export async function joinRoomByCode(code: string) {
  const userId = await requireUserId();
  const normalized = code.trim().toUpperCase();

  const room = await prisma.room.findUnique({ where: { code: normalized } });
  if (!room) {
    return { error: "No room found with that code" };
  }
  if (room.hostId === userId) {
    redirect(`/room/${room.code}`);
  }
  if (room.guestId && room.guestId !== userId) {
    return { error: "That room is already full" };
  }

  if (!room.guestId) {
    const claimed = await prisma.room.updateMany({
      where: { id: room.id, guestId: null },
      data: { guestId: userId, status: "READY" },
    });
    if (claimed.count !== 1) {
      return { error: "That room was just claimed by someone else" };
    }
  }

  redirect(`/room/${room.code}`);
}

export async function setReady(roomId: string, ready: boolean) {
  const userId = await requireUserId();

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || (room.hostId !== userId && room.guestId !== userId)) {
    throw new Error("Not a participant in this room");
  }

  const isHost = room.hostId === userId;
  const updated = await prisma.room.update({
    where: { id: roomId },
    data: isHost ? { hostReady: ready } : { guestReady: ready },
  });

  if (updated.hostReady && updated.guestReady && updated.guestId && updated.status !== "IN_PROGRESS") {
    const match = await prisma.match.create({
      data: {
        roomId: updated.id,
        player1Id: updated.hostId,
        player2Id: updated.guestId,
        budget: updated.budget,
        minimumBid: updated.minimumBid,
        bidTimeSeconds: updated.bidTimeSeconds,
        bidIncrement: updated.bidIncrement,
        benchSize: updated.benchSize,
      },
    });
    await prisma.room.update({ where: { id: roomId }, data: { status: "IN_PROGRESS" } });
    return { matchId: match.id };
  }

  return {};
}

export async function leaveRoom(roomId: string) {
  const userId = await requireUserId();
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return;

  if (room.status === "IN_PROGRESS") return; // match already underway, nothing to do here

  if (room.hostId === userId) {
    await prisma.room.update({ where: { id: roomId }, data: { status: "CLOSED" } });
  } else if (room.guestId === userId) {
    await prisma.room.update({
      where: { id: roomId },
      data: { guestId: null, guestReady: false, status: "WAITING" },
    });
  }
}
