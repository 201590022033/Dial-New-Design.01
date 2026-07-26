import type {
  ScaleExporter,
  ScaleExporterInput
} from '@/domain/scales/framework/interfaces';
import type { ScaleManufacturingMetadata, ScalePluginConfig } from '@/domain/scales/types';

const inferMinimumSpacing = (ticks: ScaleExporterInput['ticks']): number => {
  if (ticks.length < 2) {
    return 360;
  }

  const sorted = [...ticks].sort((left, right) => left.angleDeg - right.angleDeg);
  let minimum = Number.POSITIVE_INFINITY;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (!previous || !current) {
      continue;
    }
    minimum = Math.min(minimum, Math.abs(current.angleDeg - previous.angleDeg));
  }

  return Number.isFinite(minimum) ? minimum : 360;
};

export const createScaleExporter = (): ScaleExporter => {
  return {
    toSvg: ({ kind, ticks, labels }: ScaleExporterInput): string => {
      const tickCount = ticks.length;
      const majorTickCount = ticks.filter((tick) => tick.weight === 'major').length;
      const labelCount = labels.length;
      return `<g data-scale-kind="${kind}" data-ticks="${tickCount}" data-major-ticks="${majorTickCount}" data-labels="${labelCount}"></g>`;
    },
    manufacturingMetadata: (
      { ticks }: ScaleExporterInput,
      config: ScalePluginConfig
    ): ScaleManufacturingMetadata => {
      return {
        minimumPrintableSpacingDeg: inferMinimumSpacing(ticks),
        minimumStrokeWidthMm: Math.min(config.majorTickWidthMm, config.minorTickWidthMm),
        suggestedTickDepthMm: Number((Math.max(config.majorTickLengthMm, config.minorTickLengthMm) * 0.6).toFixed(3)),
        suitability: {
          laser:
            config.majorTickWidthMm >= config.minimumLineWidthMm &&
            config.minorTickWidthMm >= config.minimumLineWidthMm,
          cnc: config.majorTickWidthMm >= 0.12,
          uv: config.minorTickWidthMm >= 0.1
        }
      };
    }
  };
};
