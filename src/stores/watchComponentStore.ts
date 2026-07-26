import { create } from 'zustand';
import { createWatchComponentEntities } from '@/domain/watch-components/factory';
import type { WatchComponentEntity } from '@/domain/watch-components/types';

export type EngineeringPreviewMode = 'engineering' | 'high-quality' | 'presentation';

interface WatchComponentState {
  components: WatchComponentEntity[];
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  selectionFilter: 'all' | 'hands' | 'indices' | 'typography' | 'complications' | 'rings' | 'case' | 'external';
  explodedView: boolean;
  componentIsolationId: string | null;
  crossSectionPreview: boolean;
  dimensionOverlay: boolean;
  ringSnappingEnabled: boolean;
  rotatingBezelAngleDeg: number;
  slideRuleCursorAngleDeg: number;
  engineeringMeasurementsEnabled: boolean;
  liveValidationEnabled: boolean;
  manufacturingWarningsVisible: boolean;
  lowPowerMode: boolean;
  previewMode: EngineeringPreviewMode;
  selectComponent: (id: string | null) => void;
  hoverComponent: (id: string | null) => void;
  setSelectionFilter: (filter: WatchComponentState['selectionFilter']) => void;
  setVisibility: (id: string, visible: boolean) => void;
  setLocked: (id: string, locked: boolean) => void;
  isolateComponent: (id: string | null) => void;
  toggleExplodedView: () => void;
  toggleCrossSectionPreview: () => void;
  toggleDimensionOverlay: () => void;
  setRingSnappingEnabled: (enabled: boolean) => void;
  rotateBezel: (deltaDeg: number) => void;
  setSlideRuleCursor: (angleDeg: number) => void;
  toggleEngineeringMeasurements: () => void;
  setLiveValidationEnabled: (enabled: boolean) => void;
  setManufacturingWarningsVisible: (visible: boolean) => void;
  setLowPowerMode: (enabled: boolean) => void;
  setPreviewMode: (mode: EngineeringPreviewMode) => void;
  updateMaterialAndTexture: (id: string, material: string, texture: string) => void;
}

const wrapAngle = (angleDeg: number): number => {
  let value = angleDeg % 360;
  if (value < 0) {
    value += 360;
  }
  return value;
};

export const useWatchComponentStore = create<WatchComponentState>((set) => ({
  components: createWatchComponentEntities(),
  selectedComponentId: null,
  hoveredComponentId: null,
  selectionFilter: 'all',
  explodedView: false,
  componentIsolationId: null,
  crossSectionPreview: false,
  dimensionOverlay: false,
  ringSnappingEnabled: true,
  rotatingBezelAngleDeg: 0,
  slideRuleCursorAngleDeg: 0,
  engineeringMeasurementsEnabled: true,
  liveValidationEnabled: true,
  manufacturingWarningsVisible: true,
  lowPowerMode: false,
  previewMode: 'engineering',
  selectComponent: (selectedComponentId) => set({ selectedComponentId }),
  hoverComponent: (hoveredComponentId) => set({ hoveredComponentId }),
  setSelectionFilter: (selectionFilter) => set({ selectionFilter }),
  setVisibility: (id, visible) =>
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id ? { ...component, visible } : component
      )
    })),
  setLocked: (id, locked) =>
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id ? { ...component, locked } : component
      )
    })),
  isolateComponent: (componentIsolationId) =>
    set((state) => ({
      componentIsolationId,
      components: state.components.map((component) => ({
        ...component,
        visible: componentIsolationId ? component.id === componentIsolationId : true
      }))
    })),
  toggleExplodedView: () => set((state) => ({ explodedView: !state.explodedView })),
  toggleCrossSectionPreview: () => set((state) => ({ crossSectionPreview: !state.crossSectionPreview })),
  toggleDimensionOverlay: () => set((state) => ({ dimensionOverlay: !state.dimensionOverlay })),
  setRingSnappingEnabled: (ringSnappingEnabled) => set({ ringSnappingEnabled }),
  rotateBezel: (deltaDeg) =>
    set((state) => ({
      rotatingBezelAngleDeg: state.ringSnappingEnabled
        ? Math.round(wrapAngle(state.rotatingBezelAngleDeg + deltaDeg) / 3) * 3
        : wrapAngle(state.rotatingBezelAngleDeg + deltaDeg)
    })),
  setSlideRuleCursor: (slideRuleCursorAngleDeg) => set({ slideRuleCursorAngleDeg: wrapAngle(slideRuleCursorAngleDeg) }),
  toggleEngineeringMeasurements: () =>
    set((state) => ({ engineeringMeasurementsEnabled: !state.engineeringMeasurementsEnabled })),
  setLiveValidationEnabled: (liveValidationEnabled) => set({ liveValidationEnabled }),
  setManufacturingWarningsVisible: (manufacturingWarningsVisible) => set({ manufacturingWarningsVisible }),
  setLowPowerMode: (lowPowerMode) => set({ lowPowerMode }),
  setPreviewMode: (previewMode) => set({ previewMode }),
  updateMaterialAndTexture: (id, material, texture) =>
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id ? { ...component, material, texture } : component
      )
    }))
}));
