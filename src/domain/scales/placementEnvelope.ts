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
  const widthMm = label.boundsMm?.width ?? Math.max(fontSizeMm * 0.58, label.text.length * fontSizeMm * 0.58);
  const heightMm = label.boundsMm?.height ?? fontSizeMm;
  const padding = label.hoverPaddingMm ?? 0;
  return Math.hypot(widthMm + 2 * padding, heightMm + 2 * padding) / 2;
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
): { ticks: ScaleTick[]; labels: ScaleLabel[]; envelope: ScalePlacementEnvelope; issues: string[] } => {
  const envelope = resolveScalePlacementEnvelope(config);
  const issues: string[] = [];
  const envelopeFor = (ring?: string) => ring === 'inner' && config.fixedBandInnerRadiusMm !== undefined && config.fixedBandOuterRadiusMm !== undefined
    ? resolveScalePlacementEnvelope({ ...config, bandInnerRadiusMm: config.fixedBandInnerRadiusMm, bandOuterRadiusMm: config.fixedBandOuterRadiusMm }) : envelope;
  const fontSizeMm = Math.max(0.45, config.scaleFontSizeMm ?? 0.8);

  const constrainedTicks = ticks.map((tick) => {
    const target = envelopeFor(tick.ringId);
    const strokeAllowanceMm = Math.max(config.minimumLineWidthMm, tick.widthMm) / 2 + (tick.hoverPaddingMm ?? 0);
    const maxAnchorRadiusMm = Math.max(
      0,
      target.contentOuterRadiusMm - radialTickExtent(tick) - strokeAllowanceMm
    );
    const inwardExtent = tick.direction === 'inside' ? tick.lengthMm : tick.direction === 'bidirectional' ? tick.lengthMm / 2 : 0;
    const minRadius = target.innerRadiusMm + target.safetyMarginMm + inwardExtent + strokeAllowanceMm;
    // Old unbound inner rings retain their separate radius during migration.
    const bound = tick.ringId !== 'inner' || config.fixedBandInnerRadiusMm !== undefined;
    if (bound && minRadius > maxAnchorRadiusMm) issues.push(`Tick ${tick.id ?? tick.value} cannot fit the ${tick.ringId ?? 'outer'} printable annulus.`);
    const radiusMm = bound && minRadius <= maxAnchorRadiusMm ? Math.max(minRadius, Math.min(tick.radiusMm, maxAnchorRadiusMm)) : Math.min(tick.radiusMm, maxAnchorRadiusMm);
    return { ...tick, radiusMm };
  });

  const constrainedLabels = labels.map((label) => {
    const target = envelopeFor(label.ringId);
    const inwardMarginMm = estimateLabelRadialHalfExtentMm(label, fontSizeMm);
    const maxRadiusMm = Math.max(0, target.contentOuterRadiusMm - inwardMarginMm);
    const minRadius = target.innerRadiusMm + target.safetyMarginMm + inwardMarginMm;
    const bound = label.ringId !== 'inner' || config.fixedBandInnerRadiusMm !== undefined;
    if (bound && minRadius > maxRadiusMm) issues.push(`Label ${label.id ?? label.text} cannot fit the ${label.ringId ?? 'outer'} printable annulus; reduce text size or choose a wider part.`);
    return { ...label, radiusMm: bound && minRadius <= maxRadiusMm ? Math.max(minRadius, Math.min(label.radiusMm, maxRadiusMm)) : Math.min(label.radiusMm, maxRadiusMm) };
  });

  return { ticks: constrainedTicks, labels: constrainedLabels, envelope, issues: [...new Set(issues)] };
};

export const tickOuterExtentMm = (tick: ScaleTick): number =>
  tick.radiusMm + radialTickExtent(tick) + tick.widthMm / 2;
