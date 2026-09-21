import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type { AssemblyAnchors, ComponentTransform, ParametricCrownV1 } from '@/domain/geometry/parametric';
import { validateParametricCrownV1 } from '@/domain/geometry/parametric';
import { visualAssetRegistry, resolveVisualAssetByCategory, visualCategories, type VisualCategory, type VisualAssetDescriptor } from './visualAssetRegistry';
import { resolveAssemblyAnchors } from './assemblyAnchors';
import { matchesReference42Parameters } from '@/domain/presets/reference3d';
import { resolveFinishProfile, type FinishProfile, type FinishProfileId } from './finishProfiles';
import { defaultMarkerConfig, generateMarkers, type MarkerEngineConfig } from '@/domain/generators/markerEngine';
import { movementLibrary } from '@/domain/movements/movementLibrary';
import { defaultDialFaceConfig } from '@/domain/generators/dialFaceGenerator';
import { defaultTypographyConfig } from '@/domain/generators/typographyEngine';
import { getArchetypeReferenceById, getBezelReferenceById, getComplicationReferenceById, getLumeReferenceById } from '@/domain/asset-library';
import { getArchetypeVisualProfile } from '@/domain/configurator/archetypeProfiles';

export type PusherVisualDescriptor = {
  count: number;
  layout: 'none' | '2h-4h' | 'custom';
  positionsDeg: number[];
  tubeRadiusMm: number;
  tubeLengthMm: number;
  bossRadiusMm: number;
  bossLengthMm: number;
  material: string;
  provisional: boolean;
};

export type DialVisualDescriptor = {
  outerDiameterMm: number;
  thicknessMm: number;
  centreHoleDiameterMm: number;
  markers: Array<{ angleDeg: number; innerRadiusMm: number; outerRadiusMm: number; widthMm: number; text?: string; lumed: boolean }>;
  subdials: Array<{ role: string; angleDeg: number; radiusMm: number; handRadiusMm: number; markerCount: number }>;
  windows: Array<{ kind: 'date' | 'day' | 'day-date'; angleDeg: number; widthMm: number; heightMm: number; cornerRadiusMm: number }>;
  textureKind: string;
  textureIntensity: number;
  textureContrast: number;
  artwork: {
    content: string;
    layout: 'straight' | 'arc' | 'circular' | 'radial' | 'vertical' | 'horizontal' | 'inside-circle' | 'outside-circle' | 'future-path';
    color: string;
    fontSizeMm: number;
    radiusMm: number;
    angleStartDeg: number;
    angleSpanDeg: number;
    customImageDataUrl?: string;
    customImageName?: string;
  };
};

export type VisualWatchModel = {
  caseDiameterMm: number;
  caseThicknessMm: number;
  caseMaterial: string;
  dialColor: string;
  dial: DialVisualDescriptor;
  bezelMaterial: string;
  crystalMaterial: string;
  hands: { style: 'baton' | 'mercedes' | 'needle'; material: string };
  crown: { diameterMm: number; lengthMm: number; material: string; parameters?: ParametricCrownV1; provisional: boolean };
  pushers: PusherVisualDescriptor;
  finishes: Record<VisualCategory, FinishProfile>;
  anchors: AssemblyAnchors;
  visible: Record<VisualCategory, boolean>;
  transforms: Partial<Record<VisualCategory, ComponentTransform>>;
  assets: Record<VisualCategory, VisualAssetDescriptor>;
  referenceProfiles: {
    archetypeId?: string;
    complicationId?: string;
    bezelId?: string;
    lumeId?: string;
    lumeColor?: string;
  };
  archetypeAppearance: {
    dialColor: string;
    strapColor: string;
    bezelColor: string;
    accentColor: string;
    strapStyleId: 'rubber' | 'leather' | 'canvas' | 'racing';
    dialTextureKind: string;
    dialTextureIntensity: number;
    lumeEnabled: boolean;
    lumeColor: string;
  };
};

const materialProfile = (part: WatchAssemblyPartInstance | undefined, fallback: string) => {
  const value = `${part?.texture ?? ''} ${part?.material ?? ''}`.toLowerCase();
  if (value.includes('black') || value.includes('pvd')) return 'black-pvd';
  if (value.includes('brush')) return 'brushed-steel';
  if (value.includes('polish')) return 'polished-steel';
  if (value.includes('brass')) return 'brass';
  return fallback;
};

/** Stable catalogue kind or explicit binding survives user renaming.
 * Broad 'case'/'external' categories contain unrelated parts.
 */
export const visualCategoryForPart = (part: WatchAssemblyPartInstance): VisualCategory | undefined => {
  if (part.visual && visualCategories.includes(part.visual.category)) return part.visual.category;
  const kind = getCatalogueItem(part.catalogueItemId)?.kind;
  if (kind === 'crown') return 'crown';
  if (kind === 'pushers') return 'pushers';
  if (kind === 'crystal' || kind?.includes('sapphire')) return 'crystal';
  if (kind === 'case' || kind === 'midcase') return 'case';
  if (kind === 'caseback') return 'caseback';
  if (kind === 'strap-integration' || kind === 'bracelet-integration') return 'strap';
  if (kind === 'chapter-ring' || kind === 'rehaut') return 'chapter-ring';
  if (kind === 'rotating-bezel' || kind === 'fixed-bezel') return 'bezel';
  if (kind === 'dial-blank') return 'dial';
  if (part.category === 'hands') return 'hands';
  return undefined;
};

const positive = (v: unknown, fallback: number) => typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback;

export const watchAssemblyToVisualModel = (assembly: WatchAssembly): VisualWatchModel => {
  const parts = Object.values(assembly.parts);
  const find = (category: VisualCategory) => {
    const matching = parts.filter((part) => visualCategoryForPart(part) === category);
    return matching.find((part) => part.visible && (part.visual?.assetId || part.customProperties?.visualAssetId)) ?? matching.find((part) => part.visible) ?? matching[0];
  };
  const casePart = find('case'), dialPart = find('dial'), bezelPart = find('bezel'), handsPart = find('hands'), crownPart = find('crown'), pushersPart = find('pushers');
  const handValue = `${handsPart?.name ?? ''} ${handsPart?.texture ?? ''}`.toLowerCase();
  const declaredStyle = handsPart?.customProperties?.visualHandStyle;
  const style = declaredStyle === 'mercedes' || handValue.includes('mercedes') ? 'mercedes' : declaredStyle === 'needle' || handValue.includes('needle') ? 'needle' : 'baton';
  const movement = movementLibrary.find((item) => item.id === assembly.metadata.movement);
  const visualReferences = assembly.designConfig?.visualReferenceConfig ?? {};
  const archetypeProfile = getArchetypeVisualProfile(visualReferences.archetypeId);
  const archetypeAssets: Partial<Record<VisualCategory, string>> = archetypeProfile ? {
    dial: archetypeProfile.dialAssetId,
    bezel: archetypeProfile.bezelAssetId,
    hands: archetypeProfile.handsAssetId,
    pushers: archetypeProfile.pusherAssetId,
    strap: `archetype-strap-${visualReferences.strapStyleId ?? archetypeProfile.strapStyleId}`
  } : {};
  if (visualReferences.strapStyleId) {
    archetypeAssets.strap = `archetype-strap-${visualReferences.strapStyleId}`;
  }
  const assets = {} as VisualWatchModel['assets'];
  const visible = {} as VisualWatchModel['visible'];
  const transforms: VisualWatchModel['transforms'] = {};
  const finishes = {} as VisualWatchModel['finishes'];
  const referenceIsCurrent = assembly.globalDimensions.caseDiameterMm === 42 && matchesReference42Parameters(assembly);
  for (const category of visualCategories) {
    const part = find(category);
    const id = archetypeAssets[category] ?? part?.visual?.assetId ?? part?.customProperties?.visualAssetId;
    const fallbackId = category === 'hands' ? `visual-hands-${style === 'mercedes' ? 'mercedes' : 'baton'}` : `visual-${category}-default`;
    const resolved = resolveVisualAssetByCategory(typeof id === 'string' ? id : undefined, category, visualAssetRegistry[fallbackId]!);
    const referenceOnly = resolved.assetId.startsWith('reference-42-');
    const diameterMatches = resolved.referenceCaseDiameterMm === undefined ||
      (assembly.globalDimensions.caseDiameterMm === resolved.referenceCaseDiameterMm && (!referenceOnly || referenceIsCurrent));
    assets[category] = diameterMatches ? resolved : visualAssetRegistry[fallbackId]!;
    const strapFinish = visualReferences.strapStyleId === 'canvas' ? 'canvas' : visualReferences.strapStyleId === 'leather' || visualReferences.strapStyleId === 'racing' ? 'leather' : 'rubber';
    const fallbackFinish: FinishProfileId = category === 'dial' ? 'dial' : category === 'crystal' ? 'sapphire' : category === 'strap' ? strapFinish : category === 'chapter-ring' ? 'black-pvd' : category === 'bezel' ? 'polished-steel' : 'brushed-steel';
    finishes[category] = resolveFinishProfile(resolved.materialProfile ?? materialProfile(part, fallbackFinish), fallbackFinish);
    // Legacy documents retain the main schematic; crown requires an actual part.
    visible[category] = part ? part.visible : category !== 'crown';
    transforms[category] = part?.visual?.transform;
  }
  const candidate = crownPart?.parametricGeometry;
  const crownParams = candidate?.schema === 'parametric-crown/v1' && validateParametricCrownV1(candidate).status !== 'invalid' ? candidate : undefined;
  const caseParams = casePart?.parametricGeometry?.schema === 'parametric-case/v1' ? casePart.parametricGeometry : undefined;
  const casePusherCount = caseParams?.pusherCount === undefined ? undefined : Math.max(0, Math.min(2, Math.round(Number(caseParams.pusherCount) || 0)));
  const pusherCount = casePusherCount ?? Math.max(0, Math.min(2, Math.round(Number(movement?.pusherCount) || 0)));
  const offset = typeof caseParams?.pusherAngularOffsetDeg === 'number' ? caseParams.pusherAngularOffsetDeg : 0;
  const pusherPositionsDeg = pusherCount > 0
    ? (caseParams?.pusherLayout === '2h-4h'
      ? [60 + offset, -60 + offset].slice(0, pusherCount)
      : movement?.pusherPositionsDeg?.slice(0, pusherCount) ?? [])
    : [];
  // A chronograph movement is enough to make the presentation pushers useful
  // before a case-specific pusher drawing is attached. Keep authored case
  // visibility authoritative when a case fixture already declares its count.
  if (pushersPart && casePusherCount === undefined && pusherCount > 0) visible.pushers = true;
  const markerConfig: MarkerEngineConfig = assembly.designConfig?.markerConfig ?? defaultMarkerConfig;
  const dialConfig = assembly.designConfig?.dialFaceConfig;
  const dialTexture = dialConfig?.texture ?? defaultDialFaceConfig.texture;
  const typography = assembly.designConfig?.typographyConfig ?? defaultTypographyConfig;
  const lumeReference = getLumeReferenceById(visualReferences.lumeId ?? '');
  const dateWindowParts = parts.filter((part) => {
    const kind = getCatalogueItem(part.catalogueItemId)?.kind;
    return part.visible && (kind === 'date-window' || kind === 'day-window');
  });
  const windows = dateWindowParts.map((part) => {
    const kind = getCatalogueItem(part.catalogueItemId)?.kind;
    const configured = typeof part.customProperties?.position === 'string' ? part.customProperties.position : undefined;
    const position = configured ?? (kind === 'day-window' ? movement?.datePosition ?? '12:00' : movement?.datePosition ?? '3:00');
    const angleDeg = position.includes('4') ? 45 : position.includes('6') ? 0 : position.includes('9') ? 90 : position.includes('12') ? 180 : 90;
    return { kind: kind === 'day-window' ? 'day' as const : 'date' as const, angleDeg, widthMm: positive(part.dimensions.widthMm, 3.4), heightMm: positive(part.dimensions.thicknessMm, 1.2), cornerRadiusMm: 0.25 };
  });
    const dialDiameter = positive(dialPart?.dimensions.diameterMm, 32);
  return {
    caseDiameterMm: positive(assembly.globalDimensions.caseDiameterMm, 40),
    caseThicknessMm: positive(assembly.globalDimensions.totalThicknessMm, 12.5),
    caseMaterial: materialProfile(casePart, 'brushed-steel'),
    dialColor: dialPart?.color ?? assembly.selectedColorPalette.primary,
    dial: {
      outerDiameterMm: dialDiameter,
      thicknessMm: positive(dialPart?.dimensions.thicknessMm, 0.4),
      centreHoleDiameterMm: positive(dialConfig?.centreHole?.diameterMm, 1.5),
      markers: generateMarkers(markerConfig).map((marker) => ({ ...marker, lumed: markerConfig.style.lumed })),
      subdials: (movement?.subdialPositionsDeg ?? []).map((angleDeg, index) => ({
        role: movement?.pusherCount ? ['chronograph-seconds', 'chronograph-minutes', 'chronograph-hours'][index] ?? 'custom' : 'small-seconds',
        angleDeg, radiusMm: 3.6, handRadiusMm: 2.8, markerCount: 12
      })),
      windows,
      textureKind: dialTexture.kind,
      textureIntensity: dialTexture.intensity,
      textureContrast: dialTexture.contrast,
      artwork: {
        content: typography.content.trim(),
        layout: typography.layout,
        color: typography.color,
        fontSizeMm: positive(typography.fontSizeMm, defaultTypographyConfig.fontSizeMm),
        radiusMm: positive(typography.radiusMm, defaultTypographyConfig.radiusMm),
        angleStartDeg: typography.angleStartDeg,
        angleSpanDeg: typography.angleSpanDeg,
        customImageDataUrl: visualReferences.artworkDataUrl,
        customImageName: visualReferences.artworkName
      }
    },
    bezelMaterial: materialProfile(bezelPart, 'polished-steel'),
    crystalMaterial: 'sapphire',
    hands: { style, material: materialProfile(handsPart, 'polished-steel') },
    crown: {
      diameterMm: positive(crownParams?.headDiameterMm, positive(crownPart?.dimensions.diameterMm, 6.5)),
      lengthMm: positive(crownParams?.headLengthMm, positive(crownPart?.dimensions.thicknessMm, 3.5)),
      material: materialProfile(crownPart, 'polished-steel'), parameters: crownParams,
      provisional: !crownParams || crownParams.provenance.status === 'provisional' || validateParametricCrownV1(crownParams).status === 'unknown'
    },
    pushers: {
      count: pusherCount,
      layout: caseParams?.pusherLayout ?? (pusherPositionsDeg.length ? '2h-4h' : 'none'),
      positionsDeg: pusherPositionsDeg,
      tubeRadiusMm: positive(caseParams?.pusherTubeRadius, pushersPart?.dimensions.diameterMm ? pushersPart.dimensions.diameterMm / 4 : 0.9),
      tubeLengthMm: positive(caseParams?.pusherTubeLength, pushersPart?.dimensions.thicknessMm ?? 1.8),
      bossRadiusMm: positive(caseParams?.pusherBossRadius, pushersPart?.dimensions.diameterMm ? pushersPart.dimensions.diameterMm / 2 : 1.4),
      bossLengthMm: positive(caseParams?.pusherBossLength, pushersPart?.dimensions.widthMm ?? 1.0),
      material: materialProfile(pushersPart, 'polished-steel'),
      provisional: !caseParams || casePart?.geometryProvenance?.status === 'provisional'
    },
    finishes, anchors: resolveAssemblyAnchors(assembly, caseParams), visible, transforms, assets,
    referenceProfiles: {
      archetypeId: getArchetypeReferenceById(visualReferences.archetypeId ?? '')?.id,
      complicationId: getComplicationReferenceById(visualReferences.complicationId ?? '')?.id,
      bezelId: getBezelReferenceById(visualReferences.bezelId ?? '')?.id,
      lumeId: lumeReference?.id,
      lumeColor: lumeReference?.visualColor
    },
    archetypeAppearance: {
      dialColor: archetypeProfile?.dialColor ?? dialPart?.color ?? assembly.selectedColorPalette.primary,
      strapColor: archetypeProfile?.strapColor ?? '#080b10',
      bezelColor: visualReferences.bezelId === 'bezel-gmt-24-hour' ? '#173e77' : visualReferences.bezelId === 'bezel-tachymeter' ? '#16191d' : visualReferences.bezelId === 'bezel-smooth' ? '#7f8791' : '#05080d',
      accentColor: assembly.selectedColorPalette.accent,
      strapStyleId: visualReferences.strapStyleId ?? archetypeProfile?.strapStyleId ?? 'rubber',
      dialTextureKind: dialTexture.kind,
      dialTextureIntensity: dialTexture.intensity,
      lumeEnabled: markerConfig.style.lumed,
      lumeColor: lumeReference?.visualColor ?? '#dfffd2'
    }
  };
};
