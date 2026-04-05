"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const VOL_KEY = "genie-music-volume";

const PLAYLIST = [
  // Debussy
  {
    title: "Clair de Lune",
    composer: "Debussy",
    src: "https://upload.wikimedia.org/wikipedia/commons/b/be/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg",
  },
  {
    title: "Première Arabesque",
    composer: "Debussy",
    src: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Claude_Debussy_-_Premi%C3%A8re_Arabesque_-_Patrizia_Prati.ogg",
  },
  {
    title: "Deuxième Arabesque",
    composer: "Debussy",
    src: "https://upload.wikimedia.org/wikipedia/commons/8/89/Claude_Debussy_-_Deuxi%C3%A8me_Arabesque_-_Patrizia_Prati.ogg",
  },
  {
    title: "La Cathédrale engloutie",
    composer: "Debussy",
    src: "https://upload.wikimedia.org/wikipedia/commons/7/78/La_Cath%C3%A9drale_engloutie_-_Claude_Debussy_-_performed_by_Ivan_Ilic.ogg",
  },
  // Chopin
  {
    title: "Nocturne Op. 9 No. 2",
    composer: "Chopin",
    src: "https://upload.wikimedia.org/wikipedia/commons/0/04/Chopin_Nocturne_No._2_in_E_Flat_Major%2C_Op._9.ogg",
  },
  {
    title: "Nocturne Op. 32 No. 1",
    composer: "Chopin",
    src: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Chopin%2C_Nocturne_op_32_no_1.ogg",
  },
  {
    title: "Fantaisie-Impromptu Op. 66",
    composer: "Chopin",
    src: "https://upload.wikimedia.org/wikipedia/commons/6/62/Frederic_Chopin_-_Fantasy_Impromptu_Opus_66.ogg",
  },
  {
    title: "Grande Valse Brillante Op. 18",
    composer: "Chopin",
    src: "https://upload.wikimedia.org/wikipedia/commons/1/12/Chopin_Grande_Valse_brilliante_op18.ogg",
  },
  {
    title: "Minute Waltz Op. 64 No. 1",
    composer: "Chopin",
    src: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Muriel-Nguyen-Xuan-Chopin-valse-opus64-1.ogg",
  },
  // Beethoven
  {
    title: "Moonlight Sonata – I. Adagio",
    composer: "Beethoven",
    src: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Moonlight_Sonata.ogg",
  },
  {
    title: "Moonlight Sonata – II. Allegretto",
    composer: "Beethoven",
    src: "https://upload.wikimedia.org/wikipedia/commons/4/47/Beethoven_Moonlight_2nd_movement.ogg",
  },
  {
    title: "Für Elise",
    composer: "Beethoven",
    src: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Fur_Elise.ogg",
  },
  // Bach
  {
    title: "Prelude in C Major (WTC I)",
    composer: "J.S. Bach",
    src: "https://upload.wikimedia.org/wikipedia/commons/6/62/Johann_Sebastian_Bach_-_The_Well-tempered_Clavier_-_Book_1_-_02Epre_cmaj.ogg",
  },
  {
    title: "Air on the G String",
    composer: "J.S. Bach",
    src: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Air_%28Bach%29.ogg",
  },
  {
    title: "Adagio in D Minor (arr. Marcello)",
    composer: "J.S. Bach",
    src: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Bach-Marcello-Adagio_BWV974-Stephan.ogg",
  },
  // Satie
  {
    title: "Gymnopédie No. 1",
    composer: "Satie",
    src: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Gymnopedie_No._1..ogg",
  },
  // Mozart
  {
    title: "Piano Sonata No. 14 in C Minor",
    composer: "Mozart",
    src: "https://upload.wikimedia.org/wikipedia/commons/8/86/Mozart_-_Piano_Sonata_No._14.ogg",
  },
  {
    title: "Piano Sonata in A Minor K. 310",
    composer: "Mozart",
    src: "https://upload.wikimedia.org/wikipedia/commons/6/67/Mozart_Piano_Sonata_Amin1.ogg",
  },
  {
    title: "Piano Concerto No. 27 – II. Larghetto",
    composer: "Mozart",
    src: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Mozart%3B_Piano_Concerto_No._27%2C_2._Larghetto_in_E_Flat_Major.ogg",
  },
  // Schubert
  {
    title: "Impromptu in B-flat Major D. 935",
    composer: "Schubert",
    src: "https://upload.wikimedia.org/wikipedia/commons/9/90/Schubert-_Impromptu_B-flat.ogg",
  },
  {
    title: "Piano Sonata – II. Andante",
    composer: "Schubert",
    src: "https://upload.wikimedia.org/wikipedia/commons/7/77/Schubert_-_Piano_Sonatas_-_2_Andante.ogg",
  },
  // Vivaldi
  {
    title: "The Four Seasons – Spring I",
    composer: "Vivaldi",
    src: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Vivaldi_-_Four_Seasons_1_Spring_mvt_1_Allegro_-_John_Harrison_violin.oga",
  },
  {
    title: "The Four Seasons – Spring II",
    composer: "Vivaldi",
    src: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Vivaldi_-_Four_Seasons_1_Spring_mvt_2_Largo_-_John_Harrison_violin.oga",
  },
  {
    title: "The Four Seasons – Winter II",
    composer: "Vivaldi",
    src: "https://upload.wikimedia.org/wikipedia/commons/b/b1/11_-_Vivaldi_Winter_mvt_2_Largo_-_John_Harrison_violin.ogg",
  },
  // Handel
  {
    title: "Water Music – Air",
    composer: "Handel",
    src: "https://upload.wikimedia.org/wikipedia/commons/0/03/5-George_Frideric_Handel_-_Water_Music_Suite_in_F_major_%28Air%29_HWV348.ogg",
  },
  // Violin — Vivaldi (calm movements)
  {
    title: "The Four Seasons – Autumn II (Adagio)",
    composer: "Vivaldi",
    src: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Vivaldi_-_Four_Seasons_3_Autumn_mvt_2_Adagio_molto_-_John_Harrison_violin.oga",
  },
  {
    title: "The Four Seasons – Winter I (Largo)",
    composer: "Vivaldi",
    src: "https://upload.wikimedia.org/wikipedia/commons/4/42/Vivaldi_-_Four_Seasons_4_Winter_mvt_1_Allegro_non_molto_-_John_Harrison_violin.oga",
  },
  {
    title: "The Four Seasons – Summer II (Adagio)",
    composer: "Vivaldi",
    src: "https://upload.wikimedia.org/wikipedia/commons/5/58/Vivaldi_-_Four_Seasons_2_Summer_mvt_2_Adagio_e_piano-_Presto_e_forte_-_John_Harrison_violin.oga",
  },
  // Cello — Bach Cello Suites
  {
    title: "Cello Suite No. 1 – Prélude",
    composer: "J.S. Bach",
    src: "https://upload.wikimedia.org/wikipedia/commons/2/22/Johann_Sebastian_Bach_-_Cello_suite_1_BWV_1007_1_prelude.ogg",
  },
  {
    title: "Cello Suite No. 1 – Allemande",
    composer: "J.S. Bach",
    src: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Johann_Sebastian_Bach_-_Cello_suite_1_BWV_1007_2_allemande.ogg",
  },
  {
    title: "Cello Suite No. 1 – Sarabande",
    composer: "J.S. Bach",
    src: "https://upload.wikimedia.org/wikipedia/commons/c/c6/Johann_Sebastian_Bach_-_Cello_suite_1_BWV_1007_4_sarabande.ogg",
  },
  {
    title: "Cello Suite No. 2 – Prélude",
    composer: "J.S. Bach",
    src: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Johann_Sebastian_Bach_-_Cello_suite_2_BWV_1008_1_prelude.ogg",
  },
  // Opera — calm & soothing
  {
    title: "Ave Maria",
    composer: "Schubert",
    src: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Schubert_-_Ave_Maria.ogg",
  },
  {
    title: "Ombra mai fu (Serse)",
    composer: "Handel",
    src: "https://upload.wikimedia.org/wikipedia/commons/0/09/G.F.Handel-Serse-Ombra_mai_fu.ogg",
  },
  {
    title: "Lacrimosa (Requiem K. 626)",
    composer: "Mozart",
    src: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Mozart_-_Requiem_-_8._Lacrimosa.ogg",
  },
  {
    title: "O Mio Babbino Caro (Gianni Schicchi)",
    composer: "Puccini",
    src: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Puccini-o_mio_babbino_caro.ogg",
  },
  {
    title: "Pie Jesu (Requiem)",
    composer: "Fauré",
    src: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Faure-requiem-pie-jesu.ogg",
  },
];

function shuffleArray(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

export function BackgroundMusic({ inline = false }: { inline?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  // Shuffle queue: array of playlist indices in random order
  const [queue, setQueue] = useState<number[]>(() => shuffleArray(PLAYLIST.map((_, i) => i)));
  const [queuePos, setQueuePos] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.15);
  const [visible, setVisible] = useState(false);

  const trackIdx = queue[queuePos];
  const track = PLAYLIST[trackIdx];

  // Advance to next shuffled track; reshuffle when queue exhausted
  const advanceQueue = useCallback(() => {
    setQueuePos(pos => {
      const next = pos + 1;
      if (next < PLAYLIST.length) return next;
      // Reshuffle for the next round, avoiding repeating the last track
      setQueue(prev => {
        const reshuffled = shuffleArray(PLAYLIST.map((_, i) => i));
        if (reshuffled[0] === prev[prev.length - 1]) {
          // Swap first and last to avoid immediate repeat
          [reshuffled[0], reshuffled[reshuffled.length - 1]] = [reshuffled[reshuffled.length - 1], reshuffled[0]];
        }
        return reshuffled;
      });
      return 0;
    });
  }, []);

  // Restore volume on mount + listen for external play trigger
  useEffect(() => {
    const savedVol = parseFloat(localStorage.getItem(VOL_KEY) ?? "0.15");
    setVolume(isNaN(savedVol) ? 0.15 : Math.min(1, Math.max(0, savedVol)));
    setVisible(true);

    const onExternalPlay = () => setIsPlaying(true);
    window.addEventListener("genie-music-play", onExternalPlay);
    return () => window.removeEventListener("genie-music-play", onExternalPlay);
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
  }, [isPlaying]);

  // Reload src when track changes; resume if playing
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.load();
    if (isPlaying) el.play().catch(() => setIsPlaying(false));
  }, [trackIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => setIsPlaying(p => !p);
  const skipNext   = () => advanceQueue();
  const toggleMute = () => setMuted(m => !m);

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    localStorage.setItem(VOL_KEY, String(v));
  };

  if (!visible) return null;

  const controls = (
    <>
      {/* Music note */}
      <span className={`transition-colors shrink-0 ${isPlaying ? "text-indigo-400/70 animate-pulse" : "text-white/30"}`}>
        <MusicNoteIcon />
      </span>

      {/* Track info */}
      <div className="flex flex-col leading-none min-w-0 max-w-[88px]">
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
        title="Next track (shuffle)"
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
        className="w-12 h-1 accent-indigo-400 cursor-pointer"
        title="Volume"
      />
    </>
  );

  /* Inline mode — polished header-integrated strip */
  const inlineControls = (
    <div className="flex items-center gap-2 select-none min-w-0">
      {/* Animated note — cyan when playing */}
      <span className={`transition-colors shrink-0 ${isPlaying ? "text-cyan-400/80 animate-pulse" : "text-white/22"}`}>
        <MusicNoteIcon />
      </span>

      {/* Track info */}
      <div className="flex flex-col leading-none min-w-0 w-[92px] shrink-0">
        <span className="text-[10px] font-semibold text-white/62 truncate">{track.title}</span>
        <span className="text-[9px] text-white/30 truncate">{track.composer}</span>
      </div>

      {/* Thin separator */}
      <div className="w-px h-3.5 bg-white/[0.09] shrink-0" />

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        title={isPlaying ? "Pause" : "Play"}
        className="p-1.5 rounded-lg text-white/45 hover:text-cyan-300 hover:bg-cyan-500/[0.12] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      {/* Skip */}
      <button
        onClick={skipNext}
        title="Next track"
        className="p-1.5 rounded-lg text-white/28 hover:text-cyan-300 hover:bg-cyan-500/[0.12] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60"
      >
        <SkipIcon />
      </button>

      {/* Thin separator */}
      <div className="w-px h-3.5 bg-white/[0.09] shrink-0" />

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        title={muted ? "Unmute" : "Mute"}
        className="p-1.5 rounded-lg text-white/28 hover:text-cyan-300 hover:bg-cyan-500/[0.12] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60"
      >
        {muted ? <MuteIcon /> : <VolumeIcon />}
      </button>

      {/* Volume slider — cyan accent */}
      <input
        type="range"
        min={0} max={1} step={0.01}
        value={muted ? 0 : volume}
        onChange={handleVolume}
        className="w-14 h-1 accent-cyan-400 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
        title="Volume"
      />
    </div>
  );

  return (
    <>
      <audio ref={audioRef} onEnded={advanceQueue} preload="none" crossOrigin="anonymous">
        <source src={track.src} type="audio/ogg" />
      </audio>

      {inline ? (
        inlineControls
      ) : (
        /* Fixed floating pill — bottom-right fallback for other pages */
        <div
          className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-2.5 py-1.5 rounded-full select-none"
          style={{ background: "rgba(7,16,50,0.82)", backdropFilter: "blur(12px)", boxShadow: "0 2px 16px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)" }}
        >
          {controls}
        </div>
      )}
    </>
  );
}
