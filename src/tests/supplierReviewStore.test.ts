import { afterEach, describe, expect, it } from 'vitest';
import { createSupplierDraftStore } from '@/stores/supplierDraftStore';
import { createSupplierReviewStore, supplierActivePublications } from '@/stores/supplierReviewStore';
import { createManualSupplierIntake } from '@/domain/design-first/supplierIntake';
import { supplierReviewFields } from '@/domain/design-first/supplierReview';
import type { SupplierReviewPersistence, SupplierReviewSnapshot } from '@/services/supplierReviewPersistence';
import type { SupplierDraftPersistence, SupplierDraftSnapshot } from '@/services/supplierDraftPersistence';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { captureDesignBrief } from '@/domain/design-first/designBriefExtraction';
import { defaultDesignIntent } from '@/domain/design-first/designIntent';
import { searchDesignParts } from '@/domain/design-first/searchDesignParts';
const originalCatalogue=useCatalogueStore.getState();
afterEach(()=>useCatalogueStore.setState(originalCatalogue));
const capture=(text='Original source')=>createManualSupplierIntake({supplierId:'Test review supplier',productId:'Crystal-315',variant:'31.5 mm flat',sourceUrl:'https://example.com/crystal',capturedAt:'2026-10-13T08:00:00Z',slot:'crystal',catalogueItemId:'cat-crystal',sourceText:text,measurements:{outerDiameterMm:{value:31.5,unit:'mm'},thicknessMm:{value:2,unit:'mm'}},attributes:{material:'sapphire',texture:'polished'},unitPrice:12,currency:'USD',shippingPrice:null});
async function setup(){
  let queue:SupplierDraftSnapshot|null=null,journal:SupplierReviewSnapshot|null=null,fail=false;
  const draftDb:SupplierDraftPersistence={load:()=>Promise.resolve(structuredClone(queue)),save:(next,expected)=>{if((queue?.generation??0)!==expected)return Promise.reject(new Error('Draft conflict'));queue=structuredClone(next);return Promise.resolve();}};
  const reviewDb:SupplierReviewPersistence={load:()=>Promise.resolve(structuredClone(journal)),save:(next,expected)=>{if(fail)return Promise.reject(new Error('Disk full'));if((journal?.generation??0)!==expected)return Promise.reject(new Error('Review conflict'));journal=structuredClone(next);return Promise.resolve();}};
  const drafts=createSupplierDraftStore(draftDb);await drafts.getState().initialize();await drafts.getState().save(capture());
  const deps={loadDrafts:()=>drafts.getState().initialize(true),entries:()=>drafts.getState().records,saveCorrection:(record:unknown)=>drafts.getState().save(record),applyPublications:(active:ReturnType<typeof supplierActivePublications>,history:ReturnType<typeof supplierActivePublications>)=>{const ids=new Set(history.map(p=>p.component.id));const offerIds=new Set(history.flatMap(p=>p.offers.map(o=>o.id)));const state=useCatalogueStore.getState();useCatalogueStore.setState({items:[...state.items.filter(i=>!ids.has(i.id)),...active.map(p=>p.component)],supplierListings:[...state.supplierListings.filter(o=>!offerIds.has(o.id)),...active.flatMap(p=>[...p.offers])]});}};
  const store=createSupplierReviewStore(reviewDb,deps);await store.getState().initialize();
  const entry=drafts.getState().records[0]!,version=entry.versions.at(-1)!;
  const paths=supplierReviewFields(version.record).filter(f=>f.eligible).map(f=>f.path);
  const approve=()=>store.getState().review(entry.id,version.id,'approve','Test reviewer','Checked exact dated source transcription',paths);
  return{store,drafts,entry,version,paths,approve,restart:()=>createSupplierReviewStore(reviewDb,deps),fail:()=>{fail=true;},tamper:()=>{if(journal){const event=journal.events.find(e=>e.kind==='publish');if(event?.kind==='publish')journal={...journal,events:journal.events.map(e=>e.id===event.id?{...event,publication:{...event.publication,component:{...event.publication.component,nominalDimensions:{...event.publication.component.nominalDimensions,diameterMm:99}}}}:e)};}}};
}
describe('DF6 durable supplier review and local publication',()=>{
  it('requires exact approval then makes isolated published data discoverable without changing the watch',async()=>{
    const {store,entry,version,approve}=await setup();const before=JSON.stringify([useWatchAssemblyStore.getState().assembly,useSourcingStore.getState().sourcingPlan]);
    expect(await store.getState().publish(entry.id,version.id,'Reviewer','Publish')).toBe(false);
    expect(await approve()).toBe(true);expect(await store.getState().publish(entry.id,version.id,'Reviewer','Publish checked capture')).toBe(true);
    const active=supplierActivePublications(store.getState().events)[0]!;expect(active.component.id).not.toBe('cat-crystal');expect(active.offers[0]?.verificationStatus).toBe('unverified');
    const assembly=useWatchAssemblyStore.getState().assembly,items=useCatalogueStore.getState().items,intent={...defaultDesignIntent(),preserveAppearance:false,preserveDimensions:false};
    const brief=captureDesignBrief(assembly,'inst-crystal',items,intent);const result=searchDesignParts({assembly,brief,items,supplierListings:useCatalogueStore.getState().supplierListings,intent}).find(r=>r.catalogueItemId===active.component.id);
    expect(result).toBeDefined();expect(result?.group).toBe('needs-evidence');
    expect(JSON.stringify([useWatchAssemblyStore.getState().assembly,useSourcingStore.getState().sourcingPlan])).toBe(before);
  });
  it('restores publications after restart and withdraws while retaining evidence and history',async()=>{
    const {store,entry,version,approve,restart,drafts}=await setup();await approve();await store.getState().publish(entry.id,version.id,'Reviewer','Publish');const id=supplierActivePublications(store.getState().events)[0]!.component.id;
    const fresh=restart();expect(await fresh.getState().initialize()).toBe(true);expect(useCatalogueStore.getState().items.some(i=>i.id===id)).toBe(true);
    expect(await fresh.getState().withdraw(entry.id,'Reviewer','Retired pending new supplier evidence')).toBe(true);expect(useCatalogueStore.getState().items.some(i=>i.id===id)).toBe(false);expect(fresh.getState().events).toHaveLength(3);expect(drafts.getState().records[0]?.versions).toHaveLength(1);
  });
  it('declines publication after rejection and refuses stale captures after recapture',async()=>{
    const {store,entry,version,drafts,approve}=await setup();await store.getState().review(entry.id,version.id,'reject','Reviewer','Source is incomplete',[]);expect(await store.getState().publish(entry.id,version.id,'Reviewer','Publish')).toBe(false);
    await approve();await drafts.getState().save(capture('New capture'));expect(await store.getState().publish(entry.id,version.id,'Reviewer','Publish old')).toBe(false);
    const next=drafts.getState().records[0]!.versions.at(-1)!;expect(await store.getState().review(entry.id,next.id,'approve','Reviewer','Checked new source',supplierReviewFields(next.record).filter(f=>f.eligible).map(f=>f.path))).toBe(true);
  });
  it('records corrections as new immutable captures with reviewer/reason evidence and invalidates previous approval',async()=>{
    const {store,entry,version,approve,drafts}=await setup();await approve();const changed={...version.record,draft:{...version.record.draft,engineering:{...version.record.draft.engineering,attributes:{...version.record.draft.engineering.attributes,material:{...version.record.draft.engineering.attributes.material!,value:'mineral glass'}}}}};
    expect(await store.getState().correct(entry.id,version.id,changed,'Reviewer','Corrected material transcription')).toBe(true);
    const versions=drafts.getState().records[0]!.versions;expect(versions).toHaveLength(2);expect(versions[0]!.record).toEqual(version.record);expect(versions[1]!.record.captures.at(-1)?.raw).toMatchObject({reviewer:'Reviewer',reason:'Corrected material transcription'});
    expect(await store.getState().publish(entry.id,versions[1]!.id,'Reviewer','Publish')).toBe(false);
  });
  it('retains ambiguous corrections as linked entries without merging their unknown identity',async()=>{
    const {store,drafts}=await setup();const unknown=createManualSupplierIntake({supplierId:'Unspecified variant test',productId:'Unknown crystal',variant:null,sourceUrl:'https://example.com/unknown',capturedAt:'2026-10-13T08:00:00Z',slot:'crystal',sourceText:'Original uncertain capture'});await drafts.getState().save(unknown);
    const entry=drafts.getState().records.find(entry=>entry.versions[0]?.record.draft.identity.productId==='Unknown crystal')!,version=entry.versions[0]!;
    const corrected={...version.record,draft:{...version.record.draft,engineering:{...version.record.draft.engineering,attributes:{title:{state:'recorded',value:'Corrected title',source:version.record.draft.sources[0]!,review:'unreviewed'}}}}};
    expect(await store.getState().correct(entry.id,version.id,corrected,'Reviewer','Clarified source title')).toBe(true);
    expect(drafts.getState().records).toHaveLength(3);expect(drafts.getState().records.find(item=>item.id===entry.id)?.versions).toHaveLength(1);
    const linked=drafts.getState().records.find(item=>item.id!==entry.id&&item.versions[0]?.record.draft.identity.productId==='Unknown crystal');expect(linked?.versions[0]?.record.captures.at(-1)?.raw).toMatchObject({correctedFromEntryId:entry.id,correctedFromRevision:version.id});
  });
  it('does not install catalogue records if durable saving fails',async()=>{
    const {store,entry,version,approve,fail}=await setup();await approve();fail();expect(await store.getState().publish(entry.id,version.id,'Reviewer','Publish')).toBe(false);expect(store.getState().events).toHaveLength(1);expect(supplierActivePublications(store.getState().events)).toEqual([]);
  });
  it('detects journal tampering and conflicts between independent tabs',async()=>{
    const {store,entry,version,approve,restart,tamper}=await setup();const other=restart();await other.getState().initialize();await approve();expect(await other.getState().review(entry.id,version.id,'reject','Reviewer','Other tab',[])).toBe(false);
    await store.getState().publish(entry.id,version.id,'Reviewer','Publish');tamper();const corrupt=restart();expect(await corrupt.getState().initialize()).toBe(false);expect(corrupt.getState().initialized).toBe(false);
  });
});
