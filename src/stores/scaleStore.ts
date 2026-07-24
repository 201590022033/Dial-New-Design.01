import { create } from 'zustand';
import type { BandEntity } from '@/domain/bands/types';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import type { ScaleKind, ScaleMathContext, ScalePluginConfig, ScaleValidationResult } from '@/domain/scales/types';
import { runScalePlugin } from '@/services/scaleEngineService';

interface ScaleState {
  selectedScaleKind: ScaleKind;
  pluginConfig: ScalePluginConfig;
  context: ScaleMathContext;
  previewEnabled: boolean;
  validation: ScaleValidationResult | null;
  preview: ReturnType<typeof runScalePlugin>;
  setSelectedScaleKind: (kind: ScaleKind) => void;
  updatePluginConfig: (params: Partial<ScalePluginConfig>) => void;
  setPreviewEnabled: (enabled: boolean) => void;
  setContext: (context: Partial<ScaleMathContext>) => void;
  syncFromBand: (band: BandEntity | null, minimumLineWidthMm: number) => void;
  regeneratePreview: () => void;
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

const defaultContext: ScaleMathContext = {
  startAngleDeg: -140,
  endAngleDeg: 140
};

export const useScaleStore = create<ScaleState>((set, get) => ({
  selectedScaleKind: 'circular',
  pluginConfig: fallbackConfig,
  context: defaultContext,
  previewEnabled: true,
  validation: null,
  preview: null,
  setSelectedScaleKind: (kind) => {
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
    if (!state.previewEnabled) {
      set({ preview: null, validation: null });
      return;
    }

    const result = runScalePlugin(state.selectedScaleKind, state.pluginConfig, state.context);
    set({
      preview: result,
      validation: result?.validation ?? null
    });
  }
}));
