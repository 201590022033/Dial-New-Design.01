import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { visualAssetRegistry, resolveVisualAsset, type VisualAssetDescriptor } from './visualAssetRegistry';

export type VisualWatchModel = {
  caseDiameterMm: number;
  caseThicknessMm: number;
  caseMaterial: string;
  dialColor: string;
  bezelMaterial: string;
  crystalMaterial: string;
  hands: { style: 'baton' | 'mercedes' | 'needle'; material: string };
  assets: Record<'case' | 'dial' | 'bezel' | 'crystal' | 'hands', VisualAssetDescriptor>;
};

const materialProfile = (part: WatchAssembly['parts'][string] | undefined, fallback: string) => {
  const value = `${part?.texture ?? ''} ${part?.material ?? ''}`.toLowerCase();
  if (value.includes('black') || value.includes('pvd')) return 'black-pvd';
  if (value.includes('brush')) return 'brushed-steel';
  if (value.includes('polish')) return 'polished-steel';
  if (value.includes('brass')) return 'brass';
  return fallback;
};

export const watchAssemblyToVisualModel = (assembly: WatchAssembly): VisualWatchModel => {
  const parts = Object.values(assembly.parts);
  const find = (category: string, kind?: string) => parts.find((part) => part.category === category && (!kind || part.name.toLowerCase().includes(kind)));
  const casePart = find('case');
  const dialPart = find('dial');
  const bezelPart = find('rings');
  const crystalPart = parts.find((part) => part.name.toLowerCase().includes('crystal'));
  const handsPart = find('hands');
  const handValue = `${handsPart?.name ?? ''} ${handsPart?.texture ?? ''}`.toLowerCase();
  const declaredStyle = handsPart?.customProperties?.visualHandStyle;
  const style = declaredStyle === 'mercedes' || handValue.includes('mercedes')
    ? 'mercedes'
    : declaredStyle === 'needle' || handValue.includes('needle')
      ? 'needle'
      : 'baton';

  return {
    caseDiameterMm: assembly.globalDimensions.caseDiameterMm,
    caseThicknessMm: assembly.globalDimensions.totalThicknessMm,
    caseMaterial: materialProfile(casePart, 'brushed-steel'),
    dialColor: dialPart?.color ?? assembly.selectedColorPalette.primary,
    bezelMaterial: materialProfile(bezelPart, 'polished-steel'),
    crystalMaterial: 'sapphire',
    hands: { style, material: materialProfile(handsPart, 'polished-steel') },
    assets: {
      case: resolveVisualAsset(casePart?.customProperties?.visualAssetId as string | undefined, visualAssetRegistry['visual-case-default']!),
      dial: resolveVisualAsset(dialPart?.customProperties?.visualAssetId as string | undefined, visualAssetRegistry['visual-dial-default']!),
      bezel: resolveVisualAsset(bezelPart?.customProperties?.visualAssetId as string | undefined, visualAssetRegistry['visual-bezel-default']!),
      crystal: resolveVisualAsset(crystalPart?.customProperties?.visualAssetId as string | undefined, visualAssetRegistry['visual-crystal-default']!),
      hands: resolveVisualAsset(style === 'mercedes' ? 'visual-hands-mercedes' : 'visual-hands-baton', visualAssetRegistry['visual-hands-baton']!)
    }
  };
};
