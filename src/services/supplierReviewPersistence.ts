import { loadSupplierWorkspace, saveSupplierWorkspacePart } from './supplierWorkspacePersistence';
import type { SupplierPublication, SupplierReviewEvent } from '@/domain/design-first/supplierReview';
export type SupplierReviewJournalEvent =
  | { readonly id: string; readonly kind: 'review'; readonly review: SupplierReviewEvent }
  | { readonly id: string; readonly kind: 'publish'; readonly entryId: string; readonly revisionId: string; readonly reviewEventId: string; readonly actor: string; readonly reason: string; readonly at: string; readonly publication: SupplierPublication }
  | { readonly id: string; readonly kind: 'withdraw'; readonly entryId: string; readonly actor: string; readonly reason: string; readonly at: string };
export interface SupplierReviewSnapshot { readonly schema: 'dial-designer/supplier-review-journal/v1'; readonly generation: number; readonly events: readonly SupplierReviewJournalEvent[] }
export interface SupplierReviewPersistence { load: () => Promise<unknown>; save: (snapshot: SupplierReviewSnapshot, expectedGeneration: number) => Promise<void> }
export const emptySupplierReviewSnapshot = (): SupplierReviewSnapshot => ({schema:'dial-designer/supplier-review-journal/v1',generation:0,events:[]});
export function createIndexedDbSupplierReviewPersistence(): SupplierReviewPersistence {
  return { load: async () => (await loadSupplierWorkspace()).review,
    save: (snapshot, expectedGeneration) => saveSupplierWorkspacePart('review', snapshot, expectedGeneration) };
}
