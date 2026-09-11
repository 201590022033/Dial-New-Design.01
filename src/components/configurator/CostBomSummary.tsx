import React, { useState } from 'react';
import {
  ReceiptText,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  X,
  CheckCircle2
} from 'lucide-react';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { cn } from '@/utils/cn';

export const CostBomSummary: React.FC = () => {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isIssuesPanelOpen, setIsIssuesPanelOpen] = useState(false);
  const [activeSensitivityPopover, setActiveSensitivityPopover] = useState<string | null>(null);

  const getCommittedCost = useConfiguratorUIStore((s) => s.getCommittedCost);
  const getBuildReadiness = useConfiguratorUIStore((s) => s.getBuildReadiness);
  const getPracticalSensitivities = useConfiguratorUIStore((s) => s.getPracticalSensitivities);
  const toggleSuppressSensitivity = useConfiguratorUIStore((s) => s.toggleSuppressSensitivity);
  const lastCommittedSnapshot = useConfiguratorUIStore((s) => s.lastCommittedSnapshot);
  const undoLastChange = useConfiguratorUIStore((s) => s.undoLastChange);
  const costPulseStatus = useConfiguratorUIStore((s) => s.costPulseStatus);
  const startGuidedFix = useConfiguratorUIStore((s) => s.startGuidedFix);
  const selectPartContext = useConfiguratorUIStore((s) => s.selectPartContext);

  const cost = getCommittedCost();
  const readiness = getBuildReadiness();
  const sensitivities = getPracticalSensitivities();

  const pulseClass =
    costPulseStatus === 'improvement'
      ? 'animate-bounce text-emerald-400 font-bold'
      : costPulseStatus === 'caution'
        ? 'animate-bounce text-amber-400 font-bold'
        : costPulseStatus === 'incompatibility'
          ? 'animate-pulse text-rose-400 font-bold'
          : 'text-slate-100 font-bold';

  return (
    <div
      className="relative flex items-center justify-between px-4 py-2.5 bg-slate-900/95 border-t border-slate-800 text-xs text-slate-300 z-20 shadow-md select-none"
      data-testid="cost-bom-summary-bar"
    >
      {/* Left: Headline Cost & Breakdown toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Build Cost:
          </span>
          <span className={cn('text-sm font-mono tracking-tight transition-colors', pulseClass)}>
            R{cost.grandTotal.toLocaleString()}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60"
        >
          <span>Breakdown</span>
          {isBreakdownOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        {/* Undo button */}
        {lastCommittedSnapshot && (
          <button
            type="button"
            onClick={undoLastChange}
            className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 bg-slate-800 px-2 py-0.5 rounded border border-teal-500/40"
            title="Undo last committed change"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Undo</span>
          </button>
        )}
      </div>

      {/* Centre: Build Readiness Summary */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsIssuesPanelOpen(!isIssuesPanelOpen)}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1 rounded-md border text-[11px] transition-colors',
            readiness.unresolvedCount > 0
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 hover:bg-rose-900/50'
              : readiness.customCount > 0
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-300 hover:bg-amber-900/50'
                : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
          )}
        >
          <span className="font-mono">
            {readiness.sourcedCount} sourced · {readiness.customCount} custom · {readiness.unresolvedCount} unresolved
          </span>
          <span className="text-[10px] text-slate-400 underline">
            {readiness.readinessLabel}
          </span>
        </button>
      </div>

      {/* Right: Practical Sensitivities */}
      <div className="flex items-center gap-2">
        {sensitivities
          .filter((s) => !s.suppressed)
          .map((sens) => (
            <div key={sens.kind} className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveSensitivityPopover(
                    activeSensitivityPopover === sens.kind ? null : sens.kind
                  )
                }
                className="flex items-center gap-1 text-[10px] font-medium text-teal-300 bg-teal-950/50 border border-teal-800/60 px-2 py-0.5 rounded-full hover:bg-teal-900/50"
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>{sens.label}</span>
              </button>

              {/* Popover explaining sensitivity */}
              {activeSensitivityPopover === sens.kind && (
                <div className="absolute right-0 bottom-8 w-64 p-2.5 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl z-50 text-[11px]">
                  <div className="flex items-start justify-between pb-1 border-b border-slate-800">
                    <span className="font-semibold text-slate-200">{sens.label}</span>
                    <button
                      type="button"
                      onClick={() => setActiveSensitivityPopover(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-slate-400 mt-1">{sens.explanation}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px]">
                    <span className="text-slate-400">Order influence: Active</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          toggleSuppressSensitivity(sens.kind);
                          setActiveSensitivityPopover(null);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700"
                      >
                        Ignore
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSensitivityPopover(null)}
                        className="px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium"
                      >
                        Keep
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Expandable Cost Breakdown Popover */}
      {isBreakdownOpen && (
        <div
          data-testid="cost-breakdown-modal"
          className="absolute left-4 bottom-12 w-80 p-3 rounded-lg bg-slate-950 border border-slate-800 shadow-2xl z-50 text-xs font-sans space-y-2"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
              <ReceiptText className="h-3.5 w-3.5 text-teal-400" />
              Build Cost Breakdown
            </h4>
            <button
              type="button"
              onClick={() => setIsBreakdownOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span>Verified Components:</span>
              <span>R{cost.partsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated Shipping:</span>
              <span>R{cost.shippingEstimate.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Import Duties & Taxes:</span>
              <span>R{cost.dutiesAndTaxesEstimate.toLocaleString()}</span>
            </div>
            {cost.customFabricationEstimate > 0 && (
              <div className="flex justify-between text-amber-300">
                <span>Custom Machining/Fabrication:</span>
                <span>R{cost.customFabricationEstimate.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Watchmaker Assembly & Regulation:</span>
              <span>R{cost.watchmakerLabourEstimate.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-2 flex justify-between font-mono font-bold text-slate-100 text-xs">
            <span>Committed Total:</span>
            <span className="text-teal-400">R{cost.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Expandable Readiness / Issues Panel */}
      {isIssuesPanelOpen && (
        <div
          data-testid="readiness-issues-panel"
          className="absolute left-1/2 -translate-x-1/2 bottom-12 w-96 p-3.5 rounded-lg bg-slate-950 border border-slate-800 shadow-2xl z-50 text-xs font-sans space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-teal-400" />
              Build Readiness Status
            </h4>
            <button
              type="button"
              onClick={() => setIsIssuesPanelOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {readiness.issues.length === 0 ? (
              <div className="flex items-center gap-2 p-2 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>All physical interfaces and tolerances are fully resolved!</span>
              </div>
            ) : (
              readiness.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400">{issue.code}</span>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase',
                        issue.status === 'red'
                          ? 'text-rose-400'
                          : issue.status === 'yellow'
                            ? 'text-amber-400'
                            : 'text-amber-300'
                      )}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-slate-200">{issue.summary}</p>

                  <div className="flex items-center gap-2 pt-1">
                    {issue.affectedPartIds && issue.affectedPartIds[0] && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetPartId = issue.affectedPartIds![0];
                          if (targetPartId) {
                            selectPartContext(targetPartId);
                            setIsIssuesPanelOpen(false);
                          }
                        }}
                        className="text-[10px] text-teal-400 hover:underline"
                      >
                        Inspect Part
                      </button>
                    )}
                    {issue.remedy && (
                      <button
                        type="button"
                        onClick={() => {
                          startGuidedFix(issue, issue.remedy);
                          setIsIssuesPanelOpen(false);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold ml-auto"
                      >
                        Fix: {issue.remedy.title}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
