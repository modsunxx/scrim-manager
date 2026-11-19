-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "bannedMaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lobbyInfo" TEXT,
ADD COLUMN     "mapPool" TEXT[] DEFAULT ARRAY['Mirage', 'Inferno', 'Nuke', 'Ancient', 'Anubis', 'Dust2', 'Vertigo']::TEXT[],
ADD COLUMN     "pickedMap" TEXT;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "minPlayers" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "TournamentRegistration" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentRegistration_tournamentId_teamId_key" ON "TournamentRegistration"("tournamentId", "teamId");

-- AddForeignKey
ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
