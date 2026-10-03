import type { Vector3 } from "three";
import type { Mode } from "./store";

export const SINUS = {
  cx: -3.22,
  r: 1.14,
  xScale: 0.68,
} as const;

export const HELIX = {
  r: 1.14,
  pitch: 0.52,
} as const;

export const TORUS = {
  R: 2.08,
  r: 0.66,
  n: 8,
} as const;

export const MAX_THETA: Record<"sinus" | "helix" | "torus", number> = {
  sinus: Math.PI * 2 * 2.2,
  helix: Math.PI * 2 * 3.15,
  torus: Math.PI * 2,
};

export const OMEGA: Record<"sinus" | "helix" | "torus", number> = {
  sinus: 1.72,
  helix: 1.48,
  torus: 0.62,
};

export const TOUR_DURATION = 34;

export type Chapter = "sinus" | "helix" | "torus";

export function sinusCircle(theta: number, out: Vector3) {
  out.set(SINUS.cx + SINUS.r * Math.cos(theta), SINUS.r * Math.sin(theta), 0);
  return out;
}

export function sinusWave(theta: number, out: Vector3) {
  out.set(
    SINUS.cx + SINUS.r + SINUS.xScale * theta,
    SINUS.r * Math.sin(theta),
    0,
  );
  return out;
}

export function cylHelix(theta: number, out: Vector3) {
  out.set(
    HELIX.r * Math.cos(theta),
    HELIX.r * Math.sin(theta),
    HELIX.pitch * theta,
  );
  return out;
}

export function torusHelix(theta: number, out: Vector3) {
  const phi = TORUS.n * theta;
  const rho = TORUS.R + TORUS.r * Math.cos(phi);
  out.set(rho * Math.cos(theta), TORUS.r * Math.sin(phi), rho * Math.sin(theta));
  return out;
}

export function activeChapter(mode: Mode, tour: number): Chapter {
  if (mode === "sinus" || mode === "helix" || mode === "torus") return mode;
  if (tour < 0.27) return "sinus";
  if (tour < 0.52) return "helix";
  return "torus";
}

export function chapterCaption(chapter: Chapter): { kicker: string; title: string; body: string } {
  if (chapter === "sinus") {
    return {
      kicker: "1 · Cercle 2π",
      title: "Cercle → sinusoïde",
      body: "Le point rouge parcourt 2π. Déroulé dans le temps, ce mouvement devient une onde.",
    };
  }
  if (chapter === "helix") {
    return {
      kicker: "2 · Hélice cylindrique",
      title: "Le cercle avance",
      body: "Le même cercle glisse dans l’espace : le point trace une hélice cylindrique.",
    };
  }
  return {
    kicker: "3 · Hélice toroïdale",
    title: "Trois rotations emboîtées",
    body: "L’axe se courbe en tore. 2πr × 2πR × π = 4π³ r R.",
  };
}
