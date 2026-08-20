"use client";

import { useState, useTransition } from "react";
import { submitBid, passBid } from "@/actions/bid";

export function BidBox({
  matchRoundId,
  isMyTurn,
  highBid,
  minimumBid,
  remaining,
  onSubmitted,
}: {
  matchRoundId: string;
  isMyTurn: boolean;
  highBid: number | null;
  minimumBid: number;
  remaining: number;
  onSubmitted: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const floor = highBid !== null ? highBid + 1 : minimumBid;
  const canAfford = remaining >= floor;

  if (!isMyTurn) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-xl border border-squad-border bg-squad-panel px-4 py-3 text-center">
        <p className="text-sm font-bold text-gray-200">
          {highBid !== null ? `Current bid: ${highBid} coins` : "No bids yet"}
        </p>
        <p className="text-xs text-gray-500">Waiting for your opponent to raise or pass…</p>
      </div>
    );
  }

  function submitRaise(value: number) {
    setError(null);
    startTransition(async () => {
      const result = await submitBid(matchRoundId, value);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSubmitted();
    });
  }

  function submitPass() {
    setError(null);
    startTransition(async () => {
      const result = await passBid(matchRoundId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSubmitted();
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError("Enter a positive whole number of coins");
      return;
    }
    if (value < floor) {
      setError(`You must bid at least ${floor} coins`);
      return;
    }
    submitRaise(value);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
      <p className="text-sm font-bold text-squad-accent">
        {highBid !== null ? `Current bid: ${highBid} — your turn to raise` : "Your turn — opening bid"}
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          min={canAfford ? floor : 0}
          max={remaining}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={canAfford ? `Min ${floor}` : "Can't afford"}
          disabled={!canAfford}
          className="w-32 rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-center text-sm text-gray-100 outline-none focus:border-squad-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending || amount === "" || !canAfford}
          className="rounded-lg bg-squad-accent px-4 py-2 text-sm font-bold text-black transition hover:bg-squad-accent/90 disabled:opacity-50"
        >
          {pending ? "Locking in…" : "Bid"}
        </button>
      </div>
      {highBid !== null && (
        <button
          type="button"
          onClick={submitPass}
          disabled={pending}
          className="text-xs font-semibold text-gray-500 hover:text-gray-300"
        >
          Pass
        </button>
      )}
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <p className="text-xs text-gray-500">
        {canAfford
          ? `${remaining} coins remaining`
          : highBid !== null
            ? `You can't afford to raise past ${highBid} — pass or you'll time out`
            : `You can't afford the ${minimumBid}-coin opening bid`}
      </p>
    </form>
  );
}
