import { create } from 'zustand';

interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  mouseX: number;
  mouseY: number;
  showGuides: boolean;
  showSnapping: boolean;
  setZoom: (zoom: number) => void;
  panBy: (dx: number, dy: number) => void;
  setMousePosition: (x: number, y: number) => void;
  resetPan: () => void;
  toggleGuides: () => void;
  toggleSnapping: () => void;
}

export const useViewportStore = create<ViewportState>((set) => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  mouseX: 0,
  mouseY: 0,
  showGuides: true,
  showSnapping: true,
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(8, zoom)) }),
  panBy: (dx, dy) => set((state) => ({ panX: state.panX + dx, panY: state.panY + dy })),
  setMousePosition: (x, y) => set({ mouseX: x, mouseY: y }),
  resetPan: () => set({ panX: 0, panY: 0 }),
  toggleGuides: () => set((state) => ({ showGuides: !state.showGuides })),
  toggleSnapping: () => set((state) => ({ showSnapping: !state.showSnapping }))
}));
