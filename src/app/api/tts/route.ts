/**
 * /api/tts — one identical voice on every device.
 *
 * Previously this used msedge-tts, which opens a WebSocket to Microsoft's
 * read-aloud endpoint. Vercel's serverless runtime won't hold one, so every
 * POST ran to maxDuration and returned 504 in production (verified: three
 * consecutive attempts, all 504 at ~30.5s). It only ever worked locally.
 *
 * Browser SpeechSynthesis was the stopgap, but it plays whatever voices the
 * *operating system* has — Aria on Edge, Siri voices on iOS, Google's on
 * Android — so desktop and mobile could never match. Server-side synthesis is
 * the only way to make them identical: every client then plays the same bytes.
 *
 * Google's translate TTS endpoint is free, needs no key, and is plain HTTPS
 * (no WebSocket), so unlike msedge-tts it actually runs on Vercel. It caps a
 * request at ~200 characters, so longer text is split on sentence boundaries
 * and the resulting MP3s are concatenated — MP3 frames join cleanly.
 */

import { beautifulEloquentSpeech } from "@/lib/tts/speech-utils";

export const runtime = "nodejs";
export const maxDuration = 30;

const ENDPOINT = "https://translate.google.com/translate_tts";
const MAX_CHARS = 180; // under the ~200 hard limit, with headroom
const MAX_CHUNKS = 14; // ~2500 chars; past that the wait costs more than it's worth
const LANG = process.env.TTS_LANG ?? "en";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

export async function GET() {
  return Response.json({ provider: "google-translate-tts", lang: LANG, configured: true });
}

/** Split on sentence boundaries, then commas, so no piece exceeds the cap. */
function chunk(text: string): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]+\s*|[^.!?…]+$/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  const push = (s: string) => { if (s.trim()) out.push(s.trim()); };

  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;

    if (s.length > MAX_CHARS) {
      push(cur);
      cur = "";
      for (const part of s.split(/(?<=,)\s+/)) {
        if ((cur + " " + part).trim().length > MAX_CHARS) {
          push(cur);
          // A single clause over the cap still has to break somewhere.
          cur = part.length > MAX_CHARS ? part.slice(0, MAX_CHARS) : part;
        } else {
          cur = (cur ? cur + " " : "") + part;
        }
      }
      continue;
    }

    if ((cur + " " + s).trim().length > MAX_CHARS) {
      push(cur);
      cur = s;
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  push(cur);
  return out.slice(0, MAX_CHUNKS);
}

async function synth(part: string, idx: number, total: number): Promise<Buffer | null> {
  const url =
    `${ENDPOINT}?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(LANG)}` +
    `&total=${total}&idx=${idx}&textlen=${part.length}&q=${encodeURIComponent(part)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: "https://translate.google.com/" },
      signal: AbortSignal.timeout(9000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let text = "";
  try {
    const body = (await req.json()) as { text?: unknown };
    text = typeof body.text === "string" ? body.text : "";
  } catch {
    return Response.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const clean = beautifulEloquentSpeech(text).trim();
  if (!clean) return Response.json({ error: "EMPTY_TEXT" }, { status: 400 });

  const parts = chunk(clean);
  if (!parts.length) return Response.json({ error: "EMPTY_TEXT" }, { status: 400 });

  // Sequential, not parallel: the endpoint rate-limits under bursts, and a
  // truncated answer is worse than a slightly slower one.
  const buffers: Buffer[] = [];
  for (let i = 0; i < parts.length; i++) {
    const buf = await synth(parts[i], i, parts.length);
    if (!buf) break; // keep what we have; client falls back if nothing came back
    buffers.push(buf);
  }

  if (!buffers.length) return Response.json({ error: "TTS_UNAVAILABLE" }, { status: 502 });

  const audio = Buffer.concat(buffers);
  return new Response(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audio.length),
      // Re-reading the same answer shouldn't re-synthesise it.
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-TTS-Chunks": String(buffers.length),
    },
  });
}
