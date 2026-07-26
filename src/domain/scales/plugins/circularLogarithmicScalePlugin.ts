import {
  applyEngineeringProfile,
  createCollisionFramework,
  getProjection,
  getProfileManufacturingDiagnostics,
  createLogarithmicLabelEngine,
  createLogarithmicTickEngine,
  resolveEngineeringProfile,
  resolveProjectionKindFromConfig,
  createScaleExporter,
  createScaleValidationEngine
} from '@/domain/scales/framework';
import type { ScaleValidationIssue } from '@/domain/scales/framework';
import { createPreviewGeometry } from '@/domain/scales/preview';
import type {
  ScaleMathContext,
  ScalePlugin,
  ScalePluginConfig,
  ScaleTick,
  ScaleValidationResult
} from '@/domain/scales/types';

const tickEngine = createLogarithmicTickEngine();
const labelEngine = createLogarithmicLabelEngine();
const validationEngine = createScaleValidationEngine();
const collisionFramework = createCollisionFramework();
const exporter = createScaleExporter();

const inspectorConfiguration: ScalePlugin['inspectorConfiguration'] = [
  {
    key: 'projectionKind',
    label: 'Projection',
    type: 'select',
    description: 'Select mathematical projection independent from formatting and profile.'
  },
  {
    key: 'engineeringProfileKind',
    label: 'Profile',
    type: 'select',
    description: 'Engineering intent profile (C, CI, A, K, L, LL, aviation, etc.).'
  },
  {
    key: 'formatterKind',
    label: 'Formatter',
    type: 'select',
    description: 'Display formatting layer independent from projection mathematics.'
  },
  {
    key: 'startValue',
    label: 'Domain Start',
    type: 'number',
    description: 'Lower bound of the logarithmic domain.'
  },
  {
    key: 'endValue',
    label: 'Domain End',
    type: 'number',
    description: 'Upper bound of the logarithmic domain.'
  },
  {
    key: 'logarithmicBase',
    label: 'Logarithmic Base',
    type: 'number',
    description: 'Base used for logarithmic normalization and projection.'
  },
  {
    key: 'logarithmicDecades',
    label: 'Number of Decades',
    type: 'number',
    description: 'Optional decade span clamp from the domain start.'
  },
  {
    key: 'logarithmicDisplayMultiplier',
    label: 'Display Multiplier',
    type: 'number',
    description: 'Display-only multiplier for labels without affecting placement.'
  },
  {
    key: 'logarithmicDisplayFormat',
    label: 'Display Format',
    type: 'select',
    description: 'Engineering, scientific, slide-rule, or custom formatting.'
  },
  {
    key: 'logarithmicLabelStyle',
    label: 'Label Style',
    type: 'select',
    description: 'Render labels by value, mantissa, or scientific notation.'
  },
  {
    key: 'direction',
    label: 'Direction',
    type: 'select',
    description: 'Clockwise or counter-clockwise projection direction.'
  },
  {
    key: 'radiusMm',
    label: 'Tick Radius',
    type: 'number',
    description: 'Primary ring radius used for logarithmic ticks.'
  },
  {
    key: 'tickDensityProfile',
    label: 'Tick Density',
    type: 'select',
    description: 'Adaptive subdivision profile for logarithmic intervals.'
  },
  {
    key: 'logMajorTickDensity',
    label: 'Major Tick Density',
    type: 'number',
    description: 'Controls major interval retention density.'
  },
  {
    key: 'logMinorTickDensity',
    label: 'Minor Tick Density',
    type: 'number',
    description: 'Controls secondary tick generation density.'
  },
  {
    key: 'logMicroTickDensity',
    label: 'Micro Tick Density',
    type: 'number',
    description: 'Controls tertiary and micro tick generation density.'
  },
  {
    key: 'labelFrequency',
    label: 'Label Density',
    type: 'number',
    description: 'Frequency for major label placement.'
  },
  {
    key: 'includeMinorLabels',
    label: 'Minor Labels',
    type: 'boolean',
    description: 'Enable secondary-value labels on dense profiles.'
  },
  {
    key: 'labelOrientation',
    label: 'Text Orientation',
    type: 'select',
    description: 'Choose radial, horizontal, or tangential-like curved labels.'
  },
  {
    key: 'rotationOffsetDeg',
    label: 'Rotation Offset',
    type: 'number',
    description: 'Apply global angular offset after logarithmic projection.'
  },
  {
    key: 'engineeringPreset',
    label: 'Engineering Preset',
    type: 'select',
    description: 'Preset for precision, aviation, and scientific workflows.'
  },
  {
    key: 'logarithmicRingType',
    label: 'Ring Type',
    type: 'select',
    description: 'Profile identifier for C/D/CI/DI/A/B/K/L/LL and aviation rings.'
  }
];

const defaultConfig: ScalePluginConfig = {
  startValue: 1,
  endValue: 10,
  majorStep: 1,
  minorStep: 0.1,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 2.3,
  minorTickLengthMm: 0.9,
  majorTickWidthMm: 0.2,
  minorTickWidthMm: 0.12,
  tickDirection: 'outside',
  tickStyle: 'line',
  labelFrequency: 1,
  labelOrientation: 'radial',
  labelPlacement: 'outside',
  labelRotationOffsetDeg: 0,
  rotationOffsetDeg: 0,
  color: '#F8FAFC',
  fontFamily: '"IBM Plex Mono", monospace',
  previewEnabled: true,
  bandInnerRadiusMm: 14,
  bandOuterRadiusMm: 20,
  minimumLineWidthMm: 0.1,
  logarithmicBase: 10,
  logarithmicDecades: 1,
  logarithmicDisplayMultiplier: 1,
  logarithmicDisplayFormat: 'engineering',
  logarithmicLabelStyle: 'value',
  logMajorTickDensity: 1,
  logMinorTickDensity: 1,
  logMicroTickDensity: 4,
  logarithmicRingType: 'C',
  tickDensityProfile: 'balanced',
  includeMinorLabels: false,
  engineeringPreset: 'precision',
  projectionKind: 'logarithmic',
  engineeringProfileKind: 'C',
  formatterKind: 'engineering'
};

const toValidationResult = (
  frameworkIssues: ScaleValidationIssue[],
  valid: boolean,
  healthReport?: ScaleValidationResult['healthReport']
): ScaleValidationResult => {
  return {
    valid,
    warnings: frameworkIssues.map((issue) => issue.message),
    structuredWarnings: frameworkIssues.map((issue) => ({
      severity: issue.severity,
      description: issue.message,
      affectedObject: issue.affectedObject,
      suggestedFix: issue.suggestedFix
    })),
    healthReport
  };
};

const evaluateMonotonicOrdering = (
  ticks: ScaleTick[],
  direction: ScalePluginConfig['direction']
): ScaleValidationIssue[] => {
  const issues: ScaleValidationIssue[] = [];
  const projected = ticks
    .filter((tick) => typeof tick.value === 'number')
    .sort((left, right) => (left.value ?? 0) - (right.value ?? 0));

  for (let index = 1; index < projected.length; index += 1) {
    const previous = projected[index - 1];
    const current = projected[index];
    if (!previous || !current) {
      continue;
    }

    const angleDelta = current.angleDeg - previous.angleDeg;
    if (direction === 'clockwise' && angleDelta <= 0) {
      issues.push({
        severity: 'error',
        code: 'NON_MONOTONIC',
        message: 'Clockwise logarithmic projection lost monotonic angular ordering.',
        affectedObject: 'scale-generator',
        suggestedFix: 'Review start/end angles or projection direction.'
      });
      break;
    }

    if (direction === 'counter-clockwise' && angleDelta >= 0) {
      issues.push({
        severity: 'error',
        code: 'NON_MONOTONIC',
        message: 'Counter-clockwise logarithmic projection lost monotonic angular ordering.',
        affectedObject: 'scale-generator',
        suggestedFix: 'Review start/end angles or projection direction.'
      });
      break;
    }

    if (!Number.isFinite(angleDelta) || Math.abs(angleDelta) < 1e-9) {
      issues.push({
        severity: 'error',
        code: 'PROJECTION_CONTINUITY',
        message: 'Logarithmic projection continuity failed between adjacent values.',
        affectedObject: 'scale-generator',
        suggestedFix: 'Adjust value domain and ensure valid logarithmic base.'
      });
      break;
    }
  }

  return issues;
};

const evaluatePrecision = (ticks: ScaleTick[]): ScaleValidationIssue[] => {
  const issues: ScaleValidationIssue[] = [];
  const unstable = ticks.some((tick) => !Number.isFinite(tick.angleDeg) || Number.isNaN(tick.angleDeg));

  if (unstable) {
    issues.push({
      severity: 'error',
      code: 'NUMERICAL_PRECISION',
      message: 'Numerical precision instability detected in logarithmic projection.',
      affectedObject: 'scale-generator',
      suggestedFix: 'Constrain value domain and avoid invalid logarithmic inputs.'
    });
  }

  const duplicateValueCount = ticks
    .filter((tick) => typeof tick.value === 'number')
    .reduce((accumulator, tick) => {
      const key = (tick.value ?? 0).toFixed(6);
      accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>());

  const hasDuplicates = [...duplicateValueCount.values()].some((count) => count > 1);
  if (hasDuplicates) {
    issues.push({
      severity: 'warning',
      code: 'DUPLICATE_LABELS',
      message: 'Duplicate logarithmic values detected in generated ticks.',
      affectedObject: 'scale-generator',
      suggestedFix: 'Lower tick density profile or revise subdivision strategy.'
    });
  }

  return issues;
};

const applyEngineeringPreset = (config: ScalePluginConfig): ScalePluginConfig => {
  const profiled = applyEngineeringProfile(config);

  if (profiled.engineeringPreset === 'aviation') {
    return {
      ...profiled,
      tickDensityProfile: 'dense',
      includeMinorLabels: true,
      majorTickLengthMm: Math.max(profiled.majorTickLengthMm, 2.4),
      minorTickLengthMm: Math.max(profiled.minorTickLengthMm, 0.95)
    };
  }

  if (profiled.engineeringPreset === 'scientific') {
    return {
      ...profiled,
      tickDensityProfile: 'balanced',
      includeMinorLabels: true,
      labelOrientation: 'horizontal'
    };
  }

  return {
    ...profiled,
    tickDensityProfile: profiled.tickDensityProfile ?? 'balanced',
    includeMinorLabels: profiled.includeMinorLabels ?? false
  };
};

const generateTicks = (config: ScalePluginConfig, context: ScaleMathContext): ScaleTick[] => {
  const effectiveConfig = applyEngineeringPreset(config);
  const projection = getProjection(resolveProjectionKindFromConfig(effectiveConfig));
  const { ticks } = tickEngine.generate({
    config: effectiveConfig,
    context,
    toAngle: projection.valueToAngle
  });

  return ticks;
};

export const circularLogarithmicScalePlugin: ScalePlugin = {
  kind: 'logarithmic',
  metadata: {
    name: 'Circular Logarithmic Scale',
    description: 'Reusable circular base-10 logarithmic engineering scale engine.',
    category: 'scientific',
    enabledByDefault: true,
    supportsUserPresets: true
  },
  help: {
    purpose:
      'Provide mathematically rigorous circular logarithmic projection for reusable aviation and scientific scale plugins.',
    history:
      'Circular logarithmic scales are the mathematical foundation behind aviation slide rules and watch calculator rings.',
    mathematicalBackground:
      'Value mapping uses base-10 logarithmic normalization across configurable arc boundaries before radial projection.',
    typicalUse:
      'Use for circular calculators, scientific bezel references, and future aviation timing extensions.',
    watchExamples:
      'Supports slide-rule inspired rings, calculator bezels, and multi-ring scientific dials.',
    manufacturingNotes:
      'Verify micro tick spacing against process capability; dense profiles may exceed pad print limits on narrow rings.'
  },
  inspectorConfiguration,
  mathematicalModel: 'logarithmic',
  displayName: 'Circular Logarithmic Scale',
  defaultConfig,
  mathematics: (value, config, context) => {
    const effectiveConfig = applyEngineeringPreset(config);
    const projection = getProjection(resolveProjectionKindFromConfig(effectiveConfig));
    return projection.valueToAngle(value, effectiveConfig, context);
  },
  tickGenerator: generateTicks,
  labelGenerator: (ticks, config) => {
    const effectiveConfig = applyEngineeringPreset(config);
    return labelEngine.generate({ ticks, config: effectiveConfig });
  },
  geometryGenerator: (ticks, labels) => ({ ticks, labels }),
  previewGenerator: (config, context) => {
    const effectiveConfig = applyEngineeringPreset(config);
    const ticks = generateTicks(effectiveConfig, context);
    const labels = labelEngine.generate({ ticks, config: effectiveConfig });
    const preview = createPreviewGeometry(ticks, labels);
    return `Circular Logarithmic Scale: ${preview.tickCount} ticks, ${preview.labelCount} labels`;
  },
  validate: (config, ticks, labels) => {
    const effectiveConfig = applyEngineeringPreset(config);
    const projection = getProjection(resolveProjectionKindFromConfig(effectiveConfig));
    const domainWarnings = projection.validateDomain(effectiveConfig);
    const collisions = collisionFramework.detect({
      ticks,
      labels,
      config: effectiveConfig,
      context: { startAngleDeg: 0, endAngleDeg: 360 }
    });
    const baseValidation = validationEngine.validate({
      config: effectiveConfig,
      ticks,
      labels,
      domainWarnings,
      collisions
    });

    const customIssues = [
      ...evaluateMonotonicOrdering(ticks, config.direction),
      ...evaluatePrecision(ticks)
    ];

    const issues = [...baseValidation.issues, ...customIssues];
    const valid = !issues.some((issue) => issue.severity === 'error');

    return toValidationResult(issues, valid, baseValidation.healthReport);
  },
  svgOutput: (ticks, labels) => exporter.toSvg({ kind: 'logarithmic', ticks, labels }),
  manufacturingMetadata: (ticks, labels, sourceConfig) => {
    const config = applyEngineeringPreset(sourceConfig);
    const metadata = exporter.manufacturingMetadata?.({ kind: 'logarithmic', ticks, labels }, config);
    if (!metadata) {
      return undefined;
    }

    const profile = resolveEngineeringProfile(config);
    const profileDiagnostics = getProfileManufacturingDiagnostics(profile, config);

    return {
      ...metadata,
      ringDensityWarnings: [...(metadata.ringDensityWarnings ?? []), ...profileDiagnostics]
    };
  }
};
