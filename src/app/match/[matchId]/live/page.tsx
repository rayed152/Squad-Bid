"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormationPitch } from "@/components/formation-pitch";
import { PlayerCard } from "@/components/player-card";
import { CountdownRing } from "@/components/countdown-ring";
import { BidBox } from "@/components/match/bid-box";
import { getBidWindowMs } from "@/lib/match-config";
import { getAllSlots, type AnySlot, type FormationId } from "@/lib/formations";
import type { FootballPlayer } from "@/types/player";
import { assignSlot } from "@/actions/assign";
import { forfeitMatch } from "@/actions/forfeit";

type LiveRound = {
  id: string;
  roundNumber: number;
  status: "BIDDING" | "RESOLVED";
  biddingEndsAt: string | null;
  bidCount: number;
  player: FootballPlayer;
  turnUserId: string | null;
  isMyTurn: boolean;
  highBid: number | null;
  highBidderId: string | null;
  awaitingSlotFrom: string | null;
};

type LiveMatch = {
  id: string;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FORMATION_SELECT";
  formation1: FormationId | null;
  formation2: FormationId | null;
  minimumBid: number;
  bidTimeSeconds: number;
  bidIncrement: number;
  benchSize: number;
  player1: { id: string; username: string };
  player2: { id: string; username: string };
  viewerIsPlayer1: boolean;
  squads: { userId: string; assignedPosition: string; player: FootballPlayer }[];
  myBudgetRemaining: number;
  opponentBudgetRemaining: number;
  round: LiveRound | null;
};

const POLL_INTERVAL_MS = 1200;

export default function LiveMatchPage({ params }: { params: { matchId: string } }) {
  const router = useRouter();
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [assignPending, setAssignPending] = useState(false);
  const [forfeitPending, setForfeitPending] = useState(false);
  const redirected = useRef(false);

  const poll = useCallback(async () => {
    const res = await fetch(`/api/matches/${params.matchId}/live`, { cache: "no-store" });
    if (res.status === 401) {
      window.location.assign("/api/auth/invalid-session");
      return;
    }
    if (!res.ok) return;
    const data: LiveMatch = await res.json();
    setMatch(data);

    if (data.status === "COMPLETED" && !redirected.current) {
      redirected.current = true;
      router.push(`/match/${data.id}/results`);
    }
  }, [params.matchId, router]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  const myAssignments = useMemo(() => {
    if (!match) return {};
    const myId = match.viewerIsPlayer1 ? match.player1.id : match.player2.id;
    return Object.fromEntries(
      match.squads.filter((s) => s.userId === myId).map((s) => [s.assignedPosition, s.player])
    );
  }, [match]);

  const opponentAssignments = useMemo(() => {
    if (!match) return {};
    const oppId = match.viewerIsPlayer1 ? match.player2.id : match.player1.id;
    return Object.fromEntries(
      match.squads.filter((s) => s.userId === oppId).map((s) => [s.assignedPosition, s.player])
    );
  }, [match]);

  if (!match) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Loading match…</p>
      </main>
    );
  }

  const me = match.viewerIsPlayer1 ? match.player1 : match.player2;
  const opponent = match.viewerIsPlayer1 ? match.player2 : match.player1;
  const myFormationId = match.viewerIsPlayer1 ? match.formation1 : match.formation2;
  const opponentFormationId = match.viewerIsPlayer1 ? match.formation2 : match.formation1;
  const round = match.round;
  const iAmAwaitingSlot = Boolean(round && round.awaitingSlotFrom === me.id);

  const mySlotTotal = myFormationId ? getAllSlots(myFormationId, match.benchSize).length : 0;
  const opponentSlotTotal = opponentFormationId
    ? getAllSlots(opponentFormationId, match.benchSize).length
    : 0;
  const myFilledCount = Object.keys(myAssignments).length;
  const opponentFilledCount = Object.keys(opponentAssignments).length;

  async function handleSlotClick(slot: AnySlot) {
    if (!round || !iAmAwaitingSlot) return;
    setAssignPending(true);
    await assignSlot(round.id, slot.id);
    setAssignPending(false);
    poll();
  }

  async function handleForfeit() {
    if (!window.confirm("Forfeit this match? Your opponent will be awarded the win.")) return;
    setForfeitPending(true);
    await forfeitMatch(match!.id);
    setForfeitPending(false);
    poll();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between text-sm">
        <div>
          <p className="font-bold text-gray-100">{me.username}</p>
          <p className="text-xs text-gray-400">{match.myBudgetRemaining} coins</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="font-semibold text-gray-500">
            {myFilledCount}/{mySlotTotal} · {opponentFilledCount}/{opponentSlotTotal}
          </p>
          <button
            onClick={handleForfeit}
            disabled={forfeitPending}
            className="text-[11px] font-semibold text-gray-600 transition hover:text-rose-400 disabled:opacity-50"
          >
            {forfeitPending ? "Forfeiting…" : "Forfeit match"}
          </button>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-100">{opponent.username}</p>
          <p className="text-xs text-gray-400">{match.opponentBudgetRemaining} coins</p>
        </div>
      </header>

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-squad-border bg-squad-panel/50 p-6">
        {!round && <p className="text-sm text-gray-400">Getting the next player ready…</p>}

        {round && round.status === "BIDDING" && (
          <>
            <div className="flex items-center gap-4">
              <PlayerCard player={round.player} highlightPositions={round.player.positions} />
              {round.biddingEndsAt && (
                <CountdownRing
                  endsAt={round.biddingEndsAt}
                  windowMs={getBidWindowMs(round.bidCount, match.bidTimeSeconds * 1000)}
                />
              )}
            </div>
            <BidBox
              matchRoundId={round.id}
              isMyTurn={round.isMyTurn}
              highBid={round.highBid}
              minimumBid={match.minimumBid}
              bidIncrement={match.bidIncrement}
              remaining={match.myBudgetRemaining}
              onSubmitted={poll}
            />
          </>
        )}

        {round && round.status === "RESOLVED" && (
          <div className="flex flex-col items-center gap-3">
            <PlayerCard player={round.player} variant="compact" layout="col" className="w-40" />
            {round.highBidderId ? (
              <p className="text-sm font-semibold text-gray-200">
                {round.highBidderId === me.id ? "You" : opponent.username} won{" "}
                <span className="text-squad-accent">{round.player.name}</span> for {round.highBid} coins
              </p>
            ) : (
              <p className="text-sm text-gray-400">Nobody bid — {round.player.name} goes unclaimed.</p>
            )}
            {iAmAwaitingSlot && (
              <p className="text-sm font-bold text-squad-accent">
                {assignPending ? "Assigning…" : "Pick a highlighted slot below to place them"}
              </p>
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Your squad</p>
          {myFormationId && (
            <FormationPitch
              formationId={myFormationId}
              benchSize={match.benchSize}
              assignments={myAssignments}
              candidate={iAmAwaitingSlot ? round!.player : null}
              onSlotClick={iAmAwaitingSlot ? handleSlotClick : undefined}
            />
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {opponent.username}&apos;s squad
          </p>
          {opponentFormationId && (
            <FormationPitch
              formationId={opponentFormationId}
              benchSize={match.benchSize}
              assignments={opponentAssignments}
            />
          )}
        </div>
      </div>
    </main>
  );
}
