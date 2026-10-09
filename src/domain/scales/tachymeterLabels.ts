import type { ScaleLabel } from './types';

/**
 * Reciprocal stations converge at high speeds. Select readable writing only;
 * calibration ticks and surviving label stations must never move. Bounding
 * circles conservatively cover every orientation and measured font fallback.
 */
export const selectReadableTachymeterLabels = (labels: ScaleLabel[], minimumGapMm: number): ScaleLabel[] => {
  if (labels.length < 2) return labels;
  const halfExtent = (label: ScaleLabel) => Math.hypot(label.boundsMm?.width ?? 0, label.boundsMm?.height ?? 0) / 2;
  const distance = (left: ScaleLabel, right: ScaleLabel) => {
    const delta = (left.angleDeg - right.angleDeg) * Math.PI / 180;
    return Math.sqrt(Math.max(0, left.radiusMm ** 2 + right.radiusMm ** 2 - 2 * left.radiusMm * right.radiusMm * Math.cos(delta)));
  };
  // Keep both range endpoints before considering intermediate speed readings.
  const candidates = [labels[0]!, labels[labels.length - 1]!, ...labels.slice(1, -1)];
  const accepted: ScaleLabel[] = [];
  for (const label of candidates) {
    if (accepted.every(other => distance(label, other) >= halfExtent(label) + halfExtent(other) + minimumGapMm)) accepted.push(label);
  }
  const retained = new Set(accepted);
  return labels.filter(label => retained.has(label));
};
