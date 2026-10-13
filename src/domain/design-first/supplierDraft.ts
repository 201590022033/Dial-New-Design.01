import { z } from 'zod';
import type { CatalogueItemStatus, SupplierListing } from '@/domain/catalogue/types';
import { evidenceFieldErrors, type EvidenceField, type EvidenceSource, type DesignPartSlot } from './evidence';

export const SUPPLIER_DRAFT_SCHEMA = 'dial-designer/supplier-draft/v1' as const;
export interface SupplierProductIdentity {
  readonly supplierId: string;
  readonly productId: string;
  /** Exact option identifier, or an explicit unknown. Never a default variant guess. */
  readonly variant: EvidenceField<string>;
}
/** mm values are positive sizes. Coordinates and zero-clearance values need later
 * typed fields; zero must never serve as a placeholder for unknown dimensions. */
export interface CanonicalMeasurement { readonly value: number; readonly unit: 'mm' | 'deg' }
/** Transport-only proposal. References existing catalogue components and offers. */
export interface SupplierDraft {
  readonly schema: typeof SUPPLIER_DRAFT_SCHEMA;
  readonly id: string;
  readonly status: Extract<CatalogueItemStatus, 'draft' | 'ai-extracted' | 'reviewed'>;
  readonly syntheticFixture: boolean;
  readonly identity: SupplierProductIdentity;
  readonly sources: readonly EvidenceSource[];
  readonly engineering: {
    readonly catalogueItemId: string | null;
    readonly slot: DesignPartSlot;
    readonly measurements: Readonly<Record<string, EvidenceField<CanonicalMeasurement>>>;
    readonly attributes: Readonly<Record<string, EvidenceField<string>>>;
  };
  readonly offers: readonly { readonly listingId: SupplierListing['id']; readonly sourceId: string }[];
  readonly packageContents: readonly {
    readonly slot: DesignPartSlot;
    readonly inclusion: EvidenceField<'included' | 'not-included'>;
    readonly catalogueItemId?: string;
  }[];
  readonly images: readonly {
    readonly locator: string;
    readonly sourceId: string;
    readonly usage: { readonly state: 'unknown'; readonly reason: string } | {
      readonly state: 'permitted'; readonly basis: string; readonly evidenceSourceId: string;
      readonly attribution: string; readonly restrictions: string;
    };
  }[];
  /** Extraction confidence describes transcription, never mechanical fit. */
  readonly extraction: { readonly method: 'manual' | 'ai'; readonly confidence?: number };
  readonly fitQualification: 'not-assessed';
}

const nonempty = z.string().trim().min(1);
const sourceSchema = z.object({ id: nonempty, kind: z.enum(['supplier-page', 'manufacturer-drawing', 'measured-sample', 'user-record', 'synthetic-fixture']), locator: nonempty, capturedAt: z.iso.datetime({ offset: true }), revision: nonempty.optional() }).strict();
const fieldSchema = <T extends z.ZodType>(value: T) => z.discriminatedUnion('state', [
  z.object({ state: z.literal('unknown'), reason: nonempty }).strict(),
  z.object({ state: z.literal('assumed'), value, reason: nonempty }).strict(),
  z.object({ state: z.literal('recorded'), value, source: sourceSchema, review: z.enum(['unreviewed', 'reviewed']) }).strict()
]);
const slotSchema = z.enum(['case', 'crystal', 'caseback', 'crown', 'dial', 'hands', 'chapter-ring', 'inner-bezel', 'rotating-bezel', 'strap']);
const measurementSchema = z.discriminatedUnion('unit', [
  z.object({ value: z.number().finite().positive(), unit: z.literal('mm') }).strict(),
  z.object({ value: z.number().finite().min(0).max(360), unit: z.literal('deg') }).strict()
]);
const draftSchema = z.object({
  schema: z.literal(SUPPLIER_DRAFT_SCHEMA), id: nonempty, status: z.enum(['draft', 'ai-extracted', 'reviewed']), syntheticFixture: z.boolean(),
  identity: z.object({ supplierId: nonempty, productId: nonempty, variant: fieldSchema(nonempty) }).strict(),
  sources: z.array(sourceSchema).min(1),
  engineering: z.object({ catalogueItemId: nonempty.nullable(), slot: slotSchema, measurements: z.record(nonempty, fieldSchema(measurementSchema)), attributes: z.record(nonempty, fieldSchema(nonempty)) }).strict(),
  offers: z.array(z.object({ listingId: nonempty, sourceId: nonempty }).strict()),
  packageContents: z.array(z.object({ slot: slotSchema, inclusion: fieldSchema(z.enum(['included', 'not-included'])), catalogueItemId: nonempty.optional() }).strict()),
  images: z.array(z.object({ locator: nonempty, sourceId: nonempty, usage: z.discriminatedUnion('state', [
    z.object({ state: z.literal('unknown'), reason: nonempty }).strict(),
    z.object({ state: z.literal('permitted'), basis: nonempty, evidenceSourceId: nonempty, attribution: z.string(), restrictions: z.string() }).strict()
  ]) }).strict()),
  extraction: z.object({ method: z.enum(['manual', 'ai']), confidence: z.number().finite().min(0).max(1).optional() }).strict(),
  fitQualification: z.literal('not-assessed')
}).strict();

/** Stable exact-variant key. Unknown/assumed variants cannot establish identity. */
export const supplierVariantKey = (identity: SupplierProductIdentity): string | null => identity.variant.state === 'recorded'
  ? JSON.stringify([identity.supplierId, identity.productId, identity.variant.value]) : null;

export const parseSupplierDraft = (input: unknown): SupplierDraft => {
  const draft = draftSchema.parse(input);
  const sources = new Map(draft.sources.map(source => [source.id, source]));
  if (sources.size !== draft.sources.length) throw new Error('Duplicate supplier evidence source IDs.');
  const fields: EvidenceField<unknown>[] = [draft.identity.variant, ...Object.values(draft.engineering.measurements), ...Object.values(draft.engineering.attributes), ...draft.packageContents.map(item => item.inclusion)];
  for (const field of fields) {
    const errors = evidenceFieldErrors(field, () => true);
    if (errors.length) throw new Error(errors.join(' '));
    if (field.state === 'recorded' && JSON.stringify(sources.get(field.source.id)) !== JSON.stringify(field.source)) throw new Error('Recorded field must reference its exact registered evidence source.');
  }
  for (const offer of draft.offers) if (!sources.has(offer.sourceId)) throw new Error('Offer evidence source is missing.');
  if (new Set(draft.offers.map(offer => offer.listingId)).size !== draft.offers.length) throw new Error('Duplicate offer reference.');
  if (new Set(draft.packageContents.map(item => item.slot)).size !== draft.packageContents.length) throw new Error('Duplicate package slot.');
  for (const image of draft.images) {
    if (!sources.has(image.sourceId) || (image.usage.state === 'permitted' && !sources.has(image.usage.evidenceSourceId))) throw new Error('Image evidence source is missing.');
  }
  const fixtureSourceCount = draft.sources.filter(source => source.kind === 'synthetic-fixture').length;
  if (fixtureSourceCount > 0 && fixtureSourceCount < draft.sources.length) throw new Error('Synthetic fixture sources cannot be mixed with real supplier evidence.');
  if (draft.syntheticFixture !== (fixtureSourceCount === draft.sources.length)) throw new Error('Synthetic fixture sources must be explicitly isolated from real supplier evidence.');
  if (draft.syntheticFixture && (!draft.id.startsWith('fixture-') || draft.sources.some(source => !source.locator.startsWith('fixture://')))) throw new Error('Synthetic fixtures require fixture IDs and locators.');
  return draft;
};
