-- Saved fantasy conversations. Additive only.
CREATE TABLE IF NOT EXISTS "FantasyConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "messages" TEXT NOT NULL DEFAULT '[]',
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FantasyConversation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FantasyConversation_sessionId_key" ON "FantasyConversation"("sessionId");
CREATE INDEX IF NOT EXISTS "FantasyConversation_userId_updatedAt_idx" ON "FantasyConversation"("userId","updatedAt");
ALTER TABLE "FantasyConversation" DROP CONSTRAINT IF EXISTS "FantasyConversation_userId_fkey";
ALTER TABLE "FantasyConversation" ADD CONSTRAINT "FantasyConversation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
