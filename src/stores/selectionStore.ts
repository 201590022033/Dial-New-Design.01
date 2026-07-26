import { create } from 'zustand';
import type { BandId } from '@/domain/bands/types';

interface SelectionState {
  selectedBandId: BandId | null;
  selectedComponentId: string | null;
  hoverBandId: BandId | null;
  selectBand: (id: BandId | null) => void;
  selectComponent: (componentId: string | null, linkedBandId?: BandId | null) => void;
  hoverBand: (id: BandId | null) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedBandId: null,
  selectedComponentId: null,
  hoverBandId: null,
  selectBand: (selectedBandId) => set({ selectedBandId, selectedComponentId: null }),
  selectComponent: (selectedComponentId, linkedBandId) =>
    set((state) => ({
      selectedComponentId,
      selectedBandId: linkedBandId === undefined ? state.selectedBandId : linkedBandId
    })),
  hoverBand: (hoverBandId) => set({ hoverBandId })
}));
