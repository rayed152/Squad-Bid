"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setReady, leaveRoom } from "@/actions/room";

type RoomState = {
  id: string;
  code: string;
  status: "WAITING" | "READY" | "IN_PROGRESS" | "CLOSED";
  name: string | null;
  description: string | null;
  scheduledAt: string | null;
  poolSize: number;
  budget: number;
  minimumBid: number;
  bidTimeSeconds: number;
  bidIncrement: number;
  benchSize: number;
  hostReady: boolean;
  guestReady: boolean;
  host: { id: string; username: string; elo: number } | null;
  guest: { id: string; username: string; elo: number } | null;
  matchId: string | null;
  viewerIsHost: boolean;
};

const POLL_INTERVAL_MS = 1500;

export default function RoomPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [togglePending, setTogglePending] = useState(false);
  const redirected = useRef(false);

  const poll = useCallback(async () => {
    const res = await fetch(`/api/rooms/${params.code}`, { cache: "no-store" });
    if (res.status === 404 || res.status === 403) {
      setNotFound(true);
      return;
    }
    if (!res.ok) return;
    const data: RoomState = await res.json();
    setRoom(data);

    if (data.matchId && !redirected.current) {
      redirected.current = true;
      router.push(`/match/${data.matchId}/formation`);
    }
  }, [params.code, router]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  if (notFound) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <p className="text-gray-300">This room doesn&apos;t exist or you&apos;re not part of it.</p>
        <button
          onClick={() => router.push("/menu")}
          className="rounded-lg bg-squad-accent px-4 py-2 text-sm font-bold text-black"
        >
          Back to menu
        </button>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">Loading room…</p>
      </main>
    );
  }

  const selfReady = room.viewerIsHost ? room.hostReady : room.guestReady;

  async function handleReadyToggle() {
    if (!room) return;
    setTogglePending(true);
    await setReady(room.id, !selfReady);
    setTogglePending(false);
    poll();
  }

  async function handleLeave() {
    if (!room) return;
    await leaveRoom(room.id);
    router.push("/menu");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Room code</p>
          <h1 className="text-3xl font-black tracking-widest text-white">{room.code}</h1>
        </div>
        <button onClick={handleLeave} className="text-sm font-semibold text-gray-400 hover:text-gray-200">
          Leave
        </button>
      </header>

      {(room.name || room.description || room.scheduledAt) && (
        <div className="rounded-xl border border-squad-border bg-squad-panel px-4 py-3 text-center">
          {room.name && <p className="text-base font-bold text-gray-100">{room.name}</p>}
          {room.description && <p className="mt-1 text-sm text-gray-400">{room.description}</p>}
          {room.scheduledAt && (
            <p className="mt-1 text-xs text-gray-500">
              Opens {new Date(room.scheduledAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-center text-xs text-gray-400">
        <p>
          <span className="block text-base font-bold text-gray-100">{room.budget}</span>
          starting coins
        </p>
        <p>
          <span className="block text-base font-bold text-gray-100">{room.minimumBid}</span>
          min. opening bid
        </p>
        <p>
          <span className="block text-base font-bold text-gray-100">{room.bidTimeSeconds}s</span>
          turn time
        </p>
        <p>
          <span className="block text-base font-bold text-gray-100">{room.bidIncrement}</span>
          min. raise
        </p>
        <p>
          <span className="block text-base font-bold text-gray-100">
            {room.benchSize > 0 ? room.benchSize : "None"}
          </span>
          subs
        </p>
        <p>
          <span className="block text-base font-bold text-gray-100">
            {room.poolSize > 0 ? room.poolSize : "All"}
          </span>
          player pool
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <PlayerSlot label="Host" player={room.host} ready={room.hostReady} />
        <PlayerSlot label="Guest" player={room.guest} ready={room.guestReady} />
      </div>

      {!room.guest ? (
        <p className="text-center text-sm text-gray-400">
          Waiting for an opponent to join with code <span className="font-bold text-gray-200">{room.code}</span>…
        </p>
      ) : (
        <button
          onClick={handleReadyToggle}
          disabled={togglePending}
          className={`rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-50 ${
            selfReady
              ? "border border-squad-accent bg-squad-accent/10 text-squad-accent"
              : "bg-squad-accent text-black hover:bg-squad-accent/90"
          }`}
        >
          {selfReady ? "Not ready" : "Ready"}
        </button>
      )}
    </main>
  );
}

function PlayerSlot({
  label,
  player,
  ready,
}: {
  label: string;
  player: { username: string; elo: number } | null;
  ready: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-squad-border bg-squad-panel px-4 py-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-100">
          {player ? player.username : <span className="text-gray-500">Empty</span>}
        </p>
        {player && <p className="text-xs text-gray-400">{player.elo} ELO</p>}
      </div>
      {player && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            ready ? "bg-squad-accent/20 text-squad-accent" : "bg-white/10 text-gray-400"
          }`}
        >
          {ready ? "Ready" : "Not ready"}
        </span>
      )}
    </div>
  );
}
