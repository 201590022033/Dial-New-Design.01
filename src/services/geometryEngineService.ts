import {
  chainConcentricBands,
  deriveGeometryContext,
  validateGeometryParameters
} from '@/domain/geometry/geometryEngine';
import type { BandEntity } from '@/domain/bands/types';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';

export const runGeometryEngine = (bands: BandEntity[], params: GlobalGeometryParameters) => {
  const context = deriveGeometryContext(params);
  const parameterWarnings = validateGeometryParameters(params);
  const chained = chainConcentricBands(bands, params);

  return {
    context,
    bands: chained.bands,
    warnings: [...parameterWarnings, ...chained.warnings]
  };
};
