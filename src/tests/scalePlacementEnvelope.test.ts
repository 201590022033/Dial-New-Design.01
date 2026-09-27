import { describe, expect, it } from 'vitest';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import {
  estimateLabelRadialHalfExtentMm,
  tickOuterExtentMm
} from '@/domain/scales/placementEnvelope';
import type { ScalePluginConfig } from '@/domain/scales/types';
import { runScalePlugin } from '@/services/scaleEngineService';

const targetBands = [
  { id: 'band-outer-bezel', inner: 18.5, outer: 20 },
  { id: 'band-inner-bezel', inner: 17, outer: 18.5 },
  { id: 'band-chapter-ring', inner: 14, outer: 17 },
  { id: 'band-dial-face', inner: 0, outer: 14 }
] as const;

describe('scale placement envelope', () => {
  it.each(targetBands)('keeps ticks and labels inside $id physical OD', (target) => {
    const defaults = getScalePlugin('circular')!.defaultConfig;
    const config: ScalePluginConfig = {
      ...defaults,
      radiusMm: target.outer - 0.1,
      majorTickLengthMm: 2.4,
      minorTickLengthMm: 1.3,
      tickDirection: 'outside',
      labelPlacement: 'outside',
      labelOffsetMm: 1.8,
      scaleFontSizeMm: 1.2,
      bandInnerRadiusMm: target.inner,
      bandOuterRadiusMm: target.outer,
      placementTargetBandId: target.id
    };

    const result = runScalePlugin('circular', config, { startAngleDeg: 0, endAngleDeg: 360 });
    expect(result).not.toBeNull();
    expect(result?.placementTargetBandId).toBe(target.id);
    expect(result?.ticks.every((tick) => tickOuterExtentMm(tick) <= target.outer + 1e-9)).toBe(true);
    expect(result?.labels.every((label) =>
      label.radiusMm + estimateLabelRadialHalfExtentMm(label, result.fontSizeMm) <= target.outer + 1e-9
    )).toBe(true);
  });

  it('uses the selected target as the renderer clipping envelope', () => {
    const defaults = getScalePlugin('circular')!.defaultConfig;
    const result = runScalePlugin('circular', {
      ...defaults,
      bandInnerRadiusMm: 14,
      bandOuterRadiusMm: 17,
      placementTargetBandId: 'band-chapter-ring'
    }, { startAngleDeg: 0, endAngleDeg: 360 });

    expect(result?.placementEnvelope.outerRadiusMm).toBe(17);
    expect(result?.placementEnvelope.contentOuterRadiusMm).toBeLessThan(17);
  });
});
