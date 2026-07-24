import { describe, expect, it } from 'vitest';
import { runScalePlugin } from '@/services/scaleEngineService';

describe('scale engine', () => {
  it('runs a built-in tachymeter plugin', () => {
    const result = runScalePlugin(
      'tachymeter',
      {
        startValue: 60,
        endValue: 500,
        majorStep: 20,
        minorStep: 10,
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
        bandInnerRadiusMm: 16,
        bandOuterRadiusMm: 20,
        minimumLineWidthMm: 0.1
      },
      { startAngleDeg: -120, endAngleDeg: 120 }
    );

    expect(result).not.toBeNull();
    expect(result?.ticks.length).toBeGreaterThan(0);
    expect(result?.geometry.ticks.length).toBe(result?.ticks.length);
  });
});
