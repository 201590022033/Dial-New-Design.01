import { create } from 'zustand';

export type ExportFormat = 'svg' | 'png' | 'pdf';

interface ExportState {
  format: ExportFormat;
  scale: number;
  includeGuides: boolean;
  setFormat: (format: ExportFormat) => void;
  setScale: (scale: number) => void;
  toggleGuidesExport: () => void;
}

export const useExportStore = create<ExportState>((set) => ({
  format: 'svg',
  scale: 2,
  includeGuides: false,
  setFormat: (format) => set({ format }),
  setScale: (scale) => set({ scale: Math.max(1, Math.min(8, scale)) }),
  toggleGuidesExport: () => set((state) => ({ includeGuides: !state.includeGuides }))
}));
