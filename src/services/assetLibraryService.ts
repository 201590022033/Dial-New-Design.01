import {
  chapterRingAssets,
  handAssets,
  manufacturingRuleAssets,
  markerAssets,
  materialAssets,
  scaleAssets,
  supplierProfileAssets,
  typographyAssets,
  type TypographyAssetDefinition
} from '@/domain/asset-library';

export const assetLibrarySummary = () => {
  return {
    scales: scaleAssets.length,
    chapterRings: chapterRingAssets.length,
    markers: markerAssets.length,
    hands: handAssets.length,
    materials: materialAssets.length,
    typography: typographyAssets.length,
    manufacturingRules: manufacturingRuleAssets.length,
    suppliers: supplierProfileAssets.length
  };
};

export const getManufacturingSourceCategories = (): string[] => {
  const categories = new Set(manufacturingRuleAssets.map((rule) => rule.supportingSupplierCategory));
  return [...categories].sort();
};

export const mapFontCategoryToTypographyFamily = (
  fontCategory: string
): TypographyAssetDefinition['family'] => {
  const mapping: Record<string, TypographyAssetDefinition['family']> = {
    pilot: 'pilot',
    military: 'military',
    railroad: 'railroad',
    roman: 'dress',
    vintage: 'vintage',
    'technical-sans': 'din',
    'modern-sans': 'bauhaus',
    arabic: 'dive'
  };

  return mapping[fontCategory] ?? 'chronograph';
};
