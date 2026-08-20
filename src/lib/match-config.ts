// Shared between the server round-progression engine and client UI —
// kept dependency-free so client components can import it safely.
export const INITIAL_BID_WINDOW_MS = 20_000;
const FAST_BID_WINDOW_MS = 10_000;
const SPEEDUP_START_BID_COUNT = 10;
const SPEEDUP_END_BID_COUNT = 12;

/**
 * Each turn's countdown, based on how many raises have already happened in
 * this round's auction. Stays at the initial window through the first ~10
 * back-and-forth bids, then eases down to a faster window by ~12 to keep a
 * long bidding war from dragging on.
 */
export function getBidWindowMs(bidCount: number): number {
  if (bidCount < SPEEDUP_START_BID_COUNT) return INITIAL_BID_WINDOW_MS;
  if (bidCount >= SPEEDUP_END_BID_COUNT) return FAST_BID_WINDOW_MS;

  const t = (bidCount - SPEEDUP_START_BID_COUNT) / (SPEEDUP_END_BID_COUNT - SPEEDUP_START_BID_COUNT);
  return Math.round(INITIAL_BID_WINDOW_MS - t * (INITIAL_BID_WINDOW_MS - FAST_BID_WINDOW_MS));
}

/** Reserve price a player's popped rating requires before the opening bid of a round is accepted. */
export function getMinimumBid(overall: number): number {
  if (overall >= 85) return 500;
  if (overall >= 75) return 300;
  return 150;
}
