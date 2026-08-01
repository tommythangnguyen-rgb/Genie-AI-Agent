"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Microphone dictation via the browser's SpeechRecognition API.
 *
 * Same reasoning as the read-aloud side: it's free, needs no key, and runs
 * entirely in the browser, so no audio ever reaches our servers. That matters
 * on a site with a School DPA — nothing spoken is transmitted or stored by us.
 *
 * Chrome, Edge and Safari support it (Safari and older Chrome under the
 * webkit- prefix). Firefox does not, so callers must handle `supported`.
 */

type RecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechInput = {
  supported: boolean;
  listening: boolean;
  /** Live partial text — render it, but don't treat it as committed. */
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
};

/**
 * `onFinal` receives each committed phrase. It fires per phrase rather than
 * once at the end so the caller can append progressively — the API commits
 * results as the speaker pauses, not only when recognition stops.
 */
export function useSpeechInput(onFinal: (text: string) => void): SpeechInput {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<RecognitionLike | null>(null);
  // Keep the latest callback without re-creating recognition on every render.
  const onFinalRef = useRef(onFinal);
  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
    return () => { recRef.current?.abort?.(); recRef.current = null; };
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop?.();
    recRef.current = null;
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { setError("This browser can't do voice input — try Chrome, Edge or Safari."); return; }
    if (recRef.current) return;

    // Dictating while an answer is being read back would capture our own
    // audio and produce garbage.
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();

    setError(null);
    const rec = new Ctor();
    rec.lang = "en-US";
    // Keep the mic open across pauses — people think mid-sentence when
    // describing a lineup question.
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);

    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) onFinalRef.current(text.trim());
        else live += text;
      }
      setInterim(live);
    };

    rec.onerror = (e) => {
      const code = e?.error ?? "";
      if (code === "no-speech" || code === "aborted") return; // expected, not worth surfacing
      setError(
        code === "not-allowed" || code === "service-not-allowed"
          ? "Microphone access was blocked. Allow it in your browser settings."
          : "Voice input stopped unexpectedly. Try again."
      );
      recRef.current = null;
      setListening(false);
      setInterim("");
    };

    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      setInterim("");
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      // start() throws if called twice in quick succession.
      recRef.current = null;
      setListening(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, interim, error, start, stop, toggle };
}
