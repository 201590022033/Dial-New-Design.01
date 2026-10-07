import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { withScaleSnapshot } from '@/domain/scales/scaleDocumentAdapter';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { scaleArtworkLayers, resolvedScaleSvg, scaleArtworkSvgContent } from '@/domain/scales/resolvedScaleArtwork';
import { logDecadeAngle } from '@/domain/scales/calibratedSlideRule';
import { pointerHalfExtentMm } from '@/domain/scales/pointerGeometry';
import { runScalePlugin } from '@/services/scaleEngineService';
import { resolveScaleLayers } from '@/services/scaleLayerArtworkService';
import { generateEngineeringSvg, generatePseudoDxf } from '@/services/exportGeometryService';
import { scaleArtworkSurfaceZ } from '@/visual3d/scaleArtworkEnvelope';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import type { ScalePointer } from '@/domain/scales/types';

const context = { startAngleDeg: 0, endAngleDeg: 360 };
const config = { ...getScalePlugin('slide-rule')!.defaultConfig, ...getScaleProgram('aviation', []).config,
  scaleFontSizeMm: 0.6, bandInnerRadiusMm: 16, bandOuterRadiusMm: 20, outerRadiusMm: 18,
  fixedBandInnerRadiusMm: 11, fixedBandOuterRadiusMm: 15, innerRadiusMm: 13, placementTargetBandId: 'custom-a',
  fixedPlacementTargetBandId: 'custom-fixed', innerScaleVisible: false };
const pointer: ScalePointer = { id: 'speed-pointer', value: 60, ringId: 'outer', angleDeg: 999, radiusMm: 19.99,
  shape: 'triangle', widthMm: 0.7, heightMm: 1, strokeWidthMm: 0.08, color: '#e63946', hoverPaddingMm: 0.1 };
const exportInput = (preview: ReturnType<typeof runScalePlugin>) => ({ target: 'entire-project' as const, bands: [], selectedBandId: null,
  scalePreview: preview, designOverlay: null, context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 } });

describe('Milestone 2 remaining runtime acceptance', () => {
  it('fits pointer shape, stroke and hover padding without moving calibration', () => {
    const result = runScalePlugin('slide-rule', { ...config, pointers: [pointer], hoverPaddingMm: 0.1, outerRotationOffsetDeg: 37 }, context)!;
    const mark = result.pointers![0]!;
    expect(result.validation.valid).toBe(true);
    expect(mark.angleDeg).toBeCloseTo(logDecadeAngle(60) + 37);
    expect(mark.radiusMm + pointerHalfExtentMm(mark)).toBeLessThan(20);
    expect(mark.radiusMm - pointerHalfExtentMm(mark)).toBeGreaterThan(16);
    expect(scaleArtworkSvgContent(result)).toContain('data-scale-hit-id="speed-pointer"');
    expect(resolvedScaleSvg(result, 42)).toContain('<polygon');
    expect(resolvedScaleSvg(result, 42)).not.toContain('data-scale-hit-id');
    expect(generatePseudoDxf(exportInput(result))).toContain('scale-outer-pointer');
    expect(generatePseudoDxf(exportInput(result))).toContain('\nSOLID\n');
  });
  it('rotates outer pointers but never moves the fixed pointers', () => {
    const fixed = { ...pointer, id: 'fixed-pointer', ringId: 'inner' as const, radiusMm: 13 };
    const a = runScalePlugin('slide-rule', { ...config, innerScaleVisible: true, pointers: [pointer, fixed], outerRotationOffsetDeg: 0 }, context)!;
    const b = runScalePlugin('slide-rule', { ...config, innerScaleVisible: true, pointers: [pointer, fixed], outerRotationOffsetDeg: 80 }, context)!;
    expect(b.pointers![0]!.angleDeg - a.pointers![0]!.angleDeg).toBe(80);
    expect(b.pointers![1]!.angleDeg).toBe(a.pointers![1]!.angleDeg);
  });
  it('removes forbidden conversion pointers without deleting normal graduations', () => {
    const result = runScalePlugin('slide-rule', { ...config, pointers: [{ ...pointer, dedicatedConversion: 'volume' }] }, context)!;
    expect(result.pointers).toHaveLength(0);
    expect(result.ticks.filter((tick) => tick.ringId === 'outer')).toHaveLength(75);
  });
  it('blocks every vector export on impossible fit instead of silently clipping for manufacture', () => {
    const result = runScalePlugin('slide-rule', { ...config, pointers: [{ ...pointer, widthMm: 10 }] }, context)!;
    expect(result.validation.valid).toBe(false);
    expect(result.pointers).toHaveLength(1);
    expect(() => generateEngineeringSvg(exportInput(result))).toThrow('before exporting');
    expect(() => generatePseudoDxf(exportInput(result))).toThrow('before exporting');
  });
  it('persists reproducible rows, typography anchors, pointer style and physical bounds', () => {
    const assembly = withScaleSnapshot(createDefaultWatchAssembly(), { selectedScaleKind: 'slide-rule', pluginConfig: { ...config, pointers: [pointer] }, context });
    const saved = deserializeWatchAssembly(serializeWatchAssembly(assembly)).designConfig!.slideRuleLayers!.layers[0]!.settings.simplified!;
    expect(saved.artwork?.version).toBe(1);
    expect(saved.artwork?.metricsEvidence).toBe('browser-measured-or-estimated');
    expect(saved.artwork?.labels[0]).toMatchObject({ angleDeg: 0, orientation: 'horizontal', rotationDeg: 0 });
    expect(saved.artwork?.labels[0]?.boundsMm?.width).toBeGreaterThan(0);
    expect(saved.artwork?.labels[0]?.boundsEvidence).toBe('estimated');
    expect(saved.artwork?.pointers[0]?.shape).toBe('triangle');
    expect(saved.baseline?.pluginConfig.pointers?.[0]?.value).toBe(60);
  });
  const fixture = () => {
    const base = createDefaultWatchAssembly();
    const template = assemblyToBands(base)[0]!;
    const bands = [{ ...template, id: 'custom-a', kind: 'inner-bezel' as const, geometry: { innerRadius: 16, outerRadius: 20 } },
      { ...template, id: 'custom-b', kind: 'inner-bezel' as const, geometry: { innerRadius: 16, outerRadius: 20 } }];
    const first = withScaleSnapshot(base, { selectedScaleKind: 'slide-rule', pluginConfig: config, context });
    const assembly = withScaleSnapshot(first, { selectedScaleKind: 'slide-rule', pluginConfig: { ...config, placementTargetBandId: 'custom-b', color: '#ff0000' }, context });
    return { assembly, bands };
  };
  it('renders and exports all independent active layers with their own styles', () => {
    const { assembly, bands } = fixture();
    const result = resolveScaleLayers(assembly, bands, 'slide-rule', { ...config, placementTargetBandId: 'custom-b', color: '#ff0000' }, context)!;
    expect(result.validation.valid).toBe(true);
    expect(scaleArtworkLayers(result)).toHaveLength(2);
    expect(result.svg).toContain('data-band-id="custom-a"');
    expect(result.svg).toContain('data-band-id="custom-b"');
    expect(generatePseudoDxf(exportInput(result)).match(/\nTEXT\n/g)).toHaveLength(24);
    expect(generateEngineeringSvg(exportInput(result)).match(/data-scale-label-index/g)).toHaveLength(24);
    expect(generateEngineeringSvg(exportInput(result))).toContain('width="60mm" height="60mm" viewBox="0 0 600 600"');
  });
  it('disabling the editing layer leaves the other layer visible', () => {
    const { assembly, bands } = fixture();
    const result = resolveScaleLayers(assembly, bands, 'slide-rule', { ...config, placementTargetBandId: 'custom-b', previewEnabled: false }, context)!;
    expect(scaleArtworkLayers(result)).toHaveLength(1);
    expect(result.svg).toContain('data-band-id="custom-a"');
    expect(result.svg).not.toContain('data-band-id="custom-b"');
  });
  it('refuses two active layers claiming one fixed band, rather than overlaying it', () => {
    const { assembly, bands } = fixture();
    assembly.designConfig!.slideRuleLayers!.layers.forEach((layer) => { layer.settings.simplified!.legacy.pluginConfig.innerScaleVisible = true; });
    const result = resolveScaleLayers(assembly, bands, 'slide-rule', { ...config, placementTargetBandId: 'custom-b', innerScaleVisible: true }, context)!;
    expect(result.validation.valid).toBe(false);
    expect(result.validation.warnings.join(' ')).toContain('same physical band');
    expect(() => generateEngineeringSvg(exportInput(result))).toThrow();
  });
  it('places fixed-bezel artwork on the bezel face, not the chapter/dial plane', () => {
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    const result = runScalePlugin('slide-rule', { ...config, fixedPlacementTargetBandId: 'band-inner-bezel' }, context)!;
    expect(scaleArtworkSurfaceZ(model, 'inner', result)).toBe(scaleArtworkSurfaceZ(model, 'outer', result));
  });
});
