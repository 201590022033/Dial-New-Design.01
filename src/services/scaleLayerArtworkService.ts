import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { BandEntity } from '@/domain/bands/types';
import type { ScalePluginConfig, ScaleMathContext, ScaleKind } from '@/domain/scales/types';
import { resolvedScaleSvg } from '@/domain/scales/resolvedScaleArtwork';
import { runScalePlugin, type ScaleRunResult } from './scaleEngineService';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

/** Resolve physical dimensions once, identically for the editor and saved layers. */
export const resolvePhysicalScaleConfig = (assembly: WatchAssembly, bands: BandEntity[], config: ScalePluginConfig, kind: ScaleKind): ScalePluginConfig => {
  const next = { ...config };
  const target = bands.find((band) => band.id === config.placementTargetBandId);
  const fixed = bands.find((band) => band.id === (config.fixedPlacementTargetBandId ?? 'band-chapter-ring'));
  if (!target) return next;
  const model = watchAssemblyToVisualModel(assembly);
  next.physicalTargetsResolved = true;
  next.bandInnerRadiusMm = target.geometry.innerRadius;
  next.bandOuterRadiusMm = target.geometry.outerRadius;
  if (target.kind === 'outer-bezel') {
    next.bandInnerRadiusMm = Math.max(next.bandInnerRadiusMm, model.bezelEnvelope.innerRadiusMm, model.assets.bezel.scaleArtworkInnerRadiusMm ?? 0);
    const surfaceOuter = model.assets.bezel.scaleArtworkOuterRadiusMm ?? (model.assets.bezel.assetType === 'procedural' ? model.previewEnvelope.bezelOuterRadius - 0.7 : model.bezelEnvelope.outerRadiusMm);
    next.bandOuterRadiusMm = Math.min(next.bandOuterRadiusMm, model.bezelEnvelope.outerRadiusMm, surfaceOuter);
  }
  if (kind === 'slide-rule' && fixed) {
    next.fixedPlacementTargetBandId = fixed.id;
    next.fixedBandInnerRadiusMm = fixed.geometry.innerRadius;
    next.fixedBandOuterRadiusMm = fixed.geometry.outerRadius;
    if (fixed.kind === 'chapter-ring') {
      next.fixedBandInnerRadiusMm = Math.max(next.fixedBandInnerRadiusMm, model.assets['chapter-ring'].scaleArtworkInnerRadiusMm ?? 0);
      next.fixedBandOuterRadiusMm = Math.min(next.fixedBandOuterRadiusMm, model.assets['chapter-ring'].scaleArtworkOuterRadiusMm ?? Infinity);
    }
  }
  return next;
};

/** Compose saved active layers without mutating the editor or cached run results. */
export const resolveScaleLayers = (assembly: WatchAssembly, bands: BandEntity[], kind: ScaleKind, config: ScalePluginConfig, context: ScaleMathContext): ScaleRunResult | null => {
  // Disabled settings are retained for editing, but must never be generated or
  // validated as printable artwork (old hidden settings may be malformed).
  const active = config.previewEnabled === false ? null : runScalePlugin(kind, resolvePhysicalScaleConfig(assembly, bands, config, kind), context);
  const layers: ScaleRunResult[] = active ? [active] : [];
  const occupied = new Set<string>();
  const issues: string[] = [];
  if (active && config.placementTargetBandId && !bands.some((band) => band.id === config.placementTargetBandId)) {
    issues.push('The selected physical scale target is missing. Select an existing component before exporting.');
  }
  const claim = (result: ScaleRunResult): boolean => {
    const targets = (['outer', 'inner'] as const).filter((ring) => result.ticks.some((tick) => (tick.ringId ?? 'outer') === ring) || result.labels.some((label) => (label.ringId ?? 'outer') === ring) || result.pointers?.some((pointer) => pointer.ringId === ring))
      .map((ring) => ring === 'outer' ? result.placementTargetBandId : result.fixedPlacementTargetBandId);
    if (targets.some((target) => target && occupied.has(target))) {
      issues.push('Two active scale layers claim the same physical band. Disable one layer or select independent targets.');
      return false;
    }
    targets.forEach((target) => { if (target) occupied.add(target); });
    return true;
  };
  if (active) claim(active);
  if (kind === 'slide-rule') for (const layer of assembly.designConfig?.slideRuleLayers?.layers ?? []) {
    if (layer.targetBandId === config.placementTargetBandId || !layer.activeDesign) continue;
    const saved = layer.settings[layer.activeDesign]?.legacy;
    if (!saved || saved.pluginConfig.previewEnabled === false) continue;
    if (!bands.some((band) => band.id === layer.targetBandId)) {
      issues.push(`Saved scale target ${layer.targetBandId} is missing. Restore the part or disable its layer.`);
      continue;
    }
    const resolved = runScalePlugin(saved.selectedScaleKind, resolvePhysicalScaleConfig(assembly, bands, saved.pluginConfig, saved.selectedScaleKind), saved.context);
    if (resolved && claim(resolved)) layers.push(resolved);
  }
  if (!layers.length) return null;
  const structuredWarnings = [...layers.flatMap((layer) => layer.validation.structuredWarnings), ...issues.map((description) => ({ severity: 'error' as const, description, affectedObject: 'scale-envelope', suggestedFix: 'Choose independent physical targets.' }))];
  const composite = { ...layers[0]!, layers, validation: { valid: layers.every((layer) => layer.validation.valid) && !issues.length, warnings: structuredWarnings.map((warning) => warning.description), structuredWarnings } };
  composite.svg = resolvedScaleSvg(composite, Math.max(1, assembly.globalDimensions.caseDiameterMm));
  return composite;
};
