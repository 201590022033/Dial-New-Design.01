import { describe, expect, it } from 'vitest';
import {
  evaluateManufacturingOptimization,
  mergeValidationWithLayoutDiagnostics,
  optimizeLayoutForReadability,
  resolveAdaptiveDensity
} from '@/domain/scales/framework';
import type { ScaleLabel, ScalePluginConfig, ScaleTick } from '@/domain/scales/types';

const config: ScalePluginConfig = {
  startValue: 0,
  endValue: 100,
  majorStep: 10,
  minorStep: 2,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 2,
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
  bandOuterRadiusMm: 21,
  minimumLineWidthMm: 0.1,
  tickDensityProfile: 'balanced'
};

const ticks: ScaleTick[] = [
  { angleDeg: 0, radiusMm: 18, lengthMm: 2, widthMm: 0.2, weight: 'major', direction: 'outside', style: 'line', label: '0', value: 0, tier: 'primary' },
  { angleDeg: 0.1, radiusMm: 18, lengthMm: 1, widthMm: 0.12, weight: 'minor', direction: 'outside', style: 'line', value: 1, tier: 'micro' },
  { angleDeg: 1.2, radiusMm: 18, lengthMm: 1, widthMm: 0.12, weight: 'minor', direction: 'outside', style: 'line', value: 2, tier: 'micro' }
];

const labels: ScaleLabel[] = [
  { text: 'LONG-LABEL-ONE', angleDeg: 0, radiusMm: 18, orientation: 'radial', rotationDeg: 0, placement: 'outside' },
  { text: 'LONG-LABEL-TWO', angleDeg: 0.06, radiusMm: 18.05, orientation: 'radial', rotationDeg: 0, placement: 'outside' },
  { text: 'LONG-LABEL-THREE', angleDeg: 0.12, radiusMm: 18.1, orientation: 'curved', rotationDeg: 0, placement: 'outside' }
];

describe('intelligent layout engine', () => {
  it('resolves adaptive density profile from available arc space', () => {
    const sparse = resolveAdaptiveDensity(config, 120, 7);
    const engineering = resolveAdaptiveDensity({ ...config, tickDensityProfile: 'engineering' }, 260, 19);

    expect(sparse.profile).toBe('sparse');
    expect(engineering.profile).toBe('engineering');
  });

  it('optimizes labels and ticks for readability without changing scale values', () => {
    const collisions = [
      { kind: 'label-label' as const, severity: 'warning' as const, message: 'Overlap', ids: ['LONG-LABEL-ONE', 'LONG-LABEL-TWO'] },
      { kind: 'text-overflow' as const, severity: 'warning' as const, message: 'Overflow', ids: ['LONG-LABEL-THREE'] }
    ];

    const optimized = optimizeLayoutForReadability(ticks, labels, collisions, { enabled: true });

    expect(optimized.labels.length).toBeLessThanOrEqual(labels.length);
    expect(optimized.ticks.length).toBeLessThanOrEqual(ticks.length);
    expect(optimized.optimizations.length).toBeGreaterThan(0);
  });

  it('supports label priority weighting during adaptive omission', () => {
    const collisions = [
      { kind: 'label-label' as const, severity: 'warning' as const, message: 'Overlap', ids: ['10', '11'] }
    ];

    const testLabels: ScaleLabel[] = [
      { text: '10', angleDeg: 0, radiusMm: 18, orientation: 'radial', rotationDeg: 0, placement: 'outside' },
      { text: '11', angleDeg: 0.04, radiusMm: 18, orientation: 'radial', rotationDeg: 0, placement: 'outside' },
      { text: '12', angleDeg: 0.08, radiusMm: 18, orientation: 'radial', rotationDeg: 0, placement: 'outside' }
    ];

    const optimized = optimizeLayoutForReadability(ticks, testLabels, collisions, {
      enabled: true,
      labelPriorityMode: 'major-critical'
    });

    expect(optimized.labels.length).toBeGreaterThan(0);
    expect(optimized.optimizations.length).toBeGreaterThan(0);
  });

  it('applies typography compaction for long labels when enabled', () => {
    const collisions = [{ kind: 'text-overflow' as const, severity: 'warning' as const, message: 'Overflow', ids: ['LONG-LABEL-ONE'] }];
    const optimized = optimizeLayoutForReadability(ticks, labels, collisions, {
      enabled: true,
      allowTypographyScaling: true
    });

    expect(optimized.labels.some((label) => label.text.length < 14)).toBe(true);
  });

  it('produces manufacturing diagnostics with process-specific spacing outputs', () => {
    const diagnostics = evaluateManufacturingOptimization(ticks, labels);

    expect(diagnostics.minimumPrintableSpacingDeg).toBeGreaterThan(0);
    expect(diagnostics.minimumEngravingSpacingDeg).toBeGreaterThan(0);
    expect(diagnostics.minimumLaserSpacingDeg).toBeGreaterThan(0);
    expect(diagnostics.minimumPadPrintSpacingDeg).toBeGreaterThan(0);
  });

  it('merges layout and manufacturing diagnostics into validation output', () => {
    const baseValidation = {
      valid: true,
      warnings: [],
      issues: [],
      healthReport: {
        mathematicalHealth: 95,
        readabilityScore: 88,
        collisionScore: 90,
        manufacturingScore: 85,
        validationScore: 94,
        overallEngineeringScore: 90.4
      }
    };

    const merged = mergeValidationWithLayoutDiagnostics(
      baseValidation,
      evaluateManufacturingOptimization(ticks, labels),
      [{ kind: 'cross-ring', severity: 'warning', message: 'Interference', ids: ['a', 'b'] }]
    );

    expect(merged.issues.length).toBeGreaterThan(0);
    expect(merged.valid).toBe(true);
  });
});
