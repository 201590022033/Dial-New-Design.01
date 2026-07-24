import { describe, expect, it } from 'vitest';
import { generateTicks } from '@/domain/scales/tickGenerator';
import { generateLabels } from '@/domain/scales/labelGenerator';
import { linearToAngle } from '@/domain/scales/math';
import type { ScalePluginConfig } from '@/domain/scales/types';

const config: ScalePluginConfig = {
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

describe('scale generation', () => {
  it('generates major and minor ticks', () => {
    const ticks = generateTicks(config, { startAngleDeg: -120, endAngleDeg: 120 }, linearToAngle);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.some((tick) => tick.weight === 'major')).toBe(true);
    expect(ticks.some((tick) => tick.weight === 'minor')).toBe(true);
  });

  it('generates labels for major ticks', () => {
    const ticks = generateTicks(config, { startAngleDeg: -120, endAngleDeg: 120 }, linearToAngle);
    const labels = generateLabels(ticks, config);
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]?.text).toBeDefined();
  });
});
