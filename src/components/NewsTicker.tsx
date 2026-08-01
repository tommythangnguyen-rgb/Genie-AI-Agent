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

  const renderRun = (runKey: string) =>
    items.map((item) => {
      const age = relativeDay(item.publishedAt);
      return (
        <a
          key={`${runKey}-${item.id}`}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex shrink-0 items-center gap-1.5 px-3 text-[9px] md:text-[10px] leading-none transition-colors duration-150"
        >
          <span className={`font-semibold uppercase tracking-wide ${SOURCE_COLOR[item.source] ?? "text-white/70"}`}>
            {SOURCE_LABEL[item.source] ?? item.source}
          </span>
          <span className="text-white/20 select-none">·</span>
          <span className="font-medium text-white/85 group-hover:text-white">{item.title}</span>
          {item.tag && <span className="text-white/40 italic">{item.tag}</span>}
          {age && <span className="text-white/35">{age}</span>}
          <span className="pl-3 text-[#D4AF37]/30 select-none">◆</span>
        </a>
      );
    });

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
    </div>
  );
}
