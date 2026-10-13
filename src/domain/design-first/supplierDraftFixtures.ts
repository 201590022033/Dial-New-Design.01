import type { EvidenceSource } from './evidence';
import { SUPPLIER_DRAFT_SCHEMA, type SupplierDraft } from './supplierDraft';

const source: EvidenceSource = {
  id: 'fixture-supplier-page', kind: 'synthetic-fixture',
  locator: 'fixture://supplier-draft/example-case', capturedAt: '2026-10-12T10:00:00+02:00'
};
/** Synthetic transport examples only: no real supplier, offer, image or fit claim. */
export const supplierDraftFixtures: readonly SupplierDraft[] = ['steel', 'black'].map(variant => ({
  schema: SUPPLIER_DRAFT_SCHEMA, id: `fixture-case-${variant}`, status: 'ai-extracted', syntheticFixture: true,
  identity: { supplierId: 'fixture-supplier', productId: 'fixture-case-40', variant: { state: 'recorded', value: variant, source, review: 'unreviewed' } },
  sources: [source],
  engineering: {
    catalogueItemId: null, slot: 'case',
    measurements: {
      caseDiameter: { state: 'recorded', value: { value: 40, unit: 'mm' }, source, review: 'unreviewed' },
      crystalSeatDiameter: { state: 'unknown', reason: 'Synthetic source omits the crystal seat measurement.' }
    },
    attributes: { finish: { state: 'recorded', value: variant, source, review: 'unreviewed' } }
  },
  offers: [{ listingId: `fixture-offer-${variant}-one`, sourceId: source.id }, { listingId: `fixture-offer-${variant}-two`, sourceId: source.id }],
  packageContents: [{ slot: 'crystal', inclusion: { state: 'unknown', reason: 'Package contents are not specified in the synthetic source.' } }],
  images: [{ locator: `fixture://images/case-${variant}`, sourceId: source.id, usage: { state: 'unknown', reason: 'No image-use permission recorded.' } }],
  extraction: { method: 'ai', confidence: 0.99 }, fitQualification: 'not-assessed'
}));
