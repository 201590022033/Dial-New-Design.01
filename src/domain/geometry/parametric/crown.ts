import type { DimensionMm } from './types';
import type { GeometryProvenance } from './placement';
import type { ParametricValidationResult } from './validation';

export const PARAMETRIC_CROWN_V1 = 'parametric-crown/v1' as const;
/** Removable head only. Origin = rear face/socket entrance; local +X points outwards.
 * The case owns its boss and tube. The socket is a blind visual bore, not a thread.
 */
export interface ParametricCrownV1 {
  schema: typeof PARAMETRIC_CROWN_V1;
  provenance: GeometryProvenance;
  /** Base head diameter; grip adds up to gripDepthMm radially. */
  headDiameterMm: DimensionMm;
  headLengthMm: DimensionMm;
  socketDiameterMm: DimensionMm;
  socketDepthMm: DimensionMm;
  gripDepthMm: DimensionMm;
  gripCount: number;
  stemThreadPitchMm: DimensionMm;
  attachment: { anchor: 'crown-interface'; axialGapMm: DimensionMm };
}

export const validateParametricCrownV1 = (input: unknown): ParametricValidationResult => {
  const errors: string[] = [], unknownDimensions: string[] = [];
  const c = (input && typeof input === 'object' ? input : {}) as Partial<ParametricCrownV1>;
  if (c.schema !== PARAMETRIC_CROWN_V1) errors.push('schema must be parametric-crown/v1');
  if (!['provisional', 'specified'].includes(c.provenance?.status ?? '') || typeof c.provenance?.source !== 'string' || !c.provenance.source.trim()) errors.push('provenance is required');
  const dimension = (path: string, value: unknown, zero = false) => {
    if (value && typeof value === 'object' && 'status' in value && value.status === 'unknown') unknownDimensions.push(path);
    else if (typeof value !== 'number' || !Number.isFinite(value) || (zero ? value < 0 : value <= 0)) errors.push(`${path} must be ${zero ? 'non-negative' : 'positive'} or explicitly unknown`);
  };
  for (const key of ['headDiameterMm', 'headLengthMm', 'socketDiameterMm', 'socketDepthMm', 'stemThreadPitchMm'] as const) dimension(key, c[key]);
  dimension('gripDepthMm', c.gripDepthMm, true);
  dimension('attachment.axialGapMm', c.attachment?.axialGapMm, true);
  if (c.attachment?.anchor !== 'crown-interface') errors.push('attachment.anchor must be crown-interface');
  if (!Number.isInteger(c.gripCount) || c.gripCount! < 0 || c.gripCount! > 256) errors.push('gripCount must be an integer from 0 to 256');
  if (typeof c.socketDiameterMm === 'number' && typeof c.headDiameterMm === 'number' && c.socketDiameterMm >= c.headDiameterMm) errors.push('socketDiameterMm must be smaller than headDiameterMm');
  if (typeof c.socketDepthMm === 'number' && typeof c.headLengthMm === 'number' && c.socketDepthMm >= c.headLengthMm) errors.push('socketDepthMm must be smaller than headLengthMm');
  if (typeof c.gripDepthMm === 'number' && typeof c.headDiameterMm === 'number' && c.gripDepthMm >= c.headDiameterMm / 4) errors.push('gripDepthMm must be smaller than headDiameterMm / 4');
  return { status: errors.length ? 'invalid' : unknownDimensions.length ? 'unknown' : 'valid', errors, unknownDimensions };
};
