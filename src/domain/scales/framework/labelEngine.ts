import type {
  LabelGenerationInput,
  LabelGenerator
} from '@/domain/scales/framework/interfaces';
import type { ScaleLabel } from '@/domain/scales/types';

interface LabelEngineOptions {
  defaultOutsideOffsetMm?: number;
  defaultInsideOffsetMm?: number;
}

export const createLabelPlacementEngine = (options?: LabelEngineOptions): LabelGenerator => {
  const outsideOffset = options?.defaultOutsideOffsetMm ?? 1.4;
  const insideOffset = options?.defaultInsideOffsetMm ?? -2.2;

  return {
    generate: ({ ticks, config }: LabelGenerationInput): ScaleLabel[] => {
      const labels: ScaleLabel[] = [];
      const labelFrequency = Math.max(1, config.labelFrequency);

      ticks.forEach((tick, index) => {
        if (tick.weight !== 'major' || !tick.label) {
          return;
        }

        if (index % labelFrequency !== 0) {
          return;
        }

        const baseOffset = config.labelPlacement === 'inside' ? insideOffset : outsideOffset;
        const dynamicOffset =
          config.labelPlacement === 'inside'
            ? -tick.lengthMm * 0.8
            : tick.lengthMm * 0.6;

        labels.push({
          text: tick.label,
          angleDeg: tick.angleDeg,
          radiusMm: tick.radiusMm + baseOffset + dynamicOffset,
          orientation: config.labelOrientation,
          rotationDeg:
            config.labelOrientation === 'curved'
              ? tick.angleDeg + 90 + config.labelRotationOffsetDeg
              : config.labelRotationOffsetDeg,
          placement: config.labelPlacement
        });
      });

      return labels;
    }
  };
};
