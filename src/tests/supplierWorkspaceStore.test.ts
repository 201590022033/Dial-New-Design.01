import { describe, expect, it } from 'vitest';
import { createSupplierWorkspaceStore } from '@/stores/supplierWorkspaceStore';
import { createSupplierWorkspaceBackup } from '@/services/supplierWorkspaceBackup';
import {
  emptySupplierDraftSnapshot,
  mergeSupplierIntake
} from '@/services/supplierDraftPersistence';
import { emptySupplierReviewSnapshot } from '@/services/supplierReviewPersistence';
import { createManualSupplierIntake } from '@/domain/design-first/supplierIntake';
import type { SupplierWorkspaceRaw } from '@/services/supplierWorkspacePersistence';
async function setup() {
  const record = createManualSupplierIntake({
    supplierId: 'Release test',
    productId: 'Crystal',
    variant: '31.5mm',
    sourceUrl: 'https://example.com/test-crystal',
    capturedAt: '2026-10-13T10:00:00Z',
    slot: 'crystal',
    sourceText: 'Retained test source'
  });
  const queue = (await mergeSupplierIntake(emptySupplierDraftSnapshot(), record)).snapshot;
  const backup = await createSupplierWorkspaceBackup(queue, emptySupplierReviewSnapshot());
  let raw: SupplierWorkspaceRaw = { queue: null, review: null },
    writes = 0,
    fail = false;
  const store = createSupplierWorkspaceStore({
    load: () => Promise.resolve(structuredClone(raw)),
    write: (nextQueue, nextReview, expected) => {
      const q = raw.queue as typeof nextQueue | null,
        r = raw.review as typeof nextReview | null;
      if (fail) return Promise.reject(new Error('Disk full'));
      if ((q?.generation ?? 0) !== expected.queue || (r?.generation ?? 0) !== expected.review)
        return Promise.reject(new Error('Conflict'));
      raw = structuredClone({ queue: nextQueue, review: nextReview });
      writes++;
      return Promise.resolve();
    },
    refresh: () => Promise.resolve(true)
  });
  return {
    store,
    backup,
    getRaw: () => raw,
    writes: () => writes,
    fail: () => {
      fail = true;
    },
    change: () => {
      raw = { queue: { ...emptySupplierDraftSnapshot(), generation: 1 }, review: null };
    }
  };
}
describe('DF7 atomic supplier workspace orchestration', () => {
  it('prepares without writing and restores both documents with source assets once', async () => {
    const { store, backup, getRaw, writes } = await setup();
    expect(await store.getState().prepareRestore(backup)).toBe(true);
    expect(writes()).toBe(0);
    expect(store.getState().preparedRestore?.evidenceCount).toBe(2);
    expect(await store.getState().restore()).toBe(true);
    expect(writes()).toBe(1);
    expect(getRaw()).toMatchObject({
      queue: { generation: 1, records: [{}] },
      review: { generation: 1, events: [] }
    });
    expect(await store.getState().prepareRestore(backup)).toBe(true);
    expect(store.getState().preparedRestore?.outcome).toBe('duplicate');
    expect(await store.getState().restore()).toBe(true);
    expect(writes()).toBe(1);
    const exported = await store.getState().exportBackup();
    expect(exported?.draftBackup).toEqual(backup.draftBackup);
    expect(exported?.reviewSnapshot.events).toEqual(backup.reviewSnapshot.events);
  });
  it('cancels preparation without changing saved data', async () => {
    const { store, backup, writes, getRaw } = await setup();
    await store.getState().prepareRestore(backup);
    store.getState().cancelRestore();
    expect(await store.getState().restore()).toBe(false);
    expect(writes()).toBe(0);
    expect(getRaw()).toEqual({ queue: null, review: null });
  });
  it('retains both original documents when persistence fails', async () => {
    const { store, backup, fail, writes, getRaw } = await setup();
    await store.getState().prepareRestore(backup);
    fail();
    expect(await store.getState().restore()).toBe(false);
    expect(writes()).toBe(0);
    expect(getRaw()).toEqual({ queue: null, review: null });
    expect(store.getState().error).toContain('Disk full');
  });
  it('refuses a stale prepared restore and requires fresh preparation', async () => {
    const { store, backup, change, writes } = await setup();
    await store.getState().prepareRestore(backup);
    change();
    expect(await store.getState().restore()).toBe(false);
    expect(writes()).toBe(0);
    expect(store.getState().preparedRestore).toBeNull();
    expect(store.getState().error).toContain('changed after preparation');
  });
});
