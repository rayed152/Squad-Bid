"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FormationId } from "@/lib/formations";
import { FORMATIONS } from "@/lib/formations";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export async function submitFormation(matchId: string, formationId: FormationId) {
  const userId = await requireUserId();
  if (!(formationId in FORMATIONS)) {
    return { error: "Unknown formation" };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Match not found" };
  if (match.player1Id !== userId && match.player2Id !== userId) {
    return { error: "Not a participant in this match" };
  }

  const isPlayer1 = match.player1Id === userId;
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: isPlayer1 ? { formation1: formationId } : { formation2: formationId },
  });

  if (updated.formation1 && updated.formation2 && updated.status === "FORMATION_SELECT") {
    await prisma.match.update({ where: { id: matchId }, data: { status: "IN_PROGRESS" } });
  }

  return {};
}
