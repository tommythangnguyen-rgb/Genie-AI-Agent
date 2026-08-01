-- Fantasy agent usage billing. Purely additive: a new defaulted column and a
-- new table, so this is safe to apply to a live database.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fantasyCreditsMills" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "FantasyUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "rawCostMills" INTEGER NOT NULL DEFAULT 0,
    "billedMills" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FantasyUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FantasyUsage_userId_createdAt_idx" ON "FantasyUsage"("userId", "createdAt");

ALTER TABLE "FantasyUsage" DROP CONSTRAINT IF EXISTS "FantasyUsage_userId_fkey";
ALTER TABLE "FantasyUsage" ADD CONSTRAINT "FantasyUsage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
