export type GeometryUnits = 'mm';

export type GeometryParameterKey =
  | 'caseDiameterMm'
  | 'dialDiameterMm'
  | 'movementDiameterMm'
  | 'movementCentreHoleMm'
  | 'bandClearanceMm'
  | 'bandGapMm'
  | 'chapterRingWidthMm'
  | 'innerBezelWidthMm'
  | 'outerBezelWidthMm'
  | 'manufacturingToleranceMm'
  | 'laserKerfMm'
  | 'minimumLineWidthMm'
  | 'minimumTextHeightMm'
  | 'defaultUnits';

export interface GeometryParameterDefinition {
  key: GeometryParameterKey;
  label: string;
  defaultValue: number | GeometryUnits;
  min: number | null;
  max: number | null;
  description: string;
  validate: (value: number | GeometryUnits) => boolean;
}

export interface GlobalGeometryParameters {
  caseDiameterMm: number;
  dialDiameterMm: number;
  movementDiameterMm: number;
  movementCentreHoleMm: number;
  bandClearanceMm: number;
  bandGapMm: number;
  chapterRingWidthMm: number;
  innerBezelWidthMm: number;
  outerBezelWidthMm: number;
  manufacturingToleranceMm: number;
  laserKerfMm: number;
  minimumLineWidthMm: number;
  minimumTextHeightMm: number;
  defaultUnits: GeometryUnits;
}

export interface DerivedGeometryContext {
  caseRadiusMm: number;
  dialRadiusMm: number;
  movementRadiusMm: number;
  usableBandRadiusMm: number;
  outerBezelInnerDiameterMm: number;
  innerBezelInnerDiameterMm: number;
  chapterRingInnerDiameterMm: number;
  dialFaceInnerDiameterMm: number;
}

export interface GeometryWarning {
  code:
    | 'DIAMETER_OUT_OF_RANGE'
    | 'DIAL_EXCEEDS_CASE'
    | 'MOVEMENT_EXCEEDS_DIAL'
    | 'BAND_OVERFLOW'
    | 'LINE_WIDTH_UNDER_MIN'
    | 'TEXT_SIZE_UNDER_MIN';
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export type ConstraintCode =
  | 'MIN_BAND_WIDTH'
  | 'MAX_BAND_WIDTH'
  | 'MIN_CLEARANCE'
  | 'NEGATIVE_WIDTH'
  | 'BAND_OVERLAP'
  | 'INVALID_DIAMETER'
  | 'INVALID_HOLE_SIZE'
  | 'OUTSIDE_CASE';

export interface ConstraintViolation {
  code: ConstraintCode;
  severity: 'warning' | 'error';
  affectedObject: string;
  description: string;
  suggestedFix: string;
}

export interface DependencyNode {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  dependencyIds: string[];
  affectedObjectIds: string[];
  dirty: boolean;
  lastUpdatedIso: string;
}

export interface DependencyGraph {
  nodes: Record<string, DependencyNode>;
  hasCircularDependency: boolean;
}

export type ValidationCategory =
  | 'geometry'
  | 'manufacturing'
  | 'rendering'
  | 'movement-compatibility'
  | 'export-compatibility';

export interface StructuredValidationResult {
  category: ValidationCategory;
  severity: 'info' | 'warning' | 'error';
  description: string;
  affectedObject: string;
  suggestedFix: string;
}

export type DimensionKind =
  | 'diameter'
  | 'radius'
  | 'width'
  | 'thickness'
  | 'gap'
  | 'offset'
  | 'angle'
  | 'rotation';

export interface EngineeringDimension {
  kind: DimensionKind;
  value: number;
  units: GeometryUnits | 'deg';
  label: string;
}

export type SnapTargetType =
  | 'centre'
  | 'circle'
  | 'tick'
  | 'text-baseline'
  | 'guide'
  | 'band-edge'
  | 'subdial-centre'
  | 'date-window';
