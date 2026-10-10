import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from './types';
import { crownSlotError, withCrownDefault, crownSpecificationForPart, isCrownPart } from '@/domain/crown/selection';

/** Builds the same provisional assembly used by Preview and Apply. */
export const applyCatalogueVisualSelection = (
  assembly: WatchAssembly,
  partInstanceId: string,
  item: ComponentCatalogueItem
): WatchAssembly => {
  const provisional = JSON.parse(JSON.stringify(assembly)) as WatchAssembly;
  if (crownSlotError(assembly, partInstanceId, item)) return provisional;
  if (item.researchOnly) return provisional;
  const part = provisional.parts[partInstanceId];
  if (!part) return provisional;
  if (part.locked) return provisional;
  const previousCrown = crownSpecificationForPart(part);
  const wasAttached = part.crownSpecification !== undefined;

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
  part.customProperties = { ...part.customProperties, engineeringSpecs: item.engineeringSpecs, visualCrownAngleDeg: item.visual?.crownAngleDeg };
  part.parametricGeometry = undefined;
  part.geometryProvenance = undefined;
  if (item.kind === 'crown') {
    // Grip swaps retain closure, installation and physical interfaces.
    const changedSpec = previousCrown && item.crownSpecification && item.metadata.tags.includes('concept') ? {
      ...previousCrown, shape: item.crownSpecification.shape, grip: item.crownSpecification.grip,
      coreDiameterMm: item.crownSpecification.coreDiameterMm, maximumOuterDiameterMm: item.crownSpecification.maximumOuterDiameterMm, headLengthMm: item.crownSpecification.headLengthMm,
    } : item.crownSpecification ? structuredClone(item.crownSpecification) : undefined;
    part.crownSpecification = wasAttached ? changedSpec : undefined;
    if (!wasAttached && changedSpec) part.customProperties = { ...part.customProperties, detachedCrownSpecification: changedSpec };
    provisional.designConfig = { ...provisional.designConfig, crownChoice: { ...provisional.designConfig?.crownChoice, schema: 'crown-choice/v1', selected: { crownInstanceId: partInstanceId, source: 'explicit-user' } } };
  }

  if (item.kind === 'case' || item.kind === 'midcase') {
    part.crownAxes = item.crownAxes ? structuredClone(item.crownAxes) : undefined;
    // A previous platform's physical interface and authored placement are stale.
    const oldAnchors = provisional.designConfig?.assemblyAnchors;
    if (oldAnchors) {
      const anchors = { ...oldAnchors }; delete anchors['crown-interface'];
      provisional.designConfig = { ...provisional.designConfig, assemblyAnchors: anchors };
    }
    for (const crown of Object.values(provisional.parts).filter(isCrownPart)) {
      if (crown.crownSpecification) {
        crown.customProperties = { ...crown.customProperties, detachedCrownSpecification: crown.crownSpecification };
        crown.crownSpecification = undefined;
      }
      if (crown.visual) { delete crown.visual.crownAxisId; delete crown.visual.transform; }
    }
    provisional.globalDimensions.caseDiameterMm = item.nominalDimensions.diameterMm;
    provisional.globalDimensions.totalThicknessMm = item.nominalDimensions.thicknessMm;
  }

  if (!item.visual) return item.kind === 'case' || item.kind === 'midcase' ? withCrownDefault(provisional) : provisional;

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
    visualReferenceConfig: { ...previousReferences, componentAssetOverrides, ...(item.visual.caseFinish ? { caseFinish: item.visual.caseFinish } : {}) }
  };
  return item.visual.category === 'case' ? withCrownDefault(provisional) : provisional;
};
