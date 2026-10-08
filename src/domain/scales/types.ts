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
  | 'gmt'
  | 'conversion'
  | 'custom';

export type ScaleCategory =
  | 'navigation'
  | 'timing'
  | 'scientific'
  | 'instrument'
  | 'utility'
  | 'custom';

export type ScaleMathModel =
  | 'linear'
  | 'circular'
  | 'logarithmic'
  | 'angular'
  | 'polar'
  | 'radial'
  | 'ratio'
  | 'time'
  | 'distance';

export type ProjectionKind =
  | 'identity'
  | 'linear'
  | 'logarithmic'
  | 'reciprocal-logarithmic'
  | 'square'
  | 'square-root'
  | 'cube'
  | 'cube-root'
  | 'natural-log'
  | 'log-log'
  | 'exponential'
  | 'custom';

export type EngineeringProfileKind =
  | 'C'
  | 'D'
  | 'CI'
  | 'A'
  | 'B'
  | 'K'
  | 'L'
  | 'LL0'
  | 'LL1'
  | 'LL2'
  | 'LL3'
  | 'fuel-consumption'
  | 'distance-planning'
  | 'ground-speed'
  | 'true-air-speed'
  | 'time'
  | 'climb'
  | 'descent'
  | 'rate-of-climb'
  | 'wind-correction'
  | 'conversion'
  | 'unit-conversion'
  | 'fuel-burn'
  | 'holding-pattern'
  | 'glide-ratio'
  | 'cross-country-planning'
  | 'navitimer'
  | 'aviation'
  | 'scientific'
  | 'engineering'
  | 'navigation'
  | 'physics'
  | 'chemistry'
  | 'mathematics'
  | 'metric-conversion'
  | 'imperial-conversion'
  | 'length'
  | 'mass'
  | 'pressure'
  | 'temperature'
  | 'velocity'
  | 'power'
  | 'torque'
  | 'mechanical-advantage'
  | 'ratio'
  | 'proportion'
  | 'custom';

export type FormatterKind =
  | 'engineering'
  | 'scientific'
  | 'slide-rule'
  | 'navitimer'
  | 'mantissa'
  | 'decimal'
  | 'custom';

export type TickDirection = 'inside' | 'outside' | 'bidirectional';
export type TickStyle = 'line' | 'block' | 'decorative';
export type LabelPlacement = 'inside' | 'outside';

export interface ScaleTick {
  hoverPaddingMm?: number;
  id?: string;
  color?: string;
  semanticRole?: string;
  dedicatedConversion?: import('./calibratedSlideRule').ConversionClass;
  angleDeg: number;
  radiusMm: number;
  lengthMm: number;
  widthMm: number;
  weight: 'minor' | 'major';
  direction: TickDirection;
  style: TickStyle;
  label?: string;
  value?: number;
  tier?: 'primary' | 'secondary' | 'tertiary' | 'micro';
  ringId?: 'outer' | 'inner';
}

export interface ScaleLabel {
  /** Per-row reference typography and unit boxes; omitted by legacy Simplified artwork. */
  fontSizeMm?: number;
  backgroundColour?: string;
  backgroundPaddingMm?: number;
  hoverPaddingMm?: number;
  id?: string;
  color?: string;
  semanticRole?: string;
  dedicatedConversion?: import('./calibratedSlideRule').ConversionClass;
  /** Resolved glyph bounds in mm; absent values use disclosed conservative estimates. */
  boundsMm?: { width: number; height: number };
  boundsEvidence?: 'browser-measured' | 'estimated';
  text: string;
  angleDeg: number;
  radiusMm: number;
  orientation: 'radial' | 'horizontal' | 'curved';
  rotationDeg: number;
  placement: LabelPlacement;
  value?: number;
  ringId?: 'outer' | 'inner';
}

/** Printed substrate regions, not physical case geometry. */
export interface ScaleSubstrate {
  ringId: 'outer' | 'inner';
  innerRadiusMm: number;
  outerRadiusMm: number;
  color: string;
}

/** Source-neutral pointer geometry. No manufacturer positions are guessed. */
export interface ScalePointer {
  id: string;
  value: number;
  ringId: 'outer' | 'inner';
  radiusMm: number;
  angleDeg: number;
  shape: 'triangle' | 'diamond' | 'rectangle';
  widthMm: number;
  heightMm: number;
  strokeWidthMm: number;
  color: string;
  strokeColor?: string;
  rotationDeg?: number;
  hoverPaddingMm?: number;
  dedicatedConversion?: import('./calibratedSlideRule').ConversionClass;
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
  healthReport?: {
    mathematicalHealth: number;
    readabilityScore: number;
    collisionScore: number;
    manufacturingScore: number;
    validationScore: number;
    overallEngineeringScore: number;
  };
}

export interface ScalePluginConfig {
  referenceDesign?: 'citizen' | 'navitimer' | 'simplified';
  referenceColourMode?: 'original' | 'custom';
  referenceColourOverrides?: Record<string, string>;
  referenceDistanceVisible?: boolean;
  referenceLineFactor?: number;
  referenceTickFactor?: number;
  referencePixelMm?: number;
  referenceOuterTickRadiusMm?: number;
  referenceInnerTickRadiusMm?: number;
  referenceOuterNumeralRadiusMm?: number;
  referenceInnerNumeralRadiusMm?: number;
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
  labelOffsetMm?: number;
  labelRotationOffsetDeg: number;
  rotationOffsetDeg: number;
  color: string;
  fontFamily: string;
  scaleFontSizeMm?: number;
  scaleTickLengthFactor?: number;
  previewEnabled: boolean;
  bandInnerRadiusMm: number;
  bandOuterRadiusMm: number;
  minimumLineWidthMm: number;
  placementTargetBandId?: string;
  fixedPlacementTargetBandId?: string;
  physicalTargetsResolved?: boolean;
  fixedBandInnerRadiusMm?: number;
  fixedBandOuterRadiusMm?: number;
  outerNumeralsVisible?: boolean;
  innerNumeralsVisible?: boolean;
  /** Simplified aviation writing only; extra labels never create or reposition graduations. */
  aviationNumeralDetail?: 'key' | 'whole-units';
  outerScaleVisible?: boolean;
  innerScaleVisible?: boolean;
  markColorOverrides?: Record<string, string>;
  /** Additional verified/user-authored pointers; calibration is resolved, not supplied as pixels. */
  pointers?: ScalePointer[];
  hoverPaddingMm?: number;
  logarithmicBase?: number;
  tickDensityProfile?: 'ultra-dense' | 'dense' | 'balanced' | 'sparse' | 'engineering';
  includeMinorLabels?: boolean;
  optimizeLayout?: boolean;
  allowAngularAdjustment?: boolean;
  allowRadialOffset?: boolean;
  allowTypographyScaling?: boolean;
  allowAdaptiveLabelOmission?: boolean;
  allowTickSimplification?: boolean;
  labelPriorityMode?: 'balanced' | 'major-critical' | 'uniform';
  engineeringPreset?:
    | 'precision'
    | 'aviation'
    | 'scientific'
    | 'circular-calculator'
    | 'aviation-slide-rule'
    | 'scientific-calculator'
    | 'engineering-calculator'
    | 'navitimer-geometry'
    | 'e6b-geometry';
  outerRadiusMm?: number;
  innerRadiusMm?: number;
  outerRotationOffsetDeg?: number;
  innerRotationOffsetDeg?: number;
  ringSyncMode?: 'independent' | 'locked' | 'outer-drives-inner' | 'inner-drives-outer';
  lockRingMovement?: boolean;
  ringCouplingEnabled?: boolean;
  referenceIndexDeg?: number;
  cursorType?: 'transparent' | 'fixed' | 'rotating' | 'bezel';
  calculationMode?: 'multiplication' | 'division' | 'ratio' | 'proportion' | 'sync';
  validationVisibility?: boolean;
  telemeterUnit?: 'km' | 'mi';
  pulsometerBeats?: number;
  pulsometerCalibrationSeconds?: number;
  gmtLabelFormat?: '24h' | '24h-utc' | '12h';
  conversionMode?: 'metric-imperial' | 'imperial-metric' | 'custom';
  conversionCustomSourceUnit?: string;
  conversionCustomTargetUnit?: string;
  conversionCustomFactor?: number;
  logarithmicDecades?: number;
  logarithmicDisplayMultiplier?: number;
  logarithmicDisplayFormat?: 'engineering' | 'scientific' | 'navitimer' | 'slide-rule' | 'custom';
  logarithmicLabelStyle?: 'value' | 'mantissa' | 'scientific';
  logMajorTickDensity?: number;
  logMinorTickDensity?: number;
  logMicroTickDensity?: number;
  logarithmicRingType?:
    | 'C'
    | 'D'
    | 'CI'
    | 'DI'
    | 'A'
    | 'B'
    | 'K'
    | 'L'
    | 'LL'
    | 'aviation'
    | 'custom';
  projectionKind?: ProjectionKind;
  engineeringProfileKind?: EngineeringProfileKind;
  formatterKind?: FormatterKind;
  customProjectionExponent?: number;
  customProjectionScale?: number;
  customProjectionOffset?: number;
}

export interface ScaleMathContext {
  startAngleDeg: number;
  endAngleDeg: number;
}

export interface ScaleGeometryOutput {
  ticks: ScaleTick[];
  labels: ScaleLabel[];
}

export interface ScaleManufacturingMetadata {
  minimumPrintableSpacingDeg: number;
  minimumEngravingSpacingDeg?: number;
  minimumStrokeWidthMm: number;
  suggestedTickDepthMm: number;
  ringDensityWarnings?: string[];
  smallTextWarnings?: string[];
  suitability: {
    laser: boolean;
    cnc: boolean;
    uv: boolean;
  };
}

export interface ScaleEngineeringReadout {
  ringId: 'outer' | 'inner';
  scaleKind?: ScaleKind;
  pluginName?: string;
  value: number;
  normalized: number;
  angleDeg: number;
  radiusMm: number;
  nearestTick: ScaleTick | null;
  nearestLabel: ScaleLabel | null;
  collisionStatus?: 'ok' | 'warning' | 'error';
  manufacturingStatus?: 'ok' | 'warning' | 'error';
  engineeringScore?: number;
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
  manufacturingMetadata?: (
    ticks: ScaleTick[],
    labels: ScaleLabel[],
    config: ScalePluginConfig
  ) => ScaleManufacturingMetadata | undefined;
}

export interface ScaleRegistryEntry {
  plugin: ScalePlugin;
  enabled: boolean;
  source: 'built-in' | 'user';
}
