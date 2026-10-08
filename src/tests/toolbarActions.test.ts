import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) } });
});
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useExportStore } from '@/stores/exportStore';
import { resizeCasePreview, applyToolbarDiameter, createToolbarExportRequest } from '@/components/layout/toolbarActions';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { useBandsStore } from '@/stores/bandsStore';
import { useScaleStore } from '@/stores/scaleStore';
import { createBand } from '@/domain/bands/bandRegistry';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { resolvePhysicalScaleConfig, resolveScaleLayers } from '@/services/scaleLayerArtworkService';
import { referenceScaleDefaults } from '@/services/referenceScaleArtworkService';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { buildEngineeringExport } from '@/services/exportService';
import type { SlideRuleLayer } from '@/domain/scales/slideRuleLayers';

const referenceFixture = () => {
  const assembly = createDefaultWatchAssembly();
  const bands = assemblyToBands(assembly);
  const physical = resolvePhysicalScaleConfig(assembly, bands, { ...getScalePlugin('slide-rule')!.defaultConfig, placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring' }, 'slide-rule');
  const config = { ...physical, ...referenceScaleDefaults('navitimer', physical), previewEnabled: true };
  const hiddenConfig = { ...config, placementTargetBandId: 'band-dial-face', referencePixelMm: -1, previewEnabled: false };
  const hidden: SlideRuleLayer = { id: 'hidden-dial', targetBandId: 'band-dial-face', fixedTargetBandId: 'band-chapter-ring', activeDesign: 'navitimer', settings: { navitimer: { referenceId: 'navitimer-booklet-training-disc-2026-10-07', colourMode: 'original', colourOverrides: {}, visibility: { outer: true, inner: true, time: false, distance: true }, outerRotationDeg: 0, legacy: { selectedScaleKind: 'slide-rule', pluginConfig: hiddenConfig, context: fullMinuteRingContext } } } };
  assembly.designConfig = { ...assembly.designConfig, slideRuleLayers: { version: 1, layers: [hidden] } };
  return { assembly, bands, config, hidden };
};

describe('hybrid toolbar authoritative preview geometry', () => {
  beforeEach(() => {
    useWatchAssemblyStore.setState({ assembly: createDefaultWatchAssembly(), historyPast: [], historyFuture: [] });
    useWatchAssemblyStore.getState().clearAssemblyHistory();
    useConfiguratorUIStore.setState({ previewStatus: 'none', archetypePreviewAssembly: null, lockedPartIds: new Set() });
  });

  it.each([20, 34, 42, 46, 60])('accepts %s mm including ladies and larger cases without resizing purchased parts', (diameter) => {
    const original = createDefaultWatchAssembly();
    const next = resizeCasePreview(original, diameter);
    expect(next.globalDimensions.caseDiameterMm).toBe(diameter);
    expect(next.designConfig?.geometryParameters?.caseDiameterMm).toBe(diameter);
    expect(next.parts).toBe(original.parts);
    expect(next.scaleBinding).toBe(original.scaleBinding);
    expect(original.globalDimensions.caseDiameterMm).toBe(40);
  });

  it.each([NaN, Infinity, -1, 0, 19.9, 60.1])('refuses invalid diameter %s', (value) => {
    expect(() => resizeCasePreview(createDefaultWatchAssembly(), value)).toThrow('20 to 60');
  });

  it('refuses both persisted case locks and session locks', () => {
    const assembly = createDefaultWatchAssembly();
    const part = Object.values(assembly.parts)[0]!;
    part.category = 'case';
    part.locked = true;
    expect(() => resizeCasePreview(assembly, 46)).toThrow('Unlock');
    part.locked = false;
    expect(() => resizeCasePreview(assembly, 46, new Set([part.instanceId]))).toThrow('Unlock');
  });

  it('creates one undoable assembly change and preserves hand physical dimensions', () => {
    const before = useWatchAssemblyStore.getState().assembly;
    applyToolbarDiameter(34);
    expect(useWatchAssemblyStore.getState().historyPast).toHaveLength(1);
    expect(useWatchAssemblyStore.getState().assembly.parts).toEqual(before.parts);
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useWatchAssemblyStore.getState().assembly.globalDimensions.caseDiameterMm).toBe(40);
    useWatchAssemblyStore.getState().redoAssembly();
    expect(useWatchAssemblyStore.getState().assembly.globalDimensions.caseDiameterMm).toBe(34);
  });

  it('refuses diameter/export writes while a component or build preview is unapplied', () => {
    useConfiguratorUIStore.setState({ previewStatus: 'previewing' });
    expect(() => applyToolbarDiameter(46)).toThrow('Apply or cancel');
    expect(() => createToolbarExportRequest('svg')).toThrow('Apply or cancel');
    useConfiguratorUIStore.setState({ previewStatus: 'none', archetypePreviewAssembly: createDefaultWatchAssembly() });
    expect(() => applyToolbarDiameter(46)).toThrow('Apply or cancel');
  });

  it.each(['svg', 'dxf', 'pdf'] as const)('uses the canonical %s export and authoritative mm diameter', (format) => {
    applyToolbarDiameter(46);
    useExportStore.setState({ target: 'entire-project' });
    const request = createToolbarExportRequest(format);
    expect(request.format).toBe(format);
    expect(request.target).toBe('entire-project');
    expect(request.metadata?.caseDiameter).toBe(46);
    expect(request.metadata?.units).toBe('mm');
    expect(request.filename.endsWith(`.${format}`)).toBe(true);
  });

  it('exports actual physical assembly bands even when the legacy bands store is stale', () => {
    useBandsStore.setState({ bands: [createBand('stale-band', 'dial-face', { innerRadius: 0, outerRadius: 99 })] });
    const request = createToolbarExportRequest('svg');
    expect(request.bands.map((band) => [band.id, band.geometry])).toEqual(assemblyToBands(useWatchAssemblyStore.getState().assembly).map((band) => [band.id, band.geometry]));
    expect(request.bands.some((band) => band.id === 'stale-band')).toBe(false);
  });

  it.each(['svg', 'dxf', 'pdf'] as const)('ignores retained disabled malformed layers when building %s, but preserves valid artwork', (format) => {
    const { assembly, config } = referenceFixture();
    useWatchAssemblyStore.getState().setAssembly(assembly);
    useScaleStore.setState({ selectedScaleKind: 'slide-rule', pluginConfig: config, context: fullMinuteRingContext });
    const request = createToolbarExportRequest(format);
    expect(request.scalePreview?.layers).toHaveLength(1);
    expect(request.scalePreview?.validation.valid).toBe(true);
    expect(buildEngineeringExport(request).content).toContain(format === 'dxf' ? 'SECTION' : '<svg');
  });

  it('does not generate malformed disabled current editor settings', () => {
    const { assembly, bands, config } = referenceFixture();
    expect(resolveScaleLayers(assembly, bands, 'slide-rule', { ...config, referencePixelMm: -1, previewEnabled: false }, fullMinuteRingContext)).toBeNull();
  });

  it('still blocks genuinely active malformed layers rather than silently omitting them', () => {
    const { assembly, bands, config, hidden } = referenceFixture();
    hidden.settings.navitimer!.legacy.pluginConfig.previewEnabled = true;
    expect(() => resolveScaleLayers(assembly, bands, 'slide-rule', config, fullMinuteRingContext)).toThrow('Invalid Navitimer');
    expect(() => resolveScaleLayers(assembly, bands, 'slide-rule', { ...config, referencePixelMm: -1 }, fullMinuteRingContext)).toThrow('Invalid Navitimer');
  });
});
