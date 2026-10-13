import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SupplierDraftPanel } from '@/components/configurator/SupplierDraftPanel';
import { parseSupplierIntake } from '@/domain/design-first/supplierIntake';
import { readFileSync } from 'node:fs';
import type { SupplierDraftStoreState } from '@/stores/supplierDraftStore';
const action=vi.fn(()=>Promise.resolve(true));
let state: SupplierDraftStoreState={initialized:true,busy:false,records:[],assets:[],generation:0,error:null,warning:'Browser-local queue',lastSavedId:null,lastOutcome:null,initialize:action,save:action,importBackup:action,exportBackup:vi.fn(()=>Promise.resolve(null))};
vi.mock('@/stores/supplierDraftStore',()=>({useSupplierDraftStore:(selector:(value:SupplierDraftStoreState)=>unknown)=>selector(state)}));
describe('supplier intake interface',()=>{
  it('offers deliberate manual/import flows, labelled unknowns and saved queue without publication controls',()=>{
    const html=renderToStaticMarkup(<SupplierDraftPanel catalogueItemId="cat-dial-blank" slot="dial"/>);
    for(const label of ['Create a manual supplier draft','Exact variant is unknown','Extract suggestions from pasted text','Import capture or AI-extracted JSON','Import supplier capture JSON file','Saved local drafts (0)','Export draft backup','Reload saved queue']) expect(html).toContain(label);
    expect(html).toContain('Local text parsing only');expect(html).toContain('does not change your watch');expect(html).not.toContain('Publish draft');
    expect(html).toContain('role="status"');
  });
  it('renders saved synthetic examples, versions and missing information clearly',()=>{
    const record=parseSupplierIntake(JSON.parse(readFileSync('docs/examples/df5-incomplete-supplier-intake.json','utf8')));
    state={...state,records:[{id:'example',identity:'fixture',versions:[{id:'version',record,assetIds:[],savedAt:'2026-10-13T00:00:00Z'}]}]};
    const html=renderToStaticMarkup(<SupplierDraftPanel/>);
    expect(html).toContain('Synthetic example');expect(html).toContain('No exact variant was selected');expect(html).toContain('Unknown');expect(html).toContain('Fit has not been assessed');expect(html).toContain('1 version(s)');
    state={...state,records:[]};
  });
  it('accepts recorded and incomplete fixtures without turning confidence into fit approval',()=>{
    for(const name of ['recorded','incomplete']) {const record=parseSupplierIntake(JSON.parse(readFileSync(`docs/examples/df5-${name}-supplier-intake.json`,'utf8')));expect(record.draft.fitQualification).toBe('not-assessed');expect(record.draft.syntheticFixture).toBe(true);expect(record.draft.status).toBe('ai-extracted');}
  });
});
