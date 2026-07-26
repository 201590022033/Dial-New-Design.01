import {
  LinearScaleMathematics,
  createCollisionFramework,
  createLabelPlacementEngine,
  createScaleExporter,
  createScaleValidationEngine,
  createTickGenerationEngine
} from '@/domain/scales/framework';
import { createPreviewGeometry } from '@/domain/scales/preview';
import type {
  ScaleMathContext,
  ScalePlugin,
  ScalePluginConfig,
  ScaleTick,
  ScaleValidationResult
} from '@/domain/scales/types';

const mathematics = new LinearScaleMathematics();
const tickEngine = createTickGenerationEngine();
const labelEngine = createLabelPlacementEngine();
const validationEngine = createScaleValidationEngine();
const collisionFramework = createCollisionFramework();
const exporter = createScaleExporter();

const inspectorConfiguration: ScalePlugin['inspectorConfiguration'] = [
  {
    key: 'startValue',
    label: 'Start Value',
    type: 'number',
    description: 'Inclusive scale start value.'
  },
  {
    key: 'endValue',
    label: 'End Value',
    type: 'number',
    description: 'Inclusive scale end value.'
  },
  {
    key: 'majorStep',
    label: 'Major Tick Interval',
    type: 'number',
    description: 'Distance between major ticks in value domain.'
  },
  {
    key: 'minorStep',
    label: 'Minor Tick Interval',
    type: 'number',
    description: 'Distance between minor ticks in value domain.'
  },
  {
    key: 'majorTickLengthMm',
    label: 'Major Tick Length',
    type: 'number',
    description: 'Radial length of major ticks.'
  },
  {
    key: 'minorTickLengthMm',
    label: 'Minor Tick Length',
    type: 'number',
    description: 'Radial length of minor ticks.'
  },
  {
    key: 'majorTickWidthMm',
    label: 'Major Tick Width',
    type: 'number',
    description: 'Line width of major ticks.'
  },
  {
    key: 'minorTickWidthMm',
    label: 'Minor Tick Width',
    type: 'number',
    description: 'Line width of minor ticks.'
  },
  {
    key: 'labelFrequency',
    label: 'Label Frequency',
    type: 'number',
    description: 'Show every nth major label.'
  },
  {
    key: 'labelPlacement',
    label: 'Label Placement',
    type: 'select',
    description: 'Place labels inside or outside tick ring.'
  }
];

const defaultConfig: ScalePluginConfig = {
  startValue: 0,
  endValue: 60,
  majorStep: 10,
  minorStep: 2,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 2,
  minorTickLengthMm: 1,
  majorTickWidthMm: 0.22,
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
  minimumLineWidthMm: 0.1
};

const toValidationResult = (
  frameworkResult: ReturnType<typeof validationEngine.validate>
): ScaleValidationResult => {
  return {
    valid: frameworkResult.valid,
    warnings: frameworkResult.warnings,
    structuredWarnings: frameworkResult.issues.map((issue) => ({
      severity: issue.severity,
      description: issue.message,
      affectedObject: issue.affectedObject,
      suggestedFix: issue.suggestedFix
    })),
    healthReport: frameworkResult.healthReport
  };
};

const generateTicks = (config: ScalePluginConfig, context: ScaleMathContext): ScaleTick[] => {
  const { ticks } = tickEngine.generate({
    config,
    context,
    toAngle: mathematics.valueToAngle.bind(mathematics)
  });

  return ticks;
};

export const linearEngineeringPlugin: ScalePlugin = {
  kind: 'linear',
  metadata: {
    name: 'Linear Scale',
    description: 'Engineering-grade linear value mapping for professional dial scales.',
    category: 'utility',
    enabledByDefault: true,
    supportsUserPresets: true
  },
  help: {
    purpose:
      'Map uniformly spaced values to angular positions for precise instrument and chronograph scales.',
    history:
      'Linear graduations are the most common professional scale form, used extensively in timing and instrument watches.',
    mathematicalBackground:
      'Value-to-angle uses linear interpolation in the configured domain and circular projection across the target arc.',
    typicalUse:
      'Use for tachymeter variants, elapsed timing tracks, and instrument references requiring constant value deltas.',
    watchExamples:
      'Applied on tool chronographs, pilot instrumentation-inspired dials, and precision measurement layouts.',
    manufacturingNotes:
      'Maintain minor tick stroke above manufacturing minimum and ensure angular spacing supports print process tolerance.'
  },
  inspectorConfiguration,
  mathematicalModel: 'linear',
  displayName: 'Linear Scale',
  defaultConfig,
  mathematics: (value, config, context) => mathematics.valueToAngle(value, config, context),
  tickGenerator: generateTicks,
  labelGenerator: (ticks, config) => labelEngine.generate({ ticks, config }),
  geometryGenerator: (ticks, labels) => ({ ticks, labels }),
  previewGenerator: (config, context) => {
    const ticks = generateTicks(config, context);
    const labels = labelEngine.generate({ ticks, config });
    const preview = createPreviewGeometry(ticks, labels);
    return `Linear Scale: ${preview.tickCount} ticks, ${preview.labelCount} labels`;
  },
  validate: (config, ticks, labels) => {
    const domainWarnings = mathematics.validateDomain(config);
    const collisions = collisionFramework.detect({ ticks, labels, config, context: { startAngleDeg: 0, endAngleDeg: 360 } });
    const frameworkResult = validationEngine.validate({
      config,
      ticks,
      labels,
      domainWarnings,
      collisions
    });
    return toValidationResult(frameworkResult);
  },
  svgOutput: (ticks, labels) => exporter.toSvg({ kind: 'linear', ticks, labels }),
  manufacturingMetadata: (ticks, labels, config) =>
    exporter.manufacturingMetadata?.({ kind: 'linear', ticks, labels }, config)
};
