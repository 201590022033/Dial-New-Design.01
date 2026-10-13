import { create } from 'zustand';
import { z } from 'zod';
import { createSupplierReviewEvent, publishSupplierReview, validateSupplierReviewEvent, supplierCorrectionIdentityCompatible, type SupplierPublication } from '@/domain/design-first/supplierReview';
import { parseSupplierIntake } from '@/domain/design-first/supplierIntake';
import { useSupplierDraftStore } from './supplierDraftStore';
import { useCatalogueStore } from './catalogueStore';
import { supplierIntakeCanonical, type SupplierDraftQueueEntry, type SupplierDraftRevision } from '@/services/supplierDraftPersistence';
import { createIndexedDbSupplierReviewPersistence, emptySupplierReviewSnapshot, type SupplierReviewJournalEvent, type SupplierReviewPersistence, type SupplierReviewSnapshot } from '@/services/supplierReviewPersistence';

export interface SupplierReviewStoreState {
  initialized: boolean; busy: boolean; error: string | null; events: readonly SupplierReviewJournalEvent[]; generation: number;
  initialize: (force?: boolean) => Promise<boolean>;
  review: (entryId: string, revisionId: string, action: 'approve' | 'reject', reviewer: string, reason: string, reviewedPaths: readonly string[]) => Promise<boolean>;
  publish: (entryId: string, revisionId: string, reviewer: string, reason: string) => Promise<boolean>;
  withdraw: (entryId: string, reviewer: string, reason: string) => Promise<boolean>;
  correct: (entryId: string, revisionId: string, input: unknown, reviewer: string, reason: string) => Promise<boolean>;
}
interface ReviewDependencies {
  loadDrafts: () => Promise<boolean>;
  entries: () => readonly SupplierDraftQueueEntry[];
  saveCorrection: (record: unknown, base: SupplierDraftRevision) => Promise<boolean>;
  applyPublications: (publications: readonly SupplierPublication[], history: readonly SupplierPublication[]) => void;
}
const text=z.string().trim().min(1);
const date=z.iso.datetime({offset:true});
const journalEventSchema=z.discriminatedUnion('kind',[
  z.object({id:text,kind:z.literal('review'),review:z.unknown()}).strict(),
  z.object({id:text,kind:z.literal('publish'),entryId:text,revisionId:text,reviewEventId:text,actor:text,reason:text,at:date,publication:z.unknown()}).strict(),
  z.object({id:text,kind:z.literal('withdraw'),entryId:text,actor:text,reason:text,at:date}).strict()
]);
const snapshotSchema=z.object({schema:z.literal('dial-designer/supplier-review-journal/v1'),generation:z.number().int().nonnegative(),events:z.array(journalEventSchema).max(1000)}).strict();
const requireActor=(actor:string,reason:string)=>{if(!actor.trim()||!reason.trim())throw new Error('Enter the reviewer name and a reason for this decision.');};
const findVersion=(entries:readonly SupplierDraftQueueEntry[],entryId:string,revisionId:string):SupplierDraftRevision=>{
  const version=entries.find(entry=>entry.id===entryId)?.versions.find(version=>version.id===revisionId);
  if(!version)throw new Error('This exact supplier capture is no longer available. Reload the queue.');return version;
};
export function supplierActivePublications(events:readonly SupplierReviewJournalEvent[]):readonly SupplierPublication[]{
  const active=new Map<string,SupplierPublication>();
  for(const event of events){if(event.kind==='publish')active.set(event.entryId,event.publication);else if(event.kind==='withdraw')active.delete(event.entryId);}
  return [...active.values()];
}
export function validateSupplierReviewSnapshot(input:unknown,entries:readonly SupplierDraftQueueEntry[]):SupplierReviewSnapshot{
  const parsed=snapshotSchema.parse(input);if(supplierIntakeCanonical(parsed).length>20000000)throw new Error('Supplier review history exceeds its 20 MB local limit.');
  const events:SupplierReviewJournalEvent[]=[];
  for(const raw of parsed.events){
    if(raw.kind==='review'){
      const data=raw.review as {entryId?:string;revisionId?:string};const version=findVersion(entries,data?.entryId??'',data?.revisionId??'');
      const review=validateSupplierReviewEvent(version.record,raw.review);if(raw.id!==review.id)throw new Error('Review history identity changed.');events.push({...raw,review});
    }else if(raw.kind==='publish'){
      const approval=[...events].reverse().find(event=>event.kind==='review'&&event.review.entryId===raw.entryId);
      if(approval?.kind!=='review'||approval.review.action!=='approve'||approval.id!==raw.reviewEventId||approval.review.revisionId!==raw.revisionId)throw new Error('Publication has no matching current approval.');
      const expected=publishSupplierReview(findVersion(entries,raw.entryId,raw.revisionId).record,approval.review);
      if(supplierIntakeCanonical(raw.publication)!==supplierIntakeCanonical(expected))throw new Error('Published supplier data changed outside its approved capture.');
      events.push({...raw,publication:expected});
    }else{
      if(!supplierActivePublications(events).some(publication=>publication.provenance.entryId===raw.entryId))throw new Error('Withdrawal has no active local publication.');events.push(raw);
    }
  }
  if(new Set(events.map(event=>event.id)).size!==events.length)throw new Error('Duplicate supplier review history event.');
  return {...parsed,events};
}
/** Durable decision journal; no assembly or sourcing mutation is permitted here. */
export function createSupplierReviewStore(persistence:SupplierReviewPersistence,deps:ReviewDependencies){
  return create<SupplierReviewStoreState>((set,get)=>{
    let operations:Promise<unknown>=Promise.resolve();
    const run=(operation:()=>Promise<boolean>):Promise<boolean>=>{const next=operations.then(async()=>{set({busy:true,error:null});try{return await operation();}catch(cause){set({error:cause instanceof Error?cause.message:'Supplier review was not saved.'});return false;}finally{set({busy:false});}});operations=next.catch(()=>undefined);return next;};
    const ready=async()=>{if(!get().initialized)throw new Error('Load the supplier review history before continuing.');if(!await deps.loadDrafts())throw new Error('The supplier queue could not be loaded. Nothing was changed.');};
    const latest=(entryId:string,revisionId:string)=>{const entry=deps.entries().find(entry=>entry.id===entryId);if(entry?.versions.at(-1)?.id!==revisionId)throw new Error('A newer capture exists. Review its fields before continuing.');return findVersion(deps.entries(),entryId,revisionId);};
    const apply=(events:readonly SupplierReviewJournalEvent[])=>deps.applyPublications(supplierActivePublications(events),events.flatMap(event=>event.kind==='publish'?[event.publication]:[]));
    const append=async(event:SupplierReviewJournalEvent)=>{
      const before=get();const snapshot=validateSupplierReviewSnapshot({schema:'dial-designer/supplier-review-journal/v1',generation:before.generation+1,events:[...before.events,event]},deps.entries());
      await persistence.save(snapshot,before.generation);set({generation:snapshot.generation,events:snapshot.events});apply(snapshot.events);
    };
    return {initialized:false,busy:false,error:null,events:[],generation:0,
      initialize:(force=false)=>run(async()=>{if(get().initialized&&!force)return true;set({initialized:false});if(!await deps.loadDrafts())throw new Error('Supplier drafts could not load; publications have not been restored.');const raw=await persistence.load();const snapshot=raw===null?emptySupplierReviewSnapshot():validateSupplierReviewSnapshot(raw,deps.entries());apply(snapshot.events);set({initialized:true,events:snapshot.events,generation:snapshot.generation});return true;}),
      review:(entryId,revisionId,action,reviewer,reason,reviewedPaths)=>run(async()=>{await ready();const version=latest(entryId,revisionId);const review=createSupplierReviewEvent({entryId,revisionId,record:version.record,action,reviewer,reason,reviewedPaths,reviewedAt:new Date().toISOString()});await append({id:review.id,kind:'review',review});return true;}),
      publish:(entryId,revisionId,reviewer,reason)=>run(async()=>{await ready();requireActor(reviewer,reason);const version=latest(entryId,revisionId);const approval=[...get().events].reverse().find(event=>event.kind==='review'&&event.review.entryId===entryId);if(approval?.kind!=='review'||approval.review.action!=='approve'||approval.review.revisionId!==revisionId)throw new Error('Approve the exact current capture before publishing.');const publication=publishSupplierReview(version.record,approval.review);await append({id:crypto.randomUUID(),kind:'publish',entryId,revisionId,reviewEventId:approval.id,actor:reviewer.trim(),reason:reason.trim(),at:new Date().toISOString(),publication});return true;}),
      withdraw:(entryId,reviewer,reason)=>run(async()=>{await ready();requireActor(reviewer,reason);if(!supplierActivePublications(get().events).some(publication=>publication.provenance.entryId===entryId))throw new Error('This supplier record is not currently published.');await append({id:crypto.randomUUID(),kind:'withdraw',entryId,actor:reviewer.trim(),reason:reason.trim(),at:new Date().toISOString()});return true;}),
      correct:(entryId,revisionId,input,reviewer,reason)=>run(async()=>{
        await ready();requireActor(reviewer,reason);const base=latest(entryId,revisionId);const corrected=parseSupplierIntake(input);
        if(!supplierCorrectionIdentityCompatible(base.record,corrected))throw new Error('This changes the supplier, product or exact variant identity. Save it as a new supplier draft.');
        for(const source of base.record.draft.sources)if(!corrected.draft.sources.some(next=>supplierIntakeCanonical(next)===supplierIntakeCanonical(source)))throw new Error('Keep original evidence sources unchanged; append corrected source evidence instead.');
        for(const capture of base.record.captures)if(!corrected.captures.some(next=>supplierIntakeCanonical(next)===supplierIntakeCanonical(capture)))throw new Error('Keep original raw captures unchanged when correcting transcription.');
        const at=new Date().toISOString(),id=`correction-${crypto.randomUUID()}`;
        const source={id,kind:'user-record' as const,locator:`Local correction by ${reviewer.trim()}`,capturedAt:at};
        const record=parseSupplierIntake({...corrected,draft:{...corrected.draft,sources:[...corrected.draft.sources,source]},captures:[...corrected.captures,{id,sourceId:id,capturedAt:at,raw:{correctedFromEntryId:entryId,correctedFromRevision:revisionId,reviewer:reviewer.trim(),reason:reason.trim(),correctedAt:at}}]});
        if(!await deps.saveCorrection(record,base))throw new Error('Corrected capture was not saved. Original evidence remains unchanged.');return true;
      })
    };
  });
}
function applyLocalSupplierPublications(publications:readonly SupplierPublication[],history:readonly SupplierPublication[]):void{
  const state=useCatalogueStore.getState();const ids=new Set(history.map(publication=>publication.component.id));const offerIds=new Set(history.flatMap(publication=>publication.offers.map(offer=>offer.id)));
  useCatalogueStore.setState({items:[...state.items.filter(item=>!ids.has(item.id)),...publications.map(publication=>structuredClone(publication.component))],supplierListings:[...state.supplierListings.filter(offer=>!offerIds.has(offer.id)),...publications.flatMap(publication=>structuredClone([...publication.offers]))]});
}
export const useSupplierReviewStore=createSupplierReviewStore(createIndexedDbSupplierReviewPersistence(),{
  loadDrafts:()=>useSupplierDraftStore.getState().initialize(true),entries:()=>useSupplierDraftStore.getState().records,
  saveCorrection:(record,base)=>{const state=useSupplierDraftStore.getState();const assets=base.assetIds.map(id=>state.assets.find(asset=>asset.id===id)!).filter(Boolean);return state.save(record,assets);},applyPublications:applyLocalSupplierPublications
});
