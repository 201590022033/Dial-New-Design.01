import { useEffect, useId, useRef } from 'react';
import type { DesignMatchGroup } from '@/domain/design-first/designBrief';
import type { EvidenceField } from '@/domain/design-first/evidence';
import { scoreDesignAppearance } from '@/domain/design-first/visualRanking';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useDesignMatchingStore } from '@/stores/designMatchingStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';

const actionStyle = 'rounded border border-teal-600 bg-teal-950 px-3 py-2 text-xs text-teal-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400';
const groups: readonly { id: DesignMatchGroup; label: string; description: string }[] = [
  { id: 'fits-recorded-dimensions', label: 'Fits recorded dimensions', description: 'The recorded dimensions pass this screening. Installation, sealing and manufacturing still need checking.' },
  { id: 'changes-required', label: 'Changes required', description: 'Review the proposed design changes before applying a choice. Other missing evidence remains listed.' },
  { id: 'needs-evidence', label: 'Needs evidence', description: 'Fit is unverified. You can explore eligible choices, while missing measurements stay visible.' },
  { id: 'incompatible', label: 'Incompatible', description: 'These choices conflict with the current design or its constraints and cannot be applied.' },
];

function EvidenceDescription({ field }: { field: EvidenceField<number | string | boolean> }) {
  if (field.state === 'unknown') return <p>Unknown: {field.reason}</p>;
  if (field.state === 'assumed') return <p>Assumed: {String(field.value)}. {field.reason}</p>;
  return <div className="space-y-1">
    <p>Recorded: {String(field.value)}. {field.review === 'reviewed' ? 'Reviewed' : 'Not reviewed'}.</p>
    <p>Source: {field.source.kind.replaceAll('-', ' ')} · {field.source.id}</p>
    <p>{/^https?:\/\//i.test(field.source.locator) ? <a className="underline text-teal-300" href={field.source.locator} target="_blank" rel="noreferrer">View source</a> : field.source.locator}</p>
    <p>Captured: {field.source.capturedAt}{field.source.revision ? ` · Revision ${field.source.revision}` : ''}</p>
    {field.source.kind === 'synthetic-fixture' && <p className="text-amber-300">Illustrative fixture; this does not qualify a real product fit.</p>}
  </div>;
}

const changeText = (value: unknown): string => {
  if (value === undefined || value === null) return 'Not set';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  return 'Unavailable value';
};

/** Search and preview are explicit. This view delegates every transition to its workflow store. */
export function DesignMatchResults({ stale, preferencesChanged = false }: { stale: boolean; preferencesChanged?: boolean }) {
  const workflow = useDesignMatchingStore(state => state);
  const items = useCatalogueStore(state => state.items);
  const listings = useCatalogueStore(state => state.supplierListings);
  const assembly = useWatchAssemblyStore(state => state.assembly);
  const labelId = useId();
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const candidateElements = useRef(new Map<string, HTMLDivElement>());
  const previewId = workflow.status === 'previewing' ? workflow.previewTicket?.candidateId : undefined;
  useEffect(() => { if (previewId) previewHeading.current?.focus(); }, [previewId]);
  if (!workflow.brief) return workflow.error ? <p role="alert" className="break-words text-amber-300">{workflow.error}</p> : null;
  const firstNonempty = groups.find(group => workflow.results.some(result => result.group === group.id))?.id;
  const ticket = workflow.status === 'previewing' ? workflow.previewTicket : null;
  const offers = ticket ? listings.filter(listing => listing.catalogueItemId === ticket.candidateId && ticket.result.supplierListingIds.includes(listing.id)) : [];
  const candidate = ticket ? items.find(item => item.id === ticket.candidateId) : undefined;
  const describeValue = (value: unknown) => typeof value === 'string' ? items.find(item => item.id === value)?.displayName ?? changeText(value) : changeText(value);
  const changeLabel = (property: string) => {
    const labels: Record<string, string> = { diameterMm: 'Diameter (mm)', widthMm: 'Width (mm)', thicknessMm: 'Thickness (mm)', offsetXmm: 'Horizontal offset (mm)', offsetYmm: 'Vertical offset (mm)', catalogueItemId: 'Component choice', assetId: 'Visual representation', color: 'Colour', texture: 'Texture', material: 'Material', visible: 'Visible', layerIndex: 'Layer position', name: 'Name' };
    const finalKey = property.split('.').at(-1) ?? property;
    return labels[finalKey] ?? finalKey.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('-', ' ');
  };
  return <section aria-labelledby={labelId} className="min-w-0 space-y-3 border-t border-slate-700 pt-3">
    <h3 id={labelId} className="font-semibold text-teal-300">Closest parts for {workflow.targetLabel}</h3>
    <p role="status" aria-live="polite" className={stale && workflow.status !== 'applied' ? 'text-amber-300' : 'text-slate-300'}>
      {workflow.status === 'applied' ? 'Design choice applied. Search again to compare your updated design.'
        : stale ? ticket && !preferencesChanged ? 'The design has changed since search. Apply will recheck this preview against the current design; refresh search before previewing another choice.' : 'These results are out of date. Find closest parts again for your current design and preferences.'
          : ticket ? `Previewing ${candidate?.displayName ?? 'selected part'}. Your saved design stays unchanged until Apply.`
            : `${workflow.results.length} catalogue choices found. Preview a choice to inspect its changes.`}
      {' '}Captured target: {workflow.targetLabel}.
    </p>
    {workflow.error && <p role="alert" className="break-words text-amber-300">{workflow.error}</p>}
    <p className="text-slate-400">Appearance scores compare catalogue descriptions. They do not analyse photos or certify fit. Scrolling and selecting text do not change the watch.</p>
    <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
      {groups.map(group => {
        const results = workflow.results.filter(result => result.group === group.id);
        return <details key={group.id} open={group.id === firstNonempty} className="rounded border border-slate-700">
          <summary className="cursor-pointer px-2 py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400">{group.label} ({results.length})</summary>
          <div className="space-y-2 px-2 pb-2">
            <p className="text-slate-400">{group.description}</p>
            {!results.length && <p>No choices in this group.</p>}
            {results.map(result => {
              const item = items.find(entry => entry.id === result.catalogueItemId);
              const blocked = stale || result.group === 'incompatible' || !item || Boolean(item.researchOnly);
              const blockReason = stale ? 'Search again to refresh this choice.' : result.group === 'incompatible' ? 'Conflicts with this design. See fit reasons.' : !item ? 'This catalogue record is unavailable.' : item.researchOnly ? 'Research record: physical replacement is not available.' : null;
              const preview = () => { if (!blocked) workflow.preview(result.catalogueItemId); };
              const appearance = item ? scoreDesignAppearance(workflow.brief!, item) : null;
              return <article key={result.catalogueItemId} className="space-y-2 rounded border border-slate-700 bg-slate-950/60 p-2">
                <div ref={element => { if (element) candidateElements.current.set(result.catalogueItemId, element); else candidateElements.current.delete(result.catalogueItemId); }} role="button" tabIndex={blocked ? -1 : 0} aria-disabled={blocked} aria-label={`Choice: ${item?.displayName ?? result.catalogueItemId} — double-click or press Enter to preview`} onDoubleClick={preview} onKeyDown={event => {
                  if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); preview(); }
                }} className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400">
                  <p className="font-semibold">{item?.displayName ?? 'Unavailable catalogue choice'}</p>
                  <p className="text-slate-400">Appearance: {Math.round((result.visualScore ?? 0) * 100)}%</p>
                  <p className="text-[10px] text-slate-400">Double-click to preview, or focus this choice and press Enter or Space.</p>
                </div>
                <button type="button" className={actionStyle} disabled={blocked} onClick={preview}>Preview {item?.displayName ?? 'choice'}</button>
                {blockReason && <p className="text-amber-300">{blockReason}</p>}
                <details>
                  <summary className="cursor-pointer text-teal-300">Fit reasons &amp; evidence</summary>
                  <div className="space-y-3 break-words pt-2">{result.reasons.map((reason, index) => <div key={`${reason.code}-${index}`} className="space-y-1 border-l-2 border-slate-700 pl-2"><p className="font-medium">{reason.explanation}</p><EvidenceDescription field={reason.evidence} /></div>)}</div>
                </details>
                {appearance && <details><summary className="cursor-pointer text-teal-300">Appearance comparison</summary><ul className="list-disc space-y-1 pl-4 pt-2 text-slate-400">{appearance.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul></details>}
                {result.adjustments.length > 0 && <details><summary className="cursor-pointer text-teal-300">Proposed design changes ({result.adjustments.length})</summary><ul className="space-y-2 pt-2">{result.adjustments.map((change, index) => <li key={index} className="break-words"><p>{change.reason}</p><p>{changeText(change.before)} → {changeText(change.after)}{change.reversible ? '' : ' · Irreversible physical work'}</p></li>)}</ul></details>}
              </article>;
            })}
          </div>
        </details>;
      })}
    </div>
    {ticket && <section aria-label="Current part preview" className="space-y-3 rounded border border-teal-700 bg-teal-950/30 p-2">
      <h4 ref={previewHeading} tabIndex={-1} className="font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400">Preview: {candidate?.displayName ?? 'Selected part'}</h4>
      <p>The watch view shows this preview. Review these changes before applying.</p>
      {ticket.result.group === 'needs-evidence' && <p className="text-amber-300">Fit remains unverified. Applying a design choice does not certify its installation.</p>}
      <ul className="max-h-48 space-y-2 overflow-y-auto break-words">{ticket.changes.map((change, index) => <li key={index}><span className="font-medium">{change.partInstanceId ? `${assembly.parts[change.partInstanceId]?.name ?? 'Component'}: ` : ''}{changeLabel(change.property)}</span>{change.property === 'customProperties.catalogueSelection' ? <p>Catalogue reference retained with the design.</p> : <p>{describeValue(change.before)} → {describeValue(change.after)}</p>}</li>)}</ul>
      {!ticket.changes.length && <p>No physical design changes.</p>}
      <label className="block space-y-1"><span>Supplier for this choice</span><select value={workflow.chosenSupplierListingId ?? ''} onChange={event => workflow.selectSupplier(event.target.value || null)} className="w-full min-w-0 rounded border border-slate-600 bg-slate-950 p-2">
        <option value="">No supplier yet</option>
        {offers.map(offer => <option key={offer.id} value={offer.id}>{offer.supplierName}{offer.sku ? ` · ${offer.sku}` : ''} · {offer.unitPrice === null ? 'Price unknown' : `${offer.currency} ${offer.unitPrice}`} · {offer.stockStatus.replaceAll('-', ' ')}</option>)}
      </select></label>
      <p className="text-slate-400">Supplier selection records an offer; it does not place an order or establish fit.</p>
      {preferencesChanged && <p className="text-amber-300">Your selected component or preferences changed. Search again before applying this choice.</p>}
      <div className="flex flex-wrap gap-2"><button type="button" className={actionStyle} disabled={preferencesChanged} onClick={() => workflow.apply()}>Apply design choice</button><button type="button" className={actionStyle} onClick={() => { workflow.cancel(); candidateElements.current.get(ticket.candidateId)?.focus(); }}>Cancel preview</button></div>
    </section>}
  </section>;
}
