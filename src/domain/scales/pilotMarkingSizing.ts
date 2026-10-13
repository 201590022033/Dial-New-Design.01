import type { ScalePluginConfig } from './types';

/** Shared live/export baseline. User length factors remain relative to this size. */
export const PILOT_GRADUATION_FACTOR = 1.15;

/** Preserve the authored lane within a resized rotating annulus. Fixed rows stay independent. */
export const resizePilotRadius = (radius: number | undefined, config: ScalePluginConfig, inner: number, outer: number): number => {
  const oldWidth = config.bandOuterRadiusMm - config.bandInnerRadiusMm;
  const fraction = oldWidth > 0 && radius !== undefined
    ? Math.max(0, Math.min(1, (radius - config.bandInnerRadiusMm) / oldWidth)) : 0.15;
  return inner + fraction * (outer - inner);
};
