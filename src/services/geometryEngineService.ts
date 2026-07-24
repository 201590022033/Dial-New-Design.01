import { runGeometryEngine as runParametricGeometryEngine } from '@/domain/geometry/geometryEngine';
import type { BandEntity } from '@/domain/bands/types';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';

export const runGeometryEngine = (bands: BandEntity[], params: GlobalGeometryParameters) => {
  return runParametricGeometryEngine(bands, params);
};
