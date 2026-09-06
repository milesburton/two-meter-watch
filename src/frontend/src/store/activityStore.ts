import { create } from 'zustand';

export interface ActivityRollup {
  timestamp: number;
  freq_range_start: number;
  freq_range_end: number;
  peak_db: number;
  avg_db: number;
}

interface ActivityState {
  rollups: ActivityRollup[];
  loading: boolean;
  error: string | null;
  setRollups: (rollups: ActivityRollup[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  rollups: [],
  loading: false,
  error: null,
  setRollups: (rollups) => set({ rollups }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
