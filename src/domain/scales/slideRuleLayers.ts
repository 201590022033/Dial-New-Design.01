import type { ScaleKind, ScaleMathContext, ScalePluginConfig, ScaleLabel, ScaleTick, ScalePointer } from './types';

export type SlideRuleDesign = 'simplified' | 'citizen' | 'navitimer';

export interface SlideRuleDesignSettings {
  referenceId: string | null;
  colourMode: 'original' | 'custom';
  colourOverrides: Record<string, string>;
  visibility: { outer: boolean; inner: boolean; time: boolean; distance: boolean };
  outerRotationDeg: number;
  /** Lossless compatibility payload; do not regenerate the user's existing Simplified design. */
  legacy: { selectedScaleKind: ScaleKind; pluginConfig: ScalePluginConfig; context: ScaleMathContext };
  /** Migration baseline for Simplified only, never advertised as original brand artwork. */
  baseline?: { selectedScaleKind: ScaleKind; pluginConfig: ScalePluginConfig; context: ScaleMathContext };
  /** Reproducibility record, never evidence of source fidelity or outlined fonts. */
  artwork?: {
    version: 1;
    metricsEvidence: 'browser-measured-or-estimated';
    fontFamily: string;
    fontSizeMm: number;
    ticks: ScaleTick[];
    labels: ScaleLabel[];
    pointers: ScalePointer[];
    outerEnvelope: { innerRadiusMm: number; outerRadiusMm: number };
    innerEnvelope?: { innerRadiusMm: number; outerRadiusMm: number };
  };
}

export interface SlideRuleLayer {
  id: string;
  targetBandId: string;
  fixedTargetBandId: string | null;
  activeDesign: SlideRuleDesign | null;
  /** Reopening a disabled band restores its last inspector, without enabling its print. */
  lastSelectedDesign?: SlideRuleDesign;
  settings: Partial<Record<SlideRuleDesign, SlideRuleDesignSettings>>;
}

export interface SlideRuleLayersDocument {
  version: 1;
  layers: SlideRuleLayer[];
}

/** Software acceptance for disclosed reconstruction; never a factory-exact fidelity gate. */
export const slideRuleReferenceGate: Readonly<Record<Exclude<SlideRuleDesign, 'simplified'>, boolean>> =
  Object.freeze({ citizen: true, navitimer: true });

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const assertSlideRuleLayers = (document: SlideRuleLayersDocument): void => {
  if (!document || document.version !== 1 || !Array.isArray(document.layers)) throw new Error('Invalid scale-layer document version');
  const ids = new Set<string>();
  const targets = new Set<string>();
  for (const layer of document.layers) {
    if (!layer || typeof layer.id !== 'string' || !layer.id || typeof layer.targetBandId !== 'string' || !layer.targetBandId ||
      ids.has(layer.id) || targets.has(layer.targetBandId)) throw new Error('Duplicate or invalid scale-layer target/identity');
    ids.add(layer.id);
    targets.add(layer.targetBandId);
    if (layer.activeDesign !== null && !['simplified', 'citizen', 'navitimer'].includes(layer.activeDesign)) throw new Error('Invalid scale design');
    if (layer.lastSelectedDesign !== undefined && !['simplified', 'citizen', 'navitimer'].includes(layer.lastSelectedDesign)) throw new Error('Invalid last selected scale design');
    if (!layer.settings || (layer.activeDesign && !layer.settings[layer.activeDesign])) throw new Error('Missing scale design settings');
    if (layer.activeDesign && layer.activeDesign !== 'simplified' && !slideRuleReferenceGate[layer.activeDesign]) {
      throw new Error('Unaccepted faithful reference in scale-layer document');
    }
    if (layer.activeDesign && layer.activeDesign !== 'simplified') {
      const settings = layer.settings[layer.activeDesign]!;
      const identity = layer.activeDesign === 'citizen' ? 'citizen-jy8078-01l-2026-10-07' : 'navitimer-booklet-training-disc-2026-10-07';
      if (settings.referenceId !== identity || settings.legacy?.pluginConfig?.referenceDesign !== layer.activeDesign || settings.legacy.selectedScaleKind !== 'slide-rule') {
        throw new Error('Mismatched reference identity in scale-layer document');
      }
    }
    for (const settings of Object.values(layer.settings)) {
      if (!settings || !Number.isFinite(settings.outerRotationDeg) || !settings.legacy?.pluginConfig || !settings.legacy.context ||
        !['original', 'custom'].includes(settings.colourMode) || !settings.visibility || !settings.colourOverrides) {
        throw new Error('Invalid scale design settings');
      }
    }
  }
};

export const migrateSimplifiedLayer = (
  legacy: SlideRuleDesignSettings['legacy'], fixedTargetBandId: string | null = null
): SlideRuleLayersDocument => {
  const targetBandId = legacy.pluginConfig.placementTargetBandId ?? 'band-outer-bezel';
  return { version: 1, layers: [{
    id: `slide-rule:${targetBandId}`, targetBandId, fixedTargetBandId,
    activeDesign: legacy.pluginConfig.previewEnabled === false ? null : 'simplified',
    lastSelectedDesign: 'simplified',
    settings: { simplified: {
      referenceId: null, colourMode: 'custom', colourOverrides: {},
      visibility: { outer: true, inner: true, time: false, distance: false },
      outerRotationDeg: legacy.pluginConfig.outerRotationOffsetDeg ?? 0,
      legacy: clone(legacy),
      baseline: clone(legacy)
    } }
  }] };
};

export const selectSlideRuleDesign = (
  document: SlideRuleLayersDocument, layerId: string, design: SlideRuleDesign | null
): SlideRuleLayersDocument => {
  assertSlideRuleLayers(document);
  if (design && design !== 'simplified' && !slideRuleReferenceGate[design]) {
    throw new Error(`${design} reference inventory is not accepted; faithful preset remains gated.`);
  }
  const next = clone(document);
  const layer = next.layers.find((entry) => entry.id === layerId);
  if (!layer) throw new Error(`Unknown scale layer: ${layerId}`);
  if (design && !layer.settings[design]) throw new Error(`Missing ${design} settings`);
  layer.activeDesign = design;
  if (design) layer.lastSelectedDesign = design;
  return next;
};

/** Settings stay isolated per physical target and design, including while disabled. */
export const updateSlideRuleDesign = (
  document: SlideRuleLayersDocument, layerId: string, design: SlideRuleDesign,
  settings: SlideRuleDesignSettings
): SlideRuleLayersDocument => {
  assertSlideRuleLayers(document);
  const next = clone(document);
  const layer = next.layers.find((entry) => entry.id === layerId);
  if (!layer) throw new Error(`Unknown scale layer: ${layerId}`);
  const baseline = layer.settings[design]?.baseline;
  layer.settings[design] = { ...clone(settings), ...(baseline ? { baseline: clone(baseline) } : {}) };
  assertSlideRuleLayers(next);
  return next;
};
