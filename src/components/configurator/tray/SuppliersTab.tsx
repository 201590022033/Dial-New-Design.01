import React from 'react';
import { Store, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { cn } from '@/utils/cn';
import { getMovementSupplierReadiness } from '@/domain/movements/movementSupplierReadiness';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';

export const SuppliersTab: React.FC = () => {
  const activePartInstanceId = useConfiguratorUIStore((s) => s.activePartInstanceId);
  const assembly = useWatchAssemblyStore((s) => s.assembly);
  const supplierListings = useCatalogueStore((s) => s.supplierListings);
  const sourcingSelections = useSourcingStore((s) => s.sourcingPlan.selections);
  const setSupplierSelection = useSourcingStore((s) => s.setSupplierSelection);

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
  );

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
                      {listing.unitPrice !== null ? `R${listing.unitPrice}` : 'Quote required'}
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
                  </span>
                  {isSelected ? (
                    <span className="text-teal-400 font-semibold flex items-center gap-1">
                      <Check className="h-3 w-3" /> Selected Supplier
                    </span>
                  ) : (
                    <span className="text-slate-400 group-hover:text-slate-300">Click to Select</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
