import type {
  ScaleLabel,
  ScaleMathContext,
  ScalePlugin,
  ScalePluginConfig,
  ScaleTick,
  ScaleValidationResult,
  ScaleKind
} from '@/domain/scales/types';

interface CircularPluginFactoryInput {
  kind: ScaleKind;
  displayName: string;
  mapValue?: (value: number) => number;
}

const defaultMath = (
  value: number,
  config: ScalePluginConfig,
  context: ScaleMathContext,
  mapValue?: (value: number) => number
): number => {
  const mappedValue = mapValue ? mapValue(value) : value;
  const mappedStart = mapValue ? mapValue(config.startValue) : config.startValue;
  const mappedEnd = mapValue ? mapValue(config.endValue) : config.endValue;
  const span = mappedEnd - mappedStart;

  if (span === 0) {
    return context.startAngleDeg;
  }

  const ratio = (mappedValue - mappedStart) / span;
  const direction = config.direction === 'clockwise' ? 1 : -1;
  return context.startAngleDeg + ratio * (context.endAngleDeg - context.startAngleDeg) * direction;
};

const generateTicks = (
  config: ScalePluginConfig,
  context: ScaleMathContext,
  mapValue?: (value: number) => number
): ScaleTick[] => {
  const ticks: ScaleTick[] = [];
  for (let value = config.startValue; value <= config.endValue; value += config.minorStep) {
    const isMajor = Math.abs(value % config.majorStep) < Number.EPSILON;
    ticks.push({
      angleDeg: defaultMath(value, config, context, mapValue),
      radiusMm: config.radiusMm,
      lengthMm: isMajor ? 1.8 : 1,
      weight: isMajor ? 'major' : 'minor',
      label: isMajor ? `${value}` : undefined
    });
  }
  return ticks;
};

const generateLabels = (ticks: ScaleTick[], config: ScalePluginConfig): ScaleLabel[] => {
  const labels: ScaleLabel[] = [];
  ticks.forEach((tick, index) => {
    if (tick.weight !== 'major') {
      return;
    }
    if (index % config.labelEvery !== 0) {
      return;
    }
    if (!tick.label) {
      return;
    }
    labels.push({
      text: tick.label,
      angleDeg: tick.angleDeg,
      radiusMm: tick.radiusMm + 1.8,
      orientation: 'radial'
    });
  });
  return labels;
};

const validateConfig = (config: ScalePluginConfig): ScaleValidationResult => {
  const warnings: string[] = [];
  if (config.endValue <= config.startValue) warnings.push('End value must be greater than start value.');
  if (config.majorStep <= 0) warnings.push('Major step must be positive.');
  if (config.minorStep <= 0) warnings.push('Minor step must be positive.');
  if (config.minorStep > config.majorStep) {
    warnings.push('Minor step should usually be <= major step for readability.');
  }
  return { valid: warnings.length === 0, warnings };
};

export const createCircularPlugin = ({ kind, displayName, mapValue }: CircularPluginFactoryInput): ScalePlugin => {
  return {
    kind,
    displayName,
    defaultConfig: {
      startValue: 0,
      endValue: 60,
      majorStep: 5,
      minorStep: 1,
      direction: 'clockwise',
      radiusMm: 18,
      labelEvery: 1
    },
    mathematics: (value, config, context) => defaultMath(value, config, context, mapValue),
    tickGenerator: (config, context) => generateTicks(config, context, mapValue),
    labelGenerator: generateLabels,
    previewGenerator: (config, context) => {
      return `${displayName}: ${config.startValue}-${config.endValue} over ${Math.abs(context.endAngleDeg - context.startAngleDeg)}deg`;
    },
    validate: validateConfig,
    svgOutput: (ticks, labels) => {
      const tickCount = ticks.length;
      const labelCount = labels.length;
      return `<g data-scale-kind="${kind}" data-ticks="${tickCount}" data-labels="${labelCount}"></g>`;
    }
  };
};
