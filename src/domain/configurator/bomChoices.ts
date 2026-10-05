import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';

/** Procurement slots are independent of viewport visibility. Never buy four crystals. */
export const bomChoiceGroup = (kind: string): string | undefined => {
  if (kind === 'crystal' || kind.includes('sapphire')) return 'crystal';
  if (kind === 'midcase' || kind === 'case') return 'case';
  if (kind === 'dial-blank') return 'dial';
  if (kind === 'strap-integration' || kind === 'bracelet-integration') return 'strap';
  return undefined;
};

export const resolveBomChoices = (assembly: WatchAssembly, items: ComponentCatalogueItem[]) => {
  const groups = new Map<string, string[]>();
  for (const part of Object.values(assembly.parts)) {
    const group = bomChoiceGroup(items.find(i => i.id === part.catalogueItemId)?.kind ?? '');
    if (group) groups.set(group, [...(groups.get(group) ?? []), part.instanceId]);
  }
  return Object.fromEntries([...groups].map(([group, ids]) => {
    const saved = assembly.designConfig?.bomPartSelections?.[group];
    const canonical = ids.find(id => id === `inst-${group}`);
    return [group, ids.includes(saved ?? '') ? saved! : canonical ?? ids.find(id => assembly.parts[id]?.visible) ?? ids[0]!];
  }));
};

export const crystalChoiceWarning = (assembly: WatchAssembly, items: ComponentCatalogueItem[], partId: string): string | undefined => {
  const part = assembly.parts[partId];
  const item = items.find(i => i.id === part?.catalogueItemId);
  if (bomChoiceGroup(item?.kind ?? '') !== 'crystal') return undefined;
  const casePart = assembly.parts[resolveBomChoices(assembly, items).case ?? ''];
  const caseItem = items.find(i => i.id === casePart?.catalogueItemId);
  const seat = caseItem?.engineeringSpecs?.case?.crystalSeatDiameterMm;
  if (!seat || caseItem?.status !== 'verified') return 'Fit unverified — confirm seat diameter, gasket and clearance before buying.';
  if (Math.abs((part?.dimensions.diameterMm ?? 0) - seat) > .05) return 'Does not match verified case crystal-seat diameter.';
  return 'Diameter matches; gasket, thickness and clearance still need verification.';
};
