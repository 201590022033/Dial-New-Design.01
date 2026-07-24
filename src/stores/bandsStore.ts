import { create } from 'zustand';
import { createBand } from '@/domain/bands/bandRegistry';
import type { BandEntity, BandId, BandKind } from '@/domain/bands/types';
import type { DonutGeometry } from '@/types/geometry';

interface BandsState {
  bands: BandEntity[];
  addBand: (kind: BandKind, geometry: DonutGeometry) => void;
  updateBand: (id: BandId, updater: (band: BandEntity) => BandEntity) => void;
  removeBand: (id: BandId) => void;
}

const initialBands: BandEntity[] = [
  createBand('band-dial-face', 'dial-face', { innerRadius: 0, outerRadius: 14 }),
  createBand('band-chapter-ring', 'chapter-ring', { innerRadius: 14, outerRadius: 17 }),
  createBand('band-inner-bezel', 'inner-bezel', { innerRadius: 17, outerRadius: 18.5 }),
  createBand('band-outer-bezel', 'outer-bezel', { innerRadius: 18.5, outerRadius: 20 })
];

export const useBandsStore = create<BandsState>((set) => ({
  bands: initialBands,
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
  removeBand: (id) => set((state) => ({ bands: state.bands.filter((band) => band.id !== id) }))
}));
