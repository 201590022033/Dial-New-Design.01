import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { listCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import type { SupplierListing } from '@/domain/catalogue/types';
import { captureDesignBrief, designPartSlot } from '@/domain/design-first/designBriefExtraction';
import { defaultDesignIntent } from '@/domain/design-first/designIntent';
import { searchDesignParts } from '@/domain/design-first/searchDesignParts';

const fixtures = (targetId = 'inst-dial-blank') => {
  const assembly = createDefaultWatchAssembly();
  const items = structuredClone(listCatalogueItems());
  const intent = defaultDesignIntent();
  const brief = captureDesignBrief(assembly, targetId, items, intent);
  const supplierListings: SupplierListing[] = ['fixture-offer-b', 'fixture-offer-a', 'fixture-unrelated'].map(id => ({
    id, catalogueItemId: id === 'fixture-unrelated' ? 'fixture-other-component' : brief.target.catalogueItemId,
    supplierName: 'Synthetic test supplier', unitPrice: null, currency: 'USD', stockStatus: 'unknown', status: 'active', verificationStatus: 'unverified',
    provenance: { dataSource: `fixture://${id}`, sourceType: 'demo-fixture', isDemonstrationFixture: true }
  }));
  return { assembly, items, brief, intent, supplierListings };
};
const freeze = <T,>(value: T): T => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};

describe('DF3 read-only local parts search orchestration', () => {
  it('searches only supported same-slot components and retains the current component', () => {
    const options = fixtures();
    const results = searchDesignParts(options);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(result => result.catalogueItemId === options.brief.target.catalogueItemId)).toBe(true);
    for (const result of results) expect(designPartSlot(options.items.find(item => item.id === result.catalogueItemId)!)).toBe('dial');
    expect(new Set(results.map(result => result.catalogueItemId)).size).toBe(results.length);
  });
  it('does not confuse casebacks with cases merely because they share a category', () => {
    const options = fixtures('inst-midcase');
    const results = searchDesignParts(options);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(result => designPartSlot(options.items.find(item => item.id === result.catalogueItemId)!) === 'case')).toBe(true);
    const casebackIds = options.items.filter(item => item.kind === 'caseback').map(item => item.id);
    expect(results.some(result => casebackIds.includes(result.catalogueItemId))).toBe(false);
  });
  it('accepts frozen inputs without mutating assembly, catalogue, brief or sourcing', () => {
    const options = fixtures();
    const before = JSON.stringify(options);
    freeze(options);
    expect(searchDesignParts(options).length).toBeGreaterThan(0);
    expect(JSON.stringify(options)).toBe(before);
  });
  it('rejects stale geometry, current intent and catalogue content', () => {
    const baseline = fixtures();
    const geometry = structuredClone(baseline);
    geometry.assembly.parts['inst-dial-blank']!.dimensions.diameterMm += 1;
    expect(() => searchDesignParts(geometry)).toThrow('fresh search brief');
    expect(() => searchDesignParts({ ...baseline, intent: { ...baseline.intent, styleNotes: 'New creative direction' } })).toThrow('fresh search brief');
    const catalogue = structuredClone(baseline);
    catalogue.items[0]!.metadata.revision += '-changed';
    expect(() => searchDesignParts(catalogue)).toThrow('fresh search brief');
  });
  it('rejects changed target references and forged target slot/mode', () => {
    const options = fixtures();
    expect(() => searchDesignParts({ ...options, brief: { ...options.brief, target: { ...options.brief.target, catalogueItemId: 'not-a-current-component' } } })).toThrow('fresh search brief');
    expect(() => searchDesignParts({ ...options, brief: { ...options.brief, target: { ...options.brief.target, slot: 'caseback' } } })).toThrow('supported catalogue slot');
    expect(() => searchDesignParts({ ...options, brief: { ...options.brief, mode: 'selected-case' } })).toThrow();
  });
  it('rejects edited brief content even when its old assembly token is retained', () => {
    const options = fixtures();
    const tamperedBriefs = [
      { ...options.brief, desiredDimensions: { ...options.brief.desiredDimensions, diameterMm: { state: 'assumed' as const, value: 99, reason: 'Tampered dimension.' } } },
      { ...options.brief, permissions: { ...options.brief.permissions, preserve: [], allowChanges: ['target.dimensions.diameterMm'] } },
      { ...options.brief, permissions: { ...options.brief.permissions, lockedPartIds: ['inst-dial-blank'] } },
      { ...options.brief, stylePreferences: { ...options.brief.stylePreferences, styleNotes: 'Tampered notes.' } }
    ];
    for (const brief of tamperedBriefs) expect(() => searchDesignParts({ ...options, brief })).toThrow('fresh search brief');
  });
  it('accepts equivalent brief objects with different property order', () => {
    const options = fixtures();
    const brief = Object.fromEntries(Object.entries(options.brief).reverse()) as typeof options.brief;
    expect(searchDesignParts({ ...options, brief })).toEqual(searchDesignParts(options));
  });
  it('is deterministic across catalogue and offer reordering', () => {
    const options = fixtures();
    expect(searchDesignParts({ ...options, items: [...options.items].reverse(), supplierListings: [...options.supplierListings].reverse() })).toEqual(searchDesignParts(options));
  });
  it('keeps distinct actual offer references sorted under one engineering result', () => {
    const options = fixtures();
    const matches = searchDesignParts(options).filter(result => result.catalogueItemId === options.brief.target.catalogueItemId);
    expect(matches).toHaveLength(1);
    expect(matches[0]!.supplierListingIds).toEqual(['fixture-offer-a', 'fixture-offer-b']);
    expect(matches[0]!.group).not.toBe('fits-recorded-dimensions');
  });
  it('rejects duplicate catalogue and offer IDs instead of returning ambiguous results', () => {
    const options = fixtures();
    expect(() => searchDesignParts({ ...options, items: [...options.items, options.items[0]!] })).toThrow('duplicate ID');
    const listing: SupplierListing = { id: 'fixture-offer', catalogueItemId: options.brief.target.catalogueItemId, supplierName: 'Synthetic test supplier', unitPrice: null, currency: 'USD', stockStatus: 'unknown', status: 'active', verificationStatus: 'unverified', provenance: { dataSource: 'fixture://offer', sourceType: 'demo-fixture', isDemonstrationFixture: true } };
    expect(() => searchDesignParts({ ...options, supplierListings: [listing, listing] })).toThrow('duplicate ID');
  });
  it('does not equate published catalogue status with verified mechanical fit', () => {
    const options = fixtures();
    const items = options.items.map(item => ({ ...item, status: 'published' as const }));
    const brief = captureDesignBrief(options.assembly, options.brief.target.partInstanceId, items, options.intent);
    const results = searchDesignParts({ ...options, items, brief });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(result => result.group === 'fits-recorded-dimensions')).toBe(false);
  });
});
