import type { ScaleLabel, ScalePluginConfig, ScaleTick } from '@/domain/scales/types';
import { styleScaleTicks } from './markingStyle';

export type AviationCalculation = 'time' | 'distance' | 'groundspeed' | 'fuel-used' | 'endurance';

export const aviationCalculations: Record<AviationCalculation, { title: string; first: string; second: string; unit: string; defaults: [number, number] }> = {
  time: { title: 'Time en route', first: 'Distance (NM)', second: 'Groundspeed (kt)', unit: 'min', defaults: [80, 120] },
  distance: { title: 'Distance flown', first: 'Groundspeed (kt)', second: 'Time (min)', unit: 'NM', defaults: [120, 40] },
  groundspeed: { title: 'Groundspeed', first: 'Distance (NM)', second: 'Time (min)', unit: 'kt', defaults: [80, 40] },
  'fuel-used': { title: 'Fuel used', first: 'Burn rate (US gal/h)', second: 'Time (min)', unit: 'US gal', defaults: [9, 40] },
  endurance: { title: 'Fuel endurance', first: 'Usable fuel (US gal)', second: 'Burn rate (US gal/h)', unit: 'min', defaults: [24, 8] }
};

export const calculateAviation = (mode: AviationCalculation, first: number, second: number): number => {
  if (!Number.isFinite(first) || !Number.isFinite(second) || first <= 0 || second <= 0) return Number.NaN;
  switch (mode) {
    case 'time': return 60 * first / second;
    case 'distance': return first * second / 60;
    case 'groundspeed': return 60 * first / second;
    case 'fuel-used': return first * second / 60;
    case 'endurance': return 60 * first / second;
  }
};

// One decade is repeated around the watch. Pilots supply the order of magnitude,
// just as on a conventional E6B circular calculator.
export const aviationAngle = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return Number.NaN;
  const decade = ((Math.log10(value / 10) % 1) + 1) % 1;
  return 360 * decade;
};

export const aviationBezelAlignment = (mode: AviationCalculation, first: number, second: number): number => {
  const rate = mode === 'time' || mode === 'endurance' ? second : mode === 'groundspeed' ? 60 * first / second : first;
  const angle = aviationAngle(60) - aviationAngle(rate);
  return ((angle % 360) + 360) % 360;
};

const numberedMarks = new Set([10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90]);
export const scaleFontSizeMm = (config: ScalePluginConfig): number => Math.max(0.45, Math.min(1.4, config.scaleFontSizeMm ?? 0.8));

const separatedLabels = (labels: ScaleLabel[], fontSizeMm: number): ScaleLabel[] => {
  const prioritized = [...labels].sort((a, b) => {
    const priority = (label: ScaleLabel) => [10, 20, 30, 40, 50, 60].includes(label.value ?? -1) ? 0 : 1;
    return priority(a) - priority(b) || (a.value ?? 0) - (b.value ?? 0);
  });
  const chosen: ScaleLabel[] = [];
  for (const candidate of prioritized) {
    const collides = chosen.some((label) => {
      const angularDistance = Math.abs(((candidate.angleDeg - label.angleDeg + 540) % 360) - 180) * Math.PI / 180;
      const availableArc = angularDistance * Math.min(candidate.radiusMm, label.radiusMm);
      const requiredArc = (candidate.text.length + label.text.length) * fontSizeMm * 0.32 + 0.25;
      return availableArc < requiredArc;
    });
    if (!collides) chosen.push(candidate);
  }
  return chosen.sort((a, b) => (a.value ?? 0) - (b.value ?? 0));
};

export const generateAviationRings = (config: ScalePluginConfig): { ticks: ScaleTick[]; labels: ScaleLabel[] } => {
  const ticks: ScaleTick[] = [];
  const labels: ScaleLabel[] = [];
  const intervals: Array<[number, number, number]> = config.tickDensityProfile === 'dense'
    ? [[10, 20, 0.1], [20, 50, 0.2], [50, 100, 0.5]]
    : config.tickDensityProfile === 'balanced'
      ? [[10, 20, 0.2], [20, 50, 0.5], [50, 100, 1]]
      : [[10, 20, 0.5], [20, 50, 1], [50, 100, 2]];
  for (const ringId of ['outer', 'inner'] as const) {
    const radiusMm = ringId === 'outer' ? (config.outerRadiusMm ?? 18.7) : (config.innerRadiusMm ?? 16.3);
    const rotation = ringId === 'outer' ? (config.outerRotationOffsetDeg ?? 0) : (config.innerRotationOffsetDeg ?? 0);
    for (const [start, end, step] of intervals) for (let index = 0; start + index * step < end - 1e-8; index += 1) {
      const value = Math.round((start + index * step) * 1000) / 1000;
      const major = numberedMarks.has(value);
      const angleDeg = aviationAngle(value) + rotation;
      ticks.push({
        angleDeg, radiusMm, lengthMm: major ? 0.45 : 0.25,
        widthMm: major ? 0.15 : 0.1, weight: major ? 'major' : 'minor',
        direction: 'inside', style: 'line', value, ringId
      });
      if (major) {
        labels.push({
          text: String(value), angleDeg,
          radiusMm: ringId === 'outer' ? radiusMm + 0.55 : radiusMm - 0.75,
          orientation: 'horizontal', rotationDeg: 0,
          placement: ringId === 'outer' ? 'outside' : 'inside', value, ringId
        });
      }
    }
  }
  return { ticks, labels: ['outer', 'inner'].flatMap((ringId) => separatedLabels(labels.filter((label) => label.ringId === ringId), scaleFontSizeMm(config))) };
};

const escapeXml = (value: string): string => value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character] ?? character);

// Marking artwork only; no case, dial, gasket, or cutting paths are implied.
export const createAviationRingSvg = (config: ScalePluginConfig, ringId: 'outer' | 'inner', caseDiameterMm: number): string => {
  const homeConfig = { ...config, outerRotationOffsetDeg: 0, innerRotationOffsetDeg: 0 };
  const generated = generateAviationRings(homeConfig);
  const ticks = styleScaleTicks(generated.ticks, homeConfig);
  const labels = generated.labels;
  const polar = (radius: number, angle: number) => {
    const radians = (angle - 90) * Math.PI / 180;
    return `${(radius * Math.cos(radians)).toFixed(4)},${(radius * Math.sin(radians)).toFixed(4)}`;
  };
  const lines = ticks.filter((tick) => tick.ringId === ringId).map((tick) => {
    const [x1, y1] = polar(tick.radiusMm, tick.angleDeg).split(',');
    const [x2, y2] = polar(tick.radiusMm - tick.lengthMm, tick.angleDeg).split(',');
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="${tick.widthMm}"/>`;
  }).join('');
  const text = labels.filter((label) => label.ringId === ringId).map((label) => {
    const [x, y] = polar(label.radiusMm, label.angleDeg).split(',');
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(config.fontFamily)}" font-size="${scaleFontSizeMm(config)}" fill="#000">${escapeXml(label.text)}</text>`;
  }).join('');
  const half = caseDiameterMm / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${caseDiameterMm}mm" height="${caseDiameterMm}mm" viewBox="${-half} ${-half} ${caseDiameterMm} ${caseDiameterMm}" data-ring="${ringId}" data-units="mm"><title>Aviation slide rule ${ringId === 'outer' ? 'rotating bezel' : 'fixed chapter ring'} marking artwork</title><desc>Scale markings only. Preview geometry; verify material, font outlines, radial fit and engraving process before manufacture.</desc><g id="${ringId}-markings">${lines}${text}</g></svg>`;
};
