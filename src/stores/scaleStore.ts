import { create } from 'zustand';
import type { BandEntity } from '@/domain/bands/types';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import type {
  ScaleEngineeringReadout,
  ScaleKind,
  ScaleMathContext,
  ScalePluginConfig,
  ScaleValidationResult
} from '@/domain/scales/types';
import { runScalePlugin } from '@/services/scaleEngineService';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { getScaleProgram, type ScaleProgram } from '@/domain/scales/scalePrograms';
import { scalePolicyForArchetype } from '@/domain/scales/archetypeScalePolicy';
import { useBandsStore } from './bandsStore';

interface ScaleState {
  selectedScaleKind: ScaleKind;
  pluginConfig: ScalePluginConfig;
  context: ScaleMathContext;
  previewEnabled: boolean;
  validation: ScaleValidationResult | null;
  preview: ReturnType<typeof runScalePlugin>;
  engineeringReadout: ScaleEngineeringReadout | null;
  activeArchetypeId?: string;
  crossArchetypeUnlocked: boolean;
  applyScaleProgram: (program: ScaleProgram, bands: BandEntity[]) => boolean;
  syncArchetypeScale: (archetypeId: string | undefined, bands: BandEntity[]) => void;
  setCrossArchetypeUnlocked: (unlocked: boolean, bands: BandEntity[]) => void;
  setSelectedScaleKind: (kind: ScaleKind) => void;
  updatePluginConfig: (params: Partial<ScalePluginConfig>) => void;
  setPreviewEnabled: (enabled: boolean) => void;
  setContext: (context: Partial<ScaleMathContext>) => void;
  setEngineeringReadout: (readout: ScaleEngineeringReadout | null) => void;
  syncFromBand: (band: BandEntity | null, minimumLineWidthMm: number) => void;
  regeneratePreview: () => void;
  hydrateScaleState: (snapshot: {
    selectedScaleKind: ScaleKind;
    pluginConfig: ScalePluginConfig;
    context: ScaleMathContext;
  }) => void;
  resetScaleState: () => void;
}

const fallbackPlugin = getScalePlugin('circular');

const fallbackConfig: ScalePluginConfig = fallbackPlugin?.defaultConfig ?? {
  startValue: 0,
  endValue: 60,
  majorStep: 5,
  minorStep: 1,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 1.8,
  minorTickLengthMm: 1,
  majorTickWidthMm: 0.2,
  minorTickWidthMm: 0.12,
  tickDirection: 'outside',
  tickStyle: 'line',
  labelFrequency: 1,
  labelOrientation: 'radial',
  labelPlacement: 'outside',
  labelRotationOffsetDeg: 0,
  rotationOffsetDeg: 0,
  color: '#F8FAFC',
  fontFamily: '"IBM Plex Mono", monospace',
  previewEnabled: true,
  bandInnerRadiusMm: 14,
  bandOuterRadiusMm: 20,
  minimumLineWidthMm: 0.1
};

const defaultContext: ScaleMathContext = fullMinuteRingContext;

export const useScaleStore = create<ScaleState>((set, get) => ({
  selectedScaleKind: 'circular',
  pluginConfig: fallbackConfig,
  context: defaultContext,
  previewEnabled: true,
  validation: null,
  preview: null,
  engineeringReadout: null,
  activeArchetypeId: undefined,
  crossArchetypeUnlocked: false,
  applyScaleProgram: (program, bands) => {
    const state = get();
    if (!state.crossArchetypeUnlocked && !scalePolicyForArchetype(state.activeArchetypeId).allowed.includes(program)) return false;
    const selection = getScaleProgram(program, bands);
    const defaults = getScalePlugin(selection.kind)?.defaultConfig ?? state.pluginConfig;
    set({
      selectedScaleKind: selection.kind,
      pluginConfig: {
        ...defaults, ...selection.config,
        fontFamily: state.pluginConfig.fontFamily,
        scaleFontSizeMm: state.pluginConfig.scaleFontSizeMm ?? 0.8,
        scaleTickLengthFactor: state.pluginConfig.scaleTickLengthFactor ?? 1
      },
      context: selection.context,
      previewEnabled: true
    });
    get().regeneratePreview();
    return true;
  },
  syncArchetypeScale: (archetypeId, bands) => {
    if (get().activeArchetypeId === archetypeId) return;
    set({ activeArchetypeId: archetypeId, crossArchetypeUnlocked: false });
    const recommended = scalePolicyForArchetype(archetypeId).recommended;
    if (recommended) get().applyScaleProgram(recommended, bands);
    else if (archetypeId) get().setPreviewEnabled(false);
  },
  setCrossArchetypeUnlocked: (unlocked, bands) => {
    set({ crossArchetypeUnlocked: unlocked });
    if (!unlocked) {
      const recommended = scalePolicyForArchetype(get().activeArchetypeId).recommended;
      if (recommended) get().applyScaleProgram(recommended, bands);
      else if (get().activeArchetypeId) get().setPreviewEnabled(false);
    }
  },
  setSelectedScaleKind: (kind) => {
    const state = get();
    if (!state.crossArchetypeUnlocked && state.activeArchetypeId) {
      const allowedKinds = scalePolicyForArchetype(state.activeArchetypeId).allowed.map((program) => getScaleProgram(program, []).kind);
      if (!allowedKinds.includes(kind)) return;
    }
    const plugin = getScalePlugin(kind);
    const nextConfig = plugin?.defaultConfig ?? get().pluginConfig;

    set({
      selectedScaleKind: kind,
      pluginConfig: nextConfig
    });

    get().regeneratePreview();
  },
  updatePluginConfig: (params) => {
    set((state) => ({
      pluginConfig: {
        ...state.pluginConfig,
        ...params
      }
    }));

    get().regeneratePreview();
  },
  setPreviewEnabled: (enabled) => {
    set({ previewEnabled: enabled });
    get().regeneratePreview();
  },
  setContext: (contextPatch) => {
    set((state) => ({
      context: {
        ...state.context,
        ...contextPatch
      }
    }));

    get().regeneratePreview();
  },
  setEngineeringReadout: (readout) => {
    set({ engineeringReadout: readout });
  },
  syncFromBand: (band, minimumLineWidthMm) => {
    if (!band) {
      return;
    }

    const innerRadius = band.geometry.innerRadius;
    const outerRadius = band.geometry.outerRadius;

    set((state) => ({
      pluginConfig: {
        ...state.pluginConfig,
        radiusMm: (innerRadius + outerRadius) / 2,
        bandInnerRadiusMm: innerRadius,
        bandOuterRadiusMm: outerRadius,
        minimumLineWidthMm
      }
    }));

    get().regeneratePreview();
  },
  regeneratePreview: () => {
    const state = get();
    const permitted = state.crossArchetypeUnlocked || !state.activeArchetypeId || scalePolicyForArchetype(state.activeArchetypeId).allowed.some((program) => getScaleProgram(program, []).kind === state.selectedScaleKind);
    if (!state.previewEnabled || !permitted) {
      set({ preview: null, validation: null, engineeringReadout: null });
      return;
    }

    const result = runScalePlugin(state.selectedScaleKind, state.pluginConfig, state.context);
    set({
      preview: result,
      validation: result?.validation ?? null
    });
  },
  hydrateScaleState: (snapshot) => {
    set({
      selectedScaleKind: snapshot.selectedScaleKind,
      pluginConfig: snapshot.pluginConfig,
      context: snapshot.context
    });
    get().regeneratePreview();
  },
  resetScaleState: () => {
    set({
      selectedScaleKind: 'circular',
      pluginConfig: fallbackConfig,
      context: defaultContext,
      previewEnabled: true,
      validation: null,
      preview: null,
      engineeringReadout: null,
      crossArchetypeUnlocked: false
    });
    get().setCrossArchetypeUnlocked(false, useBandsStore.getState().bands);
    get().regeneratePreview();
  }
}));
