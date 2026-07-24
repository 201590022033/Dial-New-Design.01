import type { BandEntity } from '@/domain/bands/types';
import type {
  ConstraintViolation,
  GlobalGeometryParameters,
  StructuredValidationResult
} from '@/domain/geometry/types';

const fromConstraint = (violation: ConstraintViolation): StructuredValidationResult => ({
  category: 'geometry',
  severity: violation.severity,
  description: violation.description,
  affectedObject: violation.affectedObject,
  suggestedFix: violation.suggestedFix
});

export const validateGeometryCategory = (violations: ConstraintViolation[]): StructuredValidationResult[] => {
  return violations.map(fromConstraint);
};

export const validateManufacturingCategory = (
  bands: BandEntity[],
  params: GlobalGeometryParameters
): StructuredValidationResult[] => {
  const results: StructuredValidationResult[] = [];

  bands.forEach((band) => {
    if (band.calculatedWidthMm < params.minimumLineWidthMm) {
      results.push({
        category: 'manufacturing',
        severity: 'error',
        description: `${band.displayName} width is under minimum line width (${params.minimumLineWidthMm}mm).`,
        affectedObject: band.id,
        suggestedFix: 'Increase width or update process limits.'
      });
    }
  });

  if (params.laserKerfMm > params.minimumLineWidthMm) {
    results.push({
      category: 'manufacturing',
      severity: 'warning',
      description: 'Laser kerf is greater than minimum line width and may collapse fine details.',
      affectedObject: 'global',
      suggestedFix: 'Increase line widths or reduce kerf assumption.'
    });
  }

  return results;
};

export const validateRenderingCategory = (bands: BandEntity[]): StructuredValidationResult[] => {
  return bands
    .filter((band) => band.style.opacity <= 0)
    .map((band) => ({
      category: 'rendering' as const,
      severity: 'warning' as const,
      description: `${band.displayName} is fully transparent and may appear missing in viewport.`,
      affectedObject: band.id,
      suggestedFix: 'Increase opacity or intentionally hide the band.'
    }));
};

export const validateMovementCompatibilityCategory = (
  params: GlobalGeometryParameters
): StructuredValidationResult[] => {
  if (params.movementDiameterMm > params.dialDiameterMm) {
    return [
      {
        category: 'movement-compatibility',
        severity: 'error',
        description: 'Movement diameter exceeds dial diameter.',
        affectedObject: 'movement',
        suggestedFix: 'Reduce movement diameter or increase dial diameter.'
      }
    ];
  }

  return [];
};

export const validateExportCompatibilityCategory = (
  bands: BandEntity[]
): StructuredValidationResult[] => {
  const disabled = bands.filter((band) => !band.exportEnabled);
  if (disabled.length === 0) {
    return [];
  }

  return [
    {
      category: 'export-compatibility',
      severity: 'info',
      description: `${disabled.length} band(s) are excluded from export package.`,
      affectedObject: 'export',
      suggestedFix: 'Enable export per band if they should be included.'
    }
  ];
};

export const validateAllCategories = (
  bands: BandEntity[],
  params: GlobalGeometryParameters,
  geometryViolations: ConstraintViolation[]
): StructuredValidationResult[] => {
  return [
    ...validateGeometryCategory(geometryViolations),
    ...validateManufacturingCategory(bands, params),
    ...validateRenderingCategory(bands),
    ...validateMovementCompatibilityCategory(params),
    ...validateExportCompatibilityCategory(bands)
  ];
};
