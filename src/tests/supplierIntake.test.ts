import { describe, expect, it } from 'vitest';
import { createManualSupplierIntake, parseSupplierIntake, supplierIntakeIdentity, convertSupplierMeasurement, suggestSupplierMeasurements } from '@/domain/design-first/supplierIntake';

export const manualCapture = (variant: string | null = 'steel') => createManualSupplierIntake({ supplierId: 'Test supplier', productId: 'Case-40', variant, sourceUrl: 'https://example.com/products/case-40', capturedAt: '2026-10-13T00:00:00+02:00', slot: 'case', sourceText: 'case diameter: 4 cm', measurements: { caseDiameterMm: { value: 4, unit: 'cm' } } });
const ali = { schema: 'dial-designer/aliexpress-capture/v1', source: 'aliexpress', sourceUrl: 'https://www.aliexpress.com/item/100500123456.html', itemId: '100500123456', sellerName: 'Test store', title: 'Case', variant: 'steel', destination: 'South Africa', itemPrice: { amount: 20, currency: 'USD' }, shipping: null, capturedAtIso: '2026-10-13T00:00:00+02:00' };
describe('supplier intake boundary', () => {
  it('retains source and explicit unknown interfaces without inventing catalogue records or prices', () => {
    const record = manualCapture();
    expect(record.draft.engineering.measurements.caseDiameterMm).toMatchObject({ state: 'recorded', value: { value: 40, unit: 'mm' }, review: 'unreviewed' });
    expect(record.draft.engineering.measurements.crystalSeatDiameterMm).toMatchObject({ state: 'unknown' });
    expect(record.draft.engineering.catalogueItemId).toBeNull();
    expect(record.offers).toEqual([]);
    expect(record.captures[0]?.sourceText).toBe('case diameter: 4 cm');
  });
  it('separates exact variants and seller identities, while unknown variants deduplicate only identical captures', () => {
    expect(supplierIntakeIdentity(manualCapture('steel'))).not.toBe(supplierIntakeIdentity(manualCapture('black')));
    const unknown = manualCapture(null);
    expect(supplierIntakeIdentity(unknown)).toBe(supplierIntakeIdentity(structuredClone(unknown)));
    const changed = createManualSupplierIntake({ ...(unknown.captures[0]!.raw as Parameters<typeof createManualSupplierIntake>[0]), sourceText: 'Different capture' });
    expect(supplierIntakeIdentity(changed)).not.toBe(supplierIntakeIdentity(unknown));
    expect(supplierIntakeIdentity(parseSupplierIntake(ali,{slot:'case'}))).not.toBe(supplierIntakeIdentity(parseSupplierIntake({...ali,sellerName:'Other store'},{slot:'case'})));
  });
  it('reuses AliExpress commercial captures and keeps shipping unknown separately', () => {
    const record = parseSupplierIntake(ali, { slot: 'case', catalogueItemId: 'cat-test-case' });
    expect(record.offers[0]).toMatchObject({ unitPrice: 20, currency: 'USD', shippingPrice: null, verificationStatus: 'unverified', directOrderCapability: false });
    expect(record.captures[0]?.raw).toMatchObject({ itemId: ali.itemId });
    expect(record.draft.engineering.measurements.crystalSeatDiameterMm?.state).toBe('unknown');
    expect(parseSupplierIntake(ali, { slot: 'case' }).offers).toEqual([]);
    expect(() => parseSupplierIntake(ali)).toThrow(/component slot/);
  });
  it('rejects mismatched product URLs, unsafe sources, wrong offer associations and spoofed dated evidence', () => {
    expect(() => parseSupplierIntake({...ali,itemId:'other'}, {slot:'case'})).toThrow(/product ID/);
    expect(() => parseSupplierIntake({...ali,sourceUrl:'https://aliexpress.com.evil.test/item/100500123456.html'}, {slot:'case'})).toThrow();
    const linked = parseSupplierIntake(ali,{slot:'case',catalogueItemId:'cat-test-case'});
    expect(() => parseSupplierIntake({...linked, offers: linked.offers.map(offer => ({...offer,catalogueItemId:'different'}))})).toThrow(/different catalogue/);
    expect(() => parseSupplierIntake({...linked, offers: linked.offers.map(offer => ({...offer,provenance:{...offer.provenance,dataSource:'https://example.com/other'}}))})).toThrow(/exact dated source/);
  });
  it('quarantines AI extraction and review claims, preserving imported raw evidence', () => {
    const record = manualCapture();
    const draft = {...record.draft,status:'reviewed',fitQualification:'verified',extraction:{method:'ai',confidence:1}};
    const result = parseSupplierIntake(draft);
    expect(result.draft).toMatchObject({status:'ai-extracted',fitQualification:'not-assessed'});
    expect(result.draft.identity.variant).toMatchObject({review:'unreviewed'});
    expect(result.captures[0]?.raw).toMatchObject({fitQualification:'verified'});
    expect(parseSupplierIntake(JSON.stringify(result))).toEqual(result);
  });
  it('converts source units, rejects zero/invalid precision, and proposes only explicitly labelled measurements', () => {
    expect(convertSupplierMeasurement(1,'in')).toEqual({value:25.4,unit:'mm'});
    for (const value of [0,-1,Infinity,1e-20]) expect(() => convertSupplierMeasurement(value,'mm')).toThrow();
    expect(suggestSupplierMeasurements('case diameter: 4 cm; crystal seat diameter: 31.5 mm; 99 mm in prose')).toEqual([{key:'caseDiameterMm',value:40,unit:'mm',sourceExcerpt:'case diameter: 4 cm'},{key:'crystalSeatDiameterMm',value:31.5,unit:'mm',sourceExcerpt:'crystal seat diameter: 31.5 mm'}]);
  });
  it('does not use generic marketplace seller identity to merge different captures', () => {
    const first = parseSupplierIntake({...ali,sellerName:'AliExpress seller'},{slot:'case'});
    const second = parseSupplierIntake({...ali,sellerName:'AliExpress seller',capturedAtIso:'2026-10-13T00:01:00+02:00'},{slot:'case'});
    expect(supplierIntakeIdentity(first)).not.toBe(supplierIntakeIdentity(second));
  });
  it('requires snapshot bodies for referenced offers and rejects unsafe object keys', () => {
    const record = manualCapture();
    expect(() => parseSupplierIntake({...record.draft,offers:[{listingId:'missing',sourceId:record.draft.sources[0]!.id}]})).toThrow(/snapshots/);
    expect(() => parseSupplierIntake('{"__proto__":{}}')).toThrow(/Unsafe/);
  });
});
