import { create } from 'zustand';

interface HistoryState<T = unknown> {
  past: T[];
  future: T[];
  pushSnapshot: (snapshot: T) => void;
  undo: () => T | null;
  redo: () => T | null;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  pushSnapshot: (snapshot) =>
    set((state) => ({
      past: [...state.past, snapshot],
      future: []
    })),
  undo: () => {
    const { past, future } = get();
    if (past.length === 0) {
      return null;
    }
    const latest = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [latest, ...future]
    });
    return latest;
  },
  redo: () => {
    const { past, future } = get();
    if (future.length === 0) {
      return null;
    }
    const next = future[0];
    set({
      past: [...past, next],
      future: future.slice(1)
    });
    return next;
  }
}));
