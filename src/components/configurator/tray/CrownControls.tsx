import React from 'react';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { crownCatalogueItems } from '@/domain/crown/catalogue';
import { crownSpecificationForPart, resolveCrownDefault } from '@/domain/crown/selection';
import { crownEditCandidate, type CrownEdit } from '@/domain/crown/edit';
import { checkCrownCompatibility } from '@/domain/crown/compatibility';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { formatListingPrice } from '@/domain/catalogue/pricing';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { CrownEngineeringDetail } from './CrownEngineeringDetail';
import { OffAxisPlatformDetail } from './OffAxisPlatformDetail';

export const CrownControls: React.FC<{ id: string }> = ({ id }) => {
  const assembly = useWatchAssemblyStore(s => s.assembly);
  const ui = useConfiguratorUIStore();
  const listings = useCatalogueStore(s => s.supplierListings);
  const selections = useSourcingStore(s => s.sourcingPlan.selections);
  const part = assembly.parts[id]!;
  const displayed = ui.previewPartInstanceId === id && ui.previewAssembly ? ui.previewAssembly : assembly;
  const shownPart = displayed.parts[id]!;
  const spec = crownSpecificationForPart(shownPart);
  const model = React.useMemo(() => watchAssemblyToVisualModel(displayed), [displayed]);
  const locked = part.locked || ui.lockedPartIds.has(id) || ui.lockedStyles[id];
  const offer = listings.find(l => l.id === selections[id] && (l.catalogueItemId === part.catalogueItemId || l.replacementCatalogueItemId === part.catalogueItemId));
  const stage = (item: ComponentCatalogueItem, apply = false) => {
    const current = useWatchAssemblyStore.getState().assembly;
    try {
      ui.setPreview(applyCatalogueVisualSelection(current, id, item), id, item);
      if (apply) ui.applyPreview();
    } catch (error) { useConfiguratorUIStore.setState({ previewError: error instanceof Error ? error.message : 'Unable to preview crown' }); }
  };
  const edit = (intent: CrownEdit) => crownEditCandidate(useWatchAssemblyStore.getState().assembly, id, intent);
  const option = (label: string, item: ComponentCatalogueItem, selected = false) => <button key={label} type="button" aria-pressed={selected}
    className={`rounded border p-2 text-left ${selected ? 'border-teal-400 text-teal-200' : 'border-slate-700'}`}
    onClick={() => stage(item)} onDoubleClick={() => stage(item, true)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); stage(item, true); } }}>{label}</button>;
  return <div data-testid="crown-controls" className="h-full overflow-y-auto p-3 space-y-4 text-xs text-slate-200">
    <h3 className="font-semibold">Crown · {part.name}</h3>
    <p className="text-slate-400">{ui.previewPartInstanceId === id && ui.previewAssembly ? 'Preview — saved crown unchanged until Apply.' : 'Committed selection.'} Click to preview; Apply, double-click or Enter commits the same checked change.</p>
    {locked && <p role="status" className="text-amber-200">Unlock the crown and its style before editing.</p>}
    <fieldset disabled={locked} className="space-y-4">
      <section aria-label="Crown shape" className="space-y-2"><h4>Shape</h4><div className="grid grid-cols-2 gap-2">{crownCatalogueItems.map(item => option(item.displayName, item, shownPart.catalogueItemId === item.id))}</div>
        {option('Restore case / archetype default', edit({ type: 'restore-default' }))}
        <p className="text-slate-400">{resolveCrownDefault(assembly).reason}. An archetype recommendation is provisional styling.</p></section>
      <section aria-label="Crown closure and protection" className="space-y-2"><h4>Closure / protection</h4>
        <p className="text-amber-200">Closure choices are design concepts. Changing to screw-down requires a matched crown/tube, gasket and installation; a visual choice does not qualify hardware.</p>
        <div className="grid grid-cols-2 gap-2">{(['unspecified', 'push-pull', 'screw-down'] as const).map(closure => option(closure === 'unspecified' ? 'Closure unspecified' : `${closure} concept`, edit({ type: 'closure', closure }), spec?.closure.status === 'known' && spec.closure.value === closure))}</div>
        <p>Existing case guards: {spec?.protection.status === 'known' ? spec.protection.value : 'not established'}. Fixed guards, extraction controls and bezel locks are separate mechanisms.</p>
        <div className="grid grid-cols-2 gap-2">{option('No cap concept', edit({ type: 'cap-concept', concept: null }), !shownPart.crownCapConcept)}
          {(['closed', 'open'] as const).map(state => option(`Protected cap concept — ${state}`, edit({ type: 'cap-concept', concept: { schema: 'crown-cap-concept/v1', state, clearanceMm: 1, wallMm: .6 } }), shownPart.crownCapConcept?.state === state))}</div>
        {shownPart.crownCapConcept && <p role="status" className="text-amber-200">PRESENTATION CONCEPT — generic cap and case-owned holder. Open state is an exploded view, not a working hinge. No threads, extraction lever, lock, pressure rating or left-side relocation are specified. Physical Apply and ordering are unavailable until matched hardware is qualified.</p>}
      </section>
      <section aria-label="Independent crown finish" className="space-y-2"><h4>Finish</h4><div className="grid grid-cols-2 gap-2">
        {option('Inherit case finish', edit({ type: 'finish', finish: { mode: 'inherit-case' } }), spec?.finish.mode === 'inherit-case')}
        {([{ label: 'Polished steel', material: 'steel', color: '#e2e8f0', texture: 'polished' }, { label: 'Brushed steel', material: 'steel', color: '#cbd5e1', texture: 'brushed' }, { label: 'Rose gold', material: 'rose-gold', color: '#c08a76', texture: 'polished' }, { label: 'Matte black', material: 'black-pvd', color: '#111827', texture: 'matte' }]).map(f => option(f.label, edit({ type: 'finish', finish: { mode: 'override', material: f.material, color: f.color, texture: f.texture } }), spec?.finish.mode === 'override' && spec.finish.color === f.color && spec.finish.texture === f.texture))}
      </div><p className="text-slate-400">An override stays independent when the case finish changes. Inherit follows the case. Appearance does not establish plating or supplier availability.</p></section>
    </fieldset>
    <CrownEngineeringDetail model={model} />
    <OffAxisPlatformDetail model={model} />
    <section aria-label="Crown source and fit" className="space-y-2"><h4>Source / fit · committed crown</h4>
      {checkCrownCompatibility(assembly).map((c, i) => <p key={i} className="text-amber-200">{c.summary}</p>)}
      <p>{offer ? `${offer.supplierName} · ${offer.sku ?? 'SKU unknown'} · ${formatListingPrice(offer)}` : 'No exact supplier selected for this crown.'}</p>
      <p className="text-slate-400">Case package contents and separately selected replacements are shown in BOM. Unknown prices and South Africa shipping remain unknown; source selection never certifies fit.</p>
      <button type="button" className="underline text-teal-300" onClick={() => ui.setTrayTab('suppliers')}>Review crown suppliers</button>
    </section>
    {ui.previewError && <p role="alert" className="text-rose-300">{ui.previewError}</p>}
    {ui.previewAssembly && ui.previewPartInstanceId === id && <div className="sticky bottom-0 flex gap-2 bg-slate-950 p-2"><button type="button" className="rounded border border-teal-500 p-2" disabled={Boolean(locked || ui.previewError)} onClick={() => ui.applyPreview()}>Apply crown preview</button><button type="button" className="rounded border border-slate-600 p-2" onClick={ui.cancelPreview}>Cancel crown preview</button></div>}
  </div>;
};
