import type { ScaleMathContext, ScalePluginConfig, ScaleTick } from '@/domain/scales/types';

export const generateTicks = (
  config: ScalePluginConfig,
  context: ScaleMathContext,
  toAngle: (value: number, config: ScalePluginConfig, context: ScaleMathContext) => number
): ScaleTick[] => {
  const ticks: ScaleTick[] = [];

  if (config.minorStep <= 0 || config.majorStep <= 0 || config.endValue <= config.startValue) {
    return ticks;
  }

  const epsilon = config.minorStep / 1000;
  for (let value = config.startValue; value <= config.endValue + epsilon; value += config.minorStep) {
    const majorRatio = value / config.majorStep;
    const isMajor = Math.abs(majorRatio - Math.round(majorRatio)) <= epsilon;

    ticks.push({
      angleDeg: toAngle(value, config, context) + config.rotationOffsetDeg,
      radiusMm: config.radiusMm,
      lengthMm: isMajor ? config.majorTickLengthMm : config.minorTickLengthMm,
      widthMm: isMajor ? config.majorTickWidthMm : config.minorTickWidthMm,
      weight: isMajor ? 'major' : 'minor',
      direction: config.tickDirection,
      style: config.tickStyle,
      label: isMajor ? `${Math.round(value * 1000) / 1000}` : undefined
    });
  }

  return ticks;
};
