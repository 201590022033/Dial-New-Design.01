import React from 'react';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { evaluateAssembly } from '@/domain/compatibility/compatibilityEngine';
import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import type { BuildReadiness, CostBreakdown } from '@/domain/configurator/configuratorTypes';
import type { AssemblyCompatibilityEvaluation } from '@/domain/compatibility/compatibilityTypes';

/** Procurement must describe the active assembly, never a different kit. */
export const ControlledBomPanel: React.FC = () => {
  const assembly = useWatchAssemblyStore((s) => s.assembly);
  const selections = useSourcingStore((s) => s.sourcingPlan.selections);
  const readiness = useConfiguratorUIStore.getState().getBuildReadiness();
  const cost = useConfiguratorUIStore.getState().getCommittedCost();
  const compatibility = evaluateAssembly(assembly);
  return <ActiveBuildBomView assembly={assembly} selections={selections} readiness={readiness} cost={cost} compatibility={compatibility} />;
};

export const ActiveBuildBomView: React.FC<{
  assembly: WatchAssembly; selections: Record<string, string | null>;
  readiness: BuildReadiness; cost: CostBreakdown; compatibility: AssemblyCompatibilityEvaluation;
}> = ({ assembly, selections, readiness, cost, compatibility }) => {
  const parts = assembly.partOrder.map((id) => assembly.parts[id]).filter((part): part is WatchAssemblyPartInstance => Boolean(part?.visible));
  return <div data-testid="controlled-bom-panel" className="flex h-full flex-col gap-3 overflow-y-auto bg-slate-950 p-3 text-xs text-slate-200">
    <h2 className="text-sm font-semibold">Active build BOM / Cost</h2>
    <p>{assembly.metadata.movement.toUpperCase()} · {assembly.globalDimensions.caseDiameterMm} mm case · {parts.length} visible components</p>
    <section className="rounded border border-amber-700 bg-amber-950/30 p-3" aria-label="Active build readiness">
      <p className="font-semibold">Build status: {readiness.readinessLabel}</p>
      <p className="mt-1">Compatibility: {compatibility.status.toUpperCase()} — {compatibility.summary}</p>
      <p className="mt-1">Planning estimate: R{cost.grandTotal.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</p>
      <p className="mt-2 text-slate-400">Not an order approval. Verify supplier interfaces, price timestamps and shipping before buying. A controlled reference kit does not certify this assembly.</p>
    </section>
    {parts.map((part) => <section key={part.instanceId} className="rounded border border-slate-800 bg-slate-900 p-2">
      <h3 className="font-semibold">{part.name}</h3>
      <p className="font-mono text-[10px] text-slate-400">{part.catalogueItemId} · Ø{part.dimensions.diameterMm} mm · {part.dimensions.thicknessMm} mm thick</p>
      <p className="text-[10px]">{selections[part.instanceId] ? `Selected listing: ${selections[part.instanceId]} — verify price and fit` : 'No supplier selected'}</p>
    </section>)}
  </div>;
};
