-- AlterTable: Add scoring audit fields to Category.
-- updatedAt is @updatedAt in Prisma — backfill existing rows with NOW(),
-- then drop the column default so Prisma manages it going forward.
ALTER TABLE "Category"
  ADD COLUMN "scoringLastChangedBy" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  ALTER COLUMN "runnerUpMultiplier" SET DEFAULT 0.6;

-- Drop the temporary DEFAULT so Prisma's @updatedAt semantics take over
ALTER TABLE "Category" ALTER COLUMN "updatedAt" DROP DEFAULT;
