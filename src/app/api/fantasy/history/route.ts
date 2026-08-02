import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listConversations, getConversation, deleteConversation } from "@/lib/fantasy/history";

export const dynamic = "force-dynamic";

/**
 *   GET            -> list the signed-in user's conversations
 *   GET ?id=…      -> load one, with full turns
 *   DELETE ?id=…   -> remove one
 *
 * Every query is scoped to the session's userId, so an id from another
 * account resolves to nothing rather than leaking a conversation.
 */
export async function GET(req: NextRequest) {
  const session = await verifySession(req);
  if (!session?.userId) return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id")?.trim();
  try {
    if (id) {
      const convo = await getConversation(session.userId, id);
      if (!convo) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      return NextResponse.json({ conversation: convo });
    }
    return NextResponse.json({ conversations: await listConversations(session.userId) });
  } catch (err) {
    console.error("[fantasy/history]", err);
    return NextResponse.json({ error: "HISTORY_UNAVAILABLE" }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifySession(req);
  if (!session?.userId) return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

  const ok = await deleteConversation(session.userId, id);
  return NextResponse.json({ deleted: ok }, { status: ok ? 200 : 404 });
}
