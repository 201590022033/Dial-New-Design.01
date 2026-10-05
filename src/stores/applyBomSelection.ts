import { prepareBomApply } from '@/domain/configurator/bomApply';
import { crystalChoiceWarning } from '@/domain/configurator/bomChoices';
import { useWatchAssemblyStore } from './watchAssemblyStore';
import { useCatalogueStore } from './catalogueStore';
import { useSourcingStore } from './sourcingStore';
import { useConfiguratorUIStore } from './configuratorUIStore';

/** Uses the same compatibility, physical-lock and Undo path as Options Apply. */
export function applyBomSelection(partId: string, listingId?: string): string {
  const { assembly } = useWatchAssemblyStore.getState();
  const { items, supplierListings } = useCatalogueStore.getState();
  const warning = crystalChoiceWarning(assembly, items, partId);
  if (warning?.startsWith('Does not match')) throw new Error(warning);
  const listing = listingId ? supplierListings.find(l => l.id === listingId) : undefined;
  if (listingId && !listing) throw new Error('This supplier option is no longer available.');
  const candidate = prepareBomApply(assembly, partId, items, listing);
  const ui = useConfiguratorUIStore.getState();
  // A set cannot bypass a lock on one of its other central hands.
  if (candidate.sourcingIds.some(id => ui.lockedPartIds.has(id))) throw new Error('Unlock this component before applying a replacement.');
  ui.setPreview(candidate.assembly, candidate.targetId, candidate.item);
  if (!ui.applyPreview()) {
    const error = useConfiguratorUIStore.getState().previewError;
    ui.cancelPreview();
    throw new Error(error ?? 'This component could not be applied.');
  }
  for (const id of candidate.sourcingIds) useSourcingStore.getState().setSupplierSelection(id, listing?.id ?? null);
  useWatchAssemblyStore.setState({ dirty: true });
  ui.setArchetypePreview(null);
  ui.setWorkMode('parts');
  ui.selectPartContext(candidate.targetId);
  ui.setTrayTab('options');
  return `Applied ${candidate.item.displayName}. Both views updated; supplier fit remains subject to verification.`;
}
