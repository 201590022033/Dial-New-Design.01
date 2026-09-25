import { describe, expect, it } from 'vitest';
import { aviationAngle, aviationBezelAlignment, aviationCalculations, calculateAviation, createAviationRingSvg, generateAviationRings } from '@/domain/scales/aviationSlideRule';
import { runScalePlugin } from '@/services/scaleEngineService';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { generateEngineeringSvg } from '@/services/exportGeometryService';
import { getScaleProgram } from '@/domain/scales/scalePrograms';

const config = {
  ...getScalePlugin('slide-rule')!.defaultConfig,
  engineeringPreset: 'aviation-slide-rule' as const,
  tickDensityProfile: 'sparse' as const,
  outerRadiusMm: 18.7,
  innerRadiusMm: 16.3,
  outerRotationOffsetDeg: 0,
  innerRotationOffsetDeg: 0
};

const circularError = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('aviation slide rule', () => {
  it('keeps diver, chronograph, and aviation as distinct engine programs', () => {
    const diver = getScaleProgram('diver', []);
    const chrono = getScaleProgram('chrono', []);
    const aviation = getScaleProgram('aviation', []);
    expect(diver.kind).toBe('circular');
    expect(diver.context.endAngleDeg).toBe(360);
    expect(chrono.kind).toBe('tachymeter');
    expect(chrono.config.startValue).toBe(60);
    expect(chrono.config.endValue).toBe(500);
    expect(chrono.context.endAngleDeg - chrono.context.startAngleDeg).toBe(280);
    expect(aviation.kind).toBe('slide-rule');
    expect(aviation.config.engineeringPreset).toBe('aviation-slide-rule');
    const compass = getScaleProgram('compass', []);
    expect(compass.kind).toBe('compass');
    const compassResult = runScalePlugin(compass.kind, { ...getScalePlugin(compass.kind)!.defaultConfig, ...compass.config }, compass.context);
    expect(compassResult?.labels.map((label) => label.text)).toEqual(expect.arrayContaining(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']));
    expect(compassResult?.labels.filter((label) => label.text === 'N')).toHaveLength(1);
    const minuteRing = runScalePlugin(diver.kind, { ...getScalePlugin(diver.kind)!.defaultConfig, ...diver.config }, diver.context);
    expect(minuteRing?.ticks).toHaveLength(60);
  });
  it('uses five independent flight-planning relationships and matching bezel alignments', () => {
    for (const [mode, meta] of Object.entries(aviationCalculations)) {
      const typedMode = mode as keyof typeof aviationCalculations;
      const [first, second] = meta.defaults;
      const answer = calculateAviation(typedMode, first, second);
      expect(Number.isFinite(answer)).toBe(true);
      const rate = typedMode === 'time' || typedMode === 'endurance' ? second : typedMode === 'groundspeed' ? answer : first;
      const quantity = typedMode === 'time' || typedMode === 'groundspeed' || typedMode === 'endurance' ? first : answer;
      const minutes = typedMode === 'distance' || typedMode === 'fuel-used' || typedMode === 'groundspeed' ? second : answer;
      const rotation = aviationBezelAlignment(typedMode, first, second);
      expect(circularError(aviationAngle(rate) + rotation, aviationAngle(60))).toBeLessThan(0.001);
      expect(circularError(aviationAngle(quantity) + rotation, aviationAngle(minutes))).toBeLessThan(0.001);
    }
    expect(calculateAviation('time', 80, 120)).toBe(40);
    expect(calculateAviation('fuel-used', 9, 40)).toBe(6);
    expect(Number.isNaN(calculateAviation('time', 80, 0))).toBe(true);
  });

  it('provides complete, non-overlapping physical bezel/chapter markings through the scale plugin', () => {
    const result = runScalePlugin('slide-rule', config, { startAngleDeg: 0, endAngleDeg: 360 });
    expect(result?.ticks.filter((tick) => tick.ringId === 'outer')).toHaveLength(75);
    expect(result?.ticks.filter((tick) => tick.ringId === 'inner')).toHaveLength(75);
    expect(result?.labels.filter((label) => label.ringId === 'outer')).toHaveLength(12);
    expect(generateAviationRings(config).ticks[0]?.angleDeg).toBe(0);
    expect(aviationAngle(100)).toBe(0);
    expect(generateAviationRings({ ...config, tickDensityProfile: 'balanced' }).ticks.length).toBeGreaterThan(result!.ticks.length);
  });

  it('exports separate 1:1 millimetre marking art at home alignment', () => {
    const bezel = createAviationRingSvg({ ...config, outerRotationOffsetDeg: 45 }, 'outer', 42);
    const chapter = createAviationRingSvg(config, 'inner', 42);
    expect(bezel).toContain('width="42mm"');
    expect(bezel).toContain('data-ring="outer"');
    expect(bezel).not.toContain('inner-markings');
    expect(chapter).toContain('data-ring="inner"');
    expect(chapter).not.toContain('outer-markings');
    expect(bezel).toBe(createAviationRingSvg(config, 'outer', 42));
  });

  it('keeps font size consistent across generated geometry and physical artwork', () => {
    const large = { ...config, scaleFontSizeMm: 1.4 };
    const preview = runScalePlugin('slide-rule', large, { startAngleDeg: 0, endAngleDeg: 360 });
    expect(preview?.fontSizeMm).toBe(1.4);
    expect(createAviationRingSvg(large, 'outer', 42)).toContain('font-size="1.4"');
    expect(preview!.labels.length).toBeLessThanOrEqual(runScalePlugin('slide-rule', config, { startAngleDeg: 0, endAngleDeg: 360 })!.labels.length);
  });

  it('scopes the general export to the requested ring and invalidates rotated artwork', () => {
    const input = {
      target: 'outer-bezel' as const, bands: [], selectedBandId: null,
      context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 },
      designOverlay: null,
      scalePreview: runScalePlugin('slide-rule', config, { startAngleDeg: 0, endAngleDeg: 360 })
    };
    const outer = generateEngineeringSvg(input);
    const inner = generateEngineeringSvg({ ...input, target: 'chapter-ring' });
    const rotated = generateEngineeringSvg({ ...input, scalePreview: runScalePlugin('slide-rule', { ...config, outerRotationOffsetDeg: 45 }, { startAngleDeg: 0, endAngleDeg: 360 }) });
    expect((outer.match(/<line /g) ?? [])).toHaveLength(75);
    expect((inner.match(/<line /g) ?? [])).toHaveLength(75);
    expect((outer.match(/<text /g) ?? [])).toHaveLength(12);
    expect(outer).not.toBe(rotated);
  });
});
