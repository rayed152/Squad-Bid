-- AlterTable
ALTER TABLE "MatchRound" ADD COLUMN     "winnerId" TEXT,
ADD COLUMN     "winningBid" INTEGER;

-- AddForeignKey
ALTER TABLE "MatchRound" ADD CONSTRAINT "MatchRound_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
