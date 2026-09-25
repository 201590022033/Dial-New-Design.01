import type { ScaleKind, ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';

/** Zero is at 12 o'clock; 60 meets it after one clockwise revolution. */
export const fullMinuteRingContext: ScaleMathContext = {
  startAngleDeg: 0,
  endAngleDeg: 360
};

export const isClosedScaleContext = (context: ScaleMathContext): boolean =>
  Math.abs(Math.abs(context.endAngleDeg - context.startAngleDeg) - 360) < 1e-6;

/** Only the old, untouched 0–60 startup setting is migrated. Custom arcs stay as saved. */
export const migrateLegacyMinuteRingContext = (
  context: ScaleMathContext,
  kind: ScaleKind,
  config: ScalePluginConfig
): ScaleMathContext =>
  (kind === 'circular' || kind === 'countdown') &&
  config.startValue === 0 && config.endValue === 60 &&
  context.startAngleDeg === -140 && context.endAngleDeg === 140
    ? { ...fullMinuteRingContext }
    : context;
