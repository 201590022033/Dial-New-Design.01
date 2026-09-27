import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from './types';

/** Builds the same provisional assembly used by Preview and Apply. */
export const applyCatalogueVisualSelection = (
  assembly: WatchAssembly,
  partInstanceId: string,
  item: ComponentCatalogueItem
): WatchAssembly => {
  const provisional = JSON.parse(JSON.stringify(assembly)) as WatchAssembly;
  const part = provisional.parts[partInstanceId];
  if (!part) return provisional;

  part.catalogueItemId = item.id;
  part.name = item.displayName;
  part.dimensions = {
    diameterMm: item.nominalDimensions.diameterMm,
    thicknessMm: item.nominalDimensions.thicknessMm,
    widthMm: item.nominalDimensions.widthMm,
    offsetXmm: part.dimensions?.offsetXmm ?? 0,
    offsetYmm: part.dimensions?.offsetYmm ?? 0
  };
  part.material = item.defaultMaterial || part.material;
  part.texture = item.defaultTexture || part.texture;

  if (!item.visual) return provisional;

  part.visual = { category: item.visual.category, assetId: item.visual.assetId };
  part.customProperties = {
    ...part.customProperties,
    visualHandStyle: item.visual.handStyle ?? part.customProperties?.visualHandStyle,
    visualBezelProfile: item.visual.bezelProfile ?? part.customProperties?.visualBezelProfile
  };

  const previousDesign = provisional.designConfig ?? {};
  const previousReferences = previousDesign.visualReferenceConfig ?? {};
  const componentAssetOverrides = {
    ...previousReferences.componentAssetOverrides,
    [item.visual.category]: item.visual.assetId
  };
  const nextTexture = item.visual.dialFinish
    ? {
        ...(previousDesign.dialFaceConfig?.texture ?? previousDesign.textureConfig ?? { intensity: 0.65, contrast: 0.55 }),
        kind: item.visual.dialFinish
      }
    : undefined;

  provisional.designConfig = {
    ...previousDesign,
    ...(nextTexture
      ? {
          textureConfig: nextTexture,
          dialFaceConfig: { ...previousDesign.dialFaceConfig, texture: nextTexture }
        }
      : {}),
    visualReferenceConfig: { ...previousReferences, componentAssetOverrides }
  };
  return provisional;
};
