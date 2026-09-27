import React, { useState } from 'react';
import { Store, Check, ShieldCheck, HelpCircle, FileUp } from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { cn } from '@/utils/cn';
import { getMovementSupplierReadiness } from '@/domain/movements/movementSupplierReadiness';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { formatListingPrice, isListingPriceStale, listingKnownLandedZar, listingPriceZar, listingShippingZar } from '@/domain/catalogue/pricing';
import { parseAliExpressCapture, supplierListingFromCapture } from '@/domain/sourcing';

export const SuppliersTab: React.FC = () => {
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const assembly = useWatchAssemblyStore((s) => s.assembly);
  const supplierListings = useCatalogueStore((s) => s.supplierListings);
  const addSupplierListing = useCatalogueStore((s) => s.addSupplierListing);
  const sourcingSelections = useSourcingStore((s) => s.sourcingPlan.selections);
  const setSupplierSelection = useSourcingStore((s) => s.setSupplierSelection);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);

  const handleCaptureImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activePartInstanceId) return;
    const part = assembly.parts[activePartInstanceId];
    if (!part) return;
    try {
      const capture = parseAliExpressCapture(JSON.parse(await file.text()));
      const listing = supplierListingFromCapture(capture, part.catalogueItemId);
      addSupplierListing(listing);
      setSupplierSelection(activePartInstanceId, listing.id);
      setCaptureStatus(`Imported ${capture.sellerName}; item and shipping were timestamped ${new Date(capture.capturedAtIso).toLocaleString()}.`);
    } catch (error) {
      setCaptureStatus(`Import failed: ${error instanceof Error ? error.message : 'invalid capture file'}`);
    }
  };

  if (!activePartInstanceId) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs">
        Select a component to inspect verified suppliers and procurement listings.
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
  const movementReadiness = getCatalogueItem(activePart?.catalogueItemId ?? '')?.kind === 'movement'
    ? getMovementSupplierReadiness(assembly.metadata.movement)
    : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-4" data-testid="suppliers-tab">
      <div className="border-b border-slate-800 pb-2">
        <h3 className="text-xs font-semibold text-slate-200">
          Suppliers for {activePart?.name ?? 'Component'}
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Selecting a seller updates procurement records and BOM pricing with zero mutation to CAD geometry.
        </p>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-[11px] text-slate-300">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-200">AliExpress price snapshot</p>
            <p className="mt-0.5 text-slate-400">Import a capture JSON from the item-page helper. It remains unverified and keeps shipping separate.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-teal-700 bg-teal-950/40 px-2 py-1.5 text-teal-200 hover:border-teal-500">
            <FileUp className="h-3.5 w-3.5" /> Import
            <input type="file" accept="application/json,.json" className="hidden" onChange={(event) => { void handleCaptureImport(event); }} />
          </label>
        </div>
        {captureStatus && <p role="status" className="mt-2 text-amber-200">{captureStatus}</p>}
      </div>

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
          <p>No verified commercial listings registered for this component ID.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Component is currently priced using standard catalog estimates.
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
                      SKU: {listing.sku ?? 'N/A'} · Lead: {listing.leadTimeDays ?? 14} days
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
                    <ShieldCheck className="h-3 w-3 text-teal-400" />
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
