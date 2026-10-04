import { describe, expect, it } from 'vitest';
import { nh05SupplierCandidateItems, nh05SupplierCandidateListings, NH05_SUPPLIER_CHECKED_AT } from '@/domain/catalogue/nh05SupplierCandidates';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { checkCatalogueVerificationState } from '@/domain/compatibility/rules/catalogueVerificationRule';

describe('dated NH05 supplier candidates', () => {
  it('registers separate product identities in the parts store and catalogue', () => {
    expect(nh05SupplierCandidateItems).toHaveLength(3);
    for (const item of nh05SupplierCandidateItems) {
      expect(getCatalogueItem(item.id)).toEqual(item);
      expect(useCatalogueStore.getState().getItem(item.id)).toEqual(item);
      expect(useCatalogueStore.getState().getListingsForComponent(item.id).length).toBeGreaterThan(0);
    }
  });
  it('keeps incomplete dimensions unverified and does not claim exact GLBs or exports', () => {
    for (const item of nh05SupplierCandidateItems) {
      expect(item.status).toBe('draft');
      expect(item.exportEnabled).toBe(false);
      expect(item.engineeringSpecs).toBeUndefined();
      expect(item.visual?.status).toBe('provisional');
      expect(checkCatalogueVerificationState(item)[0]?.status).toBe('unknown');
    }
  });
  it('retains the previous GLB dimensions and identities', () => {
    expect(getCatalogueItem('cat-case-nh05-ladies-dress-34')?.nominalDimensions.thicknessMm).toBe(10.5);
    expect(getCatalogueItem('cat-research-tandorio-nh05-case-34')?.nominalDimensions.thicknessMm).toBe(12);
    expect(getCatalogueItem('cat-hands-nh05-dress-baton')?.visual?.assetId).toBe('hands-baton-nh05-34');
  });
  it('preserves source timestamps, unknown shipping/stock and partial evidence', () => {
    for (const listing of nh05SupplierCandidateListings) {
      expect(listing.lastCheckedIso).toBe(NH05_SUPPLIER_CHECKED_AT);
      expect(listing.provenance.retrievedAtIso).toBe(NH05_SUPPLIER_CHECKED_AT);
      expect(listing.provenance.isDemonstrationFixture).toBe(false);
      expect(listing.shippingPrice).toBeNull();
      expect(listing.stockStatus).toBe('unknown');
      expect(listing.verificationStatus).toBe('unverified');
      expect(listing.engineeringEvidence).toMatchObject({ level: 'partial-dimensions', glbReadiness: 'provisional-only' });
      expect(listing.engineeringEvidence?.drawingUrl).toBeUndefined();
    }
  });
  it('does not use the black set price as a checked rose-gold quote', () => {
    const black = nh05SupplierCandidateListings.find((listing) => listing.sku?.startsWith('Black'))!;
    const rose = nh05SupplierCandidateListings.find((listing) => listing.sku?.startsWith('RoseGold'))!;
    expect(black.unitPrice).toBe(7.95);
    expect(rose.unitPrice).toBeNull();
    expect(black.catalogueItemId).toBe(rose.catalogueItemId);
    expect(black.notes).toContain('One complete');
  });
});
