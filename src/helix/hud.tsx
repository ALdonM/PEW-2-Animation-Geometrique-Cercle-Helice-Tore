import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { activeChapter, chapterCaption, MAX_THETA } from "./math";
import { anim, useHelix, type Mode } from "./store";

const MODES: { id: Mode; label: string }[] = [
  { id: "sinus", label: "Cercle → sinus" },
  { id: "helix", label: "Hélice" },
  { id: "torus", label: "Tore 4π³" },
  { id: "tour", label: "Film" },
];

const SPEEDS = [0.5, 1, 1.5, 2];

function useAnimTick() {
  const [, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 60) {
        last = t;
        setN((n) => n + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

export function Hud() {
  const mode = useHelix((s) => s.mode);
  const playing = useHelix((s) => s.playing);
  const speed = useHelix((s) => s.speed);
  const setMode = useHelix((s) => s.setMode);
  const toggle = useHelix((s) => s.toggle);
  const setSpeed = useHelix((s) => s.setSpeed);
  const reset = useHelix((s) => s.reset);
  useAnimTick();

  const chapter = activeChapter(mode, anim.tour);
  const copy = chapterCaption(chapter);
  const max = MAX_THETA[chapter];
  const progress = max > 0 ? Math.min(anim.theta / max, 1) : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "1") setMode("sinus");
      else if (e.key === "2") setMode("helix");
      else if (e.key === "3") setMode("torus");
      else if (e.key === "4") setMode("tour");
      else if (e.key === "r" || e.key === "R") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, setMode, reset]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="max-w-[16rem] sm:max-w-sm">
          <p className="font-display text-3xl leading-none tracking-tight text-fg sm:text-4xl">4π³</p>
          <p className="mt-1 text-xs text-muted sm:text-sm">{copy.kicker}</p>
          <h1 className="mt-0.5 font-display text-base leading-snug text-fg sm:text-lg">{copy.title}</h1>
          <p className="mt-1 hidden text-sm leading-normal text-pretty text-muted sm:block">{copy.body}</p>
        </div>

        <div className="max-w-[11rem] text-right sm:max-w-xs">
          <p className="font-display text-base leading-tight text-fg sm:text-xl">2πr × 2πR × π</p>
          <p className="font-display text-sm text-accent sm:text-lg">= 4π³ r R</p>
          <ul className="mt-2 hidden space-y-1 text-left text-xs text-muted sm:block">
            <li className={cn(chapter === "sinus" && "text-fg")}>2π r — section du fil</li>
            <li className={cn(chapter === "helix" && "text-fg")}>2π R — grand cercle</li>
            <li className={cn(chapter === "torus" && "text-fg")}>π — phase ℤ₂</li>
          </ul>
        </div>
      </header>

      <footer className="pointer-events-auto mt-3 flex flex-col gap-2">
        <div className="h-1 overflow-hidden rounded-full bg-bg-subtle/80" aria-hidden="true">
          <div className="h-full bg-accent" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>

        <div className="flex flex-col gap-1 rounded-xl bg-bg-elevated/88 p-1.5 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between sm:p-1.5">
          <div className="flex flex-wrap gap-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "min-h-11 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                  mode === m.id
                    ? "bg-accent text-accent-fg"
                    : "text-muted hover:bg-bg-subtle hover:text-fg",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-fg hover:bg-bg-subtle"
              aria-label={playing ? "Pause" : "Lecture"}
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-bg-subtle hover:text-fg"
              aria-label="Recommencer"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const i = SPEEDS.indexOf(speed);
                setSpeed(SPEEDS[(i + 1) % SPEEDS.length] ?? 1);
              }}
              className="min-h-11 rounded-md px-3 font-mono text-sm tabular-nums text-muted hover:bg-bg-subtle hover:text-fg"
              aria-label="Vitesse"
            >
              {speed}×
            </button>
            {chapter !== "sinus" ? (
              <p className="hidden pr-2 text-xs text-subtle sm:block">Glissez pour orbiter</p>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
