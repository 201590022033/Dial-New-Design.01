import scaleAssetsData from '@/domain/asset-library/data/scaleAssets.json';
import chapterRingAssetsData from '@/domain/asset-library/data/chapterRingAssets.json';
import markerAssetsData from '@/domain/asset-library/data/markerAssets.json';
import handAssetsData from '@/domain/asset-library/data/handAssets.json';
import materialAssetsData from '@/domain/asset-library/data/materialAssets.json';
import typographyAssetsData from '@/domain/asset-library/data/typographyAssets.json';
import manufacturingRulesData from '@/domain/asset-library/data/manufacturingRules.json';
import supplierProfilesData from '@/domain/asset-library/data/supplierProfiles.json';
import lumeReferencesData from '@/domain/asset-library/data/lumeReferences.json';
import bezelReferencesData from '@/domain/asset-library/data/bezelReferences.json';
import complicationReferencesData from '@/domain/asset-library/data/complicationReferences.json';
import archetypeReferencesData from '@/domain/asset-library/data/archetypeReferences.json';
import styleAliasesData from '@/domain/asset-library/data/styleAliases.json';
import subdialReferencesData from '@/domain/asset-library/data/subdialReferences.json';
import lugReferencesData from '@/domain/asset-library/data/lugReferences.json';
import type {
  BezelReferenceDefinition,
  ChapterRingAssetDefinition,
  ComplicationReferenceDefinition,
  HandAssetDefinition,
  LumeReferenceDefinition,
  ManufacturingRuleDataDefinition,
  MarkerAssetDefinition,
  MaterialAssetDefinition,
  ScaleAssetDefinition,
  SupplierProfileDataDefinition,
  StyleAliasReferenceDefinition,
  SubdialReferenceDefinition,
  LugReferenceDefinition,
  WatchArchetypeReferenceDefinition,
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
export const lumeReferenceAssets = lumeReferencesData as LumeReferenceDefinition[];
export const bezelReferenceAssets = bezelReferencesData as BezelReferenceDefinition[];
export const complicationReferenceAssets = complicationReferencesData as ComplicationReferenceDefinition[];
export const archetypeReferenceAssets = archetypeReferencesData as WatchArchetypeReferenceDefinition[];
export const styleAliasReferences = styleAliasesData as StyleAliasReferenceDefinition[];
export const subdialReferenceAssets = subdialReferencesData as SubdialReferenceDefinition[];
export const lugReferenceAssets = lugReferencesData as LugReferenceDefinition[];

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

export const getLumeReferenceById = (id: string): LumeReferenceDefinition | null =>
  lumeReferenceAssets.find((asset) => asset.id === id) ?? null;

export const getBezelReferenceById = (id: string): BezelReferenceDefinition | null =>
  bezelReferenceAssets.find((asset) => asset.id === id) ?? null;

export const getComplicationReferenceById = (id: string): ComplicationReferenceDefinition | null =>
  complicationReferenceAssets.find((asset) => asset.id === id) ?? null;

export const getArchetypeReferenceById = (id: string): WatchArchetypeReferenceDefinition | null =>
  archetypeReferenceAssets.find((asset) => asset.id === id) ?? null;

export const getSubdialReferenceById = (id: string): SubdialReferenceDefinition | null =>
  subdialReferenceAssets.find((asset) => asset.id === id) ?? null;

export const getLugReferenceById = (id: string): LugReferenceDefinition | null =>
  lugReferenceAssets.find((asset) => asset.id === id) ?? null;
