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
        labelEvery: 1
      },
      { startAngleDeg: -120, endAngleDeg: 120 }
    );

    expect(result).not.toBeNull();
    expect(result?.ticks.length).toBeGreaterThan(0);
  });
});
