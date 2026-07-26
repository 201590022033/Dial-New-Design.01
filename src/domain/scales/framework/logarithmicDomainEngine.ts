import type { ScalePluginConfig } from '@/domain/scales/types';

export interface LogarithmicDomainState {
  startValue: number;
  endValue: number;
  base: number;
  logStart: number;
  logEnd: number;
  startDecade: number;
  endDecade: number;
}

const logWithBase = (value: number, base: number): number => Math.log(value) / Math.log(base);

const clampBase = (input: number | undefined): number => {
  if (!input || !Number.isFinite(input)) {
    return 10;
  }
  return input > 1 ? input : 10;
};

export const resolveLogarithmicDomain = (config: ScalePluginConfig): LogarithmicDomainState | null => {
  const startValue = config.startValue;
  const base = clampBase(config.logarithmicBase);

  if (!Number.isFinite(startValue) || startValue <= 0) {
    return null;
  }

  let endValue = config.endValue;
  if (!Number.isFinite(endValue) || endValue <= startValue) {
    return null;
  }

  const requestedDecades = config.logarithmicDecades ?? 0;
  if (requestedDecades > 0) {
    const maxByDecade = startValue * base ** requestedDecades;
    endValue = Math.min(endValue, maxByDecade);
  }

  const logStart = logWithBase(startValue, base);
  const logEnd = logWithBase(endValue, base);

  if (!Number.isFinite(logStart) || !Number.isFinite(logEnd) || logEnd <= logStart) {
    return null;
  }

  const startDecade = Math.floor(logStart);
  const endDecade = Math.ceil(logEnd) - 1;

  return {
    startValue,
    endValue,
    base,
    logStart,
    logEnd,
    startDecade,
    endDecade
  };
};

export const valueFromMantissaAndDecade = (mantissa: number, decade: number, base: number): number => {
  return mantissa * base ** decade;
};
