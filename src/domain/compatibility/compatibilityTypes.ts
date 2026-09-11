import type { CatalogueItemCategory, ComponentCatalogueItem } from '@/domain/catalogue/types';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';

export type CompatibilityStatus = 'green' | 'yellow' | 'red' | 'unknown';

export type CompatibilityRuleCode =
  | 'MOVEMENT_EXCEEDS_CASE_CAVITY'
  | 'MOVEMENT_REQUIRES_CASING_SPACER'
  | 'MOVEMENT_CASE_FIT_VALID'
  | 'MOVEMENT_THICKNESS_EXCEEDS_CASE'
  | 'STEM_POSITION_MISALIGNMENT'
  | 'HAND_COLLET_MISMATCH'
  | 'HAND_COLLET_FIT_VALID'
  | 'HAND_LENGTH_EXCEEDS_DIAL_RADIUS'
  | 'HAND_LENGTH_VALID'
  | 'HAND_STACK_EXCEEDS_CRYSTAL_CLEARANCE'
  | 'HAND_STACK_TIGHT_CLEARANCE'
  | 'HAND_STACK_CLEARANCE_VALID'
  | 'DIAL_EXCEEDS_DIAL_SEAT'
  | 'DIAL_FEET_PATTERN_MISMATCH'
  | 'DIAL_UNDERSIZED_FOR_REHAUT'
  | 'DIAL_SEAT_FIT_VALID'
  | 'CHAPTER_RING_SEAT_MISMATCH'
  | 'CHAPTER_RING_FIT_VALID'
  | 'CRYSTAL_DIAMETER_MISMATCH'
  | 'CRYSTAL_SEAT_FIT_VALID'
  | 'BEZEL_SHOULDER_MISMATCH'
  | 'BEZEL_SHOULDER_FIT_VALID'
  | 'BEZEL_INSERT_DIAMETER_MISMATCH'
  | 'BEZEL_INSERT_FIT_VALID'
  | 'DATE_WINDOW_MISALIGNMENT'
  | 'DATE_WINDOW_ALIGNMENT_VALID'
  | 'UNVERIFIED_CRITICAL_DIMENSION'
  | 'PROVISIONAL_VERIFICATION'
  | 'CONFIRMED_VERIFICATION'
  | 'MISSING_REQUIRED_DIMENSION'
  | 'GEOMETRY_INTERFERENCE';

export type RemedyType =
  | 'movement-spacer'
  | 'casing-ring'
  | 'hand-collet-adapter'
  | 'dial-feet-removal'
  | 'crystal-gasket-adjustment'
  | 'domed-crystal-upgrade'
  | 'bezel-carrier-replacement'
  | 'custom-modification';

export interface RemedyDefinition {
  type: RemedyType;
  title: string;
  description: string;
  difficulty?: 'simple' | 'moderate' | 'advanced';
  reversible?: boolean;
  suggestedCatalogueItemIds?: string[];
  referencePartKind?: string;
}

export interface CompatibilityCheckResult {
  status: CompatibilityStatus;
  code: CompatibilityRuleCode;
  category: string;
  summary: string;

  affectedPartIds?: string[];
  affectedCatalogueItemIds?: string[];

  expected?: {
    value: number;
    unit: 'mm' | 'deg';
  };

  actual?: {
    value: number;
    unit: 'mm' | 'deg';
  };

  difference?: number;

  remedy?: RemedyDefinition;

  evidence?: string[];
}

export interface AssemblyCompatibilityEvaluation {
  status: CompatibilityStatus;
  candidate?: {
    catalogueItemId: string;
    targetPartInstanceId?: string;
    category: string;
  };
  summary: string;
  checks: CompatibilityCheckResult[];
  counts: {
    green: number;
    yellow: number;
    red: number;
    unknown: number;
  };
  remedies: RemedyDefinition[];
  reverseDependency?: {
    matingCategory: string;
    requiredSpec: Record<string, unknown>;
    description: string;
  };
}

export interface EvaluateCandidateOptions {
  assembly: WatchAssembly;
  targetPartInstanceId?: string;
  candidateCatalogueItemId: string;
  candidateItem?: ComponentCatalogueItem;
}

export interface ReverseCandidateQueryOptions {
  assembly: WatchAssembly;
  targetCategory?: CatalogueItemCategory;
  targetPartInstanceId?: string;
  filterStatus?: CompatibilityStatus[];
}

export interface ReverseCandidateResult {
  item: ComponentCatalogueItem;
  evaluation: AssemblyCompatibilityEvaluation;
}

export interface HandEngineeringSpecs {
  colletDiameterMm: number; // e.g. 1.50 for hour, 0.90 for minute, 0.20 for second
  lengthMm: number; // tip length from center
  stackHeightMm?: number;
  compatibleCalibres?: string[];
}

export interface DialEngineeringSpecs {
  outerDiameterMm: number;
  thicknessMm: number;
  centerHoleMm?: number;
  feetPositionsDeg?: number[];
  compatibleCalibres?: string[];
  hasRemovableFeet?: boolean;
  dateWindowRadiusMm?: number;
  dateWindowAngleDeg?: number;
  datePosition?: string;
}

export interface MovementEngineeringSpecs {
  calibreId: string;
  diameterMm: number;
  heightMm: number;
  stemPosition: '3h' | '3.8h' | '4h' | '4.5h' | '9h' | 'other';
  stemHeightMm?: number;
  handSizesMm: { hour: number; minute: number; second: number };
  datePosition?: string | null;
  feetPositionsDeg?: number[];
}

export interface CaseEngineeringSpecs {
  cavityDiameterMm: number;
  cavityDepthMm: number;
  dialSeatDiameterMm: number;
  crystalSeatDiameterMm: number;
  rehautDiameterMm?: number;
  bezelCarrierInnerMm?: number;
  bezelCarrierOuterMm?: number;
  stemPosition?: '3h' | '3.8h' | '4h' | '4.5h' | '9h' | 'other';
  stemHeightMm?: number;
  supportedMovementIds?: string[];
}

export interface BezelEngineeringSpecs {
  innerDiameterMm: number;
  outerDiameterMm: number;
  insertInnerDiameterMm: number;
  insertOuterDiameterMm: number;
  carrierType?: 'rotating' | 'fixed';
}

export interface BezelInsertEngineeringSpecs {
  innerDiameterMm: number;
  outerDiameterMm: number;
  thicknessMm?: number;
}

export interface ChapterRingEngineeringSpecs {
  innerDiameterMm: number;
  outerDiameterMm: number;
  heightMm?: number;
}

export interface CrystalEngineeringSpecs {
  outerDiameterMm: number;
  thicknessMm: number;
  profile?: 'flat' | 'domed' | 'double-domed';
  domeHeightMm?: number;
}

export interface ComponentEngineeringSpecs {
  hands?: HandEngineeringSpecs;
  dial?: DialEngineeringSpecs;
  movement?: MovementEngineeringSpecs;
  case?: CaseEngineeringSpecs;
  bezel?: BezelEngineeringSpecs;
  bezelInsert?: BezelInsertEngineeringSpecs;
  chapterRing?: ChapterRingEngineeringSpecs;
  crystal?: CrystalEngineeringSpecs;
}
