import type { ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';
import type { MathematicalScale } from '@/domain/scales/framework/interfaces';
import { circularAngleForRatio, linearInterpolate } from '@/domain/scales/math';

const safeLog10 = (value: number): number => Math.log10(Math.max(value, Number.EPSILON));

abstract class AbstractMathematicalScale implements MathematicalScale {
  abstract model: MathematicalScale['model'];

  protected toAngleFromRatio(
    ratio: number,
    config: ScalePluginConfig,
    context: ScaleMathContext
  ): number {
    return circularAngleForRatio(ratio, context, config.direction);
  }

  abstract valueToAngle(
    value: number,
    config: ScalePluginConfig,
    context: ScaleMathContext
  ): number;

  validateDomain(config: ScalePluginConfig): string[] {
    void config;
    return [];
  }
}

export class LinearScaleMathematics extends AbstractMathematicalScale {
  model: MathematicalScale['model'] = 'linear';

  valueToAngle(value: number, config: ScalePluginConfig, context: ScaleMathContext): number {
    const ratio = linearInterpolate(value, config.startValue, config.endValue);
    return this.toAngleFromRatio(ratio, config, context);
  }
}

export class LogarithmicScaleMathematics extends AbstractMathematicalScale {
  model: MathematicalScale['model'] = 'logarithmic';

  valueToAngle(value: number, config: ScalePluginConfig, context: ScaleMathContext): number {
    const ratio = linearInterpolate(
      safeLog10(value),
      safeLog10(config.startValue),
      safeLog10(config.endValue)
    );
    return this.toAngleFromRatio(ratio, config, context);
  }

  validateDomain(config: ScalePluginConfig): string[] {
    const warnings: string[] = [];
    if (config.startValue <= 0 || config.endValue <= 0) {
      warnings.push('Logarithmic scales require start and end values greater than zero.');
    }
    return warnings;
  }
}

export class RatioScaleMathematics extends AbstractMathematicalScale {
  model: MathematicalScale['model'] = 'ratio';

  valueToAngle(value: number, config: ScalePluginConfig, context: ScaleMathContext): number {
    const denominator = Math.max(Number.EPSILON, config.endValue);
    const ratio = value / denominator;
    return this.toAngleFromRatio(ratio, config, context);
  }
}

export class TimeScaleMathematics extends AbstractMathematicalScale {
  model: MathematicalScale['model'] = 'time';

  valueToAngle(value: number, config: ScalePluginConfig, context: ScaleMathContext): number {
    const normalized = linearInterpolate(value, config.startValue, config.endValue);
    return this.toAngleFromRatio(normalized, config, context);
  }
}

export class DistanceScaleMathematics extends AbstractMathematicalScale {
  model: MathematicalScale['model'] = 'distance';

  valueToAngle(value: number, config: ScalePluginConfig, context: ScaleMathContext): number {
    const normalized = linearInterpolate(value, config.startValue, config.endValue);
    return this.toAngleFromRatio(normalized, config, context);
  }
}
