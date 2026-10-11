import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { CASE_SIZE_REFERENCES, getCaseSizeLabel, getCaseSizeMatches, getNearestCaseSizeReference, resolveCaseSizeTarget } from '@/domain/catalogue/caseSizeReferences';
import { applyToolbarDiameter, CASE_PREVIEW_MAX_MM, CASE_PREVIEW_MIN_MM } from './toolbarActions';
import { caseReferencePosition, caseReferenceTickPercent, parseCasePreviewDiameter, shouldCloseCaseReference } from './caseDiameterReferenceLayout';
import { CaseSizeReferenceThumbnail } from './CaseSizeReferenceThumbnail';
import './caseDiameterReferences.css';

/** Browsing is local UI state; only the existing checked action writes assembly. */
export const CaseDiameterControl = () => {
  const assembly = useWatchAssemblyStore((state) => state.assembly);
  const lockedIds = useConfiguratorUIStore((state) => state.lockedPartIds);
  const previewStatus = useConfiguratorUIStore((state) => state.previewStatus);
  const buildPreview = useConfiguratorUIStore((state) => state.archetypePreviewAssembly);
  const items = useCatalogueStore((state) => state.items);
  const diameter = assembly.globalDimensions.caseDiameterMm;
  const [draft, setDraft] = useState(String(diameter));
  const draftRef = useRef(String(diameter));
  const [error, setError] = useState<string | null>(null);
  const [referenceDiameter, setReferenceDiameter] = useState<number | null>(null);
  const [position, setPosition] = useState<ReturnType<typeof caseReferencePosition> | null>(null);
  const anchor = useRef<HTMLFieldSetElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureStart = useRef<string | null>(null);
  const gestureAssembly = useRef(assembly);
  const pinned = useRef(false);
  const popupId = useId();
  const locked = Object.values(assembly.parts).some((part) => part.category === 'case' && (part.locked || lockedIds.has(part.instanceId)));
  const pendingPreview = previewStatus === 'previewing' || Boolean(buildPreview);
  const disabled = locked || pendingPreview;
  const disabledReason = locked ? 'Unlock the case before resizing.' : pendingPreview ? 'Apply or cancel the current preview before resizing.' : null;
  const open = referenceDiameter !== null;
  const reference = referenceDiameter === null ? undefined : getNearestCaseSizeReference(referenceDiameter);
  const matches = referenceDiameter === null ? [] : getCaseSizeMatches(items, referenceDiameter);
  const selectedCase = resolveCaseSizeTarget(assembly, items);
  const selectedCaseItem = selectedCase ? items.find((item) => item.id === selectedCase.catalogueItemId) : undefined;

  useEffect(() => {
    draftRef.current = String(diameter);
    setDraft(String(diameter));
    gestureStart.current = null;
  }, [assembly, diameter]);
  const clearClose = () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const close = (restoreFocus = false) => {
    clearClose(); pinned.current = false; setReferenceDiameter(null);
    if (restoreFocus) toggle.current?.focus();
  };
  const show = (value: number) => {
    clearClose();
    if (Number.isFinite(value)) setReferenceDiameter(value);
  };
  const scheduleClose = () => {
    clearClose();
    if (!pinned.current && gestureStart.current === null) closeTimer.current = setTimeout(() => {
      const focused = document.activeElement;
      if (!shouldCloseCaseReference({
        pinned: pinned.current,
        dragging: gestureStart.current !== null,
        focusInside: Boolean(focused && (anchor.current?.contains(focused) || panel.current?.contains(focused))),
        pointerInside: Boolean(anchor.current?.matches(':hover') || panel.current?.matches(':hover'))
      })) return;
      setReferenceDiameter(null);
    }, 180);
  };
  useEffect(() => () => { if (closeTimer.current !== null) clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (anchor.current) setPosition(caseReferencePosition(anchor.current.getBoundingClientRect(), window.innerWidth, window.innerHeight));
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !anchor.current?.contains(event.target) && !panel.current?.contains(event.target)) {
        pinned.current = false; setReferenceDiameter(null);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
      const focusWasInPanel = document.activeElement && panel.current?.contains(document.activeElement);
      pinned.current = false; setReferenceDiameter(null);
      if (focusWasInPanel) toggle.current?.focus();
    };
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (anchor.current) observer?.observe(anchor.current);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      observer?.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true);
      document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape);
    };
  }, [open]);
  const changeDraft = (value: string) => { draftRef.current = value; setDraft(value); setError(null); };
  const apply = (value = draftRef.current, expectedAssembly?: typeof assembly) => {
    try {
      applyToolbarDiameter(parseCasePreviewDiameter(value), expectedAssembly);
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Cannot resize preview.'); }
  };
  const cancelGesture = () => {
    if (gestureStart.current === null) return;
    changeDraft(gestureStart.current); setReferenceDiameter(Number(gestureStart.current)); gestureStart.current = null;
  };
  const blur = (target: EventTarget | null) => {
    if (target instanceof Node && (anchor.current?.contains(target) || panel.current?.contains(target))) return;
    scheduleClose();
  };
  return <>
    <fieldset ref={anchor} className="case-diameter-control" onMouseLeave={scheduleClose} onBlur={(event) => blur(event.relatedTarget)}>
      <legend>Case preview diameter · mm {locked ? '· locked' : ''}</legend>
      <div className="case-diameter-controls">
        <div className="case-diameter-track">
          <input aria-label="Case preview diameter slider" aria-describedby={`${popupId}-help`} type="range"
            min={CASE_PREVIEW_MIN_MM} max={CASE_PREVIEW_MAX_MM} step="0.1" disabled={disabled}
            value={draft.trim() && Number.isFinite(Number(draft)) ? Number(draft) : diameter}
            onMouseEnter={() => show(Number(draftRef.current) || diameter)} onFocus={() => show(Number(draftRef.current) || diameter)}
            onChange={(event) => { changeDraft(event.target.value); show(Number(event.target.value)); }}
            onPointerDown={(event) => { gestureStart.current = draftRef.current; gestureAssembly.current = assembly; event.currentTarget.setPointerCapture(event.pointerId); show(Number(draftRef.current)); }}
            onPointerUp={(event) => { if (gestureStart.current !== null) { gestureStart.current = null; apply(event.currentTarget.value, gestureAssembly.current); } }}
            onPointerCancel={cancelGesture} onLostPointerCapture={cancelGesture}
            onKeyDown={(event) => { if (event.key === 'Escape') { changeDraft(String(diameter)); gestureStart.current = null; } }}
            onKeyUp={(event) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) apply(event.currentTarget.value); }} />
          <div className="case-diameter-ticks" aria-label="Case diameter comparisons">
            {CASE_SIZE_REFERENCES.map((entry, index) => {
              const available = getCaseSizeMatches(items, entry.diameterMm).length > 0;
              return <button key={entry.diameterMm} type="button" className={`case-diameter-tick ${available ? 'has-cases' : 'reference-only'} ${index % 2 ? 'minor-label' : ''}`}
                style={{ left: `${caseReferenceTickPercent(entry.diameterMm)}%` }} aria-label={`${entry.diameterMm} mm reference${available ? ', catalogue cases exist' : ', no catalogue case'}`}
                aria-controls={open ? popupId : undefined} aria-expanded={referenceDiameter === entry.diameterMm}
                onMouseEnter={() => show(entry.diameterMm)} onFocus={() => show(entry.diameterMm)}
                onClick={() => { pinned.current = true; show(entry.diameterMm); }}>
                <span aria-hidden="true" className="case-diameter-tick-mark" /><span aria-hidden="true">{entry.diameterMm}</span>
              </button>;
            })}
          </div>
          <div className="case-diameter-endpoints" aria-hidden="true"><span>20 mm</span><span>60 mm</span></div>
        </div>
        <label className="case-diameter-number"><span className="sr-only">Case preview diameter millimetres</span>
          <input type="number" min={CASE_PREVIEW_MIN_MM} max={CASE_PREVIEW_MAX_MM} step="0.1" disabled={disabled} value={draft}
            onChange={(event) => changeDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); apply(); } }} />
        </label>
        <button type="button" className="case-diameter-set" disabled={disabled} onClick={() => apply()}>Set</button>
      </div>
      <div className="case-diameter-help">
        <p id={`${popupId}-help`}>{disabledReason ?? 'Custom preview only; supplier cases and hand lengths do not resize.'}</p>
        <button ref={toggle} type="button" aria-expanded={open} aria-controls={open ? popupId : undefined}
          onClick={() => { if (open) close(); else { pinned.current = true; show(Number(draftRef.current) || diameter); } }}>Size guide</button>
      </div>
      {error && <p role="alert" className="case-diameter-error">{error}</p>}
    </fieldset>
    {open && position && createPortal(<div ref={panel} id={popupId} role="region" aria-label="Watch case size reference" className="case-size-popover"
      style={position} onMouseEnter={clearClose} onMouseLeave={scheduleClose} onFocusCapture={clearClose} onBlur={(event) => blur(event.relatedTarget)}>
      <div className="case-size-popover-top"><span>CASE SIZE GUIDE</span><button type="button" aria-label="Close case size reference" onClick={() => close(true)}>×</button></div>
      <div className={matches.length ? 'case-size-image' : 'case-size-image reference-only'}>
        <CaseSizeReferenceThumbnail diameterMm={reference?.diameterMm ?? referenceDiameter} />
        <span>Illustrative · not a product photograph</span>
      </div>
      <p className="case-size-value">{referenceDiameter} <span>mm</span></p>
      {reference && reference.diameterMm !== referenceDiameter && <p className="case-size-comparison">{reference.diameterMm} mm comparison example · not an exact size match</p>}
      <h2>{reference?.label ?? 'Custom case preview'}</h2>
      <p className="case-size-description">{reference?.description ?? 'Explore a custom case envelope; the pictured chart covers 34–52 mm only.'}</p>
      <label className="case-size-picker">Browse comparison
        <select aria-label="Browse case size references" value={reference?.diameterMm ?? ''} onChange={(event) => { pinned.current = true; show(Number(event.target.value)); }}>
          {!reference && <option value="">Custom diameter</option>}
          {CASE_SIZE_REFERENCES.map((entry) => <option key={entry.diameterMm} value={entry.diameterMm}>{entry.diameterMm} mm · {getCaseSizeMatches(items, entry.diameterMm).length ? 'catalogue records' : 'reference only'}</option>)}
        </select>
      </label>
      <div className="case-size-availability" data-availability={matches.length ? 'catalogue' : 'reference-only'}>
        <strong>{matches.length ? `${matches.length} catalogue case${matches.length === 1 ? '' : 's'} at ${referenceDiameter} mm` : 'Reference only — no catalogue case at this size'}</strong>
        {matches.length > 0 && <ul>{matches.map((item) => <li key={item.id}>{item.displayName}<small>{getCaseSizeLabel(item)} · {item.status} · fit and stock not implied</small></li>)}</ul>}
        <p>Reference watches are not selectable products. Case choices remain in Parts → Case options.</p>
      </div>
      <p className="case-size-physical">Committed preview: {diameter} mm<br />Selected case: {selectedCaseItem ? getCaseSizeLabel(selectedCaseItem) : 'not uniquely identified'}</p>
      {reference?.sourceUrl && <a className="case-size-source" href={reference.sourceUrl} target="_blank" rel="noopener noreferrer">Official watch reference ↗</a>}
      <p className="case-size-disclaimer">Case-size comparison only — not dial dimensions, wrist-fit advice or manufacturing specifications.</p>
    </div>, document.body)}
  </>;
};
