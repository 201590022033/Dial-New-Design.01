import { beforeEach, describe, expect, it } from 'vitest';
import { customAviationDefaults, decimalHourReading, durationMinutes, knotsToMph, mphToKnots, runCustomAviation, assertCustomAviation } from '@/domain/scales/customAviation';
import { calculateAviation, aviationBezelAlignment } from '@/domain/scales/aviationSlideRule';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { resolveScaleLayers } from '@/services/scaleLayerArtworkService';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { resolvedScaleSvg } from '@/domain/scales/resolvedScaleArtwork';
import { generatePseudoDxf } from '@/services/exportGeometryService';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useScaleStore } from '@/stores/scaleStore';
import '@/stores/storeSync';
import { scaleArtworkBinding } from '@/visual3d/scaleArtworkBinding';
import { scaleArtworkClipEnvelope, scaleArtworkRadialShiftMm, scaleArtworkSurfaceZ } from '@/visual3d/scaleArtworkEnvelope';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

const assemblyFixture = () => createStarterBuild('pilot').assembly;
const wideBand = () => {
  const band = assemblyToBands(assemblyFixture()).find(entry => entry.kind === 'chapter-ring')!;
  return { ...band, visible: true, geometry: { ...band.geometry, innerRadius: 13, outerRadius: 16 } };
};
beforeEach(() => {
  useWatchAssemblyStore.getState().setAssembly(assemblyFixture());
  useWatchAssemblyStore.getState().clearAssemblyHistory();
});
describe('Milestone 5 custom aviation', () => {
  it('binds custom chapter artwork instead of an original row retained but disabled', () => {
    const custom = runCustomAviation(customAviationDefaults('decimal-hour'), wideBand());
    const original = { ...custom, kind: 'slide-rule' as const, placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring' };
    const preview = { ...original, layers: [original, custom] };
    expect(scaleArtworkBinding(preview, 'band-chapter-ring')).toEqual({ layer: custom, ring: 'outer' });
    expect(scaleArtworkBinding(preview, 'band-outer-bezel')).toEqual({ layer: original, ring: 'outer' });
    const model = watchAssemblyToVisualModel(assemblyFixture());
    expect(scaleArtworkClipEnvelope(custom, model, 'outer')).toBe(custom.placementEnvelope);
    expect(scaleArtworkRadialShiftMm(custom, model, 'outer')).toBe(0);
    expect(scaleArtworkSurfaceZ(model, 'outer', custom)).toBeLessThan(model.previewEnvelope.crystalZ - model.previewEnvelope.crystalThickness / 2);
    expect(scaleArtworkBinding(null, 'band-chapter-ring')).toBeNull();
  });
  it.each([[6,.10],[15,.25],[30,.50],[45,.75],[60,1],[90,1.5],[10,1/6]])('converts %s minutes without rounding intermediate duration', (minutes, hours) => {
    expect(decimalHourReading(minutes).hours).toBeCloseTo(hours, 12);
  });
  it('handles seam/whole hours and HH:MM as duration, not decimals', () => {
    expect(durationMinutes('1:30')).toBe(90);
    expect(durationMinutes('01:10')).toBe(70);
    for (const invalid of ['1.30','1:60','-1:30','NaN','1:3','']) expect(durationMinutes(invalid)).toBeNaN();
    expect(decimalHourReading(60)).toMatchObject({ wholeHours: 1, fraction: 0, angleDeg: 0 });
    expect(decimalHourReading(90)).toMatchObject({ wholeHours: 1, fraction: .5, angleDeg: 180 });
    expect(decimalHourReading(-1).hours).toBeNaN();
    expect(decimalHourReading(10).hours.toFixed(2)).toBe('0.17');
  });
  it('uses the exact speed ratio in both directions', () => {
    expect(knotsToMph(100)).toBeCloseTo(115.077944802, 8);
    expect(knotsToMph(120).toFixed(2)).toBe('138.09');
    for (const knots of [0,1,100,120,999]) expect(mphToKnots(knotsToMph(knots))).toBeCloseTo(knots, 12);
  });
  it('prints exactly 100 hundredth-hour stations with one seam and paired minute labels', () => {
    const result = runCustomAviation(customAviationDefaults('decimal-hour'), wideBand());
    expect(result.validation.valid).toBe(true);
    expect(result.ticks).toHaveLength(100);
    expect(new Set(result.ticks.map(tick => tick.angleDeg)).size).toBe(100);
    expect(result.ticks[1]!.value).toBe(.01);
    expect(result.ticks[1]!.angleDeg).toBe(3.6);
    expect(result.labels.filter(label => label.text === '0.00')).toHaveLength(1);
    expect(result.labels.find(label => label.text === '0.50')!.angleDeg).toBe(180);
    expect(result.labels.find(label => label.text === '30m')!.angleDeg).toBe(180);
    expect(result.labels.some(label => label.text === '1.00')).toBe(false);
  });
  it('prints fixed linear paired speeds, not logarithmic angles', () => {
    const result = runCustomAviation(customAviationDefaults('knots-mph'), wideBand());
    expect(result.validation.valid).toBe(true);
    expect(result.labels.find(label => label.text === '100kt')!.angleDeg).toBe(150);
    expect(result.labels.find(label => label.text === '115.1mph')!.angleDeg).toBe(150);
    expect(result.ticks).toHaveLength(41);
    const last = result.ticks.at(-1)!;
    expect(last.value).toBe(200); expect(last.angleDeg).toBe(300);
  });
  it('refuses narrow surfaces without shifting mathematical stations', () => {
    const band = wideBand(), layer = customAviationDefaults('decimal-hour');
    const result = runCustomAviation(layer, { ...band, geometry: { ...band.geometry, outerRadius: 13.3 } });
    expect(result.validation.valid).toBe(false);
    expect(result.ticks[25]!.angleDeg).toBe(90);
    expect(runCustomAviation(layer, undefined).validation.valid).toBe(false);
    expect(runCustomAviation(layer, { ...band, visible: false }).validation.valid).toBe(false);
  });
  it('retains original state and blocks a second layer claiming its chapter ring', () => {
    const assembly = assemblyFixture(), bands = assemblyToBands(assembly);
    const config = { ...getScalePlugin('slide-rule')!.defaultConfig, engineeringPreset: 'aviation-slide-rule' as const, placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring' };
    assembly.designConfig!.customAviationLayers = { version: 1, layers: [{ ...customAviationDefaults('decimal-hour'), enabled: true }] };
    const original = JSON.stringify(config);
    const result = resolveScaleLayers(assembly, bands, 'slide-rule', config, fullMinuteRingContext)!;
    expect(result.validation.valid).toBe(false);
    expect(result.validation.warnings.join(' ')).toContain('same physical band');
    expect(JSON.stringify(config)).toBe(original);
    expect(result.layers!.some(layer => layer.kind === 'slide-rule')).toBe(true);
  });
  it('persists isolated layers; disabling keeps their settings and never edits branded inventories', () => {
    const state = useWatchAssemblyStore.getState();
    state.updateCustomAviationLayer('decimal-hour', { enabled: true, rotationDeg: 27, color: '#c08a76' });
    state.updateCustomAviationLayer('knots-mph', { enabled: false, maximumKnots: 300 });
    const json = state.exportJson(), loaded = deserializeWatchAssembly(json);
    expect(loaded.designConfig!.customAviationLayers!.layers).toHaveLength(2);
    expect(serializeWatchAssembly(loaded)).toBe(json);
    state.updateCustomAviationLayer('decimal-hour', { enabled: false });
    expect(useWatchAssemblyStore.getState().assembly.designConfig!.customAviationLayers!.layers[1]).toMatchObject({ id: 'decimal-hour', rotationDeg: 27, color: '#c08a76', enabled: false });
    state.undoAssembly();
    expect(useWatchAssemblyStore.getState().assembly.designConfig!.customAviationLayers!.layers.find(layer => layer.id === 'decimal-hour')!.enabled).toBe(true);
    state.redoAssembly();
    expect(useWatchAssemblyStore.getState().assembly.designConfig!.customAviationLayers!.layers.find(layer => layer.id === 'decimal-hour')!.enabled).toBe(false);
    expect(useScaleStore.getState().preview).not.toBeUndefined();
  });
  it('blocks locked targets and malformed imports', () => {
    const state = useWatchAssemblyStore.getState();
    state.setPartLocked('inst-chapter-ring', true);
    state.updateCustomAviationLayer('decimal-hour', { enabled: true });
    expect(useWatchAssemblyStore.getState().assembly.designConfig!.customAviationLayers).toBeUndefined();
    expect(() => assertCustomAviation({ version: 1, layers: [{ ...customAviationDefaults('knots-mph'), fontSizeMm: NaN }] })).toThrow();
    expect(() => assertCustomAviation({ version: 1, layers: [customAviationDefaults('knots-mph'),customAviationDefaults('knots-mph')] })).toThrow();
  });
  it('exports canonical custom marks and units through shared SVG/DXF', () => {
    const result = runCustomAviation(customAviationDefaults('knots-mph'), wideBand());
    const svg = resolvedScaleSvg(result,42);
    expect(svg).toContain('115.1mph'); expect(svg).toContain('width="42mm"');
    const dxf = generatePseudoDxf({ target: 'entire-project', bands: [], selectedBandId: null, context: { width: 600,height:600,centerX:300,centerY:300,zoom:1,panX:0,panY:0 }, scalePreview: result, designOverlay: null });
    expect(dxf).toContain('115.1mph'); expect(dxf).toContain('100kt');
    expect(svg).not.toMatch(/LBS|US GAL|OIL/);
  });
  it('extends rate arithmetic and aligns burn rate, with explicit invalid inputs', () => {
    expect(calculateAviation('burn-rate',6,durationMinutes('0:40'))).toBe(9);
    expect(calculateAviation('fuel-used',9,durationMinutes('1:30'))).toBe(13.5);
    expect(calculateAviation('endurance',24,8)).toBe(180);
    expect(calculateAviation('distance',120,90)).toBe(180);
    expect(calculateAviation('groundspeed',180,90)).toBe(120);
    expect(calculateAviation('time',180,120)).toBe(90);
    expect(aviationBezelAlignment('burn-rate',6,40)).toBe(aviationBezelAlignment('fuel-used',9,40));
    for (const value of [0,-1,NaN,Infinity]) expect(calculateAviation('burn-rate',6,value)).toBeNaN();
  });
});
