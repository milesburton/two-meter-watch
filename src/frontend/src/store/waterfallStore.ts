import { create } from 'zustand';

export interface WaterfallFrame {
  timestamp: number;
  bins: number[];
  freqStart: number;
  freqEnd: number;
}

interface WaterfallState {
  frames: WaterfallFrame[];
  maxFrames: number;
  pushFrame: (frame: WaterfallFrame) => void;
}

export const useWaterfallStore = create<WaterfallState>((set) => ({
  frames: [],
  maxFrames: 200,
  pushFrame: (frame) =>
    set((state) => ({
      frames: [...state.frames, frame].slice(-state.maxFrames),
    })),
}));
