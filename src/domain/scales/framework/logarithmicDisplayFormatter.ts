import type { ScalePluginConfig, ScaleTick } from '@/domain/scales/types';

const trimZeros = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) {
    return value.toExponential(2);
  }

  const rounded = Number(value.toFixed(6));
  return `${rounded}`;
};

const formatScientific = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  return value.toExponential(2);
};

const logWithBase = (value: number, base: number): number => Math.log(value) / Math.log(base);

const resolveMantissa = (value: number, base: number): number => {
  const exponent = Math.floor(logWithBase(value, base));
  return value / base ** exponent;
};

export const formatLogarithmicLabel = (
  value: number,
  tier: ScaleTick['tier'],
  config: ScalePluginConfig
): string => {
  const multiplier = config.logarithmicDisplayMultiplier ?? 1;
  const format = config.logarithmicDisplayFormat ?? 'engineering';
  const labelStyle = config.logarithmicLabelStyle ?? 'value';
  const base = config.logarithmicBase ?? 10;
  const displayed = value * multiplier;

  if (labelStyle === 'scientific' || format === 'scientific') {
    return formatScientific(displayed);
  }

  if (labelStyle === 'mantissa' || format === 'navitimer' || format === 'slide-rule') {
    const mantissa = resolveMantissa(displayed, base);
    const mantissaDigits = tier === 'primary' ? 3 : 2;
    return trimZeros(Number(mantissa.toFixed(mantissaDigits)));
  }

  if (format === 'custom') {
    const digits = tier === 'primary' ? 4 : 3;
    return trimZeros(Number(displayed.toFixed(digits)));
  }

  const defaultDigits = tier === 'primary' ? 3 : 2;
  return trimZeros(Number(displayed.toFixed(defaultDigits)));
};
