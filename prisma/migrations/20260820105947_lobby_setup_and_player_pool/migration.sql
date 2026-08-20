-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "poolPlayerIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "club" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "league" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "poolPlayerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Player_nationality_idx" ON "Player"("nationality");

-- CreateIndex
CREATE INDEX "Player_club_idx" ON "Player"("club");

-- CreateIndex
CREATE INDEX "Player_league_idx" ON "Player"("league");
