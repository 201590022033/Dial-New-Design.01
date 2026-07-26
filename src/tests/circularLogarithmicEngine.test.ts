import { describe, expect, it } from 'vitest';
import {
  CircularLogarithmicMathematics,
  createLogarithmicTickEngine,
  projectNormalizedAcrossRings,
  projectNormalizedToRadius
} from '@/domain/scales/framework';
import type { ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';
import { runScalePlugin } from '@/services/scaleEngineService';

const context: ScaleMathContext = {
  startAngleDeg: 0,
  endAngleDeg: 360
};

const config: ScalePluginConfig = {
  startValue: 1,
  endValue: 10,
  majorStep: 1,
  minorStep: 0.1,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 2.2,
  minorTickLengthMm: 1,
  majorTickWidthMm: 0.2,
  minorTickWidthMm: 0.12,
  tickDirection: 'outside',
  tickStyle: 'line',
  labelFrequency: 1,
  labelOrientation: 'radial',
  labelPlacement: 'outside',
  labelRotationOffsetDeg: 0,
  rotationOffsetDeg: 0,
  color: '#FFFFFF',
  fontFamily: '"IBM Plex Mono", monospace',
  previewEnabled: true,
  bandInnerRadiusMm: 14,
  bandOuterRadiusMm: 20,
  minimumLineWidthMm: 0.1,
  logarithmicBase: 10,
  tickDensityProfile: 'balanced',
  includeMinorLabels: false,
  engineeringPreset: 'precision'
};

describe('circular logarithmic engine', () => {
  it('maps known logarithmic values to expected normalized positions', () => {
    const mathematics = new CircularLogarithmicMathematics();

    expect(mathematics.normalizeValue(1, config)).toBeCloseTo(0, 8);
    expect(mathematics.normalizeValue(Math.sqrt(10), config)).toBeCloseTo(0.5, 8);
    expect(mathematics.normalizeValue(10, config)).toBeCloseTo(1, 8);
  });

  it('projects known logarithmic values to angular coordinates', () => {
    const mathematics = new CircularLogarithmicMathematics();

    expect(mathematics.valueToAngle(1, config, context)).toBeCloseTo(0, 8);
    expect(mathematics.valueToAngle(2, config, context)).toBeCloseTo(Math.log10(2) * 360, 8);
    expect(mathematics.valueToAngle(10, config, context)).toBeCloseTo(360, 8);
  });

  it('supports clockwise and counter-clockwise monotonic angle generation', () => {
    const mathematics = new CircularLogarithmicMathematics();
    const ccwConfig: ScalePluginConfig = {
      ...config,
      direction: 'counter-clockwise'
    };

    const angleAtTwo = mathematics.valueToAngle(2, ccwConfig, context);
    const angleAtFive = mathematics.valueToAngle(5, ccwConfig, context);

    expect(angleAtTwo).toBeLessThan(0);
    expect(angleAtFive).toBeLessThan(angleAtTwo);
  });

  it('projects normalized positions to ring coordinates for multi-ring layouts', () => {
    const projected = projectNormalizedAcrossRings(
      0.25,
      {
        startAngleDeg: 10,
        endAngleDeg: 310,
        direction: 'clockwise',
        rotationOffsetDeg: 5
      },
      {
        innerRadiusMm: 14,
        outerRadiusMm: 20,
        tickRadiusMm: 18,
        labelRadiusMm: 21,
        textRadiusMm: 22
      }
    );

    expect(projected.innerRadiusMm).toBeDefined();
    expect(projected.outerRadiusMm).toBeDefined();
    expect(projected.tickRadiusMm?.angleDeg).toBeCloseTo(90, 6);
    expect(projected.labelRadiusMm?.x).toBeTypeOf('number');
  });

  it('creates primary/secondary/tertiary tiers for balanced profile and micro tiers for dense profile', () => {
    const mathematics = new CircularLogarithmicMathematics();
    const engine = createLogarithmicTickEngine();

    const balanced = engine.generate({
      config,
      context,
      toAngle: mathematics.valueToAngle.bind(mathematics)
    });

    expect(balanced.majorTicks.length).toBe(10);
    expect(balanced.ticks.some((tick) => tick.tier === 'secondary')).toBe(true);
    expect(balanced.ticks.some((tick) => tick.tier === 'tertiary')).toBe(true);
    expect(balanced.ticks.some((tick) => tick.tier === 'micro')).toBe(false);

    const dense = engine.generate({
      config: {
        ...config,
        tickDensityProfile: 'dense'
      },
      context,
      toAngle: mathematics.valueToAngle.bind(mathematics)
    });

    expect(dense.ticks.some((tick) => tick.tier === 'micro')).toBe(true);
  });

  it('validates plugin run and exposes manufacturing metadata', () => {
    const result = runScalePlugin('logarithmic', config, context);

    expect(result).not.toBeNull();
    expect(result?.validation.valid).toBe(true);
    expect(result?.ticks.length).toBeGreaterThan(0);
    expect(result?.labels.length).toBeGreaterThan(0);
    expect(result?.manufacturingMetadata).toBeDefined();
    expect(result?.manufacturingMetadata?.minimumPrintableSpacingDeg).toBeGreaterThan(0);
  });

  it('detects invalid logarithmic domain input', () => {
    const result = runScalePlugin(
      'logarithmic',
      {
        ...config,
        startValue: 0,
        endValue: 10
      },
      context
    );

    expect(result).not.toBeNull();
    expect(result?.validation.valid).toBe(false);
    expect(result?.validation.warnings.some((warning) => warning.toLowerCase().includes('logarithmic'))).toBe(true);
  });

  it('projects normalized points with precision', () => {
    const projection = projectNormalizedToRadius(
      Math.log10(2),
      18,
      {
        startAngleDeg: 0,
        endAngleDeg: 360,
        direction: 'clockwise',
        rotationOffsetDeg: 0
      }
    );

    expect(projection.angleDeg).toBeCloseTo(Math.log10(2) * 360, 8);
    expect(Number.isFinite(projection.coordinate.x)).toBe(true);
    expect(Number.isFinite(projection.coordinate.y)).toBe(true);
  });
});
