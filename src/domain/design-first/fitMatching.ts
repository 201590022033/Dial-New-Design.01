import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import { evaluateCandidate } from '@/domain/compatibility/compatibilityEngine';
import { getActiveMovement } from '@/domain/compatibility/compatibilityHelpers';
import { extractHandColletSpec } from '@/domain/compatibility/rules/movementHandsRule';
import { deriveCaseConstraints, findSelectedCase } from './caseConstraintAdapter';
import { componentFitEvidenceErrors, isReviewedFitMeasurement, type ComponentFitMeasurement } from './componentFitEvidence';
import { designBriefErrors, type DesignAdjustment, type DesignBriefV1, type DesignMatchResultV1 } from './designBrief';
import { designPartSlot } from './designBriefExtraction';
import type { EvidenceField } from './evidence';

export interface EvaluateDesignCandidateOptions {
  readonly assembly: WatchAssembly;
  readonly brief: DesignBriefV1;
  readonly candidate: ComponentCatalogueItem;
  readonly items: readonly ComponentCatalogueItem[];
  readonly supplierListings: readonly SupplierListing[];
}

const unknown = (reason: string): EvidenceField<number> => ({ state: 'unknown', reason });
const assumed = (value: unknown, reason: string): EvidenceField<number> => typeof value === 'number' && Number.isFinite(value) && value > 0
  ? { state: 'assumed', value, reason } : unknown('No positive explicit measurement is available.');
const numberValue = (field: EvidenceField<number>) => field.state === 'unknown' ? undefined : field.value;
const role = (kind: string | undefined) => kind === 'hour-hand' ? 'hour' : kind === 'minute-hand' ? 'minute'
  : kind === 'central-seconds' || kind === 'seconds-hand-2824' ? 'second' : undefined;
const normalizeAppearance = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return /^#[0-9a-f]{3}$/.test(normalized) ? `#${[...normalized.slice(1)].map(char => char + char).join('')}` : normalized;
};

/** Four-group dimensional screening. This does not approve installation, sealing or manufacture. */
export function evaluateDesignCandidate(options: EvaluateDesignCandidateOptions): DesignMatchResultV1 {
  const { assembly, brief, candidate, items, supplierListings } = options;
  const reasons: DesignMatchResultV1['reasons'][number][] = [];
  const adjustments: DesignAdjustment[] = [];
  let incompatible = false;
  let incomplete = false;
  const add = (code: string, explanation: string, evidence: EvidenceField<number | string | boolean>) => reasons.push({ code, explanation, evidence });
  const missing = (code: string, explanation: string) => { incomplete = true; add(code, explanation, { state: 'unknown', reason: explanation }); };
  const reject = (code: string, explanation: string, evidence: EvidenceField<number | string | boolean> = { state: 'assumed', value: false, reason: explanation }) => {
    incompatible = true; add(code, explanation, evidence);
  };
  const typedInvalid = candidate.fitEvidence !== undefined && componentFitEvidenceErrors(candidate.fitEvidence, candidate.id).length > 0;
  const measurement = (key: ComponentFitMeasurement, fallback: unknown): EvidenceField<number> => {
    if (typedInvalid) return unknown('Candidate measurement evidence is malformed or identifies a different product.');
    const field = candidate.fitEvidence?.measurements[key];
    if (field && field.state !== 'unknown' && typeof fallback === 'number' && Number.isFinite(fallback) && fallback > 0 && Math.abs(field.value - fallback) > .000001) {
      missing(`CONFLICTING_${key}`, `${key}: product evidence conflicts with another explicit catalogue dimension and needs reconciliation.`);
    }
    return field ? structuredClone(field) : assumed(fallback, 'Explicit catalogue dimension without reviewed field-level source evidence.');
  };
  const compare = (code: string, label: string, actual: EvidenceField<number>, expected: EvidenceField<number>, accepts: (actual: number, expected: number) => boolean) => {
    const a = numberValue(actual), e = numberValue(expected);
    add(`${code}_CANDIDATE`, `${label}: candidate measurement${a === undefined ? ' is unknown' : ` is ${a} mm`}.`, actual);
    add(`${code}_INTERFACE`, `${label}: mating measurement${e === undefined ? ' is unknown' : ` is ${e} mm`}. These are dimensional comparisons, not installation or sealing approval.`, expected);
    if (a !== undefined && e !== undefined && !accepts(a, e)) reject(`${code}_MISMATCH`, `${label}: the stated dimensions do not match the required interface. Hardware resizing is not proposed.`, actual);
    if (!isReviewedFitMeasurement(actual) || !isReviewedFitMeasurement(expected)) {
      incomplete = true;
      // Explicitly explain why numeric equality is insufficient without hiding recorded provenance.
      if (a === undefined || e === undefined) missing(`${code}_MISSING`, `${label}: a required measurement is missing.`);
      else if (actual.state === 'assumed' || expected.state === 'assumed') missing(`${code}_ASSUMED`, `${label}: one or both measurements are assumed catalogue or authored values.`);
      else if ((actual.state === 'recorded' && actual.source.kind === 'synthetic-fixture') || (expected.state === 'recorded' && expected.source.kind === 'synthetic-fixture')) missing(`${code}_SYNTHETIC`, `${label}: synthetic fixture evidence cannot establish a product match.`);
      else missing(`${code}_UNREVIEWED`, `${label}: source evidence still needs review.`);
    }
  };

  for (const error of designBriefErrors(brief, assembly)) reject('INVALID_BRIEF', error);
  if (!items.some(item => item.id === candidate.id)) reject('MISSING_CURRENT_CANDIDATE', 'This candidate is absent from the current catalogue.');
  const target = assembly.parts[brief.target.partInstanceId];
  const targetItem = target ? items.find(item => item.id === target.catalogueItemId) : undefined;
  if (designPartSlot(candidate) !== brief.target.slot) reject('WRONG_COMPONENT_SLOT', 'This candidate belongs to a different component slot.');
  if (target?.locked || brief.permissions.lockedPartIds.includes(brief.target.partInstanceId)) reject('LOCKED_TARGET', 'This component is locked and cannot be replaced.');
  if (candidate.kind === 'hand-set' && ['inst-hour-hand', 'inst-minute-hand', 'inst-central-seconds'].some(id => assembly.parts[id]?.locked || brief.permissions.lockedPartIds.includes(id))) reject('LOCKED_HAND_SET', 'This set would replace a locked hand.');
  if (candidate.researchOnly) missing('RESEARCH_ONLY', 'This is a discovery record with incomplete product or interface evidence.');

  const outer = measurement('outerDiameterMm', candidate.engineeringSpecs?.crystal?.outerDiameterMm ?? candidate.engineeringSpecs?.dial?.outerDiameterMm
    ?? candidate.engineeringSpecs?.chapterRing?.outerDiameterMm ?? candidate.engineeringSpecs?.bezel?.outerDiameterMm ?? candidate.nominalDimensions.diameterMm);
  const thickness = measurement('thicknessMm', candidate.engineeringSpecs?.crystal?.thicknessMm ?? candidate.engineeringSpecs?.dial?.thicknessMm ?? candidate.nominalDimensions.thicknessMm);
  const length = measurement('lengthMm', candidate.engineeringSpecs?.hands?.lengthMm ?? candidate.visual?.handLengthsMm?.[role(candidate.kind) ?? 'hour']);
  const dimensions = { diameterMm: brief.target.slot === 'hands' ? length : outer,
    thicknessMm: thickness, widthMm: measurement('widthMm', candidate.nominalDimensions.widthMm), lengthMm: length };
  const relevant = brief.target.slot === 'hands' ? ['diameterMm', 'lengthMm'] as const : ['diameterMm', 'thicknessMm', 'widthMm'] as const;
  for (const dimension of relevant) {
    const desired = brief.desiredDimensions[dimension];
    const next = numberValue(dimensions[dimension]);
    if (!desired || desired.state === 'unknown' || next === undefined || Math.abs(desired.value - next) <= .000001) continue;
    const property = `target.dimensions.${dimension}`;
    if (brief.permissions.preserve.includes(property) || !brief.permissions.allowChanges.includes(property)) {
      reject('PRESERVED_DIMENSION', `${dimension}: this candidate changes a dimension that the design does not allow changing.`, dimensions[dimension]);
    } else {
      adjustments.push({ partInstanceId: brief.target.partInstanceId, property, before: desired.value, after: next,
        reason: 'Use the selected component dimension in the authored design; do not resize the purchased component.', reversible: true });
      if (!isReviewedFitMeasurement(dimensions[dimension])) missing('ADJUSTMENT_NEEDS_EVIDENCE', `${dimension}: the proposed authored change needs reviewed product measurements.`);
    }
  }
  const appearances = [
    { key: 'material', desired: brief.stylePreferences.material, value: candidate.defaultMaterial },
    { key: 'texture', desired: brief.stylePreferences.texture, value: candidate.defaultTexture },
    { key: 'color', desired: brief.stylePreferences.colour ?? brief.stylePreferences.color, value: candidate.visual?.dialColor },
    { key: 'style', desired: brief.stylePreferences.handStyle, value: candidate.visual?.handStyle },
    { key: 'style', desired: brief.stylePreferences.bezelProfile, value: candidate.visual?.bezelProfile },
  ];
  for (const { key, desired, value } of appearances) {
    if (!desired) continue;
    // Sparse appearance metadata is handled by aesthetic ranking; it cannot invalidate mechanical evidence.
    if (!value) continue;
    if (normalizeAppearance(desired) === normalizeAppearance(value)) continue;
    const property = `target.appearance.${key}`;
    if (brief.permissions.preserve.includes(property) || !brief.permissions.allowChanges.includes(property)) reject('PRESERVED_APPEARANCE', `${key}: this candidate changes a preserved design choice.`);
    else {
      adjustments.push({ partInstanceId: brief.target.partInstanceId, property, before: desired, after: value, reason: 'Adopt the candidate appearance through an explicit design change.', reversible: true });
    }
  }

  const selected = brief.mode === 'selected-case' ? findSelectedCase(assembly, items) : undefined;
  if (brief.mode === 'selected-case' && (!selected || selected.part.instanceId !== brief.selectedCase?.partInstanceId || selected.item.id !== brief.selectedCase?.catalogueItemId)) reject('STALE_CASE_REFERENCE', 'The selected case is missing, ambiguous or different from this search brief.');
  const constraints = selected ? deriveCaseConstraints(assembly, 'selected-case', items) : deriveCaseConstraints(assembly, 'concept', items);
  if (brief.target.slot === 'crystal') {
    compare('CRYSTAL_DIAMETER', 'Crystal diameter against the selected case seat', outer, constraints.interfaces.crystalSeatDiameterMm, (a, e) => Math.abs(a - e) <= .05 + 1e-9);
    compare('CRYSTAL_DEPTH', 'Crystal thickness against the recorded seat depth', thickness, constraints.interfaces.crystalSeatDepthMm, (a, e) => a <= e + .000001);
  } else if (brief.target.slot === 'dial') {
    compare('DIAL_DIAMETER', 'Dial diameter against the selected case seat', outer, constraints.interfaces.dialSeatDiameterMm, (a, e) => a <= e + .000001);
    const thick = numberValue(thickness);
    add('DIAL_THICKNESS', 'Dial thickness needs a qualified seat-height and hand-clearance comparison.', thickness);
    if (thick === undefined) missing('MISSING_DIAL_THICKNESS', 'Dial thickness has not been established.');
    missing('DIAL_INSTALLATION_EVIDENCE', 'Dial feet, movement/calibre identity, axial seat depth and hand clearance need product-specific evidence; diameter alone cannot establish dial fit.');
  } else if (brief.target.slot === 'hands') {
    const targetRole = role(targetItem?.kind), candidateRole = role(candidate.kind);
    if (targetRole && candidateRole && targetRole !== candidateRole) reject('WRONG_HAND_ROLE', `A ${candidateRole} hand cannot replace a ${targetRole} hand.`);
    if (!targetRole || !candidateRole) missing('HAND_ROLE_EVIDENCE', 'A complete product-specific hand-role and set mapping is required.');
    else {
      const movement = getActiveMovement(assembly);
      const bore = measurement('colletDiameterMm', candidate.engineeringSpecs?.hands?.colletDiameterMm ?? extractHandColletSpec(candidate)?.colletDiameterMm);
      compare('HAND_BORE', `${candidateRole} hand bore against the active movement`, bore,
        assumed(movement?.handSizesMm?.[targetRole], 'Movement library pinion values lack reviewed field-level source evidence.'), (a, e) => Math.abs(a - e) <= .02 + 1e-9);
    }
    add('HAND_LENGTH', 'Hand length must be checked against the actual dial and other hands.', length);
    add('HAND_STACK', 'Hand stack requires recorded axial clearance and mating evidence.', measurement('stackHeightMm', candidate.engineeringSpecs?.hands?.stackHeightMm));
    missing('HAND_INSTALLATION_EVIDENCE', 'Reviewed movement pinion evidence, role-specific reach and stack/clearance comparisons are required.');
  } else if (brief.target.slot === 'chapter-ring') {
    compare('CHAPTER_RING_DIAMETER', 'Chapter ring outer diameter against its selected case seat', outer,
      constraints.interfaces.chapterRingSeatDiameterMm, (a, e) => a <= e + .000001);
    missing('CHAPTER_RING_CHAIN_UNSUPPORTED', 'Additional chapter-ring axial seating, dial opening and retention checks are not yet supported.');
  } else if (brief.target.slot === 'strap') {
    compare('STRAP_WIDTH', 'Strap width against the selected case lug gap', dimensions.widthMm,
      constraints.interfaces.lugWidthMm, (a, e) => Math.abs(a - e) <= .05 + 1e-9);
    missing('STRAP_CHAIN_UNSUPPORTED', 'Additional strap end-link geometry, spring-bar and fastening checks are not yet supported.');
  } else if (brief.target.slot === 'rotating-bezel' || brief.target.slot === 'inner-bezel') {
    if (brief.target.slot === 'rotating-bezel') {
      compare('BEZEL_INNER_DIAMETER', 'Bezel mounting inner diameter against its case carrier',
        measurement('mountingInnerDiameterMm', undefined),
        constraints.interfaces.bezelCarrierInnerDiameterMm, (a, e) => Math.abs(a - e) <= .05 + 1e-9);
      compare('BEZEL_OUTER_DIAMETER', 'Bezel mounting outer diameter against its recorded case carrier', measurement('mountingOuterDiameterMm', undefined),
        constraints.interfaces.bezelCarrierOuterDiameterMm, (a, e) => Math.abs(a - e) <= .05 + 1e-9);
    }
    missing('BEZEL_CHAIN_UNSUPPORTED', brief.target.slot === 'inner-bezel'
      ? 'Internal bezel seat, crown-drive, retention and axial checks are not yet supported; an external bezel carrier cannot qualify them.'
      : 'Additional bezel retention, rotation, axial clearance and insert seating checks are not yet supported.');
  } else if (brief.target.slot === 'caseback') {
    compare('CASEBACK_DIAMETER', 'Caseback mounting diameter against the recorded caseback seat', measurement('mountingDiameterMm', undefined),
      constraints.interfaces.casebackSeatDiameterMm, (a, e) => Math.abs(a - e) <= .05 + 1e-9);
    missing('CASEBACK_CHAIN_UNSUPPORTED', 'Additional caseback thread/snap geometry, gasket and closure checks are not yet supported.');
  } else if (brief.target.slot === 'case') {
    const specs = candidate.engineeringSpecs?.case;
    const movementPart = Object.values(assembly.parts).filter(part => part.visible).map(part => items.find(item => item.id === part.catalogueItemId)?.engineeringSpecs?.movement)
      .find(movement => movement?.calibreId.toLowerCase() === assembly.metadata.movement.toLowerCase());
    compare('CASE_MOVEMENT_CAVITY', 'Actual movement diameter against candidate case cavity',
      assumed(movementPart?.diameterMm, 'Explicit selected movement catalogue dimension without reviewed source evidence.'),
      assumed(specs?.cavityDiameterMm, 'Explicit candidate case cavity dimension without reviewed source evidence.'), (a, e) => a <= e + .000001);
    const dialPart = Object.values(assembly.parts).find(part => part.visible && items.find(item => item.id === part.catalogueItemId)?.category === 'dial');
    compare('CASE_DIAL_SEAT', 'Actual dial diameter against candidate case dial seat',
      assumed(dialPart?.dimensions.diameterMm, 'Authored current dial dimension, not reviewed product evidence.'),
      assumed(specs?.dialSeatDiameterMm, 'Explicit candidate case seat dimension without reviewed source evidence.'), (a, e) => a <= e + .000001);
    missing('CASE_CHAIN_UNSUPPORTED', 'Additional movement height, stem installation, crown, crystal, bezel, caseback and fastening checks are not yet supported for case replacement.');
  } else missing('UNSUPPORTED_MATING_CHAIN', 'Additional product-specific mating-interface checks are not yet supported for this component. Generic dimensions do not establish fit.');

  // The legacy engine provides diagnostics only. Unrelated assembly failures cannot poison this result.
  if (incomplete || incompatible) {
    const diagnostic = evaluateCandidate({ assembly, targetPartInstanceId: brief.target.partInstanceId,
      candidateCatalogueItemId: candidate.id, candidateItem: candidate });
    for (const check of diagnostic.checks.filter(check => check.status !== 'green' &&
      (check.affectedPartIds?.includes(brief.target.partInstanceId) || check.affectedCatalogueItemIds?.includes(candidate.id)))) {
      if (brief.target.slot === 'crown' && check.status === 'red' && (check.code === 'CROWN_INTERFACE_MISMATCH' || check.code === 'CROWN_SLOT_MISMATCH')) {
        reject('CROWN_SPECIALIST_CONTRADICTION', check.summary);
      }
      add(`PROVISIONAL_${check.code}`, `Provisional check: ${check.summary}`, { state: 'assumed', value: check.summary,
        reason: 'Legacy compatibility diagnostic; not reviewed product-specific fit evidence.' });
    }
  }
  return { version: 1, briefIdentityToken: brief.assembly.identityToken, catalogueItemId: candidate.id,
    supplierListingIds: [...new Set(supplierListings.filter(listing => listing.catalogueItemId === candidate.id).map(listing => listing.id))].sort(),
    group: incompatible ? 'incompatible' : incomplete ? 'needs-evidence' : adjustments.length ? 'changes-required' : 'fits-recorded-dimensions', reasons, adjustments };
}
