import { createLabelPlacementEngine } from '@/domain/scales/framework/labelEngine';
import type { LabelGenerator } from '@/domain/scales/framework/interfaces';
import type { ScaleLabel, ScaleTick } from '@/domain/scales/types';
import { formatLogarithmicLabel } from '@/domain/scales/framework/logarithmicDisplayFormatter';

const baseLabelEngine = createLabelPlacementEngine();

const withFormattedLabel = (tick: ScaleTick, includeMinorLabels: boolean, config: Parameters<LabelGenerator['generate']>[0]['config']): ScaleTick | null => {
  if (typeof tick.value !== 'number') {
    return null;
  }

  const isPrimary = tick.tier === 'primary';
  const isSecondary = tick.tier === 'secondary';

  if (!isPrimary && !(includeMinorLabels && isSecondary)) {
    return null;
  }

  return {
    ...tick,
    weight: 'major',
    label: formatLogarithmicLabel(tick.value, tick.tier, config)
  };
};

const buildLabelTicks = (ticks: ScaleTick[], includeMinorLabels: boolean, config: Parameters<LabelGenerator['generate']>[0]['config']): ScaleTick[] => {
  const result: ScaleTick[] = [];

  ticks.forEach((tick) => {
    const formatted = withFormattedLabel(tick, includeMinorLabels, config);
    if (formatted) {
      result.push(formatted);
    }
  });

  return result;
};

const buildMinorLabels = (ticks: ScaleTick[], includeMinorLabels: boolean, config: Parameters<LabelGenerator['generate']>[0]['config']): ScaleTick[] => {
  if (!includeMinorLabels) {
    return [];
  }

  return ticks
    .filter((tick) => tick.tier === 'secondary' && typeof tick.value === 'number')
    .map((tick) => ({
      ...tick,
      weight: 'major',
      label: formatLogarithmicLabel(tick.value ?? 0, tick.tier, config)
    }));
};

export const createLogarithmicLabelEngine = (): LabelGenerator => {
  return {
    generate: ({ ticks, config }): ScaleLabel[] => {
      const labelTicks = buildLabelTicks(ticks, false, config);
      const majorLabels = baseLabelEngine.generate({ ticks: labelTicks, config });
      const minorLabelTicks = buildMinorLabels(ticks, config.includeMinorLabels ?? false, config);
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
