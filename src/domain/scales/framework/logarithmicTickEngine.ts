import type { TickGenerator } from '@/domain/scales/framework/interfaces';
import { applyEngineeringProfile } from '@/domain/scales/framework/projectionProfileEngine';
import { getProjection, resolveProjectionKindFromConfig } from '@/domain/scales/framework/projectionEngine';
import type { ScalePluginConfig, ScaleTick } from '@/domain/scales/types';

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

const projectionFamiliesWithDecadeMode = new Set([
  'logarithmic',
  'reciprocal-logarithmic',
  'natural-log',
  'log-log',
  'exponential'
]);

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
  if (!Number.isFinite(value) || value <= 0) {
    return;
  }

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

const dedupeAndSortTicks = (ticks: ScaleTick[]): ScaleTick[] => {
  const deduped = new Map<string, ScaleTick>();
  ticks.forEach((tick) => {
    const key = `${tick.value?.toFixed(6) ?? 'n/a'}:${tick.tier ?? 'none'}`;
    deduped.set(key, tick);
  });

  return [...deduped.values()].sort((left, right) => left.angleDeg - right.angleDeg);
};

const valueInConfiguredRange = (value: number, config: ScalePluginConfig): boolean => {
  const min = Math.min(config.startValue, config.endValue);
  const max = Math.max(config.startValue, config.endValue);
  return value >= min && value <= max;
};

export const createLogarithmicTickEngine = (): TickGenerator => {
  return {
    generate: ({ config, context, toAngle }) => {
      const ticks: ScaleTick[] = [];
      const majorTicks: ScaleTick[] = [];
      const minorTicks: ScaleTick[] = [];

      const effectiveConfig = applyEngineeringProfile(config);
      const projectionKind = resolveProjectionKindFromConfig(effectiveConfig);
      const projection = getProjection(projectionKind);
      const metadata = projection.generateMetadata(effectiveConfig);
      if (!metadata) {
        return {
          majorTicks,
          minorTicks,
          ticks,
          effectiveMinorStep: effectiveConfig.minorStep
        };
      }

      const profile = getProfile(effectiveConfig.tickDensityProfile);
      const base = Math.max(2, Math.floor(effectiveConfig.logarithmicBase ?? 10));
      const majorStride = clampCount(effectiveConfig.logMajorTickDensity, 1, 12);
      const secondaryCount = clampCount(
        effectiveConfig.logMinorTickDensity,
        profile.secondary ? 1 : 0,
        6
      );
      const tertiaryCount = clampCount(
        effectiveConfig.logMicroTickDensity,
        profile.tertiary ? TERTIARY_OFFSETS.length : 0,
        8
      );
      const microCount = clampCount(
        profile.micro ? (effectiveConfig.logMicroTickDensity ?? MICRO_OFFSETS.length) : 0,
        profile.micro ? MICRO_OFFSETS.length : 0,
        8
      );

      const secondaryOffsets = pickOffsets([0.5, 0.33, 0.67], secondaryCount, () => createEvenOffsets(secondaryCount));
      const tertiaryOffsets = pickOffsets(TERTIARY_OFFSETS, tertiaryCount, () => createEvenOffsets(tertiaryCount));
      const microOffsets = pickOffsets(MICRO_OFFSETS, microCount, () => createEvenOffsets(microCount));

      const useDecadeMode = metadata.decadeFriendly && projectionFamiliesWithDecadeMode.has(projectionKind);

      if (useDecadeMode) {
        const startDecade = Math.floor(Math.log(metadata.mappedStart) / Math.log(base));
        const endDecade = Math.ceil(Math.log(metadata.mappedEnd) / Math.log(base)) - 1;

        for (let decade = startDecade; decade <= endDecade; decade += 1) {
          const decadeStart = base ** decade;
          const decadeEnd = base ** (decade + 1);

          for (let mantissaIndex = 1; mantissaIndex <= base - 1; mantissaIndex += 1) {
            const intervalStartMapped = mantissaIndex * base ** decade;
            const intervalEndMapped = Math.min(mantissaIndex + 1, base) * base ** decade;

            if (intervalEndMapped < metadata.mappedStart || intervalStartMapped > metadata.mappedEnd) {
              continue;
            }

            const intervalStartValue = projection.inverse(intervalStartMapped, effectiveConfig);
            const intervalEndValue = projection.inverse(intervalEndMapped, effectiveConfig);
            const intervalStartAngle = toAngle(intervalStartValue, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
            const intervalEndAngle = toAngle(intervalEndValue, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
            const spacingDeg = Math.abs(intervalEndAngle - intervalStartAngle);

            if ((mantissaIndex - 1) % majorStride === 0 && valueInConfiguredRange(intervalStartValue, effectiveConfig)) {
              pushTick(
                ticks,
                intervalStartValue,
                { offset: 0, tier: 'primary' },
                intervalStartAngle,
                effectiveConfig.radiusMm,
                effectiveConfig.majorTickLengthMm,
                effectiveConfig.minorTickLengthMm,
                effectiveConfig.majorTickWidthMm,
                effectiveConfig.minorTickWidthMm,
                effectiveConfig.tickDirection,
                effectiveConfig.tickStyle
              );
            }

            if (profile.secondary && spacingDeg >= profile.minSecondarySpacingDeg) {
              secondaryOffsets.forEach((offset) => {
                const mapped = (mantissaIndex + offset) * base ** decade;
                if (mapped < metadata.mappedStart || mapped > metadata.mappedEnd) {
                  return;
                }

                const value = projection.inverse(mapped, effectiveConfig);
                if (!valueInConfiguredRange(value, effectiveConfig)) {
                  return;
                }

                const angleDeg = toAngle(value, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
                pushTick(
                  ticks,
                  value,
                  { offset, tier: 'secondary' },
                  angleDeg,
                  effectiveConfig.radiusMm,
                  effectiveConfig.majorTickLengthMm,
                  effectiveConfig.minorTickLengthMm,
                  effectiveConfig.majorTickWidthMm,
                  effectiveConfig.minorTickWidthMm,
                  effectiveConfig.tickDirection,
                  effectiveConfig.tickStyle
                );
              });
            }

            if (profile.tertiary && spacingDeg >= profile.minTertiarySpacingDeg) {
              tertiaryOffsets.forEach((offset) => {
                const mapped = (mantissaIndex + offset) * base ** decade;
                if (mapped < metadata.mappedStart || mapped > metadata.mappedEnd) {
                  return;
                }

                const value = projection.inverse(mapped, effectiveConfig);
                if (!valueInConfiguredRange(value, effectiveConfig)) {
                  return;
                }

                const angleDeg = toAngle(value, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
                pushTick(
                  ticks,
                  value,
                  { offset, tier: 'tertiary' },
                  angleDeg,
                  effectiveConfig.radiusMm,
                  effectiveConfig.majorTickLengthMm,
                  effectiveConfig.minorTickLengthMm,
                  effectiveConfig.majorTickWidthMm,
                  effectiveConfig.minorTickWidthMm,
                  effectiveConfig.tickDirection,
                  effectiveConfig.tickStyle
                );
              });
            }

            if (profile.micro && spacingDeg >= profile.minMicroSpacingDeg) {
              microOffsets.forEach((offset) => {
                const mapped = (mantissaIndex + offset) * base ** decade;
                if (mapped < metadata.mappedStart || mapped > metadata.mappedEnd) {
                  return;
                }

                const value = projection.inverse(mapped, effectiveConfig);
                if (!valueInConfiguredRange(value, effectiveConfig)) {
                  return;
                }

                const angleDeg = toAngle(value, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
                pushTick(
                  ticks,
                  value,
                  { offset, tier: 'micro' },
                  angleDeg,
                  effectiveConfig.radiusMm,
                  effectiveConfig.majorTickLengthMm,
                  effectiveConfig.minorTickLengthMm,
                  effectiveConfig.majorTickWidthMm,
                  effectiveConfig.minorTickWidthMm,
                  effectiveConfig.tickDirection,
                  effectiveConfig.tickStyle
                );
              });
            }
          }

          [decadeStart, Math.min(decadeEnd, metadata.mappedEnd)].forEach((boundaryMapped) => {
            if (boundaryMapped < metadata.mappedStart || boundaryMapped > metadata.mappedEnd) {
              return;
            }
            const boundaryValue = projection.inverse(boundaryMapped, effectiveConfig);
            if (!valueInConfiguredRange(boundaryValue, effectiveConfig)) {
              return;
            }
            const boundaryAngle = toAngle(boundaryValue, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
            pushTick(
              ticks,
              boundaryValue,
              { offset: 0, tier: 'primary' },
              boundaryAngle,
              effectiveConfig.radiusMm,
              effectiveConfig.majorTickLengthMm,
              effectiveConfig.minorTickLengthMm,
              effectiveConfig.majorTickWidthMm,
              effectiveConfig.minorTickWidthMm,
              effectiveConfig.tickDirection,
              effectiveConfig.tickStyle
            );
          });
        }
      } else {
        const primarySegments = Math.max(10, majorStride * 10);
        const mappedSpan = metadata.mappedSpan;

        for (let segment = 0; segment <= primarySegments; segment += 1) {
          const startT = segment / primarySegments;
          const mapped = metadata.mappedStart + startT * mappedSpan;
          const value = projection.inverse(mapped, effectiveConfig);
          if (!valueInConfiguredRange(value, effectiveConfig)) {
            continue;
          }

          const angleDeg = toAngle(value, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
          pushTick(
            ticks,
            value,
            { offset: startT, tier: 'primary' },
            angleDeg,
            effectiveConfig.radiusMm,
            effectiveConfig.majorTickLengthMm,
            effectiveConfig.minorTickLengthMm,
            effectiveConfig.majorTickWidthMm,
            effectiveConfig.minorTickWidthMm,
            effectiveConfig.tickDirection,
            effectiveConfig.tickStyle
          );

          if (segment === primarySegments) {
            continue;
          }

          const nextMapped = metadata.mappedStart + ((segment + 1) / primarySegments) * mappedSpan;
          const startValue = projection.inverse(mapped, effectiveConfig);
          const endValue = projection.inverse(nextMapped, effectiveConfig);
          const startAngle = toAngle(startValue, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
          const endAngle = toAngle(endValue, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
          const spacingDeg = Math.abs(endAngle - startAngle);

          if (profile.secondary && spacingDeg >= profile.minSecondarySpacingDeg) {
            secondaryOffsets.forEach((offset) => {
              const intermediateMapped = mapped + (nextMapped - mapped) * offset;
              const intermediateValue = projection.inverse(intermediateMapped, effectiveConfig);
              if (!valueInConfiguredRange(intermediateValue, effectiveConfig)) {
                return;
              }
              const intermediateAngle = toAngle(intermediateValue, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
              pushTick(
                ticks,
                intermediateValue,
                { offset, tier: 'secondary' },
                intermediateAngle,
                effectiveConfig.radiusMm,
                effectiveConfig.majorTickLengthMm,
                effectiveConfig.minorTickLengthMm,
                effectiveConfig.majorTickWidthMm,
                effectiveConfig.minorTickWidthMm,
                effectiveConfig.tickDirection,
                effectiveConfig.tickStyle
              );
            });
          }

          if (profile.tertiary && spacingDeg >= profile.minTertiarySpacingDeg) {
            tertiaryOffsets.forEach((offset) => {
              const intermediateMapped = mapped + (nextMapped - mapped) * offset;
              const intermediateValue = projection.inverse(intermediateMapped, effectiveConfig);
              if (!valueInConfiguredRange(intermediateValue, effectiveConfig)) {
                return;
              }
              const intermediateAngle = toAngle(intermediateValue, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
              pushTick(
                ticks,
                intermediateValue,
                { offset, tier: 'tertiary' },
                intermediateAngle,
                effectiveConfig.radiusMm,
                effectiveConfig.majorTickLengthMm,
                effectiveConfig.minorTickLengthMm,
                effectiveConfig.majorTickWidthMm,
                effectiveConfig.minorTickWidthMm,
                effectiveConfig.tickDirection,
                effectiveConfig.tickStyle
              );
            });
          }

          if (profile.micro && spacingDeg >= profile.minMicroSpacingDeg) {
            microOffsets.forEach((offset) => {
              const intermediateMapped = mapped + (nextMapped - mapped) * offset;
              const intermediateValue = projection.inverse(intermediateMapped, effectiveConfig);
              if (!valueInConfiguredRange(intermediateValue, effectiveConfig)) {
                return;
              }
              const intermediateAngle = toAngle(intermediateValue, effectiveConfig, context) + effectiveConfig.rotationOffsetDeg;
              pushTick(
                ticks,
                intermediateValue,
                { offset, tier: 'micro' },
                intermediateAngle,
                effectiveConfig.radiusMm,
                effectiveConfig.majorTickLengthMm,
                effectiveConfig.minorTickLengthMm,
                effectiveConfig.majorTickWidthMm,
                effectiveConfig.minorTickWidthMm,
                effectiveConfig.tickDirection,
                effectiveConfig.tickStyle
              );
            });
          }
        }
      }

      const merged = dedupeAndSortTicks(ticks);
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
        effectiveMinorStep: effectiveConfig.minorStep
      };
    }
  };
};
