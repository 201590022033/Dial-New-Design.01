import { create } from 'zustand';
import type { BandId } from '@/domain/bands/types';
import type { CanvasHitResult } from '@/renderer/types';

export interface SelectionState {
  // Legacy identifiers
  selectedBandId: BandId | null;
  selectedComponentId: string | null;
  hoverBandId: BandId | null;

  // Phase 4 semantic selection & hover state
  selectedHit: CanvasHitResult | null;
  hoveredHit: CanvasHitResult | null;
  crystalSelectionMode: boolean;

  // Action methods
  selectBand: (id: BandId | null) => void;
  selectComponent: (componentId: string | null, linkedBandId?: BandId | null) => void;
  hoverBand: (id: BandId | null) => void;

  selectHit: (hit: CanvasHitResult | null) => void;
  hoverHit: (hit: CanvasHitResult | null) => void;
  setCrystalSelectionMode: (enabled: boolean) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedBandId: null,
  selectedComponentId: null,
  hoverBandId: null,

  selectedHit: null,
  hoveredHit: null,
  crystalSelectionMode: false,

  selectBand: (selectedBandId) =>
    set({
      selectedBandId,
      selectedComponentId: null,
      selectedHit: selectedBandId
        ? {
            partInstanceId: selectedBandId,
            category: 'rings',
            interactionRole: 'physical-part',
            zLayer: 100,
            bandId: selectedBandId,
            label: selectedBandId
          }
        : null
    }),

  selectComponent: (selectedComponentId, linkedBandId) =>
    set((state) => ({
      selectedComponentId,
      selectedBandId: linkedBandId === undefined ? state.selectedBandId : linkedBandId,
      selectedHit: selectedComponentId
        ? {
            partInstanceId: selectedComponentId,
            category: 'components',
            interactionRole: 'physical-part',
            zLayer: 200,
            bandId: linkedBandId ?? state.selectedBandId,
            label: selectedComponentId
          }
        : null
    })),

  hoverBand: (hoverBandId) =>
    set((state) => ({
      hoverBandId,
      hoveredHit: hoverBandId
        ? {
            partInstanceId: hoverBandId,
            category: 'rings',
            interactionRole: 'physical-part',
            zLayer: 100,
            bandId: hoverBandId,
            label: hoverBandId
          }
        : state.hoveredHit
    })),

  selectHit: (hit) =>
    set({
      selectedHit: hit,
      selectedBandId: hit?.bandId ?? null,
      selectedComponentId: hit?.partInstanceId ?? null
    }),

  hoverHit: (hit) =>
    set({
      hoveredHit: hit,
      hoverBandId: hit?.bandId ?? null
    }),

  setCrystalSelectionMode: (crystalSelectionMode) =>
    set({ crystalSelectionMode }),

  clearSelection: () =>
    set({
      selectedHit: null,
      selectedBandId: null,
      selectedComponentId: null,
      hoveredHit: null,
      hoverBandId: null
    })
}));

