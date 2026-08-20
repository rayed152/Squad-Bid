// Shared between the server round-progression engine and client UI —
// kept dependency-free so client components can import it safely.
const SPEEDUP_START_BID_COUNT = 10;
const SPEEDUP_END_BID_COUNT = 12;
const MIN_FAST_WINDOW_MS = 5_000;

/**
 * Each turn's countdown, based on how many raises have already happened in
 * this round's auction. Stays at the match's configured turn time through
 * the first ~10 back-and-forth bids, then eases down toward half that
 * (floored at 5s) by ~12 raises, so a long bidding war can't drag on forever.
 */
export function getBidWindowMs(bidCount: number, initialWindowMs: number): number {
  const fastWindowMs = Math.max(MIN_FAST_WINDOW_MS, Math.round(initialWindowMs / 2));

  if (bidCount < SPEEDUP_START_BID_COUNT) return initialWindowMs;
  if (bidCount >= SPEEDUP_END_BID_COUNT) return fastWindowMs;

  const t = (bidCount - SPEEDUP_START_BID_COUNT) / (SPEEDUP_END_BID_COUNT - SPEEDUP_START_BID_COUNT);
  return Math.round(initialWindowMs - t * (initialWindowMs - fastWindowMs));
}
