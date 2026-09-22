import { describe, expect, it } from 'vitest';
import {
  chapterRingAssets,
  archetypeReferenceAssets,
  bezelReferenceAssets,
  complicationReferenceAssets,
  handAssets,
  lumeReferenceAssets,
  manufacturingRuleAssets,
  markerAssets,
  materialAssets,
  scaleAssets,
  supplierProfileAssets,
  styleAliasReferences,
  subdialReferenceAssets,
  lugReferenceAssets,
  typographyAssets
} from '@/domain/asset-library';
import {
  assetLibrarySummary,
  getManufacturingSourceCategories,
  mapFontCategoryToTypographyFamily
} from '@/services/assetLibraryService';

describe('asset library service', () => {
  it('loads all professional watch asset libraries', () => {
    expect(scaleAssets.length).toBeGreaterThan(20);
    expect(chapterRingAssets.length).toBeGreaterThan(10);
    expect(markerAssets.length).toBeGreaterThan(10);
    expect(handAssets.length).toBeGreaterThan(10);
    expect(materialAssets.length).toBeGreaterThan(20);
    expect(typographyAssets.length).toBeGreaterThanOrEqual(9);
    expect(manufacturingRuleAssets.length).toBeGreaterThanOrEqual(10);
    expect(supplierProfileAssets.length).toBeGreaterThanOrEqual(4);
    expect(lumeReferenceAssets.length).toBe(10);
    expect(bezelReferenceAssets.length).toBe(8);
    expect(complicationReferenceAssets.length).toBe(12);
    expect(archetypeReferenceAssets.length).toBeGreaterThanOrEqual(9);
    expect(styleAliasReferences.length).toBeGreaterThanOrEqual(10);
    expect(subdialReferenceAssets).toHaveLength(10);
    expect(lugReferenceAssets).toHaveLength(10);
  });

  it('keeps visual reference taxonomies explicitly non-engineering', () => {
    expect(lumeReferenceAssets.every((asset) => asset.provenance === 'reference-only')).toBe(true);
    expect(bezelReferenceAssets.every((asset) => asset.provenance === 'reference-only')).toBe(true);
    expect(complicationReferenceAssets.find((asset) => asset.id === 'complication-chronograph')?.windowOrSubdialCount).toBe(3);
    expect(styleAliasReferences.find((asset) => asset.id === 'hand-broad-arrow')?.aliases).toContain('Arrow');
    expect(subdialReferenceAssets.every((asset) => asset.movementOwned && asset.provenance === 'reference-only')).toBe(true);
    expect(lugReferenceAssets.every((asset) => asset.affectsCaseGeometry && asset.provenance === 'reference-only')).toBe(true);
  });

  it('produces an aggregate summary and source categories', () => {
    const summary = assetLibrarySummary();
    const categories = getManufacturingSourceCategories();

    expect(summary.scales).toBe(scaleAssets.length);
    expect(summary.manufacturingRules).toBe(manufacturingRuleAssets.length);
    expect(categories.length).toBeGreaterThan(3);
    expect(categories).toContain('Custom dial manufacturers');
  });

  it('maps UI font categories to professional typography profiles', () => {
    expect(mapFontCategoryToTypographyFamily('pilot')).toBe('pilot');
    expect(mapFontCategoryToTypographyFamily('technical-sans')).toBe('din');
    expect(mapFontCategoryToTypographyFamily('unknown-family')).toBe('chronograph');
  });
});
