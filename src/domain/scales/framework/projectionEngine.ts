import { normalizeAngularPosition } from '@/domain/scales/framework/circularProjection';
import type { ProjectionKind, ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';

export interface ProjectionMetadata {
  kind: ProjectionKind;
  mappedStart: number;
  mappedEnd: number;
  mappedSpan: number;
  decadeFriendly: boolean;
  assumptions: string[];
}

export interface ProjectionContract {
  kind: ProjectionKind;
  forward: (value: number, config: ScalePluginConfig) => number;
  inverse: (mappedValue: number, config: ScalePluginConfig) => number;
  normalize: (value: number, config: ScalePluginConfig) => number;
  denormalize: (position: number, config: ScalePluginConfig) => number;
  valueToAngle: (value: number, config: ScalePluginConfig, context: ScaleMathContext) => number;
  inverseFromAngle: (angleDeg: number, config: ScalePluginConfig, context: ScaleMathContext) => number;
  validateDomain: (config: ScalePluginConfig) => string[];
  generateMetadata: (config: ScalePluginConfig) => ProjectionMetadata | null;
}

interface MappedProjectionOptions {
  kind: ProjectionKind;
  forward: (value: number, config: ScalePluginConfig) => number;
  inverse: (mappedValue: number, config: ScalePluginConfig) => number;
  assumptions: string[];
  validate?: (config: ScalePluginConfig) => string[];
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const logWithBase = (value: number, base: number): number => Math.log(value) / Math.log(base);

const clampBase = (input: number | undefined): number => {
  if (!input || !Number.isFinite(input) || input <= 1) {
    return 10;
  }
  return input;
};

const buildLogarithmicMetadata = (
  kind: ProjectionKind,
  mappedStart: number,
  mappedEnd: number,
  assumptions: string[]
): ProjectionMetadata => {
  const low = Math.min(mappedStart, mappedEnd);
  const high = Math.max(mappedStart, mappedEnd);
  return {
    kind,
    mappedStart: low,
    mappedEnd: high,
    mappedSpan: high - low,
    decadeFriendly: low > 0,
    assumptions
  };
};

const normalizeLogDomain = (value: number, startValue: number, endValue: number, base: number): number => {
  const numerator = logWithBase(value, base) - logWithBase(startValue, base);
  const denominator = logWithBase(endValue, base) - logWithBase(startValue, base);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || Math.abs(denominator) < 1e-12) {
    return Number.NaN;
  }
  return numerator / denominator;
};

const denormalizeLogDomain = (position: number, startValue: number, endValue: number, base: number): number => {
  const startLog = logWithBase(startValue, base);
  const endLog = logWithBase(endValue, base);
  const mapped = startLog + clamp01(position) * (endLog - startLog);
  return base ** mapped;
};

const validateIncreasingDomain = (config: ScalePluginConfig): string[] => {
  const issues: string[] = [];
  if (!Number.isFinite(config.startValue) || !Number.isFinite(config.endValue)) {
    issues.push('Projection domain bounds must be finite numbers.');
  }
  if (config.startValue === config.endValue) {
    issues.push('Projection domain bounds must not be equal.');
  }
  return issues;
};

const normalizedFromAngle = (
  angleDeg: number,
  context: ScaleMathContext,
  direction: ScalePluginConfig['direction'],
  rotationOffsetDeg = 0
): number => {
  const span = context.endAngleDeg - context.startAngleDeg;
  const signedSpan = direction === 'clockwise' ? span : -span;
  const offsetAngle = angleDeg - rotationOffsetDeg;
  if (!Number.isFinite(signedSpan) || Math.abs(signedSpan) < 1e-9) {
    return 0;
  }
  return clamp01((offsetAngle - context.startAngleDeg) / signedSpan);
};

const createMappedProjection = (options: MappedProjectionOptions): ProjectionContract => {
  const generateMetadata = (config: ScalePluginConfig): ProjectionMetadata | null => {
    const baseIssues = validateIncreasingDomain(config);
    const customIssues = options.validate?.(config) ?? [];
    if (baseIssues.length > 0 || customIssues.length > 0) {
      return null;
    }

    const mappedStart = options.forward(config.startValue, config);
    const mappedEnd = options.forward(config.endValue, config);
    if (!Number.isFinite(mappedStart) || !Number.isFinite(mappedEnd) || mappedStart === mappedEnd) {
      return null;
    }

    const low = Math.min(mappedStart, mappedEnd);
    const high = Math.max(mappedStart, mappedEnd);
    const mappedSpan = high - low;

    return {
      kind: options.kind,
      mappedStart: low,
      mappedEnd: high,
      mappedSpan,
      decadeFriendly: low > 0 && Number.isFinite(logWithBase(low, clampBase(config.logarithmicBase))),
      assumptions: options.assumptions
    };
  };

  const normalizeValue = (value: number, config: ScalePluginConfig): number => {
    const metadata = generateMetadata(config);
    if (!metadata) {
      return Number.NaN;
    }
    const mapped = options.forward(value, config);
    if (!Number.isFinite(mapped) || metadata.mappedSpan <= 0) {
      return Number.NaN;
    }
    return (mapped - metadata.mappedStart) / metadata.mappedSpan;
  };

  const denormalizeValue = (position: number, config: ScalePluginConfig): number => {
    const metadata = generateMetadata(config);
    if (!metadata) {
      return Number.NaN;
    }
    const clamped = clamp01(position);
    const mapped = metadata.mappedStart + clamped * metadata.mappedSpan;
    return options.inverse(mapped, config);
  };

  return {
    kind: options.kind,
    forward: options.forward,
    inverse: options.inverse,
    normalize: normalizeValue,
    denormalize: denormalizeValue,
    valueToAngle: (value, config, context) => {
      const normalizedRaw = Number.isFinite(value) ? normalizeValue(value, config) : 0;
      const normalized = Number.isFinite(normalizedRaw) ? clamp01(normalizedRaw) : 0;
      return normalizeAngularPosition(normalized, {
        startAngleDeg: context.startAngleDeg,
        endAngleDeg: context.endAngleDeg,
        direction: config.direction,
        rotationOffsetDeg: config.rotationOffsetDeg
      });
    },
    inverseFromAngle: (angleDeg, config, context) => {
      const normalized = normalizedFromAngle(
        angleDeg,
        context,
        config.direction,
        config.rotationOffsetDeg
      );
      return denormalizeValue(normalized, config);
    },
    validateDomain: (config) => [...validateIncreasingDomain(config), ...(options.validate?.(config) ?? [])],
    generateMetadata
  };
};

const customExponent = (config: ScalePluginConfig): number => {
  const exponent = config.customProjectionExponent ?? 1;
  if (!Number.isFinite(exponent) || Math.abs(exponent) < 1e-9) {
    return 1;
  }
  return exponent;
};

const customScale = (config: ScalePluginConfig): number => {
  const scale = config.customProjectionScale ?? 1;
  if (!Number.isFinite(scale) || Math.abs(scale) < 1e-9) {
    return 1;
  }
  return scale;
};

const customOffset = (config: ScalePluginConfig): number => {
  const offset = config.customProjectionOffset ?? 0;
  if (!Number.isFinite(offset)) {
    return 0;
  }
  return offset;
};

const reciprocalValidator = (config: ScalePluginConfig): string[] => {
  const issues: string[] = [];
  if (config.startValue <= 0 || config.endValue <= 0) {
    issues.push('Reciprocal logarithmic projection requires positive domain values.');
  }
  return issues;
};

const logarithmicValidator = (config: ScalePluginConfig): string[] => {
  const issues: string[] = [];
  const base = clampBase(config.logarithmicBase);
  if (base <= 1) {
    issues.push('Logarithmic projection base must be greater than 1.');
  }
  if (config.startValue <= 0 || config.endValue <= 0) {
    issues.push('Logarithmic projection requires positive domain values.');
  }
  return issues;
};

const naturalLogValidator = (config: ScalePluginConfig): string[] => {
  const issues: string[] = [];
  if (config.startValue <= 0 || config.endValue <= 0) {
    issues.push('Natural log projection requires positive domain values.');
  }
  return issues;
};

const logLogValidator = (config: ScalePluginConfig): string[] => {
  const issues: string[] = [];
  if (config.startValue <= 1 || config.endValue <= 1) {
    issues.push('Log-log projection requires domain values greater than 1.');
  }
  return issues;
};

const squareRootValidator = (config: ScalePluginConfig): string[] => {
  const issues: string[] = [];
  if (config.startValue < 0 || config.endValue < 0) {
    issues.push('Square-root projection requires non-negative domain values.');
  }
  return issues;
};

export const projectionRegistry: Record<ProjectionKind, ProjectionContract> = {
  identity: createMappedProjection({
    kind: 'identity',
    forward: (value) => value,
    inverse: (mapped) => mapped,
    assumptions: ['Identity projection maintains raw value spacing.']
  }),
  linear: createMappedProjection({
    kind: 'linear',
    forward: (value) => value,
    inverse: (mapped) => mapped,
    assumptions: ['Linear projection uses uniform value spacing.']
  }),
  logarithmic: {
    kind: 'logarithmic',
    forward: (value) => value,
    inverse: (mapped) => mapped,
    normalize: (value, config) => {
      const base = clampBase(config.logarithmicBase);
      return normalizeLogDomain(value, config.startValue, config.endValue, base);
    },
    denormalize: (position, config) => {
      const base = clampBase(config.logarithmicBase);
      return denormalizeLogDomain(position, config.startValue, config.endValue, base);
    },
    valueToAngle: (value, config, context) => {
      const normalized = normalizeLogDomain(value, config.startValue, config.endValue, clampBase(config.logarithmicBase));
      const safe = Number.isFinite(normalized) ? clamp01(normalized) : 0;
      return normalizeAngularPosition(safe, {
        startAngleDeg: context.startAngleDeg,
        endAngleDeg: context.endAngleDeg,
        direction: config.direction,
        rotationOffsetDeg: config.rotationOffsetDeg
      });
    },
    inverseFromAngle: (angleDeg, config, context) => {
      const normalized = normalizedFromAngle(angleDeg, context, config.direction, config.rotationOffsetDeg);
      return denormalizeLogDomain(normalized, config.startValue, config.endValue, clampBase(config.logarithmicBase));
    },
    validateDomain: (config) => [...validateIncreasingDomain(config), ...logarithmicValidator(config)],
    generateMetadata: (config) => {
      const issues = [...validateIncreasingDomain(config), ...logarithmicValidator(config)];
      if (issues.length > 0) {
        return null;
      }
      return buildLogarithmicMetadata(
        'logarithmic',
        config.startValue,
        config.endValue,
        ['Domain values must remain positive for logarithmic normalization.']
      );
    }
  },
  'reciprocal-logarithmic': {
    kind: 'reciprocal-logarithmic',
    forward: (value) => 1 / value,
    inverse: (mapped) => 1 / mapped,
    normalize: (value, config) => {
      const base = clampBase(config.logarithmicBase);
      return normalizeLogDomain(1 / value, 1 / config.startValue, 1 / config.endValue, base);
    },
    denormalize: (position, config) => {
      const base = clampBase(config.logarithmicBase);
      const reciprocal = denormalizeLogDomain(position, 1 / config.startValue, 1 / config.endValue, base);
      return 1 / reciprocal;
    },
    valueToAngle: (value, config, context) => {
      const normalized = normalizeLogDomain(
        1 / value,
        1 / config.startValue,
        1 / config.endValue,
        clampBase(config.logarithmicBase)
      );
      const safe = Number.isFinite(normalized) ? clamp01(normalized) : 0;
      return normalizeAngularPosition(safe, {
        startAngleDeg: context.startAngleDeg,
        endAngleDeg: context.endAngleDeg,
        direction: config.direction,
        rotationOffsetDeg: config.rotationOffsetDeg
      });
    },
    inverseFromAngle: (angleDeg, config, context) => {
      const normalized = normalizedFromAngle(angleDeg, context, config.direction, config.rotationOffsetDeg);
      const reciprocal = denormalizeLogDomain(
        normalized,
        1 / config.startValue,
        1 / config.endValue,
        clampBase(config.logarithmicBase)
      );
      return 1 / reciprocal;
    },
    validateDomain: (config) => [...validateIncreasingDomain(config), ...reciprocalValidator(config)],
    generateMetadata: (config) => {
      const issues = [...validateIncreasingDomain(config), ...reciprocalValidator(config)];
      if (issues.length > 0) {
        return null;
      }
      return buildLogarithmicMetadata(
        'reciprocal-logarithmic',
        1 / config.startValue,
        1 / config.endValue,
        ['Reciprocal logarithmic projection maps values through 1/x before normalization.']
      );
    }
  },
  square: createMappedProjection({
    kind: 'square',
    forward: (value) => value ** 2,
    inverse: (mapped) => Math.sqrt(Math.max(0, mapped)),
    assumptions: ['Square projection emphasizes large values through x^2 weighting.']
  }),
  'square-root': createMappedProjection({
    kind: 'square-root',
    forward: (value) => Math.sqrt(value),
    inverse: (mapped) => mapped ** 2,
    assumptions: ['Square-root projection expands lower-value detail with sqrt(x).'],
    validate: squareRootValidator
  }),
  cube: createMappedProjection({
    kind: 'cube',
    forward: (value) => value ** 3,
    inverse: (mapped) => Math.cbrt(mapped),
    assumptions: ['Cube projection emphasizes high-value spread with x^3.']
  }),
  'cube-root': createMappedProjection({
    kind: 'cube-root',
    forward: (value) => Math.cbrt(value),
    inverse: (mapped) => mapped ** 3,
    assumptions: ['Cube-root projection expands compact lower-value ranges.']
  }),
  'natural-log': createMappedProjection({
    kind: 'natural-log',
    forward: (value) => Math.log(value),
    inverse: (mapped) => Math.exp(mapped),
    assumptions: ['Natural log projection linearizes multiplicative domains in base e.'],
    validate: naturalLogValidator
  }),
  'log-log': createMappedProjection({
    kind: 'log-log',
    forward: (value) => Math.log(Math.log(value)),
    inverse: (mapped) => Math.exp(Math.exp(mapped)),
    assumptions: ['Log-log projection maps exponential growth domains for LL series behavior.'],
    validate: logLogValidator
  }),
  exponential: createMappedProjection({
    kind: 'exponential',
    forward: (value) => Math.exp(value),
    inverse: (mapped) => Math.log(Math.max(mapped, 1e-12)),
    assumptions: ['Exponential projection applies e^x weighting for accelerated growth domains.']
  }),
  custom: createMappedProjection({
    kind: 'custom',
    forward: (value, config) => customScale(config) * value ** customExponent(config) + customOffset(config),
    inverse: (mapped, config) => {
      const adjusted = (mapped - customOffset(config)) / customScale(config);
      const exponent = customExponent(config);
      if (adjusted < 0 && Math.abs(exponent % 2) < 1e-9) {
        return Number.NaN;
      }
      return Math.sign(adjusted) * Math.abs(adjusted) ** (1 / exponent);
    },
    assumptions: ['Custom projection uses configurable scale, exponent, and offset.']
  })
};

export const listProjectionKinds = (): ProjectionKind[] => {
  return Object.keys(projectionRegistry) as ProjectionKind[];
};

export const getProjection = (kind: ProjectionKind): ProjectionContract => {
  return projectionRegistry[kind];
};

export const resolveProjectionKindFromConfig = (config: ScalePluginConfig): ProjectionKind => {
  if (config.projectionKind) {
    return config.projectionKind;
  }

  switch (config.logarithmicRingType) {
    case 'CI':
    case 'DI':
      return 'reciprocal-logarithmic';
    case 'L':
      return 'natural-log';
    case 'LL':
      return 'log-log';
    default:
      return 'logarithmic';
  }
};
