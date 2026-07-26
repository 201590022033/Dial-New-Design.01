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
  createScaleValidationEngine,
  buildCoupledSlideRuleState,
  createSlideRuleCursorState,
  evaluateSlideRuleOperation,
  resolveSlideRulePreset
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
  { key: 'ringCouplingEnabled', label: 'Ring Coupling', type: 'boolean', description: 'Enable coupled ring engine.' },
  { key: 'direction', label: 'Direction', type: 'select', description: 'Shared mathematical direction.' },
  { key: 'outerRotationOffsetDeg', label: 'Outer Rotation', type: 'number', description: 'Outer ring rotation offset in degrees.' },
  { key: 'innerRotationOffsetDeg', label: 'Inner Rotation', type: 'number', description: 'Inner ring rotation offset in degrees.' },
  { key: 'referenceIndexDeg', label: 'Reference Index', type: 'number', description: 'Cursor reference index angle.' },
  { key: 'cursorType', label: 'Cursor Type', type: 'select', description: 'Transparent, fixed, rotating, or bezel cursor mode.' },
  { key: 'calculationMode', label: 'Calculation Mode', type: 'select', description: 'Multiplication, division, ratio, proportion, or sync.' },
  { key: 'engineeringPreset', label: 'Engineering Preset', type: 'select', description: 'Reusable geometric and workflow presets.' },
  { key: 'tickDensityProfile', label: 'Density Profile', type: 'select', description: 'Adaptive logarithmic tick density profile.' },
  { key: 'validationVisibility', label: 'Validation Visibility', type: 'boolean', description: 'Show full validation diagnostics in overlay.' }
];

const defaultConfig: ScalePluginConfig = {
  startValue: 1,
  endValue: 10,
  majorStep: 1,
  minorStep: 0.1,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 2.1,
  minorTickLengthMm: 0.85,
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
  bandOuterRadiusMm: 21,
  minimumLineWidthMm: 0.1,
  logarithmicBase: 10,
  tickDensityProfile: 'balanced',
  includeMinorLabels: true,
  engineeringPreset: 'circular-calculator',
  outerRadiusMm: 18.7,
  innerRadiusMm: 16.9,
  outerRotationOffsetDeg: 0,
  innerRotationOffsetDeg: 12,
  ringSyncMode: 'independent',
  lockRingMovement: false,
  ringCouplingEnabled: true,
  referenceIndexDeg: 0,
  cursorType: 'transparent',
  calculationMode: 'multiplication',
  validationVisibility: true
};

const toValidationResult = (
  issues: ScaleValidationIssue[],
  healthReport?: ScaleValidationResult['healthReport']
): ScaleValidationResult => ({
  valid: !issues.some((issue) => issue.severity === 'error'),
  warnings: issues.map((issue) => issue.message),
  structuredWarnings: issues.map((issue) => ({
    severity: issue.severity,
    description: issue.message,
    affectedObject: issue.affectedObject,
    suggestedFix: issue.suggestedFix
  })),
  healthReport
});

const classifySlideRuleIssues = (
  config: ScalePluginConfig,
  ticks: ScaleTick[]
): ScaleValidationIssue[] => {
  const issues: ScaleValidationIssue[] = [];
  const outerRadius = config.outerRadiusMm ?? 0;
  const innerRadius = config.innerRadiusMm ?? 0;

  if (innerRadius >= outerRadius) {
    issues.push({
      severity: 'error',
      code: 'INVALID_RANGE',
      message: 'Inner ring radius must be smaller than outer ring radius.',
      affectedObject: 'slide-rule-engine',
      suggestedFix: 'Increase outer radius or decrease inner radius.'
    });
  }

  const outerTicks = ticks.filter((tick) => tick.ringId === 'outer');
  const innerTicks = ticks.filter((tick) => tick.ringId === 'inner');
  if (outerTicks.length === 0 || innerTicks.length === 0) {
    issues.push({
      severity: 'error',
      code: 'INVALID_DOMAIN',
      message: 'Coupled slide-rule rings must both generate ticks.',
      affectedObject: 'slide-rule-engine',
      suggestedFix: 'Review ring radii and logarithmic range.'
    });
  }

  if ((config.ringCouplingEnabled ?? true) && !config.ringSyncMode) {
    issues.push({
      severity: 'warning',
      code: 'PROJECTION_CONTINUITY',
      message: 'Ring coupling is enabled without explicit synchronization mode.',
      affectedObject: 'slide-rule-engine',
      suggestedFix: 'Set ring synchronization mode to locked or driven mode.'
    });
  }

  if (!Number.isFinite(config.outerRotationOffsetDeg ?? 0) || !Number.isFinite(config.innerRotationOffsetDeg ?? 0)) {
    issues.push({
      severity: 'error',
      code: 'NUMERICAL_PRECISION',
      message: 'Rotation offsets must be finite numbers.',
      affectedObject: 'slide-rule-engine',
      suggestedFix: 'Provide finite rotation offsets for inner and outer rings.'
    });
  }

  return issues;
};

const createRingTicks = (
  config: ScalePluginConfig,
  context: ScaleMathContext,
  ringId: 'outer' | 'inner'
): ScaleTick[] => {
  const projection = getProjection(resolveProjectionKindFromConfig(config));
  const state = buildCoupledSlideRuleState(config, context);
  const ring = ringId === 'outer' ? state.outer : state.inner;

  const ringConfig: ScalePluginConfig = {
    ...config,
    radiusMm: ring.radiusMm,
    rotationOffsetDeg: ring.rotationOffsetDeg
  };

  const { ticks } = tickEngine.generate({
    config: ringConfig,
    context,
    toAngle: projection.valueToAngle
  });

  return ticks.map((tick) => ({
    ...tick,
    ringId
  }));
};

const generateTicks = (sourceConfig: ScalePluginConfig, context: ScaleMathContext): ScaleTick[] => {
  const config = applyEngineeringProfile(resolveSlideRulePreset(sourceConfig));
  const outerTicks = createRingTicks(config, context, 'outer');
  const innerTicks = createRingTicks(config, context, 'inner');
  return [...outerTicks, ...innerTicks];
};

export const slideRuleScalePlugin: ScalePlugin = {
  kind: 'slide-rule',
  metadata: {
    name: 'General Circular Slide Rule',
    description: 'Reusable coupled-ring circular slide-rule engine for engineering and aviation workflows.',
    category: 'scientific',
    enabledByDefault: true,
    supportsUserPresets: true
  },
  help: {
    purpose:
      'Provide reusable coupled-ring logarithmic mathematics for circular slide-rule operations and design validation.',
    history:
      'Circular slide rules power aviation and scientific watch calculations through aligned logarithmic scales.',
    mathematicalBackground:
      'Two logarithmic rings share the same model while rotating relatively to encode multiplication, division, and ratio operations.',
    typicalUse:
      'Use for speed-distance-time, fuel relationships, ratio scaling, and engineering conversion workflows.',
    watchExamples:
      'Supports generic aviation and scientific circular calculators through presets instead of watch-specific hardcoding.',
    manufacturingNotes:
      'Dense ring profiles should be validated against printing and engraving spacing limits before production export.'
  },
  inspectorConfiguration,
  mathematicalModel: 'logarithmic',
  displayName: 'General Circular Slide Rule',
  defaultConfig,
  mathematics: (value, sourceConfig, context) => {
    const config = applyEngineeringProfile(resolveSlideRulePreset(sourceConfig));
    const projection = getProjection(resolveProjectionKindFromConfig(config));
    return projection.valueToAngle(value, config, context);
  },
  tickGenerator: (config, context) => generateTicks(config, context),
  labelGenerator: (ticks, sourceConfig) => {
    const config = resolveSlideRulePreset(sourceConfig);
    const outerLabels = labelEngine
      .generate({
        ticks: ticks.filter((tick) => tick.ringId === 'outer'),
        config: {
          ...config,
          labelPlacement: 'outside'
        }
      })
      .map((label) => ({ ...label, ringId: 'outer' as const }));

    const innerLabels = labelEngine
      .generate({
        ticks: ticks.filter((tick) => tick.ringId === 'inner'),
        config: {
          ...config,
          labelPlacement: 'inside'
        }
      })
      .map((label) => ({ ...label, ringId: 'inner' as const }));

    return [...outerLabels, ...innerLabels];
  },
  geometryGenerator: (ticks, labels) => ({ ticks, labels }),
  previewGenerator: (sourceConfig, context) => {
    const config = resolveSlideRulePreset(sourceConfig);
    const ticks = generateTicks(config, context);
    const labels = slideRuleScalePlugin.labelGenerator(ticks, config);
    const cursor = createSlideRuleCursorState(config);
    const preview = createPreviewGeometry(ticks, labels);

    return `General Circular Slide Rule: ${preview.tickCount} ticks, ${preview.labelCount} labels, cursor ${cursor.type}`;
  },
  validate: (sourceConfig, ticks, labels) => {
    const config = applyEngineeringProfile(resolveSlideRulePreset(sourceConfig));
    const projection = getProjection(resolveProjectionKindFromConfig(config));
    const domainWarnings = projection.validateDomain(config);
    const collisions = collisionFramework.detect({
      ticks,
      labels,
      config,
      context: { startAngleDeg: 0, endAngleDeg: 360 }
    });

    const baseValidation = validationEngine.validate({
      config,
      ticks,
      labels,
      domainWarnings,
      collisions
    });

    const customIssues = classifySlideRuleIssues(config, ticks);
    const operation = evaluateSlideRuleOperation(config, 2, 5, 4);
    if (!Number.isFinite(operation.value)) {
      customIssues.push({
        severity: 'error',
        code: 'NUMERICAL_PRECISION',
        message: 'Slide-rule operation produced an invalid finite result.',
        affectedObject: 'slide-rule-engine',
        suggestedFix: 'Adjust operation mode and divisor values.'
      });
    }

    return toValidationResult([...baseValidation.issues, ...customIssues], baseValidation.healthReport);
  },
  svgOutput: (ticks, labels) => exporter.toSvg({ kind: 'slide-rule', ticks, labels }),
  manufacturingMetadata: (ticks, labels, sourceConfig) => {
    const config = resolveSlideRulePreset(sourceConfig);
    const baseMetadata = exporter.manufacturingMetadata?.({ kind: 'slide-rule', ticks, labels }, config);

    if (!baseMetadata) {
      return undefined;
    }

    const denseThreshold = 0.75;
    const ringDensityWarnings: string[] = [];
    const smallTextWarnings: string[] = [];

    if (baseMetadata.minimumPrintableSpacingDeg < denseThreshold) {
      ringDensityWarnings.push('Ring density exceeds recommended printable spacing for standard pad-print workflows.');
    }

    const innerLabelCount = labels.filter((label) => label.ringId === 'inner').length;
    if ((config.innerRadiusMm ?? config.radiusMm) < 12 && innerLabelCount > 18) {
      smallTextWarnings.push('Inner ring radius and label count may produce text smaller than preferred engraving readability.');
    }

    const profile = resolveEngineeringProfile(config);
    const profileDiagnostics = getProfileManufacturingDiagnostics(profile, config);
    ringDensityWarnings.push(...profileDiagnostics);

    return {
      ...baseMetadata,
      minimumEngravingSpacingDeg: Number((baseMetadata.minimumPrintableSpacingDeg * 0.82).toFixed(4)),
      ringDensityWarnings,
      smallTextWarnings,
      suitability: {
        ...baseMetadata.suitability,
        laser: baseMetadata.suitability.laser && baseMetadata.minimumPrintableSpacingDeg >= 0.5,
        uv: baseMetadata.suitability.uv && baseMetadata.minimumPrintableSpacingDeg >= 0.38,
        cnc: baseMetadata.suitability.cnc && baseMetadata.minimumPrintableSpacingDeg >= 0.3
      }
    };
  }
};
