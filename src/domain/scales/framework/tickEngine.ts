import type {
  TickGenerationInput,
  TickGenerationResult,
  TickGenerator
} from '@/domain/scales/framework/interfaces';
import type { ScaleTick } from '@/domain/scales/types';

interface TickEngineOptions {
  maxTickCount?: number;
}

const sortByAngle = (left: ScaleTick, right: ScaleTick): number => left.angleDeg - right.angleDeg;

const isMajorValue = (value: number, startValue: number, majorStep: number): boolean => {
  const quotient = (value - startValue) / majorStep;
  return Math.abs(quotient - Math.round(quotient)) <= majorStep / 1000;
};

export const createTickGenerationEngine = (options?: TickEngineOptions): TickGenerator => {
  const maxTickCount = options?.maxTickCount ?? 720;

  return {
    generate: ({ config, context, toAngle }: TickGenerationInput): TickGenerationResult => {
      const majorTicks: ScaleTick[] = [];
      const minorTicks: ScaleTick[] = [];

      if (config.endValue <= config.startValue || config.majorStep <= 0 || config.minorStep <= 0) {
        return {
          majorTicks,
          minorTicks,
          ticks: [],
          effectiveMinorStep: config.minorStep
        };
      }

      const valueSpan = config.endValue - config.startValue;
      const baseTickCount = Math.floor(valueSpan / config.minorStep) + 1;
      const densityFactor = Math.max(1, Math.ceil(baseTickCount / maxTickCount));
      const effectiveMinorStep = config.minorStep * densityFactor;
      const epsilon = effectiveMinorStep / 1000;

      for (
        let value = config.startValue;
        value <= config.endValue + epsilon;
        value += effectiveMinorStep
      ) {
        const major = isMajorValue(value, config.startValue, config.majorStep);

        const tick: ScaleTick = {
          angleDeg: toAngle(value, config, context) + config.rotationOffsetDeg,
          radiusMm: config.radiusMm,
          lengthMm: major ? config.majorTickLengthMm : config.minorTickLengthMm,
          widthMm: major ? config.majorTickWidthMm : config.minorTickWidthMm,
          weight: major ? 'major' : 'minor',
          direction: config.tickDirection,
          style: config.tickStyle,
          label: major ? `${Math.round(value * 1000) / 1000}` : undefined,
          value
        };

        if (major) {
          majorTicks.push(tick);
        } else {
          minorTicks.push(tick);
        }
      }

      const ticks = [...majorTicks, ...minorTicks].sort(sortByAngle);

      return {
        majorTicks,
        minorTicks,
        ticks,
        effectiveMinorStep
      };
    }
  };
};
