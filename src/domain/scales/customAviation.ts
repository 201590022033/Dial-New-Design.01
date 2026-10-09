import type { BandEntity } from '@/domain/bands/types';
import type { ScaleLabel, ScaleTick } from './types';
import type { ScaleRunResult } from '@/services/scaleEngineService';
import { resolvedScaleSvg } from './resolvedScaleArtwork';
import { KM_PER_NAUTICAL_MILE, KM_PER_STATUTE_MILE } from './calibratedSlideRule';

// NIST SP811: international nautical mile=1852m; statute mile=1609.344m.
export const KNOTS_TO_MPH = KM_PER_NAUTICAL_MILE / KM_PER_STATUTE_MILE;
export const knotsToMph = (knots: number): number => knots * KNOTS_TO_MPH;
export const mphToKnots = (mph: number): number => mph / KNOTS_TO_MPH;
export const durationMinutes = (text: string): number => {
  const match = /^(\d+):([0-5]\d)$/.exec(text.trim());
  if (!match) return NaN;
  const value = Number(match[1]) * 60 + Number(match[2]);
  return Number.isSafeInteger(value) ? value : NaN;
};
export const decimalHours = (minutes: number): number => minutes >= 0 && Number.isFinite(minutes) ? minutes / 60 : NaN;
export const decimalHourReading = (minutes: number) => {
  const hours = decimalHours(minutes);
  return { hours, wholeHours: Math.floor(hours), fraction: hours - Math.floor(hours), angleDeg: (hours % 1) * 360 };
};

export type CustomAviationProgram = 'decimal-hour' | 'knots-mph';
export interface CustomAviationLayer {
  id: CustomAviationProgram;
  enabled: boolean;
  targetBandId: string;
  fontSizeMm: number;
  color: string;
  pairedColor: string;
  rotationDeg: number;
  maximumKnots: number;
}
export interface CustomAviationDocument { version: 1; layers: CustomAviationLayer[] }
export const customAviationDefaults = (id: CustomAviationProgram): CustomAviationLayer => ({
  id, enabled: false, targetBandId: 'band-chapter-ring', fontSizeMm: .4,
  color: '#F0F0F0', pairedColor: '#E63946', rotationDeg: 0, maximumKnots: 200
});
export const assertCustomAviation = (doc: CustomAviationDocument): void => {
  if (!doc || doc.version !== 1 || !Array.isArray(doc.layers) || doc.layers.length > 2) throw new Error('Invalid custom aviation document');
  const ids = new Set<string>();
  for (const layer of doc.layers) {
    if (!layer || !['decimal-hour', 'knots-mph'].includes(layer.id) || ids.has(layer.id) || typeof layer.enabled !== 'boolean' ||
      typeof layer.targetBandId !== 'string' || !layer.targetBandId || !/^#[\da-f]{6}$/i.test(layer.color) || !/^#[\da-f]{6}$/i.test(layer.pairedColor) ||
      !Number.isFinite(layer.fontSizeMm) || layer.fontSizeMm < .25 || layer.fontSizeMm > 1.5 ||
      !Number.isFinite(layer.rotationDeg) || !Number.isFinite(layer.maximumKnots) || layer.maximumKnots < 20 || layer.maximumKnots > 1000)
      throw new Error('Invalid custom aviation layer');
    ids.add(layer.id);
  }
};

/** Two fixed linear reading rows on ONE physical part; never original log artwork. */
export const runCustomAviation = (layer: CustomAviationLayer, band: BandEntity | undefined): ScaleRunResult => {
  assertCustomAviation({ version: 1, layers: [layer] });
  const inner = band?.geometry.innerRadius ?? 0, outer = band?.geometry.outerRadius ?? 0;
  const font = layer.fontSizeMm, margin = .12, hover = .025;
  const ticks: ScaleTick[] = [], labels: ScaleLabel[] = [], issues: string[] = [];
  if (!band || !band.visible) issues.push('Custom aviation target is missing or hidden.');
  const base = inner + margin + font / 2 + hover;
  const second = base + font + .13;
  const tickRadius = outer - margin - .05;
  const addLabel = (text: string, value: number, angleDeg: number, radiusMm: number, row: string, color: string) => {
    let boundsMm = { width: text.length * font * .65, height: font };
    if (typeof document !== 'undefined') {
      const ctx = document.createElement('canvas').getContext('2d');
      if (ctx) {
        ctx.font = `600 ${font * 100}px Arial, sans-serif`;
        const metrics = ctx.measureText(text);
        boundsMm = { width: Math.max(metrics.width, metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) / 100,
          height: Math.max(font, (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 100) };
      }
    }
    labels.push({ id: `custom-${layer.id}.${row}.${value}`, text, value, angleDeg, radiusMm, orientation: 'radial', rotationDeg: 0,
      placement: 'inside', ringId: 'outer', fontSizeMm: font, color, boundsMm, hoverPaddingMm: hover });
  };
  const decimal = layer.id === 'decimal-hour';
  const count = decimal ? 100 : 41;
  for (let index = 0; index < count; index++) {
    const value = decimal ? index / 100 : index * layer.maximumKnots / 40;
    const angleDeg = layer.rotationDeg + (decimal ? index * 3.6 : index * 7.5);
    const major = decimal ? index % 10 === 0 : index % 4 === 0;
    ticks.push({ id: `custom-${layer.id}.tick.${index}`, angleDeg, radiusMm: tickRadius, lengthMm: major ? .22 : .12,
      widthMm: .08, weight: major ? 'major' : 'minor', direction: 'inside', style: 'line', value, ringId: 'outer', color: layer.color, hoverPaddingMm: hover });
    if (major) {
      addLabel(decimal ? value.toFixed(2) : `${Number(value.toFixed(1))}kt`, value, angleDeg, base, 'primary', layer.color);
      addLabel(decimal ? `${index * .6}m` : `${knotsToMph(value).toFixed(1)}mph`, decimal ? index * .6 : knotsToMph(value), angleDeg, second, 'paired', layer.pairedColor);
    }
  }
  // Tangent-centred text: full glyph + hover box, including curvature at corners.
  for (const label of labels) {
    const width = label.boundsMm!.width + hover * 2, height = label.boundsMm!.height + hover * 2;
    if (label.radiusMm - height / 2 < inner + margin || Math.hypot(label.radiusMm + height / 2, width / 2) > outer - margin)
      issues.push(`Custom ${layer.id} label ${label.text} cannot fit this annulus.`);
    if (label.radiusMm + height / 2 + .08 > tickRadius - .22 - .04 - hover)
      issues.push('Custom reading rows collide with their graduations; choose a wider ring or smaller lettering.');
  }
  for (const row of ['primary', 'paired']) {
    const writing = labels.filter(label => label.id!.includes(`.${row}.`));
    for (let i = 0; i < writing.length; i++) {
      const a = writing[i]!, b = writing[(i + 1) % writing.length]!;
      const gap = Math.abs(((a.angleDeg - b.angleDeg + 540) % 360) - 180) * Math.PI / 180 * Math.min(a.radiusMm, b.radiusMm);
      if (gap < (a.boundsMm!.width + b.boundsMm!.width) / 2 + hover * 2) issues.push('Custom paired labels overlap; reduce text size or use a larger part.');
    }
  }
  if (tickRadius - .22 - .04 - hover < inner + margin) issues.push('Custom ticks cannot fit this annulus.');
  const structuredWarnings = [...new Set(issues)].map(description => ({ severity: 'error' as const, description, affectedObject: 'custom-aviation', suggestedFix: 'Use independent, wider physical targets; calibration angles are not moved.' }));
  const result: ScaleRunResult = { kind: 'custom', pluginName: decimal ? 'Custom Decimal hour (0.00–1.00 h; 100 graduations)' : `Custom Knots / statute MPH (linear 0–${layer.maximumKnots} kt; 300° sweep)`,
    fontSizeMm: font, fontFamily: 'Arial, sans-serif', color: layer.color, ticks, labels, geometry: { ticks, labels }, validation: { valid: !issues.length, warnings: structuredWarnings.map(issue => issue.description), structuredWarnings },
    svg: '', preview: '', placementTargetBandId: layer.targetBandId, physicalTargetsResolved: true,
    placementEnvelope: { innerRadiusMm: inner, outerRadiusMm: outer, contentOuterRadiusMm: outer - margin, safetyMarginMm: margin } };
  result.svg = resolvedScaleSvg(result, Math.max(1, outer * 2));
  return result;
};
