import React, { useState } from 'react';
import { Store, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { cn } from '@/utils/cn';
import { getMovementSupplierReadiness } from '@/domain/movements/movementSupplierReadiness';
import { formatListingPrice, isListingPriceStale, listingKnownLandedZar, listingPriceZar, listingShippingZar } from '@/domain/catalogue/pricing';
import { partDiscoveryLinks, partDiscoveryQuery } from '@/domain/sourcing/partDiscovery';
import { DesignIntentPanel } from '../DesignIntentPanel';
import { SupplierDraftPanel } from '../SupplierDraftPanel';
import { designPartSlot } from '@/domain/design-first/designBriefExtraction';

export const SuppliersTab: React.FC = () => {
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const assembly = useWatchAssemblyStore((s) => s.assembly);
  const supplierListings = useCatalogueStore((s) => s.supplierListings);
  const catalogueItems = useCatalogueStore((s) => s.items);
  const sourcingSelections = useSourcingStore((s) => s.sourcingPlan.selections);
  const setSupplierSelection = useSourcingStore((s) => s.setSupplierSelection);
  const [discovery, setDiscovery] = useState<{ partId: string; query: string; cheaper: boolean; searchedAt?: string } | null>(null);
  const beginSearch = (cheaper: boolean) => {
    const part = activePartInstanceId && assembly.parts[activePartInstanceId];
    if (part) setDiscovery({ partId: part.instanceId, query: partDiscoveryQuery(assembly, part), cheaper });
  };

  if (!activePartInstanceId) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs">
        <p>Select a component to inspect suppliers and procurement listings.</p>
        <SupplierDraftPanel />
      </div>
    );
  }

  const activePart = assembly.parts[activePartInstanceId];
  const relevantListings = supplierListings.filter(
    (l) => l.catalogueItemId === activePart?.catalogueItemId
  ).sort((left, right) => {
    const leftLanded = listingKnownLandedZar(left);
    const rightLanded = listingKnownLandedZar(right);
    if (leftLanded !== null && rightLanded !== null) return leftLanded - rightLanded;
    if (leftLanded !== null) return -1;
    if (rightLanded !== null) return 1;
    return (listingPriceZar(left) ?? Number.POSITIVE_INFINITY) - (listingPriceZar(right) ?? Number.POSITIVE_INFINITY);
  });

  const selectedListingId = sourcingSelections[activePartInstanceId] ?? null;
  const activeItem = catalogueItems.find(item => item.id === activePart?.catalogueItemId);
  const movementReadiness = activeItem?.kind === 'movement'
    ? getMovementSupplierReadiness(assembly.metadata.movement)
    : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-4" data-testid="suppliers-tab">
      <DesignIntentPanel />
      <div className="border-b border-slate-800 pb-2">
        {activePart?.crownCapConcept && <p role="status" className="text-xs text-amber-200">Protected cap/holder is a presentation concept with no orderable hardware. Listings below price only the operating crown; they do not qualify the cap or holder.</p>}
        <h3 className="text-xs font-semibold text-slate-200">
          Suppliers for {activePart?.name ?? 'Component'}
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Selecting a seller updates procurement records and BOM pricing with zero mutation to CAD geometry.
        </p>
      </div>

      <button type="button" className="rounded border border-teal-700 p-2 text-xs text-teal-200" onClick={() => beginSearch(false)}>Find this part online</button>
      {discovery?.partId === activePartInstanceId && <section className="rounded border border-slate-700 p-3 space-y-2 text-[11px] text-slate-300" aria-label="Online part discovery">
        <h4>{discovery.cheaper ? 'Compare cheaper alternatives' : 'Discover a matching part'}</h4>
        <label className="block">Search terms (edit dimensions, colour or hand style)
          <input aria-label="Part search query" className="mt-1 w-full rounded bg-slate-950 p-2" maxLength={300} value={discovery.query} onChange={(event) => setDiscovery({ ...discovery, query: event.target.value, searchedAt: undefined })} />
        </label>
        <div className="flex flex-wrap gap-2">{partDiscoveryLinks(discovery.query).map((link) => <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline" onClick={() => setDiscovery({ ...discovery, searchedAt: new Date().toISOString() })}>{link.name}</a>)}</div>
        {discovery.searchedAt && <p role="status">Search opened {new Date(discovery.searchedAt).toLocaleString()} (not a price check).</p>}
        <p>Results are unverified. Check the exact variant, movement, dial seat, hand bores and drawings before ordering. Colours are presentation choices, not confirmed supplier stock.</p>
        <p>Compare item + shipping to South Africa, then taxes / duties and discounts at checkout. An unknown shipping price is not free shipping. Search engines cannot guarantee the cheapest compatible part.</p>
        <p>Save an AliExpress price snapshot in Supplier drafts below. It stays in the review queue until reviewed and published.</p>
      </section>}

      <SupplierDraftPanel catalogueItemId={activePart?.catalogueItemId ?? null} slot={activeItem ? designPartSlot(activeItem) : undefined} />

      {movementReadiness && !movementReadiness.orderable && (
        <div className="rounded-lg border border-amber-700/60 bg-amber-950/30 p-3 text-[11px] text-amber-100">
          <p className="font-semibold">Movement-specific sourcing is incomplete</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-amber-200/80">
            {movementReadiness.blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </div>
      )}

      {relevantListings.length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
          <HelpCircle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
          <p>No saved commercial listings for this component ID.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Price and South Africa shipping remain unknown until a matching offer is recorded.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {relevantListings.map((listing) => {
            const isSelected = selectedListingId === listing.id;

            return (
              <div
                key={listing.id}
                onClick={() => setSupplierSelection(activePartInstanceId, listing.id)}
                className={cn(
                  'flex flex-col p-3 rounded-lg border transition-all cursor-pointer',
                  isSelected
                    ? 'bg-slate-800/90 border-teal-400 ring-1 ring-teal-400/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5 text-teal-400" />
                      {listing.supplierName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SKU: {listing.sku ?? 'N/A'} · Lead: {listing.leadTimeDays === null || listing.leadTimeDays === undefined ? 'unknown' : `${listing.leadTimeDays} days`}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-100">
                      {formatListingPrice(listing)}
                    </span>
                    <span className="block text-[10px] text-emerald-400 font-medium">
                      {listing.stockStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className={cn('h-3 w-3', listing.verificationStatus === 'verified' ? 'text-teal-400' : 'text-amber-400')} />
                    {listing.verificationStatus}
                    {isListingPriceStale(listing) && <span className="ml-1 rounded bg-amber-950 px-1 text-amber-300">stale / re-check</span>}
                  </span>
                  {isSelected ? (
                    <span className="text-teal-400 font-semibold flex items-center gap-1">
                      <Check className="h-3 w-3" /> Selected Supplier
                    </span>
                  ) : (
                    <span className="text-slate-400 group-hover:text-slate-300">Click to Select</span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{listing.lastCheckedIso ? `Checked ${new Date(listing.lastCheckedIso).toLocaleString()}` : 'Price timestamp unavailable'}</span>
                  <span className={listingShippingZar(listing) === null ? 'text-amber-300' : 'text-slate-300'}>
                    {listingShippingZar(listing) === null
                      ? `Shipping to ${listing.shippingDestination ?? 'South Africa'}: verify at checkout`
                      : `Shipping ≈R${Math.round(listingShippingZar(listing) ?? 0).toLocaleString()}`}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                  <button type="button" className="text-cyan-300 underline" onClick={(event) => { event.stopPropagation(); beginSearch(true); }}>Find a cheaper alternative online</button>
                  {listing.productUrl && <a href={listing.productUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline" onClick={(event) => event.stopPropagation()}>Open product listing</a>}
                </div>
                {listing.notes && <p className="mt-2 text-[10px] text-amber-200/80">{listing.notes}</p>}
                {listing.engineeringEvidence && (
                  <div className="mt-2 rounded border border-slate-800 bg-slate-950/60 px-2 py-1.5 text-[10px] text-slate-400">
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        <span className={listing.engineeringEvidence.glbReadiness === 'supplier-exact-ready' ? 'text-emerald-300' : 'text-amber-300'}>
                          GLB: {listing.engineeringEvidence.glbReadiness.replaceAll('-', ' ')}
                        </span>
                        <span className="mx-1">·</span>
                        <span>{listing.engineeringEvidence.level.replaceAll('-', ' ')}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {listing.engineeringEvidence.drawingUrl && (
                          <a
                            href={listing.engineeringEvidence.drawingUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="text-emerald-300 underline decoration-emerald-700 underline-offset-2 hover:text-emerald-200"
                          >
                            Open drawing
                          </a>
                        )}
                        {listing.productUrl && (
                          <a
                            href={listing.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="text-cyan-300 underline decoration-cyan-700 underline-offset-2 hover:text-cyan-200"
                          >
                            Open listing
                          </a>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
