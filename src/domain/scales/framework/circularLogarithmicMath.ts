import type { ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';
import type { MathematicalScale } from '@/domain/scales/framework/interfaces';
import {
  type CircularProjectionContext,
  normalizeAngularPosition,
  projectNormalizedToRadius
} from '@/domain/scales/framework/circularProjection';

export interface CircularLogProjection {
  value: number;
  normalized: number;
  angleDeg: number;
  coordinate: {
    x: number;
    y: number;
    radiusMm: number;
  };
}

const logBase = (value: number, base: number): number => Math.log(value) / Math.log(base);

const toProjectionContext = (
  config: ScalePluginConfig,
  context: ScaleMathContext
): CircularProjectionContext => ({
  startAngleDeg: context.startAngleDeg,
  endAngleDeg: context.endAngleDeg,
  direction: config.direction,
  rotationOffsetDeg: config.rotationOffsetDeg
});

export class CircularLogarithmicMathematics implements MathematicalScale {
  model: MathematicalScale['model'] = 'logarithmic';

  normalizeValue(value: number, config: ScalePluginConfig): number {
    const base = config.logarithmicBase ?? 10;

    const start = config.startValue;
    const end = config.endValue;

    const numerator = logBase(value, base) - logBase(start, base);
    const denominator = logBase(end, base) - logBase(start, base);

    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return Number.NaN;
    }

    return numerator / denominator;
  }

  valueToAngle(value: number, config: ScalePluginConfig, context: ScaleMathContext): number {
    const normalized = this.normalizeValue(value, config);
    return normalizeAngularPosition(normalized, toProjectionContext(config, context));
  }

  projectValueToCoordinate(
    value: number,
    config: ScalePluginConfig,
    context: ScaleMathContext,
    radiusMm = config.radiusMm
  ): CircularLogProjection {
    const normalized = this.normalizeValue(value, config);
    const projection = projectNormalizedToRadius(normalized, radiusMm, toProjectionContext(config, context));

    return {
      value,
      normalized,
      angleDeg: projection.angleDeg,
      coordinate: {
        x: projection.coordinate.x,
        y: projection.coordinate.y,
        radiusMm
      }
    };
  }

  validateDomain(config: ScalePluginConfig): string[] {
    const warnings: string[] = [];
    const base = config.logarithmicBase ?? 10;

    if (base <= 0 || base === 1) {
      warnings.push('Logarithmic base must be positive and cannot equal 1.');
    }

    if (config.startValue <= 0 || config.endValue <= 0) {
      warnings.push('Logarithmic scales require start and end values greater than zero.');
    }

    if (config.startValue >= config.endValue) {
      warnings.push('Logarithmic scale start value must be less than end value.');
    }

    return warnings;
  }
}
