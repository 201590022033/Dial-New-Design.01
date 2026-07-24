import type { ScaleLabel, ScalePluginConfig, ScaleTick } from '@/domain/scales/types';

export const generateLabels = (ticks: ScaleTick[], config: ScalePluginConfig): ScaleLabel[] => {
  const labels: ScaleLabel[] = [];

  ticks.forEach((tick, index) => {
    if (tick.weight !== 'major' || !tick.label) {
      return;
    }

    if (index % Math.max(1, config.labelFrequency) !== 0) {
      return;
    }

    const offset = config.labelPlacement === 'inside' ? -config.majorTickLengthMm - 1.4 : 1.4;

    labels.push({
      text: tick.label,
      angleDeg: tick.angleDeg,
      radiusMm: tick.radiusMm + offset,
      orientation: config.labelOrientation,
      rotationDeg: config.labelRotationOffsetDeg,
      placement: config.labelPlacement
    });
  });

  return labels;
};
