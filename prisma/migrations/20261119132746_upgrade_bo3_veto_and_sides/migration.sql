/*
  Warnings:

  - You are about to drop the column `pickedMap` on the `Match` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" DROP COLUMN "pickedMap",
ADD COLUMN     "bestOf" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pickedMaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "vetoLog" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "matchFormat" TEXT NOT NULL DEFAULT 'FINAL_BO3';
