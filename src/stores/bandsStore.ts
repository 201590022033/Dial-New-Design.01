import { create } from 'zustand';
import { createBand } from '@/domain/bands/bandRegistry';
import type { BandEntity, BandId, BandKind } from '@/domain/bands/types';
import { chainConcentricBands } from '@/domain/geometry/geometryEngine';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';
import { validateManufacturing } from '@/domain/manufacturing/validationEngine';
import type { DonutGeometry } from '@/types/geometry';

interface BandsState {
  bands: BandEntity[];
  warnings: string[];
  addBand: (kind: BandKind, geometry: DonutGeometry) => void;
  updateBand: (id: BandId, updater: (band: BandEntity) => BandEntity) => void;
  removeBand: (id: BandId) => void;
  reorderBands: (fromIndex: number, toIndex: number) => void;
  syncWithGeometryEngine: (params: GlobalGeometryParameters) => void;
}

const initialBands: BandEntity[] = [
  createBand('band-dial-face', 'dial-face', { innerRadius: 0, outerRadius: 14 }),
  createBand('band-chapter-ring', 'chapter-ring', { innerRadius: 14, outerRadius: 17 }),
  createBand('band-inner-bezel', 'inner-bezel', { innerRadius: 17, outerRadius: 18.5 }),
  createBand('band-outer-bezel', 'outer-bezel', { innerRadius: 18.5, outerRadius: 20 })
];

export const useBandsStore = create<BandsState>((set) => ({
  bands: initialBands,
  warnings: [],
  addBand: (kind, geometry) =>
    set((state) => ({
      bands: [
        ...state.bands,
        createBand(`band-${kind}-${crypto.randomUUID().slice(0, 8)}`, kind, geometry)
      ]
    })),
  updateBand: (id, updater) =>
    set((state) => ({
      bands: state.bands.map((band) => (band.id === id ? updater(band) : band))
    })),
  removeBand: (id) => set((state) => ({ bands: state.bands.filter((band) => band.id !== id) })),
  reorderBands: (fromIndex, toIndex) =>
    set((state) => {
      if (fromIndex === toIndex) {
        return state;
      }
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= state.bands.length || toIndex >= state.bands.length) {
        return state;
      }

      const next = [...state.bands];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) {
        return state;
      }
      next.splice(toIndex, 0, moved);

      return {
        bands: next.map((band, index) => ({
          ...band,
          zIndex: (index + 1) * 10
        }))
      };
    }),
  syncWithGeometryEngine: (params) =>
    set((state) => {
      const chained = chainConcentricBands(state.bands, params);
      const manufacturing = validateManufacturing(chained.bands, params);
      const warnings = [
        ...chained.warnings.map((warning) => warning.message),
        ...manufacturing.warnings.map((warning) => warning.message)
      ];

      const warningsByBand = new Map<string, string[]>();
      manufacturing.warnings.forEach((warning) => {
        if (!warning.bandId) {
          return;
        }
        const existing = warningsByBand.get(warning.bandId) ?? [];
        existing.push(warning.message);
        warningsByBand.set(warning.bandId, existing);
      });

      return {
        bands: chained.bands.map((band) => {
          const bandWarnings = warningsByBand.get(band.id) ?? [];
          return {
            ...band,
            validationState: {
              valid: bandWarnings.length === 0,
              warnings: bandWarnings
            },
            manufacturingWarnings: bandWarnings
          };
        }),
        warnings
      };
    })
}));
