import { describe, expect, it } from 'vitest';
import { generateTicks } from '@/domain/scales/tickGenerator';
import { generateLabels } from '@/domain/scales/labelGenerator';
import { linearToAngle } from '@/domain/scales/math';
import type { ScalePluginConfig } from '@/domain/scales/types';
import { fullMinuteRingContext, migrateLegacyMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { runScalePlugin } from '@/services/scaleEngineService';

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
  it('covers the full minute ring without stacking 60 on top of zero', () => {
    const ticks = generateTicks({ ...config, minorStep: 1, majorStep: 5 }, fullMinuteRingContext, linearToAngle);
    expect(ticks).toHaveLength(60);
    expect(ticks[0]?.angleDeg).toBe(0);
    expect(ticks.at(-1)?.angleDeg).toBe(354);
    expect(ticks.some(tick => tick.label === '60')).toBe(false);
    const preview = runScalePlugin('circular', { ...config, minorStep: 1, majorStep: 5 }, fullMinuteRingContext);
    expect(preview?.ticks).toHaveLength(60);
    expect(preview?.labels.some(label => label.text === '60')).toBe(false);
    expect(preview?.ticks.map(tick => ((tick.angleDeg % 360) + 360) % 360).filter((angle, index, all) => all.indexOf(angle) !== index)).toHaveLength(0);
  });

  it('migrates only the legacy default minute arc and preserves edited arcs', () => {
    const legacy = { startAngleDeg: -140, endAngleDeg: 140 };
    expect(migrateLegacyMinuteRingContext(legacy, 'circular', config)).toEqual(fullMinuteRingContext);
    expect(migrateLegacyMinuteRingContext(legacy, 'countdown', config)).toEqual(fullMinuteRingContext);
    expect(migrateLegacyMinuteRingContext({ startAngleDeg: -120, endAngleDeg: 140 }, 'circular', config)).toEqual({ startAngleDeg: -120, endAngleDeg: 140 });
    expect(migrateLegacyMinuteRingContext(legacy, 'slide-rule', config)).toEqual(legacy);
  });
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
