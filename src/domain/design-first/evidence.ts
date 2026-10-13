/** DF0 transport contracts only. These do not certify fit or alter an assembly. */
export type EvidenceSourceKind = 'supplier-page' | 'manufacturer-drawing' | 'measured-sample' | 'user-record' | 'synthetic-fixture';
export interface EvidenceSource {
  readonly id: string;
  readonly kind: EvidenceSourceKind;
  /** URL, drawing reference or measurement record; never an invented source. */
  readonly locator: string;
  readonly capturedAt: string;
  readonly revision?: string;
}

/** Unknown is explicit; zero is never a stand-in for missing dimensions. */
export type EvidenceField<T> =
  | { readonly state: 'recorded'; readonly value: T; readonly source: EvidenceSource; readonly review: 'unreviewed' | 'reviewed' }
  | { readonly state: 'assumed'; readonly value: T; readonly reason: string }
  | { readonly state: 'unknown'; readonly reason: string };

/** Shared component slot names; these are not a replacement catalogue or assembly. */
export type DesignPartSlot = 'case' | 'crystal' | 'caseback' | 'crown' | 'dial' | 'hands' | 'chapter-ring' | 'inner-bezel' | 'rotating-bezel' | 'strap';
export type NavigatorGroup = 'design' | 'case-hardware';

export const evidenceSourceErrors = (source: EvidenceSource): string[] => {
  const errors: string[] = [];
  if (!source || typeof source !== 'object') return ['Evidence source is required.'];
  if (typeof source.id !== 'string' || !source.id.trim()) errors.push('Evidence source ID is required.');
  if (!['supplier-page', 'manufacturer-drawing', 'measured-sample', 'user-record', 'synthetic-fixture'].includes(source.kind)) errors.push('Unknown evidence source kind.');
  if (typeof source.locator !== 'string' || !source.locator.trim()) errors.push('Evidence source locator is required.');
  if (typeof source.capturedAt !== 'string' || !Number.isFinite(Date.parse(source.capturedAt))) errors.push('Evidence capture date is required.');
  return errors;
};

/** A well-formed field can still be assumed or unreviewed; validity is not fit approval. */
export const evidenceFieldErrors = <T>(field: EvidenceField<T>, validValue: (value: T) => boolean): string[] => {
  if (!field || typeof field !== 'object') return ['Evidence field is required.'];
  if (field.state === 'unknown') return typeof field.reason === 'string' && field.reason.trim() ? [] : ['Unknown fields require a reason.'];
  const errors = validValue(field.value) ? [] : ['Evidence value is invalid.'];
  if (field.state === 'assumed') {
    if (typeof field.reason !== 'string' || !field.reason.trim()) errors.push('Assumed fields require a reason.');
  } else if (field.state === 'recorded') {
    errors.push(...evidenceSourceErrors(field.source));
    if (!['unreviewed', 'reviewed'].includes(field.review)) errors.push('Evidence review state is invalid.');
  } else errors.push('Evidence state is invalid.');
  return errors;
};
