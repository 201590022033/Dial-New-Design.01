import { createLabelPlacementEngine } from '@/domain/scales/framework/labelEngine';
import type { LabelGenerator } from '@/domain/scales/framework/interfaces';
import type { ScaleLabel, ScaleTick } from '@/domain/scales/types';

const baseLabelEngine = createLabelPlacementEngine();

const buildMinorLabels = (ticks: ScaleTick[], includeMinorLabels: boolean): ScaleTick[] => {
  if (!includeMinorLabels) {
    return [];
  }

  return ticks
    .filter((tick) => tick.tier === 'secondary' && typeof tick.value === 'number')
    .map((tick) => ({
      ...tick,
      weight: 'major',
      label: `${Math.round((tick.value ?? 0) * 10) / 10}`
    }));
};

export const createLogarithmicLabelEngine = (): LabelGenerator => {
  return {
    generate: ({ ticks, config }): ScaleLabel[] => {
      const majorLabels = baseLabelEngine.generate({ ticks, config });
      const minorLabelTicks = buildMinorLabels(ticks, config.includeMinorLabels ?? false);
      if (minorLabelTicks.length === 0) {
        return majorLabels;
      }

      const denseConfig = {
        ...config,
        labelFrequency: Math.max(1, Math.floor(config.labelFrequency))
      };

      const minorLabels = baseLabelEngine.generate({
        ticks: minorLabelTicks,
        config: denseConfig
      });

      return [...majorLabels, ...minorLabels];
    }
  };
};
