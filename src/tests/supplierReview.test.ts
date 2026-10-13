import { describe, expect, it } from 'vitest';
import { createManualSupplierIntake, parseSupplierIntake, type SupplierIntakeRecord } from '@/domain/design-first/supplierIntake';
import { supplierDraftFixtures } from '@/domain/design-first/supplierDraftFixtures';
import { assertSupplierReviewEvent, createSupplierReviewEvent, projectSupplierReview, publishSupplierReview, supplierCommercialReviewDetails, supplierCorrectionIdentityCompatible, supplierReviewFields, validateSupplierReviewEvent } from '@/domain/design-first/supplierReview';
import { componentFitEvidenceErrors } from '@/domain/design-first/componentFitEvidence';
import { caseConstraintErrors } from '@/domain/design-first/caseConstraints';

function record(slot: 'crystal' | 'case' | 'hands' | 'crown' = 'crystal'): SupplierIntakeRecord {
  return createManualSupplierIntake({ supplierId: 'Test-only supplier', productId: 'test-product', variant: '31 mm steel',
    sourceUrl: 'https://example.test/product', capturedAt: '2026-10-12T10:00:00+02:00', slot,
    catalogueItemId: 'cat-existing-linked-only', measurements: { outerDiameterMm: { value: 31, unit: 'mm' }, thicknessMm: { value: 1.8, unit: 'mm' } },
    attributes: { title: 'Test-only captured crystal', material: 'sapphire' }, unitPrice: 0, currency: 'USD', shippingPrice: null,
    imageLocators: ['https://example.test/image.jpg'], sourceText: 'Test-only supplier source; no real product claim.' });
}
const review = (input = record(), reviewedPaths = ['identity.variant', 'engineering.measurements.outerDiameterMm', 'engineering.measurements.thicknessMm']) => createSupplierReviewEvent({
  entryId: 'test-entry', revisionId: 'test-revision', record: input, action: 'approve', reviewer: 'Test reviewer',
  reason: 'Checked these exact transcriptions against the captured test source.', reviewedPaths, reviewedAt: '2026-10-13T10:00:00+02:00',
});

describe('DF6 supplier review and isolated publication', () => {
  it('binds deterministic review events to exact revision content and paths', () => {
    const input = record();
    const event = review(input);
    expect(review(input)).toEqual(event);
    expect(() => assertSupplierReviewEvent(input, event)).not.toThrow();
    for (const changed of [{ ...event, revisionId: 'another-revision' }, { ...event, reviewer: 'Someone else' },
      { ...event, reviewedPaths: ['identity.variant'] }, { ...event, id: 'invented' }]) {
      expect(() => validateSupplierReviewEvent(input, changed)).toThrow();
    }
    const edited = { ...input, captures: input.captures.map(capture => ({ ...capture, sourceText: 'Different source content' })) };
    expect(() => validateSupplierReviewEvent(edited, event)).toThrow('different supplier revision');
    const spaced = createSupplierReviewEvent({ ...event, record: input, reviewer: '  Test reviewer  ', reason: ` ${event.reason} ` });
    expect(() => assertSupplierReviewEvent(input, spaced)).not.toThrow();
  });

  it('requires reviewer/reason, recorded exact variant and a recorded measurement or attribute', () => {
    const input = record();
    expect(() => review(input, ['identity.variant'])).toThrow('at least one');
    const unknown = parseSupplierIntake({ ...input, draft: { ...input.draft, identity: { ...input.draft.identity,
      variant: { state: 'unknown', reason: 'Variant not selected.' } } } });
    expect(() => review(unknown)).toThrow('Only recorded');
    expect(() => createSupplierReviewEvent({ ...review(input), record: input, reviewer: '' })).toThrow();
    expect(() => createSupplierReviewEvent({ ...review(input), record: input, reason: '' })).toThrow();
  });

  it('does not promote unknowns, assumptions, AI confidence or unselected fields', () => {
    const input = record();
    const partial = review(input, ['identity.variant', 'engineering.measurements.outerDiameterMm']);
    const projected = projectSupplierReview(input, partial);
    expect(projected.engineering.measurements.outerDiameterMm).toMatchObject({ state: 'recorded', review: 'reviewed' });
    expect(projected.engineering.measurements.thicknessMm).toMatchObject({ state: 'recorded', review: 'unreviewed' });
    expect(projected.fitQualification).toBe('not-assessed');
    const publication = publishSupplierReview(input, partial);
    expect(publication.component.researchOnly).toBe(true);
    expect(publication.component.nominalDimensions.thicknessMm).toBe(0);
    const assumed = parseSupplierIntake({ ...input, draft: { ...input.draft, extraction: { method: 'ai', confidence: 1 },
      engineering: { ...input.draft.engineering, measurements: { ...input.draft.engineering.measurements,
        outerDiameterMm: { state: 'assumed', value: { value: 31, unit: 'mm' }, reason: 'AI guessed it.' } } } } });
    expect(() => review(assumed)).toThrow('Only recorded');
  });

  it('keeps declined reviews unqualified and refuses publication', () => {
    const input = record();
    const event = createSupplierReviewEvent({ ...review(input), record: input, action: 'reject', reviewedPaths: [] });
    expect(projectSupplierReview(input, event).status).toBe('draft');
    expect(() => publishSupplierReview(input, event)).toThrow('declined');
  });

  it('creates new stable exact-variant catalogue and offer identities without overwriting the associated item', () => {
    const input = record();
    const before = JSON.stringify(input);
    const paths = ['identity.variant', 'engineering.measurements.outerDiameterMm', 'engineering.measurements.thicknessMm', `offers.${input.offers[0]!.id}`];
    const first = publishSupplierReview(input, review(input, paths));
    const second = publishSupplierReview(input, review(input, paths));
    expect(first).toEqual(second);
    expect(first.component.id).not.toBe('cat-existing-linked-only');
    expect(first.component.status).toBe('published');
    expect(first.component.researchOnly).toBe(false);
    expect(first.component.exportEnabled).toBe(false);
    expect(componentFitEvidenceErrors(first.component.fitEvidence, first.component.id)).toEqual([]);
    expect(first.offers[0]).toMatchObject({ catalogueItemId: first.component.id, unitPrice: 0, shippingPrice: null,
      verificationStatus: 'unverified', directOrderCapability: false, lastCheckedIso: '2026-10-12T10:00:00+02:00', stockStatus: 'unknown' });
    expect(first.provenance.associatedCatalogueItemId).toBe('cat-existing-linked-only');
    expect(JSON.stringify(input)).toBe(before);
  });

  it('refuses synthetic fixtures and ambiguous marketplace seller identity for publication', () => {
    const fixture = parseSupplierIntake({ draft: { ...supplierDraftFixtures[0]!, offers: [] }, offers: [], captures: [] });
    const event = review(fixture, ['identity.variant', 'engineering.measurements.caseDiameter']);
    expect(() => publishSupplierReview(fixture, event)).toThrow('Synthetic');
    const input = record();
    const ambiguous = parseSupplierIntake({ ...input, draft: { ...input.draft, identity: { ...input.draft.identity, supplierId: 'aliexpress:seller-name:AliExpress seller' } } });
    expect(() => publishSupplierReview(ambiguous, review(ambiguous))).toThrow('identified supplier');
  });

  it.each(['case', 'hands', 'crown'] as const)('keeps %s unsupported installation boundaries research-only', slot => {
    const input = record(slot);
    const publication = publishSupplierReview(input, review(input));
    expect(publication.component.researchOnly).toBe(true);
    expect(publication.component.crownSpecification).toBeUndefined();
    if (slot === 'case') {
      expect(caseConstraintErrors(publication.component.caseConstraints)).toEqual([]);
      expect(publication.component.caseConstraints?.interfaces.crystalSeatDiameterMm.state).toBe('unknown');
      expect(publication.component.caseConstraints?.hardware.crystal.inclusion.state).toBe('unknown');
    }
  });

  it('publishes images only after documented permission and its exact evidence source are reviewed', () => {
    const input = record();
    expect(publishSupplierReview(input, review(input)).images).toEqual([]);
    expect(supplierReviewFields(input).find(field => field.kind === 'image-usage')?.eligible).toBe(false);
    const source = input.draft.sources[0]!;
    const licensed = parseSupplierIntake({ ...input, draft: { ...input.draft, images: input.draft.images.map(image => ({ ...image,
      usage: { state: 'permitted', basis: 'Test-only documented licence', evidenceSourceId: source.id, attribution: 'Test author', restrictions: 'Test use only' } })) } });
    expect(() => review(licensed, ['identity.variant', 'engineering.attributes.title', 'images.0.usage'])).toThrow('evidence source');
    const event = review(licensed, ['identity.variant', 'engineering.attributes.title', 'images.0.usage', `sources.${source.id}`]);
    expect(publishSupplierReview(licensed, event).images).toHaveLength(1);
  });

  it('projects unlinked dated raw commerce only after explicit commercial review', () => {
    const input = createManualSupplierIntake({ supplierId: 'Test supplier', productId: 'product', variant: 'exactvariant',
      sourceUrl: 'https://example.test/raw-commercial', capturedAt: '2026-10-12T10:00:00+02:00', slot: 'case',
      measurements: { caseDiameterMm: { value: 40, unit: 'mm' } }, unitPrice: null, currency: 'SGD', shippingPrice: null });
    expect(input.offers).toEqual([]);
    const path = `captures.${input.captures[0]!.id}.commercial`;
    expect(supplierReviewFields(input).find(field => field.path === path)?.eligible).toBe(true);
    expect(supplierCommercialReviewDetails(input, path)).toMatchObject({ unitPrice: null, currency: 'SGD', shippingPrice: null, stockStatus: 'unknown' });
    const paths = ['identity.variant', 'engineering.measurements.caseDiameterMm'];
    expect(publishSupplierReview(input, review(input, paths)).offers).toEqual([]);
    const publication = publishSupplierReview(input, review(input, [...paths, path]));
    expect(publication.component.nominalDimensions.diameterMm).toBe(40);
    expect(publication.component.caseConstraints?.outerDiameterMm).toMatchObject({ state: 'recorded', value: 40, review: 'reviewed' });
    expect(publication.component.caseConstraints?.interfaces.crystalSeatDiameterMm.state).toBe('unknown');
    expect(publication.offers[0]).toMatchObject({ catalogueItemId: publication.component.id, unitPrice: null, shippingPrice: null, currency: 'SGD',
      verificationStatus: 'unverified', directOrderCapability: false });
  });

  it('allows ambiguous identity correction but refuses rewriting an established product or variant', () => {
    const base = record();
    const unknown = parseSupplierIntake({ ...base, draft: { ...base.draft, identity: { ...base.draft.identity, variant: { state: 'unknown', reason: 'Not selected.' } } } });
    expect(supplierCorrectionIdentityCompatible(unknown, base)).toBe(true);
    expect(supplierCorrectionIdentityCompatible(base, unknown)).toBe(false);
    const different = parseSupplierIntake({ ...base, draft: { ...base.draft, identity: { ...base.draft.identity, productId: 'different-product' } } });
    expect(supplierCorrectionIdentityCompatible(base, different)).toBe(false);
  });

  it('refuses conflicting exterior aliases without inferring case seats', () => {
    const input = record('case');
    const conflicting = parseSupplierIntake({ ...input, draft: { ...input.draft, engineering: { ...input.draft.engineering,
      measurements: { ...input.draft.engineering.measurements, caseDiameterMm: {
        state: 'recorded', value: { value: 42, unit: 'mm' }, review: 'unreviewed', source: input.draft.sources[0]!,
      } } } } });
    expect(() => publishSupplierReview(conflicting, review(conflicting))).toThrow('exterior measurements conflict');
  });

  it('does not treat arbitrary raw extras or wrong product captures as recognized commerce', () => {
    const input = record();
    const capture = input.captures[0]!;
    const altered = parseSupplierIntake({ ...input, captures: [{ ...capture, raw: { supplierId: 'another-product', unitPrice: 1, currency: 'USD' } }] });
    const path = `captures.${capture.id}.commercial`;
    expect(supplierCommercialReviewDetails(altered, path)).toBeUndefined();
    expect(supplierReviewFields(altered).find(field => field.path === path)?.eligible).toBe(false);
    expect(() => review(altered, ['identity.variant', 'engineering.attributes.title', path])).toThrow('Only recorded');
  });
});
