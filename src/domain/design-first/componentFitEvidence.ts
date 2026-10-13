import { evidenceFieldErrors, type EvidenceField } from './evidence';

export const componentFitMeasurements = [
  'outerDiameterMm', 'innerDiameterMm', 'widthMm', 'thicknessMm',
  'colletDiameterMm', 'lengthMm', 'stackHeightMm',
  'mountingDiameterMm', 'mountingInnerDiameterMm', 'mountingOuterDiameterMm',
] as const;
export type ComponentFitMeasurement = typeof componentFitMeasurements[number];

/** Exact-product measurements, separate from authored geometry and commercial offers.
 * A complete dimensional comparison is not a pressure/sealing or installation certificate.
 */
export interface ComponentFitEvidenceV1 {
  readonly schema: 'component-fit-evidence/v1';
  readonly catalogueItemId: string;
  readonly measurements: Readonly<Partial<Record<ComponentFitMeasurement, EvidenceField<number>>>>;
}

export function componentFitEvidenceErrors(value: unknown, catalogueItemId?: string): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['Component measurement evidence must be an object.'];
  const record = value as Record<string, unknown>;
  const errors: string[] = [];
  if (record.schema !== 'component-fit-evidence/v1') errors.push('Unsupported component evidence version.');
  if (typeof record.catalogueItemId !== 'string' || !record.catalogueItemId.trim() || (catalogueItemId !== undefined && record.catalogueItemId !== catalogueItemId)) errors.push('Component evidence must identify this exact catalogue item.');
  if (!record.measurements || typeof record.measurements !== 'object' || Array.isArray(record.measurements)) return [...errors, 'Explicit measurement evidence is required.'];
  for (const [key, field] of Object.entries(record.measurements)) {
    if (!componentFitMeasurements.includes(key as ComponentFitMeasurement)) { errors.push(`Unsupported measurement: ${key}.`); continue; }
    try {
      errors.push(...evidenceFieldErrors(field as EvidenceField<number>, number => typeof number === 'number' && Number.isFinite(number) && number > 0).map(error => `${key}: ${error}`));
    } catch { errors.push(`${key}: malformed measurement evidence.`); }
  }
  return errors;
}

export function isReviewedFitMeasurement(field: EvidenceField<number>): boolean {
  return evidenceFieldErrors(field, value => typeof value === 'number' && Number.isFinite(value) && value > 0).length === 0
    && field.state === 'recorded' && field.review === 'reviewed' && field.source.kind !== 'synthetic-fixture';
}
