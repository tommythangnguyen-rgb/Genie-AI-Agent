"use client";

/**
 * Shared browser speech for the aid agent and the fantasy assistant.
 *
 * Why browser-native rather than /api/tts: that route uses msedge-tts, which
 * opens a WebSocket to Microsoft's read-aloud endpoint. Vercel's serverless
 * runtime won't hold one, so in production every POST runs to the route's 30s
 * maxDuration and returns 504 (verified: three consecutive attempts, all 504
 * at ~30.5s, while GET returns 200). It works locally, which is why it went
 * unnoticed until deploy.
 *
 * SpeechSynthesis is free, has no quota, needs no key, and — critically — on
 * Edge it exposes the *same* Microsoft neural voices msedge-tts was reaching
 * for (Aria/Emma/Ava "Online (Natural)"), and on Apple platforms the Siri-
 * quality enhanced voices. So on most browsers this is equal or better than
 * the server path, with no network round trip.
 */

const PREFERRED_RATE = 0.94; // slightly under 1.0 reads as calm rather than rushed
const PREFERRED_PITCH = 1.0;
const MAX_CHUNK_CHARS = 190;

/** Soft/warm female voices, best first, per platform. Matched case-insensitively. */
const MICROSOFT_NEURAL = ["aria", "emma", "ava", "jenny", "michelle", "sara", "nancy", "amber"];
const APPLE_ENHANCED = ["ava", "allison", "samantha", "susan", "zoe", "karen", "moira", "serena"];
const GOOGLE_VOICES = ["google us english", "google uk english female"];
const FEMALE_HINTS = [
  ...MICROSOFT_NEURAL, ...APPLE_ENHANCED,
  "female", "woman", "zira", "hazel", "catherine", "linda", "heather", "eva",
];

/**
 * Higher is better. Ranks toward the softest, most natural female voice the
 * platform actually offers rather than trusting `default`, which is usually
 * the flattest option available.
 */
export function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  const lang = (v.lang || "").toLowerCase();
  let score = 0;

  if (lang.startsWith("en")) score += 40;
  if (lang.startsWith("en-us") || lang.startsWith("en_us")) score += 10;
  if (lang.startsWith("en-gb") || lang.startsWith("en_gb")) score += 6; // often warmer

  // Microsoft's Edge neural voices — the best free option anywhere.
  const isNatural = name.includes("natural") || name.includes("online");
  if (isNatural && MICROSOFT_NEURAL.some((n) => name.includes(n))) score += 120;
  else if (isNatural) score += 70;

  // Apple premium/enhanced Siri-tier voices.
  if (name.includes("premium")) score += 90;
  else if (name.includes("enhanced")) score += 75;
  if (APPLE_ENHANCED.some((n) => name.includes(n))) score += 45;

  if (GOOGLE_VOICES.some((n) => name.includes(n))) score += 55;

  if (FEMALE_HINTS.some((n) => name.includes(n))) score += 30;

  // Network voices are generally the neural ones; local are the old formant
  // synths. Only a mild nudge — Apple's best voices are local once downloaded.
  if (!v.localService) score += 12;

  // Explicitly demote the robotic legacy voices.
  if (/\b(albert|bad news|bahh|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|daniel|alex)\b/.test(name)) {
    score -= 80;
  }
  if (name.includes("compact")) score -= 40;

  return score;
}

/** Voices load asynchronously in Chrome; resolve once they're actually there. */
function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length) { resolve(existing); return; }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.onvoiceschanged = null;
      resolve(synth.getVoices());
    };
    synth.onvoiceschanged = finish;
    setTimeout(finish, timeoutMs);
  });
}

let cachedVoice: SpeechSynthesisVoice | null = null;

export async function pickVoice(): Promise<SpeechSynthesisVoice | null> {
  if (cachedVoice) return cachedVoice;
  const voices = await loadVoices();
  if (!voices.length) return null;
  const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  cachedVoice = ranked[0] ?? null;
  return cachedVoice;
}

/** Name of the voice that will be used — for a UI hint. */
export async function currentVoiceName(): Promise<string | null> {
  const v = await pickVoice();
  return v?.name ?? null;
}

/**
 * Split on sentence boundaries. Chrome truncates long utterances (the
 * ~15-second cutoff), so queueing sentence-sized pieces is what makes a long
 * answer play all the way through.
 */
export function chunkForSpeech(text: string): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]+[\])'"`»]*\s*|[^.!?…]+$/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (s.length > MAX_CHUNK_CHARS) {
      if (current) { chunks.push(current); current = ""; }
      for (const part of s.split(/,\s*|;\s*|\s+—\s+/)) {
        const p = part.trim();
        if (!p) continue;
        if ((current + " " + p).trim().length > MAX_CHUNK_CHARS) {
          if (current) chunks.push(current);
          current = p;
        } else {
          current = (current ? current + ", " : "") + p;
        }
      }
      continue;
    }
    if ((current + " " + s).trim().length > MAX_CHUNK_CHARS) {
      if (current) chunks.push(current);
      current = s;
    } else {
      current = current ? `${current} ${s}` : s;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Strip markdown and emoji so the voice reads prose, not syntax. */
export function stripForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "code block omitted")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Drop list markers — "dash Snap share" reads badly aloud. The line break
    // becomes a sentence stop below, which is the pause a bullet implies.
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/[*_~>|]/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ". ")
    .replace(/\s{2,}/g, " ")
    // Emoji and marker removal can leave " ." or stacked stops; tidy so the
    // voice doesn't pause twice or trail off oddly.
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.!?])[.\s]*(?=[.!?])/g, "")
    .replace(/\.{2,}/g, ".")
    .trim();
}

export function cancelSpeech(): void {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}

export type SpeakHandle = { cancel: () => void };

/**
 * Speak `text`, returning a handle so the caller can stop it. `onEnd` fires
 * once when the whole passage finishes (or fails), never per chunk.
 */
export async function speakText(
  text: string,
  opts: { onEnd?: () => void; onStart?: () => void } = {}
): Promise<SpeakHandle> {
  const noop: SpeakHandle = { cancel: () => {} };
  if (typeof window === "undefined" || !window.speechSynthesis) {
    opts.onEnd?.();
    return noop;
  }

  const synth = window.speechSynthesis;
  const voice = await pickVoice();
  const chunks = chunkForSpeech(text);
  if (!chunks.length) { opts.onEnd?.(); return noop; }

  let cancelled = false;
  let index = 0;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearInterval(keepAlive);
    opts.onEnd?.();
  };

  // Chrome pauses long synthesis after ~15s; a periodic resume keeps a queued
  // passage from stalling mid-answer.
  const keepAlive = setInterval(() => {
    if (cancelled || finished) { clearInterval(keepAlive); return; }
    if (synth.speaking && !synth.paused) synth.resume();
  }, 8000);

  const speakNext = () => {
    if (cancelled) { finish(); return; }
    if (index >= chunks.length) { finish(); return; }

    const utter = new SpeechSynthesisUtterance(chunks[index++]);
    if (voice) { utter.voice = voice; utter.lang = voice.lang; }
    utter.rate = PREFERRED_RATE;
    utter.pitch = PREFERRED_PITCH;
    utter.volume = 1;
    utter.onend = () => { if (!cancelled) speakNext(); else finish(); };
    utter.onerror = () => {
      // "interrupted"/"canceled" are the expected result of a user stop.
      if (!cancelled) speakNext(); else finish();
    };
    synth.speak(utter);
  };

  synth.cancel();
  opts.onStart?.();
  speakNext();

  return {
    cancel: () => {
      cancelled = true;
      synth.cancel();
      finish();
    },
  };
}
