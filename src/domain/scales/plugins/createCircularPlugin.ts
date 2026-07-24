import type {
  ScaleCategory,
  ScaleMathModel,
  ScaleMathContext,
  ScalePlugin,
  ScalePluginConfig,
  ScaleKind
} from '@/domain/scales/types';
import { generateLabels } from '@/domain/scales/labelGenerator';
import { linearToAngle } from '@/domain/scales/math';
import { createPreviewGeometry } from '@/domain/scales/preview';
import { generateTicks } from '@/domain/scales/tickGenerator';
import { validateScale } from '@/domain/scales/validation';

interface CircularPluginFactoryInput {
  kind: ScaleKind;
  displayName: string;
  description: string;
  category: ScaleCategory;
  mathematicalModel?: ScaleMathModel;
  toAngle?: (value: number, config: ScalePluginConfig, context: ScaleMathContext) => number;
}

const inspectorConfiguration: ScalePlugin['inspectorConfiguration'] = [
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
    key: 'labelFrequency',
    label: 'Label Frequency',
    type: 'number',
    description: 'Show every nth major label.'
  }
];

export const createCircularPlugin = ({
  kind,
  displayName,
  description,
  category,
  mathematicalModel = 'circular',
  toAngle = linearToAngle
}: CircularPluginFactoryInput): ScalePlugin => {
  return {
    kind,
    metadata: {
      name: displayName,
      description,
      category,
      enabledByDefault: true,
      supportsUserPresets: true
    },
    help: {
      purpose: `Placeholder purpose for ${displayName}.`,
      history: `Placeholder history for ${displayName}.`,
      mathematicalBackground: `Placeholder mathematics for ${displayName}.`,
      typicalUse: `Placeholder typical use for ${displayName}.`,
      watchExamples: `Placeholder watch examples for ${displayName}.`,
      manufacturingNotes: `Placeholder manufacturing notes for ${displayName}.`
    },
    inspectorConfiguration,
    mathematicalModel,
    displayName,
    defaultConfig: {
      startValue: 0,
      endValue: 60,
      majorStep: 5,
      minorStep: 1,
      direction: 'clockwise',
      radiusMm: 18,
      majorTickLengthMm: 1.8,
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
      bandOuterRadiusMm: 20,
      minimumLineWidthMm: 0.1
    },
    mathematics: (value, config, context) => toAngle(value, config, context),
    tickGenerator: (config, context) => generateTicks(config, context, toAngle),
    labelGenerator: generateLabels,
    geometryGenerator: (ticks, labels) => ({ ticks, labels }),
    previewGenerator: (config, context) => {
      const ticks = generateTicks(config, context, toAngle);
      const labels = generateLabels(ticks, config);
      const preview = createPreviewGeometry(ticks, labels);
      return `${displayName}: ${preview.tickCount} ticks, ${preview.labelCount} labels`;
    },
    validate: (config, ticks, labels) => validateScale(config, ticks, labels),
    svgOutput: (ticks, labels) => {
      const tickCount = ticks.length;
      const labelCount = labels.length;
      return `<g data-scale-kind="${kind}" data-ticks="${tickCount}" data-labels="${labelCount}"></g>`;
    }
  };
};
