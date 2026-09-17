/** Versioned contracts shared by future Blender generators and browser adapters. */
export const PARAMETRIC_CASE_V1 = 'parametric-case/v1' as const;
export const PARAMETRIC_HAND_V1 = 'parametric-hand/v1' as const;
export const PARAMETRIC_HAND_SET_V1 = 'parametric-hand-set/v1' as const;

export type DimensionMm = number | { status: 'unknown'; reason?: string; source?: string };
export type TipStyle = 'NONE' | 'POINT' | 'TRIANGLE' | 'SPEAR';
export type TailStyle = 'NONE' | 'NEEDLE' | 'BATON' | 'ARROW' | 'LOLLIPOP' | 'COUNTERWEIGHT';

export interface ParametricCaseV1 {
  schema: typeof PARAMETRIC_CASE_V1;
  caseDiameter: DimensionMm; midcaseHeight: DimensionMm; lugWidth: DimensionMm; lugToLug: DimensionMm;
  dialOpening: DimensionMm; crystalSeatDiameter: DimensionMm; casebackOpening: DimensionMm;
  upperCaseRadiusReduction: DimensionMm; lowerCaseRadiusReduction: DimensionMm; middleCaseBulge: DimensionMm;
  bezelLipHeight: DimensionMm; casebackLipHeight: DimensionMm;
  lugRootWidth: DimensionMm; lugTipWidth: DimensionMm; lugCaseOverlap: DimensionMm; lugTipDrop: DimensionMm;
  lugThickness: DimensionMm; lugTaperStrength: DimensionMm;
  crownTubeRadius: DimensionMm; crownTubeLength: DimensionMm; crownBossRadius: DimensionMm;
  crownBossLength: DimensionMm; crownBossEmbed: DimensionMm; crownTubeEmbed: DimensionMm;
}

export interface LumeRegionsV1 { body: boolean; tip: boolean; tail: boolean; }
export interface ParametricHandV1 {
  schema: typeof PARAMETRIC_HAND_V1;
  hub: { diameter: DimensionMm; thickness: DimensionMm; pinionHoleDiameter: DimensionMm; collarDiameter?: DimensionMm; collarHeight?: DimensionMm };
  body: { length: DimensionMm; rootWidth: DimensionMm; distalWidth: DimensionMm; thickness: DimensionMm; taper?: DimensionMm };
  tip: { style: TipStyle; length: DimensionMm; width: DimensionMm; shoulderSweep: DimensionMm; lume: boolean };
  tail: { style: TailStyle; length: DimensionMm; width: DimensionMm; featurePosition?: DimensionMm; diskDiameter?: DimensionMm; arrowLength?: DimensionMm; lume: boolean };
  lume: LumeRegionsV1;
}
export interface ParametricHandSetV1 {
  schema: typeof PARAMETRIC_HAND_SET_V1;
  hour: ParametricHandV1; minute: ParametricHandV1; seconds?: ParametricHandV1;
  complications?: Record<string, ParametricHandV1>;
}

export type MovementPinionKey = 'hour' | 'minute' | 'seconds';
export interface MovementPinionConstraint { movementId: string; pinionHoleDiameter: DimensionMm; source: 'verified-movement-template' | 'unknown'; }
export interface MovementHandConstraintProvider { getPinionConstraint(movementId: string, hand: MovementPinionKey): MovementPinionConstraint; }
