import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AviationSlideRulePanel } from '@/components/configurator/AviationSlideRulePanel';
import { generateAviationRings } from '@/domain/scales/aviationSlideRule';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { runScalePlugin } from '@/services/scaleEngineService';
import { generateEngineeringSvg, generatePseudoDxf } from '@/services/exportGeometryService';
import { resolvedScaleSvg } from '@/domain/scales/resolvedScaleArtwork';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { scaleSnapshotFromAssembly, withScaleSnapshot } from '@/domain/scales/scaleDocumentAdapter';
import { useScaleStore } from '@/stores/scaleStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import '@/stores/storeSync';

const config = { ...getScalePlugin('slide-rule')!.defaultConfig, ...getScaleProgram('aviation', []).config,
  placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring',
  bandInnerRadiusMm: 13, bandOuterRadiusMm: 23, outerRadiusMm: 20, innerRadiusMm: 16,
  scaleFontSizeMm: .45, referenceDesign: 'simplified' as const, previewEnabled: true };
const context = { startAngleDeg: 0, endAngleDeg: 360 };

describe('Simplified functional writing/detail controls', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  beforeEach(() => {
    useScaleStore.setState({ activeArchetypeId: undefined, crossArchetypeUnlocked: false });
    useWatchAssemblyStore.getState().setAssembly(withScaleSnapshot(createDefaultWatchAssembly(), {
      selectedScaleKind: 'slide-rule', pluginConfig: { ...config }, context
    }));
    useWatchAssemblyStore.getState().clearAssemblyHistory();
  });
  it('adds only existing whole-unit writing and leaves every tick value/angle unchanged', () => {
    const key = generateAviationRings({ ...config, allowAdaptiveLabelOmission: false });
    const detail = generateAviationRings({ ...config, aviationNumeralDetail: 'whole-units', allowAdaptiveLabelOmission: false });
    expect(key.labels).toHaveLength(24);
    expect(detail.labels.length).toBeGreaterThan(key.labels.length);
    expect(detail.ticks).toEqual(key.ticks);
    for (const label of detail.labels) {
      expect(Number.isInteger(label.value)).toBe(true);
      expect(detail.ticks.some((t) => t.ringId === label.ringId && t.value === label.value && t.angleDeg === label.angleDeg)).toBe(true);
    }
  });
  it('hides writing independently from complete rows and restores it in both directions', () => {
    const full = runScalePlugin('slide-rule', config, context)!;
    const noOuterWriting = runScalePlugin('slide-rule', { ...config, outerNumeralsVisible: false }, context)!;
    expect(noOuterWriting.ticks).toEqual(full.ticks);
    expect(noOuterWriting.labels).toEqual(full.labels.filter((l) => l.ringId === 'inner'));
    const noInnerWriting = runScalePlugin('slide-rule', { ...config, innerNumeralsVisible: false }, context)!;
    expect(noInnerWriting.ticks).toEqual(full.ticks);
    expect(noInnerWriting.labels).toEqual(full.labels.filter((l) => l.ringId === 'outer'));
    const noOuter = runScalePlugin('slide-rule', { ...config, outerScaleVisible: false }, context)!;
    expect(noOuter.ticks).toEqual(full.ticks.filter((t) => t.ringId === 'inner'));
    expect(runScalePlugin('slide-rule', { ...config, outerNumeralsVisible: true, innerNumeralsVisible: true }, context)!.labels).toEqual(full.labels);
  });
  it('makes auto-fit reversible without changing graduations or calibration', () => {
    const all = generateAviationRings({ ...config, aviationNumeralDetail: 'whole-units', scaleFontSizeMm: 1.4, allowAdaptiveLabelOmission: false });
    const fitted = generateAviationRings({ ...config, aviationNumeralDetail: 'whole-units', scaleFontSizeMm: 1.4, allowAdaptiveLabelOmission: true });
    expect(fitted.labels.length).toBeLessThan(all.labels.length);
    expect(fitted.ticks).toEqual(all.ticks);
    expect(generateAviationRings({ ...config, aviationNumeralDetail: 'whole-units', scaleFontSizeMm: 1.4, allowAdaptiveLabelOmission: false })).toEqual(all);
  });
  it('reports writing collisions only for visible writing while validating underlying calculation rows', () => {
    const crowded = { ...config, aviationNumeralDetail: 'whole-units' as const, scaleFontSizeMm: 1.4, allowAdaptiveLabelOmission: false };
    const visible = runScalePlugin('slide-rule', crowded, context)!;
    expect(visible.validation.warnings.some((warning) => warning.includes('labels') && warning.includes('overlap'))).toBe(true);
    const hiddenOuter = runScalePlugin('slide-rule', { ...crowded, outerNumeralsVisible: false }, context)!;
    expect(hiddenOuter.validation.warnings.some((warning) => warning.startsWith('outer labels'))).toBe(false);
    expect(hiddenOuter.validation.warnings.some((warning) => warning.startsWith('inner labels'))).toBe(true);
    const hiddenAll = runScalePlugin('slide-rule', { ...crowded, outerNumeralsVisible: false, innerNumeralsVisible: false }, context)!;
    expect(hiddenAll.validation.warnings.some((warning) => warning.includes('labels') && warning.includes('overlap'))).toBe(false);
    expect(hiddenAll.ticks).toEqual(visible.ticks);
    expect(hiddenAll.validation.warnings.some((warning) => warning.includes('Invalid') && warning.includes('calculation row'))).toBe(false);
  });
  it('sends the same resolved visible writing to Engineering, HD input and vector exports', () => {
    const artwork = runScalePlugin('slide-rule', { ...config, outerNumeralsVisible: false }, context)!;
    const svg = resolvedScaleSvg(artwork, 46);
    expect(svg).not.toContain('data-mark-id="slide-rule:outer:label:');
    expect(svg).toContain('data-mark-id="slide-rule:inner:label:');
    const input = { target: 'entire-project' as const, bands: [], selectedBandId: null,
      context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 },
      designOverlay: null, scalePreview: artwork };
    const engineering = generateEngineeringSvg(input);
    expect((engineering.match(/<text /g) ?? []).length).toBe(artwork.labels.length);
    const dxf = generatePseudoDxf(input);
    expect((dxf.match(/\nTEXT\n/g) ?? []).length).toBe(artwork.labels.length);
    expect(artwork.geometry.labels).toEqual(artwork.labels);
    // HD consumes ScaleRunResult.labels; writing is absent before any consumer paints it.
    expect(artwork.labels.every((l) => l.ringId === 'inner')).toBe(true);
  });
  it('persists detail/visibility, restores through Undo, and isolates brand designs', () => {
    useScaleStore.getState().updatePluginConfig({ aviationNumeralDetail: 'whole-units', allowAdaptiveLabelOmission: false, innerNumeralsVisible: false });
    const saved = deserializeWatchAssembly(serializeWatchAssembly(useWatchAssemblyStore.getState().assembly));
    expect(scaleSnapshotFromAssembly(saved)!.pluginConfig).toMatchObject({ aviationNumeralDetail: 'whole-units', allowAdaptiveLabelOmission: false, innerNumeralsVisible: false });
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useScaleStore.getState().pluginConfig.innerNumeralsVisible).not.toBe(false);
    useWatchAssemblyStore.getState().redoAssembly();
    expect(useScaleStore.getState().pluginConfig.innerNumeralsVisible).toBe(false);
    useScaleStore.getState().selectReferenceDesign('citizen');
    expect(useScaleStore.getState().pluginConfig.aviationNumeralDetail).toBeUndefined();
    useScaleStore.getState().selectReferenceDesign('simplified');
    expect(useScaleStore.getState().pluginConfig.aviationNumeralDetail).toBe('whole-units');
    useScaleStore.getState().resetSimplifiedBaseline();
    expect(useScaleStore.getState().pluginConfig.aviationNumeralDetail).toBeUndefined();
    expect(useScaleStore.getState().pluginConfig.innerNumeralsVisible).not.toBe(false);
  });
  it('shows actual wired writing controls and explains absent rows instead of offering dormant placeholders', () => {
    vi.stubGlobal('React', React);
    vi.spyOn(React, 'useSyncExternalStore').mockImplementation((_subscribe, getSnapshot) => getSnapshot());
    const markup = renderToStaticMarkup(createElement(AviationSlideRulePanel));
    expect(markup).toContain('Simplified numeral detail');
    expect(markup).toContain('Auto-fit Simplified writing');
    expect(markup).toContain('not a time row or named conversion references');
    expect(markup).toContain('Time-conversion row writing');
    expect((markup.match(/disabled=""/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});
