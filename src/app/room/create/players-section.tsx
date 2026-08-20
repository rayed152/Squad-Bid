"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PlayerCard } from "@/components/player-card";
import { getPlayerFilterOptions, getFilteredPlayerIds, searchPlayers } from "@/actions/players";
import type { FootballPlayer } from "@/types/player";

type FilterOptions = {
  nationalities: string[];
  leagues: string[];
  clubs: string[];
  clubsByLeague: Record<string, string[]>;
};

export function PlayersSection({
  mode,
  onModeChange,
  selectedIds,
  playerCache,
  onToggle,
  onAddMany,
  onClear,
}: {
  mode: "all" | "custom";
  onModeChange: (mode: "all" | "custom") => void;
  selectedIds: Set<string>;
  playerCache: Map<string, FootballPlayer>;
  onToggle: (player: FootballPlayer) => void;
  onAddMany: (ids: string[]) => void;
  onClear: () => void;
}) {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [nationality, setNationality] = useState("");
  const [league, setLeague] = useState("");
  const [club, setClub] = useState("");
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<{ players: FootballPlayer[]; total: number; pageSize: number } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  // Range-select anchor for shift+click, and a live read of whether Shift is
  // currently held (avoids threading the native event through PlayerCard's
  // onClick, which is a plain () => void used all over the app).
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);
  const shiftPressedRef = useRef(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftPressedRef.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftPressedRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    getPlayerFilterOptions().then(setOptions);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (mode !== "custom") return;
    startTransition(async () => {
      const res = await searchPlayers({ query: debouncedQuery, nationality, league, club, page });
      setResults(res);
      const known = playerCache;
      for (const p of res.players) known.set(p.id, p);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, debouncedQuery, nationality, league, club, page]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, nationality, league, club]);

  // The visible player list changes under a range whenever the page or
  // filters change, so a stale anchor would select the wrong players.
  useEffect(() => {
    setAnchorIndex(null);
  }, [debouncedQuery, nationality, league, club, page]);

  const filters = { query: debouncedQuery, nationality, league, club };

  const visibleClubs = league ? options?.clubsByLeague[league] ?? [] : options?.clubs ?? [];

  function handleLeagueChange(nextLeague: string) {
    setLeague(nextLeague);
    if (nextLeague && club && !options?.clubsByLeague[nextLeague]?.includes(club)) {
      setClub("");
    }
  }

  function handleCardClick(player: FootballPlayer, index: number) {
    if (shiftPressedRef.current && anchorIndex !== null && results) {
      const start = Math.min(anchorIndex, index);
      const end = Math.max(anchorIndex, index);
      onAddMany(results.players.slice(start, end + 1).map((p) => p.id));
    } else {
      onToggle(player);
    }
    setAnchorIndex(index);
  }

  async function handleAddAllFiltered() {
    const ids = await getFilteredPlayerIds(filters);
    onAddMany(ids);
  }

  const selectedList = [...selectedIds]
    .map((id) => playerCache.get(id))
    .filter((p): p is FootballPlayer => Boolean(p));
  const unhydratedCount = selectedIds.size - selectedList.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-white">Players</h2>
        <p className="mt-1 text-sm text-gray-400">
          Choose which players can be popped in this match. Default is everyone in the pool.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <ModePill active={mode === "all"} onClick={() => onModeChange("all")}>
          All players
        </ModePill>
        <ModePill active={mode === "custom"} onClick={() => onModeChange("custom")}>
          Custom pool
        </ModePill>
      </div>

      {mode === "all" && (
        <p className="rounded-xl border border-squad-border bg-squad-panel px-4 py-3 text-sm text-gray-400">
          Every player in the database is eligible to be popped — no restrictions.
        </p>
      )}

      {mode === "custom" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-squad-border bg-squad-panel px-4 py-3">
            <p className="text-sm font-semibold text-gray-200">
              {selectedIds.size} player{selectedIds.size === 1 ? "" : "s"} selected
            </p>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-semibold text-gray-500 hover:text-rose-400"
              >
                Clear all
              </button>
            )}
          </div>

          {selectedList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedList.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggle(p)}
                  className="flex items-center gap-1 rounded-full border border-squad-accent/50 bg-squad-accent/10 px-2.5 py-1 text-xs font-semibold text-squad-accent"
                  title="Remove from pool"
                >
                  {p.name}
                  <span className="text-squad-accent/70">×</span>
                </button>
              ))}
              {unhydratedCount > 0 && (
                <span className="rounded-full border border-squad-border px-2.5 py-1 text-xs text-gray-500">
                  +{unhydratedCount} more
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className="rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-sm text-gray-100 outline-none focus:border-squad-accent sm:col-span-2 lg:col-span-1"
            />
            <FilterSelect
              value={nationality}
              onChange={setNationality}
              placeholder="Nationality"
              options={options?.nationalities ?? []}
            />
            <FilterSelect
              value={league}
              onChange={handleLeagueChange}
              placeholder="League"
              options={options?.leagues ?? []}
            />
            <FilterSelect value={club} onChange={setClub} placeholder="Club" options={visibleClubs} />
          </div>

          {(nationality || league || club || debouncedQuery) && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddAllFiltered}
                className="rounded-lg border border-squad-accent/60 bg-squad-accent/10 px-3 py-1.5 text-xs font-bold text-squad-accent hover:bg-squad-accent/20"
              >
                Add all matching players{results ? ` (${results.total})` : ""}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setNationality("");
                  setLeague("");
                  setClub("");
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-300"
              >
                Clear filters
              </button>
            </div>
          )}

          {results && results.players.length > 0 && (
            <p className="text-xs text-gray-500">
              Click to add or drop a player. Hold <span className="font-semibold text-gray-400">Shift</span> and
              click another card to select everyone in between.
            </p>
          )}

          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
            onMouseDown={(e) => {
              // Stop the browser's native text-selection drag that shift+click
              // would otherwise trigger across the card grid.
              if (e.shiftKey) e.preventDefault();
            }}
          >
            {results?.players.map((p, index) => (
              <PlayerCard
                key={p.id}
                player={p}
                variant="compact"
                layout="col"
                selected={selectedIds.has(p.id)}
                onClick={() => handleCardClick(p, index)}
              />
            ))}
          </div>

          {results && results.total === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">No players match these filters.</p>
          )}

          {results && results.total > results.pageSize && (
            <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
              <button
                type="button"
                disabled={page === 0 || pending}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-squad-border px-3 py-1.5 disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                Page {page + 1} of {Math.ceil(results.total / results.pageSize)}
              </span>
              <button
                type="button"
                disabled={(page + 1) * results.pageSize >= results.total || pending}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-squad-border px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
        active
          ? "border-squad-accent bg-squad-accent/20 text-squad-accent"
          : "border-squad-border bg-squad-panel text-gray-300 hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-sm text-gray-100 outline-none focus:border-squad-accent"
    >
      <option value="">All {placeholder.toLowerCase()}s</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
