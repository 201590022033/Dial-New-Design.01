import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ScaleKind, ScalePluginConfig, ScaleMathContext } from './types';
import { migrateSimplifiedLayer } from './slideRuleLayers';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { resolvePhysicalScaleConfig } from '@/services/scaleLayerArtworkService';
import { runScalePlugin } from '@/services/scaleEngineService';

export interface ScaleSnapshot {
  selectedScaleKind: ScaleKind;
  pluginConfig: ScalePluginConfig;
  context: ScaleMathContext;
  previewEnabled?: boolean;
  crossArchetypeUnlocked?: boolean;
}

export const withScaleSnapshot = (assembly: WatchAssembly, snapshot: ScaleSnapshot): WatchAssembly => {
  const copy = JSON.parse(JSON.stringify(snapshot)) as ScaleSnapshot;
  copy.previewEnabled = snapshot.previewEnabled ?? snapshot.pluginConfig.previewEnabled;
  copy.pluginConfig.previewEnabled = copy.previewEnabled;
  const target = copy.pluginConfig.placementTargetBandId ?? 'band-outer-bezel';
  const existing = assembly.designConfig?.slideRuleLayers;
  const layers = existing ? JSON.parse(JSON.stringify(existing)) as typeof existing : { version: 1 as const, layers: [] };
  const layer = layers.layers.find((entry) => entry.targetBandId === target);
  if (copy.selectedScaleKind === 'slide-rule') {
    const migrated = migrateSimplifiedLayer(copy, copy.pluginConfig.fixedPlacementTargetBandId ?? 'band-chapter-ring').layers[0]!;
    const design = copy.pluginConfig.referenceDesign ?? 'simplified';
    const settings = {
      ...migrated.settings.simplified!,
      referenceId: design === 'citizen' ? 'citizen-jy8078-01l-2026-10-07' : design === 'navitimer' ? 'navitimer-booklet-training-disc-2026-10-07' : null,
      colourMode: design === 'simplified' ? 'custom' as const : copy.pluginConfig.referenceColourMode ?? 'original' as const,
      colourOverrides: design === 'simplified' ? copy.pluginConfig.markColorOverrides ?? {} : copy.pluginConfig.referenceColourOverrides ?? {},
      visibility: { outer: copy.pluginConfig.outerScaleVisible !== false, inner: copy.pluginConfig.innerScaleVisible !== false, time: false, distance: copy.pluginConfig.referenceDistanceVisible !== false }
    };
    if (layer) {
      layer.fixedTargetBandId = migrated.fixedTargetBandId;
      layer.activeDesign = copy.previewEnabled ? design : null;
      layer.settings[design] = {
        ...settings,
        baseline: layer.settings[design]?.baseline ?? layer.settings[design]?.legacy ?? migrated.settings.simplified!.baseline
      };
    } else layers.layers.push({ ...migrated, activeDesign: copy.previewEnabled ? design : null, settings: { [design]: settings } });
  } else if (layer) layer.activeDesign = null;
  const savedSettings = layers.layers.find((entry) => entry.targetBandId === target)?.settings[copy.pluginConfig.referenceDesign ?? 'simplified'];
  if (copy.selectedScaleKind === 'slide-rule' && savedSettings) {
    const resolved = runScalePlugin(copy.selectedScaleKind, resolvePhysicalScaleConfig(assembly, assemblyToBands(assembly), copy.pluginConfig, copy.selectedScaleKind), copy.context);
    if (resolved) savedSettings.artwork = {
      version: 1, metricsEvidence: 'browser-measured-or-estimated', fontFamily: resolved.fontFamily, fontSizeMm: resolved.fontSizeMm,
      ticks: resolved.ticks, labels: resolved.labels, pointers: resolved.pointers ?? [],
      outerEnvelope: resolved.placementEnvelope, innerEnvelope: resolved.fixedPlacementEnvelope
    };
  }
  return { ...assembly,
    scaleBinding: { scaleKind: copy.selectedScaleKind, assignedPartId: target, config: copy.pluginConfig as unknown as Record<string, unknown>,
      context: copy.context, previewEnabled: copy.previewEnabled, crossArchetypeUnlocked: copy.crossArchetypeUnlocked,
      archetypeId: assembly.designConfig?.visualReferenceConfig?.archetypeId },
    designConfig: { ...assembly.designConfig, ...(layers.layers.length ? { slideRuleLayers: layers } : {}) }
  };
};

export const scaleSnapshotFromAssembly = (assembly: WatchAssembly): ScaleSnapshot | null => {
  const binding = assembly.scaleBinding;
  if (!binding?.context || binding.archetypeId !== assembly.designConfig?.visualReferenceConfig?.archetypeId) return null;
  return { selectedScaleKind: binding.scaleKind as ScaleKind, pluginConfig: binding.config as unknown as ScalePluginConfig,
    context: binding.context, previewEnabled: binding.previewEnabled ?? (binding.config.previewEnabled as boolean),
    crossArchetypeUnlocked: binding.crossArchetypeUnlocked };
};
