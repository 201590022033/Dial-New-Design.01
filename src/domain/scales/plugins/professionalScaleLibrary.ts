import {
  createCollisionFramework,
  createLabelPlacementEngine,
  createScaleExporter,
  createScaleValidationEngine,
  createTickGenerationEngine,
  evaluateManufacturingOptimization,
  mergeValidationWithLayoutDiagnostics,
  optimizeLayoutForReadability,
  resolveAdaptiveDensity,
  annotateTickGeneration
} from '@/domain/scales/framework';
import { createPreviewGeometry } from '@/domain/scales/preview';
import {
  circularAngleForRatio,
  linearInterpolate,
  linearToAngle
} from '@/domain/scales/math';
import type {
  ScaleMathContext,
  ScalePlugin,
  ScalePluginConfig,
  ScaleTick,
  ScaleValidationResult
} from '@/domain/scales/types';

interface ProfessionalPluginDefinition {
  kind: ScalePlugin['kind'];
  name: string;
  description: string;
  category: ScalePlugin['metadata']['category'];
  mathematicalModel: ScalePlugin['mathematicalModel'];
  toAngle?: (value: number, config: ScalePluginConfig, context: ScaleMathContext) => number;
  defaultConfig: ScalePluginConfig;
  labelFormatter?: (value: number, config: ScalePluginConfig) => string;
  help: ScalePlugin['help'];
}

const tickEngine = createTickGenerationEngine({ maxTickCount: 1200 });
const labelEngine = createLabelPlacementEngine();
const validationEngine = createScaleValidationEngine();
const collisionFramework = createCollisionFramework();
const exporter = createScaleExporter();

const inspectorConfiguration: ScalePlugin['inspectorConfiguration'] = [
  { key: 'startValue', label: 'Start Value', type: 'number', description: 'Scale start value.' },
  { key: 'endValue', label: 'End Value', type: 'number', description: 'Scale end value.' },
  { key: 'majorStep', label: 'Major Tick Interval', type: 'number', description: 'Interval of major ticks.' },
  { key: 'minorStep', label: 'Minor Tick Interval', type: 'number', description: 'Interval of minor ticks.' },
  { key: 'tickDensityProfile', label: 'Density Profile', type: 'select', description: 'Adaptive tick profile.' },
  { key: 'labelFrequency', label: 'Label Frequency', type: 'number', description: 'Show every nth major label.' },
  { key: 'labelOrientation', label: 'Text Orientation', type: 'select', description: 'Label orientation mode.' },
  { key: 'direction', label: 'Direction', type: 'select', description: 'Clockwise/counter-clockwise direction.' },
  { key: 'radiusMm', label: 'Radius', type: 'number', description: 'Ring radius in mm.' },
  { key: 'rotationOffsetDeg', label: 'Rotation Offset', type: 'number', description: 'Global angular offset.' }
];

const baseConfig = (overrides: Partial<ScalePluginConfig>): ScalePluginConfig => ({
  startValue: 0,
  endValue: 100,
  majorStep: 10,
  minorStep: 2,
  direction: 'clockwise',
  radiusMm: 18,
  majorTickLengthMm: 2,
  minorTickLengthMm: 1,
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
  tickDensityProfile: 'engineering',
  includeMinorLabels: false,
  validationVisibility: true,
  ...overrides
});

const toValidation = (
  result: ReturnType<typeof validationEngine.validate> & {
    warnings?: string[];
  }
): ScaleValidationResult => ({
  valid: result.valid,
  warnings: result.warnings,
  structuredWarnings: result.issues.map((issue) => ({
    severity: issue.severity,
    description: issue.message,
    affectedObject: issue.affectedObject,
    suggestedFix: issue.suggestedFix
  })),
  healthReport: result.healthReport
});

const withFormattedLabels = (
  ticks: ScaleTick[],
  config: ScalePluginConfig,
  formatter?: (value: number, cfg: ScalePluginConfig) => string
): ScaleTick[] => {
  if (!formatter) {
    return ticks;
  }

  return ticks.map((tick) => {
    if (tick.weight !== 'major' || typeof tick.value !== 'number') {
      return tick;
    }

    return {
      ...tick,
      label: formatter(tick.value, config)
    };
  });
};

const createProfessionalPlugin = (definition: ProfessionalPluginDefinition): ScalePlugin => {
  const toAngle = definition.toAngle ?? linearToAngle;

  const generateTicks = (config: ScalePluginConfig, context: ScaleMathContext): ScaleTick[] => {
    const spanDeg = context.endAngleDeg - context.startAngleDeg;
    const adaptive = resolveAdaptiveDensity(config, spanDeg, config.radiusMm);

    const tunedConfig: ScalePluginConfig = {
      ...config,
      tickDensityProfile: adaptive.profile,
      labelFrequency: Math.max(config.labelFrequency, adaptive.labelFrequency)
    };

    const generation = tickEngine.generate({
      config: tunedConfig,
      context,
      toAngle
    });

    const annotated = annotateTickGeneration(generation, adaptive);
    const formatted = withFormattedLabels(annotated.ticks, tunedConfig, definition.labelFormatter);

    return formatted;
  };

  return {
    kind: definition.kind,
    metadata: {
      name: definition.name,
      description: definition.description,
      category: definition.category,
      enabledByDefault: true,
      supportsUserPresets: true
    },
    help: definition.help,
    inspectorConfiguration,
    mathematicalModel: definition.mathematicalModel,
    displayName: definition.name,
    defaultConfig: definition.defaultConfig,
    mathematics: (value, config, context) => toAngle(value, config, context),
    tickGenerator: generateTicks,
    labelGenerator: (ticks, config) => labelEngine.generate({ ticks, config }),
    geometryGenerator: (ticks, labels) => ({ ticks, labels }),
    previewGenerator: (config, context) => {
      const ticks = generateTicks(config, context);
      const labels = labelEngine.generate({ ticks, config });
      const preview = createPreviewGeometry(ticks, labels);
      return `${definition.name}: ${preview.tickCount} ticks, ${preview.labelCount} labels`;
    },
    validate: (config, ticks, labels) => {
      const collisions = collisionFramework.detect({
        ticks,
        labels,
        config,
        context: { startAngleDeg: 0, endAngleDeg: 360 }
      });

      const optimized = optimizeLayoutForReadability(ticks, labels, collisions, {
        enabled: true
      });

      const secondPassCollisions = collisionFramework.detect({
        ticks: optimized.ticks,
        labels: optimized.labels,
        config,
        context: { startAngleDeg: 0, endAngleDeg: 360 }
      });

      const baseValidation = validationEngine.validate({
        config,
        ticks: optimized.ticks,
        labels: optimized.labels,
        collisions: secondPassCollisions
      });

      const manufacturing = evaluateManufacturingOptimization(optimized.ticks, optimized.labels);
      const merged = mergeValidationWithLayoutDiagnostics(baseValidation, manufacturing, secondPassCollisions);

      return toValidation(merged);
    },
    svgOutput: (ticks, labels) => exporter.toSvg({ kind: definition.kind, ticks, labels }),
    manufacturingMetadata: (ticks, labels, config) => {
      const metadata = exporter.manufacturingMetadata?.({ kind: definition.kind, ticks, labels }, config);
      if (!metadata) {
        return undefined;
      }

      const diagnostics = evaluateManufacturingOptimization(ticks, labels);
      return {
        ...metadata,
        minimumEngravingSpacingDeg: diagnostics.minimumEngravingSpacingDeg,
        ringDensityWarnings: diagnostics.warnings,
        smallTextWarnings:
          labels.length > ticks.length * 0.4
            ? ['High label density may reduce small-text legibility.']
            : []
      };
    }
  };
};

const tachymeterToAngle = (value: number, config: ScalePluginConfig, context: ScaleMathContext): number => {
  const safeValue = Math.max(value, 1);
  const t = 3600 / safeValue;
  const tStart = 3600 / Math.max(config.startValue, 1);
  const tEnd = 3600 / Math.max(config.endValue, 1);
  const ratio = linearInterpolate(t, tStart, tEnd);
  return circularAngleForRatio(ratio, context, config.direction);
};

const telemeterToAngle = (value: number, config: ScalePluginConfig, context: ScaleMathContext): number => {
  const distanceMeters = value * 1000;
  const seconds = (distanceMeters * 2) / 343;
  const startSeconds = (Math.max(config.startValue, 0.01) * 1000 * 2) / 343;
  const endSeconds = (Math.max(config.endValue, 0.01) * 1000 * 2) / 343;
  const ratio = linearInterpolate(seconds, startSeconds, endSeconds);
  return circularAngleForRatio(ratio, context, config.direction);
};

const pulsometerToAngle = (value: number, config: ScalePluginConfig, context: ScaleMathContext): number => {
  const beats = 30;
  const safeValue = Math.max(value, 1);
  const seconds = (beats * 60) / safeValue;
  const startSeconds = (beats * 60) / Math.max(config.startValue, 1);
  const endSeconds = (beats * 60) / Math.max(config.endValue, 1);
  const ratio = linearInterpolate(seconds, startSeconds, endSeconds);
  return circularAngleForRatio(ratio, context, config.direction);
};

const countdownToAngle = (value: number, config: ScalePluginConfig, context: ScaleMathContext): number => {
  const ratio = linearInterpolate(config.endValue - value, 0, config.endValue - config.startValue);
  return circularAngleForRatio(ratio, context, config.direction);
};

const compassFormatter = (value: number): string => {
  const normalized = ((Math.round(value) % 360) + 360) % 360;
  if (normalized === 0) return 'N';
  if (normalized === 90) return 'E';
  if (normalized === 180) return 'S';
  if (normalized === 270) return 'W';
  return String(normalized);
};

const gmtFormatter = (value: number): string => String(Math.round(value) % 24).padStart(2, '0');

const conversionFormatter = (value: number, config: ScalePluginConfig): string => {
  const mode = config.engineeringPreset ?? 'engineering-calculator';
  if (mode === 'engineering-calculator') {
    const inches = value / 25.4;
    return `${Math.round(value)}mm|${inches.toFixed(2)}in`;
  }
  const kilometers = value * 1.60934;
  return `${Math.round(value)}mi|${kilometers.toFixed(2)}km`;
};

export const professionalTachymeterPlugin = createProfessionalPlugin({
  kind: 'tachymeter',
  name: 'Professional Tachymeter',
  description: 'Engineering-grade speed scale using reciprocal time spacing.',
  category: 'timing',
  mathematicalModel: 'ratio',
  toAngle: tachymeterToAngle,
  defaultConfig: baseConfig({
    startValue: 60,
    endValue: 500,
    majorStep: 20,
    minorStep: 10,
    tickDensityProfile: 'engineering'
  }),
  help: {
    purpose: 'Compute average speed over fixed distance using elapsed time mapping.',
    history: 'Chronograph tachymeter scales historically rely on reciprocal time spacing.',
    mathematicalBackground: 'Speed values map through time inversion t=3600/v before angular projection.',
    typicalUse: 'Motor racing and elapsed distance speed estimations.',
    watchExamples: 'Classic chronograph tachymeter bezels and chapter tracks.',
    manufacturingNotes: 'Dense high-speed region requires careful label collision management.'
  }
});

export const professionalTelemeterPlugin = createProfessionalPlugin({
  kind: 'telemeter',
  name: 'Professional Telemeter',
  description: 'Distance estimation from sound delay with configurable output range.',
  category: 'timing',
  mathematicalModel: 'distance',
  toAngle: telemeterToAngle,
  defaultConfig: baseConfig({
    startValue: 1,
    endValue: 20,
    majorStep: 1,
    minorStep: 0.5,
    tickDensityProfile: 'balanced'
  }),
  labelFormatter: (value) => `${value.toFixed(1)}km`,
  help: {
    purpose: 'Estimate distance from event flash-to-sound delay.',
    history: 'Telemeter scales appeared on military and field chronographs.',
    mathematicalBackground: 'Distance is proportional to sound travel time (d = c * t / 2).',
    typicalUse: 'Storm and artillery distance estimation.',
    watchExamples: 'Field chronographs with telemeter tracks.',
    manufacturingNotes: 'Ensure low-radius labels remain legible for fine unit suffixes.'
  }
});

export const professionalPulsometerPlugin = createProfessionalPlugin({
  kind: 'pulsometer',
  name: 'Professional Pulsometer',
  description: 'Medical pulse-rate scale based on fixed-beat calibration.',
  category: 'timing',
  mathematicalModel: 'ratio',
  toAngle: pulsometerToAngle,
  defaultConfig: baseConfig({
    startValue: 40,
    endValue: 220,
    majorStep: 10,
    minorStep: 5,
    tickDensityProfile: 'balanced'
  }),
  labelFormatter: (value) => `${Math.round(value)} bpm`,
  help: {
    purpose: 'Convert measured beats over calibration window into beats per minute.',
    history: 'Pulsometer scales were widely used on medical chronographs.',
    mathematicalBackground: 'BPM mapping uses reciprocal relationship bpm = beats*60/t.',
    typicalUse: 'Manual pulse checks over fixed beat counts.',
    watchExamples: 'Doctor chronographs with pulsometer chapter rings.',
    manufacturingNotes: 'Maintain strong contrast for dense medical scale labels.'
  }
});

export const professionalCompassRingPlugin = createProfessionalPlugin({
  kind: 'compass',
  name: 'Professional Compass Ring',
  description: 'Bearing ring with cardinal/intercardinal orientation controls.',
  category: 'navigation',
  mathematicalModel: 'angular',
  toAngle: linearToAngle,
  defaultConfig: baseConfig({
    startValue: 0,
    endValue: 360,
    majorStep: 30,
    minorStep: 10,
    tickDensityProfile: 'dense'
  }),
  labelFormatter: compassFormatter,
  help: {
    purpose: 'Display directional bearings for navigation and orientation.',
    history: 'Compass bezels and rings remain common in pilot and explorer watches.',
    mathematicalBackground: 'Linear angular bearing projection over full circular arc.',
    typicalUse: 'Bearing reference and directional alignment.',
    watchExamples: 'Pilot rings and rotating compass bezels.',
    manufacturingNotes: 'Cardinal glyph clarity depends on consistent radial placement.'
  }
});

export const professionalCountdownRingPlugin = createProfessionalPlugin({
  kind: 'countdown',
  name: 'Professional Countdown Ring',
  description: 'Configurable reverse-time scale with directional support.',
  category: 'timing',
  mathematicalModel: 'time',
  toAngle: countdownToAngle,
  defaultConfig: baseConfig({
    startValue: 0,
    endValue: 60,
    majorStep: 5,
    minorStep: 1,
    tickDensityProfile: 'engineering'
  }),
  help: {
    purpose: 'Track remaining time across a configurable countdown duration.',
    history: 'Countdown scales are common in regatta and mission timers.',
    mathematicalBackground: 'Reverse linear mapping from remaining time to angle.',
    typicalUse: 'Regatta starts, timed procedures, and event countdowns.',
    watchExamples: 'Countdown bezels and chapter rings.',
    manufacturingNotes: 'Reverse numbering often increases collision at endpoint cluster.'
  }
});

export const professionalGmtRingPlugin = createProfessionalPlugin({
  kind: 'gmt',
  name: 'Professional GMT Ring',
  description: '24-hour ring with flexible label formatting and rotation support.',
  category: 'navigation',
  mathematicalModel: 'time',
  toAngle: linearToAngle,
  defaultConfig: baseConfig({
    startValue: 0,
    endValue: 24,
    majorStep: 1,
    minorStep: 0.5,
    tickDensityProfile: 'balanced'
  }),
  labelFormatter: gmtFormatter,
  help: {
    purpose: 'Represent 24-hour time references for dual-time workflows.',
    history: 'GMT rings became foundational for pilot and travel watches.',
    mathematicalBackground: 'Linear 24-hour angular mapping with optional rotation offsets.',
    typicalUse: 'Dual-time and UTC offset tracking.',
    watchExamples: 'GMT bezels and 24h chapter rings.',
    manufacturingNotes: 'Two-digit labels can require adaptive omission on compact rings.'
  }
});

export const professionalConversionRingPlugin = createProfessionalPlugin({
  kind: 'conversion',
  name: 'Engineering Conversion Ring',
  description: 'Metric, imperial, and custom conversion-friendly ring.',
  category: 'utility',
  mathematicalModel: 'linear',
  toAngle: linearToAngle,
  defaultConfig: baseConfig({
    startValue: 10,
    endValue: 200,
    majorStep: 10,
    minorStep: 5,
    tickDensityProfile: 'balanced',
    engineeringPreset: 'engineering-calculator'
  }),
  labelFormatter: conversionFormatter,
  help: {
    purpose: 'Provide direct unit conversion guidance through paired labels.',
    history: 'Engineering instruments commonly include conversion references.',
    mathematicalBackground: 'Linear scale mapping with deterministic unit transform labels.',
    typicalUse: 'Metric-imperial checks and field conversions.',
    watchExamples: 'Instrument-style conversion chapter rings.',
    manufacturingNotes: 'Dual labels increase text footprint and should use adaptive layout.'
  }
});

export const professionalScalePlugins: ScalePlugin[] = [
  professionalTachymeterPlugin,
  professionalTelemeterPlugin,
  professionalPulsometerPlugin,
  professionalCompassRingPlugin,
  professionalCountdownRingPlugin,
  professionalGmtRingPlugin,
  professionalConversionRingPlugin
];
