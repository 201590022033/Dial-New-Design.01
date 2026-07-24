import type { BandEntity } from '@/domain/bands/types';
import type {
  ConstraintViolation,
  DerivedGeometryContext,
  GlobalGeometryParameters
} from '@/domain/geometry/types';

const pushViolation = (
  violations: ConstraintViolation[],
  violation: ConstraintViolation
): void => {
  violations.push(violation);
};

export const evaluateGeometryConstraints = (
  bands: BandEntity[],
  params: GlobalGeometryParameters,
  context: DerivedGeometryContext
): ConstraintViolation[] => {
  const violations: ConstraintViolation[] = [];
  const minBandWidth = Math.max(params.minimumLineWidthMm, 0.2);
  const maxBandWidth = Math.max(1, params.caseDiameterMm / 3);

  bands.forEach((band, index) => {
    const width = band.calculatedWidthMm;

    if (width < 0) {
      pushViolation(violations, {
        code: 'NEGATIVE_WIDTH',
        severity: 'error',
        affectedObject: band.id,
        description: `${band.displayName} has a negative width.`,
        suggestedFix: 'Increase outer diameter above inner diameter.'
      });
    }

    if (width < minBandWidth) {
      pushViolation(violations, {
        code: 'MIN_BAND_WIDTH',
        severity: 'warning',
        affectedObject: band.id,
        description: `${band.displayName} width is below the minimum engineering width (${minBandWidth.toFixed(2)}mm).`,
        suggestedFix: 'Increase band width or lower minimum line width if process allows.'
      });
    }

    if (width > maxBandWidth) {
      pushViolation(violations, {
        code: 'MAX_BAND_WIDTH',
        severity: 'warning',
        affectedObject: band.id,
        description: `${band.displayName} width exceeds maximum recommended width (${maxBandWidth.toFixed(2)}mm).`,
        suggestedFix: 'Reduce band width or increase case diameter.'
      });
    }

    if (band.innerDiameterMm < 0 || band.outerDiameterMm <= 0) {
      pushViolation(violations, {
        code: 'INVALID_DIAMETER',
        severity: 'error',
        affectedObject: band.id,
        description: `${band.displayName} has invalid diameter values.`,
        suggestedFix: 'Reset geometry and apply valid positive diameters.'
      });
    }

    if (band.innerDiameterMm > band.outerDiameterMm) {
      pushViolation(violations, {
        code: 'INVALID_DIAMETER',
        severity: 'error',
        affectedObject: band.id,
        description: `${band.displayName} inner diameter exceeds outer diameter.`,
        suggestedFix: 'Set inner diameter below outer diameter.'
      });
    }

    if (band.outerDiameterMm / 2 > context.caseRadiusMm) {
      pushViolation(violations, {
        code: 'OUTSIDE_CASE',
        severity: 'error',
        affectedObject: band.id,
        description: `${band.displayName} extends outside case radius.`,
        suggestedFix: 'Reduce band dimensions or increase case diameter.'
      });
    }

    if (index > 0) {
      const previous = bands[index - 1];
      if (!previous) {
        return;
      }
      const clearance = band.innerDiameterMm / 2 - previous.outerDiameterMm / 2;
      if (clearance < params.bandGapMm) {
        pushViolation(violations, {
          code: 'MIN_CLEARANCE',
          severity: 'warning',
          affectedObject: band.id,
          description: `${band.displayName} clearance (${clearance.toFixed(3)}mm) is below required gap (${params.bandGapMm.toFixed(3)}mm).`,
          suggestedFix: 'Increase gap or reduce neighbouring widths.'
        });
      }

      if (clearance < 0) {
        pushViolation(violations, {
          code: 'BAND_OVERLAP',
          severity: 'error',
          affectedObject: band.id,
          description: `${band.displayName} overlaps with ${previous.displayName}.`,
          suggestedFix: 'Adjust chain widths to remove overlap.'
        });
      }
    }
  });

  if (params.movementCentreHoleMm <= 0 || params.movementCentreHoleMm >= params.movementDiameterMm) {
    pushViolation(violations, {
      code: 'INVALID_HOLE_SIZE',
      severity: 'error',
      affectedObject: 'movement-centre-hole',
      description: 'Movement centre hole size is invalid against movement diameter.',
      suggestedFix: 'Set center hole to a positive size lower than movement diameter.'
    });
  }

  return violations;
};
