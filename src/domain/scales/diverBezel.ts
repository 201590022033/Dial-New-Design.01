import type { ScalePluginConfig, ScaleTick, ScaleLabel, ScalePointer } from './types';

export interface DiverBezelSettings {
  version: 1;
  detailedMinutes: 15 | 20;
  detailColourEnabled: boolean;
  detailColour: string;
  fiveMinuteHighlight: boolean;
  fiveMinuteColour: string;
  mounting: 'external' | 'internal';
}
export const defaultDiverBezel: DiverBezelSettings = {
  version: 1, detailedMinutes: 20, detailColourEnabled: false, detailColour: '#e4c878',
  fiveMinuteHighlight: false, fiveMinuteColour: '#c93d36', mounting: 'external'
};
export function assertDiverBezel(value: unknown): asserts value is DiverBezelSettings {
  const s = value as DiverBezelSettings;
  if (!s || s.version !== 1 || ![15, 20].includes(s.detailedMinutes) ||
    typeof s.detailColourEnabled !== 'boolean' || typeof s.fiveMinuteHighlight !== 'boolean' ||
    !['external', 'internal'].includes(s.mounting) ||
    !/^#[0-9a-f]{6}$/i.test(s.detailColour) || !/^#[0-9a-f]{6}$/i.test(s.fiveMinuteColour)) {
    throw new Error('Invalid diver bezel settings.');
  }
}
export const normalizeBezelAngle = (angle: number): number => ((angle % 360) + 360) % 360;
export const bezelElapsedMinutes = (handMinute: number, rotation: number): number => normalizeBezelAngle(handMinute * 6 - rotation) / 6;

/** Deliberately regular calibration; realism comes from typography and mark hierarchy, never jitter. */
export const diverBezelArtwork = (config: ScalePluginConfig) => {
  const settings = config.diverBezel ?? defaultDiverBezel;
  assertDiverBezel(settings);
  const outer = config.bandOuterRadiusMm - Math.max(.08, config.minimumLineWidthMm / 2);
  const width = Math.max(.1, outer - config.bandInnerRadiusMm - .08);
  const angle = (minute: number) => normalizeBezelAngle(minute * 6 + config.rotationOffsetDeg);
  const colour = (minute: number) => minute > 0 && minute <= 5 && settings.fiveMinuteHighlight
    ? settings.fiveMinuteColour : minute > 0 && minute <= settings.detailedMinutes && settings.detailColourEnabled
      ? settings.detailColour : config.color;
  const ticks: ScaleTick[] = [];
  const labels: ScaleLabel[] = [];
  for (let minute = 1; minute < 60; minute++) {
    if (minute > settings.detailedMinutes && minute % 5 !== 0) continue;
    const major = minute % 5 === 0;
    const numeral = minute % 10 === 0;
    ticks.push({ id: `diver:tick:${minute}`, value: minute, angleDeg: angle(minute), radiusMm: outer - .08,
      lengthMm: Math.min(width * (numeral ? .16 : major ? .48 : .28), numeral ? .28 : major ? .85 : .48),
      widthMm: Math.max(config.minimumLineWidthMm, major ? .18 : .10), weight: major ? 'major' : 'minor',
      direction: 'inside', style: 'line', color: colour(minute), ringId: 'outer' });
    if (numeral) labels.push({ id: `diver:label:${minute}`, value: minute, text: String(minute), angleDeg: angle(minute),
      radiusMm: config.bandInnerRadiusMm + width * .43, orientation: 'radial', rotationDeg: 0,
      placement: 'inside', color: colour(minute), ringId: 'outer' });
  }
  const size = Math.min(.9, width * .65);
  const pointer: ScalePointer = { id: 'diver:zero', value: 0, ringId: 'outer', angleDeg: angle(0),
    radiusMm: config.bandInnerRadiusMm + width * .52, widthMm: size, heightMm: size,
    strokeWidthMm: 0, color: config.color, shape: 'triangle', rotationDeg: 180 };
  return { ticks, labels, pointer };
};
