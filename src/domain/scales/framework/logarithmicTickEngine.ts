import type { TickGenerator } from '@/domain/scales/framework/interfaces';
import type { ScaleTick } from '@/domain/scales/types';
import { resolveLogarithmicDomain, valueFromMantissaAndDecade } from '@/domain/scales/framework/logarithmicDomainEngine';

interface TickSpec {
  offset: number;
  tier: ScaleTick['tier'];
}

interface TickDensityRule {
  secondary: boolean;
  tertiary: boolean;
  micro: boolean;
  minSecondarySpacingDeg: number;
  minTertiarySpacingDeg: number;
  minMicroSpacingDeg: number;
}

const TERTIARY_OFFSETS: number[] = [0.2, 0.4, 0.6, 0.8];
const MICRO_OFFSETS: number[] = [0.1, 0.3, 0.7, 0.9];

const rulesByProfile: Record<'sparse' | 'balanced' | 'dense' | 'ultra-dense' | 'engineering', TickDensityRule> = {
  sparse: {
    secondary: true,
    tertiary: false,
    micro: false,
    minSecondarySpacingDeg: 6,
    minTertiarySpacingDeg: 4,
    minMicroSpacingDeg: 2
  },
  balanced: {
    secondary: true,
    tertiary: true,
    micro: false,
    minSecondarySpacingDeg: 4,
    minTertiarySpacingDeg: 2,
    minMicroSpacingDeg: 1.5
  },
  dense: {
    secondary: true,
    tertiary: true,
    micro: true,
    minSecondarySpacingDeg: 3,
    minTertiarySpacingDeg: 1.5,
    minMicroSpacingDeg: 0.75
  },
  'ultra-dense': {
    secondary: true,
    tertiary: true,
    micro: true,
    minSecondarySpacingDeg: 2.2,
    minTertiarySpacingDeg: 1,
    minMicroSpacingDeg: 0.4
  },
  engineering: {
    secondary: true,
    tertiary: true,
    micro: true,
    minSecondarySpacingDeg: 2.8,
    minTertiarySpacingDeg: 1.3,
    minMicroSpacingDeg: 0.62
  }
};

const getProfile = (profile: string | undefined): TickDensityRule => {
  if (
    profile === 'sparse' ||
    profile === 'dense' ||
    profile === 'ultra-dense' ||
    profile === 'engineering'
  ) {
    return rulesByProfile[profile];
  }
  return rulesByProfile.balanced;
};

const clampCount = (value: number | undefined, fallback: number, max: number): number => {
  const source = value ?? fallback;
  if (!Number.isFinite(source)) {
    return fallback;
  }
  return Math.max(0, Math.min(max, Math.round(source)));
};

const createEvenOffsets = (count: number): number[] => {
  if (count <= 0) {
    return [];
  }

  const result: number[] = [];
  for (let index = 1; index <= count; index += 1) {
    result.push(index / (count + 1));
  }
  return result;
};

const pickOffsets = (
  preferred: number[],
  requestedCount: number,
  fallbackBuilder?: () => number[]
): number[] => {
  if (requestedCount <= 0) {
    return [];
  }

  if (requestedCount <= preferred.length) {
    return preferred.slice(0, requestedCount);
  }

  if (fallbackBuilder) {
    return fallbackBuilder();
  }

  return preferred;
};

const pushTick = (
  ticks: ScaleTick[],
  value: number,
  spec: TickSpec,
  angleDeg: number,
  radiusMm: number,
  majorTickLengthMm: number,
  minorTickLengthMm: number,
  majorTickWidthMm: number,
  minorTickWidthMm: number,
  direction: ScaleTick['direction'],
  style: ScaleTick['style']
): void => {
  const major = spec.tier === 'primary';
  const secondary = spec.tier === 'secondary';

  ticks.push({
    angleDeg,
    radiusMm,
    lengthMm: major ? majorTickLengthMm : secondary ? minorTickLengthMm * 1.25 : minorTickLengthMm,
    widthMm: major ? majorTickWidthMm : secondary ? minorTickWidthMm * 1.15 : minorTickWidthMm,
    weight: major ? 'major' : 'minor',
    direction,
    style,
    label: major ? `${Math.round(value * 1000) / 1000}` : undefined,
    value,
    tier: spec.tier
  });
};

export const createLogarithmicTickEngine = (): TickGenerator => {
  return {
    generate: ({ config, context, toAngle }) => {
      const ticks: ScaleTick[] = [];
      const majorTicks: ScaleTick[] = [];
      const minorTicks: ScaleTick[] = [];

      const domain = resolveLogarithmicDomain(config);
      if (!domain) {
        return {
          majorTicks,
          minorTicks,
          ticks,
          effectiveMinorStep: config.minorStep
        };
      }

      const profile = getProfile(config.tickDensityProfile);
      const radix = Math.max(2, Math.floor(domain.base));
      const majorStride = clampCount(config.logMajorTickDensity, 1, 12);
      const secondaryCount = clampCount(
        config.logMinorTickDensity,
        profile.secondary ? 1 : 0,
        6
      );
      const tertiaryCount = clampCount(
        config.logMicroTickDensity,
        profile.tertiary ? TERTIARY_OFFSETS.length : 0,
        8
      );
      const microCount = clampCount(
        profile.micro ? (config.logMicroTickDensity ?? MICRO_OFFSETS.length) : 0,
        profile.micro ? MICRO_OFFSETS.length : 0,
        8
      );

      const secondaryOffsets = pickOffsets([0.5, 0.33, 0.67], secondaryCount, () => createEvenOffsets(secondaryCount));
      const tertiaryOffsets = pickOffsets(TERTIARY_OFFSETS, tertiaryCount, () => createEvenOffsets(tertiaryCount));
      const microOffsets = pickOffsets(MICRO_OFFSETS, microCount, () => createEvenOffsets(microCount));

      for (let decade = domain.startDecade; decade <= domain.endDecade; decade += 1) {
        const decadeStart = domain.base ** decade;
        const decadeEnd = domain.base ** (decade + 1);

        for (let mantissaIndex = 1; mantissaIndex <= radix - 1; mantissaIndex += 1) {
          const intervalStartMantissa = mantissaIndex;
          const intervalEndMantissa = Math.min(mantissaIndex + 1, domain.base);
          const intervalStartValue = valueFromMantissaAndDecade(intervalStartMantissa, decade, domain.base);
          const intervalEndValue = valueFromMantissaAndDecade(intervalEndMantissa, decade, domain.base);

          if (intervalEndValue < domain.startValue || intervalStartValue > domain.endValue) {
            continue;
          }

          const intervalStartAngle = toAngle(intervalStartValue, config, context) + config.rotationOffsetDeg;
          const intervalEndAngle = toAngle(intervalEndValue, config, context) + config.rotationOffsetDeg;
          const spacingDeg = Math.abs(intervalEndAngle - intervalStartAngle);

          if ((mantissaIndex - 1) % majorStride === 0) {
            if (intervalStartValue >= domain.startValue && intervalStartValue <= domain.endValue) {
              pushTick(
                ticks,
                intervalStartValue,
                { offset: 0, tier: 'primary' },
                intervalStartAngle,
                config.radiusMm,
                config.majorTickLengthMm,
                config.minorTickLengthMm,
                config.majorTickWidthMm,
                config.minorTickWidthMm,
                config.tickDirection,
                config.tickStyle
              );
            }
          }

          if (profile.secondary && spacingDeg >= profile.minSecondarySpacingDeg) {
            secondaryOffsets.forEach((offset) => {
              const value = valueFromMantissaAndDecade(intervalStartMantissa + offset, decade, domain.base);
              if (value < domain.startValue || value > domain.endValue) {
                return;
              }

              const angleDeg = toAngle(value, config, context) + config.rotationOffsetDeg;
              pushTick(
                ticks,
                value,
                { offset, tier: 'secondary' },
                angleDeg,
                config.radiusMm,
                config.majorTickLengthMm,
                config.minorTickLengthMm,
                config.majorTickWidthMm,
                config.minorTickWidthMm,
                config.tickDirection,
                config.tickStyle
              );
            });
          }

          if (profile.tertiary && spacingDeg >= profile.minTertiarySpacingDeg) {
            tertiaryOffsets.forEach((offset) => {
              const value = valueFromMantissaAndDecade(intervalStartMantissa + offset, decade, domain.base);
              if (value < domain.startValue || value > domain.endValue) {
                return;
              }

              const angleDeg = toAngle(value, config, context) + config.rotationOffsetDeg;
              pushTick(
                ticks,
                value,
                { offset, tier: 'tertiary' },
                angleDeg,
                config.radiusMm,
                config.majorTickLengthMm,
                config.minorTickLengthMm,
                config.majorTickWidthMm,
                config.minorTickWidthMm,
                config.tickDirection,
                config.tickStyle
              );
            });
          }

          if (profile.micro && spacingDeg >= profile.minMicroSpacingDeg) {
            microOffsets.forEach((offset) => {
              const value = valueFromMantissaAndDecade(intervalStartMantissa + offset, decade, domain.base);
              if (value < domain.startValue || value > domain.endValue) {
                return;
              }

              const angleDeg = toAngle(value, config, context) + config.rotationOffsetDeg;
              pushTick(
                ticks,
                value,
                { offset, tier: 'micro' },
                angleDeg,
                config.radiusMm,
                config.majorTickLengthMm,
                config.minorTickLengthMm,
                config.majorTickWidthMm,
                config.minorTickWidthMm,
                config.tickDirection,
                config.tickStyle
              );
            });
          }
        }

        const boundaryValue = Math.min(decadeEnd, domain.endValue);
        if (boundaryValue >= domain.startValue && boundaryValue <= domain.endValue) {
          const boundaryAngle = toAngle(boundaryValue, config, context) + config.rotationOffsetDeg;
          pushTick(
            ticks,
            boundaryValue,
            { offset: 0, tier: 'primary' },
            boundaryAngle,
            config.radiusMm,
            config.majorTickLengthMm,
            config.minorTickLengthMm,
            config.majorTickWidthMm,
            config.minorTickWidthMm,
            config.tickDirection,
            config.tickStyle
          );
        }

        if (decadeStart >= domain.startValue && decadeStart <= domain.endValue) {
          const startAngle = toAngle(decadeStart, config, context) + config.rotationOffsetDeg;
          pushTick(
            ticks,
            decadeStart,
            { offset: 0, tier: 'primary' },
            startAngle,
            config.radiusMm,
            config.majorTickLengthMm,
            config.minorTickLengthMm,
            config.majorTickWidthMm,
            config.minorTickWidthMm,
            config.tickDirection,
            config.tickStyle
          );
        }
      }

      const deduped = new Map<string, ScaleTick>();
      ticks.forEach((tick) => {
        const key = `${tick.value?.toFixed(4) ?? 'n/a'}:${tick.tier ?? 'none'}`;
        deduped.set(key, tick);
      });

      const merged = [...deduped.values()].sort((left, right) => left.angleDeg - right.angleDeg);
      merged.forEach((tick) => {
        if (tick.weight === 'major') {
          majorTicks.push(tick);
        } else {
          minorTicks.push(tick);
        }
      });

      return {
        majorTicks,
        minorTicks,
        ticks: merged,
        effectiveMinorStep: config.minorStep
      };
    }
  };
};
