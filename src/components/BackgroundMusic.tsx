"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const PREF_KEY = "genie-music-playing";
const VOL_KEY  = "genie-music-volume";

const PLAYLIST = [
  {
    title: "Clair de Lune",
    composer: "Debussy",
    src: "https://upload.wikimedia.org/wikipedia/commons/b/be/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg",
  },
  {
    title: "Nocturne Op. 9 No. 2",
    composer: "Chopin",
    src: "https://upload.wikimedia.org/wikipedia/commons/0/04/Chopin_Nocturne_No._2_in_E_Flat_Major%2C_Op._9.ogg",
  },
  {
    title: "Moonlight Sonata",
    composer: "Beethoven",
    src: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Moonlight_Sonata.ogg",
  },
  {
    title: "Prelude in C Major",
    composer: "J.S. Bach",
    src: "https://upload.wikimedia.org/wikipedia/commons/6/62/Johann_Sebastian_Bach_-_The_Well-tempered_Clavier_-_Book_1_-_02Epre_cmaj.ogg",
  },
  {
    title: "Für Elise",
    composer: "Beethoven",
    src: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Fur_Elise.ogg",
  },
];

// ── tiny icons ────────────────────────────────────────────────────────────────
function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M4 3.2L13 8l-9 4.8V3.2z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <rect x="3" y="2.5" width="3.5" height="11" rx="1" />
      <rect x="9.5" y="2.5" width="3.5" height="11" rx="1" />
    </svg>
  );
}
function SkipIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
      <path d="M3 3.2L10 8l-7 4.8V3.2z" />
      <rect x="11" y="3" width="2.5" height="10" rx="1" />
    </svg>
  );
}
function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
      <path d="M6 2.5v7.27A2.5 2.5 0 1 0 8 12V5.5l4-1V2L6 3.5V2.5z" />
    </svg>
  );
}
function MuteIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
      <path d="M8 2L4.5 5.5H2v5h2.5L8 14V2z" />
      <line x1="11" y1="6" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="6" x2="11" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function VolumeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
      <path d="M8 2L4.5 5.5H2v5h2.5L8 14V2z" />
      <path d="M11 5.5a4 4 0 0 1 0 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.15);
  const [visible, setVisible] = useState(false);

  // Restore prefs on mount
  useEffect(() => {
    const savedVol = parseFloat(localStorage.getItem(VOL_KEY) ?? "0.15");
    setVolume(isNaN(savedVol) ? 0.15 : Math.min(1, Math.max(0, savedVol)));
    // Don't auto-restore playing state — browser blocks autoplay without gesture
    setVisible(true);
  }, []);

  // Sync volume/mute to audio element
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Play/pause
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.play().catch(() => setIsPlaying(false));
    } else {
      el.pause();
    }
    localStorage.setItem(PREF_KEY, isPlaying ? "1" : "0");
  }, [isPlaying]);

  // Advance to next track when current ends
  const handleEnded = useCallback(() => {
    setTrackIdx(i => (i + 1) % PLAYLIST.length);
  }, []);

  // Reload src when track changes; resume if playing
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.load();
    if (isPlaying) el.play().catch(() => setIsPlaying(false));
  }, [trackIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => setIsPlaying(p => !p);
  const skipNext   = () => setTrackIdx(i => (i + 1) % PLAYLIST.length);
  const toggleMute = () => setMuted(m => !m);

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    localStorage.setItem(VOL_KEY, String(v));
  };

  const track = PLAYLIST[trackIdx];

  if (!visible) return null;

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        preload="none"
        crossOrigin="anonymous"
      >
        <source src={track.src} type="audio/ogg" />
      </audio>

      {/* Player pill */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/[0.05] ring-1 ring-white/[0.08] hover:bg-white/[0.08] transition-colors select-none">
        {/* Music note */}
        <span className={`text-white/30 transition-colors ${isPlaying ? "text-indigo-400/70 animate-pulse" : ""}`}>
          <MusicNoteIcon />
        </span>

        {/* Track info */}
        <div className="flex flex-col leading-none min-w-0 max-w-[90px]">
          <span className="text-[10px] font-semibold text-white/60 truncate">{track.title}</span>
          <span className="text-[9px] text-white/30 truncate">{track.composer}</span>
        </div>

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          title={isPlaying ? "Pause" : "Play"}
          className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/[0.10] transition-colors focus-visible:outline-none"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Skip */}
        <button
          onClick={skipNext}
          title="Next track"
          className="p-1 rounded-full text-white/30 hover:text-white hover:bg-white/[0.10] transition-colors focus-visible:outline-none"
        >
          <SkipIcon />
        </button>

        {/* Mute + volume slider */}
        <button
          onClick={toggleMute}
          title={muted ? "Unmute" : "Mute"}
          className="p-1 rounded-full text-white/30 hover:text-white hover:bg-white/[0.10] transition-colors focus-visible:outline-none"
        >
          {muted ? <MuteIcon /> : <VolumeIcon />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={handleVolume}
          className="w-14 h-1 accent-indigo-400 cursor-pointer"
          title="Volume"
        />
      </div>
    </>
  );
}
