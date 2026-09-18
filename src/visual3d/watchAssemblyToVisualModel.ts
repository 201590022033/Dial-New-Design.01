import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type { AssemblyAnchors, ComponentTransform, ParametricCrownV1 } from '@/domain/geometry/parametric';
import { validateParametricCrownV1 } from '@/domain/geometry/parametric';
import { visualAssetRegistry, resolveVisualAssetByCategory, visualCategories, type VisualCategory, type VisualAssetDescriptor } from './visualAssetRegistry';
import { resolveAssemblyAnchors } from './assemblyAnchors';

export type VisualWatchModel = {
  caseDiameterMm: number;
  caseThicknessMm: number;
  caseMaterial: string;
  dialColor: string;
  bezelMaterial: string;
  crystalMaterial: string;
  hands: { style: 'baton' | 'mercedes' | 'needle'; material: string };
  crown: { diameterMm: number; lengthMm: number; material: string; parameters?: ParametricCrownV1; provisional: boolean };
  anchors: AssemblyAnchors;
  visible: Record<VisualCategory, boolean>;
  transforms: Partial<Record<VisualCategory, ComponentTransform>>;
  assets: Record<VisualCategory, VisualAssetDescriptor>;
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
  if (kind === 'crystal' || kind?.includes('sapphire')) return 'crystal';
  if (kind === 'case' || kind === 'midcase') return 'case';
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
  const casePart = find('case'), dialPart = find('dial'), bezelPart = find('bezel'), handsPart = find('hands'), crownPart = find('crown');
  const handValue = `${handsPart?.name ?? ''} ${handsPart?.texture ?? ''}`.toLowerCase();
  const declaredStyle = handsPart?.customProperties?.visualHandStyle;
  const style = declaredStyle === 'mercedes' || handValue.includes('mercedes') ? 'mercedes' : declaredStyle === 'needle' || handValue.includes('needle') ? 'needle' : 'baton';
  const assets = {} as VisualWatchModel['assets'];
  const visible = {} as VisualWatchModel['visible'];
  const transforms: VisualWatchModel['transforms'] = {};
  for (const category of visualCategories) {
    const part = find(category);
    const id = part?.visual?.assetId ?? part?.customProperties?.visualAssetId;
    const fallbackId = category === 'hands' ? `visual-hands-${style === 'mercedes' ? 'mercedes' : 'baton'}` : `visual-${category}-default`;
    assets[category] = resolveVisualAssetByCategory(typeof id === 'string' ? id : undefined, category, visualAssetRegistry[fallbackId]!);
    // Legacy documents retain the main schematic; crown requires an actual part.
    visible[category] = part ? part.visible : category !== 'crown';
    transforms[category] = part?.visual?.transform;
  }
  const candidate = crownPart?.parametricGeometry;
  const crownParams = candidate?.schema === 'parametric-crown/v1' && validateParametricCrownV1(candidate).status !== 'invalid' ? candidate : undefined;
  const caseParams = casePart?.parametricGeometry?.schema === 'parametric-case/v1' ? casePart.parametricGeometry : undefined;
  return {
    caseDiameterMm: positive(assembly.globalDimensions.caseDiameterMm, 40),
    caseThicknessMm: positive(assembly.globalDimensions.totalThicknessMm, 12.5),
    caseMaterial: materialProfile(casePart, 'brushed-steel'),
    dialColor: dialPart?.color ?? assembly.selectedColorPalette.primary,
    bezelMaterial: materialProfile(bezelPart, 'polished-steel'),
    crystalMaterial: 'sapphire',
    hands: { style, material: materialProfile(handsPart, 'polished-steel') },
    crown: {
      diameterMm: positive(crownParams?.headDiameterMm, positive(crownPart?.dimensions.diameterMm, 6.5)),
      lengthMm: positive(crownParams?.headLengthMm, positive(crownPart?.dimensions.thicknessMm, 3.5)),
      material: materialProfile(crownPart, 'polished-steel'), parameters: crownParams,
      provisional: !crownParams || crownParams.provenance.status === 'provisional' || validateParametricCrownV1(crownParams).status === 'unknown'
    },
    anchors: resolveAssemblyAnchors(assembly, caseParams), visible, transforms, assets
  };
};
