import { validateManufacturing } from '@/domain/manufacturing/validationEngine';
import type { BandEntity } from '@/domain/bands/types';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';

export const runManufacturingValidation = (bands: BandEntity[], params: GlobalGeometryParameters) => {
  return validateManufacturing(bands, params);
};
