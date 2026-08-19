import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    orderBy: { elo: "desc" },
    take: 50,
    select: { id: true, username: true, elo: true, wins: true, losses: true, draws: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Leaderboard</h1>
        <Link href="/menu" className="text-sm font-semibold text-squad-accent hover:underline">
          Back to menu
        </Link>
      </header>

      <ol className="flex flex-col gap-2">
        {users.map((user, i) => (
          <li
            key={user.id}
            className="flex items-center gap-3 rounded-lg border border-squad-border bg-squad-panel px-3 py-2"
          >
            <span className="w-6 shrink-0 text-center text-sm font-bold text-gray-500">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-100">
              {user.username}
            </span>
            <span className="shrink-0 text-xs text-gray-400">
              {user.wins}W {user.losses}L {user.draws}D
            </span>
            <span className="w-14 shrink-0 text-right text-sm font-bold text-squad-accent">
              {user.elo}
            </span>
          </li>
        ))}
        {users.length === 0 && <p className="text-sm text-gray-500">No players yet.</p>}
      </ol>
    </main>
  );
}
