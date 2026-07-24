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

export interface ScaleTick {
  angleDeg: number;
  radiusMm: number;
  lengthMm: number;
  weight: 'minor' | 'major';
  label?: string;
}

export interface ScaleLabel {
  text: string;
  angleDeg: number;
  radiusMm: number;
  orientation: 'radial' | 'horizontal' | 'curved';
}

export interface ScaleValidationResult {
  valid: boolean;
  warnings: string[];
}

export interface ScalePluginConfig {
  startValue: number;
  endValue: number;
  majorStep: number;
  minorStep: number;
  direction: 'clockwise' | 'counter-clockwise';
  radiusMm: number;
  labelEvery: number;
}

export interface ScaleMathContext {
  startAngleDeg: number;
  endAngleDeg: number;
}

export interface ScalePlugin {
  kind: ScaleKind;
  displayName: string;
  defaultConfig: ScalePluginConfig;
  mathematics: (value: number, config: ScalePluginConfig, context: ScaleMathContext) => number;
  tickGenerator: (config: ScalePluginConfig, context: ScaleMathContext) => ScaleTick[];
  labelGenerator: (ticks: ScaleTick[], config: ScalePluginConfig) => ScaleLabel[];
  previewGenerator: (config: ScalePluginConfig, context: ScaleMathContext) => string;
  validate: (config: ScalePluginConfig) => ScaleValidationResult;
  svgOutput: (ticks: ScaleTick[], labels: ScaleLabel[]) => string;
}
