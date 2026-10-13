import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultDiverBezel, diverBezelArtwork, bezelElapsedMinutes, assertDiverBezel } from '@/domain/scales/diverBezel';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { runScalePlugin } from '@/services/scaleEngineService';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { scaleSnapshotFromAssembly } from '@/domain/scales/scaleDocumentAdapter';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useScaleStore } from '@/stores/scaleStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { resolvePhysicalScaleConfig } from '@/services/scaleLayerArtworkService';
import { DiverBezelPanel } from '@/components/configurator/DiverBezelPanel';
import { AdvancedModePanel } from '@/components/configurator/AdvancedModePanel';
import { scaleArtworkSurfaceZ } from '@/visual3d/scaleArtworkEnvelope';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import '@/stores/storeSync';
const config = { ...getScalePlugin('circular')!.defaultConfig, diverBezel: { ...defaultDiverBezel },
  bandInnerRadiusMm: 15, bandOuterRadiusMm: 19, color: '#eeeeee', minimumLineWidthMm: .1 };
const diverAssembly = () => { const a = createDefaultWatchAssembly(); a.designConfig = { ...a.designConfig,
  visualReferenceConfig: { ...a.designConfig?.visualReferenceConfig, archetypeId: 'archetype-dive' } }; return a; };
describe('diver bezel calibration and artwork', () => {
  it.each([15,20] as const)('uses fine marks only through %i and one zero triangle', detailedMinutes => {
    const a = diverBezelArtwork({ ...config, diverBezel: { ...defaultDiverBezel, detailedMinutes } });
    expect(a.ticks).toHaveLength(detailedMinutes + (55-detailedMinutes)/5);
    expect(a.ticks.every(t => t.value! <= detailedMinutes || t.value! % 5 === 0)).toBe(true);
    expect(a.labels.map(l => l.text)).toEqual(['10','20','30','40','50']);
    expect(a.pointer.value).toBe(0);
  });
  it('prioritizes five-minute red over the separately coloured fine section', () => {
    const a = diverBezelArtwork({ ...config, diverBezel: { ...defaultDiverBezel, detailColourEnabled: true, fiveMinuteHighlight: true } });
    const tick = (n: number) => a.ticks.find(t => t.value === n)!;
    expect(tick(5).color).toBe(defaultDiverBezel.fiveMinuteColour);
    expect(tick(6).color).toBe(defaultDiverBezel.detailColour);
    expect(tick(20).color).toBe(defaultDiverBezel.detailColour);
    expect(tick(25).color).toBe(config.color);
  });
  it('rotates exactly six degrees per minute across the seam in shared SVG', () => {
    const result = runScalePlugin('circular', { ...config, rotationOffsetDeg: 354 }, fullMinuteRingContext)!;
    expect(result.ticks.find(t => t.value === 1)?.angleDeg).toBe(0);
    expect(result.pointers?.find(p => p.id === 'diver:zero')?.angleDeg).toBe(354);
    expect(result.labels[0]!.rotationDeg).toBe(0);
    expect(result.svg).toContain('diver:zero');
    expect(result.svg).toContain('diver:tick:1');
    expect(bezelElapsedMinutes(2,354)).toBe(3);
    expect(bezelElapsedMinutes(15,90)).toBe(0);
    expect(result.validation.valid, result.validation.warnings.join(' ')).toBe(true);
  });
  it('places the internal diver ring under the crystal rather than on the external bezel', () => {
    const model = watchAssemblyToVisualModel(diverAssembly());
    const result = runScalePlugin('circular', { ...config, placementTargetBandId: 'band-inner-bezel' }, fullMinuteRingContext)!;
    const external = { ...result, placementTargetBandId: 'band-outer-bezel' };
    expect(scaleArtworkSurfaceZ(model, 'outer', result)).toBeLessThan(scaleArtworkSurfaceZ(model, 'outer', external));
  });
  it('rejects malformed imported settings', () => {
    expect(() => assertDiverBezel({ ...defaultDiverBezel, detailColour: '<script>' })).toThrow();
    expect(() => assertDiverBezel({ ...defaultDiverBezel, detailedMinutes: 19 })).toThrow();
  });
});
describe('diver settings in canonical history and UI', () => {
  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => {
    vi.spyOn(React, 'useSyncExternalStore').mockImplementation((_subscribe, getSnapshot) => getSnapshot());
    useConfiguratorUIStore.setState({ lockedPartIds: new Set() });
    useScaleStore.setState({ activeArchetypeId: 'archetype-dive', crossArchetypeUnlocked: false });
    useWatchAssemblyStore.getState().setAssembly(diverAssembly());
    useScaleStore.getState().applyScaleProgram('diver', assemblyToBands(useWatchAssemblyStore.getState().assembly));
    useWatchAssemblyStore.getState().clearAssemblyHistory();
  });
  it('loads a fresh diver baseline with the new markings, including repeated loads', () => {
    const first = createStarterBuild('diver').assembly;
    const next = createStarterBuild('diver', first).assembly;
    expect(scaleSnapshotFromAssembly(next)?.pluginConfig).toMatchObject({ diverBezel: defaultDiverBezel, fontFamily: 'Arial, sans-serif', rotationOffsetDeg: 0 });
  });
  it('persists colours, rotation and internal placement through save/load and Undo/Redo', () => {
    useScaleStore.getState().updatePluginConfig({ diverBezel: { ...defaultDiverBezel, mounting: 'internal', detailedMinutes: 15, fiveMinuteHighlight: true },
      placementTargetBandId: 'band-inner-bezel', rotationOffsetDeg: 42 });
    const saved = deserializeWatchAssembly(serializeWatchAssembly(useWatchAssemblyStore.getState().assembly));
    expect(saved.designConfig?.diverBezel?.detailedMinutes).toBe(15);
    expect(saved.scaleBinding?.config.rotationOffsetDeg).toBe(42);
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useScaleStore.getState().pluginConfig.diverBezel?.mounting).toBe('external');
    useWatchAssemblyStore.getState().redoAssembly();
    expect(useScaleStore.getState().pluginConfig.rotationOffsetDeg).toBe(42);
  });
  it('guards the destination component when moving to an internal ring', () => {
    useWatchAssemblyStore.getState().setPartLocked('inst-inner-bezel', true);
    useScaleStore.getState().updatePluginConfig({ placementTargetBandId: 'band-inner-bezel', diverBezel: { ...defaultDiverBezel, mounting: 'internal' } });
    expect(useScaleStore.getState().pluginConfig.placementTargetBandId).toBe('band-outer-bezel');
  });
  it('keeps diver controls and special artwork exclusive to the Diver archetype even with overrides', () => {
    const a = diverAssembly(); a.designConfig!.visualReferenceConfig!.archetypeId = 'archetype-field';
    useWatchAssemblyStore.getState().setAssembly(a);
    useScaleStore.setState({ crossArchetypeUnlocked: true });
    expect(renderToStaticMarkup(createElement(DiverBezelPanel))).toBe('');
    const physical = resolvePhysicalScaleConfig(a, assemblyToBands(a), config, 'circular');
    expect(physical.diverBezel).toBeUndefined();
    useScaleStore.getState().updatePluginConfig({ diverBezel: { ...defaultDiverBezel, fiveMinuteHighlight: true } });
    expect(useScaleStore.getState().pluginConfig.diverBezel?.fiveMinuteHighlight).not.toBe(true);
  });
  it('puts the operation controls and pilot choices before general CAD settings', () => {
    const html = renderToStaticMarkup(createElement(AdvancedModePanel));
    expect(html.indexOf('Bezel markings')).toBeLessThan(html.indexOf('CAD Inspection Overlays'));
    expect(html).toContain('Fine graduation section');
    expect(html).not.toContain('Citizen Skyhawk');
    const pilot = diverAssembly(); pilot.designConfig!.visualReferenceConfig!.archetypeId = 'archetype-pilot';
    useWatchAssemblyStore.getState().setAssembly(pilot);
    useScaleStore.setState({ activeArchetypeId: 'archetype-pilot' });
    const pilotHtml = renderToStaticMarkup(createElement(AdvancedModePanel));
    expect(pilotHtml).toContain('Citizen Skyhawk');
    expect(pilotHtml).not.toContain('diver-bezel-panel');
  });
});
