import scaleAssetsData from '@/domain/asset-library/data/scaleAssets.json';
import chapterRingAssetsData from '@/domain/asset-library/data/chapterRingAssets.json';
import markerAssetsData from '@/domain/asset-library/data/markerAssets.json';
import handAssetsData from '@/domain/asset-library/data/handAssets.json';
import materialAssetsData from '@/domain/asset-library/data/materialAssets.json';
import typographyAssetsData from '@/domain/asset-library/data/typographyAssets.json';
import manufacturingRulesData from '@/domain/asset-library/data/manufacturingRules.json';
import supplierProfilesData from '@/domain/asset-library/data/supplierProfiles.json';
import type {
  ChapterRingAssetDefinition,
  HandAssetDefinition,
  ManufacturingRuleDataDefinition,
  MarkerAssetDefinition,
  MaterialAssetDefinition,
  ScaleAssetDefinition,
  SupplierProfileDataDefinition,
  TypographyAssetDefinition
} from '@/domain/asset-library/types';

export const scaleAssets = scaleAssetsData as ScaleAssetDefinition[];
export const chapterRingAssets = chapterRingAssetsData as ChapterRingAssetDefinition[];
export const markerAssets = markerAssetsData as MarkerAssetDefinition[];
export const handAssets = handAssetsData as HandAssetDefinition[];
export const materialAssets = materialAssetsData as MaterialAssetDefinition[];
export const typographyAssets = typographyAssetsData as TypographyAssetDefinition[];
export const manufacturingRuleAssets = manufacturingRulesData as unknown as ManufacturingRuleDataDefinition[];
export const supplierProfileAssets = supplierProfilesData as SupplierProfileDataDefinition[];

export const getScaleAssetById = (id: string): ScaleAssetDefinition | null => {
  return scaleAssets.find((asset) => asset.id === id) ?? null;
};

export const getSupplierProfileAssetById = (id: string): SupplierProfileDataDefinition | null => {
  return supplierProfileAssets.find((profile) => profile.id === id) ?? null;
};

export const getTypographyAssetByFamily = (
  family: TypographyAssetDefinition['family']
): TypographyAssetDefinition | null => {
  return typographyAssets.find((asset) => asset.family === family) ?? null;
};
