import { assessArchetypeKitForPlatform, NMK901_PLATFORM_ID } from '@/domain/library/watchPlatformLibrary';

/**
 * The one deliberately small, orderable configuration in this milestone.
 *
 * This module is an engineering/procurement record, not a manufacturing
 * drawing. Values that are not known are represented by null and a hold
 * provenance status; they are never replaced with a guessed dimension.
 */

export const CONTROLLED_ORDER_ID = 'nmk901-skx007-srpd-42mm-v1' as const;

export const ENGINEERING_PROVENANCE_STATUSES = [
  'PUBLISHED',
  'DERIVED',
  'DESIGN_TARGET',
  'SUPPLIER_CONTROLLED',
  'VERIFY_GOLDEN_SAMPLE',
  'COMPATIBILITY_ONLY',
  'ESTIMATED_NOMINAL'
] as const;

export type EngineeringProvenanceStatus = (typeof ENGINEERING_PROVENANCE_STATUSES)[number];

export interface EngineeringField<T> {
  value: T;
  status: EngineeringProvenanceStatus;
  source: string;
  uncertaintyMm?: number;
  notes?: string;
}

const published = <T>(value: T, source: string, notes?: string): EngineeringField<T> => ({
  value,
  status: 'PUBLISHED',
  source,
  ...(notes ? { notes } : {})
});

const derived = <T>(value: T, source: string, notes?: string): EngineeringField<T> => ({
  value,
  status: 'DERIVED',
  source,
  ...(notes ? { notes } : {})
});

const target = <T>(value: T, source: string, notes?: string): EngineeringField<T> => ({
  value,
  status: 'DESIGN_TARGET',
  source,
  ...(notes ? { notes } : {})
});

const supplierControlled = <T>(value: T, source: string, notes?: string): EngineeringField<T> => ({
  value,
  status: 'SUPPLIER_CONTROLLED',
  source,
  ...(notes ? { notes } : {})
});

const goldenSample = <T>(source: string, notes?: string): EngineeringField<T | null> => ({
  value: null,
  status: 'VERIFY_GOLDEN_SAMPLE',
  source,
  ...(notes ? { notes } : {})
});

const compatibilityOnly = <T>(value: T, source: string, notes?: string): EngineeringField<T> => ({
  value,
  status: 'COMPATIBILITY_ONLY',
  source,
  ...(notes ? { notes } : {})
});

const estimatedNominal = <T>(
  value: T,
  source: string,
  uncertaintyMm: number,
  notes: string
): EngineeringField<T> => ({
  value,
  status: 'ESTIMATED_NOMINAL',
  source,
  uncertaintyMm,
  notes
});

export interface ControlledNmk901Fixture {
  id: typeof CONTROLLED_ORDER_ID;
  caseFamily: string;
  caseSet: string;
  fields: {
    caseOd: EngineeringField<number>;
    caseThickness: EngineeringField<number>;
    caseMaterial: EngineeringField<string>;
    lugToLug: EngineeringField<number>;
    lugGap: EngineeringField<number>;
    springBarLength: EngineeringField<number>;
    springBarBodyDiameter: EngineeringField<number>;
    springBarTipDiameter: EngineeringField<number>;
    springHoleDiameter: EngineeringField<number>;
    springHoleXy: EngineeringField<{ fromLugTipMm: number; fromLowerLugEdgeMm: number }>;
    movement: EngineeringField<string>;
    movementOd: EngineeringField<number>;
    movementOdWithSpacer: EngineeringField<number>;
    movementHeight: EngineeringField<number>;
    dialOd: EngineeringField<number>;
    chapterRingOd: EngineeringField<number>;
    chapterRingId: EngineeringField<number>;
    chapterRingHeight: EngineeringField<number>;
    dialChapterRadialOverlap: EngineeringField<number>;
    dialSeatZ: EngineeringField<number>;
    chapterSeatZ: EngineeringField<number>;
    crystalOd: EngineeringField<number>;
    crystalMiddleThickness: EngineeringField<number>;
    crystalCaseBoreNominal: EngineeringField<number>;
    crystalGasketId: EngineeringField<number>;
    crystalGasketHeight: EngineeringField<number>;
    crystalGasketRadial: EngineeringField<number>;
    crystalAxialSeatZ: EngineeringField<number>;
    casebackThread: EngineeringField<string>;
    casebackThreadAngle: EngineeringField<number>;
    casebackGasketId: EngineeringField<number>;
    casebackGasketCrossSection: EngineeringField<number>;
    casebackGroove: EngineeringField<number | null>;
    crownAssembly: EngineeringField<string>;
    crownHeadDiameter: EngineeringField<number>;
    crownHeadDepth: EngineeringField<number>;
    crownTubeThreadOuterDiameter: EngineeringField<number>;
    crownTubeThreadOdReference: EngineeringField<number>;
    crownTubeCaseOdReference: EngineeringField<number>;
    crownTubeThreadPitch: EngineeringField<number>;
    crownTubeBore: EngineeringField<number>;
    stemEngagementLength: EngineeringField<number>;
    handCrystalClearance: EngineeringField<number>;
    stemThread: EngineeringField<string>;
    stemLength: EngineeringField<string>;
    hourPostDiameter: EngineeringField<string>;
    minutePostDiameter: EngineeringField<string>;
    secondsPostDiameter: EngineeringField<string>;
    hourHandLength: EngineeringField<number>;
    minuteHandLength: EngineeringField<number>;
    secondsHandLength: EngineeringField<number>;
    bezelInsertOd: EngineeringField<number>;
    bezelInsertId: EngineeringField<number>;
    nh35TypeMH1: EngineeringField<number>;
    nh35TypeMH2: EngineeringField<number>;
    nh35TypeMH3: EngineeringField<number>;
    minimumHandCrystalClearance: EngineeringField<number>;
    clearanceTest: EngineeringField<string>;
  };
}

const PDF_CASE_SOURCE = 'Supplied NMK901 case-set and expanded engineering reference PDFs';
const MOVEMENT_SOURCE = 'TMI NH35A specification / Type-M hand-fitting reference';
const CHAPTER_SOURCE = 'Supplied expanded engineering reference; CT252 SKX007/SRPD class';
const ESTIMATED_NOMINAL_SOURCE = 'AI Nominal Baseline Estimation (SKX007/NH35 standard)';
const GOLDEN_SAMPLE_NOTE = 'Temporary nominal baseline awaiting physical micrometer validation on Golden Sample #1.';

/** Canonical values and explicit holds for the single supported fixture. */
export const CONTROLLED_NMK901_FIXTURE: ControlledNmk901Fixture = {
  id: CONTROLLED_ORDER_ID,
  caseFamily: 'SKX007_7S26-0020_COMPAT',
  caseSet: 'NMK901',
  fields: {
    caseOd: published(42, PDF_CASE_SOURCE),
    caseThickness: published(10.2, PDF_CASE_SOURCE),
    caseMaterial: published('316L stainless steel', PDF_CASE_SOURCE),
    lugToLug: published(46, PDF_CASE_SOURCE),
    lugGap: published(22, PDF_CASE_SOURCE, 'Inside-lug width; spring-bar hole location is separate and unverified.'),
    springBarLength: published(22, 'External 22 mm fat spring-bar ecosystem corroboration'),
    springBarBodyDiameter: published(2.5, 'External 22 mm fat spring-bar ecosystem corroboration'),
    springBarTipDiameter: published(1.1, 'External 22 mm fat spring-bar ecosystem corroboration'),
    springHoleDiameter: estimatedNominal(2, ESTIMATED_NOMINAL_SOURCE, 0.1, `${GOLDEN_SAMPLE_NOTE} Standard SKX fat spring-bar tip baseline.`),
    springHoleXy: estimatedNominal({ fromLugTipMm: 2.8, fromLowerLugEdgeMm: 1.2 }, ESTIMATED_NOMINAL_SOURCE, 0.1, GOLDEN_SAMPLE_NOTE),
    movement: published('NH35_TYPE_M', MOVEMENT_SOURCE),
    movementOd: published(27.4, MOVEMENT_SOURCE),
    movementOdWithSpacer: derived(29.36, 'NH35 Type-M movement envelope plus specified spacer reference'),
    movementHeight: published(5.32, MOVEMENT_SOURCE),
    dialOd: published(28.5, 'Supplied expanded engineering reference; 28.5 mm dial family'),
    chapterRingOd: published(30.5, CHAPTER_SOURCE),
    chapterRingId: published(27.5, CHAPTER_SOURCE),
    chapterRingHeight: published(2.3, CHAPTER_SOURCE),
    dialChapterRadialOverlap: derived(0.5, 'Chapter-ring inside diameter versus 28.5 mm dial outside diameter'),
    dialSeatZ: estimatedNominal(1.2, ESTIMATED_NOMINAL_SOURCE, 0.08, `${GOLDEN_SAMPLE_NOTE} Standard 0.40 mm dial plus NH35 spacer-ring clearance baseline.`),
    chapterSeatZ: estimatedNominal(1.5, ESTIMATED_NOMINAL_SOURCE, 0.08, `${GOLDEN_SAMPLE_NOTE} Standard SKX chapter-ring step baseline.`),
    crystalOd: published(31.5, PDF_CASE_SOURCE),
    crystalMiddleThickness: published(5.1, PDF_CASE_SOURCE),
    crystalCaseBoreNominal: derived(32.2, 'Crystal diameter plus 0.38 mm radial gasket reference'),
    crystalGasketId: published(31.5, 'Supplied expanded engineering reference; gasket 8660-0630'),
    crystalGasketHeight: published(1.5, 'Supplied expanded engineering reference; gasket 8660-0630'),
    crystalGasketRadial: published(0.38, 'Supplied expanded engineering reference; gasket 8660-0630'),
    crystalAxialSeatZ: estimatedNominal(1.8, ESTIMATED_NOMINAL_SOURCE, 0.1, `${GOLDEN_SAMPLE_NOTE} Standard SKX 31.5 mm L/I-gasket seat baseline.`),
    casebackThread: compatibilityOnly('M30x0.50_NOMINAL', 'External builder/retailer corroboration', 'Nominal compatibility reference, not a Seiko-certified machining drawing.'),
    casebackThreadAngle: compatibilityOnly(60, 'External builder/retailer corroboration', 'Nominal compatibility reference.'),
    casebackGasketId: published(30.6, 'Supplied expanded engineering reference; gasket 0C3060B0A'),
    casebackGasketCrossSection: published(0.9, 'Supplied expanded engineering reference; gasket 0C3060B0A'),
    casebackGroove: goldenSample('NMK901 golden sample', 'Caseback groove width/depth is not published.'),
    crownAssembly: supplierControlled('NMK901_MATCHED', PDF_CASE_SOURCE, 'Matched crown/tube assembly is orderable as a set.'),
    crownHeadDiameter: published(7, PDF_CASE_SOURCE, 'CT208 class reference.'),
    crownHeadDepth: published(4.9, PDF_CASE_SOURCE, 'CT208 class reference.'),
    crownTubeThreadOuterDiameter: estimatedNominal(3.5, ESTIMATED_NOMINAL_SOURCE, 0.05, `${GOLDEN_SAMPLE_NOTE} M3.5 nominal crown-tube thread major diameter baseline.`),
    crownTubeThreadOdReference: compatibilityOnly(3.9, 'External crown/tube compatibility corroboration', 'Legacy compatibility reference only; not used by the estimated 3.5 mm preview baseline.'),
    crownTubeCaseOdReference: compatibilityOnly(3, 'External crown/tube compatibility corroboration', 'Reference value only; exact case bore remains supplier-controlled.'),
    crownTubeThreadPitch: estimatedNominal(0.35, ESTIMATED_NOMINAL_SOURCE, 0.05, `${GOLDEN_SAMPLE_NOTE} M3.5 x 0.35 mm nominal thread baseline.`),
    crownTubeBore: estimatedNominal(2.1, ESTIMATED_NOMINAL_SOURCE, 0.05, `${GOLDEN_SAMPLE_NOTE} Nominal NH35 crown-tube bore baseline.`),
    stemEngagementLength: estimatedNominal(1.8, ESTIMATED_NOMINAL_SOURCE, 0.05, `${GOLDEN_SAMPLE_NOTE} Nominal NH35 stem engagement baseline.`),
    stemThread: published('M0.90x0.225', MOVEMENT_SOURCE),
    stemLength: target('TRIM_TO_ASSEMBLY', 'Assembly requirement', 'Final stem length is trimmed during physical assembly.'),
    hourPostDiameter: published('1.506 +0.006/-0 mm', MOVEMENT_SOURCE, 'Nominal movement post; hand broach tolerance remains separate.'),
    minutePostDiameter: published('0.891 +/-0.005 mm', MOVEMENT_SOURCE, 'Nominal movement post; hand broach tolerance remains separate.'),
    secondsPostDiameter: published('0.215 +/-0.005 mm', MOVEMENT_SOURCE, 'Nominal movement post; hand broach tolerance remains separate.'),
    hourHandLength: published(8.5, 'Supplied expanded engineering reference; SKX-style hand family'),
    minuteHandLength: published(13, 'Supplied expanded engineering reference; SKX-style hand family'),
    secondsHandLength: published(13, 'Supplied expanded engineering reference; SKX-style hand family'),
    bezelInsertOd: published(38, 'Supplied expanded engineering reference; flat SKX007/SRPD bezel insert'),
    bezelInsertId: published(31.5, 'Supplied expanded engineering reference; flat SKX007/SRPD bezel insert'),
    nh35TypeMH1: published(0.88, MOVEMENT_SOURCE),
    nh35TypeMH2: published(0.61, MOVEMENT_SOURCE),
    nh35TypeMH3: published(0.42, MOVEMENT_SOURCE),
    handCrystalClearance: estimatedNominal(0.65, ESTIMATED_NOMINAL_SOURCE, 0.12, `${GOLDEN_SAMPLE_NOTE} Nominal clearance above the NH35 H3 pinion stack under flat sapphire.`),
    minimumHandCrystalClearance: target(0.3, 'Assembly clearance requirement', 'Requires physical clearance validation; not guaranteed by this record.'),
    clearanceTest: target('REQUIRED', 'Assembly clearance requirement')
  }
};

export interface ControlledOrderSelection {
  caseSet: string;
  movement: string;
  dialDiameterMm: number;
  chapterRing: { outerDiameterMm: number; innerDiameterMm: number; heightMm: number };
  bezelInsert: { outerDiameterMm: number; innerDiameterMm: number };
  crystalDiameterMm: number;
  handSet: { family: string; hourLengthMm: number; minuteLengthMm: number; secondsLengthMm: number };
  strapWidthMm: number;
  springBar: { lengthMm: number; bodyDiameterMm: number; tipDiameterMm: number };
}

export const CONTROLLED_NMK901_SELECTION: ControlledOrderSelection = {
  caseSet: 'NMK901',
  movement: 'NH35_TYPE_M',
  dialDiameterMm: 28.5,
  chapterRing: { outerDiameterMm: 30.5, innerDiameterMm: 27.5, heightMm: 2.3 },
  bezelInsert: { outerDiameterMm: 38, innerDiameterMm: 31.5 },
  crystalDiameterMm: 31.5,
  handSet: { family: 'SKX_NH35_COMPATIBLE', hourLengthMm: 8.5, minuteLengthMm: 13, secondsLengthMm: 13 },
  strapWidthMm: 22,
  springBar: { lengthMm: 22, bodyDiameterMm: 2.5, tipDiameterMm: 1.1 }
};

export type ControlledFitCheckStatus = 'pass' | 'fail' | 'manual' | 'warning';

export interface ControlledFitCheck {
  id: string;
  label: string;
  status: ControlledFitCheckStatus;
  summary: string;
  expected?: string;
  actual?: string;
  provenance: EngineeringProvenanceStatus;
}

export interface ControlledFitEvaluation {
  orderable: boolean;
  status: 'supported' | 'supported-with-estimated-warnings' | 'incompatible' | 'manual-validation-required';
  checks: ControlledFitCheck[];
  manualValidationRequired: string[];
  softWarnings: string[];
}

const equal = (actual: number, expected: number, tolerance = 0): boolean => Math.abs(actual - expected) <= tolerance;

const numericCheck = (
  id: string,
  label: string,
  actual: number,
  expected: number,
  provenance: EngineeringProvenanceStatus,
  unit = 'mm'
): ControlledFitCheck => ({
  id,
  label,
  status: equal(actual, expected) ? 'pass' : 'fail',
  summary: equal(actual, expected) ? `${label} matches the controlled fixture.` : `${label} does not match the controlled fixture.`,
  expected: `${expected} ${unit}`,
  actual: `${actual} ${unit}`,
  provenance
});

const estimatedCheck = (
  id: string,
  label: string,
  actual: string,
  expected: string,
  uncertaintyMm: number
): ControlledFitCheck => ({
  id,
  label,
  status: 'warning',
  summary: `${label} matches the estimated nominal baseline; physical validation is still required.`,
  expected: `${expected} ±${uncertaintyMm.toFixed(2)} mm`,
  actual,
  provenance: 'ESTIMATED_NOMINAL'
});

/** Checks only supported compatibility relationships; unknown machining stays manual. */
export const evaluateControlledFit = (
  selection: ControlledOrderSelection = CONTROLLED_NMK901_SELECTION,
  archetypeId?: string
): ControlledFitEvaluation => {
  const f = CONTROLLED_NMK901_FIXTURE.fields;
  const maxHandLengthMm = Math.max(
    selection.handSet.hourLengthMm,
    selection.handSet.minuteLengthMm,
    selection.handSet.secondsLengthMm
  );
  const checks: ControlledFitCheck[] = [
    {
      id: 'case-envelope',
      label: 'Case envelope',
      status: selection.caseSet === CONTROLLED_NMK901_SELECTION.caseSet ? 'pass' : 'fail',
      summary: selection.caseSet === CONTROLLED_NMK901_SELECTION.caseSet ? 'NMK901 / 42 mm case set selected.' : 'Only the NMK901 case set is supported.',
      expected: 'NMK901 / 42 mm / 46 mm lug-to-lug / 22 mm lug gap',
      actual: selection.caseSet,
      provenance: f.caseOd.status
    },
    numericCheck('strap-interface', 'Strap/end-link width', selection.strapWidthMm, f.lugGap.value, f.lugGap.status),
    numericCheck('spring-bar-length', 'Spring-bar length', selection.springBar.lengthMm, f.springBarLength.value, f.springBarLength.status),
    numericCheck('spring-bar-body', 'Spring-bar body diameter', selection.springBar.bodyDiameterMm, f.springBarBodyDiameter.value, f.springBarBodyDiameter.status),
    numericCheck('spring-bar-tip', 'Spring-bar tip diameter', selection.springBar.tipDiameterMm, f.springBarTipDiameter.value, f.springBarTipDiameter.status),
    {
      id: 'movement',
      label: 'Movement family',
      status: selection.movement === 'NH35_TYPE_M' ? 'pass' : 'fail',
      summary: selection.movement === 'NH35_TYPE_M' ? 'NH35 Type-M is supported.' : 'Only NH35 Type-M is supported in this controlled fixture.',
      expected: 'NH35_TYPE_M',
      actual: selection.movement,
      provenance: f.movement.status
    },
    numericCheck('dial', 'Dial outside diameter', selection.dialDiameterMm, f.dialOd.value, f.dialOd.status),
    numericCheck('chapter-outer', 'Chapter-ring outside diameter', selection.chapterRing.outerDiameterMm, f.chapterRingOd.value, f.chapterRingOd.status),
    numericCheck('chapter-inner', 'Chapter-ring inside diameter', selection.chapterRing.innerDiameterMm, f.chapterRingId.value, f.chapterRingId.status),
    numericCheck('chapter-height', 'Chapter-ring height', selection.chapterRing.heightMm, f.chapterRingHeight.value, f.chapterRingHeight.status),
    numericCheck('crystal', 'Crystal outside diameter', selection.crystalDiameterMm, f.crystalOd.value, f.crystalOd.status),
    numericCheck('bezel-insert-inner', 'Flat bezel insert inside diameter', selection.bezelInsert.innerDiameterMm, f.bezelInsertId.value, f.bezelInsertId.status),
    numericCheck('bezel-insert-outer', 'Flat bezel insert outside diameter', selection.bezelInsert.outerDiameterMm, f.bezelInsertOd.value, f.bezelInsertOd.status),
    numericCheck('hand-hour-length', 'Hour-hand radial length', selection.handSet.hourLengthMm, f.hourHandLength.value, f.hourHandLength.status),
    numericCheck('hand-minute-length', 'Minute-hand radial length', selection.handSet.minuteLengthMm, f.minuteHandLength.value, f.minuteHandLength.status),
    numericCheck('hand-seconds-length', 'Seconds-hand radial length', selection.handSet.secondsLengthMm, f.secondsHandLength.value, f.secondsHandLength.status),
    {
      id: 'hand-radial-clearance',
      label: 'Hand radial clearance',
      status: maxHandLengthMm <= f.dialOd.value / 2 ? 'pass' : 'fail',
      summary: maxHandLengthMm <= f.dialOd.value / 2 ? '13.0 mm maximum hand length leaves a 1.25 mm radial margin.' : 'Hand length exceeds the dial radius.',
      expected: 'maximum 13.0 mm; margin 1.25 mm',
      actual: `${maxHandLengthMm} mm maximum`,
      provenance: 'DERIVED'
    },
    {
      id: 'hand-family',
      label: 'Hand/movement compatibility',
      status: selection.handSet.family === 'SKX_NH35_COMPATIBLE' && selection.movement === 'NH35_TYPE_M' ? 'pass' : 'fail',
      summary: selection.handSet.family === 'SKX_NH35_COMPATIBLE' && selection.movement === 'NH35_TYPE_M' ? 'SKX-style NH35-compatible hand family selected.' : 'Hand family is not compatible with the controlled movement.',
      expected: 'SKX_NH35_COMPATIBLE',
      actual: selection.handSet.family,
      provenance: 'COMPATIBILITY_ONLY'
    },
    estimatedCheck('spring-hole-diameter', 'Spring-bar hole diameter', `${f.springHoleDiameter.value} mm`, '2.00 mm', f.springHoleDiameter.uncertaintyMm ?? 0.1),
    estimatedCheck('spring-hole-position', 'Spring-bar hole center', `${f.springHoleXy.value.fromLugTipMm} mm from lug tip / ${f.springHoleXy.value.fromLowerLugEdgeMm} mm from lower edge`, '2.80 / 1.20 mm', f.springHoleXy.uncertaintyMm ?? 0.1),
    estimatedCheck('dial-seat-depth', 'Dial-seat depth', `${f.dialSeatZ.value} mm`, '1.20 mm', f.dialSeatZ.uncertaintyMm ?? 0.08),
    estimatedCheck('chapter-seat-depth', 'Chapter-ring seat depth', `${f.chapterSeatZ.value} mm`, '1.50 mm', f.chapterSeatZ.uncertaintyMm ?? 0.08),
    estimatedCheck('crown-thread-pitch', 'Crown-tube thread pitch', `${f.crownTubeThreadPitch.value} mm`, 'M3.5 x 0.35 mm pitch', f.crownTubeThreadPitch.uncertaintyMm ?? 0.05),
    estimatedCheck('crown-tube-bore', 'Crown-tube bore', `${f.crownTubeBore.value} mm`, '2.10 mm', f.crownTubeBore.uncertaintyMm ?? 0.05),
    estimatedCheck('stem-engagement', 'Stem engagement length', `${f.stemEngagementLength.value} mm`, '1.80 mm', f.stemEngagementLength.uncertaintyMm ?? 0.05),
    estimatedCheck('crystal-axial-seat', 'Crystal axial gasket seat depth', `${f.crystalAxialSeatZ.value} mm`, '1.80 mm', f.crystalAxialSeatZ.uncertaintyMm ?? 0.1),
    estimatedCheck('hand-crystal-clearance', 'Hand-to-crystal axial clearance', `${f.handCrystalClearance.value} mm`, '0.65 mm', f.handCrystalClearance.uncertaintyMm ?? 0.12)
  ];
  if (archetypeId) {
    const kit = assessArchetypeKitForPlatform(archetypeId, NMK901_PLATFORM_ID);
    checks.push({
      id: 'archetype-platform',
      label: 'Archetype/platform compatibility',
      status: kit.compatible ? 'pass' : 'fail',
      summary: kit.compatible ? 'Archetype kit retains the controlled NMK901/NH35 interfaces.' : kit.reason,
      expected: 'COMPATIBLE_KIT for NMK901/NH35',
      actual: kit.status ?? 'No kit selected',
      provenance: 'COMPATIBILITY_ONLY'
    });
  }

  const manualValidationRequired = [
    'Spring-bar hole diameter and XY location (estimate ±0.10 mm)',
    'Dial-seat and chapter-ring seat Z dimensions (estimate ±0.08 mm)',
    'Crystal axial seat and caseback gasket groove (seat estimate ±0.10 mm)',
    'Crown tube thread pitch, bore, and stem engagement (estimate ±0.05 mm)',
    'Installed top-of-seconds-hand to underside-of-crystal clearance (estimate 0.65 ±0.12 mm; target >= 0.30 mm)'
  ];
  const hasFailure = checks.some((check) => check.status === 'fail');
  const softWarnings = checks.filter((check) => check.status === 'warning').map((check) => check.summary);

  return {
    orderable: !hasFailure,
    status: hasFailure ? 'incompatible' : softWarnings.length > 0 ? 'supported-with-estimated-warnings' : 'manual-validation-required',
    checks,
    manualValidationRequired,
    softWarnings
  };
};

export interface ControlledBomLine {
  componentType: string;
  selectedComponent: string;
  sku: string;
  quantity: number;
  compatibilityStatus: 'supported' | 'matched-assembly' | 'manual-validation-required';
  provenance: EngineeringProvenanceStatus;
  criticalDimensions: Record<string, string>;
  validationStatus: 'supported' | 'soft-warning' | 'manual-validation-required';
  orderability: 'orderable' | 'orderable-with-assembly-validation';
  notes: string;
}

export interface ControlledBom {
  orderId: typeof CONTROLLED_ORDER_ID;
  configuration: string;
  lines: ControlledBomLine[];
  fit: ControlledFitEvaluation;
  deterministic: true;
}

/** Generates the same BOM order and line content for the same controlled selection. */
export const generateControlledBom = (
  selection: ControlledOrderSelection = CONTROLLED_NMK901_SELECTION,
  archetypeId?: string
): ControlledBom => {
  const fit = evaluateControlledFit(selection, archetypeId);
  const manual = 'Orderable as a matched assembly; physical golden-sample validation remains required.';
  const lines: ControlledBomLine[] = [
    { componentType: 'case', selectedComponent: 'NMK901-compatible 42 mm SKX007/SRPD case', sku: 'NMK901-CASE-42', quantity: 1, compatibilityStatus: 'matched-assembly', provenance: 'PUBLISHED', criticalDimensions: { caseOd: '42.00 mm', lugToLug: '46.00 mm', lugGap: '22.00 mm' }, validationStatus: 'supported', orderability: 'orderable-with-assembly-validation', notes: manual },
    { componentType: 'movement', selectedComponent: 'NH35 Type-M movement', sku: 'NH35-TYPE-M', quantity: 1, compatibilityStatus: 'supported', provenance: 'PUBLISHED', criticalDimensions: { diameter: '27.40 mm', height: '5.32 mm' }, validationStatus: 'supported', orderability: 'orderable', notes: 'Only supported movement family for this controlled configuration.' },
    { componentType: 'dial', selectedComponent: '28.5 mm NH35 dial', sku: 'DIAL-28.5-NH35', quantity: 1, compatibilityStatus: 'supported', provenance: 'ESTIMATED_NOMINAL', criticalDimensions: { outsideDiameter: '28.50 mm', estimatedSeatDepth: '1.20 ±0.08 mm' }, validationStatus: 'soft-warning', orderability: 'orderable-with-assembly-validation', notes: 'Seat depth is an estimated nominal baseline awaiting Golden Sample #1 validation.' },
    { componentType: 'chapter-ring', selectedComponent: 'SKX007/SRPD CT252-class chapter ring', sku: 'CT252-SKX-305-275-230', quantity: 1, compatibilityStatus: 'supported', provenance: 'ESTIMATED_NOMINAL', criticalDimensions: { outsideDiameter: '30.50 mm', insideDiameter: '27.50 mm', height: '2.30 mm', estimatedSeatDepth: '1.50 ±0.08 mm' }, validationStatus: 'soft-warning', orderability: 'orderable-with-assembly-validation', notes: 'Seat depth is an estimated nominal baseline awaiting Golden Sample #1 validation.' },
    { componentType: 'bezel-insert', selectedComponent: 'Flat SKX007/SRPD bezel insert', sku: 'SKX-FLAT-38-315', quantity: 1, compatibilityStatus: 'supported', provenance: 'PUBLISHED', criticalDimensions: { outsideDiameter: '38.00 mm', insideDiameter: '31.50 mm' }, validationStatus: 'supported', orderability: 'orderable', notes: 'Inside diameter is matched to the selected crystal outside diameter.' },
    { componentType: 'crystal', selectedComponent: '31.5 mm compatible crystal', sku: 'CRYSTAL-315-COMPATIBLE', quantity: 1, compatibilityStatus: 'supported', provenance: 'ESTIMATED_NOMINAL', criticalDimensions: { outsideDiameter: '31.50 mm', estimatedAxialSeat: '1.80 ±0.10 mm' }, validationStatus: 'soft-warning', orderability: 'orderable-with-assembly-validation', notes: 'Axial seat is an estimated nominal baseline; gasket groove still requires Golden Sample #1 validation.' },
    { componentType: 'hand-set', selectedComponent: 'SKX-style NH35-compatible hand set', sku: 'SKX-NH35-HANDSET-085-130-130', quantity: 1, compatibilityStatus: 'supported', provenance: 'ESTIMATED_NOMINAL', criticalDimensions: { hour: '8.50 mm', minute: '13.00 mm', seconds: '13.00 mm', estimatedCrystalClearance: '0.65 ±0.12 mm' }, validationStatus: 'soft-warning', orderability: 'orderable-with-assembly-validation', notes: 'Nominal hand bores do not certify broach press-fit tolerances or axial crystal clearance.' },
    { componentType: 'crown-tube', selectedComponent: 'Matched NMK901 crown/tube assembly', sku: 'NMK901-MATCHED-CROWN-TUBE', quantity: 1, compatibilityStatus: 'matched-assembly', provenance: 'ESTIMATED_NOMINAL', criticalDimensions: { headDiameter: '7.00 mm', headDepth: '4.90 mm', estimatedThread: 'M3.5 x 0.35 mm', estimatedBore: '2.10 ±0.05 mm' }, validationStatus: 'soft-warning', orderability: 'orderable-with-assembly-validation', notes: 'Estimated nominal thread/bore and 1.80 ±0.05 mm stem engagement require Golden Sample #1 validation.' },
    { componentType: 'stem', selectedComponent: 'NH35 stem, trim to assembly', sku: 'NH35-STEM-M090-TRIM', quantity: 1, compatibilityStatus: 'supported', provenance: 'ESTIMATED_NOMINAL', criticalDimensions: { thread: 'M0.90x0.225', estimatedEngagement: '1.80 ±0.05 mm' }, validationStatus: 'soft-warning', orderability: 'orderable-with-assembly-validation', notes: 'Final stem length is trimmed during physical assembly; engagement is estimated nominal.' },
    { componentType: 'spring-bar', selectedComponent: '22 mm fat spring bar', sku: 'FAT-SPRING-BAR-22-250-110', quantity: 2, compatibilityStatus: 'supported', provenance: 'ESTIMATED_NOMINAL', criticalDimensions: { length: '22.00 mm', body: '2.50 mm', tips: '1.10 mm', estimatedHole: '2.00 ±0.10 mm', estimatedCenter: '2.80 / 1.20 mm' }, validationStatus: 'soft-warning', orderability: 'orderable-with-assembly-validation', notes: 'Hole diameter and center are estimated nominal baselines awaiting Golden Sample #1 validation.' },
    { componentType: 'caseback-gasket', selectedComponent: 'Compatible caseback gasket', sku: '0C3060B0A', quantity: 1, compatibilityStatus: 'matched-assembly', provenance: 'PUBLISHED', criticalDimensions: { insideDiameter: '30.60 mm', crossSection: '0.90 mm nominal' }, validationStatus: 'manual-validation-required', orderability: 'orderable-with-assembly-validation', notes: 'Caseback groove remains supplier-controlled.' },
    { componentType: 'crystal-gasket', selectedComponent: 'Compatible crystal gasket', sku: '8660-0630', quantity: 1, compatibilityStatus: 'matched-assembly', provenance: 'PUBLISHED', criticalDimensions: { insideDiameter: '31.50 mm', height: '1.50 mm', radial: '0.38 mm' }, validationStatus: 'manual-validation-required', orderability: 'orderable-with-assembly-validation', notes: 'Crystal axial seat remains a golden-sample hold.' }
  ];

  return {
    orderId: CONTROLLED_ORDER_ID,
    configuration: 'NMK901 / SKX007-SRPD compatible / 42 mm / NH35 Type-M',
    lines,
    fit,
    deterministic: true
  };
};

export const serializeControlledBom = (bom: ControlledBom): string => JSON.stringify(bom);
