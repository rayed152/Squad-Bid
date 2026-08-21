"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormationPitch } from "@/components/formation-pitch";
import { FORMATION_LIST, type FormationId } from "@/lib/formations";
import { submitFormation } from "@/actions/match";

type MatchState = {
  id: string;
  status: "FORMATION_SELECT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  formation1: FormationId | null;
  formation2: FormationId | null;
  player1: { id: string; username: string };
  player2: { id: string; username: string };
  viewerIsPlayer1: boolean;
};

const POLL_INTERVAL_MS = 1500;

export default function FormationSelectPage({ params }: { params: { matchId: string } }) {
  const router = useRouter();
  const [match, setMatch] = useState<MatchState | null>(null);
  const [picked, setPicked] = useState<FormationId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const redirected = useRef(false);

  const poll = useCallback(async () => {
    const res = await fetch(`/api/matches/${params.matchId}`, { cache: "no-store" });
    if (res.status === 401) {
      window.location.assign("/api/auth/invalid-session");
      return;
    }
    if (!res.ok) return;
    const data: MatchState = await res.json();
    setMatch(data);

    if (data.status === "IN_PROGRESS" && !redirected.current) {
      redirected.current = true;
      router.push(`/match/${data.id}/live`);
    }
  }, [params.matchId, router]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  if (!match) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Loading match…</p>
      </main>
    );
  }

  const opponent = match.viewerIsPlayer1 ? match.player2 : match.player1;
  const selfLocked = match.viewerIsPlayer1 ? Boolean(match.formation1) : Boolean(match.formation2);
  const opponentLocked = match.viewerIsPlayer1 ? Boolean(match.formation2) : Boolean(match.formation1);

  async function handleConfirm() {
    if (!picked) return;
    setSubmitting(true);
    await submitFormation(match!.id, picked);
    setSubmitting(false);
    poll();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Pick your formation</h1>
        <p className="text-sm text-gray-400">
          vs <span className="font-semibold text-gray-200">{opponent.username}</span>{" "}
          {opponentLocked && <span className="text-squad-accent">(ready)</span>}
        </p>
      </header>

      {selfLocked ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
          <p className="text-gray-300">
            Formation locked in — waiting for {opponent.username}…
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {FORMATION_LIST.map((f) => (
              <button
                key={f.id}
                onClick={() => setPicked(f.id)}
                className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                  picked === f.id
                    ? "border-squad-accent bg-squad-accent/20 text-squad-accent"
                    : "border-squad-border bg-squad-panel text-gray-300 hover:border-white/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mx-auto w-full max-w-sm">
            <FormationPitch formationId={picked ?? "4-3-3"} />
          </div>

          <button
            onClick={handleConfirm}
            disabled={!picked || submitting}
            className="mx-auto w-full max-w-sm rounded-xl bg-squad-accent px-4 py-3 text-sm font-bold text-black transition hover:bg-squad-accent/90 disabled:opacity-50"
          >
            {submitting ? "Confirming…" : "Confirm formation"}
          </button>
        </>
      )}
    </main>
  );
}
