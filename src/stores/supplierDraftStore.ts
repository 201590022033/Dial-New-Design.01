import { create } from 'zustand';
import {
  createIndexedDbSupplierDraftPersistence, createSupplierDraftBackup, emptySupplierDraftSnapshot,
  mergeSupplierIntake, parseSupplierDraftBackup, validateSupplierDraftSnapshot,
  type SupplierDraftBackup, type SupplierDraftPersistence, type SupplierDraftQueueEntry,
  type SupplierDraftSnapshot, type SupplierEvidenceAsset, type SupplierEvidenceAssetInput
} from '@/services/supplierDraftPersistence';

export interface SupplierDraftStoreState {
  readonly initialized: boolean;
  readonly busy: boolean;
  readonly records: readonly SupplierDraftQueueEntry[];
  readonly assets: readonly SupplierEvidenceAsset[];
  readonly generation: number;
  readonly error: string | null;
  readonly warning: string | null;
  readonly lastSavedId: string | null;
  readonly lastOutcome: 'saved' | 'duplicate' | null;
  initialize: (force?: boolean) => Promise<boolean>;
  save: (record: unknown, assets?: readonly SupplierEvidenceAssetInput[]) => Promise<boolean>;
  importBackup: (input: unknown) => Promise<boolean>;
  exportBackup: () => Promise<SupplierDraftBackup | null>;
}
const localWarning = 'Supplier drafts are saved in this browser profile for this site. They are separate from your watch project. Export a backup to move them or keep an extra copy.';
const errorMessage = (cause: unknown): string => cause instanceof Error ? cause.message : 'Local supplier queue operation failed. Nothing new was saved.';

/** Inject the persistence boundary in tests; all production writes remain IndexedDB transactions. */
export function createSupplierDraftStore(persistence: SupplierDraftPersistence) {
  return create<SupplierDraftStoreState>((set, get) => {
    let operations: Promise<unknown> = Promise.resolve();
    const run = <T,>(operation: () => Promise<T>, fallback: T): Promise<T> => {
      const next = operations.then(async () => {
        set({ busy: true, error: null, lastOutcome: null });
        try { return await operation(); }
        catch (cause) { set({ error: errorMessage(cause), lastOutcome: null }); return fallback; }
        finally { set({ busy: false }); }
      });
      operations = next.catch(() => undefined);
      return next;
    };
    const current = (): SupplierDraftSnapshot => {
      if (!get().initialized) throw new Error('Open and successfully load the supplier queue before saving. A damaged queue cannot be overwritten.');
      return { schema: 'dial-designer/supplier-intake-queue/v1', generation: get().generation, records: get().records, assets: get().assets };
    };
    const commit = async (snapshot: SupplierDraftSnapshot, expectedGeneration: number): Promise<void> => {
      await persistence.save(snapshot, expectedGeneration);
      set({ generation: snapshot.generation, records: snapshot.records, assets: snapshot.assets });
    };
    return {
      initialized: false, busy: false, records: [], assets: [], generation: 0, error: null, warning: null, lastSavedId: null, lastOutcome: null,
      initialize: (force = false) => run(async () => {
        if (get().initialized && !force) return true;
        set({ initialized: false });
        const raw = await persistence.load();
        const snapshot = raw === null ? emptySupplierDraftSnapshot() : await validateSupplierDraftSnapshot(raw);
        set({ initialized: true, records: snapshot.records, assets: snapshot.assets, generation: snapshot.generation, warning: localWarning, lastSavedId: null });
        return true;
      }, false),
      save: (record, assets = []) => run(async () => {
        const before = current();
        const merged = await mergeSupplierIntake(before, record, assets);
        if (!merged.duplicate) await commit(merged.snapshot, before.generation);
        set({ lastSavedId: merged.entryId, lastOutcome: merged.duplicate ? 'duplicate' : 'saved', warning: localWarning });
        return true;
      }, false),
      importBackup: input => run(async () => {
        const before = current();
        const backup = await parseSupplierDraftBackup(input);
        let next = before;
        let entryId: string | null = null;
        for (const entry of backup.records) {
          for (const version of entry.versions) {
            const assets = version.assetIds.map(id => backup.assets.find(asset => asset.id === id)!);
            const merged = await mergeSupplierIntake(next, version.record, assets);
            next = merged.snapshot;
            entryId = merged.entryId;
          }
        }
        const duplicate = next === before;
        // One transaction persists every imported capture and asset; partial imports never appear saved.
        if (!duplicate) await commit({ ...next, generation: before.generation + 1 }, before.generation);
        set({ lastSavedId: entryId, lastOutcome: duplicate ? 'duplicate' : 'saved', warning: localWarning });
        return true;
      }, false),
      exportBackup: () => run(async () => createSupplierDraftBackup(current()), null as SupplierDraftBackup | null)
    };
  });
}

export const useSupplierDraftStore = createSupplierDraftStore(createIndexedDbSupplierDraftPersistence());
