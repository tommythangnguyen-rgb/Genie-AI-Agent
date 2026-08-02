import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifySession } from "@/lib/auth";
import { fantasyConfigured } from "@/lib/fantasy/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Session output files.
 *
 * The agent writes deliverables (cheat sheets, spreadsheets, audio) to
 * /mnt/session/outputs/; Anthropic captures those and exposes them via the
 * Files API scoped to the session. Downloads are proxied here rather than
 * linked directly so ANTHROPIC_API_KEY never reaches the browser.
 *
 *   GET ?sessionId=sesn_…  -> list that session's output files
 *   GET ?fileId=file_…     -> stream one file back
 */
export async function GET(req: NextRequest) {
  if (!fantasyConfigured()) return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 });

  const session = await verifySession(req);
  if (!session?.userId) return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });

  const q = req.nextUrl.searchParams;
  const sessionId = q.get("sessionId")?.trim();
  const fileId = q.get("fileId")?.trim();
  const client = new Anthropic();

  try {
    if (fileId) {
      const meta = await client.beta.files.retrieveMetadata(fileId);
      const res = await client.beta.files.download(fileId);
      const buf = Buffer.from(await res.arrayBuffer());
      const name = (meta.filename ?? "download").replace(/[^\w.\- ]+/g, "_");
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": meta.mime_type ?? "application/octet-stream",
          "Content-Length": String(buf.length),
          // `inline` so phones can preview text and play audio in-browser;
          // attachment forces an awkward download-then-find-it flow on iOS.
          "Content-Disposition": `inline; filename="${name}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    if (!sessionId) return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });

    // files.list is a Files endpoint taking a Managed Agents parameter, so the
    // managed-agents beta must be passed explicitly — the SDK only adds Files'.
    const list = await client.beta.files.list({
      scope_id: sessionId,
      betas: ["managed-agents-2026-04-01"],
    } as never);

    return NextResponse.json({
      files: (list.data ?? []).map((f) => ({
        id: f.id,
        filename: f.filename,
        sizeBytes: f.size_bytes,
        mimeType: f.mime_type,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[fantasy/files]", msg);
    return NextResponse.json({ error: "FILES_UNAVAILABLE", detail: msg }, { status: 502 });
  }
}
