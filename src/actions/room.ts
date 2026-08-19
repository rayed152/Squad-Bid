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

async function createRoom(hostId: string, isPublic: boolean) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.room.create({
        data: { code: generateRoomCode(), hostId, isPublic },
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

/** "Play with Friends" — host a private room and hand back its join code. */
export async function createFriendRoom() {
  const userId = await requireUserId();
  const room = await createRoom(userId, false);
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
