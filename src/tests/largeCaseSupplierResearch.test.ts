import { describe, expect, it } from 'vitest';
import { catalogueItemById } from '@/domain/catalogue/catalogueRegistry';
import { PRICING_SNAPSHOT, listingPriceZar } from '@/domain/catalogue/pricing';
import { researchedSupplierListings } from '@/domain/catalogue/researchedSupplierListings';

const addedCaseIds = [
  'cat-case-tandorio-pilot-40',
  'cat-case-namoki-nmk920-tuna-47',
  'cat-case-feiyashi-samurai-438',
  'cat-case-tandorio-bronze-diver-44',
  'cat-case-wr-skx-sandblasted-42',
  'cat-case-tandorio-willard-41'
] as const;

describe('large diver, pilot and chronograph case research', () => {
  it('adds a compact set of selectable provisional case families', () => {
    for (const id of addedCaseIds) {
      const item = catalogueItemById.get(id);
      expect(item, id).toBeDefined();
      expect(item?.category).toBe('case');
      expect(item?.visual).toMatchObject({ representation: 'procedural', status: 'provisional' });
      expect(item?.exportEnabled).toBe(false);
    }
  });

  it('uses the dimensions from the exact seller drawings', () => {
    expect(catalogueItemById.get('cat-case-tandorio-pilot-40')?.nominalDimensions).toMatchObject({ diameterMm: 40.2, thicknessMm: 12.3 });
    expect(catalogueItemById.get('cat-case-feiyashi-samurai-438')?.nominalDimensions).toMatchObject({ diameterMm: 43.8, thicknessMm: 13.65 });
    expect(catalogueItemById.get('cat-case-namoki-nmk920-tuna-47')?.nominalDimensions).toMatchObject({ diameterMm: 47, thicknessMm: 11.3 });
  });

  it('requires an exact product-linked dimension drawing for every selectable researched case', () => {
    const researchedCases = researchedSupplierListings.filter((listing) => addedCaseIds.includes(listing.catalogueItemId as typeof addedCaseIds[number]));
    expect(researchedCases).toHaveLength(6);
    expect(researchedCases.every((listing) => listing.engineeringEvidence?.drawingUrl)).toBe(true);
    expect(researchedCases.every((listing) => listing.engineeringEvidence?.level === 'dimensioned-drawing')).toBe(true);
    expect(researchedCases.every((listing) => listing.engineeringEvidence?.glbReadiness === 'visual-glb-ready')).toBe(true);
    expect(researchedCases.every((listing) => listing.engineeringEvidence?.glbReadiness !== 'supplier-exact-ready')).toBe(true);
  });

  it('shows timestamped indicative Rand values while excluding unknown shipping', () => {
    const samurai = researchedSupplierListings.find((listing) => listing.id === 'research-ebay-feiyashi-samurai-188553207610')!;
    expect(samurai.unitPrice).toBe(56.99);
    expect(samurai.shippingPrice).toBe(40);
    expect(listingPriceZar(samurai)).toBeCloseTo(56.99 * PRICING_SNAPSHOT.usdZar, 5);
    expect(samurai.lastCheckedIso).toBeTruthy();
  });

  it('does not promote the undrawn dual-crown or chronograph candidates into the selectable exact-case set', () => {
    expect(catalogueItemById.has('cat-case-dual-crown-compressor-39')).toBe(false);
    expect(catalogueItemById.has('cat-case-vk63-speedmaster-397')).toBe(false);
    expect(catalogueItemById.has('cat-case-vk63-daytona-40')).toBe(false);
  });
});
