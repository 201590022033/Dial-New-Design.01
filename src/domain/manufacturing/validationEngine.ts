import type { BandEntity } from '@/domain/bands/types';
import type { CollisionWarning } from '@/domain/geometry/collisionEngine';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';
import type { MaterialDefinition } from '@/domain/materials/materialLibrary';

export interface ManufacturingWarning {
  level: 'warning' | 'error';
  code:
    | 'MIN_LINE_WIDTH'
    | 'TICK_SPACING'
    | 'TEXT_LEGIBILITY'
    | 'TEXT_TOO_SMALL'
    | 'HOLE_SPACING'
    | 'TOLERANCE'
    | 'LASER_KERF'
    | 'MIN_UV_PRINT'
    | 'LINES_TOO_THIN'
    | 'UV_LIMIT'
    | 'OVERLAP'
    | 'INVALID_CONCENTRIC'
    | 'SCALE_OVERLAP'
    | 'MARKER_OVERLAP'
    | 'SUBDIAL_OVERLAP'
    | 'DATE_COLLISION'
    | 'OUTSIDE_PRINTABLE_AREA'
    | 'UNSUPPORTED_MATERIAL'
    | 'INVALID_TOLERANCE';
  message: string;
  bandId?: string;
}

export interface ManufacturingValidationResult {
  valid: boolean;
  warnings: ManufacturingWarning[];
}

export const validateManufacturing = (
  bands: BandEntity[],
  params: GlobalGeometryParameters,
  options?: {
    minimumUvPrintWidthMm?: number;
    minimumTextHeightMm?: number;
    printableAreaDiameterMm?: number;
    selectedMaterial?: MaterialDefinition | null;
    collisions?: CollisionWarning[];
  }
): ManufacturingValidationResult => {
  const warnings: ManufacturingWarning[] = [];
  const minimumUvPrintWidth = options?.minimumUvPrintWidthMm ?? 0.12;
  const minimumTextHeight = options?.minimumTextHeightMm ?? params.minimumTextHeightMm;
  const printableAreaDiameter = options?.printableAreaDiameterMm ?? params.dialDiameterMm;

  bands.forEach((band, index) => {
    if (band.calculatedWidthMm < params.minimumLineWidthMm) {
      warnings.push({
        level: 'error',
        code: 'MIN_LINE_WIDTH',
        message: `${band.displayName} width is below minimum line width (${params.minimumLineWidthMm}mm).`,
        bandId: band.id
      });

      warnings.push({
        level: 'warning',
        code: 'LINES_TOO_THIN',
        message: `${band.displayName} contains lines below recommended manufacturing thickness.`,
        bandId: band.id
      });
    }

    if (band.style.strokeWidth < minimumUvPrintWidth * 10) {
      warnings.push({
        level: 'warning',
        code: 'MIN_UV_PRINT',
        message: `${band.displayName} stroke may be below UV print process minimum (${minimumUvPrintWidth}mm equivalent).`,
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

  if (params.minimumTextHeightMm < 1.2) {
    warnings.push({
      level: 'warning',
      code: 'TEXT_LEGIBILITY',
      message: 'Text legibility risk: minimum text height is below 1.2mm.'
    });
  }

  if (minimumTextHeight < 1.2) {
    warnings.push({
      level: 'warning',
      code: 'TEXT_TOO_SMALL',
      message: `Configured text height (${minimumTextHeight}mm) is below recommended minimum for production.`
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

  if (params.manufacturingToleranceMm < 0 || params.manufacturingToleranceMm > 0.2) {
    warnings.push({
      level: 'error',
      code: 'INVALID_TOLERANCE',
      message: 'Manufacturing tolerance value is outside supported range (0 - 0.2mm).'
    });
  }

  if (options?.selectedMaterial && !options.selectedMaterial.uvSuitable && bands.some((band) => band.material === options.selectedMaterial?.id)) {
    warnings.push({
      level: 'warning',
      code: 'UNSUPPORTED_MATERIAL',
      message: `${options.selectedMaterial.name} has limited UV suitability for current process assumptions.`
    });
  }

  if (bands.some((band) => band.outerDiameterMm > printableAreaDiameter)) {
    warnings.push({
      level: 'error',
      code: 'OUTSIDE_PRINTABLE_AREA',
      message: 'One or more bands exceed printable area limits.'
    });
  }

  options?.collisions?.forEach((collision) => {
    const collisionMap: Partial<Record<CollisionWarning['code'], ManufacturingWarning['code']>> = {
      TICK_TICK: 'SCALE_OVERLAP',
      MARKER_MARKER: 'MARKER_OVERLAP',
      SUBDIAL_OVERLAP: 'SUBDIAL_OVERLAP',
      DATE_COLLISION: 'DATE_COLLISION',
      OUTSIDE_PRINTABLE_AREA: 'OUTSIDE_PRINTABLE_AREA'
    };

    const mapped = collisionMap[collision.code];
    if (!mapped) {
      return;
    }

    warnings.push({
      level: collision.severity === 'error' ? 'error' : 'warning',
      code: mapped,
      message: collision.message
    });
  });

  return {
    valid: !warnings.some((warning) => warning.level === 'error'),
    warnings
  };
};
