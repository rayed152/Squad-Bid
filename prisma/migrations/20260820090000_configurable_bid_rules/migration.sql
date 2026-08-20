-- Replace the fixed round-count setting with host-configurable auction rules.
-- Matches now run until both squads are full instead of stopping at a round cap.

ALTER TABLE "Room"
  DROP COLUMN "totalRounds",
  ADD COLUMN "minimumBid" INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN "bidTimeSeconds" INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN "bidIncrement" INTEGER NOT NULL DEFAULT 10;

ALTER TABLE "Match"
  DROP COLUMN "totalRounds",
  ADD COLUMN "minimumBid" INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN "bidTimeSeconds" INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN "bidIncrement" INTEGER NOT NULL DEFAULT 10;
