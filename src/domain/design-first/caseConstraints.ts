import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import { evidenceFieldErrors, type DesignPartSlot, type EvidenceField } from './evidence';

export const CASE_CONSTRAINT_SCHEMA = 'case-constraints/v1' as const;
export const caseInterfaceMeasurements = [
  'crystalSeatDiameterMm', 'crystalSeatDepthMm', 'dialSeatDiameterMm',
  'chapterRingSeatDiameterMm', 'bezelCarrierInnerDiameterMm', 'bezelCarrierOuterDiameterMm',
  'movementCavityDiameterMm', 'movementCavityDepthMm', 'lugWidthMm', 'stemHeightMm',
  'casebackSeatDiameterMm',
] as const;
export type CaseInterfaceMeasurement = typeof caseInterfaceMeasurements[number];
export type CaseInclusion = 'included' | 'optional' | 'not-included';
export type CaseHardwareSlot = Exclude<DesignPartSlot, 'case' | 'hands'>;
export const caseHardwareSlots: readonly CaseHardwareSlot[] = [
  'crystal', 'caseback', 'crown', 'dial', 'chapter-ring', 'inner-bezel', 'rotating-bezel', 'strap',
];

/** Inclusion and case-owned interfaces do not establish compatibility with a candidate part. */
export interface CaseHardwareConstraint {
  readonly inclusion: EvidenceField<CaseInclusion>;
  readonly fixedInterface: EvidenceField<boolean>;
}

/** Transport contract only: no derived seats, assembly mutation, or fit approval. */
export interface CaseConstraintsV1 {
  readonly schema: typeof CASE_CONSTRAINT_SCHEMA;
  readonly mode: 'concept' | 'selected-case';
  readonly catalogueItemId?: ComponentCatalogueItem['id'];
  readonly supplierListingId?: SupplierListing['id'];
  readonly outerDiameterMm: EvidenceField<number>;
  readonly interfaces: Readonly<Record<CaseInterfaceMeasurement, EvidenceField<number>>>;
  readonly hardware: Readonly<Record<CaseHardwareSlot, CaseHardwareConstraint>>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function fieldErrors<T>(value: unknown, valid: (value: T) => boolean): string[] {
  if (!isRecord(value)) return ['An explicit evidence field is required.'];
  if (value.state === 'recorded' && !isRecord(value.source)) return ['Recorded evidence requires a source.'];
  if (!['recorded', 'assumed', 'unknown'].includes(String(value.state))) return ['Evidence state is invalid.'];
  try { return evidenceFieldErrors(value as unknown as EvidenceField<T>, valid); }
  catch { return ['Evidence field is malformed.']; }
}

/** Validity is schema validity only; assumptions and synthetic sources remain unverified fit evidence. */
export function caseConstraintErrors(value: unknown): string[] {
  if (!isRecord(value)) return ['Case constraints must be an object.'];
  const errors: string[] = [];
  if (value.schema !== CASE_CONSTRAINT_SCHEMA) errors.push('Unsupported case constraint schema.');
  if (!['concept', 'selected-case'].includes(String(value.mode))) errors.push('Unknown case constraint mode.');
  for (const key of ['catalogueItemId', 'supplierListingId']) {
    if (value[key] !== undefined && (typeof value[key] !== 'string' || !value[key].trim())) errors.push(`${key} must be a non-empty reference.`);
  }
  if (value.mode === 'concept' && (value.catalogueItemId !== undefined || value.supplierListingId !== undefined)) {
    errors.push('Concept constraints cannot identify selected catalogue hardware.');
  }
  if (value.mode === 'selected-case' && (typeof value.catalogueItemId !== 'string' || !value.catalogueItemId.trim())) {
    errors.push('Selected-case constraints require a catalogue item reference.');
  }
  if (value.supplierListingId !== undefined && value.catalogueItemId === undefined) errors.push('A listing reference requires its catalogue item reference.');
  const positiveMm = (mm: number) => typeof mm === 'number' && Number.isFinite(mm) && mm > 0;
  errors.push(...fieldErrors(value.outerDiameterMm, positiveMm).map(error => `outerDiameterMm: ${error}`));
  const interfaces = isRecord(value.interfaces) ? value.interfaces : {};
  for (const key of caseInterfaceMeasurements) {
    // A stem height is a coordinate; DF2 must establish its datum before comparing candidates.
    const validMm = key === 'stemHeightMm'
      ? (mm: number) => typeof mm === 'number' && Number.isFinite(mm) && mm >= 0
      : positiveMm;
    errors.push(...fieldErrors(interfaces[key], validMm).map(error => `interfaces.${key}: ${error}`));
  }
  const hardware = isRecord(value.hardware) ? value.hardware : {};
  for (const slot of caseHardwareSlots) {
    const constraint = isRecord(hardware[slot]) ? hardware[slot] : {};
    errors.push(...fieldErrors<CaseInclusion>(constraint.inclusion, inclusion => ['included', 'optional', 'not-included'].includes(inclusion)).map(error => `hardware.${slot}.inclusion: ${error}`));
    errors.push(...fieldErrors<boolean>(constraint.fixedInterface, fixed => typeof fixed === 'boolean').map(error => `hardware.${slot}.fixedInterface: ${error}`));
  }
  return errors;
}
