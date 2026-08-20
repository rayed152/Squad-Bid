-- DropIndex
DROP INDEX "Bid_matchRoundId_userId_key";

-- AlterTable
ALTER TABLE "MatchRound" ADD COLUMN     "turnUserId" TEXT;

-- CreateIndex
CREATE INDEX "Bid_matchRoundId_idx" ON "Bid"("matchRoundId");

-- AddForeignKey
ALTER TABLE "MatchRound" ADD CONSTRAINT "MatchRound_turnUserId_fkey" FOREIGN KEY ("turnUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
