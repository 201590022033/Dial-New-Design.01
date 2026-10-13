import { create } from 'zustand';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { DesignBriefV1, DesignMatchResultV1 } from '@/domain/design-first/designBrief';
import type { DesignIntentV1 } from '@/domain/design-first/designIntent';
import { readDesignIntent } from '@/domain/design-first/designIntent';
import { captureDesignBrief, designAssemblyIdentity } from '@/domain/design-first/designBriefExtraction';
import { searchDesignParts } from '@/domain/design-first/searchDesignParts';
import { prepareDesignPartTransition } from '@/domain/design-first/designPartTransition';
import { useWatchAssemblyStore } from './watchAssemblyStore';
import { useCatalogueStore } from './catalogueStore';
import { useConfiguratorUIStore } from './configuratorUIStore';

type PreparedTransition = ReturnType<typeof prepareDesignPartTransition>;
export interface DesignPreviewTicket {
  readonly candidateId: string;
  readonly changes: PreparedTransition['changes'];
  readonly result: DesignMatchResultV1;
  readonly baseIdentity: string;
  /** Ownership reference only. Apply always rebuilds from the latest canonical assembly. */
  readonly previewAssembly: WatchAssembly;
  readonly candidateSignature: string;
  readonly savedIntentSignature: string;
}
export interface DesignMatchingStoreState {
  readonly brief: DesignBriefV1 | null;
  readonly intent: DesignIntentV1 | null;
  readonly results: readonly DesignMatchResultV1[];
  readonly targetLabel: string;
  readonly error: string | null;
  readonly status: 'idle' | 'searched' | 'previewing' | 'applied';
  readonly previewTicket: DesignPreviewTicket | null;
  readonly chosenSupplierListingId: string | null;
  readonly chosenSupplierSignature: string | null;
  search: (targetId: string, intent: DesignIntentV1) => boolean;
  preview: (candidateId: string) => boolean;
  apply: () => boolean;
  selectSupplier: (id: string | null) => boolean;
  cancel: () => void;
  clear: () => void;
}

const signature = (value: unknown): string => JSON.stringify(value, (_key, entry: unknown) =>
  entry && typeof entry === 'object' && !Array.isArray(entry)
    ? Object.fromEntries(Object.entries(entry).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)) : entry) ?? 'undefined';
const errorMessage = (cause: unknown): string => cause instanceof Error ? cause.message : 'Could not complete this design choice.';
const initialState = {
  brief: null, intent: null, results: [], targetLabel: '', error: null,
  status: 'idle' as const, previewTicket: null, chosenSupplierListingId: null, chosenSupplierSignature: null
};
const ownsTicket = (ticket: DesignPreviewTicket | null): boolean => {
  const ui = useConfiguratorUIStore.getState();
  return Boolean(ticket && ui.previewOrigin === 'design-matching' && ui.previewAssembly === ticket.previewAssembly && ui.previewCandidateItem?.id === ticket.candidateId);
};
const releaseOwnedPreview = (ticket: DesignPreviewTicket | null): void => {
  if (!ownsTicket(ticket)) return;
  useConfiguratorUIStore.setState({ previewAssembly: null, previewCandidateItem: null, previewPartInstanceId: null, previewStatus: 'none', previewError: null, previewOrigin: null });
};
const comparableResult = (result: DesignMatchResultV1): unknown => ({ group: result.group, reasons: result.reasons, adjustments: result.adjustments });

/** All search/preview state is transient. Only explicit Apply calls the authored commit action. */
export const useDesignMatchingStore = create<DesignMatchingStoreState>((set, get) => ({
  ...initialState,
  search: (targetId, intent) => {
    releaseOwnedPreview(get().previewTicket);
    try {
      const assembly = useWatchAssemblyStore.getState().assembly;
      const { items, supplierListings } = useCatalogueStore.getState();
      const brief = captureDesignBrief(assembly, targetId, items, intent);
      const results = searchDesignParts({ assembly, brief, items, supplierListings, intent });
      set({ brief, intent: { ...intent }, results, targetLabel: assembly.parts[targetId]?.name ?? targetId, error: null,
        status: 'searched', previewTicket: null, chosenSupplierListingId: null, chosenSupplierSignature: null });
      return true;
    } catch (cause) {
      set({ ...initialState, error: errorMessage(cause) });
      return false;
    }
  },
  preview: candidateId => {
    try {
      const { brief, intent, previewTicket } = get();
      if (!brief || !intent) throw new Error('Find parts for this design before previewing a candidate.');
      const ui = useConfiguratorUIStore.getState();
      if (ui.archetypePreviewAssembly || ui.previewingVersionId || (ui.previewAssembly && !ownsTicket(previewTicket))) throw new Error('Finish or cancel the other preview before previewing this part.');
      const assembly = useWatchAssemblyStore.getState().assembly;
      const { items, supplierListings } = useCatalogueStore.getState();
      const candidate = items.find(item => item.id === candidateId);
      if (!candidate) throw new Error('This candidate is no longer in the catalogue. Search again.');
      const prepared = prepareDesignPartTransition({ assembly, brief, candidateId, items, supplierListings, intent,
        lockedPartIds: ui.lockedPartIds, lockedStyles: ui.lockedStyles });
      const ticket: DesignPreviewTicket = {
        candidateId, changes: prepared.changes, result: prepared.result, baseIdentity: brief.assembly.identityToken,
        previewAssembly: prepared.assembly, candidateSignature: signature(candidate), savedIntentSignature: signature(readDesignIntent(assembly))
      };
      useConfiguratorUIStore.setState({ previewAssembly: prepared.assembly, previewCandidateItem: candidate,
        previewPartInstanceId: brief.target.partInstanceId, previewStatus: 'previewing', previewError: null, previewOrigin: 'design-matching' });
      set({ previewTicket: ticket, chosenSupplierListingId: null, chosenSupplierSignature: null, status: 'previewing', error: null });
      return true;
    } catch (cause) {
      releaseOwnedPreview(get().previewTicket);
      set({ previewTicket: null, chosenSupplierListingId: null, chosenSupplierSignature: null, status: get().brief ? 'searched' : 'idle', error: errorMessage(cause) });
      return false;
    }
  },
  selectSupplier: id => {
    try {
      const ticket = get().previewTicket;
      if (!ticket || !ownsTicket(ticket)) throw new Error('Preview a part before choosing its supplier offer.');
      const listing = id === null ? null : useCatalogueStore.getState().supplierListings.find(offer => offer.id === id);
      if (id !== null && (!listing || listing.catalogueItemId !== ticket.candidateId)) throw new Error('Choose an offer for the previewed part.');
      set({ chosenSupplierListingId: id, chosenSupplierSignature: listing ? signature(listing) : null, error: null });
      return true;
    } catch (cause) { set({ error: errorMessage(cause) }); return false; }
  },
  apply: () => {
    try {
      const { brief, intent, previewTicket: ticket, chosenSupplierListingId, chosenSupplierSignature } = get();
      if (!brief || !intent || !ticket || !ownsTicket(ticket)) throw new Error('Preview this part again before applying it.');
      const ui = useConfiguratorUIStore.getState();
      if (ui.archetypePreviewAssembly || ui.previewingVersionId) throw new Error('Finish the other preview before applying this part.');
      const assembly = useWatchAssemblyStore.getState().assembly;
      const { items, supplierListings } = useCatalogueStore.getState();
      if (assembly.metadata.id !== brief.assembly.id || assembly.parts[brief.target.partInstanceId]?.catalogueItemId !== brief.target.catalogueItemId) throw new Error('The original target has changed. Search and preview again.');
      const candidate = items.find(item => item.id === ticket.candidateId);
      if (!candidate || signature(candidate) !== ticket.candidateSignature) throw new Error('The candidate record has changed. Search and preview again.');
      if (signature(readDesignIntent(assembly)) !== ticket.savedIntentSignature) throw new Error('Saved design preferences changed. Search and preview again.');
      const currentBrief = captureDesignBrief(assembly, brief.target.partInstanceId, items, intent);
      if (signature(currentBrief.selectedCase) !== signature(brief.selectedCase)) throw new Error('The selected case has changed. Search and preview again.');
      const prepared = prepareDesignPartTransition({ assembly, brief: currentBrief, candidateId: ticket.candidateId, items, supplierListings, intent,
        lockedPartIds: ui.lockedPartIds, lockedStyles: ui.lockedStyles });
      if (signature(prepared.changes) !== signature(ticket.changes) || signature(comparableResult(prepared.result)) !== signature(comparableResult(ticket.result))) {
        throw new Error('The proposed changes or fit evidence changed. Preview again before applying.');
      }
      const updates: Record<string, string | null> = Object.fromEntries(prepared.changedPartIds.map(id => [id, null]));
      updates[brief.target.partInstanceId] = null;
      if (chosenSupplierListingId !== null) {
        const offer = supplierListings.find(listing => listing.id === chosenSupplierListingId);
        if (!offer || offer.catalogueItemId !== ticket.candidateId || signature(offer) !== chosenSupplierSignature) throw new Error('The chosen supplier offer changed. Preview and choose the offer again.');
        updates[brief.target.partInstanceId] = chosenSupplierListingId;
      }
      useWatchAssemblyStore.getState().commitDesignMatch(prepared.assembly, updates);
      releaseOwnedPreview(ticket);
      set({ previewTicket: null, chosenSupplierListingId: null, chosenSupplierSignature: null, status: 'applied', error: null });
      return true;
    } catch (cause) {
      releaseOwnedPreview(get().previewTicket);
      set({ previewTicket: null, chosenSupplierListingId: null, chosenSupplierSignature: null, status: get().brief ? 'searched' : 'idle', error: errorMessage(cause) });
      return false;
    }
  },
  cancel: () => {
    releaseOwnedPreview(get().previewTicket);
    set({ previewTicket: null, chosenSupplierListingId: null, chosenSupplierSignature: null, status: get().brief ? 'searched' : 'idle', error: null });
  },
  clear: () => { releaseOwnedPreview(get().previewTicket); set(initialState); }
}));

/** Shared preview integration can use this guard to avoid the legacy clone-commit path. */
export const ownsDesignMatchingPreview = (): boolean => ownsTicket(useDesignMatchingStore.getState().previewTicket);

export const designMatchingSearchIsStale = (): boolean => {
  const { brief, intent } = useDesignMatchingStore.getState();
  return Boolean(brief && intent && brief.assembly.identityToken !== designAssemblyIdentity(useWatchAssemblyStore.getState().assembly, intent, useCatalogueStore.getState().items));
};

// History navigation and document loads can end a shared preview outside this panel.
useConfiguratorUIStore.subscribe(() => {
  const state = useDesignMatchingStore.getState();
  if (state.previewTicket && !ownsTicket(state.previewTicket)) useDesignMatchingStore.setState({ previewTicket: null, chosenSupplierListingId: null, chosenSupplierSignature: null, status: state.brief ? 'searched' : 'idle' });
});
