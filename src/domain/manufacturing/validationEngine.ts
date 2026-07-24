import type { BandEntity } from '@/domain/bands/types';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';

export interface ManufacturingWarning {
  level: 'warning' | 'error';
  code:
    | 'MIN_LINE_WIDTH'
    | 'TICK_SPACING'
    | 'TEXT_LEGIBILITY'
    | 'HOLE_SPACING'
    | 'TOLERANCE'
    | 'LASER_KERF'
    | 'UV_LIMIT'
    | 'OVERLAP'
    | 'INVALID_CONCENTRIC';
  message: string;
  bandId?: string;
}

export interface ManufacturingValidationResult {
  valid: boolean;
  warnings: ManufacturingWarning[];
}

export const validateManufacturing = (
  bands: BandEntity[],
  params: GlobalGeometryParameters
): ManufacturingValidationResult => {
  const warnings: ManufacturingWarning[] = [];

  bands.forEach((band, index) => {
    if (band.calculatedWidthMm < params.minimumLineWidthMm) {
      warnings.push({
        level: 'error',
        code: 'MIN_LINE_WIDTH',
        message: `${band.displayName} width is below minimum line width (${params.minimumLineWidthMm}mm).`,
        bandId: band.id
      });
    }

    if (band.innerDiameterMm > band.outerDiameterMm) {
      warnings.push({
        level: 'error',
        code: 'INVALID_CONCENTRIC',
        message: `${band.displayName} has invalid concentric geometry.`,
        bandId: band.id
      });
    }

    if (index > 0) {
      const previous = bands[index - 1];
      if (previous && band.innerDiameterMm < previous.outerDiameterMm) {
        warnings.push({
          level: 'error',
          code: 'OVERLAP',
          message: `${band.displayName} overlaps ${previous.displayName}.`,
          bandId: band.id
        });
      }
    }
  });

  if (params.minimumTextSizePt < 5) {
    warnings.push({
      level: 'warning',
      code: 'TEXT_LEGIBILITY',
      message: 'Text legibility risk: minimum text size is below 5pt.'
    });
  }

  if (params.laserKerfMm > params.minimumLineWidthMm) {
    warnings.push({
      level: 'warning',
      code: 'LASER_KERF',
      message: 'Laser kerf exceeds minimum line width; narrow details may collapse.'
    });
  }

  if (params.manufacturingToleranceMm > 0.15) {
    warnings.push({
      level: 'warning',
      code: 'TOLERANCE',
      message: 'Manufacturing tolerance is high and may impact concentric alignment.'
    });
  }

  return {
    valid: !warnings.some((warning) => warning.level === 'error'),
    warnings
  };
};
