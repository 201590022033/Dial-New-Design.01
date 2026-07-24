import { create } from 'zustand';
import type { BandId } from '@/domain/bands/types';

interface SelectionState {
  selectedBandId: BandId | null;
  hoverBandId: BandId | null;
  selectBand: (id: BandId | null) => void;
  hoverBand: (id: BandId | null) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedBandId: null,
  hoverBandId: null,
  selectBand: (selectedBandId) => set({ selectedBandId }),
  hoverBand: (hoverBandId) => set({ hoverBandId })
}));
