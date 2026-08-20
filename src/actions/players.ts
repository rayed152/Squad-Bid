"use server";

import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toFootballPlayer } from "@/lib/player-mapper";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }
  return session.user.id;
}

/** Distinct nationality/league/club values across the player pool, for filter dropdowns. */
export async function getPlayerFilterOptions() {
  await requireUserId();

  const [nationalities, leagues, clubLeaguePairs] = await Promise.all([
    prisma.player.findMany({
      distinct: ["nationality"],
      select: { nationality: true },
      orderBy: { nationality: "asc" },
    }),
    prisma.player.findMany({
      distinct: ["league"],
      select: { league: true },
      orderBy: { league: "asc" },
    }),
    // Each club sits in exactly one league in this dataset, so distinct-by-club
    // gives a clean club -> league mapping to drive the "clubs in this league" filter.
    prisma.player.findMany({
      distinct: ["club"],
      select: { club: true, league: true },
      orderBy: { club: "asc" },
    }),
  ]);

  const clubsByLeague: Record<string, string[]> = {};
  for (const { club, league } of clubLeaguePairs) {
    (clubsByLeague[league] ??= []).push(club);
  }

  return {
    nationalities: nationalities.map((n) => n.nationality),
    leagues: leagues.map((l) => l.league),
    clubs: clubLeaguePairs.map((c) => c.club),
    clubsByLeague,
  };
}

const PAGE_SIZE = 48;

export type PlayerSearchFilters = {
  query?: string;
  nationality?: string;
  league?: string;
  club?: string;
  page?: number;
};

/** Filtered, paginated player list for the lobby's player-manage picker. */
export async function searchPlayers(filters: PlayerSearchFilters) {
  await requireUserId();

  const page = Math.max(0, filters.page ?? 0);
  const where: Prisma.PlayerWhereInput = {
    ...(filters.query?.trim() ? { name: { contains: filters.query.trim(), mode: "insensitive" } } : {}),
    ...(filters.nationality ? { nationality: filters.nationality } : {}),
    ...(filters.league ? { league: filters.league } : {}),
    ...(filters.club ? { club: filters.club } : {}),
  };

  const [players, total] = await Promise.all([
    prisma.player.findMany({
      where,
      orderBy: [{ overall: "desc" }, { name: "asc" }],
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.player.count({ where }),
  ]);

  return {
    players: players.map(toFootballPlayer),
    total,
    page,
    pageSize: PAGE_SIZE,
  };
}

/** Total number of players matching a filter, without fetching rows — used for "select all filtered". */
export async function countFilteredPlayers(filters: Omit<PlayerSearchFilters, "page">) {
  await requireUserId();

  const where: Prisma.PlayerWhereInput = {
    ...(filters.query?.trim() ? { name: { contains: filters.query.trim(), mode: "insensitive" } } : {}),
    ...(filters.nationality ? { nationality: filters.nationality } : {}),
    ...(filters.league ? { league: filters.league } : {}),
    ...(filters.club ? { club: filters.club } : {}),
  };

  return prisma.player.count({ where });
}

/** All player ids matching a filter — used for "add all filtered" without paging through results. */
export async function getFilteredPlayerIds(filters: Omit<PlayerSearchFilters, "page">) {
  await requireUserId();

  const where: Prisma.PlayerWhereInput = {
    ...(filters.query?.trim() ? { name: { contains: filters.query.trim(), mode: "insensitive" } } : {}),
    ...(filters.nationality ? { nationality: filters.nationality } : {}),
    ...(filters.league ? { league: filters.league } : {}),
    ...(filters.club ? { club: filters.club } : {}),
  };

  const players = await prisma.player.findMany({ where, select: { id: true } });
  return players.map((p) => p.id);
}
