import type { ScaleLabel, ScalePluginConfig, ScaleTick } from '@/domain/scales/types';

export interface ScalePlacementEnvelope {
  innerRadiusMm: number;
  outerRadiusMm: number;
  contentOuterRadiusMm: number;
  safetyMarginMm: number;
}

const radialTickExtent = (tick: ScaleTick): number => {
  if (tick.direction === 'outside') return tick.lengthMm;
  if (tick.direction === 'bidirectional') return tick.lengthMm / 2;
  return 0;
};

// SVG text is centred on the label point. A half diagonal is deliberately used
// so horizontal, radial and curved labels remain inside the same hard envelope.
export const estimateLabelRadialHalfExtentMm = (label: ScaleLabel, fontSizeMm: number): number => {
  const widthMm = Math.max(fontSizeMm * 0.58, label.text.length * fontSizeMm * 0.58);
  const heightMm = fontSizeMm;
  return Math.hypot(widthMm, heightMm) / 2;
};

export const resolveScalePlacementEnvelope = (config: ScalePluginConfig): ScalePlacementEnvelope => {
  const innerRadiusMm = Math.max(0, config.bandInnerRadiusMm);
  const outerRadiusMm = Math.max(innerRadiusMm, config.bandOuterRadiusMm);
  const safetyMarginMm = Math.max(0.08, config.minimumLineWidthMm / 2);
  return {
    innerRadiusMm,
    outerRadiusMm,
    contentOuterRadiusMm: Math.max(innerRadiusMm, outerRadiusMm - safetyMarginMm),
    safetyMarginMm
  };
};

export const constrainScaleToPlacementEnvelope = (
  ticks: ScaleTick[],
  labels: ScaleLabel[],
  config: ScalePluginConfig
): { ticks: ScaleTick[]; labels: ScaleLabel[]; envelope: ScalePlacementEnvelope } => {
  const envelope = resolveScalePlacementEnvelope(config);
  const fontSizeMm = Math.max(0.45, config.scaleFontSizeMm ?? 0.8);

  const constrainedTicks = ticks.map((tick) => {
    const strokeAllowanceMm = Math.max(config.minimumLineWidthMm, tick.widthMm) / 2;
    const maxAnchorRadiusMm = Math.max(
      0,
      envelope.contentOuterRadiusMm - radialTickExtent(tick) - strokeAllowanceMm
    );
    return tick.radiusMm <= maxAnchorRadiusMm
      ? tick
      : { ...tick, radiusMm: maxAnchorRadiusMm };
  });

  const constrainedLabels = labels.map((label) => {
    const inwardMarginMm = estimateLabelRadialHalfExtentMm(label, fontSizeMm);
    const maxRadiusMm = Math.max(0, envelope.contentOuterRadiusMm - inwardMarginMm);
    return label.radiusMm <= maxRadiusMm
      ? label
      : { ...label, radiusMm: maxRadiusMm };
  });

  return { ticks: constrainedTicks, labels: constrainedLabels, envelope };
};

export const tickOuterExtentMm = (tick: ScaleTick): number =>
  tick.radiusMm + radialTickExtent(tick) + tick.widthMm / 2;
