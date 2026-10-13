import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { navitimerGraduations, NAVITIMER_UNIT_ORIGIN_DEG } from '@/domain/scales/navitimerReferenceArtwork';
import { generateAviationRings } from '@/domain/scales/aviationSlideRule';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { customAviationDefaults, runCustomAviation, assertCustomAviation } from '@/domain/scales/customAviation';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { CustomAviationPanel } from '@/components/configurator/CustomAviationPanel';
import { runScalePlugin } from '@/services/scaleEngineService';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import '@/stores/storeSync';
const config = { ...getScalePlugin('slide-rule')!.defaultConfig, ...getScaleProgram('aviation', []).config };
describe('Simplified pilot Navitimer subgraduations', () => {
  it('shares all 210 stations per row while retaining Simplified origin and lettering', () => {
    const simplified = generateAviationRings({ ...config, outerRotationOffsetDeg: 23, innerRotationOffsetDeg: 7 });
    const reference = navitimerGraduations();
    for (const row of ['outer', 'inner'] as const) {
      const ticks = simplified.ticks.filter(t => t.ringId === row);
      const source = reference.filter(t => t.row === row);
      expect(ticks.map(t => t.value)).toEqual(source.map(t => t.value));
      expect(ticks).toHaveLength(210);
      for (let i = 0; i < ticks.length; i++) {
        const restored = ((ticks[i]!.angleDeg - (row === 'outer' ? 23 : 7) + NAVITIMER_UNIT_ORIGIN_DEG) % 360 + 360) % 360;
        expect(restored).toBeCloseTo(source[i]!.angleDeg, 10);
      }
    }
    expect(simplified.labels.some(l => l.text === '11')).toBe(false);
    expect(simplified.labels.some(l => l.text === '10')).toBe(true);
  });
  it('keeps fine marks in SVG independently of numeral omission and supports the former coarse option', () => {
    const result = runScalePlugin('slide-rule', config, fullMinuteRingContext)!;
    expect(result.ticks).toHaveLength(420);
    expect(result.svg.match(/data-scale-tick-index=/g)).toHaveLength(420);
    expect(generateAviationRings({ ...config, aviationGraduationStyle: 'custom-density', tickDensityProfile: 'sparse' }).ticks).toHaveLength(150);
    const ticks = result.ticks.filter(t => t.ringId === 'outer');
    for (const value of [14.9, 15, 15.2, 24.8, 25, 25.5, 59.5, 60, 61, 99]) expect(ticks.some(t => t.value === value)).toBe(true);
    for (const value of [15.1,25.2,60.5,100]) expect(ticks.some(t => t.value === value)).toBe(false);
  });
});
describe('dial-only decimal hour placement', () => {
  beforeEach(() => {
    useConfiguratorUIStore.setState({ lockedPartIds: new Set() });
    useWatchAssemblyStore.getState().setAssembly(createStarterBuild('pilot').assembly);
    useWatchAssemblyStore.getState().clearAssemblyHistory();
  });
  afterEach(() => vi.restoreAllMocks());
  it('uses a readable peripheral dial annulus and rejects ring targets', () => {
    const layer = customAviationDefaults('decimal-hour');
    expect(layer.targetBandId).toBe('band-dial-face');
    const bands = assemblyToBands(useWatchAssemblyStore.getState().assembly);
    const dial = bands.find(b => b.kind === 'dial-face')!;
    const result = runCustomAviation(layer, dial);
    expect(result.validation.valid, result.validation.warnings.join(' ')).toBe(true);
    expect(result.labels.every(label => label.radiusMm > dial.geometry.outerRadius - 5 && label.radiusMm < dial.geometry.outerRadius - 2.5)).toBe(true);
    expect(result.placementEnvelope.outerRadiusMm).toBeCloseTo(dial.geometry.outerRadius - 2.5);
    const moved = runCustomAviation({ ...layer, dialInsetMm: 1 }, dial);
    expect(moved.ticks[0]!.radiusMm - result.ticks[0]!.radiusMm).toBeCloseTo(1.5);
    expect(moved.ticks.map(t => t.angleDeg)).toEqual(result.ticks.map(t => t.angleDeg));
    expect(runCustomAviation(layer, bands.find(b => b.kind === 'chapter-ring')).validation.valid).toBe(false);
    expect(() => assertCustomAviation({ version: 1, layers: [{ ...layer, targetBandId: 'band-outer-bezel' }] })).toThrow('dial face');
    useWatchAssemblyStore.getState().updateCustomAviationLayer('decimal-hour', { enabled: true, targetBandId: 'band-chapter-ring' });
    expect(useWatchAssemblyStore.getState().assembly.designConfig?.customAviationLayers).toBeUndefined();
  });
  it('migrates legacy ring placement on load while retaining authored settings', () => {
    const assembly = createStarterBuild('pilot').assembly;
    assembly.designConfig!.customAviationLayers = { version: 1, layers: [{ ...customAviationDefaults('decimal-hour'), targetBandId: 'band-chapter-ring', enabled: true, rotationDeg: 23, color: '#123456' }] };
    const saved = deserializeWatchAssembly(JSON.stringify(assembly));
    expect(saved.designConfig!.customAviationLayers!.layers[0]).toMatchObject({ targetBandId: 'band-dial-face', rotationDeg: 23, color: '#123456', enabled: true });
    useWatchAssemblyStore.getState().setAssembly(assembly);
    expect(useWatchAssemblyStore.getState().assembly.designConfig!.customAviationLayers!.layers[0]!.targetBandId).toBe('band-dial-face');
    expect(deserializeWatchAssembly(serializeWatchAssembly(assembly)).designConfig!.customAviationLayers!.layers[0]!.targetBandId).toBe('band-dial-face');
  });
  it('honours the dial tray lock and exposes only Dial Face in its target selector', () => {
    useConfiguratorUIStore.getState().togglePartLock('inst-dial-blank');
    useWatchAssemblyStore.getState().updateCustomAviationLayer('decimal-hour', { enabled: true });
    expect(useWatchAssemblyStore.getState().assembly.designConfig?.customAviationLayers).toBeUndefined();
    vi.spyOn(React, 'useSyncExternalStore').mockImplementation((_subscribe, getSnapshot) => getSnapshot());
    const html = renderToStaticMarkup(createElement(CustomAviationPanel));
    const decimal = html.split('aria-label="Decimal hour (0.00–1.00 h) target"')[1]!.split('</select>')[0]!;
    expect(decimal).toContain('band-dial-face');
    expect(decimal).not.toContain('band-chapter-ring');
    expect(decimal).not.toContain('band-outer-bezel');
  });
});
