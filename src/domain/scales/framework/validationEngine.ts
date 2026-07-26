import type {
  ScaleValidator,
  ScaleValidatorInput,
  ScaleValidatorResult
} from '@/domain/scales/framework/interfaces';

const hasDuplicateLabels = (labels: ScaleValidatorInput['labels']): boolean => {
  const seen = new Set<string>();
  for (const label of labels) {
    const key = `${label.text}:${label.angleDeg.toFixed(4)}:${label.radiusMm.toFixed(4)}`;
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
  }
  return false;
};

const hasAngularOverlap = (ticks: ScaleValidatorInput['ticks']): boolean => {
  if (ticks.length < 2) {
    return false;
  }

  const sorted = [...ticks].sort((left, right) => left.angleDeg - right.angleDeg);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (!previous || !current) {
      continue;
    }
    if (Math.abs(current.angleDeg - previous.angleDeg) < 0.0001) {
      return true;
    }
  }

  return false;
};

export const createScaleValidationEngine = (): ScaleValidator => {
  return {
    validate: ({ config, ticks, labels, domainWarnings, collisions }: ScaleValidatorInput): ScaleValidatorResult => {
      const issues: ScaleValidatorResult['issues'] = [];

      if (config.endValue <= config.startValue) {
        issues.push({
          severity: 'error',
          code: 'INVALID_RANGE',
          message: 'End value must be greater than start value.',
          affectedObject: 'scale-generator',
          suggestedFix: 'Increase end value or lower start value.'
        });
      }

      if (config.minorStep <= 0 || config.majorStep <= 0) {
        issues.push({
          severity: 'error',
          code: 'INVALID_TICK_SPACING',
          message: 'Tick intervals must be positive.',
          affectedObject: 'scale-generator',
          suggestedFix: 'Set positive major and minor tick intervals.'
        });
      }

      if (config.minorStep > config.majorStep) {
        issues.push({
          severity: 'warning',
          code: 'INVALID_TICK_SPACING',
          message: 'Minor tick interval should not exceed major tick interval.',
          affectedObject: 'scale-generator',
          suggestedFix: 'Decrease minor step or increase major step.'
        });
      }

      if (ticks.length === 0) {
        issues.push({
          severity: 'error',
          code: 'INVALID_TICK_SPACING',
          message: 'No ticks were generated for the current configuration.',
          affectedObject: 'scale-generator',
          suggestedFix: 'Adjust value range and tick intervals.'
        });
      }

      if (labels.length === 0 && ticks.some((tick) => tick.weight === 'major')) {
        issues.push({
          severity: 'warning',
          code: 'MISSING_LABELS',
          message: 'Major ticks exist but no labels were generated.',
          affectedObject: 'scale-generator',
          suggestedFix: 'Reduce label frequency or update label placement.'
        });
      }

      if (hasDuplicateLabels(labels)) {
        issues.push({
          severity: 'warning',
          code: 'DUPLICATE_LABELS',
          message: 'Duplicate labels detected at matching positions.',
          affectedObject: 'scale-generator',
          suggestedFix: 'Adjust label frequency, range, or orientation.'
        });
      }

      if (hasAngularOverlap(ticks)) {
        issues.push({
          severity: 'warning',
          code: 'ANGULAR_OVERLAP',
          message: 'Tick overlap detected from angular collisions.',
          affectedObject: 'scale-generator',
          suggestedFix: 'Increase arc span or increase tick interval.'
        });
      }

      if (config.radiusMm > config.bandOuterRadiusMm || config.radiusMm < config.bandInnerRadiusMm) {
        issues.push({
          severity: 'warning',
          code: 'OUTSIDE_BAND',
          message: 'Scale radius is outside selected band bounds.',
          affectedObject: 'scale-generator',
          suggestedFix: 'Adjust radius or sync from selected band.'
        });
      }

      if (config.minorTickWidthMm < config.minimumLineWidthMm || config.majorTickWidthMm < config.minimumLineWidthMm) {
        issues.push({
          severity: 'error',
          code: 'MANUFACTURING_LIMIT',
          message: 'Tick width violates manufacturing minimum line width.',
          affectedObject: 'scale-generator',
          suggestedFix: 'Increase major/minor tick width.'
        });
      }

      (domainWarnings ?? []).forEach((warning) => {
        issues.push({
          severity: 'error',
          code: 'INVALID_DOMAIN',
          message: warning,
          affectedObject: 'scale-generator',
          suggestedFix: 'Adjust start/end values to satisfy mathematical domain.'
        });
      });

      (collisions ?? []).forEach((collision) => {
        issues.push({
          severity: collision.severity,
          code:
            collision.kind === 'boundary-overflow' || collision.kind === 'label-boundary'
              ? 'OUTSIDE_BAND'
              : 'ANGULAR_OVERLAP',
          message: collision.message,
          affectedObject: 'scale-generator',
          suggestedFix: 'Adjust spacing, radius, or label placement.'
        });
      });

      const warnings = issues.map((issue) => issue.message);
      const valid = !issues.some((issue) => issue.severity === 'error');

      return {
        valid,
        warnings,
        issues
      };
    }
  };
};
