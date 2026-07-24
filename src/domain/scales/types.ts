export type ScaleKind =
  | 'linear'
  | 'circular'
  | 'logarithmic'
  | 'slide-rule'
  | 'tachymeter'
  | 'telemeter'
  | 'pulsometer'
  | 'compass'
  | 'countdown'
  | 'fuel'
  | 'distance'
  | 'speed'
  | 'altitude'
  | 'pressure'
  | 'temperature'
  | 'custom';

export type ScaleCategory =
  | 'navigation'
  | 'timing'
  | 'scientific'
  | 'instrument'
  | 'utility'
  | 'custom';

export type ScaleMathModel = 'linear' | 'circular' | 'logarithmic' | 'angular' | 'polar' | 'radial';

export type TickDirection = 'inside' | 'outside' | 'bidirectional';
export type TickStyle = 'line' | 'block' | 'decorative';
export type LabelPlacement = 'inside' | 'outside';

export interface ScaleTick {
  angleDeg: number;
  radiusMm: number;
  lengthMm: number;
  widthMm: number;
  weight: 'minor' | 'major';
  direction: TickDirection;
  style: TickStyle;
  label?: string;
}

export interface ScaleLabel {
  text: string;
  angleDeg: number;
  radiusMm: number;
  orientation: 'radial' | 'horizontal' | 'curved';
  rotationDeg: number;
  placement: LabelPlacement;
}

export interface ScaleValidationResult {
  valid: boolean;
  warnings: string[];
  structuredWarnings: Array<{
    severity: 'info' | 'warning' | 'error';
    description: string;
    affectedObject: string;
    suggestedFix: string;
  }>;
}

export interface ScalePluginConfig {
  startValue: number;
  endValue: number;
  majorStep: number;
  minorStep: number;
  direction: 'clockwise' | 'counter-clockwise';
  radiusMm: number;
  majorTickLengthMm: number;
  minorTickLengthMm: number;
  majorTickWidthMm: number;
  minorTickWidthMm: number;
  tickDirection: TickDirection;
  tickStyle: TickStyle;
  labelFrequency: number;
  labelOrientation: 'radial' | 'horizontal' | 'curved';
  labelPlacement: LabelPlacement;
  labelRotationOffsetDeg: number;
  rotationOffsetDeg: number;
  color: string;
  fontFamily: string;
  previewEnabled: boolean;
  bandInnerRadiusMm: number;
  bandOuterRadiusMm: number;
  minimumLineWidthMm: number;
}

export interface ScaleMathContext {
  startAngleDeg: number;
  endAngleDeg: number;
}

export interface ScaleGeometryOutput {
  ticks: ScaleTick[];
  labels: ScaleLabel[];
}

export interface ScaleInspectorField {
  key: keyof ScalePluginConfig;
  label: string;
  type: 'number' | 'select' | 'color' | 'boolean' | 'text';
  description: string;
}

export interface ScalePluginHelp {
  purpose: string;
  history: string;
  mathematicalBackground: string;
  typicalUse: string;
  watchExamples: string;
  manufacturingNotes: string;
}

export interface ScalePluginMetadata {
  name: string;
  description: string;
  category: ScaleCategory;
  enabledByDefault: boolean;
  supportsUserPresets: boolean;
}

export interface ScalePlugin {
  kind: ScaleKind;
  metadata: ScalePluginMetadata;
  help: ScalePluginHelp;
  inspectorConfiguration: ScaleInspectorField[];
  mathematicalModel: ScaleMathModel;
  displayName: string;
  defaultConfig: ScalePluginConfig;
  mathematics: (value: number, config: ScalePluginConfig, context: ScaleMathContext) => number;
  tickGenerator: (config: ScalePluginConfig, context: ScaleMathContext) => ScaleTick[];
  labelGenerator: (ticks: ScaleTick[], config: ScalePluginConfig) => ScaleLabel[];
  geometryGenerator: (ticks: ScaleTick[], labels: ScaleLabel[]) => ScaleGeometryOutput;
  previewGenerator: (config: ScalePluginConfig, context: ScaleMathContext) => string;
  validate: (config: ScalePluginConfig, ticks: ScaleTick[], labels: ScaleLabel[]) => ScaleValidationResult;
  svgOutput: (ticks: ScaleTick[], labels: ScaleLabel[]) => string;
}

export interface ScaleRegistryEntry {
  plugin: ScalePlugin;
  enabled: boolean;
  source: 'built-in' | 'user';
}
