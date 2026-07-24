import type { ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';

export interface PolarCoordinate {
  radiusMm: number;
  angleDeg: number;
}

export const linearInterpolate = (value: number, start: number, end: number): number => {
  if (end === start) return 0;
  return (value - start) / (end - start);
};

export const circularAngleForRatio = (
  ratio: number,
  context: ScaleMathContext,
  direction: ScalePluginConfig['direction']
): number => {
  const span = context.endAngleDeg - context.startAngleDeg;
  const signed = direction === 'clockwise' ? ratio : -ratio;
  return context.startAngleDeg + signed * span;
};

export const linearToAngle = (
  value: number,
  config: ScalePluginConfig,
  context: ScaleMathContext
): number => {
  const ratio = linearInterpolate(value, config.startValue, config.endValue);
  return circularAngleForRatio(ratio, context, config.direction);
};

export const logarithmicToAngle = (
  value: number,
  config: ScalePluginConfig,
  context: ScaleMathContext
): number => {
  const safe = (input: number) => Math.log10(Math.max(input, 1));
  const ratio = linearInterpolate(safe(value), safe(config.startValue), safe(config.endValue));
  return circularAngleForRatio(ratio, context, config.direction);
};

export const polarToCartesian = (point: PolarCoordinate): { x: number; y: number } => {
  const radians = ((point.angleDeg - 90) * Math.PI) / 180;
  return {
    x: point.radiusMm * Math.cos(radians),
    y: point.radiusMm * Math.sin(radians)
  };
};

export const radialOffset = (radiusMm: number, deltaMm: number): number => radiusMm + deltaMm;
