import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [user, matches] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { username: true, elo: true, wins: true, losses: true, draws: true, createdAt: true },
    }),
    prisma.match.findMany({
      where: {
        status: "COMPLETED",
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
      orderBy: { completedAt: "desc" },
      take: 20,
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">{user.username}</h1>
        <Link href="/menu" className="text-sm font-semibold text-squad-accent hover:underline">
          Back to menu
        </Link>
      </header>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="ELO" value={user.elo} />
        <Stat label="Wins" value={user.wins} />
        <Stat label="Losses" value={user.losses} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
          Match history
        </h2>
        <ul className="flex flex-col gap-2">
          {matches.map((match) => {
            const opponent = match.player1Id === userId ? match.player2 : match.player1;
            const myScore = match.player1Id === userId ? match.player1Score : match.player2Score;
            const theirScore = match.player1Id === userId ? match.player2Score : match.player1Score;
            const result =
              match.winnerId === userId ? "Win" : match.winnerId ? "Loss" : "Draw";

            return (
              <li
                key={match.id}
                className="flex items-center justify-between rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-sm"
              >
                <span className="font-semibold text-gray-100">vs {opponent.username}</span>
                <span className="text-xs text-gray-400">
                  {myScore?.toFixed(1) ?? "–"} : {theirScore?.toFixed(1) ?? "–"}
                </span>
                <span
                  className={
                    result === "Win"
                      ? "font-bold text-squad-accent"
                      : result === "Loss"
                        ? "font-bold text-rose-400"
                        : "font-bold text-gray-400"
                  }
                >
                  {result}
                </span>
              </li>
            );
          })}
          {matches.length === 0 && (
            <p className="text-sm text-gray-500">No completed matches yet.</p>
          )}
        </ul>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-squad-border bg-squad-panel py-3">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}
