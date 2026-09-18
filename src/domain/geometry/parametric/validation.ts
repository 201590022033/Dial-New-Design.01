import type { DimensionMm, ParametricCaseV1, ParametricHandV1 } from './types';

export type ParametricValidationStatus = 'valid' | 'invalid' | 'unknown';
export interface ParametricValidationResult { status: ParametricValidationStatus; errors: string[]; unknownDimensions: string[]; }
const known = (v: DimensionMm): v is number => typeof v === 'number' && Number.isFinite(v);
const collect = (value: object, path = ''): { errors: string[]; unknown: string[] } => {
  const errors: string[] = [], unknown: string[] = [];
  for (const [key, v] of Object.entries(value)) {
    const p = path ? `${path}.${key}` : key;
    if (typeof v === 'number' && (!Number.isFinite(v) || v < 0)) errors.push(`${p} must be non-negative`);
    else if (v && typeof v === 'object' && 'status' in v && (v as { status?: string }).status === 'unknown') unknown.push(p);
    else if (v && typeof v === 'object') { const r = collect(v as Record<string, unknown>, p); errors.push(...r.errors); unknown.push(...r.unknown); }
  }
  return { errors, unknown };
};
export const validateParametricCaseV1 = (c: ParametricCaseV1): ParametricValidationResult => {
  const r = collect(c); const pairs: [string, DimensionMm, string, DimensionMm][] = [['dialOpening', c.dialOpening, 'caseDiameter', c.caseDiameter], ['crystalSeatDiameter', c.crystalSeatDiameter, 'caseDiameter', c.caseDiameter]];
  if (known(c.caseDiameter) && c.caseDiameter <= 0) r.errors.push('caseDiameter must be greater than zero');
  for (const [a, av, b, bv] of pairs) if (known(av) && known(bv) && av >= bv) r.errors.push(`${a} must be smaller than ${b}`);
  if (known(c.lugWidth) && known(c.lugTipWidth) && c.lugTipWidth > c.lugWidth) r.errors.push('lugTipWidth must not exceed lugWidth');
  if (known(c.lugPairGap) && known(c.lugRootWidth) && known(c.lugWidth) && c.lugPairGap + 2 * c.lugRootWidth > c.lugWidth) r.errors.push('lugPairGap plus two lugRootWidth values must fit inside lugWidth');
  if (known(c.lugToLug) && known(c.caseDiameter) && c.lugToLug < c.caseDiameter) r.errors.push('lugToLug must not be smaller than caseDiameter');
  return { status: r.errors.length ? 'invalid' : r.unknown.length ? 'unknown' : 'valid', errors: r.errors, unknownDimensions: r.unknown };
};
export const validateParametricHandV1 = (h: ParametricHandV1): ParametricValidationResult => {
  const r = collect(h); if (known(h.hub.pinionHoleDiameter) && known(h.hub.diameter) && h.hub.pinionHoleDiameter >= h.hub.diameter) r.errors.push('hub.pinionHoleDiameter must be smaller than hub.diameter');
  if (known(h.tip.length) && known(h.body.length) && h.tip.length > h.body.length) r.errors.push('tip.length must not exceed body.length');
  return { status: r.errors.length ? 'invalid' : r.unknown.length ? 'unknown' : 'valid', errors: r.errors, unknownDimensions: r.unknown };
};
