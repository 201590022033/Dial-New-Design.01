import { describe, expect, it } from 'vitest';
import {
  buildCoupledSlideRuleState,
  createSlideRuleCursorState,
  evaluateSlideRuleOperation,
  inverseProjectSlideRuleValue,
  projectValueForRing,
  resolveSlideRulePreset,
  rotateCoupledRings,
  screenPointToPolarSample
} from '@/domain/scales/framework';
import { runScalePlugin } from '@/services/scaleEngineService';
import type { ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';

const baseConfig: ScalePluginConfig = {
  startValue: 1,
  endValue: 10,
  majorStep: 1,
  minorStep: 0.1,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 2.1,
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
  color: '#FFFFFF',
  fontFamily: '"IBM Plex Mono", monospace',
  previewEnabled: true,
  bandInnerRadiusMm: 14,
  bandOuterRadiusMm: 21,
  minimumLineWidthMm: 0.1,
  logarithmicBase: 10,
  tickDensityProfile: 'balanced',
  includeMinorLabels: true,
  engineeringPreset: 'circular-calculator',
  outerRadiusMm: 18.8,
  innerRadiusMm: 16.8,
  outerRotationOffsetDeg: 0,
  innerRotationOffsetDeg: 12,
  ringSyncMode: 'independent',
  lockRingMovement: false,
  ringCouplingEnabled: true,
  referenceIndexDeg: 0,
  cursorType: 'transparent',
  calculationMode: 'multiplication',
  validationVisibility: true
};

const context: ScaleMathContext = {
  startAngleDeg: 0,
  endAngleDeg: 360
};

describe('slide-rule engine framework', () => {
  it('builds coupled ring state with relative rotation', () => {
    const state = buildCoupledSlideRuleState(baseConfig, context);

    expect(state.outer.radiusMm).toBeCloseTo(18.8, 6);
    expect(state.inner.radiusMm).toBeCloseTo(16.8, 6);
    expect(state.relativeRotationDeg).toBeCloseTo(12, 6);
  });

  it('supports synchronization modes for ring rotation', () => {
    const locked = rotateCoupledRings(
      {
        ...baseConfig,
        ringSyncMode: 'locked'
      },
      'outer',
      4
    );

    expect(locked.outerRotationOffsetDeg).toBeCloseTo(4, 6);
    expect(locked.innerRotationOffsetDeg).toBeCloseTo(16, 6);

    const outerDrivesInner = rotateCoupledRings(
      {
        ...baseConfig,
        ringSyncMode: 'outer-drives-inner'
      },
      'outer',
      3
    );

    expect(outerDrivesInner.outerRotationOffsetDeg).toBeCloseTo(3, 6);
    expect(outerDrivesInner.innerRotationOffsetDeg).toBeCloseTo(15, 6);
  });

  it('projects and inverse-projects values with high precision', () => {
    const projected = projectValueForRing(2, baseConfig, context, 'outer');

    const inverse = inverseProjectSlideRuleValue(
      {
        radiusMm: baseConfig.outerRadiusMm ?? 18.8,
        angleDeg: projected.angleDeg
      },
      baseConfig,
      context,
      'outer'
    );

    expect(projected.normalized).toBeCloseTo(Math.log10(2), 6);
    expect(inverse.value).toBeCloseTo(2, 6);
    expect(inverse.normalized).toBeCloseTo(projected.normalized, 6);
  });

  it('converts screen coordinates to polar coordinates for inverse projection', () => {
    const sample = screenPointToPolarSample({
      screenX: 320,
      screenY: 120,
      centerX: 220,
      centerY: 120,
      panX: 0,
      panY: 0,
      renderScale: 1
    });

    expect(sample.radiusMm).toBeCloseTo(10, 8);
    expect(sample.angleDeg).toBeCloseTo(90, 8);
  });

  it('evaluates reusable calculation modes', () => {
    const multiply = evaluateSlideRuleOperation(
      {
        ...baseConfig,
        calculationMode: 'multiplication'
      },
      2,
      5
    );

    expect(multiply.value).toBeCloseTo(10, 8);

    const division = evaluateSlideRuleOperation(
      {
        ...baseConfig,
        calculationMode: 'division'
      },
      10,
      2
    );

    expect(division.value).toBeCloseTo(5, 8);

    const proportion = evaluateSlideRuleOperation(
      {
        ...baseConfig,
        calculationMode: 'proportion'
      },
      3,
      4,
      2
    );

    expect(proportion.value).toBeCloseTo(6, 8);
  });

  it('creates cursor framework state', () => {
    const cursor = createSlideRuleCursorState({
      ...baseConfig,
      cursorType: 'rotating',
      referenceIndexDeg: 42
    });

    expect(cursor.type).toBe('rotating');
    expect(cursor.referenceIndexDeg).toBeCloseTo(42, 8);
    expect(cursor.transparent).toBe(false);
  });

  it('applies engineering presets without duplicating mathematics', () => {
    const aviation = resolveSlideRulePreset({
      ...baseConfig,
      engineeringPreset: 'aviation-slide-rule'
    });

    expect(aviation.tickDensityProfile).toBe('dense');
    expect(aviation.ringSyncMode).toBe('outer-drives-inner');
    expect(aviation.cursorType).toBe('rotating');
  });

  it('runs general slide-rule plugin and validates manufacturing diagnostics', () => {
    const result = runScalePlugin('slide-rule', baseConfig, context);

    expect(result).not.toBeNull();
    expect(result?.pluginName).toBe('General Circular Slide Rule');
    expect(result?.ticks.some((tick) => tick.ringId === 'outer')).toBe(true);
    expect(result?.ticks.some((tick) => tick.ringId === 'inner')).toBe(true);
    expect(result?.manufacturingMetadata?.minimumEngravingSpacingDeg).toBeGreaterThan(0);
    expect(result?.validation.structuredWarnings).toBeDefined();
  });
});
