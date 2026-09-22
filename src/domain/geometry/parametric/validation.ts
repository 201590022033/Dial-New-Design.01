import type { DimensionMm, ParametricCaseV1, ParametricHandV1, ParametricPusherV1 } from './types';
import type { ParametricDialV1 } from './dial';

export type ParametricValidationStatus = 'valid' | 'invalid' | 'unknown';
export interface ParametricValidationResult { status: ParametricValidationStatus; errors: string[]; unknownDimensions: string[]; }
const known = (v: DimensionMm): v is number => typeof v === 'number' && Number.isFinite(v);
const collect = (value: object, path = ''): { errors: string[]; unknown: string[] } => {
  const errors: string[] = [], unknown: string[] = [];
  for (const [key, v] of Object.entries(value)) {
    const p = path ? `${path}.${key}` : key;
    if (typeof v === 'number' && (!Number.isFinite(v) || (v < 0 && !key.toLowerCase().includes('angledeg')))) errors.push(`${p} must be non-negative`);
    else if (v && typeof v === 'object' && 'status' in v && (v as { status?: string }).status === 'unknown') unknown.push(p);
    else if (v && typeof v === 'object') { const r = collect(v as Record<string, unknown>, p); errors.push(...r.errors); unknown.push(...r.unknown); }
  }
  return { errors, unknown };
};
const pusherKeys: (keyof ParametricCaseV1)[] = ['pusherTubeRadius', 'pusherTubeLength', 'pusherTubeEmbed', 'pusherBossRadius', 'pusherBossLength', 'pusherBossEmbed'];
const lugStyles = new Set(['straight', 'curved', 'twisted', 'hooded', 'integrated', 'drilled', 'wire', 'teardrop', 'faceted', 'skeleton']);

export const validateParametricCaseV1 = (c: ParametricCaseV1): ParametricValidationResult => {
  const r = collect(c); const pairs: [string, DimensionMm, string, DimensionMm][] = [['dialOpening', c.dialOpening, 'caseDiameter', c.caseDiameter], ['crystalSeatDiameter', c.crystalSeatDiameter, 'caseDiameter', c.caseDiameter]];
  if (known(c.caseDiameter) && c.caseDiameter <= 0) r.errors.push('caseDiameter must be greater than zero');
  for (const [a, av, b, bv] of pairs) if (known(av) && known(bv) && av >= bv) r.errors.push(`${a} must be smaller than ${b}`);
  if (known(c.lugWidth) && known(c.lugTipWidth) && c.lugTipWidth > c.lugWidth) r.errors.push('lugTipWidth must not exceed lugWidth');
  if (known(c.lugPairGap) && known(c.lugWidth) && c.lugPairGap > c.lugWidth) r.errors.push('lugPairGap must not exceed the nominal lugWidth/strap envelope');
  if (known(c.lugToLug) && known(c.caseDiameter) && c.lugToLug < c.caseDiameter) r.errors.push('lugToLug must not be smaller than caseDiameter');
  if (c.lugStyle !== undefined && !lugStyles.has(c.lugStyle)) r.errors.push('lugStyle must be a supported lug geometry family');
  if (c.lugStyle === 'wire' && (!known(c.lugWireDiameter ?? { status: 'unknown' }) || Number(c.lugWireDiameter) <= 0)) r.errors.push('lugWireDiameter must be known and positive for wire lugs');
  if (c.lugStyle === 'skeleton' && known(c.lugSkeletonCutoutRatio ?? 0) && (Number(c.lugSkeletonCutoutRatio) <= 0 || Number(c.lugSkeletonCutoutRatio) >= 0.8)) r.errors.push('lugSkeletonCutoutRatio must be greater than 0 and less than 0.8');
  const pusherCount = Math.max(0, Math.min(2, Math.round(Number(c.pusherCount) || 0)));
  if (c.pusherCount !== pusherCount) r.errors.push('pusherCount must be 0, 1, or 2');
  if (pusherCount > 0) {
    if (c.pusherLayout === 'none') r.errors.push('pusherLayout must be specified when pusherCount > 0');
    for (const key of pusherKeys) {
      const v = c[key] as DimensionMm;
      if (!known(v)) r.errors.push(`${key} must be known when pusherCount > 0`);
    }
    if (known(c.pusherBossRadius) && known(c.pusherTubeRadius) && c.pusherTubeRadius > c.pusherBossRadius) {
      r.errors.push('pusherTubeRadius must not exceed pusherBossRadius');
    }
  }
  return { status: r.errors.length ? 'invalid' : r.unknown.length ? 'unknown' : 'valid', errors: r.errors, unknownDimensions: r.unknown };
};
export const validateParametricPusherV1 = (p: ParametricPusherV1): ParametricValidationResult => {
  const r = collect(p);
  if (!Number.isFinite(p.angularPositionDeg)) r.errors.push('angularPositionDeg must be finite');
  if (known(p.headDiameterMm) && known(p.stemDiameterMm) && p.stemDiameterMm > p.headDiameterMm) {
    r.errors.push('stemDiameterMm must not exceed headDiameterMm');
  }
  if (known(p.tubeRadius) && known(p.bossRadius) && p.tubeRadius > p.bossRadius) {
    r.errors.push('tubeRadius must not exceed bossRadius');
  }
  return { status: r.errors.length ? 'invalid' : r.unknown.length ? 'unknown' : 'valid', errors: r.errors, unknownDimensions: r.unknown };
};

export const validateParametricDialV1 = (d: ParametricDialV1): ParametricValidationResult => {
  const r = collect(d);
  if (d.outerDiameterMm <= 0) r.errors.push('outerDiameterMm must be greater than zero');
  if (d.thicknessMm <= 0) r.errors.push('thicknessMm must be greater than zero');
  if (d.centreHoleDiameterMm >= d.outerDiameterMm) r.errors.push('centreHoleDiameterMm must be smaller than outerDiameterMm');
  if (d.markerLayout.count < 1 || !Number.isInteger(d.markerLayout.count)) r.errors.push('markerLayout.count must be a positive integer');
  if (d.markerLayout.radiusOuterMm > d.outerDiameterMm / 2) r.errors.push('markerLayout.radiusOuterMm must fit within the dial');
  for (const [index, window] of d.windows.entries()) {
    if (window.widthMm <= 0 || window.heightMm <= 0) r.errors.push(`windows[${index}] dimensions must be greater than zero`);
    if (window.cornerRadiusMm * 2 > Math.min(window.widthMm, window.heightMm)) r.errors.push(`windows[${index}].cornerRadiusMm is too large`);
  }
  for (const [index, subdial] of d.subdials.entries()) {
    if (subdial.radiusMm <= 0 || subdial.radiusMm + subdial.handRadiusMm > d.outerDiameterMm / 2) r.errors.push(`subdials[${index}] must fit within the dial`);
    if (subdial.markerCount < 0 || !Number.isInteger(subdial.markerCount)) r.errors.push(`subdials[${index}].markerCount must be a non-negative integer`);
  }
  if (!d.provenance.source.trim()) r.errors.push('provenance.source must not be empty');
  return { status: r.errors.length ? 'invalid' : r.unknown.length ? 'unknown' : 'valid', errors: r.errors, unknownDimensions: r.unknown };
};

export const validateParametricHandV1 = (h: ParametricHandV1): ParametricValidationResult => {
  const r = collect(h); if (known(h.hub.pinionHoleDiameter) && known(h.hub.diameter) && h.hub.pinionHoleDiameter >= h.hub.diameter) r.errors.push('hub.pinionHoleDiameter must be smaller than hub.diameter');
  if (known(h.tip.length) && known(h.body.length) && h.tip.length > h.body.length) r.errors.push('tip.length must not exceed body.length');
  return { status: r.errors.length ? 'invalid' : r.unknown.length ? 'unknown' : 'valid', errors: r.errors, unknownDimensions: r.unknown };
};
