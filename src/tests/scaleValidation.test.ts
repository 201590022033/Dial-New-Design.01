import { describe, expect, it } from 'vitest';
import { validateScale } from '@/domain/scales/validation';
import type { ScalePluginConfig } from '@/domain/scales/types';

const baseConfig: ScalePluginConfig = {
  startValue: 0,
  endValue: 60,
  majorStep: 10,
  minorStep: 5,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 1.8,
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
  minimumLineWidthMm: 0.1
};

describe('scale validation', () => {
  it('flags invalid value ranges and line width limits', () => {
    const result = validateScale(
      {
        ...baseConfig,
        startValue: 10,
        endValue: 5,
        majorTickWidthMm: 0.05,
        minorTickWidthMm: 0.05
      },
      [],
      []
    );

    expect(result.valid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.structuredWarnings.length).toBeGreaterThan(0);
  });
});
