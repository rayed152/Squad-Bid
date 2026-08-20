"use client";

const BUDGET_PRESETS = [500, 1000, 2000, 5000];
const MINIMUM_BID_PRESETS = [100, 300, 500, 1000];
const BID_TIME_PRESETS = [10, 15, 20, 30];
const BID_INCREMENT_PRESETS = [5, 10, 25, 50];
const BENCH_SIZE_PRESETS = [0, 2, 3, 5];

export function MatchSetupSection({
  budget,
  onBudgetChange,
  minimumBid,
  onMinimumBidChange,
  bidTimeSeconds,
  onBidTimeSecondsChange,
  bidIncrement,
  onBidIncrementChange,
  benchSize,
  onBenchSizeChange,
}: {
  budget: number;
  onBudgetChange: (value: number) => void;
  minimumBid: number;
  onMinimumBidChange: (value: number) => void;
  bidTimeSeconds: number;
  onBidTimeSecondsChange: (value: number) => void;
  bidIncrement: number;
  onBidIncrementChange: (value: number) => void;
  benchSize: number;
  onBenchSizeChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-white">Match setup</h2>
        <p className="mt-1 text-sm text-gray-400">
          Choose the auction rules for this lobby. Matches run until both squads are completely full.
        </p>
      </div>

      <SettingField
        label="Starting coins"
        hint="How many coins each player has to bid with."
        value={budget}
        onChange={onBudgetChange}
        presets={BUDGET_PRESETS}
        min={100}
        max={10_000}
        step={100}
      />

      <SettingField
        label="Minimum opening bid"
        hint="The lowest bid allowed to open on a newly-popped player."
        value={minimumBid}
        onChange={onMinimumBidChange}
        presets={MINIMUM_BID_PRESETS}
        min={0}
        max={5_000}
        step={50}
      />

      <SettingField
        label="Turn time"
        hint="Seconds each player gets to raise or pass before the clock resets."
        value={bidTimeSeconds}
        onChange={onBidTimeSecondsChange}
        presets={BID_TIME_PRESETS}
        min={5}
        max={60}
        step={5}
        suffix="s"
      />

      <SettingField
        label="Minimum raise"
        hint="How much higher a raise must be than the current bid — e.g. a 500 bid needs at least 510 to top it, if this is set to 10."
        value={bidIncrement}
        onChange={onBidIncrementChange}
        presets={BID_INCREMENT_PRESETS}
        min={1}
        max={500}
        step={1}
      />

      <SettingField
        label="Substitutes"
        hint="Bench slots that accept a player of any position — lets you buy a duplicate (e.g. a second LB) instead of being locked out once that spot's taken. 0 means no bench: once a position is full, you can't bid on another player who only fits there."
        value={benchSize}
        onChange={onBenchSizeChange}
        presets={BENCH_SIZE_PRESETS}
        min={0}
        max={10}
        step={1}
      />
    </div>
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
  suffix,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
  presets: number[];
  min: number;
  max: number;
  step: number;
  suffix?: string;
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
            {suffix}
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
