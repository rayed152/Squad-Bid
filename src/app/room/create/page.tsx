"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createFriendRoom } from "@/actions/room";
import { SideNav, type SideNavItem } from "@/components/side-nav";
import { GeneralSection } from "./general-section";
import { PlayersSection } from "./players-section";
import { MatchSetupSection } from "./match-setup-section";
import type { FootballPlayer } from "@/types/player";

const NAV_ITEMS: SideNavItem[] = [
  { key: "general", label: "General settings", description: "Name, description, schedule" },
  { key: "players", label: "Players", description: "Pick the player pool" },
  { key: "match-setup", label: "Match setup", description: "Budget, bidding, bench" },
  { key: "moderators", label: "Moderators", description: "Manage co-hosts", locked: true },
];

export default function CreateRoomPage() {
  const [section, setSection] = useState("general");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [poolMode, setPoolMode] = useState<"all" | "custom">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const playerCache = useRef<Map<string, FootballPlayer>>(new Map()).current;

  const [budget, setBudget] = useState(1000);
  const [minimumBid, setMinimumBid] = useState(500);
  const [bidTimeSeconds, setBidTimeSeconds] = useState(20);
  const [bidIncrement, setBidIncrement] = useState(10);
  const [benchSize, setBenchSize] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function togglePlayer(player: FootballPlayer) {
    playerCache.set(player.id, player);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(player.id)) next.delete(player.id);
      else next.add(player.id);
      return next;
    });
  }

  function addManyPlayers(ids: string[]) {
    setSelectedIds((prev) => new Set([...prev, ...ids]));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createFriendRoom({
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        scheduledAt: scheduledAt || null,
        budget,
        minimumBid,
        bidTimeSeconds,
        bidIncrement,
        benchSize,
        poolPlayerIds: poolMode === "custom" ? [...selectedIds] : [],
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-black text-white">Create a lobby</h1>
        <p className="mt-1 text-sm text-gray-400">
          Set everything up here — your opponent joins with your code once the lobby&apos;s created.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:flex-row">
        <SideNav items={NAV_ITEMS} activeKey={section} onSelect={setSection} />

        <div className="min-w-0 flex-1 rounded-2xl border border-squad-border bg-squad-panel/40 p-5">
          {section === "general" && (
            <GeneralSection
              name={name}
              onNameChange={setName}
              description={description}
              onDescriptionChange={setDescription}
              scheduledAt={scheduledAt}
              onScheduledAtChange={setScheduledAt}
            />
          )}

          {section === "players" && (
            <PlayersSection
              mode={poolMode}
              onModeChange={setPoolMode}
              selectedIds={selectedIds}
              playerCache={playerCache}
              onToggle={togglePlayer}
              onAddMany={addManyPlayers}
              onClear={clearSelection}
            />
          )}

          {section === "match-setup" && (
            <MatchSetupSection
              budget={budget}
              onBudgetChange={setBudget}
              minimumBid={minimumBid}
              onMinimumBidChange={setMinimumBid}
              bidTimeSeconds={bidTimeSeconds}
              onBidTimeSecondsChange={setBidTimeSeconds}
              bidIncrement={bidIncrement}
              onBidIncrementChange={setBidIncrement}
              benchSize={benchSize}
              onBenchSizeChange={setBenchSize}
            />
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-squad-border pt-5">
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-squad-accent px-4 py-3 text-sm font-bold text-black transition hover:bg-squad-accent/90 disabled:opacity-50"
            >
              {pending ? "Creating lobby…" : "Create lobby"}
            </button>
            <Link href="/menu" className="text-center text-sm font-semibold text-gray-500 hover:text-gray-300">
              Back to menu
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
