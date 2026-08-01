"use client";

import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";

type TickerItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  tag?: string;
};

const POLL_MS = 5 * 60 * 1000;
const SECONDS_PER_ITEM = 7;
const ROTATE_MS = 6000;

const SOURCE_LABEL: Record<string, string> = {
  "Federal Register": "Fed Register",
  "Inside Higher Ed": "Inside Higher Ed",
  "Higher Ed Dive": "HigherEd Dive",
};

const SOURCE_COLOR: Record<string, string> = {
  "Federal Register": "text-[#FFD700]/90",
  "Inside Higher Ed": "text-cyan-300/85",
  "Higher Ed Dive": "text-violet-300/85",
};

function relativeDay(iso: string): string | null {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then) || then <= 0) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  return null;
}

export function NewsTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [rotateIndex, setRotateIndex] = useState(0);

  // iOS Low Power Mode reports prefers-reduced-motion, not just the
  // accessibility toggle — so this path is common, not an edge case.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Sliding motion is what triggers vestibular symptoms, so the reduced path
  // swaps headlines in place on a timer instead of freezing on one.
  useEffect(() => {
    if (!reducedMotion || items.length < 2) return;
    const timer = setInterval(() => setRotateIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [reducedMotion, items.length]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/ticker/news");
        if (!res.ok) return;
        const data = (await res.json()) as { items?: TickerItem[] };
        if (!cancelled && data.items?.length) setItems(data.items);
      } catch {
        // Offline or route down — keep whatever is already on screen.
      }
    };

    load();
    const timer = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  if (items.length === 0) return null;

  // "marquee" items sit on one long track and must never shrink; the "single"
  // item is the whole row, so it shrinks and ellipsises instead of overflowing.
  const renderItem = (item: TickerItem, key: string, variant: "marquee" | "single") => {
    const age = relativeDay(item.publishedAt);
    const marquee = variant === "marquee";
    return (
      <a
        key={key}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-center gap-1.5 text-[9px] md:text-[10px] leading-none transition-colors duration-150 ${
          marquee ? "shrink-0 px-3" : "min-w-0 w-full pr-2"
        }`}
      >
        <span className={`shrink-0 font-semibold uppercase tracking-wide ${SOURCE_COLOR[item.source] ?? "text-white/70"}`}>
          {SOURCE_LABEL[item.source] ?? item.source}
        </span>
        <span className="shrink-0 text-white/20 select-none">·</span>
        <span className={`font-medium text-white/85 group-hover:text-white ${marquee ? "" : "min-w-0 truncate"}`}>
          {item.title}
        </span>
        {item.tag && <span className="shrink-0 text-white/40 italic">{item.tag}</span>}
        {age && <span className="shrink-0 text-white/35">{age}</span>}
        {marquee && <span className="pl-3 text-[#D4AF37]/30 select-none">◆</span>}
      </a>
    );
  };

  const renderRun = (runKey: string) =>
    items.map((item) => renderItem(item, `${runKey}-${item.id}`, "marquee"));

  return (
    <div
      className="shrink-0 relative flex items-center gap-2 border-y border-[#D4AF37]/15 bg-black/35 px-2 py-1 backdrop-blur-sm md:px-3"
      style={{ zIndex: 40 }}
      aria-label="Higher education and federal aid policy headlines"
    >
      <span className="flex shrink-0 items-center gap-1 border-r border-[#D4AF37]/20 pr-2 text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-[#D4AF37]/80">
        <Newspaper className="h-3 w-3" />
        <span className="hidden sm:inline">Aid News</span>
      </span>

      {reducedMotion ? (
        <div className="min-w-0 flex-1 overflow-hidden" aria-live="off">
          {/* Keyed on the index so React remounts the node and the fade replays. */}
          <div key={rotateIndex} className="genie-ticker-fade flex min-w-0 pl-3">
            {renderItem(items[rotateIndex % items.length], `static-${rotateIndex}`, "single")}
          </div>
        </div>
      ) : (
        <div className="genie-ticker-viewport min-w-0 flex-1">
          <div
            className="genie-ticker-track"
            style={{ ["--ticker-dur" as string]: `${items.length * SECONDS_PER_ITEM}s` }}
          >
            <div className="flex">{renderRun("a")}</div>
            {/* Duplicate run — the animation scrolls exactly one run's width so the
                seam never shows. aria-hidden keeps screen readers from repeating. */}
            <div className="flex" aria-hidden="true">{renderRun("b")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
