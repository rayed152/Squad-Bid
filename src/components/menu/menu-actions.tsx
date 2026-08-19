"use client";

import { useState, useTransition } from "react";
import { findRandomMatch, createFriendRoom, joinRoomByCode } from "@/actions/room";

export function MenuActions() {
  const [error, setError] = useState<string | null>(null);
  const [findPending, startFind] = useTransition();
  const [createPending, startCreate] = useTransition();
  const [joinPending, startJoin] = useTransition();
  const [code, setCode] = useState("");

  function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startJoin(async () => {
      const result = await joinRoomByCode(code);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => startFind(() => findRandomMatch())}
        disabled={findPending}
        className="rounded-xl bg-squad-accent px-4 py-3 text-left font-bold text-black transition hover:bg-squad-accent/90 disabled:opacity-50"
      >
        <span className="block text-base">{findPending ? "Searching…" : "Find Random Match"}</span>
        <span className="block text-xs font-medium text-black/70">Get matched with the next available opponent</span>
      </button>

      <div className="rounded-xl border border-squad-border bg-squad-panel p-4">
        <p className="text-sm font-bold text-gray-100">Play with Friends</p>
        <p className="mt-0.5 text-xs text-gray-400">Host a room and share the code, or join one.</p>

        <button
          onClick={() => startCreate(() => createFriendRoom())}
          disabled={createPending}
          className="mt-3 w-full rounded-lg border border-squad-border bg-black/20 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:border-white/30 disabled:opacity-50"
        >
          {createPending ? "Creating room…" : "Create room"}
        </button>

        <form onSubmit={handleJoin} className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Room code"
            maxLength={6}
            className="min-w-0 flex-1 rounded-lg border border-squad-border bg-black/20 px-3 py-2 text-sm uppercase tracking-widest text-gray-100 outline-none focus:border-squad-accent"
          />
          <button
            type="submit"
            disabled={joinPending || code.length < 4}
            className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:bg-white/20 disabled:opacity-50"
          >
            {joinPending ? "Joining…" : "Join"}
          </button>
        </form>

        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      </div>
    </div>
  );
}
