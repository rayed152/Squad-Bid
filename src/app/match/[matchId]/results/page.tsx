import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FormationPitch } from "@/components/formation-pitch";
import { toFootballPlayer } from "@/lib/player-mapper";
import type { FormationId } from "@/lib/formations";

export default async function ResultsPage({ params }: { params: { matchId: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
      squads: { include: { player: true } },
    },
  });

  if (!match) notFound();
  if (match.player1Id !== userId && match.player2Id !== userId) notFound();
  if (match.status !== "COMPLETED") {
    redirect(`/match/${match.id}/live`);
  }

  const assignmentsFor = (uid: string) =>
    Object.fromEntries(
      match.squads.filter((s) => s.userId === uid).map((s) => [s.assignedPosition, toFootballPlayer(s.player)])
    );

  const outcome =
    match.winnerId === userId ? "You won" : match.winnerId ? "You lost" : "Draw";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col items-center gap-1 text-center">
        <p
          className={
            outcome === "You won"
              ? "text-sm font-bold uppercase tracking-wide text-squad-accent"
              : outcome === "You lost"
                ? "text-sm font-bold uppercase tracking-wide text-rose-400"
                : "text-sm font-bold uppercase tracking-wide text-gray-400"
          }
        >
          {outcome}
        </p>
        <h1 className="text-3xl font-black text-white">Match complete</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Side
          label={match.player1.username}
          score={match.player1Score}
          isWinner={match.winnerId === match.player1Id}
          formationId={match.formation1 as FormationId | null}
          assignments={assignmentsFor(match.player1Id)}
        />
        <Side
          label={match.player2.username}
          score={match.player2Score}
          isWinner={match.winnerId === match.player2Id}
          formationId={match.formation2 as FormationId | null}
          assignments={assignmentsFor(match.player2Id)}
        />
      </div>

      <Link
        href="/menu"
        className="mx-auto rounded-xl bg-squad-accent px-4 py-3 text-sm font-bold text-black transition hover:bg-squad-accent/90"
      >
        Back to menu
      </Link>
    </main>
  );
}

function Side({
  label,
  score,
  isWinner,
  formationId,
  assignments,
}: {
  label: string;
  score: number | null;
  isWinner: boolean;
  formationId: FormationId | null;
  assignments: Record<string, ReturnType<typeof toFootballPlayer>>;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${isWinner ? "border-squad-accent" : "border-squad-border"}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-bold text-gray-100">
          {label} {isWinner && <span className="text-squad-accent">★</span>}
        </p>
        <p className="text-lg font-black text-white">{score?.toFixed(1) ?? "–"}</p>
      </div>
      {formationId && <FormationPitch formationId={formationId} assignments={assignments} />}
    </div>
  );
}
