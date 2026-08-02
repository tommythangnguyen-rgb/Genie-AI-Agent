import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Persisted fantasy-agent conversations.
 *
 * Saved server-side rather than in localStorage so history survives a cleared
 * browser, a different device, or a tab that crashed mid-answer. Keyed on the
 * Anthropic session id — one stored conversation per agent session.
 */

export type StoredTurn = { role: "user" | "agent"; text: string; at: string };

/** Emails with unmetered access — no Pro requirement, no credit deduction. */
export function ownerEmails(): string[] {
  return (process.env.FANTASY_OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return ownerEmails().includes(email.toLowerCase());
}

/** Default product name, and the personalised one owners see. */
export const DEFAULT_AGENT_TITLE = "NFL Fantasy Football Aid Assistant";
export const OWNER_AGENT_TITLE =
  process.env.FANTASY_OWNER_TITLE ?? "NO CHILL MFs - Fantasy Football Assistant";

/** Owners see their league name; everyone else sees the product name. */
export function agentTitleFor(email: string | null | undefined): string {
  return isOwner(email) ? OWNER_AGENT_TITLE : DEFAULT_AGENT_TITLE;
}

/** First line of the opening question, trimmed to something list-friendly. */
function deriveTitle(text: string): string {
  const line = text.replace(/\s+/g, " ").trim();
  if (!line) return "New conversation";
  return line.length > 70 ? `${line.slice(0, 70)}…` : line;
}

function parse(raw: string): StoredTurn[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as StoredTurn[]) : [];
  } catch {
    return [];
  }
}

/**
 * Append one completed exchange. Called after the stream ends, so a turn is
 * only recorded once it actually produced something.
 */
export async function appendTurn(
  userId: string,
  sessionId: string | null,
  question: string,
  answer: string
): Promise<void> {
  if (!sessionId || (!question.trim() && !answer.trim())) return;

  const now = new Date().toISOString();
  const incoming: StoredTurn[] = [];
  if (question.trim()) incoming.push({ role: "user", text: question, at: now });
  if (answer.trim()) incoming.push({ role: "agent", text: answer, at: now });
  if (!incoming.length) return;

  const existing = await prisma.fantasyConversation.findUnique({
    where: { sessionId },
    select: { id: true, messages: true, turnCount: true },
  });

  if (!existing) {
    await prisma.fantasyConversation.create({
      data: {
        userId,
        sessionId,
        title: deriveTitle(question),
        messages: JSON.stringify(incoming),
        turnCount: 1,
      },
    });
    return;
  }

  await prisma.fantasyConversation.update({
    where: { id: existing.id },
    data: {
      messages: JSON.stringify([...parse(existing.messages), ...incoming]),
      turnCount: existing.turnCount + 1,
    },
  });
}

export async function listConversations(userId: string, limit = 50) {
  const rows = await prisma.fantasyConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, sessionId: true, title: true, turnCount: true, updatedAt: true },
  });
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    title: r.title,
    turnCount: r.turnCount,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getConversation(userId: string, id: string) {
  const row = await prisma.fantasyConversation.findFirst({
    where: { id, userId }, // scoped to the owner so an id guess can't read someone else's
    select: { id: true, sessionId: true, title: true, messages: true, updatedAt: true },
  });
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.sessionId,
    title: row.title,
    turns: parse(row.messages),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteConversation(userId: string, id: string): Promise<boolean> {
  const res = await prisma.fantasyConversation.deleteMany({ where: { id, userId } });
  return res.count > 0;
}
