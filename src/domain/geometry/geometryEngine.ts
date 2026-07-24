import type { BandEntity } from '@/domain/bands/types';
import type {
  DerivedGeometryContext,
  GeometryWarning,
  GlobalGeometryParameters
} from '@/domain/geometry/types';

export const defaultGeometryParameters: GlobalGeometryParameters = {
  caseDiameterMm: 42,
  caseThicknessMm: 12,
  dialDiameterMm: 38,
  movementDiameterMm: 30.5,
  manufacturingToleranceMm: 0.05,
  laserKerfMm: 0.08,
  minimumLineWidthMm: 0.1,
  minimumTextSizePt: 5,
  bandSpacingMm: 0.15
};

export const deriveGeometryContext = (params: GlobalGeometryParameters): DerivedGeometryContext => {
  const caseRadiusMm = params.caseDiameterMm / 2;
  const dialRadiusMm = Math.min(params.dialDiameterMm / 2, caseRadiusMm);
  const movementRadiusMm = Math.min(params.movementDiameterMm / 2, dialRadiusMm);
  const usableBandRadiusMm = Math.max(0, dialRadiusMm - params.manufacturingToleranceMm);

  return {
    caseRadiusMm,
    dialRadiusMm,
    movementRadiusMm,
    usableBandRadiusMm
  };
};

export const validateGeometryParameters = (params: GlobalGeometryParameters): GeometryWarning[] => {
  const warnings: GeometryWarning[] = [];

  if (params.caseDiameterMm <= 0) {
    warnings.push({
      code: 'DIAMETER_OUT_OF_RANGE',
      message: 'Case diameter must be greater than zero.',
      severity: 'error'
    });
  }

  if (params.dialDiameterMm > params.caseDiameterMm) {
    warnings.push({
      code: 'DIAL_EXCEEDS_CASE',
      message: 'Dial diameter exceeds case diameter; dial was clamped.',
      severity: 'warning'
    });
  }

  if (params.movementDiameterMm > params.dialDiameterMm) {
    warnings.push({
      code: 'MOVEMENT_EXCEEDS_DIAL',
      message: 'Movement diameter exceeds dial diameter; movement was clamped.',
      severity: 'warning'
    });
  }

  if (params.minimumLineWidthMm <= 0) {
    warnings.push({
      code: 'LINE_WIDTH_UNDER_MIN',
      message: 'Minimum line width must be positive.',
      severity: 'error'
    });
  }

  if (params.minimumTextSizePt < 4) {
    warnings.push({
      code: 'TEXT_SIZE_UNDER_MIN',
      message: 'Text below 4pt can become illegible in manufacturing outputs.',
      severity: 'warning'
    });
  }

  return warnings;
};

export interface ChainedBandsResult {
  bands: BandEntity[];
  warnings: GeometryWarning[];
}

export const chainConcentricBands = (
  sourceBands: BandEntity[],
  params: GlobalGeometryParameters
): ChainedBandsResult => {
  const context = deriveGeometryContext(params);
  const warnings = validateGeometryParameters(params);
  let currentInner = 0;

  const bands = sourceBands
    .slice()
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((band) => {
      const currentWidth = Math.max(0.05, band.outerDiameterMm - band.innerDiameterMm);
      const innerDiameterMm = currentInner * 2;
      let outerDiameterMm = innerDiameterMm + currentWidth * 2;

      if (outerDiameterMm / 2 > context.usableBandRadiusMm) {
        warnings.push({
          code: 'BAND_OVERFLOW',
          message: `${band.displayName} exceeded available dial radius and was clamped.`,
          severity: 'warning'
        });
        outerDiameterMm = context.usableBandRadiusMm * 2;
      }

      const updated = {
        ...band,
        innerDiameterMm,
        outerDiameterMm,
        calculatedWidthMm: Math.max(0, (outerDiameterMm - innerDiameterMm) / 2),
        geometry: {
          innerRadius: innerDiameterMm / 2,
          outerRadius: outerDiameterMm / 2
        }
      };

      currentInner = updated.outerDiameterMm / 2 + params.bandSpacingMm;
      return updated;
    });

  return { bands, warnings };
};
