import { create } from 'zustand';
import {
  createSupplierWorkspaceBackup,
  prepareSupplierWorkspaceRestore,
  type SupplierWorkspaceBackup,
  type SupplierWorkspaceCounts,
  type PreparedSupplierWorkspaceRestore
} from '@/services/supplierWorkspaceBackup';
import {
  emptySupplierDraftSnapshot,
  validateSupplierDraftSnapshot
} from '@/services/supplierDraftPersistence';
import { emptySupplierReviewSnapshot } from '@/services/supplierReviewPersistence';
import {
  loadSupplierWorkspace,
  restoreSupplierWorkspaceAtomic,
  type SupplierWorkspaceRaw
} from '@/services/supplierWorkspacePersistence';
import { useSupplierReviewStore, validateSupplierReviewSnapshot } from './supplierReviewStore';
interface WorkspaceDependencies {
  load: () => Promise<SupplierWorkspaceRaw>;
  write: typeof restoreSupplierWorkspaceAtomic;
  refresh: () => Promise<boolean>;
}
export interface SupplierWorkspaceStoreState {
  initialized: boolean;
  busy: boolean;
  error: string | null;
  message: string;
  preparedRestore: (SupplierWorkspaceCounts & { outcome: 'restore' | 'duplicate' }) | null;
  initialize: () => Promise<boolean>;
  exportBackup: () => Promise<SupplierWorkspaceBackup | null>;
  prepareRestore: (input: unknown) => Promise<boolean>;
  restore: () => Promise<boolean>;
  cancelRestore: () => void;
}
export function createSupplierWorkspaceStore(deps: WorkspaceDependencies) {
  return create<SupplierWorkspaceStoreState>((set, get) => {
    let chain: Promise<unknown> = Promise.resolve();
    let prepared: {
      data: PreparedSupplierWorkspaceRestore;
      expected: { queue: number; review: number };
    } | null = null;
    const run = <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
      const next = chain.then(async () => {
        set({ busy: true, error: null });
        try {
          return await operation();
        } catch (cause) {
          set({
            error: cause instanceof Error ? cause.message : 'Supplier workspace operation failed.'
          });
          return fallback;
        } finally {
          set({ busy: false });
        }
      });
      chain = next.catch(() => undefined);
      return next;
    };
    const current = async () => {
      const raw = await deps.load();
      const queue =
        raw.queue === null
          ? emptySupplierDraftSnapshot()
          : await validateSupplierDraftSnapshot(raw.queue);
      const review =
        raw.review === null
          ? emptySupplierReviewSnapshot()
          : validateSupplierReviewSnapshot(raw.review, queue.records);
      return { queue, review };
    };
    return {
      initialized: false,
      busy: false,
      error: null,
      message: '',
      preparedRestore: null,
      initialize: () =>
        run(async () => {
          await current();
          if (!(await deps.refresh()))
            throw new Error(
              'Saved supplier data could not refresh the catalogue. Reload before continuing.'
            );
          set({ initialized: true, message: 'Supplier workspace loaded.' });
          return true;
        }, false),
      exportBackup: () =>
        run(
          async () => {
            const { queue, review } = await current();
            const backup = await createSupplierWorkspaceBackup(queue, review);
            set({
              initialized: true,
              message: 'Complete backup prepared with evidence and review history.'
            });
            return backup;
          },
          null as SupplierWorkspaceBackup | null
        ),
      prepareRestore: (input) =>
        run(async () => {
          prepared = null;
          set({ preparedRestore: null });
          const { queue, review } = await current();
          const data = await prepareSupplierWorkspaceRestore({
            currentQueue: queue,
            currentReview: review,
            backup: input
          });
          prepared = { data, expected: { queue: queue.generation, review: review.generation } };
          set({
            initialized: true,
            preparedRestore: { ...data.counts, outcome: data.outcome },
            message:
              data.outcome === 'duplicate'
                ? 'This backup already matches your saved workspace.'
                : 'Backup validated; no data has been restored.'
          });
          return true;
        }, false),
      restore: () =>
        run(async () => {
          const ticket = prepared;
          if (!ticket || !get().preparedRestore)
            throw new Error('Prepare a supplier backup before restoring.');
          const latest = await current();
          if (
            latest.queue.generation !== ticket.expected.queue ||
            latest.review.generation !== ticket.expected.review
          ) {
            prepared = null;
            set({ preparedRestore: null });
            throw new Error(
              'Supplier workspace changed after preparation. Prepare the backup again.'
            );
          }
          if (ticket.data.outcome === 'restore')
            await deps.write(ticket.data.queue, ticket.data.review, ticket.expected);
          prepared = null;
          set({
            preparedRestore: null,
            message:
              ticket.data.outcome === 'duplicate'
                ? 'Existing supplier workspace already matches; no duplicate data was added.'
                : 'Supplier workspace and review history restored together.'
          });
          if (!(await deps.refresh()))
            throw new Error(
              'Restore was saved, but the live catalogue could not refresh. Reload the app to display it.'
            );
          return true;
        }, false),
      cancelRestore: () => {
        prepared = null;
        set({
          preparedRestore: null,
          message: 'Prepared restore cancelled; saved data was not changed.'
        });
      }
    };
  });
}
export const useSupplierWorkspaceStore = createSupplierWorkspaceStore({
  load: loadSupplierWorkspace,
  write: restoreSupplierWorkspaceAtomic,
  refresh: () => useSupplierReviewStore.getState().initialize(true)
});
