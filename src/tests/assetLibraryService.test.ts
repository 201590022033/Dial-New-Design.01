import { describe, expect, it } from 'vitest';
import {
  chapterRingAssets,
  handAssets,
  manufacturingRuleAssets,
  markerAssets,
  materialAssets,
  scaleAssets,
  supplierProfileAssets,
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
