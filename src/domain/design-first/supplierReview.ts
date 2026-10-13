import { z } from 'zod';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import { createManualSupplierIntake, parseSupplierIntake, supplierIntakeIdentity, type ManualSupplierIntakeInput, type SupplierIntakeCapture, type SupplierIntakeRecord } from './supplierIntake';
import { parseAliExpressCapture, supplierListingFromCapture } from '@/domain/sourcing/aliexpressCapture';
import { parseSupplierDraft, type CanonicalMeasurement, type SupplierDraft } from './supplierDraft';
import type { DesignPartSlot, EvidenceField } from './evidence';
import { caseHardwareSlots, caseInterfaceMeasurements, type CaseConstraintsV1 } from './caseConstraints';
import { componentFitMeasurements, type ComponentFitEvidenceV1 } from './componentFitEvidence';

export interface SupplierReviewField {
  readonly path: string;
  readonly label: string;
  readonly kind: 'variant' | 'measurement' | 'attribute' | 'package' | 'source' | 'image-usage' | 'commercial';
  readonly eligible: boolean;
  readonly reason: string;
}
export interface SupplierReviewDecision {
  readonly entryId: string;
  readonly revisionId: string;
  readonly reviewer: string;
  readonly reason: string;
  readonly record: SupplierIntakeRecord;
  readonly reviewedPaths: readonly string[];
  readonly action: 'approve' | 'reject';
  readonly reviewedAt: string;
}
export interface SupplierReviewEvent {
  readonly schema: 'supplier-review/v1';
  readonly id: string;
  readonly entryId: string;
  readonly revisionId: string;
  readonly reviewer: string;
  readonly reason: string;
  readonly reviewedPaths: readonly string[];
  readonly action: 'approve' | 'reject';
  readonly reviewedAt: string;
  /** Exact normalized content identity, not an authentication signature. */
  readonly recordIdentity: string;
}
export interface SupplierPublication {
  readonly component: ComponentCatalogueItem;
  readonly offers: readonly SupplierListing[];
  readonly images: readonly SupplierDraft['images'][number][];
  readonly provenance: {
    readonly entryId: string;
    readonly revisionId: string;
    readonly eventId: string;
    readonly recordIdentity: string;
    readonly identity: SupplierDraft['identity'];
    readonly associatedCatalogueItemId: string | null;
    readonly reviewer: string;
    readonly reason: string;
    readonly reviewedAt: string;
    readonly reviewedPaths: readonly string[];
    readonly sources: SupplierDraft['sources'];
  };
}
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const canonical = (value: unknown): string => JSON.stringify(value, (_key, child: unknown) => object(child)
  ? Object.fromEntries(Object.entries(child).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : child);
const fingerprint = (value: unknown): string => {
  const content = canonical(value);
  const lanes = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  for (let index = 0; index < content.length; index++) for (let lane = 0; lane < lanes.length; lane++) lanes[lane] = Math.imul(lanes[lane]! ^ content.charCodeAt(index), 0x01000193 + 2 * lane) >>> 0;
  return lanes.map(value => value.toString(16).padStart(8, '0')).join('');
};
const text = z.string().trim().min(1);
const eventSchema = z.object({ schema: z.literal('supplier-review/v1'), id: text, entryId: text, revisionId: text,
  reviewer: text, reason: text, reviewedPaths: z.array(text), action: z.enum(['approve', 'reject']),
  reviewedAt: z.iso.datetime({ offset: true }), recordIdentity: text }).strict();

function fieldEntries(draft: SupplierDraft): [string, EvidenceField<unknown>][] {
  return [['identity.variant', draft.identity.variant],
    ...Object.entries(draft.engineering.measurements).map(([key, field]): [string, EvidenceField<unknown>] => [`engineering.measurements.${key}`, field]),
    ...Object.entries(draft.engineering.attributes).map(([key, field]): [string, EvidenceField<unknown>] => [`engineering.attributes.${key}`, field]),
    ...draft.packageContents.map(item => [`packageContents.${item.slot}.inclusion`, item.inclusion] as [string, EvidenceField<unknown>])];
}

/** Recognizes supported capture formats only. Arbitrary raw JSON never becomes a commercial offer. */
function commercialCapture(record: SupplierIntakeRecord, capture: SupplierIntakeCapture, catalogueItemId: string): SupplierListing | undefined {
  try {
    const raw = capture.raw;
    const source = record.draft.sources.find(source => source.id === capture.sourceId);
    if (!object(raw) || !source || source.kind === 'synthetic-fixture') return undefined;
    const variant = record.draft.identity.variant;
    if (variant.state !== 'recorded') return undefined;
    if (raw.schema === 'dial-designer/aliexpress-capture/v1') {
      const parsed = parseAliExpressCapture(raw);
      if (parsed.sourceUrl !== source.locator || parsed.capturedAtIso !== source.capturedAt || parsed.variant !== variant.value
        || parsed.itemId !== record.draft.identity.productId || `aliexpress:seller-name:${parsed.sellerName.trim()}` !== record.draft.identity.supplierId) return undefined;
      return supplierListingFromCapture(parsed, catalogueItemId);
    }
    if (raw.sourceUrl !== source.locator || raw.capturedAt !== source.capturedAt || raw.supplierId !== record.draft.identity.supplierId
      || raw.productId !== record.draft.identity.productId || raw.variant !== variant.value || raw.slot !== record.draft.engineering.slot
      || typeof raw.currency !== 'string' || !('unitPrice' in raw)) return undefined;
    const manual = createManualSupplierIntake({ ...(raw as unknown as ManualSupplierIntakeInput), catalogueItemId });
    const offer = manual.offers[0];
    if (!offer) return undefined;
    if (raw.stockStatus !== undefined && (typeof raw.stockStatus !== 'string' || !['in-stock', 'out-of-stock', 'backorder', 'unknown'].includes(raw.stockStatus))) return undefined;
    if (raw.sku !== undefined && (typeof raw.sku !== 'string' || !raw.sku.trim())) return undefined;
    if (raw.shippingDestination !== undefined && (typeof raw.shippingDestination !== 'string' || !raw.shippingDestination.trim())) return undefined;
    return { ...offer, ...(typeof raw.sku === 'string' ? { sku: raw.sku } : {}),
      ...(typeof raw.shippingDestination === 'string' ? { shippingDestination: raw.shippingDestination } : {}),
      stockStatus: raw.stockStatus as SupplierListing['stockStatus'] | undefined ?? 'unknown' };
  } catch { return undefined; }
}

export function supplierCommercialReviewDetails(record: SupplierIntakeRecord, path: string): SupplierListing | undefined {
  const normalized = parseSupplierIntake(record);
  const offer = normalized.offers.find(offer => path === `offers.${offer.id}`);
  if (offer) return structuredClone(offer);
  const capture = normalized.captures.find(capture => path === `captures.${capture.id}.commercial`);
  return capture ? commercialCapture(normalized, capture, 'supplier-review-validation-only') : undefined;
}

/** Explicit paths only. Unknown/assumed values are displayed but cannot be attested as recorded facts. */
export function supplierReviewFields(record: SupplierIntakeRecord): readonly SupplierReviewField[] {
  const normalized = parseSupplierIntake(record);
  const draft = normalized.draft;
  const fields: SupplierReviewField[] = fieldEntries(draft).map(([path, field]) => ({ path,
    label: path === 'identity.variant' ? 'Exact selected variant' : path,
    kind: path === 'identity.variant' ? 'variant' : path.startsWith('engineering.measurements.') ? 'measurement' : path.startsWith('engineering.attributes.') ? 'attribute' : 'package',
    eligible: field.state === 'recorded', reason: field.state === 'recorded' ? 'Source-backed claim; review checks the transcription, not mechanical fit.' : 'Unknown or assumed values cannot be promoted through review.' }));
  for (const source of draft.sources) fields.push({ path: `sources.${source.id}`, label: `Evidence source: ${source.locator}`, kind: 'source', eligible: true, reason: 'Attest this exact registered evidence source.' });
  draft.images.forEach((image, index) => fields.push({ path: `images.${index}.usage`, label: `Image permission: ${image.locator}`, kind: 'image-usage',
    eligible: image.usage.state === 'permitted', reason: image.usage.state === 'permitted' ? 'Review the permission basis and its evidence source together.' : 'No documented image-use permission exists.' }));
  for (const offer of normalized.offers) fields.push({ path: `offers.${offer.id}`, label: `Commercial snapshot: ${offer.supplierName}`, kind: 'commercial', eligible: true,
    reason: 'Review this exact dated commercial snapshot; price and stock remain unverified supplier claims.' });
  for (const capture of normalized.captures) fields.push({ path: `captures.${capture.id}.commercial`, label: `Commercial capture: ${capture.id}`, kind: 'commercial',
    eligible: commercialCapture(normalized, capture, 'supplier-review-validation-only') !== undefined,
    reason: 'Only supported, source-dated commercial captures matching the exact product and variant can be attested.' });
  return fields;
}

export function createSupplierReviewEvent(decision: SupplierReviewDecision): SupplierReviewEvent {
  const record = parseSupplierIntake(decision.record);
  const paths = [...decision.reviewedPaths].sort();
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate review path.');
  const fields = supplierReviewFields(record);
  for (const path of paths) {
    const field = fields.find(field => field.path === path);
    if (!field?.eligible) throw new Error(`Only recorded or documented evidence can be attested: ${path}.`);
  }
  if (decision.action === 'approve' && (!paths.includes('identity.variant') || !paths.some(path => path.startsWith('engineering.measurements.') || path.startsWith('engineering.attributes.')))) {
    throw new Error('Approval requires the exact recorded variant and at least one source-backed measurement or attribute to be reviewed.');
  }
  for (const [index, image] of record.draft.images.entries()) if (paths.includes(`images.${index}.usage`)) {
    if (image.usage.state !== 'permitted' || !paths.includes(`sources.${image.usage.evidenceSourceId}`)) throw new Error('Image permission review also requires its registered evidence source.');
  }
  const body = { schema: 'supplier-review/v1' as const, entryId: decision.entryId.trim(), revisionId: decision.revisionId.trim(),
    reviewer: decision.reviewer.trim(), reason: decision.reason.trim(), reviewedPaths: paths, action: decision.action,
    reviewedAt: decision.reviewedAt, recordIdentity: canonical(record) };
  const event = eventSchema.parse({ ...body, id: `supplier-review-${fingerprint(body)}` });
  return event;
}

/** Persisted events are checked against the exact queue revision content before projection or publication. */
export function validateSupplierReviewEvent(record: SupplierIntakeRecord, input: unknown): SupplierReviewEvent {
  const event = eventSchema.parse(input);
  const expected = createSupplierReviewEvent({ ...event, record });
  if (canonical(event) !== canonical(expected)) throw new Error('Review event is stale, altered or bound to a different supplier revision.');
  return event;
}

export function assertSupplierReviewEvent(record: SupplierIntakeRecord, event: SupplierReviewEvent): void {
  validateSupplierReviewEvent(record, event);
}

/** Ambiguous captures may be resolved, but established supplier/product/variant identities cannot be rewritten. */
export function supplierCorrectionIdentityCompatible(base: SupplierIntakeRecord, next: SupplierIntakeRecord): boolean {
  const before = parseSupplierIntake(base).draft.identity;
  const after = parseSupplierIntake(next).draft.identity;
  return before.supplierId === after.supplierId && before.productId === after.productId
    && (before.variant.state !== 'recorded' || (after.variant.state === 'recorded' && before.variant.value === after.variant.value));
}

export function projectSupplierReview(record: SupplierIntakeRecord, input: SupplierReviewEvent): SupplierDraft {
  const draft = parseSupplierIntake(record).draft;
  const event = validateSupplierReviewEvent(record, input);
  if (event.action !== 'approve') return draft;
  const attested = <T>(path: string, field: EvidenceField<T>): EvidenceField<T> => field.state === 'recorded' && event.reviewedPaths.includes(path) ? { ...field, review: 'reviewed' } : field;
  return parseSupplierDraft({ ...draft, status: 'reviewed',
    identity: { ...draft.identity, variant: attested('identity.variant', draft.identity.variant) },
    engineering: { ...draft.engineering,
      measurements: Object.fromEntries(Object.entries(draft.engineering.measurements).map(([key, field]) => [key, attested(`engineering.measurements.${key}`, field)])),
      attributes: Object.fromEntries(Object.entries(draft.engineering.attributes).map(([key, field]) => [key, attested(`engineering.attributes.${key}`, field)])) },
    packageContents: draft.packageContents.map(item => ({ ...item, inclusion: attested(`packageContents.${item.slot}.inclusion`, item.inclusion) })), fitQualification: 'not-assessed' });
}

const unknown = <T>(reason: string): EvidenceField<T> => ({ state: 'unknown', reason });
function mm(field: EvidenceField<CanonicalMeasurement> | undefined): EvidenceField<number> {
  if (!field) return unknown('No explicit measurement has been captured.');
  if (field.state === 'unknown') return field;
  if (field.value.unit !== 'mm' || !Number.isFinite(field.value.value) || field.value.value <= 0) return unknown('A positive size in millimetres has not been established.');
  return { ...field, value: field.value.value };
}
const reviewedNumber = (field: EvidenceField<number>): number | undefined => field.state === 'recorded' && field.review === 'reviewed' ? field.value : undefined;
const reviewedText = (field: EvidenceField<string> | undefined): string | undefined => field?.state === 'recorded' && field.review === 'reviewed' ? field.value : undefined;

/** Creates an isolated catalogue proposal. Linking a prior catalogue ID never authorizes overwriting it. */
export function publishSupplierReview(record: SupplierIntakeRecord, input: SupplierReviewEvent): SupplierPublication {
  const normalized = parseSupplierIntake(record);
  const event = validateSupplierReviewEvent(normalized, input);
  if (event.action !== 'approve') throw new Error('A declined review cannot be published.');
  if (normalized.draft.syntheticFixture) throw new Error('Synthetic fixtures cannot be published as supplier components.');
  const identity = supplierIntakeIdentity(normalized);
  if (!identity.startsWith('real:exact:')) throw new Error('Publication requires an identified supplier, product and recorded exact variant.');
  const draft = projectSupplierReview(normalized, event);
  const id = `supplier-component-${fingerprint(identity)}`;
  if (id === draft.engineering.catalogueItemId) throw new Error('Publication cannot overwrite the associated existing component.');
  const slot = draft.engineering.slot;
  const measurements: ComponentFitEvidenceV1['measurements'] = Object.fromEntries(componentFitMeasurements.map(key => [key, mm(draft.engineering.measurements[key]) ]));
  const fitEvidence: ComponentFitEvidenceV1 = { schema: 'component-fit-evidence/v1', catalogueItemId: id, measurements };
  const size = (key: string) => reviewedNumber(mm(draft.engineering.measurements[key]));
  const role = reviewedText(draft.engineering.attributes.handRole);
  const kinds: Record<DesignPartSlot, [string, ComponentCatalogueItem['category']]> = {
    case: ['midcase', 'case'], crystal: ['crystal', 'case'], caseback: ['caseback', 'case'], crown: ['crown', 'case'],
    dial: ['dial-blank', 'dial'], hands: [role === 'hour' ? 'hour-hand' : role === 'minute' ? 'minute-hand' : role === 'second' ? 'central-seconds' : 'hand-set', 'hands'],
    'chapter-ring': ['chapter-ring', 'rings'], 'inner-bezel': ['inner-bezel', 'rings'], 'rotating-bezel': ['rotating-bezel', 'rings'], strap: ['strap', 'external'],
  };
  const [kind, category] = kinds[slot];
  const explicitOuter = mm(draft.engineering.measurements.outerDiameterMm);
  const caseOuter = mm(draft.engineering.measurements.caseDiameterMm);
  if (slot === 'case' && explicitOuter.state !== 'unknown' && caseOuter.state !== 'unknown' && explicitOuter.value !== caseOuter.value) throw new Error('Case exterior measurements conflict; reconcile outerDiameterMm and caseDiameterMm before publication.');
  const outerField = slot === 'case' && explicitOuter.state === 'unknown' ? caseOuter : explicitOuter;
  const outer = reviewedNumber(outerField), thickness = size('thicknessMm'), width = size('widthMm');
  const renderKeys: Record<DesignPartSlot, readonly string[]> = { case: [], crystal: ['outerDiameterMm', 'thicknessMm'], caseback: ['outerDiameterMm', 'thicknessMm'], crown: [],
    dial: ['outerDiameterMm', 'thicknessMm'], hands: [], 'chapter-ring': ['outerDiameterMm', 'innerDiameterMm', 'widthMm', 'thicknessMm'],
    'inner-bezel': ['outerDiameterMm', 'innerDiameterMm', 'widthMm', 'thicknessMm'], 'rotating-bezel': ['outerDiameterMm', 'innerDiameterMm', 'widthMm', 'thicknessMm'], strap: ['widthMm', 'thicknessMm'] };
  const researchOnly = ['case', 'hands', 'crown'].includes(slot) || renderKeys[slot].some(key => size(key) === undefined);
  const material = reviewedText(draft.engineering.attributes.material) ?? '';
  const texture = reviewedText(draft.engineering.attributes.texture) ?? '';
  const title = reviewedText(draft.engineering.attributes.title);
  const variant = draft.identity.variant.state === 'recorded' ? draft.identity.variant.value : '';
  const component: ComponentCatalogueItem = { id, kind, category,
    displayName: title ?? `${draft.identity.supplierId} ${draft.identity.productId} — ${variant}`,
    defaultMaterial: material, defaultTexture: texture, linkedBandKind: null,
    // Zero is an explicit legacy display sentinel only; typed evidence retains unknowns and research-only prevents application.
    nominalDimensions: { diameterMm: slot === 'strap' ? width ?? 0 : outer ?? 0, thicknessMm: thickness ?? 0, widthMm: width ?? 0 },
    manufacturing: { processProfile: 'cnc', minimumFeatureMm: 0, minimumGapMm: 0, minimumStrokeWidthMm: 0,
      recommendations: ['Supplier-source transcription only. Manufacturing limits and installation remain unqualified.'] },
    softStyles: [], status: 'published', researchOnly, exportEnabled: false, fitEvidence,
    metadata: { tags: ['supplier-reviewed', 'fit-not-assessed'], revision: event.revisionId,
      notes: `Review ${event.id}; supplier claims reviewed by ${event.reviewer}. No manufacturing or fit qualification.` } };
  if (slot === 'case') {
    const interfaces = Object.fromEntries(caseInterfaceMeasurements.map(key => [key, key === 'stemHeightMm'
      ? unknown<number>('No shared stem datum is established.') : mm(draft.engineering.measurements[key])])) as CaseConstraintsV1['interfaces'];
    const hardware = Object.fromEntries(caseHardwareSlots.map(hardwareSlot => {
      const inclusion = draft.packageContents.find(item => item.slot === hardwareSlot)?.inclusion;
      return [hardwareSlot, { inclusion: inclusion ?? unknown('Package contents have not been established.'),
        fixedInterface: unknown('Replaceability and fixed interfaces have not been established.') }];
    })) as CaseConstraintsV1['hardware'];
    component.caseConstraints = { schema: 'case-constraints/v1', mode: 'selected-case', catalogueItemId: id,
      outerDiameterMm: outerField, interfaces, hardware };
  }
  const reviewedOffers = normalized.offers.filter(offer => event.reviewedPaths.includes(`offers.${offer.id}`));
  const reviewedCaptures = normalized.captures.filter(capture => event.reviewedPaths.includes(`captures.${capture.id}.commercial`));
  const offerSnapshots = [...reviewedOffers, ...reviewedCaptures.flatMap(capture => {
    const offer = commercialCapture(normalized, capture, id);
    return offer ? [offer] : [];
  })];
  const offers = [...new Map(offerSnapshots.map(offer => {
    const { id: _originalId, catalogueItemId: _associatedId, ...claim } = offer;
    void _originalId; void _associatedId;
    const offerId = `supplier-offer-${fingerprint([identity, claim])}`;
    return [offerId, { ...structuredClone(offer), id: offerId, catalogueItemId: id, verificationStatus: 'unverified' as const, directOrderCapability: false }];
  })).values()];
  const images = draft.images.filter((image, index) => image.usage.state === 'permitted' && event.reviewedPaths.includes(`images.${index}.usage`)
    && event.reviewedPaths.includes(`sources.${image.usage.evidenceSourceId}`));
  return { component, offers, images, provenance: { entryId: event.entryId, revisionId: event.revisionId, eventId: event.id,
    recordIdentity: event.recordIdentity, identity: draft.identity, associatedCatalogueItemId: draft.engineering.catalogueItemId,
    reviewer: event.reviewer, reason: event.reason, reviewedAt: event.reviewedAt, reviewedPaths: event.reviewedPaths, sources: draft.sources } };
}
