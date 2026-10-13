import React, { useMemo, useState } from 'react';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { readDesignIntent, type DesignIntentV1 } from '@/domain/design-first/designIntent';
import { designAssemblyIdentity } from '@/domain/design-first/designBriefExtraction';
import { deriveCaseConstraints, findSelectedCase } from '@/domain/design-first/caseConstraintAdapter';
import type { EvidenceField } from '@/domain/design-first/evidence';
import { useDesignMatchingStore } from '@/stores/designMatchingStore';
import { DesignMatchResults } from './DesignMatchResults';

const inputStyle = 'w-full min-w-0 rounded border border-slate-600 bg-slate-950 p-2 text-xs text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400';
const buttonStyle = 'rounded border border-teal-600 bg-teal-950 px-3 py-2 text-xs text-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400';
const evidenceText = <T,>(field: EvidenceField<T>, describe: (value: T) => string): string => {
  if (field.state === 'unknown') return `Unknown — ${field.reason}`;
  if (field.state === 'assumed') return `${describe(field.value)} — assumed; ${field.reason}`;
  return `${describe(field.value)} — recorded, ${field.review === 'reviewed' ? 'reviewed' : 'not reviewed'}`;
};

/** Preferences persist; explicit local catalogue searches and previews remain transient. */
export const DesignIntentPanel: React.FC = () => {
  const assembly = useWatchAssemblyStore(state => state.assembly);
  const setDesignIntent = useWatchAssemblyStore(state => state.setDesignIntent);
  const items = useCatalogueStore(state => state.items);
  const targetId = useConfiguratorUIStore(state => state.activePartInstanceId);
  const saved = useMemo(() => readDesignIntent(assembly), [assembly]);
  const savedKey = JSON.stringify(saved);
  const [editing, setEditing] = useState({ base: savedKey, value: saved });
  const intent = editing.base === savedKey ? editing.value : saved;
  const brief = useDesignMatchingStore(state => state.brief);
  const search = useDesignMatchingStore(state => state.search);
  const searchedIntent = useDesignMatchingStore(state => state.intent);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const selectedCase = useMemo(() => findSelectedCase(assembly, items), [assembly, items]);
  const constraints = useMemo(() => {
    try { return { value: deriveCaseConstraints(assembly, intent.mode, items), error: '' }; }
    catch (cause) { return { value: null, error: cause instanceof Error ? cause.message : 'Case information is unavailable.' }; }
  }, [assembly, intent.mode, items]);
  const stale = brief !== null && (brief.assembly.identityToken !== designAssemblyIdentity(assembly, intent, items) || brief.target.partInstanceId !== targetId);
  const preferencesChanged = brief !== null && (JSON.stringify(searchedIntent) !== JSON.stringify(intent) || brief.target.partInstanceId !== targetId);
  const patch = (change: Partial<DesignIntentV1>) => {
    setEditing({ base: savedKey, value: { ...intent, ...change } });
    setMessage('Preferences changed. Save them to keep them with this design.');
    setError('');
  };
  const save = () => {
    try {
      setDesignIntent(intent);
      setEditing({ base: JSON.stringify(intent), value: intent });
      setMessage('Design preferences saved.');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save preferences.');
    }
  };
  const findParts = () => {
    if (!targetId || !assembly.parts[targetId]) { setError('Select an available component before finding parts.'); return; }
    setError('');
    setMessage(search(targetId, intent) ? 'Parts search completed for the preferences shown above.' : '');
  };
  const hardware = constraints.value?.hardware;
  return (
    <details open className="min-w-0 rounded border border-slate-700 bg-slate-900/60 text-xs text-slate-200">
      <summary className="cursor-pointer p-3 font-semibold text-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400">Design &amp; fit intent</summary>
      <div className="space-y-3 px-3 pb-3">
        <label className="block space-y-1">
          <span>Design approach</span>
          <select className={inputStyle} value={intent.mode} onChange={event => patch({ mode: event.target.value as DesignIntentV1['mode'] })}>
            <option value="concept">Concept design</option>
            <option value="selected-case">Build around selected case</option>
          </select>
        </label>
        <p className="break-words text-slate-400">{intent.mode === 'concept'
          ? 'Explore your design before choosing hardware. The case preview diameter does not establish fitting sizes.'
          : 'Use the selected case as a starting point. Its identity alone does not verify that other parts fit.'}</p>
        <label className="flex items-start gap-2"><input type="checkbox" checked={intent.preserveDimensions} onChange={event => patch({ preserveDimensions: event.target.checked })} /><span>Keep my design dimensions</span></label>
        <label className="flex items-start gap-2"><input type="checkbox" checked={intent.preserveAppearance} onChange={event => patch({ preserveAppearance: event.target.checked })} /><span>Keep my design appearance</span></label>
        <label className="block space-y-1"><span>Style notes</span><textarea rows={3} maxLength={4000} className={inputStyle} value={intent.styleNotes} onChange={event => patch({ styleNotes: event.target.value })} /></label>
        <button type="button" className={buttonStyle} onClick={save}>Save preferences</button>
        <details className="border-t border-slate-700 pt-3">
          <summary className="cursor-pointer font-semibold text-teal-300">Case measurements &amp; package evidence</summary>
        <section aria-label="Case evidence" className="mt-2 space-y-2 break-words">
          <p className="font-semibold">{intent.mode === 'selected-case' ? `Selected case: ${selectedCase?.item.displayName ?? 'No unique case selected'}` : 'Concept case constraints'}</p>
          {constraints.error && <p>{constraints.error}</p>}
          {constraints.value && <>
            <p>Case diameter: {evidenceText(constraints.value.outerDiameterMm, value => `${value} mm`)}</p>
            <p>Crystal seat: {evidenceText(constraints.value.interfaces.crystalSeatDiameterMm, value => `${value} mm`)}</p>
            <p>Crown stem height: {evidenceText(constraints.value.interfaces.stemHeightMm, value => `${value} mm`)}</p>
            <p>Lug width: {evidenceText(constraints.value.interfaces.lugWidthMm, value => `${value} mm`)}</p>
          </>}
          {hardware && (['crystal', 'crown', 'rotating-bezel'] as const).map(slot => <div key={slot} className="border-l-2 border-slate-700 pl-2">
            <p className="font-medium">{slot === 'rotating-bezel' ? 'Rotating bezel' : slot === 'crystal' ? 'Crystal' : 'Crown'}</p>
            <p>Package: {evidenceText(hardware[slot].inclusion, value => value === 'not-included' ? 'Not included' : value === 'included' ? 'Included' : 'Optional')}</p>
            <p>Interface: {evidenceText(hardware[slot].fixedInterface, value => value ? 'Fixed by case' : 'Not fixed by case')}</p>
          </div>)}
          <p className="text-slate-400">Included parts and case constraints are separate from verified fit. No dimensions or parts change when saving these preferences.</p>
        </section>
        </details>
        <div className="space-y-2 border-t border-slate-700 pt-3">
          <p>Search target: <span className="font-semibold">{targetId ? assembly.parts[targetId]?.name ?? 'Unavailable component' : 'Select a component'}</span></p>
          <p className="text-slate-400">Search uses the preferences shown above. Save preferences separately to keep them with your design.</p>
          <button type="button" disabled={!targetId || !assembly.parts[targetId]} className={`${buttonStyle} disabled:opacity-40`} onClick={findParts}>Find closest parts</button>
        </div>
        <DesignMatchResults stale={stale} preferencesChanged={preferencesChanged} />
        <p role="status" aria-live="polite" className="break-words text-slate-300">{message}</p>
        {error && <p role="alert" className="break-words text-amber-300">{error}</p>}
      </div>
    </details>
  );
};
