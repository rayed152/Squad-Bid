import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { MenuActions } from "@/components/menu/menu-actions";
import { SignOutButton } from "@/components/menu/sign-out-button";

export default async function MenuPage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { username: true, elo: true, wins: true, losses: true, draws: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Welcome back</p>
          <h1 className="text-2xl font-black text-white">{user.username}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {user.elo} ELO · {user.wins}W {user.losses}L {user.draws}D
          </p>
        </div>
        <SignOutButton />
      </header>

      <MenuActions />

      <nav className="flex gap-3 text-sm">
        <Link
          href="/profile"
          className="flex-1 rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-center font-semibold text-gray-200 transition hover:border-white/30"
        >
          My Stats
        </Link>
        <Link
          href="/leaderboard"
          className="flex-1 rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-center font-semibold text-gray-200 transition hover:border-white/30"
        >
          Leaderboard
        </Link>
      </nav>
    </main>
  );
}
