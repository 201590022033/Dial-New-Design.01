import { describe, expect, it } from 'vitest';
import {
  applyEngineeringProfile,
  buildProfileDefaults,
  getEngineeringProfileDefinition,
  getEngineeringProfileLibrary,
  getProjection,
  listEngineeringProfiles,
  resolveProjectionKindFromConfig
} from '@/domain/scales/framework';
import type { EngineeringProfileKind, ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';
import { runScalePlugin } from '@/services/scaleEngineService';

const context: ScaleMathContext = {
  startAngleDeg: -140,
  endAngleDeg: 140
};

const createConfig = (patch: Partial<ScalePluginConfig> = {}): ScalePluginConfig => ({
  startValue: 1.1,
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
  minimumLineWidthMm: 0.2,
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

describe('engineering profile library', () => {
  it('contains all requested profile families', () => {
    const profiles = new Set(listEngineeringProfiles());

    const required: EngineeringProfileKind[] = [
      'C',
      'D',
      'CI',
      'A',
      'B',
      'K',
      'L',
      'LL0',
      'LL1',
      'LL2',
      'LL3',
      'fuel-consumption',
      'distance-planning',
      'ground-speed',
      'true-air-speed',
      'time',
      'climb',
      'descent',
      'rate-of-climb',
      'wind-correction',
      'conversion',
      'unit-conversion',
      'fuel-burn',
      'holding-pattern',
      'glide-ratio',
      'cross-country-planning',
      'metric-conversion',
      'imperial-conversion',
      'length',
      'mass',
      'pressure',
      'temperature',
      'velocity',
      'power',
      'torque',
      'mechanical-advantage',
      'ratio',
      'proportion',
      'scientific',
      'engineering',
      'navigation',
      'physics',
      'chemistry',
      'mathematics'
    ];

    required.forEach((profile) => expect(profiles.has(profile)).toBe(true));
  });

  it('declares manufacturing recommendations for every profile', () => {
    getEngineeringProfileLibrary().forEach((profile) => {
      expect(profile.manufacturingRecommendation.minimumRingWidthMm).toBeGreaterThan(0);
      expect(profile.manufacturingRecommendation.minimumPrintableFontMm).toBeGreaterThan(0);
      expect(profile.manufacturingRecommendation.recommendedEngravingDepthMm).toBeGreaterThan(0);
      expect(profile.manufacturingRecommendation.recommendedLaserDensity).toBeGreaterThan(0);
      expect(profile.manufacturingRecommendation.recommendedUvSpacingMm).toBeGreaterThan(0);
      expect(profile.manufacturingRecommendation.recommendedCncSpacingMm).toBeGreaterThan(0);
      expect(profile.manufacturingRecommendation.recommendedPadPrintSpacingMm).toBeGreaterThan(0);
    });
  });

  it('profile changes can apply defaults while preserving projection mathematics', () => {
    const initial = createConfig({
      projectionKind: 'reciprocal-logarithmic',
      engineeringProfileKind: 'C'
    });

    const updated = {
      ...initial,
      ...buildProfileDefaults('A', initial, {
        overrideExisting: true,
        preserveProjection: true
      })
    };

    expect(updated.projectionKind).toBe('reciprocal-logarithmic');
    expect(updated.engineeringProfileKind).toBe('A');
    expect(updated.logarithmicDecades).toBe(2);
  });

  it('all profiles resolve to existing projections without new engines', () => {
    listEngineeringProfiles().forEach((profileKind) => {
      const profiledConfig = applyEngineeringProfile(
        createConfig({
          engineeringProfileKind: profileKind
        })
      );
      const projectionKind = resolveProjectionKindFromConfig(profiledConfig);
      const projection = getProjection(projectionKind);
      expect(projection).toBeDefined();
      expect(projection.validateDomain(profiledConfig).length).toBe(0);
    });
  });

  it('profile composition remains plugin compatible', () => {
    const sampledProfiles: EngineeringProfileKind[] = [
      'C',
      'CI',
      'LL1',
      'fuel-consumption',
      'pressure',
      'scientific'
    ];

    sampledProfiles.forEach((profileKind) => {
      const base = createConfig({
        engineeringProfileKind: profileKind
      });
      const config = {
        ...base,
        ...buildProfileDefaults(profileKind, base, {
          overrideExisting: true,
          preserveProjection: false
        })
      };

      const result = runScalePlugin('logarithmic', config, context);
      expect(result).not.toBeNull();
      expect((result?.ticks.length ?? 0)).toBeGreaterThan(0);
    });
  });

  it('profile definitions are discoverable for preset manager documentation', () => {
    const profile = getEngineeringProfileDefinition('ground-speed');
    expect(profile).not.toBeNull();
    expect(profile?.projection).toBe('logarithmic');
    expect(profile?.formatter).toBe('slide-rule');
    expect(profile?.typicalApplications.length ?? 0).toBeGreaterThan(0);
  });
});
