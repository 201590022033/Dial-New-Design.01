import type { ScaleLabel, ScalePluginConfig, ScaleTick, ScaleValidationResult } from '@/domain/scales/types';

export const validateScale = (
  config: ScalePluginConfig,
  ticks: ScaleTick[],
  labels: ScaleLabel[]
): ScaleValidationResult => {
  const warnings: string[] = [];

  if (config.endValue <= config.startValue) {
    warnings.push('End value must be greater than start value.');
  }
  if (config.minorStep <= 0 || config.majorStep <= 0) {
    warnings.push('Tick intervals must be positive.');
  }
  if (config.minorStep > config.majorStep) {
    warnings.push('Minor tick interval should not exceed major tick interval.');
  }
  if (config.radiusMm <= 0) {
    warnings.push('Radius must be positive.');
  }
  if (ticks.length > 0) {
    const overlapCount = ticks
      .slice(1)
      .filter((tick, index) => {
        const previous = ticks[index];
        if (!previous) {
          return false;
        }
        return Math.abs(tick.angleDeg - previous.angleDeg) < 0.0001;
      }).length;
    if (overlapCount > 0) {
      warnings.push('Tick overlap detected from angle collisions.');
    }
  }

  if (labels.length > 0 && labels.length > ticks.length) {
    warnings.push('Label generation produced invalid density.');
  }

  if (config.radiusMm > config.bandOuterRadiusMm || config.radiusMm < config.bandInnerRadiusMm) {
    warnings.push('Scale radius is outside selected band bounds.');
  }

  if (config.minorTickWidthMm < config.minimumLineWidthMm || config.majorTickWidthMm < config.minimumLineWidthMm) {
    warnings.push('Tick width violates manufacturing minimum line width.');
  }

  return {
    valid: warnings.length === 0,
    warnings,
    structuredWarnings: warnings.map((warning) => ({
      severity: warning.includes('violates') ? 'error' : 'warning',
      description: warning,
      affectedObject: 'scale-generator',
      suggestedFix: 'Adjust scale intervals, radius, or manufacturing limits in inspector.'
    }))
  };
};
