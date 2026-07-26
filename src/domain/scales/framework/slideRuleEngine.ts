import type {
  ScaleEngineeringReadout,
  ScaleLabel,
  ScaleMathContext,
  ScalePluginConfig,
  ScaleTick
} from '@/domain/scales/types';
import { CircularLogarithmicMathematics } from '@/domain/scales/framework/circularLogarithmicMath';
import type { CircularProjectionContext } from '@/domain/scales/framework/circularProjection';

export type SlideRuleRingId = 'outer' | 'inner';

export interface SlideRuleRingState {
  id: SlideRuleRingId;
  radiusMm: number;
  rotationOffsetDeg: number;
  context: CircularProjectionContext;
}

export interface SlideRuleState {
  outer: SlideRuleRingState;
  inner: SlideRuleRingState;
  sharedModel: 'logarithmic';
  relativeRotationDeg: number;
}

export interface SlideRuleCursorState {
  type: NonNullable<ScalePluginConfig['cursorType']>;
  referenceIndexDeg: number;
  rotationDeg: number;
  transparent: boolean;
}

export interface SlideRuleOperationResult {
  mode: NonNullable<ScalePluginConfig['calculationMode']>;
  value: number;
  expression: string;
}

export interface PolarSample {
  radiusMm: number;
  angleDeg: number;
}

export interface ScreenProjectionInput {
  screenX: number;
  screenY: number;
  centerX: number;
  centerY: number;
  panX: number;
  panY: number;
  renderScale: number;
}

export interface InverseProjectionResult {
  ringId: SlideRuleRingId;
  normalized: number;
  value: number;
  radiusMm: number;
  angleDeg: number;
}

const mathematics = new CircularLogarithmicMathematics();

const normalizeAngleDeg = (angleDeg: number): number => {
  let normalized = angleDeg % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const toLogSpace = (value: number, base: number): number => Math.log(value) / Math.log(base);

const fromLogSpace = (value: number, base: number): number => Math.pow(base, value);

const toRingContext = (
  config: ScalePluginConfig,
  context: ScaleMathContext,
  extraRotationDeg: number
): CircularProjectionContext => ({
  startAngleDeg: context.startAngleDeg,
  endAngleDeg: context.endAngleDeg,
  direction: config.direction,
  rotationOffsetDeg: (config.rotationOffsetDeg ?? 0) + extraRotationDeg
});

const asNumber = (value: number | undefined, fallback: number): number =>
  Number.isFinite(value) ? Number(value) : fallback;

export const resolveSlideRulePreset = (config: ScalePluginConfig): ScalePluginConfig => {
  switch (config.engineeringPreset) {
    case 'circular-calculator':
      return {
        ...config,
        tickDensityProfile: 'balanced',
        includeMinorLabels: true,
        outerRotationOffsetDeg: asNumber(config.outerRotationOffsetDeg, 0),
        innerRotationOffsetDeg: asNumber(config.innerRotationOffsetDeg, 18),
        ringSyncMode: config.ringSyncMode ?? 'independent',
        ringCouplingEnabled: true,
        cursorType: 'transparent',
        calculationMode: config.calculationMode ?? 'multiplication'
      };
    case 'aviation-slide-rule':
      return {
        ...config,
        tickDensityProfile: 'dense',
        includeMinorLabels: true,
        outerRadiusMm: asNumber(config.outerRadiusMm, Math.max(config.radiusMm + 1.3, config.bandInnerRadiusMm + 0.4)),
        innerRadiusMm: asNumber(config.innerRadiusMm, Math.max(config.radiusMm - 1.1, config.bandInnerRadiusMm + 0.2)),
        outerRotationOffsetDeg: asNumber(config.outerRotationOffsetDeg, 0),
        innerRotationOffsetDeg: asNumber(config.innerRotationOffsetDeg, 10),
        ringSyncMode: 'outer-drives-inner',
        ringCouplingEnabled: true,
        cursorType: 'rotating',
        calculationMode: config.calculationMode ?? 'sync'
      };
    case 'scientific-calculator':
      return {
        ...config,
        tickDensityProfile: 'dense',
        includeMinorLabels: true,
        labelOrientation: 'horizontal',
        outerRotationOffsetDeg: asNumber(config.outerRotationOffsetDeg, 0),
        innerRotationOffsetDeg: asNumber(config.innerRotationOffsetDeg, 5),
        ringSyncMode: 'locked',
        ringCouplingEnabled: true,
        calculationMode: config.calculationMode ?? 'ratio'
      };
    case 'engineering-calculator':
      return {
        ...config,
        tickDensityProfile: 'balanced',
        includeMinorLabels: false,
        outerRotationOffsetDeg: asNumber(config.outerRotationOffsetDeg, 0),
        innerRotationOffsetDeg: asNumber(config.innerRotationOffsetDeg, 0),
        ringSyncMode: 'independent',
        ringCouplingEnabled: true,
        cursorType: 'fixed',
        calculationMode: config.calculationMode ?? 'division'
      };
    case 'navitimer-geometry':
      return {
        ...config,
        tickDensityProfile: 'dense',
        includeMinorLabels: true,
        outerRadiusMm: asNumber(config.outerRadiusMm, Math.max(config.radiusMm + 1.7, config.bandInnerRadiusMm + 0.4)),
        innerRadiusMm: asNumber(config.innerRadiusMm, Math.max(config.radiusMm - 1.45, config.bandInnerRadiusMm + 0.2)),
        ringCouplingEnabled: true,
        ringSyncMode: 'outer-drives-inner',
        cursorType: 'transparent'
      };
    case 'e6b-geometry':
      return {
        ...config,
        tickDensityProfile: 'balanced',
        includeMinorLabels: true,
        outerRadiusMm: asNumber(config.outerRadiusMm, Math.max(config.radiusMm + 1.6, config.bandInnerRadiusMm + 0.4)),
        innerRadiusMm: asNumber(config.innerRadiusMm, Math.max(config.radiusMm - 1.2, config.bandInnerRadiusMm + 0.2)),
        ringCouplingEnabled: true,
        ringSyncMode: 'locked',
        cursorType: 'rotating'
      };
    default:
      return {
        ...config,
        tickDensityProfile: config.tickDensityProfile ?? 'balanced',
        includeMinorLabels: config.includeMinorLabels ?? false,
        outerRadiusMm: asNumber(config.outerRadiusMm, config.radiusMm + 0.9),
        innerRadiusMm: asNumber(config.innerRadiusMm, config.radiusMm - 0.9),
        outerRotationOffsetDeg: asNumber(config.outerRotationOffsetDeg, 0),
        innerRotationOffsetDeg: asNumber(config.innerRotationOffsetDeg, 0),
        ringSyncMode: config.ringSyncMode ?? 'independent',
        ringCouplingEnabled: config.ringCouplingEnabled ?? true,
        cursorType: config.cursorType ?? 'transparent',
        calculationMode: config.calculationMode ?? 'multiplication'
      };
  }
};

export const buildCoupledSlideRuleState = (
  sourceConfig: ScalePluginConfig,
  context: ScaleMathContext
): SlideRuleState => {
  const config = resolveSlideRulePreset(sourceConfig);

  const outerRotationOffsetDeg = asNumber(config.outerRotationOffsetDeg, 0);
  const innerRotationOffsetDeg = asNumber(config.innerRotationOffsetDeg, 0);

  const outer: SlideRuleRingState = {
    id: 'outer',
    radiusMm: asNumber(config.outerRadiusMm, config.radiusMm + 0.9),
    rotationOffsetDeg: outerRotationOffsetDeg,
    context: toRingContext(config, context, outerRotationOffsetDeg)
  };

  const inner: SlideRuleRingState = {
    id: 'inner',
    radiusMm: asNumber(config.innerRadiusMm, config.radiusMm - 0.9),
    rotationOffsetDeg: innerRotationOffsetDeg,
    context: toRingContext(config, context, innerRotationOffsetDeg)
  };

  return {
    outer,
    inner,
    sharedModel: 'logarithmic',
    relativeRotationDeg: inner.rotationOffsetDeg - outer.rotationOffsetDeg
  };
};

export const rotateCoupledRings = (
  sourceConfig: ScalePluginConfig,
  ringId: SlideRuleRingId,
  deltaDeg: number
): ScalePluginConfig => {
  const config = resolveSlideRulePreset(sourceConfig);

  if (config.lockRingMovement) {
    return {
      ...config,
      outerRotationOffsetDeg: (config.outerRotationOffsetDeg ?? 0) + deltaDeg,
      innerRotationOffsetDeg: (config.innerRotationOffsetDeg ?? 0) + deltaDeg
    };
  }

  const syncMode = config.ringSyncMode ?? 'independent';
  const outerRotationOffsetDeg = config.outerRotationOffsetDeg ?? 0;
  const innerRotationOffsetDeg = config.innerRotationOffsetDeg ?? 0;

  if (syncMode === 'locked') {
    return {
      ...config,
      outerRotationOffsetDeg: outerRotationOffsetDeg + deltaDeg,
      innerRotationOffsetDeg: innerRotationOffsetDeg + deltaDeg
    };
  }

  if (syncMode === 'outer-drives-inner') {
    if (ringId === 'outer') {
      return {
        ...config,
        outerRotationOffsetDeg: outerRotationOffsetDeg + deltaDeg,
        innerRotationOffsetDeg: innerRotationOffsetDeg + deltaDeg
      };
    }

    return {
      ...config,
      innerRotationOffsetDeg: innerRotationOffsetDeg + deltaDeg
    };
  }

  if (syncMode === 'inner-drives-outer') {
    if (ringId === 'inner') {
      return {
        ...config,
        outerRotationOffsetDeg: outerRotationOffsetDeg + deltaDeg,
        innerRotationOffsetDeg: innerRotationOffsetDeg + deltaDeg
      };
    }

    return {
      ...config,
      outerRotationOffsetDeg: outerRotationOffsetDeg + deltaDeg
    };
  }

  return ringId === 'outer'
    ? {
        ...config,
        outerRotationOffsetDeg: outerRotationOffsetDeg + deltaDeg
      }
    : {
        ...config,
        innerRotationOffsetDeg: innerRotationOffsetDeg + deltaDeg
      };
};

export const createSlideRuleCursorState = (config: ScalePluginConfig): SlideRuleCursorState => {
  const type = config.cursorType ?? 'transparent';
  const referenceIndexDeg = config.referenceIndexDeg ?? 0;
  return {
    type,
    referenceIndexDeg,
    rotationDeg: referenceIndexDeg,
    transparent: type === 'transparent'
  };
};

export const evaluateSlideRuleOperation = (
  config: ScalePluginConfig,
  leftValue: number,
  rightValue: number,
  thirdValue = 1
): SlideRuleOperationResult => {
  const mode = config.calculationMode ?? 'multiplication';

  if (mode === 'division') {
    const value = rightValue === 0 ? Number.NaN : leftValue / rightValue;
    return {
      mode,
      value,
      expression: `${leftValue} / ${rightValue}`
    };
  }

  if (mode === 'ratio') {
    const value = rightValue === 0 ? Number.NaN : leftValue / rightValue;
    return {
      mode,
      value,
      expression: `${leftValue}:${rightValue}`
    };
  }

  if (mode === 'proportion') {
    const value = thirdValue === 0 ? Number.NaN : (leftValue * rightValue) / thirdValue;
    return {
      mode,
      value,
      expression: `(${leftValue} * ${rightValue}) / ${thirdValue}`
    };
  }

  if (mode === 'sync') {
    const value = rightValue - leftValue;
    return {
      mode,
      value,
      expression: `${rightValue} - ${leftValue}`
    };
  }

  return {
    mode,
    value: leftValue * rightValue,
    expression: `${leftValue} * ${rightValue}`
  };
};

export const inverseProjectSlideRuleValue = (
  sample: PolarSample,
  sourceConfig: ScalePluginConfig,
  context: ScaleMathContext,
  ringId: SlideRuleRingId
): InverseProjectionResult => {
  const config = resolveSlideRulePreset(sourceConfig);
  const state = buildCoupledSlideRuleState(config, context);
  const ring = ringId === 'outer' ? state.outer : state.inner;
  const base = config.logarithmicBase ?? 10;

  const span = ring.context.endAngleDeg - ring.context.startAngleDeg;
  const signedSpan = ring.context.direction === 'clockwise' ? span : -span;

  const raw = normalizeAngleDeg(sample.angleDeg - (ring.context.rotationOffsetDeg ?? 0));
  const normalized = clamp01((raw - normalizeAngleDeg(ring.context.startAngleDeg)) / Math.max(1e-9, signedSpan));

  const startLog = toLogSpace(config.startValue, base);
  const endLog = toLogSpace(config.endValue, base);
  const logValue = startLog + normalized * (endLog - startLog);
  const value = fromLogSpace(logValue, base);

  return {
    ringId,
    normalized,
    value,
    radiusMm: sample.radiusMm,
    angleDeg: sample.angleDeg
  };
};

export const screenPointToPolarSample = (input: ScreenProjectionInput): PolarSample => {
  const effectiveScale = Math.max(0.0001, input.renderScale);
  const localX = (input.screenX - input.centerX - input.panX) / effectiveScale;
  const localY = (input.screenY - input.centerY - input.panY) / effectiveScale;
  const radiusPx = Math.sqrt(localX * localX + localY * localY);
  const rawAngle = (Math.atan2(localY, localX) * 180) / Math.PI;

  return {
    radiusMm: radiusPx / 10,
    angleDeg: rawAngle + 90
  };
};

export const resolveSlideRuleReadout = (
  sample: PolarSample,
  sourceConfig: ScalePluginConfig,
  context: ScaleMathContext,
  ticks: ScaleTick[],
  labels: ScaleLabel[]
): ScaleEngineeringReadout | null => {
  const config = resolveSlideRulePreset(sourceConfig);
  const state = buildCoupledSlideRuleState(config, context);
  const outerDistance = Math.abs(sample.radiusMm - state.outer.radiusMm);
  const innerDistance = Math.abs(sample.radiusMm - state.inner.radiusMm);

  const ringId: SlideRuleRingId = outerDistance <= innerDistance ? 'outer' : 'inner';
  const inverse = inverseProjectSlideRuleValue(sample, config, context, ringId);

  const nearestTick = ticks
    .filter((tick) => tick.ringId === ringId)
    .reduce<ScaleTick | null>((closest, tick) => {
      if (!closest) {
        return tick;
      }
      return Math.abs(tick.angleDeg - inverse.angleDeg) < Math.abs(closest.angleDeg - inverse.angleDeg)
        ? tick
        : closest;
    }, null);

  const nearestLabel = labels
    .filter((label) => label.ringId === ringId)
    .reduce<ScaleLabel | null>((closest, label) => {
      if (!closest) {
        return label;
      }
      return Math.abs(label.angleDeg - inverse.angleDeg) < Math.abs(closest.angleDeg - inverse.angleDeg)
        ? label
        : closest;
    }, null);

  return {
    ringId,
    value: Number(inverse.value.toFixed(6)),
    normalized: Number(inverse.normalized.toFixed(6)),
    angleDeg: Number(inverse.angleDeg.toFixed(4)),
    radiusMm: Number(inverse.radiusMm.toFixed(4)),
    nearestTick,
    nearestLabel
  };
};

export const projectValueForRing = (
  value: number,
  sourceConfig: ScalePluginConfig,
  context: ScaleMathContext,
  ringId: SlideRuleRingId
): { angleDeg: number; normalized: number } => {
  const config = resolveSlideRulePreset(sourceConfig);
  const state = buildCoupledSlideRuleState(config, context);
  const ring = ringId === 'outer' ? state.outer : state.inner;

  const angleDeg = mathematics.valueToAngle(value, {
    ...config,
    rotationOffsetDeg: ring.rotationOffsetDeg
  }, context);
  const normalized = mathematics.normalizeValue(value, config);

  return {
    angleDeg,
    normalized
  };
};
