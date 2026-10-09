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
import { useWatchAssemblyStore } from './watchAssemblyStore';
import { resolveScaleLayers, resolvePhysicalScaleConfig } from '@/services/scaleLayerArtworkService';
import { referenceScaleDefaults } from '@/services/referenceScaleArtworkService';
import { slideRuleReferenceGate, type SlideRuleDesign } from '@/domain/scales/slideRuleLayers';
import { isScaleTargetLocked } from '@/domain/scales/scaleTargetLock';
import { useConfiguratorUIStore } from './configuratorUIStore';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';

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
  regeneratePreview: (bands?: BandEntity[]) => void;
  hydrateScaleState: (snapshot: {
    selectedScaleKind: ScaleKind;
    pluginConfig: ScalePluginConfig;
    context: ScaleMathContext;
    previewEnabled?: boolean;
    crossArchetypeUnlocked?: boolean;
  }) => void;
  resetScaleState: () => void;
  resetSimplifiedBaseline: () => void;
  selectReferenceDesign: (design: SlideRuleDesign | null) => boolean;
  resetReferenceDesign: () => void;
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
const scaleTargetLocked = (config: ScalePluginConfig): boolean => {
  return isScaleTargetLocked(useWatchAssemblyStore.getState().assembly, config, useBandsStore.getState().bands, useConfiguratorUIStore.getState().lockedPartIds);
};

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
    const targetBand = bands.find((band) => band.kind === 'outer-bezel');
    if (scaleTargetLocked({ ...state.pluginConfig, placementTargetBandId: targetBand?.id ?? state.pluginConfig.placementTargetBandId })) return false;
    set({
      selectedScaleKind: selection.kind,
      pluginConfig: {
        ...defaults, ...selection.config,
        fontFamily: state.pluginConfig.fontFamily,
        color: state.pluginConfig.color,
        scaleFontSizeMm: state.pluginConfig.scaleFontSizeMm ?? 0.8,
        scaleTickLengthFactor: state.pluginConfig.scaleTickLengthFactor ?? 1,
        placementTargetBandId: targetBand?.id ?? state.pluginConfig.placementTargetBandId,
        bandInnerRadiusMm: targetBand?.geometry.innerRadius ?? state.pluginConfig.bandInnerRadiusMm,
        bandOuterRadiusMm: targetBand?.geometry.outerRadius ?? state.pluginConfig.bandOuterRadiusMm,
        minimumLineWidthMm: state.pluginConfig.minimumLineWidthMm
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
    if (scaleTargetLocked(state.pluginConfig)) return;
    if (!state.crossArchetypeUnlocked && state.activeArchetypeId) {
      const allowedKinds = scalePolicyForArchetype(state.activeArchetypeId).allowed.map((program) => getScaleProgram(program, []).kind);
      if (!allowedKinds.includes(kind)) return;
    }
    const plugin = getScalePlugin(kind);
    const nextConfig = plugin?.defaultConfig ?? get().pluginConfig;

    set({
      selectedScaleKind: kind,
      pluginConfig: { ...nextConfig, color: state.pluginConfig.color }
    });

    get().regeneratePreview();
  },
  updatePluginConfig: (params) => {
    if (scaleTargetLocked(get().pluginConfig)) return;
    set((state) => ({
      pluginConfig: {
        ...state.pluginConfig,
        ...params
      }
    }));

    get().regeneratePreview();
  },
  setPreviewEnabled: (enabled) => {
    if (scaleTargetLocked(get().pluginConfig)) return;
    set({ previewEnabled: enabled });
    get().regeneratePreview();
  },
  setContext: (contextPatch) => {
    if (scaleTargetLocked(get().pluginConfig)) return;
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
  syncFromBand: (inputBand, minimumLineWidthMm) => {
    const band = inputBand ? assemblyToBands(useWatchAssemblyStore.getState().assembly).find((entry) => entry.id === inputBand.id) ?? inputBand : null;
    if (!band) {
      return;
    }
    if (band.id !== get().pluginConfig.placementTargetBandId) {
      const layer = useWatchAssemblyStore.getState().assembly.designConfig?.slideRuleLayers?.layers.find((entry) => entry.targetBandId === band.id);
      const selected = layer?.activeDesign ?? layer?.lastSelectedDesign ??
        (layer?.settings.simplified ? 'simplified' : Object.keys(layer?.settings ?? {})[0] as SlideRuleDesign | undefined) ?? 'simplified';
      const settings = layer?.settings[selected];
      if (settings) {
        get().hydrateScaleState({ ...structuredClone(settings.legacy), previewEnabled: layer?.activeDesign !== null, crossArchetypeUnlocked: get().crossArchetypeUnlocked });
        return;
      }
    }

    const innerRadius = band.geometry.innerRadius;
    const outerRadius = band.geometry.outerRadius;
    const current = get().pluginConfig;
    if (current.placementTargetBandId === band.id && current.bandInnerRadiusMm === innerRadius &&
      current.bandOuterRadiusMm === outerRadius && current.minimumLineWidthMm === minimumLineWidthMm) return;

    set((state) => ({
      pluginConfig: {
        ...state.pluginConfig,
        radiusMm: (innerRadius + outerRadius) / 2,
        outerRadiusMm: Math.max(innerRadius, outerRadius - 0.2),
        // Aviation has a separate fixed chapter-ring scale. Updating its
        // rotating bezel must never pull that inner ring out onto the bezel.
        innerRadiusMm: state.selectedScaleKind === 'slide-rule'
          ? state.pluginConfig.innerRadiusMm
          : Math.max(innerRadius, (innerRadius + outerRadius) / 2 - 0.45),
        bandInnerRadiusMm: innerRadius,
        bandOuterRadiusMm: outerRadius,
        minimumLineWidthMm,
        placementTargetBandId: band.id
      }
    }));

    get().regeneratePreview();
  },
  regeneratePreview: (sourceBands) => {
    const state = get();
    const permitted = state.crossArchetypeUnlocked || !state.activeArchetypeId || scalePolicyForArchetype(state.activeArchetypeId).allowed.some((program) => getScaleProgram(program, []).kind === state.selectedScaleKind);

    const physicalBands = assemblyToBands(useWatchAssemblyStore.getState().assembly);
    const bands = sourceBands ?? [...physicalBands, ...useBandsStore.getState().bands.filter((band) => !physicalBands.some((entry) => entry.id === band.id))];
    const result = resolveScaleLayers(useWatchAssemblyStore.getState().assembly, bands, state.selectedScaleKind, { ...state.pluginConfig, previewEnabled: state.previewEnabled && permitted }, state.context);
    set({
      preview: result,
      validation: result?.validation ?? null
    });
  },
  hydrateScaleState: (snapshot) => {
    set({
      selectedScaleKind: snapshot.selectedScaleKind,
      pluginConfig: snapshot.pluginConfig,
      context: snapshot.context,
      previewEnabled: snapshot.previewEnabled ?? snapshot.pluginConfig.previewEnabled,
      crossArchetypeUnlocked: snapshot.crossArchetypeUnlocked ?? get().crossArchetypeUnlocked
    });
    get().regeneratePreview();
  },
  resetSimplifiedBaseline: () => {
    if (scaleTargetLocked(get().pluginConfig)) return;
    const target = get().pluginConfig.placementTargetBandId ?? 'band-outer-bezel';
    const baseline = useWatchAssemblyStore.getState().assembly.designConfig?.slideRuleLayers?.layers
      .find((layer) => layer.targetBandId === target)?.settings.simplified?.baseline;
    if (baseline) get().hydrateScaleState(structuredClone(baseline));
  },
  selectReferenceDesign: (design) => {
    const state = get();
    if (scaleTargetLocked(state.pluginConfig)) return false;
    if (design && design !== 'simplified' && !slideRuleReferenceGate[design]) return false;
    if (!state.crossArchetypeUnlocked && state.activeArchetypeId && !scalePolicyForArchetype(state.activeArchetypeId).allowed.includes('aviation')) return false;
    if (!design) { get().setPreviewEnabled(false); return true; }
    const target = state.pluginConfig.placementTargetBandId ?? 'band-outer-bezel';
    const assembly = useWatchAssemblyStore.getState().assembly;
    const saved = assembly.designConfig?.slideRuleLayers?.layers.find((layer) => layer.targetBandId === target)?.settings[design];
    if (saved) {
      get().hydrateScaleState({ ...structuredClone(saved.legacy), previewEnabled: true, crossArchetypeUnlocked: state.crossArchetypeUnlocked });
      return true;
    }
    const bands = assemblyToBands(assembly);
    const selection = getScaleProgram('aviation', bands);
    const config = resolvePhysicalScaleConfig(assembly, bands, {
      ...(getScalePlugin(selection.kind)?.defaultConfig ?? state.pluginConfig), ...selection.config,
      placementTargetBandId: target, fixedPlacementTargetBandId: state.pluginConfig.fixedPlacementTargetBandId ?? 'band-chapter-ring',
      minimumLineWidthMm: state.pluginConfig.minimumLineWidthMm, referenceDesign: design
    }, 'slide-rule');
    get().hydrateScaleState({ selectedScaleKind: 'slide-rule', context: selection.context, previewEnabled: true,
      crossArchetypeUnlocked: state.crossArchetypeUnlocked,
      pluginConfig: design === 'simplified' ? config : { ...config, ...referenceScaleDefaults(design, config) } });
    return true;
  },
  resetReferenceDesign: () => {
    const state = get();
    if (scaleTargetLocked(state.pluginConfig)) return;
    const design = state.pluginConfig.referenceDesign ?? 'simplified';
    if (design === 'simplified') { get().resetSimplifiedBaseline(); return; }
    const assembly = useWatchAssemblyStore.getState().assembly;
    const config = resolvePhysicalScaleConfig(assembly, assemblyToBands(assembly), state.pluginConfig, 'slide-rule');
    get().updatePluginConfig(referenceScaleDefaults(design, config));
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
