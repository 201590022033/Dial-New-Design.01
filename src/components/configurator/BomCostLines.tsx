import React from 'react';
import type { CostBreakdown } from '@/domain/configurator/configuratorTypes';
import { PRICING_SNAPSHOT, formatBomZar } from '@/domain/catalogue/pricing';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { applyBomSelection } from '@/stores/applyBomSelection';

const componentOrder = (component: string) => ({ Case: 0, Dial: 1, Movement: 2, Crystal: 3 }[component] ?? (component.startsWith('Main hand set') ? 4 : 5));

/** Uses the calculator's purchase rows so the detail and total cannot drift. */
export const BomCostLines: React.FC<{ cost: CostBreakdown; interactive?: boolean }> = ({ cost, interactive = false }) => {
  const choiceScope = React.useId();
  const listings = useCatalogueStore(s => s.supplierListings);
  const choosePart = useWatchAssemblyStore(s => s.setBomPartSelection);
  const selectSupplier = useSourcingStore(s => s.setSupplierSelection);
  const selections = useSourcingStore(s => s.sourcingPlan.selections);
  const [feedback, setFeedback] = React.useState('');
  const matches = (itemId: string | undefined) => listings.filter(l => l.catalogueItemId === itemId || l.replacementCatalogueItemId === itemId);
  return <section aria-label="Individual component costs" className="space-y-2 text-xs">
  <h3 className="font-semibold text-slate-100">Individual component costs</h3>
  <p className="text-[10px] text-slate-400">Choose a component and supplier option, then Apply to watch to update the right-hand options and both views. Grey alternatives are excluded from totals. A price selection alone does not change the watch or certify fit. Unknown costs are not zero. Hand sets are counted once.</p>
  {feedback && <p role="status" className="text-[10px] text-amber-300">{feedback}</p>}
  <div className="space-y-2">
    {[...cost.lineItems].sort((a, b) => componentOrder(a.component) - componentOrder(b.component) || Number(b.priceZar !== null) - Number(a.priceZar !== null)).map(line => <div key={line.id} data-testid="bom-cost-line" className={`rounded border border-slate-800 bg-slate-900 p-2 ${line.included === false ? 'opacity-50' : ''}`}>
      {interactive && line.choiceGroup && cost.lineItems.filter(l => l.choiceGroup === line.choiceGroup).length > 1 && <label className="flex items-center gap-2 mb-1"><input type="radio" name={`bom-${choiceScope}-${line.choiceGroup}`} aria-label={`Include ${line.name} in BOM`} checked={line.included !== false} disabled={line.fitWarning?.startsWith('Does not match')} onChange={() => choosePart(line.choiceGroup!, line.id)} />{line.included === false ? 'Alternative — not counted' : 'Included in BOM'}</label>}
      <div className="flex justify-between gap-2">
        <span className="font-semibold capitalize">{line.component}</span>
        <span className={line.priceZar === null ? 'shrink-0 text-amber-300' : 'shrink-0 font-mono text-teal-300'}>{line.priceZar === null ? 'Price unknown' : formatBomZar(line.priceZar)}</span>
      </div>
      <p className="mt-1 break-words text-[10px] text-slate-300">{line.name}{line.included === false ? ' · Not counted' : !line.visible ? ' · Hidden in view' : ''}</p>
      {line.fitWarning && <p className="text-[10px] text-amber-300">{line.fitWarning}</p>}
      {interactive && matches(line.catalogueItemId).length > 0 && <label className="block mt-1 text-[10px]">Supplier price option<select className="mt-1 w-full rounded bg-slate-800 p-1" aria-label={`Supplier price for ${line.name}`} value={selections[line.id] ?? ''} onChange={e => {
        const value = e.target.value || null;
        for (const id of line.partInstanceIds.length ? line.partInstanceIds : [line.id]) selectSupplier(id, value);
      }}><option value="">Automatic matching estimate</option>{matches(line.catalogueItemId).map(l => <option key={l.id} value={l.id}>{l.supplierName} · {l.sku ?? l.id} · {l.unitPrice === null ? 'Price unknown' : `${l.currency} ${l.unitPrice.toFixed(2)}`}{l.alternativePriceNote ? ' · provisional alternative' : ''}</option>)}</select></label>}
      {interactive && line.partInstanceIds.length > 0 && <button type="button" aria-label={`Apply ${line.name} to watch`} className="mt-2 rounded border border-teal-700 px-2 py-1 text-teal-300 disabled:opacity-40" disabled={line.included === false || line.fitWarning?.startsWith('Does not match')} onClick={() => {
        try { setFeedback(applyBomSelection(line.id, selections[line.id] ?? line.listingId)); }
        catch (error) { setFeedback(error instanceof Error ? error.message : 'Unable to apply this component.'); }
      }}>Apply to watch</button>}
      <p className="text-[10px] text-slate-400">{line.supplierName ?? 'No priced supplier linked'}{line.listingId && (line.status === 'selected' ? ' · Selected listing' : ' · Listing estimate (not selected)')}</p>
      {line.supplierSku && <p className="text-[10px] text-slate-400">Option: {line.supplierSku}</p>}
      {line.alternativePriceNote && <p className="text-[10px] text-amber-300">{line.alternativePriceNote}</p>}
      {line.productUrl && /^https:\/\//.test(line.productUrl) && <a className="text-[10px] text-teal-300 underline" href={line.productUrl} target="_blank" rel="noopener noreferrer">View supplier option</a>}
      {line.nativePrice != null && <p className="text-[10px] text-slate-400">{line.currency} {line.nativePrice.toFixed(2)} · Checked: {line.lastCheckedIso ?? 'Not recorded'}</p>}
      {line.listingId && <p className="text-[10px] text-slate-400">Shipping: {line.shippingZar === null ? 'Unknown — verify before buying' : formatBomZar(line.shippingZar)}</p>}
    </div>)}
  </div>
  <p className="text-[10px] text-slate-400">Rand conversion snapshot: {PRICING_SNAPSHOT.capturedAtIso}. Shipping estimates are per listing; combined supplier shipping may differ.</p>
</section>;
};
