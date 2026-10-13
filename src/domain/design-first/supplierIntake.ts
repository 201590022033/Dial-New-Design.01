import { z } from 'zod';
import type { SupplierListing } from '@/domain/catalogue/types';
import { parseAliExpressCapture, supplierListingFromCapture } from '@/domain/sourcing/aliexpressCapture';
import type { DesignPartSlot, EvidenceField, EvidenceSource } from './evidence';
import { parseSupplierDraft, SUPPLIER_DRAFT_SCHEMA, supplierVariantKey, type CanonicalMeasurement, type SupplierDraft } from './supplierDraft';

export interface SupplierIntakeCapture {
  readonly id: string;
  readonly sourceId: string;
  readonly capturedAt: string;
  readonly sourceText?: string;
  /** Quarantined capture data only, never a catalogue component or executable instructions. */
  readonly raw?: unknown;
}
export interface SupplierIntakeRecord {
  readonly draft: SupplierDraft;
  readonly offers: readonly SupplierListing[];
  readonly captures: readonly SupplierIntakeCapture[];
}
export interface SupplierIntakeOptions {
  readonly slot?: DesignPartSlot;
  readonly catalogueItemId?: string | null;
  readonly captureId?: string;
}
export type SupplierMeasurementUnit = 'mm' | 'cm' | 'in' | 'inch' | 'um' | 'µm' | 'deg';
export interface ManualSupplierIntakeInput {
  readonly supplierId: string;
  readonly productId: string;
  readonly variant?: string | null;
  readonly sourceUrl: string;
  readonly capturedAt: string;
  readonly slot: DesignPartSlot;
  readonly catalogueItemId?: string | null;
  readonly sourceText?: string;
  readonly measurements?: Readonly<Record<string, { readonly value: number; readonly unit: SupplierMeasurementUnit } | null>>;
  readonly attributes?: Readonly<Record<string, string | null>>;
  readonly imageLocators?: readonly string[];
  readonly unitPrice?: number | null;
  readonly currency?: string;
  readonly shippingPrice?: number | null;
  readonly shippingCurrency?: string;
}

const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const canonical = (value: unknown): string => JSON.stringify(value, (_key, entry: unknown) => object(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : entry);
const fingerprint = (value: unknown): string => {
  const content = canonical(value);
  let a = 0x811c9dc5, b = 0x9e3779b9;
  for (let index = 0; index < content.length; index++) {
    a = Math.imul(a ^ content.charCodeAt(index), 0x01000193) >>> 0;
    b = Math.imul(b ^ content.charCodeAt(index), 0x85ebca6b) >>> 0;
  }
  return `${content.length}-${a.toString(16)}-${b.toString(16)}`;
};
function assertSafeData(input: unknown): void {
  let count = 0;
  const ancestors = new WeakSet<object>();
  function inspect(value: unknown, depth: number): void {
    if (++count > 50000 || depth > 35) throw new Error('Supplier intake exceeds the supported data size or nesting depth.');
    if (!value || typeof value !== 'object') return;
    if (ancestors.has(value)) throw new Error('Supplier intake cannot contain circular data.');
    ancestors.add(value);
    for (const [key, child] of Object.entries(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('Unsafe supplier intake property.');
      inspect(child, depth + 1);
    }
    ancestors.delete(value);
  }
  inspect(input, 0);
}
const httpsLocator = (value: string): boolean => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
};
const nonempty = z.string().trim().min(1);
const date = z.iso.datetime({ offset: true });
const money = z.number().finite().nonnegative().nullable();
const currency = z.string().regex(/^[A-Z]{3}$/);
const captureSchema = z.object({ id: nonempty, sourceId: nonempty, capturedAt: date, sourceText: z.string().max(500000).optional(), raw: z.unknown().optional() }).strict();
const offerSchema = z.object({
  id: nonempty, catalogueItemId: nonempty, supplierName: nonempty, sku: nonempty.nullable().optional(),
  productUrl: nonempty.nullable().optional(), unitPrice: money, currency,
  shippingPrice: money.optional(), shippingCurrency: currency.nullable().optional(), shippingDestination: nonempty.nullable().optional(),
  stockStatus: z.enum(['in-stock', 'out-of-stock', 'backorder', 'unknown']), status: z.enum(['active', 'stale', 'discontinued']),
  verificationStatus: z.enum(['unverified', 'verified', 'disputed']), leadTimeDays: z.number().finite().nonnegative().nullable().optional(),
  lastCheckedIso: date.nullable().optional(),
  provenance: z.object({ dataSource: nonempty, sourceType: z.enum(['demo-fixture', 'manual-entry', 'supplier-api', 'web-scrape']), isDemonstrationFixture: z.boolean(), retrievedAtIso: date.nullable().optional() }).strict(),
  directOrderCapability: z.boolean().optional(), notes: z.string().optional(),
}).passthrough();

function downgradeDraft(input: unknown): SupplierDraft {
  if (!object(input)) return parseSupplierDraft(input);
  const downgrade = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(downgrade);
    if (!object(value)) return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key,
      key === 'review' && value.state === 'recorded' ? 'unreviewed' : downgrade(entry)]));
  };
  const unreviewed = downgrade(input) as Record<string, unknown>;
  return parseSupplierDraft({ ...unreviewed,
    status: object(input.extraction) && input.extraction.method === 'ai' ? 'ai-extracted' : 'draft', fitQualification: 'not-assessed' });
}

/** Boundary parser for queue data. This never registers products, accepts orders, or qualifies fit. */
export function parseSupplierIntake(input: unknown, options: SupplierIntakeOptions = {}): SupplierIntakeRecord {
  if (typeof input === 'string') {
    if (input.length > 2000000) throw new Error('Supplier import is too large.');
    input = JSON.parse(input) as unknown;
  }
  assertSafeData(input);
  if (object(input) && input.schema === 'dial-designer/aliexpress-capture/v1') {
    if (!options.slot) throw new Error('Choose a component slot for the AliExpress capture; no physical variant is selected automatically.');
    const capture = parseAliExpressCapture(input);
    const urlItem = new URL(capture.sourceUrl).pathname.match(/\/item\/(\d+)/)?.[1];
    if (!urlItem || urlItem !== capture.itemId) throw new Error('The captured product ID must match its AliExpress item URL.');
    const id = `intake-aliexpress-${fingerprint(capture)}`;
    const source: EvidenceSource = { id: `${id}-source`, kind: 'supplier-page', locator: capture.sourceUrl, capturedAt: capture.capturedAtIso };
    const variant: EvidenceField<string> = capture.variant?.trim() ? { state: 'recorded', value: capture.variant.trim(), source, review: 'unreviewed' }
      : { state: 'unknown', reason: 'No exact selected product variant was captured.' };
    const offers = options.catalogueItemId ? [{ ...supplierListingFromCapture(capture, options.catalogueItemId), id: `${id}-offer` }] : [];
    return parseSupplierIntake({ draft: {
      schema: SUPPLIER_DRAFT_SCHEMA, id, status: 'draft', syntheticFixture: false,
      identity: { supplierId: `aliexpress:seller-name:${capture.sellerName.trim()}`, productId: capture.itemId, variant },
      sources: [source], engineering: { catalogueItemId: options.catalogueItemId ?? null, slot: options.slot, measurements: unknownSupplierMeasurements(options.slot),
        attributes: { title: { state: 'recorded', value: capture.title, source, review: 'unreviewed' } } },
      offers: offers.map(offer => ({ listingId: offer.id, sourceId: source.id })), packageContents: [], images: [], extraction: { method: 'manual' }, fitQualification: 'not-assessed',
    }, offers, captures: [{ id: options.captureId ?? `${id}-capture`, sourceId: source.id, capturedAt: capture.capturedAtIso, raw: capture }] });
  }
  const envelope = object(input) && 'draft' in input ? input : { draft: input, offers: [], captures: [] };
  if (Object.keys(envelope).some(key => !['draft', 'offers', 'captures'].includes(key))) throw new Error('Unsupported supplier intake envelope property.');
  const draft = downgradeDraft(envelope.draft);
  const offers = z.array(offerSchema).parse(envelope.offers ?? []).map(offer => ({ ...offer, verificationStatus: 'unverified' as const, directOrderCapability: false })) as SupplierListing[];
  const captures = z.array(captureSchema).parse(envelope.captures ?? []);
  if (!captures.length) {
    const source = draft.sources[0]!;
    captures.push({ id: `import-${fingerprint(input)}`, sourceId: source.id, capturedAt: source.capturedAt, raw: input });
  }
  const sources = new Map(draft.sources.map(source => [source.id, source]));
  for (const source of draft.sources) if (source.kind === 'supplier-page' && !httpsLocator(source.locator)) throw new Error('Supplier pages must use an HTTPS source without credentials.');
  for (const image of draft.images) if (!(draft.syntheticFixture && image.locator.startsWith('fixture://')) && !httpsLocator(image.locator)) throw new Error('Unsafe image locator; use an HTTPS image source.');
  if (new Set(offers.map(offer => offer.id)).size !== offers.length) throw new Error('Duplicate offer snapshot IDs.');
  if (offers.length && draft.engineering.catalogueItemId === null) throw new Error('Unlinked drafts retain commercial captures, not fabricated catalogue-linked offers.');
  for (const offer of offers) {
    if (offer.catalogueItemId !== draft.engineering.catalogueItemId) throw new Error('Offer belongs to a different catalogue component.');
    if (!draft.offers.some(reference => reference.listingId === offer.id)) throw new Error('Offer snapshot has no draft evidence reference.');
    if (offer.productUrl && !(draft.syntheticFixture && offer.productUrl.startsWith('fixture://')) && !httpsLocator(offer.productUrl)) throw new Error('Unsafe supplier offer URL.');
    const source = sources.get(draft.offers.find(reference => reference.listingId === offer.id)!.sourceId)!;
    if (offer.provenance.dataSource !== source.locator || (offer.provenance.retrievedAtIso && offer.provenance.retrievedAtIso !== source.capturedAt) || (offer.lastCheckedIso && offer.lastCheckedIso !== source.capturedAt)) throw new Error('Commercial snapshot must reference its exact dated source.');
    if (offer.provenance.isDemonstrationFixture !== draft.syntheticFixture) throw new Error('Synthetic and real offer records cannot be mixed.');
  }
  if (draft.offers.some(reference => !offers.some(offer => offer.id === reference.listingId))) throw new Error('Draft offer references require matching commercial snapshots.');
  if (new Set(captures.map(capture => capture.id)).size !== captures.length) throw new Error('Duplicate raw capture IDs.');
  for (const capture of captures) {
    const source = sources.get(capture.sourceId);
    if (!source || source.capturedAt !== capture.capturedAt) throw new Error('Raw capture must identify its exact dated source.');
  }
  return { draft, offers, captures };
}

/** Known exact variants share a history; ambiguous variants only deduplicate byte-equivalent normalized records. */
export function supplierIntakeIdentity(record: SupplierIntakeRecord): string {
  const normalized = parseSupplierIntake(record);
  const genericSeller = normalized.draft.identity.supplierId === 'aliexpress:seller-name:AliExpress seller';
  const known = genericSeller ? null : supplierVariantKey(normalized.draft.identity);
  const namespace = normalized.draft.syntheticFixture ? 'fixture:' : 'real:';
  return known ? `${namespace}exact:${known}` : `${namespace}ambiguous:${canonical(normalized)}`;
}

export function convertSupplierMeasurement(value: number, unit: SupplierMeasurementUnit): CanonicalMeasurement {
  if (!Number.isFinite(value)) throw new Error('Measurement must be finite.');
  if (unit === 'deg') {
    if (value < 0 || value > 360) throw new Error('Angles must be between 0 and 360 degrees.');
    return { value, unit: 'deg' };
  }
  const factors: Record<Exclude<SupplierMeasurementUnit, 'deg'>, number> = { mm: 1, cm: 10, in: 25.4, inch: 25.4, um: .001, 'µm': .001 };
  const factor = factors[unit];
  if (!factor || value <= 0) throw new Error('Size measurements must be positive with a supported unit; zero is not unknown.');
  const mm = value * factor;
  if (!Number.isFinite(mm) || mm <= 0) throw new Error('Converted measurement is invalid.');
  const rounded = Math.round(mm * 1e9) / 1e9;
  if (rounded <= 0) throw new Error('Measurement is below the supported precision.');
  return { value: rounded, unit: 'mm' };
}

export function unknownSupplierMeasurements(slot: DesignPartSlot): Record<string, EvidenceField<CanonicalMeasurement>> {
  const keys: Record<DesignPartSlot, readonly string[]> = {
    case: ['caseDiameterMm', 'crystalSeatDiameterMm', 'dialSeatDiameterMm', 'lugWidthMm', 'movementCavityDiameterMm'],
    crystal: ['outerDiameterMm', 'thicknessMm'], caseback: ['mountingDiameterMm', 'thicknessMm'],
    crown: ['diameterMm', 'stemThreadDiameterMm', 'tubeInterfaceDiameterMm'], dial: ['outerDiameterMm', 'thicknessMm'],
    hands: ['colletDiameterMm', 'lengthMm', 'stackHeightMm'], 'chapter-ring': ['outerDiameterMm', 'innerDiameterMm', 'thicknessMm'],
    'inner-bezel': ['outerDiameterMm', 'innerDiameterMm', 'thicknessMm'], 'rotating-bezel': ['mountingInnerDiameterMm', 'mountingOuterDiameterMm', 'thicknessMm'], strap: ['widthMm']
  };
  if (!keys[slot]) throw new Error('Choose a supported component type.');
  return Object.fromEntries(keys[slot].map(key => [key, { state: 'unknown', reason: 'This source capture does not establish the measurement.' }]));
}

export function createManualSupplierIntake(input: ManualSupplierIntakeInput): SupplierIntakeRecord {
  assertSafeData(input);
  if (!httpsLocator(input.sourceUrl)) throw new Error('Enter an HTTPS source URL without credentials.');
  if ((input.unitPrice !== undefined || input.shippingPrice !== undefined) && !input.currency) throw new Error('Commercial amounts need an explicit currency.');
  const id = `intake-manual-${fingerprint(input)}`;
  const source: EvidenceSource = { id: `${id}-source`, kind: 'supplier-page', locator: input.sourceUrl, capturedAt: input.capturedAt };
  const recorded = <T>(value: T): EvidenceField<T> => ({ state: 'recorded', value, source, review: 'unreviewed' });
  const measurements = { ...unknownSupplierMeasurements(input.slot), ...Object.fromEntries(Object.entries(input.measurements ?? {}).map(([key, measurement]) => [key,
    measurement ? recorded(convertSupplierMeasurement(measurement.value, measurement.unit)) : { state: 'unknown', reason: 'Source does not establish this measurement.' }])) };
  const attributes = Object.fromEntries(Object.entries(input.attributes ?? {}).map(([key, value]) => [key,
    value?.trim() ? recorded(value.trim()) : { state: 'unknown', reason: 'Source does not establish this attribute.' }]));
  const offers: SupplierListing[] = input.catalogueItemId && input.unitPrice !== undefined ? [{
    id: `${id}-offer`, catalogueItemId: input.catalogueItemId, supplierName: input.supplierId,
    productUrl: input.sourceUrl, unitPrice: input.unitPrice, currency: input.currency?.toUpperCase() ?? '',
    shippingPrice: input.shippingPrice ?? null, shippingCurrency: (input.shippingCurrency ?? input.currency)?.toUpperCase(),
    stockStatus: 'unknown', status: 'active', verificationStatus: 'unverified', lastCheckedIso: input.capturedAt,
    provenance: { dataSource: input.sourceUrl, sourceType: 'manual-entry', isDemonstrationFixture: false, retrievedAtIso: input.capturedAt },
  }] : [];
  return parseSupplierIntake({ draft: { schema: SUPPLIER_DRAFT_SCHEMA, id, status: 'draft', syntheticFixture: false,
    identity: { supplierId: input.supplierId, productId: input.productId, variant: input.variant?.trim() ? recorded(input.variant.trim()) : { state: 'unknown', reason: 'Exact selected variant has not been specified.' } },
    sources: [source], engineering: { catalogueItemId: input.catalogueItemId ?? null, slot: input.slot, measurements, attributes },
    offers: offers.map(offer => ({ listingId: offer.id, sourceId: source.id })), packageContents: [],
    images: (input.imageLocators ?? []).map(locator => ({ locator, sourceId: source.id, usage: { state: 'unknown', reason: 'Image-use permission has not been established.' } })),
    extraction: { method: 'manual' }, fitQualification: 'not-assessed',
  }, offers, captures: [{ id: `${id}-capture`, sourceId: source.id, capturedAt: input.capturedAt,
    ...(input.sourceText !== undefined ? { sourceText: input.sourceText } : {}), raw: input }] });
}

export interface SupplierMeasurementSuggestion {
  readonly key: string;
  readonly value: number;
  readonly unit: 'mm' | 'deg';
  readonly sourceExcerpt: string;
}
/** Bounded text suggestions only, not an AI model or a fit decision. Users must confirm each suggestion. */
export function suggestSupplierMeasurements(sourceText: string): readonly SupplierMeasurementSuggestion[] {
  if (sourceText.length > 500000) throw new Error('Source text is too large.');
  const labels: Readonly<Record<string, string>> = { 'case diameter': 'caseDiameterMm', 'crystal seat diameter': 'crystalSeatDiameterMm',
    'dial diameter': 'dialDiameterMm', 'outer diameter': 'outerDiameterMm', 'inner diameter': 'innerDiameterMm',
    'lug width': 'lugWidthMm', thickness: 'thicknessMm' };
  const suggestions: SupplierMeasurementSuggestion[] = [];
  const pattern = /\b(crystal seat diameter|case diameter|dial diameter|outer diameter|inner diameter|lug width|thickness)\s*[:=]\s*(\d+(?:\.\d+)?)\s*(mm|cm|inch|in|um|µm)\b/gi;
  for (const match of sourceText.matchAll(pattern)) {
    const measurement = convertSupplierMeasurement(Number(match[2]), match[3]!.toLowerCase() as SupplierMeasurementUnit);
    suggestions.push({ key: labels[match[1]!.toLowerCase()]!, value: measurement.value, unit: measurement.unit, sourceExcerpt: match[0] });
  }
  return suggestions;
}
