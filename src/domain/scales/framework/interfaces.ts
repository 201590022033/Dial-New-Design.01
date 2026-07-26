import type {
  ScaleLabel,
  ScaleMathContext,
  ScaleManufacturingMetadata,
  ScalePluginConfig,
  ScaleTick
} from '@/domain/scales/types';

export interface ScaleCollisionIssue {
  kind:
    | 'label-label'
    | 'tick-label'
    | 'tick-tick'
    | 'label-boundary'
    | 'boundary-overflow'
    | 'ring-ring'
    | 'cross-ring'
    | 'text-overflow'
    | 'curved-baseline-overflow';
  severity: 'info' | 'warning' | 'error';
  message: string;
  ids: string[];
}

export interface MathematicalScale {
  model: 'linear' | 'logarithmic' | 'ratio' | 'time' | 'distance';
  valueToAngle: (value: number, config: ScalePluginConfig, context: ScaleMathContext) => number;
  validateDomain?: (config: ScalePluginConfig) => string[];
}

export interface TickGenerationInput {
  config: ScalePluginConfig;
  context: ScaleMathContext;
  toAngle: (value: number, config: ScalePluginConfig, context: ScaleMathContext) => number;
}

export interface TickGenerationResult {
  majorTicks: ScaleTick[];
  minorTicks: ScaleTick[];
  ticks: ScaleTick[];
  effectiveMinorStep: number;
}

export interface TickGenerator {
  generate: (input: TickGenerationInput) => TickGenerationResult;
}

export interface LabelGenerationInput {
  ticks: ScaleTick[];
  config: ScalePluginConfig;
}

export interface LabelGenerator {
  generate: (input: LabelGenerationInput) => ScaleLabel[];
}

export interface ScaleValidationIssue {
  severity: 'info' | 'warning' | 'error';
  code:
    | 'INVALID_RANGE'
    | 'INVALID_DOMAIN'
    | 'INVALID_TICK_SPACING'
    | 'ANGULAR_OVERLAP'
    | 'NON_MONOTONIC'
    | 'PROJECTION_CONTINUITY'
    | 'NUMERICAL_PRECISION'
    | 'DUPLICATE_LABELS'
    | 'MISSING_LABELS'
    | 'OUTSIDE_BAND'
    | 'MANUFACTURING_LIMIT'
    | 'RING_INTERFERENCE'
    | 'TEXT_OVERFLOW';
  message: string;
  affectedObject: string;
  suggestedFix: string;
}

export interface ScaleValidatorInput {
  config: ScalePluginConfig;
  ticks: ScaleTick[];
  labels: ScaleLabel[];
  domainWarnings?: string[];
  collisions?: ScaleCollisionIssue[];
}

export interface ScaleValidatorResult {
  valid: boolean;
  warnings: string[];
  issues: ScaleValidationIssue[];
  healthReport?: {
    mathematicalHealth: number;
    readabilityScore: number;
    collisionScore: number;
    manufacturingScore: number;
    validationScore: number;
    overallEngineeringScore: number;
  };
}

export interface ScaleValidator {
  validate: (input: ScaleValidatorInput) => ScaleValidatorResult;
}

export interface CollisionDetectorInput {
  ticks: ScaleTick[];
  labels: ScaleLabel[];
  config: ScalePluginConfig;
  context: ScaleMathContext;
}

export interface CollisionDetector {
  detect: (input: CollisionDetectorInput) => ScaleCollisionIssue[];
}

export interface ScaleExporterInput {
  kind: string;
  ticks: ScaleTick[];
  labels: ScaleLabel[];
}

export interface ScaleExporter {
  toSvg: (input: ScaleExporterInput) => string;
  manufacturingMetadata?: (input: ScaleExporterInput, config: ScalePluginConfig) => ScaleManufacturingMetadata;
}
