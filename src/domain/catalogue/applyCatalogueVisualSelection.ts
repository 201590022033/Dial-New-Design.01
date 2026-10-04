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
  // A replacement cannot inherit the previous component's mating dimensions.
  part.customProperties = { ...part.customProperties, engineeringSpecs: item.engineeringSpecs };
  part.parametricGeometry = undefined;
  part.geometryProvenance = undefined;

  if (item.visual?.category === 'case') {
    provisional.globalDimensions.caseDiameterMm = item.nominalDimensions.diameterMm;
    provisional.globalDimensions.totalThicknessMm = item.nominalDimensions.thicknessMm;
  }

  if (!item.visual) return provisional;

  // A complete set replaces the three central hands, never subdial hands.
  // Clearing stale fit evidence is as important as updating visible lengths.
  if (item.kind === 'hand-set' && item.visual.category === 'hands') {
    const dialDiameter = provisional.parts['inst-dial-blank']?.dimensions.diameterMm ?? 24.5;
    const lengths = item.visual.handLengthsMm ?? { hour: dialDiameter * .25, minute: dialDiameter * .36, second: dialDiameter * .39 };
    for (const [id, role] of [['inst-hour-hand', 'hour'], ['inst-minute-hand', 'minute'], ['inst-central-seconds', 'second']] as const) {
      const hand = provisional.parts[id];
      if (!hand) continue;
      hand.catalogueItemId = item.id;
      hand.name = `${item.displayName} (${role})`;
      hand.dimensions = { ...hand.dimensions, diameterMm: lengths[role] };
      hand.material = item.defaultMaterial;
      hand.texture = item.defaultTexture;
      hand.visual = { category: 'hands', assetId: item.visual.assetId };
      hand.customProperties = { ...hand.customProperties, engineeringSpecs: item.engineeringSpecs, visualHandStyle: item.visual.handStyle };
      hand.parametricGeometry = undefined;
      hand.geometryProvenance = undefined;
    }
  }
  if (item.visual.dialColor) part.color = item.visual.dialColor;

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
          dialFaceConfig: { ...previousDesign.dialFaceConfig, texture: nextTexture, ...(item.visual.dialColor ? { color: item.visual.dialColor } : {}) }
        }
      : {}),
    visualReferenceConfig: { ...previousReferences, componentAssetOverrides }
  };
  return provisional;
};
