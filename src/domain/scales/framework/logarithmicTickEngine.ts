import type { TickGenerator } from '@/domain/scales/framework/interfaces';
import type { ScaleTick } from '@/domain/scales/types';

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

      if (config.startValue <= 0 || config.endValue <= 0 || config.startValue >= config.endValue) {
        return {
          majorTicks,
          minorTicks,
          ticks,
          effectiveMinorStep: config.minorStep
        };
      }

      const profile = getProfile(config.tickDensityProfile);

      for (let segment = 1; segment <= 9; segment += 1) {
        const from = segment;
        const to = segment + 1;
        if (to < config.startValue || from > config.endValue) {
          continue;
        }

        const startAngle = toAngle(from, config, context) + config.rotationOffsetDeg;
        const endAngle = toAngle(to, config, context) + config.rotationOffsetDeg;
        const spacingDeg = Math.abs(endAngle - startAngle);

        const specs: TickSpec[] = [{ offset: 0, tier: 'primary' }];

        if (profile.secondary && spacingDeg >= profile.minSecondarySpacingDeg) {
          specs.push({ offset: 0.5, tier: 'secondary' });
        }

        if (profile.tertiary && spacingDeg >= profile.minTertiarySpacingDeg) {
          TERTIARY_OFFSETS.forEach((offset) => {
            specs.push({ offset, tier: 'tertiary' });
          });
        }

        if (profile.micro && spacingDeg >= profile.minMicroSpacingDeg) {
          MICRO_OFFSETS.forEach((offset) => {
            specs.push({ offset, tier: 'micro' });
          });
        }

        specs.forEach((spec) => {
          const value = from + spec.offset;
          if (value < config.startValue || value > config.endValue) {
            return;
          }

          const angleDeg = toAngle(value, config, context) + config.rotationOffsetDeg;
          pushTick(
            ticks,
            value,
            spec,
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

      if (config.endValue === 10) {
        const angleDeg = toAngle(10, config, context) + config.rotationOffsetDeg;
        pushTick(
          ticks,
          10,
          { offset: 0, tier: 'primary' },
          angleDeg,
          config.radiusMm,
          config.majorTickLengthMm,
          config.minorTickLengthMm,
          config.majorTickWidthMm,
          config.minorTickWidthMm,
          config.tickDirection,
          config.tickStyle
        );
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
