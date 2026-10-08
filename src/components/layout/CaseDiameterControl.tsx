import { useEffect, useState } from 'react';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { applyToolbarDiameter, CASE_PREVIEW_MAX_MM, CASE_PREVIEW_MIN_MM } from './toolbarActions';

export const CaseDiameterControl = () => {
  const assembly = useWatchAssemblyStore((state) => state.assembly);
  const lockedIds = useConfiguratorUIStore((state) => state.lockedPartIds);
  const diameter = assembly.globalDimensions.caseDiameterMm;
  const [draft, setDraft] = useState(String(diameter));
  const [error, setError] = useState<string | null>(null);
  const locked = Object.values(assembly.parts).some((part) => part.category === 'case' && (part.locked || lockedIds.has(part.instanceId)));
  useEffect(() => { setDraft(String(diameter)); }, [diameter]);
  const apply = () => {
    try {
      if (!draft.trim()) throw new Error('Enter a case preview diameter.');
      applyToolbarDiameter(Number(draft));
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Cannot resize preview.'); }
  };
  return <fieldset className="min-w-0 flex-1 rounded-md border border-engineering-border bg-engineering-bg/40 px-2 py-1 sm:min-w-[230px] sm:max-w-[380px]" disabled={locked}>
    <legend className="px-1 text-[10px] text-engineering-muted">Case preview diameter · mm {locked ? '· locked' : ''}</legend>
    <div className="flex items-center gap-2">
      <input aria-label="Case preview diameter slider" className="min-w-0 flex-1 accent-amber-400" type="range" min={CASE_PREVIEW_MIN_MM} max={CASE_PREVIEW_MAX_MM} step="0.1" value={draft.trim() && Number.isFinite(Number(draft)) ? Number(draft) : diameter} onChange={(event) => setDraft(event.target.value)} onPointerUp={apply} onKeyUp={(event) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) apply(); }} />
      <input aria-label="Case preview diameter millimetres" className="w-16 rounded border border-engineering-border bg-engineering-bg px-1.5 py-1 text-xs text-engineering-text" type="number" min={CASE_PREVIEW_MIN_MM} max={CASE_PREVIEW_MAX_MM} step="0.1" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); apply(); } }} />
      <button type="button" className="rounded border border-engineering-teal/40 px-1.5 py-1 text-[10px] text-engineering-teal disabled:opacity-40" onClick={apply}>Set</button>
    </div>
    <p className="mt-0.5 text-[9px] leading-tight text-engineering-muted">Custom preview only; supplier cases and hand lengths do not resize.</p>
    {error && <p role="alert" className="text-[10px] text-amber-300">{error}</p>}
  </fieldset>;
};
