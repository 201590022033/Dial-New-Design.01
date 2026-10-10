/** Evidence qualifies each field independently. A supplier claim is never a fit certificate. */
export type EvidenceKind = 'supplier-statement' | 'drawing' | 'visual-approximation' | 'legacy-preserved';
export type EvidenceValue<T> =
  | { status: 'unknown'; reason: string }
  | { status: 'known'; value: T; evidence: { kind: EvidenceKind; source: string; revision?: string; page?: string; retrievedAtIso?: string; originalText?: string; sourceUnits?: string } };

export const CROWN_SPEC_V1 = 'crown-spec/v1' as const;
export const CROWN_AXIS_V1 = 'crown-axis/v1' as const;
export const CROWN_CHOICE_V1 = 'crown-choice/v1' as const;

/** Case-owned, single placement source. Front-view clockwise from 3h, degrees [0,360). */
export interface CrownAxisDatumV1 {
  schema: typeof CROWN_AXIS_V1;
  axisId: string;
  clockwiseFrom3hDeg: EvidenceValue<number>;
  interfaceRadiusMm: EvidenceValue<number>;
  stemHeightMm: EvidenceValue<number>;
  /** Exact wording, e.g. "3.8 o'clock". It does not establish a measured numeric angle. */
  supplierPosition?: EvidenceValue<string>;
}

export interface CrownThreadV1 {
  outerDiameterMm: EvidenceValue<number>;
  pitchMm: EvidenceValue<number>;
  /** Preserve seller Tap labels without treating them as a complete thread definition. */
  supplierTapLabel: EvidenceValue<string>;
}

export interface CrownSpecificationV1 {
  schema: typeof CROWN_SPEC_V1;
  axisId: string;
  shape: EvidenceValue<'cylindrical' | 'onion' | 'rounded' | 'compact-dress' | 'custom'>;
  grip: EvidenceValue<'smooth' | 'fine-fluted' | 'coarse-fluted' | 'coin-edge' | 'cross-knurled' | 'custom'>;
  coreDiameterMm: EvidenceValue<number>;
  maximumOuterDiameterMm: EvidenceValue<number>;
  headLengthMm: EvidenceValue<number>;
  closure: EvidenceValue<'unspecified' | 'push-pull' | 'screw-down'>;
  finish: { mode: 'inherit-case' } | { mode: 'override'; material: string; color: string; texture: string };
  protection: EvidenceValue<'none' | 'fixed-guards' | 'protective-cap' | 'extraction-lever' | 'cap-and-lever'>;
  ownership: {
    operatingHead: 'crown'; tube: 'case'; boss: 'case'; fixedGuards: 'case';
    cap?: 'crown-assembly'; holder?: 'case'; extractionLever?: 'case'; matchedAssemblyId?: string;
  };
  interfaces: {
    movementStem: { movementId: EvidenceValue<string>; revision: EvidenceValue<string>; stemReference: EvidenceValue<string>; thread: CrownThreadV1 };
    crownSocket: { thread: CrownThreadV1; boreDiameterMm: EvidenceValue<number>; engagementLengthMm: EvidenceValue<number> };
    caseTubeEngagement: { caseFamily: EvidenceValue<string>; thread: CrownThreadV1; engagementLengthMm: EvidenceValue<number>; gasketEnvelopeMm: EvidenceValue<number> };
    capHolder: { mechanismId: EvidenceValue<string>; thread: CrownThreadV1; clearanceMm: EvidenceValue<number> };
  };
  installation: {
    movementRotationDeg: EvidenceValue<number>; stemHeightMm: EvidenceValue<number>; spacerId: EvidenceValue<string>;
    dialFeetInterface: EvidenceValue<string>; dialRotationDeg: EvidenceValue<number>;
    calendarApertureDeg: EvidenceValue<number>; dateWheelOrientationDeg: EvidenceValue<number>;
    loading: EvidenceValue<'front' | 'rear'>;
  };
}

/** Saved selection and advice are independent; this contract never applies a default. */
export interface CrownChoiceV1 {
  schema: typeof CROWN_CHOICE_V1;
  selected?: { crownInstanceId: string; source: 'explicit-user' | 'case-supplied' | 'legacy-preserved' };
  recommendedDefault?: { catalogueItemId: string; reason: string; evidence: EvidenceValue<string> };
}

export interface CrownValidationResult {
  /** Schema validity only; even 'valid' does not establish mechanical compatibility. */
  status: 'valid' | 'unknown' | 'invalid';
  errors: string[];
  unknownFields: string[];
}
