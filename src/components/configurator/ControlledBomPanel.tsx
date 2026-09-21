import React from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldCheck } from 'lucide-react';
import {
  CONTROLLED_ORDER_ID,
  generateControlledBom,
  type ControlledBomLine,
  type EngineeringProvenanceStatus
} from '@/domain/ordering/controlledNmk901Order';
import { cn } from '@/utils/cn';

const provenanceLabel: Record<EngineeringProvenanceStatus, string> = {
  PUBLISHED: 'Published',
  DERIVED: 'Derived',
  DESIGN_TARGET: 'Design target',
  SUPPLIER_CONTROLLED: 'Supplier controlled',
  VERIFY_GOLDEN_SAMPLE: 'Golden sample required',
  COMPATIBILITY_ONLY: 'Compatibility only',
  ESTIMATED_NOMINAL: 'Estimated nominal'
};

const statusClass = (status: ControlledBomLine['validationStatus']): string =>
  status === 'supported'
    ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/70'
    : status === 'soft-warning'
      ? 'text-amber-200 bg-amber-950/40 border-amber-700/70'
      : 'text-orange-300 bg-orange-950/40 border-orange-800/70';

export const ControlledBomPanel: React.FC = () => {
  const bom = generateControlledBom();
  const passed = bom.fit.checks.filter((check) => check.status === 'pass').length;
  const failed = bom.fit.checks.filter((check) => check.status === 'fail').length;
  const warnings = bom.fit.softWarnings.length;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-950 p-3 text-xs text-slate-200" data-testid="controlled-bom-panel">
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400">Controlled order preset</span>
            <h2 className="mt-1 text-sm font-semibold text-slate-100">NMK901 / SKX007-SRPD / 42 mm</h2>
            <p className="mt-1 text-[11px] text-slate-400">NH35 Type-M only. No alternate case or movement variants are exposed here.</p>
          </div>
          <ClipboardList className="h-5 w-5 shrink-0 text-teal-400" />
        </div>
        <p className="mt-2 font-mono text-[10px] text-slate-500">{CONTROLLED_ORDER_ID}</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded border border-emerald-800/70 bg-emerald-950/30 p-2 text-center">
          <div className="text-sm font-semibold text-emerald-300">{passed}</div>
          <div className="text-[10px] uppercase text-slate-400">Supported</div>
        </div>
        <div className="rounded border border-amber-800/70 bg-amber-950/30 p-2 text-center">
          <div className="text-sm font-semibold text-amber-300">{warnings}</div>
          <div className="text-[10px] uppercase text-slate-400">Soft warnings</div>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900 p-2 text-center">
          <div className="text-sm font-semibold text-slate-200">{failed}</div>
          <div className="text-[10px] uppercase text-slate-400">Incompatible</div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-teal-800/60 bg-teal-950/20 p-2.5">
        <div className="flex items-center gap-2 text-teal-300">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-semibold">Order status: {bom.fit.orderable ? 'Orderable' : 'Blocked'}</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-300">Supported interfaces pass; supplier-controlled and golden-sample values remain visible as assembly validation holds.</p>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="font-semibold text-slate-200">Deterministic BOM ({bom.lines.length} lines)</h3>
        {bom.lines.map((line) => (
          <div key={line.sku} className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-slate-200">{line.quantity}x {line.selectedComponent}</div>
                <div className="font-mono text-[10px] text-slate-500">{line.sku}</div>
              </div>
              <span className={cn('rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase', statusClass(line.validationStatus))}>
                {line.validationStatus === 'supported' ? 'Supported' : line.validationStatus === 'soft-warning' ? 'Estimated warning' : 'Manual validation'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
              <span>{provenanceLabel[line.provenance]}</span>
              {Object.entries(line.criticalDimensions).map(([key, value]) => <span key={key}>{key}: {value}</span>)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-amber-800/60 bg-amber-950/20 p-2.5">
        <div className="flex items-center gap-2 font-semibold text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          Golden-sample backlog
        </div>
        <ul className="mt-1 list-inside list-disc space-y-1 text-[10px] text-slate-300">
          {bom.fit.manualValidationRequired.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-300"><CheckCircle2 className="h-3 w-3" /> Estimated nominal fields remain soft warnings pending Golden Sample #1.</div>
      </div>
    </div>
  );
};
