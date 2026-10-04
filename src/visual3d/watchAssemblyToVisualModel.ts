import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type { AssemblyAnchors, ComponentTransform, ParametricCrownV1 } from '@/domain/geometry/parametric';
import { validateParametricCrownV1 } from '@/domain/geometry/parametric';
import { visualAssetRegistry, resolveVisualAssetByCategory, visualCategories, type VisualCategory, type VisualAssetDescriptor, type VisualHandStyle } from './visualAssetRegistry';
import { resolveAssemblyAnchors } from './assemblyAnchors';
import { matchesReference42Parameters } from '@/domain/presets/reference3d';
import { resolveFinishProfile, type FinishProfile, type FinishProfileId } from './finishProfiles';
import { defaultMarkerConfig, generateMarkers, type MarkerEngineConfig, type MarkerKind } from '@/domain/generators/markerEngine';
import { movementLibrary } from '@/domain/movements/movementLibrary';
import { defaultDialFaceConfig } from '@/domain/generators/dialFaceGenerator';
import { defaultTypographyConfig, fontFamilyForCategory } from '@/domain/generators/typographyEngine';
import { getArchetypeReferenceById, getBezelReferenceById, getComplicationReferenceById, getLumeReferenceById } from '@/domain/asset-library';
import { getArchetypeVisualProfile } from '@/domain/configurator/archetypeProfiles';
import { resolveProceduralEnvelope } from './proceduralEnvelope';

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
  markerKind: MarkerKind;
  customMarkerOverride: boolean;
  subdials: Array<{ role: string; angleDeg: number; centerRadiusMm: number; radiusMm: number; handRadiusMm: number; markerCount: number; scaleMax: number; handStyle: 'needle' | 'baton' | 'syringe'; geometryStatus: string; registerDesignStatus: string }>;
  windows: Array<{ kind: 'date' | 'day' | 'day-date'; angleDeg: number; widthMm: number; heightMm: number; cornerRadiusMm: number }>;
  textureKind: string;
  textureIntensity: number;
  textureContrast: number;
  artwork: {
    content: string;
    layout: 'straight' | 'arc' | 'circular' | 'radial' | 'vertical' | 'horizontal' | 'inside-circle' | 'outside-circle' | 'future-path';
    color: string;
    fontSizeMm: number;
    fontFamily: string;
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
  previewEnvelope: ReturnType<typeof resolveProceduralEnvelope>;
  caseMaterial: string;
  dialColor: string;
  dial: DialVisualDescriptor;
  bezelMaterial: string;
  bezelProfile: 'smooth' | 'coin-edge' | 'knurled' | 'scalloped';
  bezelEnvelope: { innerRadiusMm: number; outerRadiusMm: number };
  chapterRingEnvelope: { innerRadiusMm: number; outerRadiusMm: number };
  crystalMaterial: string;
  hands: {
    style: VisualHandStyle; material: string;
    hourLengthMm: number; minuteLengthMm: number; secondLengthMm: number;
    hourWidthMm: number; minuteWidthMm: number; secondWidthMm: number;
  };
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
    caseColor?: string;
    handsColor?: string;
    markerColor?: string;
    bezelMetalColor?: string;
    archetypeId?: string;
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
  const casePart = find('case'), dialPart = find('dial'), bezelPart = find('bezel'), chapterRingPart = find('chapter-ring'), handsPart = find('hands'), crownPart = find('crown'), pushersPart = find('pushers');
  const handValue = `${handsPart?.name ?? ''} ${handsPart?.texture ?? ''}`.toLowerCase();
  const declaredStyle = handsPart?.customProperties?.visualHandStyle;
  const registeredHandStyles: VisualHandStyle[] = ['baton', 'mercedes', 'needle', 'sword', 'dauphine', 'syringe', 'cathedral', 'pencil', 'broad-arrow', 'skeleton'];
  const style = registeredHandStyles.includes(declaredStyle as VisualHandStyle)
    ? declaredStyle as VisualHandStyle
    : registeredHandStyles.find((candidate) => handValue.includes(candidate)) ?? 'baton';
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
  if (visualReferences.archetypeId === 'archetype-pilot') {
    archetypeAssets['chapter-ring'] = 'archetype-chapter-ring-pilot';
  }
  if (visualReferences.archetypeId === 'archetype-chronograph' && visualReferences.subdialHandStyle) {
    archetypeAssets.hands = `archetype-hands-chronograph-${visualReferences.subdialHandStyle}`;
  }
  if (visualReferences.lugStyleId) {
    archetypeAssets.case = `lug-case-${visualReferences.lugStyleId}`;
  }
  if (visualReferences.dialMarkerMode && visualReferences.dialMarkerMode !== 'auto') {
    // Authored dial GLBs contain baked indices. A user override must not render
    // a second marker family on top of them.
    archetypeAssets.dial = 'visual-dial-default';
  }
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
    const explicitOverride = visualReferences.componentAssetOverrides?.[category];
    const id = explicitOverride ?? archetypeAssets[category] ?? part?.visual?.assetId ?? part?.customProperties?.visualAssetId;
    const fallbackId = category === 'hands' ? `visual-hands-${style === 'mercedes' ? 'mercedes' : 'baton'}` : `visual-${category}-default`;
    const resolved = resolveVisualAssetByCategory(typeof id === 'string' ? id : undefined, category, visualAssetRegistry[fallbackId]!);
    const referenceOnly = resolved.assetId.startsWith('reference-42-');
    const diameterMatches = resolved.referenceCaseDiameterMm === undefined ||
      (assembly.globalDimensions.caseDiameterMm === resolved.referenceCaseDiameterMm && (!referenceOnly || referenceIsCurrent));
    // Gem-set presentation bases may be resized radially; supplier cases must
    // still match their recorded diameter. Never turn this into fit evidence.
    const gemstoneScale = assembly.globalDimensions.caseDiameterMm / (resolved.referenceCaseDiameterMm ?? 42);
    assets[category] = resolved.assetId.startsWith('bezel-diamond-rose-gold-')
      ? { ...resolved, scale: [gemstoneScale, gemstoneScale, 1] }
      : diameterMatches ? resolved : visualAssetRegistry[fallbackId]!;
    const strapFinish = visualReferences.strapStyleId === 'canvas' ? 'canvas' : visualReferences.strapStyleId === 'leather' || visualReferences.strapStyleId === 'racing' ? 'leather' : 'rubber';
    const fallbackFinish: FinishProfileId = category === 'dial' ? 'dial' : category === 'crystal' ? 'sapphire' : category === 'strap' ? strapFinish : category === 'chapter-ring' ? 'black-pvd' : category === 'bezel' ? 'polished-steel' : 'brushed-steel';
    finishes[category] = resolveFinishProfile(resolved.materialProfile ?? materialProfile(part, fallbackFinish), fallbackFinish);
    // Legacy documents retain the main schematic; crown requires an actual part.
    visible[category] = part ? part.visible : category !== 'crown';
    transforms[category] = part?.visual?.transform;
  }
  // These compact presentation GLBs are sterile substrates. A coloured marker
  // request needs live indices, not a material change on nonexistent meshes.
  if (visualReferences.markerColor && /^dial-nh05-(mother-of-pearl|champagne-sunburst|black-sunburst)-245$/.test(assets.dial.assetId)) {
    assets.dial = visualAssetRegistry['visual-dial-default']!;
  }
  const candidate = crownPart?.parametricGeometry;
  if (visualReferences.caseFinish === 'rose-gold') {
    for (const category of ['case', 'caseback', 'crown', 'pushers', 'bezel'] as const) finishes[category] = resolveFinishProfile('rose-gold', 'rose-gold');
  }
  if (visualReferences.caseFinish === 'black-pvd') {
    for (const category of ['case', 'caseback', 'crown', 'pushers', 'bezel'] as const) finishes[category] = resolveFinishProfile('black-pvd', 'black-pvd');
  }
  if (visualReferences.handsFinish === 'rose-gold') finishes.hands = resolveFinishProfile('rose-gold', 'rose-gold');
  if (visualReferences.bezelFinish) finishes.bezel = resolveFinishProfile(visualReferences.bezelFinish === 'rose-gold' ? 'rose-gold' : 'polished-steel', 'polished-steel');
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
  // A named visual profile owns whether its presentation includes pushers.
  // Otherwise a retained VK63 movement can re-enable them after a diver/field
  // switch, even though applyArchetypeVisualProfile explicitly hid the part.
  // Also suppress stale GLB bindings/visibility bits restored from older saves.
  if (archetypeProfile && !archetypeProfile.pusherAssetId) {
    visible.pushers = false;
  } else if (!archetypeProfile && pushersPart && casePusherCount === undefined && pusherCount > 0) {
    // Retain movement-driven previews when no archetype was explicitly selected.
    visible.pushers = true;
  }
  const markerConfig: MarkerEngineConfig = assembly.designConfig?.markerConfig ?? defaultMarkerConfig;
  const dialConfig = assembly.designConfig?.dialFaceConfig;
  const effectiveDialColor = dialConfig?.color ?? dialPart?.color ?? assembly.selectedColorPalette.primary;
  const effectiveHandStyle = assets.hands.handStyle ?? style;
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
  const publishedHandLengths = getCatalogueItem(handsPart?.catalogueItemId ?? '')?.visual?.handLengthsMm;
  const caseHeight = positive(caseParams?.midcaseHeight, positive(assembly.globalDimensions.totalThicknessMm, 12.5));
  // The authored 42 mm face components have fixed watch-axis coordinates. Keep
  // any missing component in that same frame, even without the opt-in fixture.
  const hasFixedFaceFrame = [assets.dial, assets.bezel, assets.crystal].some(asset => asset.assetType === 'glb' && asset.referenceCaseDiameterMm === 42);
  return {
    caseDiameterMm: positive(assembly.globalDimensions.caseDiameterMm, 40),
    caseThicknessMm: caseHeight,
    previewEnvelope: resolveProceduralEnvelope(positive(assembly.globalDimensions.caseDiameterMm, 40), caseHeight, caseParams, hasFixedFaceFrame ? 10.2 : caseHeight, find('strap')?.dimensions.widthMm),
    caseMaterial: materialProfile(casePart, 'brushed-steel'),
    dialColor: effectiveDialColor,
    dial: {
      outerDiameterMm: dialDiameter,
      thicknessMm: positive(dialPart?.dimensions.thicknessMm, 0.4),
      centreHoleDiameterMm: positive(dialConfig?.centreHole?.diameterMm, 1.5),
      markers: generateMarkers(markerConfig).map((marker) => ({ ...marker, lumed: markerConfig.style.lumed })),
      markerKind: markerConfig.kind,
      customMarkerOverride: Boolean(visualReferences.dialMarkerMode && visualReferences.dialMarkerMode !== 'auto'),
      subdials: (movement?.subdials ?? []).map((subdial) => ({
        role: subdial.role,
        angleDeg: subdial.angleDeg,
        centerRadiusMm: subdial.centerRadiusMm ?? subdial.previewCenterRadiusMm,
        radiusMm: subdial.registerRadiusMm,
        handRadiusMm: subdial.handRadiusMm,
        markerCount: subdial.markerCount,
        scaleMax: subdial.scaleMax,
        handStyle: visualReferences.subdialHandStyle ?? 'needle',
        geometryStatus: subdial.geometryEvidence.status,
        registerDesignStatus: subdial.registerDesignEvidence.status
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
        fontFamily: fontFamilyForCategory(typography.fontCategory),
        radiusMm: positive(typography.radiusMm, defaultTypographyConfig.radiusMm),
        angleStartDeg: typography.angleStartDeg,
        angleSpanDeg: typography.angleSpanDeg,
        customImageDataUrl: visualReferences.artworkDataUrl,
        customImageName: visualReferences.artworkName
      }
    },
    bezelMaterial: materialProfile(bezelPart, 'polished-steel'),
    bezelEnvelope: (() => {
      const outerRadiusMm = positive(bezelPart?.dimensions.diameterMm, positive(assembly.globalDimensions.caseDiameterMm, 40)) / 2;
      const widthMm = positive(bezelPart?.dimensions.widthMm, Math.max(1, outerRadiusMm * 0.16));
      return { innerRadiusMm: Math.max(0, outerRadiusMm - widthMm), outerRadiusMm };
    })(),
    chapterRingEnvelope: (() => {
      const outerRadiusMm = positive(chapterRingPart?.dimensions.diameterMm, dialDiameter + 2) / 2;
      const widthMm = positive(chapterRingPart?.dimensions.widthMm, 1.8);
      return { innerRadiusMm: Math.max(0, outerRadiusMm - widthMm), outerRadiusMm };
    })(),
    bezelProfile: (() => {
      const profile = bezelPart?.customProperties?.visualBezelProfile;
      return profile === 'coin-edge' || profile === 'knurled' || profile === 'scalloped' ? profile : 'smooth';
    })(),
    crystalMaterial: 'sapphire',
    hands: {
      style: effectiveHandStyle,
      material: materialProfile(handsPart, 'polished-steel'),
      // Procedural hands are sized to the visible dial, not the case. This is
      // especially important for NH05 watches, where a 24.5 mm dial sits in a
      // nominal 34 mm case and NH35-sized preview hands look oversized.
      hourLengthMm: publishedHandLengths ? positive(assembly.parts['inst-hour-hand']?.dimensions.diameterMm, publishedHandLengths.hour) : dialDiameter * 0.25,
      minuteLengthMm: publishedHandLengths ? positive(assembly.parts['inst-minute-hand']?.dimensions.diameterMm, publishedHandLengths.minute) : dialDiameter * 0.36,
      secondLengthMm: publishedHandLengths ? positive(assembly.parts['inst-central-seconds']?.dimensions.diameterMm, publishedHandLengths.second) : dialDiameter * 0.39,
      hourWidthMm: movement?.id === 'nh05' ? 0.55 : effectiveHandStyle === 'mercedes' ? 1.1 : effectiveHandStyle === 'needle' ? 0.45 : 0.85,
      minuteWidthMm: movement?.id === 'nh05' ? 0.35 : effectiveHandStyle === 'needle' ? 0.28 : 0.58,
      secondWidthMm: movement?.id === 'nh05' ? 0.12 : 0.2
    },
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
      caseColor: visualReferences.caseFinish === 'rose-gold' || visualReferences.caseFinish === 'black-pvd' ? finishes.case.color : undefined,
      handsColor: visualReferences.handsColor ?? (visualReferences.handsFinish === 'rose-gold' ? finishes.hands.color : undefined),
      markerColor: visualReferences.markerColor,
      bezelMetalColor: visualReferences.bezelFinish ? finishes.bezel.color : undefined,
      archetypeId: visualReferences.archetypeId,
      dialColor: effectiveDialColor,
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
