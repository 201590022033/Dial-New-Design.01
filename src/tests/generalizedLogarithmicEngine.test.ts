import { describe, expect, it } from 'vitest';
import { CircularLogarithmicMathematics } from '@/domain/scales/framework';
import type { ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';
import { runScalePlugin } from '@/services/scaleEngineService';

const context: ScaleMathContext = {
  startAngleDeg: -140,
  endAngleDeg: 140
};

const createConfig = (patch: Partial<ScalePluginConfig> = {}): ScalePluginConfig => ({
  startValue: 1,
  endValue: 10,
  majorStep: 1,
  minorStep: 0.1,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 2.3,
  minorTickLengthMm: 0.9,
  majorTickWidthMm: 0.2,
  minorTickWidthMm: 0.12,
  tickDirection: 'outside',
  tickStyle: 'line',
  labelFrequency: 1,
  labelOrientation: 'radial',
  labelPlacement: 'outside',
  labelRotationOffsetDeg: 0,
  rotationOffsetDeg: 0,
  color: '#F8FAFC',
  fontFamily: '"IBM Plex Mono", monospace',
  previewEnabled: true,
  bandInnerRadiusMm: 14,
  bandOuterRadiusMm: 20,
  minimumLineWidthMm: 0.1,
  logarithmicBase: 10,
  logarithmicDecades: 1,
  logarithmicDisplayMultiplier: 1,
  logarithmicDisplayFormat: 'engineering',
  logarithmicLabelStyle: 'value',
  logMajorTickDensity: 1,
  logMinorTickDensity: 1,
  logMicroTickDensity: 4,
  logarithmicRingType: 'C',
  tickDensityProfile: 'balanced',
  includeMinorLabels: false,
  engineeringPreset: 'precision',
  ...patch
});

describe('generalized logarithmic engine', () => {
  it('supports single decade generation', () => {
    const result = runScalePlugin('logarithmic', createConfig(), context);

    expect(result).not.toBeNull();
    const primaryValues = (result?.ticks ?? [])
      .filter((tick) => tick.tier === 'primary')
      .map((tick) => tick.value ?? 0);

    expect(primaryValues.some((value) => Math.abs(value - 1) < 1e-6)).toBe(true);
    expect(primaryValues.some((value) => Math.abs(value - 10) < 1e-6)).toBe(true);
  });

  it('supports two and three decade generation', () => {
    const twoDecades = runScalePlugin(
      'logarithmic',
      createConfig({
        startValue: 1,
        endValue: 100,
        logarithmicDecades: 2
      }),
      context
    );

    const threeDecades = runScalePlugin(
      'logarithmic',
      createConfig({
        startValue: 1,
        endValue: 1000,
        logarithmicDecades: 3
      }),
      context
    );

    expect(twoDecades).not.toBeNull();
    expect(threeDecades).not.toBeNull();

    const twoPrimary = (twoDecades?.ticks ?? []).filter((tick) => tick.tier === 'primary');
    const threePrimary = (threeDecades?.ticks ?? []).filter((tick) => tick.tier === 'primary');

    expect(twoPrimary.some((tick) => (tick.value ?? 0) >= 100)).toBe(true);
    expect(threePrimary.some((tick) => (tick.value ?? 0) >= 1000)).toBe(true);
    expect((threeDecades?.ticks.length ?? 0)).toBeGreaterThan(twoDecades?.ticks.length ?? 0);
  });

  it('supports arbitrary domains and arbitrary bases', () => {
    const result = runScalePlugin(
      'logarithmic',
      createConfig({
        startValue: 0.01,
        endValue: 100,
        logarithmicBase: 2,
        logarithmicDecades: 20
      }),
      context
    );

    expect(result).not.toBeNull();
    expect((result?.ticks.length ?? 0)).toBeGreaterThan(0);
    expect(result?.validation.valid).toBe(true);
  });

  it('supports clockwise and counter-clockwise monotonic progression', () => {
    const math = new CircularLogarithmicMathematics();
    const clockwiseConfig = createConfig();
    const ccwConfig = createConfig({ direction: 'counter-clockwise' });

    const cw2 = math.valueToAngle(2, clockwiseConfig, context);
    const cw5 = math.valueToAngle(5, clockwiseConfig, context);
    expect(cw5).toBeGreaterThan(cw2);

    const ccw2 = math.valueToAngle(2, ccwConfig, context);
    const ccw5 = math.valueToAngle(5, ccwConfig, context);
    expect(ccw5).toBeLessThan(ccw2);
  });

  it('applies display multipliers and formatter styles without changing geometry count', () => {
    const engineering = runScalePlugin(
      'logarithmic',
      createConfig({
        logarithmicDisplayFormat: 'engineering',
        logarithmicDisplayMultiplier: 1,
        includeMinorLabels: true
      }),
      context
    );

    const scientific = runScalePlugin(
      'logarithmic',
      createConfig({
        logarithmicDisplayFormat: 'scientific',
        logarithmicDisplayMultiplier: 100,
        includeMinorLabels: true
      }),
      context
    );

    expect(engineering).not.toBeNull();
    expect(scientific).not.toBeNull();
    expect(engineering?.ticks.length).toBe(scientific?.ticks.length);

    const scientificLabel = scientific?.labels.find((label) => label.text.includes('e'));
    expect(scientificLabel).toBeDefined();
  });

  it('keeps tick ordering and numerical precision stable', () => {
    const result = runScalePlugin(
      'logarithmic',
      createConfig({
        startValue: 0.1,
        endValue: 1000,
        logarithmicDecades: 4,
        tickDensityProfile: 'dense'
      }),
      context
    );

    expect(result).not.toBeNull();
    const ticks = result?.ticks ?? [];

    for (let index = 1; index < ticks.length; index += 1) {
      expect(ticks[index]?.angleDeg ?? 0).toBeGreaterThanOrEqual(ticks[index - 1]?.angleDeg ?? 0);
    }

    ticks.forEach((tick) => {
      expect(Number.isFinite(tick.angleDeg)).toBe(true);
      expect(Number.isFinite(tick.radiusMm)).toBe(true);
      expect((tick.value ?? 0) > 0).toBe(true);
    });
  });

  it('remains renderer and manufacturing compatible', () => {
    const result = runScalePlugin('logarithmic', createConfig(), context);

    expect(result).not.toBeNull();
    expect(result?.svg.length ?? 0).toBeGreaterThan(0);
    expect(result?.geometry.ticks.length).toBe(result?.ticks.length);
    expect(result?.geometry.labels.length).toBe(result?.labels.length);

    const manufacturing = result?.manufacturingMetadata;
    expect(manufacturing).toBeDefined();
    expect(manufacturing?.minimumPrintableSpacingDeg ?? 0).toBeGreaterThan(0);
    expect(typeof manufacturing?.suitability.laser).toBe('boolean');
    expect(typeof manufacturing?.suitability.cnc).toBe('boolean');
    expect(typeof manufacturing?.suitability.uv).toBe('boolean');
  });
});
