import { describe, expect, it } from 'vitest';
import { getProjection, resolveProjectionKindFromConfig } from '@/domain/scales/framework/projectionEngine';
import { applyEngineeringProfile } from '@/domain/scales/framework/projectionProfileEngine';
import type { ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';
import type { EngineeringProfileKind } from '@/domain/scales/types';
import { runScalePlugin } from '@/services/scaleEngineService';

const context: ScaleMathContext = {
  startAngleDeg: -135,
  endAngleDeg: 135
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
  tickDensityProfile: 'balanced',
  includeMinorLabels: false,
  engineeringPreset: 'precision',
  projectionKind: 'logarithmic',
  engineeringProfileKind: 'C',
  formatterKind: 'engineering',
  ...patch
});

describe('mathematical projection engine', () => {
  it('supports identity and linear projection normalization', () => {
    const identity = getProjection('identity');
    const linear = getProjection('linear');
    const config = createConfig({ startValue: 0, endValue: 100, projectionKind: 'identity' });

    expect(identity.normalize(50, config)).toBeCloseTo(0.5, 6);
    expect(linear.normalize(75, config)).toBeCloseTo(0.75, 6);
  });

  it('supports logarithmic and reciprocal logarithmic projections', () => {
    const log = getProjection('logarithmic');
    const reciprocal = getProjection('reciprocal-logarithmic');
    const config = createConfig({ startValue: 1, endValue: 10 });

    expect(log.normalize(1, config)).toBeCloseTo(0, 6);
    expect(log.normalize(10, config)).toBeCloseTo(1, 6);

    const normalized2 = reciprocal.normalize(2, config);
    const normalized8 = reciprocal.normalize(8, config);
    expect(normalized2).toBeLessThan(normalized8);
  });

  it('supports square and cube family projections', () => {
    const square = getProjection('square');
    const cube = getProjection('cube');
    const squareRoot = getProjection('square-root');

    const config = createConfig({ startValue: 1, endValue: 9 });
    expect(square.denormalize(0.5, config)).toBeGreaterThan(4);
    expect(cube.denormalize(0.5, createConfig({ startValue: 1, endValue: 27 }))).toBeGreaterThan(10);
    expect(squareRoot.normalize(4, createConfig({ startValue: 1, endValue: 16 }))).toBeCloseTo(0.333333, 3);
  });

  it('supports log-log projection for LL style domains', () => {
    const logLog = getProjection('log-log');
    const config = createConfig({ startValue: 1.1, endValue: 1000, projectionKind: 'log-log' });

    expect(logLog.validateDomain(config).length).toBe(0);
    expect(logLog.normalize(10, config)).toBeGreaterThan(0);
    expect(logLog.denormalize(0.8, config)).toBeGreaterThan(10);
  });

  it('supports inverse projection from angle', () => {
    const projection = getProjection('logarithmic');
    const config = createConfig({ startValue: 1, endValue: 100 });
    const angle = projection.valueToAngle(10, config, context);
    const restored = projection.inverseFromAngle(angle, config, context);

    expect(restored).toBeCloseTo(10, 4);
  });

  it('validates domain and numerical precision boundaries', () => {
    const reciprocal = getProjection('reciprocal-logarithmic');
    const invalid = createConfig({ startValue: -1, endValue: 10, projectionKind: 'reciprocal-logarithmic' });
    expect(reciprocal.validateDomain(invalid).length).toBeGreaterThan(0);

    const custom = getProjection('custom');
    const unstable = createConfig({ customProjectionExponent: 0, customProjectionScale: 0 });
    const metadata = custom.generateMetadata(unstable);
    expect(metadata).not.toBeNull();
  });

  it('preserves renderer and manufacturing compatibility', () => {
    const result = runScalePlugin('logarithmic', createConfig(), context);

    expect(result).not.toBeNull();
    expect((result?.svg.length ?? 0) > 0).toBe(true);
    expect((result?.manufacturingMetadata?.minimumPrintableSpacingDeg ?? 0) > 0).toBe(true);
  });

  it('keeps existing preset compatibility for classical profiles', () => {
    const profiles: EngineeringProfileKind[] = ['C', 'CI', 'A', 'K', 'L', 'LL3'];
    profiles.forEach((profile) => {
      const config = applyEngineeringProfile(createConfig({ engineeringProfileKind: profile }));
      const kind = resolveProjectionKindFromConfig(config);
      const projection = getProjection(kind);
      expect(projection.validateDomain(config).length).toBe(0);
      expect(projection.normalize((config.startValue + config.endValue) / 2, config)).not.toBeNaN();
    });
  });
});
