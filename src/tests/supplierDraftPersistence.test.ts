import { describe, expect, it } from 'vitest';
import { createSupplierDraftStore } from '@/stores/supplierDraftStore';
import { createManualSupplierIntake } from '@/domain/design-first/supplierIntake';
import { emptySupplierDraftSnapshot, type SupplierDraftPersistence, type SupplierDraftSnapshot } from '@/services/supplierDraftPersistence';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
const capture = (variant: string | null = 'steel', sourceText = 'Case diameter: 40 mm') => createManualSupplierIntake({supplierId:'Test supplier',productId:'Case-40',variant,sourceUrl:'https://example.com/case',capturedAt:'2026-10-13T00:00:00+02:00',slot:'case',sourceText});
const memory = () => {
  let saved: unknown = null;
  let fail = false;
  const persistence: SupplierDraftPersistence = {
    load: () => Promise.resolve(structuredClone(saved)),
    save: async (next, expected) => { await Promise.resolve(); if (fail) throw new Error('Quota exceeded'); if ((saved as SupplierDraftSnapshot | null)?.generation !== expected && !(saved === null && expected === 0)) throw new Error('Queue changed in another tab'); saved = structuredClone(next); }
  };
  return {persistence,failWrites:()=>{fail=true;},corrupt:()=>{saved={schema:'broken'};}};
};
describe('durable supplier queue', () => {
  it('survives a fresh store with source text, raw capture and local evidence bytes', async () => {
    const db=memory(), first=createSupplierDraftStore(db.persistence), record=capture();
    await first.getState().initialize();
    expect(await first.getState().save(record,[{sourceId:record.draft.sources[0]!.id,name:'drawing.pdf',kind:'drawing',blob:new Blob(['%PDF-test'],{type:'application/pdf'})}])).toBe(true);
    await first.getState().save(record);
    expect(first.getState().lastOutcome).toBe('duplicate');
    expect(first.getState().records[0]?.versions).toHaveLength(1);
    const restarted=createSupplierDraftStore(db.persistence);
    expect(await restarted.getState().initialize()).toBe(true);
    expect(restarted.getState().records).toEqual(first.getState().records);
    expect(await restarted.getState().assets.find(asset=>asset.name==='drawing.pdf')?.blob.text()).toBe('%PDF-test');
    expect(restarted.getState().assets.map(asset=>asset.kind)).toEqual(expect.arrayContaining(['source-json','source-text','drawing']));
  });
  it('deduplicates exact repeats, retains changed capture revisions, and isolates unknown variants', async () => {
    const store=createSupplierDraftStore(memory().persistence);await store.getState().initialize();
    await store.getState().save(capture());const generation=store.getState().generation;
    await store.getState().save(capture());expect(store.getState().lastOutcome).toBe('duplicate');expect(store.getState().generation).toBe(generation);
    await store.getState().save(capture('steel','Different source text'));expect(store.getState().records[0]?.versions).toHaveLength(2);
    await store.getState().save(capture('black'));await store.getState().save(capture(null));await store.getState().save(capture(null,'Different unknown capture'));
    expect(store.getState().records).toHaveLength(4);
  });
  it('round-trips a portable backup including actual assets without duplicating the queue', async () => {
    const store=createSupplierDraftStore(memory().persistence);await store.getState().initialize();await store.getState().save(capture());
    const backup=await store.getState().exportBackup();expect(backup?.assets[0]?.dataBase64).toBeTruthy();
    const restored=createSupplierDraftStore(memory().persistence);await restored.getState().initialize();
    expect(await restored.getState().importBackup(JSON.parse(JSON.stringify(backup)))).toBe(true);
    expect(restored.getState().records).toHaveLength(1);expect(await restored.getState().assets[0]!.blob.text()).toBe(await store.getState().assets[0]!.blob.text());
    await restored.getState().importBackup(backup);expect(restored.getState().lastOutcome).toBe('duplicate');
  });
  it('never claims a failed write or invalid attachment was saved', async () => {
    const db=memory(),store=createSupplierDraftStore(db.persistence);await store.getState().initialize();db.failWrites();
    expect(await store.getState().save(capture())).toBe(false);expect(store.getState().records).toEqual([]);expect(store.getState().lastOutcome).toBeNull();
    const valid=createSupplierDraftStore(memory().persistence);await valid.getState().initialize();
    expect(await valid.getState().save(capture(),[{sourceId:'wrong',name:'unsafe.svg',kind:'image',blob:new Blob(['<svg/>'],{type:'image/svg+xml'})}])).toBe(false);
    expect(valid.getState().records).toEqual([]);
  });
  it('detects stale multi-tab writes and supports reloading before retry', async () => {
    const db=memory(),a=createSupplierDraftStore(db.persistence),b=createSupplierDraftStore(db.persistence);await a.getState().initialize();await b.getState().initialize();
    await a.getState().save(capture('steel'));expect(await b.getState().save(capture('black'))).toBe(false);
    expect(b.getState().records).toEqual([]);await b.getState().initialize(true);expect(await b.getState().save(capture('black'))).toBe(true);expect(b.getState().records).toHaveLength(2);
  });
  it('blocks corrupt hydration and refuses tampered backups without partial saving', async () => {
    const db=memory();db.corrupt();const corrupt=createSupplierDraftStore(db.persistence);expect(await corrupt.getState().initialize()).toBe(false);expect(await corrupt.getState().save(capture())).toBe(false);
    const store=createSupplierDraftStore(memory().persistence);await store.getState().initialize();await store.getState().save(capture());const backup=await store.getState().exportBackup();
    const target=createSupplierDraftStore(memory().persistence);await target.getState().initialize();
    expect(await target.getState().importBackup({...backup,assets:backup!.assets.map(asset=>({...asset,dataBase64:btoa('tampered')}))})).toBe(false);expect(target.getState().records).toEqual([]);
  });
  it('serializes saves and leaves assembly, sourcing and live catalogue unchanged', async () => {
    const before=JSON.stringify([useWatchAssemblyStore.getState().assembly,useSourcingStore.getState().sourcingPlan,useCatalogueStore.getState().items,useCatalogueStore.getState().supplierListings]);
    const store=createSupplierDraftStore(memory().persistence);await store.getState().initialize();await Promise.all([store.getState().save(capture('steel')),store.getState().save(capture('black'))]);await store.getState().exportBackup();
    expect(store.getState().records).toHaveLength(2);
    expect(JSON.stringify([useWatchAssemblyStore.getState().assembly,useSourcingStore.getState().sourcingPlan,useCatalogueStore.getState().items,useCatalogueStore.getState().supplierListings])).toBe(before);
    expect(emptySupplierDraftSnapshot().generation).toBe(0);
  });
});
