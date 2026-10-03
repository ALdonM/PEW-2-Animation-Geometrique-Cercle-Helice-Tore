import { create } from "zustand";

export type Mode = "sinus" | "helix" | "torus" | "tour";

export const anim = {
  theta: 0,
  tour: 0,
  hold: 0,
};

type HelixState = {
  mode: Mode;
  playing: boolean;
  speed: number;
  setMode: (mode: Mode) => void;
  toggle: () => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
};

function rewind() {
  anim.theta = 0;
  anim.tour = 0;
  anim.hold = 0;
}

export const useHelix = create<HelixState>((set) => ({
  mode: "torus",
  playing: true,
  speed: 1,
  setMode: (mode) => {
    rewind();
    set({ mode, playing: true });
  },
  toggle: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (speed) => set({ speed }),
  reset: () => {
    rewind();
    set((s) => ({ ...s }));
  },
}));
