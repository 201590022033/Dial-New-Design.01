import { describe, expect, it } from 'vitest';
import { parseSupplierDraft, supplierVariantKey } from '@/domain/design-first/supplierDraft';
import { supplierDraftFixtures } from '@/domain/design-first/supplierDraftFixtures';

const fixture = () => structuredClone(supplierDraftFixtures[0]!);
describe('DF0 supplier draft evidence transport', () => {
  it('round-trips explicit synthetic drafts without publishing catalogue records', () => {
    for (const draft of supplierDraftFixtures) {
      expect(parseSupplierDraft(JSON.parse(JSON.stringify(draft)))).toEqual(draft);
      expect(draft.syntheticFixture).toBe(true);
      expect(draft.engineering.catalogueItemId).toBeNull();
    }
  });
  it('distinguishes exact variants of one product while retaining multiple offer references', () => {
    const [steel, black] = supplierDraftFixtures;
    expect(steel!.identity.productId).toBe(black!.identity.productId);
    expect(supplierVariantKey(steel!.identity)).not.toBe(supplierVariantKey(black!.identity));
    expect(steel!.offers).toHaveLength(2);
    expect(steel!.engineering).not.toHaveProperty('unitPrice');
    expect(steel!.offers[0]).not.toHaveProperty('measurements');
  });
  it('does not invent exact variant identity from unknown or assumed selections', () => {
    const identity = fixture().identity;
    expect(supplierVariantKey({ ...identity, variant: { state: 'unknown', reason: 'No option selected.' } })).toBeNull();
    expect(supplierVariantKey({ ...identity, variant: { state: 'assumed', value: 'steel', reason: 'Photo appearance.' } })).toBeNull();
  });
  it('rejects zero dimensions and absent unknown reasons', () => {
    const draft = fixture();
    const measurements = { ...draft.engineering.measurements, crystalSeatDiameter: { state: 'recorded', value: { value: 0, unit: 'mm' }, source: draft.sources[0], review: 'unreviewed' } };
    expect(() => parseSupplierDraft({ ...draft, engineering: { ...draft.engineering, measurements } })).toThrow();
    expect(() => parseSupplierDraft({ ...draft, identity: { ...draft.identity, variant: { state: 'unknown', reason: '' } } })).toThrow();
  });
  it('cannot promote extraction confidence or draft review into fit qualification', () => {
    const draft = fixture();
    expect(parseSupplierDraft({ ...draft, status: 'reviewed', extraction: { method: 'ai', confidence: 1 } }).fitQualification).toBe('not-assessed');
    expect(() => parseSupplierDraft({ ...draft, fitQualification: 'verified' })).toThrow();
    expect(() => parseSupplierDraft({ ...draft, status: 'published' })).toThrow();
  });
  it('requires evidence for image permission and preserves unknown usage', () => {
    const draft = fixture();
    expect(parseSupplierDraft(draft).images[0]!.usage.state).toBe('unknown');
    const image = draft.images[0]!;
    const usage = { state: 'permitted', basis: 'Synthetic permission example', evidenceSourceId: draft.sources[0]!.id, attribution: '', restrictions: '' };
    expect(parseSupplierDraft({ ...draft, images: [{ ...image, usage }] }).images[0]!.usage.state).toBe('permitted');
    expect(() => parseSupplierDraft({ ...draft, images: [{ ...image, usage: { ...usage, evidenceSourceId: 'missing' } }] })).toThrow();
  });
  it('rejects unsupported versions, missing references and disguised fixtures', () => {
    const draft = fixture();
    expect(() => parseSupplierDraft({ ...draft, schema: 'dial-designer/supplier-draft/v2' })).toThrow();
    expect(() => parseSupplierDraft({ ...draft, offers: [{ listingId: 'fixture-offer', sourceId: 'missing' }] })).toThrow();
    expect(() => parseSupplierDraft({ ...draft, syntheticFixture: false })).toThrow();
    expect(() => parseSupplierDraft({ ...draft, id: 'real-supplier-case' })).toThrow();
  });
  it('rejects duplicate offers, package roles and conflicting source bodies', () => {
    const draft = fixture();
    expect(() => parseSupplierDraft({ ...draft, offers: [draft.offers[0], draft.offers[0]] })).toThrow();
    expect(() => parseSupplierDraft({ ...draft, packageContents: [draft.packageContents[0], draft.packageContents[0]] })).toThrow();
    const variant = draft.identity.variant;
    if (variant.state !== 'recorded') throw new Error('Fixture needs a recorded variant.');
    expect(() => parseSupplierDraft({ ...draft, identity: { ...draft.identity, variant: { ...variant, source: { ...variant.source, locator: 'fixture://different-source' } } } })).toThrow();
  });
  it('rejects mixed synthetic and real evidence regardless of the fixture flag', () => {
    const draft = fixture();
    const sources = [...draft.sources, { id: 'supplier-page-example', kind: 'supplier-page', locator: 'https://example.com/product', capturedAt: '2026-10-12T10:00:00+02:00' }];
    for (const syntheticFixture of [false, true]) {
      expect(() => parseSupplierDraft({ ...draft, syntheticFixture, sources })).toThrow('cannot be mixed');
    }
  });
});
