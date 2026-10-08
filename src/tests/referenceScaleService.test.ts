import { describe, expect, it } from 'vitest';
import { runScalePlugin } from '@/services/scaleEngineService';
import { referenceScaleDefaults } from '@/services/referenceScaleArtworkService';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { generatePseudoDxf } from '@/services/exportGeometryService';
import type { ScalePluginConfig } from '@/domain/scales/types';

const fixture = (): ScalePluginConfig => {
  const config = { ...getScalePlugin('slide-rule')!.defaultConfig,
    bandInnerRadiusMm: 18, bandOuterRadiusMm: 22, fixedBandInnerRadiusMm: 14, fixedBandOuterRadiusMm: 17,
    placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring', physicalTargetsResolved: true };
  return { ...config, ...referenceScaleDefaults('citizen', config) };
};
const run = (config = fixture()) => runScalePlugin('slide-rule', config, fullMinuteRingContext)!;
const dxf = (config: ScalePluginConfig) => generatePseudoDxf({ target: 'entire-project', bands: [], selectedBandId: null,
  context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 }, scalePreview: run(config), designOverlay: null });

describe('Citizen shared runtime and export adapter', () => {
  it('uses verified retained geometry and distinct annular surfaces in the canonical engine', () => {
    const result = run();
    expect(result.validation.warnings).toEqual([]);
    expect(result.validation.valid).toBe(true);
    expect(result.ticks).toHaveLength(449);
    expect(result.labels).toHaveLength(54);
    expect(result.pointers).toHaveLength(5);
    expect(result.substrates).toHaveLength(3);
    expect(result.svg).toContain('fill="#DEBE34"');
    expect(result.svg).toContain('fill="none" stroke="#F0F6FC"');
    expect(result.physicalTargetsResolved).toBe(true);
    expect(result.fixedPlacementEnvelope?.outerRadiusMm).toBe(17);
    const output = dxf(fixture());
    expect(output.match(/\nHATCH\n/g)).toHaveLength(3);
    expect(output).not.toMatch(/LBS|GALLON|LITER|SPEED INDEX/);
  });
  it('preserves geometry and independent ink roles through custom/reset and visibility', () => {
    const config = fixture();
    const custom = run({ ...config, referenceColourMode: 'custom', referenceColourOverrides: { 'km-yellow-pointer': '#123456' } });
    expect(custom.pointers?.find((p) => p.id.includes('distance-km'))?.color).toBe('#123456');
    expect(custom.labels.find((l) => l.text === 'KM.')?.color).toBe('#F0F6FC');
    expect(custom.ticks.map((t) => t.angleDeg)).toEqual(run(config).ticks.map((t) => t.angleDeg));
    expect(run({ ...config, referenceDistanceVisible: false }).pointers).toHaveLength(2);
    expect(run({ ...config, outerScaleVisible: false }).substrates).toHaveLength(2);
    expect(run({ ...config, innerScaleVisible: false }).ticks).toHaveLength(224);
    expect(run({ ...config, ...referenceScaleDefaults('citizen', config) }).svg).toBe(run(config).svg);
  });
  it('refuses overflow, full numeral collisions and missing physical partner without omitting marks', () => {
    const config = fixture();
    const crowded = run({ ...config, scaleFontSizeMm: 5, hoverPaddingMm: 1 });
    expect(crowded.validation.valid).toBe(false);
    expect(crowded.ticks).toHaveLength(449);
    expect(crowded.labels).toHaveLength(54);
    expect(crowded.validation.warnings.some((warning) => warning.includes('overlap'))).toBe(true);
    expect(() => dxf({ ...config, scaleFontSizeMm: 5 })).toThrow();
    expect(run({ ...config, fixedPlacementTargetBandId: undefined }).validation.valid).toBe(false);
  });
  it('changes stroke dimensions without moving any logarithmic anchor', () => {
    const config = fixture(), baseline = run(config);
    const styled = run({ ...config, referenceTickFactor: 1.1, referenceLineFactor: 1.2, outerRotationOffsetDeg: 50 });
    expect(styled.ticks[0]!.lengthMm).toBeCloseTo(baseline.ticks[0]!.lengthMm * 1.1);
    expect(styled.ticks[0]!.widthMm).toBeCloseTo(baseline.ticks[0]!.widthMm * 1.2);
    expect(styled.ticks.filter((t) => t.ringId === 'inner').map((t) => t.angleDeg)).toEqual(baseline.ticks.filter((t) => t.ringId === 'inner').map((t) => t.angleDeg));
  });
});

describe('Navitimer shared runtime and export adapter', () => {
  const nav = () => { const config = fixture(); return { ...config, ...referenceScaleDefaults('navitimer', config) }; };
  it('uses its independent schedule, light surfaces and black MPH without Citizen boxes', () => {
    const result = run(nav());
    expect(result.validation.warnings).toEqual([]);
    expect(result.ticks).toHaveLength(416);
    expect(result.labels).toHaveLength(59);
    expect(result.pointers).toHaveLength(9);
    expect(result.substrates).toHaveLength(2);
    expect(result.labels.find((label) => label.text === 'MPH')?.color).toBe('#3C2623');
    expect(result.labels.filter((label) => label.id?.includes('.inner.number.')).map((label) => label.text)).toContain('7');
    expect(result.svg).not.toContain('#DEBE34');
    expect(dxf(nav()).match(/\nHATCH\n/g)).toHaveLength(2);
    expect(dxf(nav())).not.toMatch(/LBS|GALLON|LITER|HH:MM/);
  });
  it('rotates only the outer row and keeps the seconds and distance calibration fixed', () => {
    const baseline = run(nav()), rotated = run({ ...nav(), outerRotationOffsetDeg: 35 });
    expect(rotated.pointers?.filter((p) => p.ringId === 'inner')).toEqual(baseline.pointers?.filter((p) => p.ringId === 'inner'));
    expect(rotated.pointers?.find((p) => p.id.endsWith('.seconds'))?.value).toBe(36);
    expect(rotated.pointers?.find((p) => p.id.endsWith('.distance-km'))?.value).toBe(61);
    expect(rotated.ticks.filter((t) => t.ringId === 'outer')[0]!.angleDeg).toBeCloseTo((baseline.ticks[0]!.angleDeg + 35) % 360);
    expect(run({ ...nav(), referenceDistanceVisible: false }).pointers).toHaveLength(6);
  });
  it('isolates custom ink and refuses overflow without dropping source graduations', () => {
    const config = nav();
    const custom = run({ ...config, referenceColourMode: 'custom', referenceColourOverrides: { 'mph-black-caption': '#123456' } });
    expect(custom.labels.find((label) => label.text === 'MPH')?.color).toBe('#123456');
    expect(custom.pointers?.find((p) => p.id.endsWith('.hour-rate'))?.color).toBe('#2E1A1A');
    const invalid = run({ ...config, scaleFontSizeMm: 5 });
    expect(invalid.validation.valid).toBe(false);
    expect(invalid.ticks).toHaveLength(416);
    expect(invalid.labels).toHaveLength(59);
    expect(() => dxf({ ...config, scaleFontSizeMm: 5 })).toThrow();
  });
});
