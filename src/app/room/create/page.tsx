"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createFriendRoom } from "@/actions/room";

const BUDGET_PRESETS = [500, 1000, 2000, 5000];
const ROUNDS_PRESETS = [5, 11, 15, 20];

export default function CreateRoomPage() {
  const [budget, setBudget] = useState(1000);
  const [totalRounds, setTotalRounds] = useState(11);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createFriendRoom(budget, totalRounds);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-black text-white">Match setup</h1>
        <p className="mt-1 text-sm text-gray-400">
          Choose the rules for this lobby — your opponent joins with your code once it&apos;s created.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <SettingField
          label="Starting coins"
          hint="How many coins each player has to bid with."
          value={budget}
          onChange={setBudget}
          presets={BUDGET_PRESETS}
          min={100}
          max={10_000}
          step={100}
        />

        <SettingField
          label="Rounds"
          hint="How many footballers pop up before the match ends."
          value={totalRounds}
          onChange={setTotalRounds}
          presets={ROUNDS_PRESETS}
          min={5}
          max={20}
          step={1}
        />

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-squad-accent px-4 py-3 text-sm font-bold text-black transition hover:bg-squad-accent/90 disabled:opacity-50"
        >
          {pending ? "Creating lobby…" : "Create lobby"}
        </button>
      </form>

      <Link href="/menu" className="text-center text-sm font-semibold text-gray-500 hover:text-gray-300">
        Back to menu
      </Link>
    </main>
  );
}

function SettingField({
  label,
  hint,
  value,
  onChange,
  presets,
  min,
  max,
  step,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
  presets: number[];
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-bold text-gray-100">{label}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
              value === preset
                ? "border-squad-accent bg-squad-accent/20 text-squad-accent"
                : "border-squad-border bg-squad-panel text-gray-300 hover:border-white/30"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-sm text-gray-100 outline-none focus:border-squad-accent"
      />
    </div>
  );
}
