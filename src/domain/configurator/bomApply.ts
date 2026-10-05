import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { bomChoiceGroup } from './bomChoices';

/** Explicit Apply transition; choosing a price alone never mutates the watch. */
export function prepareBomApply(assembly: WatchAssembly, partId: string, items: ComponentCatalogueItem[], listing?: SupplierListing) {
  const source = assembly.parts[partId];
  if (!source) throw new Error('This is a price-only row, not a replaceable physical component.');
  if (listing && listing.catalogueItemId !== source.catalogueItemId && listing.replacementCatalogueItemId !== source.catalogueItemId) throw new Error('The supplier option no longer matches this component.');
  if (listing?.alternativePriceNote && !listing.replacementCatalogueItemId) throw new Error('This alternative needs a mapped physical component before it can be applied.');
  const item = items.find(i => i.id === (listing?.replacementCatalogueItemId ?? source.catalogueItemId));
  if (!item || item.researchOnly) throw new Error('This component is research-only or unavailable for rendering.');
  const group = bomChoiceGroup(item.kind);
  // Renderers use the canonical crystal slot; do not leave a second active crystal.
  const targetId = group === 'crystal' && assembly.parts['inst-crystal'] ? 'inst-crystal' : partId;
  const candidate = applyCatalogueVisualSelection(assembly, targetId, item);
  candidate.parts[targetId]!.visible = true;
  if (group) {
    candidate.designConfig = { ...candidate.designConfig, bomPartSelections: { ...candidate.designConfig?.bomPartSelections, [group]: targetId } };
    for (const part of Object.values(candidate.parts)) {
      if (part.instanceId !== targetId && bomChoiceGroup(items.find(i => i.id === part.catalogueItemId)?.kind ?? '') === group) part.visible = false;
    }
  }
  const refs = candidate.designConfig?.visualReferenceConfig;
  candidate.designConfig = { ...candidate.designConfig, visualReferenceConfig: {
    ...refs, ...(listing?.caseFinish ? { caseFinish: listing.caseFinish } : {}),
    ...(item.kind === 'hand-set' ? { handsFinish: listing?.handsFinish ?? 'auto', handsColor: listing?.handsColor } : {})
  } };
  if (item.kind === 'hand-set') for (const id of ['inst-hour-hand', 'inst-minute-hand', 'inst-central-seconds']) {
    if (candidate.parts[id]) candidate.parts[id].color = listing?.handsColor ?? '#d1d5db';
  }
  const sourcingIds = item.kind === 'hand-set' ? ['inst-hour-hand', 'inst-minute-hand', 'inst-central-seconds'].filter(id => candidate.parts[id]) : [targetId];
  return { assembly: candidate, item, targetId, sourcingIds };
}
