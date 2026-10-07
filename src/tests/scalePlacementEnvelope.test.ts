import { describe, expect, it } from 'vitest';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import {
  estimateLabelRadialHalfExtentMm,
  tickOuterExtentMm
} from '@/domain/scales/placementEnvelope';
import type { ScalePluginConfig } from '@/domain/scales/types';
import { runScalePlugin } from '@/services/scaleEngineService';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { scaleArtworkClipEnvelope, scaleArtworkRadialShiftMm, scaleArtworkSurfaceZ } from '@/visual3d/scaleArtworkEnvelope';
import { visualAssetRegistry } from '@/visual3d/visualAssetRegistry';
import { useScaleStore } from '@/stores/scaleStore';
import { syncAssemblyDownstream } from '@/stores/storeSync';
import { getScaleProgram } from '@/domain/scales/scalePrograms';

const targetBands = [
  { id: 'band-outer-bezel', inner: 18.5, outer: 20 },
  { id: 'band-inner-bezel', inner: 17, outer: 18.5 },
  { id: 'band-chapter-ring', inner: 14, outer: 17 },
  { id: 'band-dial-face', inner: 0, outer: 14 }
] as const;

describe('scale placement envelope', () => {
  it.each(targetBands)('keeps ticks and labels inside $id physical OD', (target) => {
    const defaults = getScalePlugin('circular')!.defaultConfig;
    const config: ScalePluginConfig = {
      ...defaults,
      radiusMm: target.outer - 0.1,
      majorTickLengthMm: 2.4,
      minorTickLengthMm: 1.3,
      tickDirection: 'outside',
      labelPlacement: 'outside',
      labelOffsetMm: 1.8,
      scaleFontSizeMm: 1.2,
      bandInnerRadiusMm: target.inner,
      bandOuterRadiusMm: target.outer,
      placementTargetBandId: target.id
    };

    const result = runScalePlugin('circular', config, { startAngleDeg: 0, endAngleDeg: 360 });
    expect(result).not.toBeNull();
    expect(result?.placementTargetBandId).toBe(target.id);
    expect(result?.ticks.every((tick) => tickOuterExtentMm(tick) <= target.outer + 1e-9)).toBe(true);
    expect(result?.labels.every((label) =>
      label.radiusMm + estimateLabelRadialHalfExtentMm(label, result.fontSizeMm) <= target.outer + 1e-9
    )).toBe(true);
  });

  it('uses the selected target as the renderer clipping envelope', () => {
    const defaults = getScalePlugin('circular')!.defaultConfig;
    const result = runScalePlugin('circular', {
      ...defaults,
      bandInnerRadiusMm: 14,
      bandOuterRadiusMm: 17,
      placementTargetBandId: 'band-chapter-ring'
    }, { startAngleDeg: 0, endAngleDeg: 360 });

    expect(result?.placementEnvelope.outerRadiusMm).toBe(17);
    expect(result?.placementEnvelope.contentOuterRadiusMm).toBeLessThan(17);
  });

  it('uses the selected bezel OD instead of the larger case OD', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.globalDimensions.caseDiameterMm = 42;
    assembly.parts['inst-rotating-bezel']!.dimensions = {
      ...assembly.parts['inst-rotating-bezel']!.dimensions,
      diameterMm: 38,
      widthMm: 3.5
    };
    const outer = assemblyToBands(assembly).find((band) => band.id === 'band-outer-bezel')!;
    expect(outer.geometry).toEqual({ innerRadius: 15.5, outerRadius: 19 });
  });

  it('clips Visual-mode artwork to the physical bezel even if a stale preview is wider', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.globalDimensions.caseDiameterMm = 42;
    assembly.parts['inst-rotating-bezel']!.dimensions = {
      ...assembly.parts['inst-rotating-bezel']!.dimensions,
      diameterMm: 38,
      widthMm: 3.5
    };
    const defaults = getScalePlugin('circular')!.defaultConfig;
    const preview = runScalePlugin('circular', {
      ...defaults,
      bandInnerRadiusMm: 18.5,
      bandOuterRadiusMm: 21,
      placementTargetBandId: 'band-outer-bezel'
    }, { startAngleDeg: 0, endAngleDeg: 360 })!;
    const clip = scaleArtworkClipEnvelope(preview, watchAssemblyToVisualModel(assembly), 'outer');
    expect(clip).toEqual({ innerRadiusMm: 18.5, outerRadiusMm: 19 });
  });

  it('places front-view artwork above authored bezel inserts and raised markings', () => {
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    model.assets.bezel = visualAssetRegistry['reference-42-bezel-preview']!;
    expect(scaleArtworkSurfaceZ(model, 'outer')).toBeGreaterThan(model.previewEnvelope.bezelZ + 2.09);
    model.assets.bezel = visualAssetRegistry['archetype-bezel-diver']!;
    expect(scaleArtworkSurfaceZ(model, 'outer')).toBeGreaterThan(model.previewEnvelope.bezelZ + 1.79);
    model.assets.bezel = visualAssetRegistry['bezel-dive-coin-edge-42']!;
    expect(scaleArtworkSurfaceZ(model, 'outer')).toBeGreaterThan(model.previewEnvelope.bezelZ + 1.79);
  });

  it('insets Visual artwork onto the authored bezel insert instead of the carrier shoulder', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.globalDimensions.caseDiameterMm = 42;
    assembly.parts['inst-rotating-bezel']!.dimensions.diameterMm = 41;
    assembly.designConfig = { ...assembly.designConfig, visualReferenceConfig: { archetypeId: 'archetype-dive' } };
    const defaults = getScalePlugin('circular')!.defaultConfig;
    const preview = runScalePlugin('circular', {
      ...defaults,
      bandInnerRadiusMm: 15.75,
      bandOuterRadiusMm: 20.5,
      placementTargetBandId: 'band-outer-bezel'
    }, { startAngleDeg: 0, endAngleDeg: 360 })!;
    const model = watchAssemblyToVisualModel(assembly);
    expect(model.assets.bezel.assetId).toBe('archetype-bezel-diver');
    expect(scaleArtworkClipEnvelope(preview, model, 'outer').outerRadiusMm).toBe(19.6);
    expect(scaleArtworkRadialShiftMm(preview, model, 'outer')).toBeCloseTo(0.9);
  });

  it('clips the aviation inner scale to the chapter ring rather than the outer bezel', () => {
    const assembly = createDefaultWatchAssembly();
    const bands = assemblyToBands(assembly);
    const program = getScaleProgram('aviation', bands);
    const outer = bands.find((band) => band.id === 'band-outer-bezel')!;
    const defaults = getScalePlugin('slide-rule')!.defaultConfig;
    const preview = runScalePlugin('slide-rule', {
      ...defaults, ...program.config,
      placementTargetBandId: outer.id,
      bandInnerRadiusMm: outer.geometry.innerRadius,
      bandOuterRadiusMm: outer.geometry.outerRadius
    }, program.context)!;
    const model = watchAssemblyToVisualModel(assembly);
    const inner = scaleArtworkClipEnvelope(preview, model, 'inner');
    expect(inner).toEqual({ innerRadiusMm: 13.45, outerRadiusMm: 15.25 });
    expect(preview.ticks.filter((tick) => tick.ringId === 'inner').every((tick) => tick.radiusMm <= inner.outerRadiusMm && tick.radiusMm - tick.lengthMm >= inner.innerRadiusMm)).toBe(true);
    expect(preview.labels.filter((label) => label.ringId === 'inner').every((label) => label.radiusMm + preview.fontSizeMm / 2 <= inner.outerRadiusMm && label.radiusMm - preview.fontSizeMm / 2 >= inner.innerRadiusMm)).toBe(true);
  });

  it('keeps the fixed aviation ring on the chapter ring after a rotating bezel resize', () => {
    const previous = useScaleStore.getState();
    try {
      const bands = assemblyToBands(createDefaultWatchAssembly());
      useScaleStore.setState({ activeArchetypeId: 'archetype-pilot', crossArchetypeUnlocked: false });
      useScaleStore.getState().applyScaleProgram('aviation', bands);
      const innerRadius = useScaleStore.getState().pluginConfig.innerRadiusMm;
      const outer = bands.find((band) => band.kind === 'outer-bezel')!;
      useScaleStore.getState().syncFromBand({ ...outer, geometry: { ...outer.geometry, outerRadius: 21 } }, 0.1);
      expect(useScaleStore.getState().pluginConfig.innerRadiusMm).toBe(innerRadius);
      expect(useScaleStore.getState().preview!.ticks.filter((tick) => tick.ringId === 'inner').every((tick) => tick.radiusMm < 15.25)).toBe(true);
    } finally {
      useScaleStore.setState(previous);
    }
  });

  it('places the inner ring on the chapter surface underneath the sapphire', () => {
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    expect(scaleArtworkSurfaceZ(model, 'inner')).toBeLessThan(model.previewEnvelope.crystalZ - model.previewEnvelope.crystalThickness / 2);
    expect(scaleArtworkSurfaceZ(model, 'inner')).toBeCloseTo(model.previewEnvelope.chapterZ + 0.708);
  });

  it('builds the visible diver preview against the bezel on initial assembly sync', () => {
    const previous = useScaleStore.getState();
    try {
      useScaleStore.setState({
        activeArchetypeId: undefined,
        preview: null,
        previewEnabled: true,
        selectedScaleKind: 'circular',
        pluginConfig: { ...previous.pluginConfig, placementTargetBandId: undefined, bandOuterRadiusMm: 21 }
      });
      const assembly = createDefaultWatchAssembly();
      assembly.globalDimensions.caseDiameterMm = 42;
      syncAssemblyDownstream(assembly);
      const scale = useScaleStore.getState();
      expect(scale.preview?.ticks.length).toBeGreaterThan(0);
      expect(scale.preview?.placementTargetBandId).toBe('band-outer-bezel');
      expect(scale.preview?.placementEnvelope.outerRadiusMm).toBeLessThanOrEqual(19);
      expect(scale.preview?.physicalTargetsResolved).toBe(true);
    } finally {
      useScaleStore.setState(previous);
    }
  });
});
