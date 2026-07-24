import { create } from 'zustand';

export type ExportFormat = 'svg' | 'dxf' | 'pdf' | 'png';
export type ExportScope = 'single-band' | 'grouped' | 'manufacturing-package';

interface ExportState {
  format: ExportFormat;
  scope: ExportScope;
  scale: number;
  includeGuides: boolean;
  setFormat: (format: ExportFormat) => void;
  setScope: (scope: ExportScope) => void;
  setScale: (scale: number) => void;
  toggleGuidesExport: () => void;
}

export const useExportStore = create<ExportState>((set) => ({
  format: 'svg',
  scope: 'grouped',
  scale: 2,
  includeGuides: false,
  setFormat: (format) => set({ format }),
  setScope: (scope) => set({ scope }),
  setScale: (scale) => set({ scale: Math.max(1, Math.min(8, scale)) }),
  toggleGuidesExport: () => set((state) => ({ includeGuides: !state.includeGuides }))
}));
