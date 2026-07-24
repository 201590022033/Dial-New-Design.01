import { create } from 'zustand';
import type { ExportMetadata, EngineeringExportTarget } from '@/services/exportGeometryService';

export type ExportFormat = 'svg' | 'dxf' | 'pdf' | 'png';
export type ExportScope = 'single-band' | 'grouped' | 'manufacturing-package';

interface ExportState {
  format: ExportFormat;
  scope: ExportScope;
  target: EngineeringExportTarget;
  scale: number;
  includeGuides: boolean;
  metadata: ExportMetadata;
  previewOpen: boolean;
  previewWarnings: string[];
  setFormat: (format: ExportFormat) => void;
  setScope: (scope: ExportScope) => void;
  setTarget: (target: EngineeringExportTarget) => void;
  setScale: (scale: number) => void;
  toggleGuidesExport: () => void;
  setMetadata: (metadata: Partial<ExportMetadata>) => void;
  setPreviewOpen: (open: boolean) => void;
  setPreviewWarnings: (warnings: string[]) => void;
}

export const useExportStore = create<ExportState>((set) => ({
  format: 'svg',
  scope: 'grouped',
  target: 'entire-project',
  scale: 2,
  includeGuides: false,
  metadata: {
    projectName: 'Untitled Dial Project',
    movement: 'nh35',
    caseDiameter: 42,
    revision: 'A',
    designer: 'Unknown',
    date: new Date().toISOString().slice(0, 10),
    material: 'brass',
    units: 'mm',
    manufacturingNotes: ''
  },
  previewOpen: false,
  previewWarnings: [],
  setFormat: (format) => set({ format }),
  setScope: (scope) => set({ scope }),
  setTarget: (target) => set({ target }),
  setScale: (scale) => set({ scale: Math.max(1, Math.min(8, scale)) }),
  toggleGuidesExport: () => set((state) => ({ includeGuides: !state.includeGuides })),
  setMetadata: (metadata) =>
    set((state) => ({
      metadata: {
        ...state.metadata,
        ...metadata
      }
    })),
  setPreviewOpen: (previewOpen) => set({ previewOpen }),
  setPreviewWarnings: (previewWarnings) => set({ previewWarnings })
}));
