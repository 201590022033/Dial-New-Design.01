import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseSupplierIntake, supplierIntakeIdentity } from '@/domain/design-first/supplierIntake';
import { supplierVariantKey } from '@/domain/design-first/supplierDraft';

const load = (name: string): unknown => JSON.parse(readFileSync(new URL(`../../docs/examples/df6-${name}-supplier-intake.json`, import.meta.url), 'utf8'));
const namoki = () => parseSupplierIntake(load('namoki-nmk931-steel'));
const seikomods = () => parseSupplierIntake(load('seikomods-ct728-oyster'));
const raw = (record: ReturnType<typeof parseSupplierIntake>) => record.captures[0]!.raw as Record<string, unknown>;

describe('DF6 official supplier pilot import records', () => {
  it.each(['namoki-nmk931-steel', 'seikomods-ct728-oyster'])('imports %s as an unlinked unreviewed research record', name => {
    const input = load(name);
    const record = parseSupplierIntake(input);
    expect(record.draft.status).toBe('draft');
    expect(record.draft.syntheticFixture).toBe(false);
    expect(record.draft.engineering.catalogueItemId).toBeNull();
    expect(record.draft.fitQualification).toBe('not-assessed');
    expect(record.offers).toEqual([]);
    expect(record.draft.offers).toEqual([]);
    expect(parseSupplierIntake(JSON.parse(JSON.stringify(record)))).toEqual(record);
    expect(supplierIntakeIdentity(parseSupplierIntake(input))).toBe(supplierIntakeIdentity(record));
    for (const field of [record.draft.identity.variant, ...Object.values(record.draft.engineering.measurements), ...Object.values(record.draft.engineering.attributes), ...record.draft.packageContents.map(item => item.inclusion)]) {
      if (field.state === 'recorded') expect(field.review).toBe('unreviewed');
    }
  });
  it('records outside diameter without substituting it for missing mating interfaces', () => {
    expect(namoki().draft.engineering.measurements.caseDiameterMm).toMatchObject({ state: 'recorded', value: { value: 38, unit: 'mm' } });
    expect(seikomods().draft.engineering.measurements.caseDiameterMm).toMatchObject({ state: 'recorded', value: { value: 39.5, unit: 'mm' } });
    for (const record of [namoki(), seikomods()]) {
      for (const key of ['crystalSeatDiameterMm', 'dialSeatDiameterMm', 'movementCavityDiameterMm', 'stemHeightMm', 'crownTubeThreadPitchMm', 'casebackThreadPitchMm']) {
        expect(record.draft.engineering.measurements[key]).toMatchObject({ state: 'unknown' });
      }
    }
  });
  it('distinguishes known package contents from unknown inclusion and separate purchases', () => {
    const n = namoki().draft.packageContents;
    expect(n.find(item => item.slot === 'crystal')!.inclusion).toMatchObject({ state: 'recorded', value: 'included' });
    expect(n.find(item => item.slot === 'caseback')!.inclusion.state).toBe('unknown');
    const c = seikomods().draft.packageContents;
    expect(c.find(item => item.slot === 'caseback')!.inclusion).toMatchObject({ state: 'recorded', value: 'included' });
    expect(c.find(item => item.slot === 'crystal')!.inclusion).toMatchObject({ state: 'recorded', value: 'not-included' });
  });
  it('retains exact dated commercial snapshots without promoting a headline price to an offer', () => {
    expect(raw(namoki())).toMatchObject({ supplierId: 'namokimods.com', productId: 'NMK931', unitPrice: null, currency: 'SGD', shippingPrice: null, stockStatus: 'unknown' });
    expect(raw(seikomods())).toMatchObject({ supplierId: 'seikomods.com', productId: 'CT728', sku: 'CT728OYSTER', unitPrice: 69, currency: 'GBP', shippingPrice: null, stockStatus: 'in-stock' });
    for (const record of [namoki(), seikomods()]) {
      const source = record.draft.sources[0]!;
      expect(raw(record).sourceUrl).toBe(source.locator);
      expect(raw(record).capturedAt).toBe(source.capturedAt);
      expect(record.captures[0]!.capturedAt).toBe(source.capturedAt);
      expect(source.capturedAt.startsWith('2026-10-13T')).toBe(true);
      expect(source.kind).toBe('supplier-page');
    }
  });
  it('keeps observed Oyster and President variant identities distinct', () => {
    const record = seikomods();
    const alternative = raw(record).otherVariantObservation as { label: string; sku: string; variationId: number };
    expect(alternative).toMatchObject({ label: 'With President Bracelet', sku: 'CT728PRESIDENT', variationId: 618365 });
    const source = record.draft.sources[0]!;
    expect(supplierVariantKey(record.draft.identity)).not.toBe(supplierVariantKey({ ...record.draft.identity, variant: {
      state: 'recorded', value: `${alternative.label} / ${alternative.sku} / variation ${alternative.variationId}`, source, review: 'unreviewed'
    } }));
  });
  it('contains only a remote image reference with unknown publication permission', () => {
    expect(namoki().draft.images).toEqual([]);
    const images = seikomods().draft.images;
    expect(images).toHaveLength(1);
    expect(images[0]!.locator).toBe('https://www.seikomods.com/wp-content/uploads/2025/11/ct728-2.jpg');
    expect(images[0]!.usage.state).toBe('unknown');
    expect(JSON.stringify(images)).not.toContain('data:image');
  });
});
