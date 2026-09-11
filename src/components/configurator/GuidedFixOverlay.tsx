import React, { useMemo } from 'react';
import {
  Wrench,
  CheckCircle2,
  X,
  ArrowRight
} from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import {
  evaluateAssembly
} from '@/domain/compatibility/compatibilityEngine';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { cn } from '@/utils/cn';

export const GuidedFixOverlay: React.FC = () => {
  const isGuidedFixActive = useConfiguratorUIStore((s) => s.isGuidedFixActive);
  const activeIssue = useConfiguratorUIStore((s) => s.activeIssue);
  const activeRemedy = useConfiguratorUIStore((s) => s.activeRemedy);
  const closeGuidedFix = useConfiguratorUIStore((s) => s.closeGuidedFix);
  const setPreview = useConfiguratorUIStore((s) => s.setPreview);
  const applyPreview = useConfiguratorUIStore((s) => s.applyPreview);

  const assembly = useWatchAssemblyStore((s) => s.assembly);
  const catalogueItems = useCatalogueStore((s) => s.items);

  // Continuously re-evaluate current assembly against this specific issue
  const currentEvaluation = useMemo(() => {
    return evaluateAssembly(assembly);
  }, [assembly]);

  // Check if active issue is technically resolved
  const isResolved = useMemo(() => {
    if (!activeIssue) return true;
    const matchingCheck = currentEvaluation.checks.find(
      (c) =>
        c.code === activeIssue.code &&
        JSON.stringify(c.affectedPartIds) === JSON.stringify(activeIssue.affectedPartIds)
    );
    return !matchingCheck || matchingCheck.status === 'green';
  }, [currentEvaluation, activeIssue]);

  // Suggested catalogue remedies if available
  const suggestedItems = useMemo(() => {
    if (!activeRemedy?.suggestedCatalogueItemIds) return [];
    return catalogueItems.filter((item) =>
      activeRemedy.suggestedCatalogueItemIds?.includes(item.id)
    );
  }, [activeRemedy, catalogueItems]);

  if (!isGuidedFixActive || !activeIssue) {
    return null;
  }

  const affectedPartId = activeIssue.affectedPartIds?.[0];

  const handleApplySuggested = (item: (typeof suggestedItems)[number]) => {
    if (!affectedPartId) return;

    const provisional: WatchAssembly = JSON.parse(JSON.stringify(assembly)) as WatchAssembly;
    if (provisional.parts[affectedPartId]) {
      provisional.parts[affectedPartId].catalogueItemId = item.id;
      provisional.parts[affectedPartId].name = item.displayName;
      provisional.parts[affectedPartId].dimensions = {
        diameterMm: item.nominalDimensions.diameterMm,
        thicknessMm: item.nominalDimensions.thicknessMm,
        widthMm: item.nominalDimensions.widthMm,
        offsetXmm: provisional.parts[affectedPartId].dimensions.offsetXmm ?? 0,
        offsetYmm: provisional.parts[affectedPartId].dimensions.offsetYmm ?? 0
      };
    }

    setPreview(provisional, affectedPartId, item);
    applyPreview();
  };

  return (
    <div
      data-testid="guided-fix-overlay"
      className="fixed inset-x-0 top-12 z-50 flex justify-center px-4 pointer-events-none"
    >
      <div className="w-full max-w-xl bg-slate-950/95 border border-teal-500/80 rounded-xl shadow-2xl p-4 text-xs text-slate-200 pointer-events-auto backdrop-blur-md">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-teal-950 text-teal-400 border border-teal-800/80">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-teal-400">Guided Resolution</span>
              <h3 className="text-sm font-semibold text-slate-100">
                Fixing: {activeRemedy?.title ?? activeIssue.summary}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={closeGuidedFix}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            title="Cancel Guided Fix"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current technical issue summary */}
        <div className="my-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400">{activeIssue.code}</span>
            <span
              className={cn(
                'text-[10px] font-bold uppercase',
                isResolved
                  ? 'text-emerald-400'
                  : activeIssue.status === 'red'
                    ? 'text-rose-400'
                    : 'text-amber-400'
              )}
            >
              {isResolved ? 'RESOLVED ✓' : activeIssue.status}
            </span>
          </div>
          <p className="text-slate-200">{activeIssue.summary}</p>
          {activeRemedy?.description && (
            <p className="text-[11px] text-teal-300/90 pt-1 border-t border-slate-800/60">
              Remedy: {activeRemedy.description}
            </p>
          )}
        </div>

        {/* Suggested components to swap in */}
        {suggestedItems.length > 0 && !isResolved && (
          <div className="space-y-2 mb-3">
            <span className="text-[11px] font-semibold text-slate-300 block">
              Compatible Replacement Candidates:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {suggestedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-teal-500/60 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-slate-200 block text-xs">
                      {item.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.nominalDimensions.diameterMm}mm · Verified catalogue component
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplySuggested(item)}
                    className="px-2.5 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs flex items-center gap-1"
                  >
                    <span>Use Part</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution State Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {isResolved ? (
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Issue technical conditions are satisfied!</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">
              Select or configure an alternative above to resolve.
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeGuidedFix}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={closeGuidedFix}
              disabled={!isResolved}
              className={cn(
                'px-4 py-1 rounded font-semibold text-xs transition-colors',
                isResolved
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              )}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
