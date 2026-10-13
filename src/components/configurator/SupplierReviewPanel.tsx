import { useId, useMemo, useState } from 'react';
import type { SupplierDraftQueueEntry } from '@/services/supplierDraftPersistence';
import { parseSupplierIntake, type SupplierIntakeRecord } from '@/domain/design-first/supplierIntake';
import { supplierCommercialReviewDetails, supplierCorrectionIdentityCompatible, supplierReviewFields, type SupplierReviewField } from '@/domain/design-first/supplierReview';
import { useSupplierReviewStore } from '@/stores/supplierReviewStore';

const inputStyle = 'w-full min-w-0 rounded border border-slate-600 bg-slate-950 p-2 text-xs text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400';
const actionStyle = 'rounded border border-teal-600 bg-teal-950 px-3 py-2 text-xs text-teal-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400';
const friendlyKey = (key: string) => key.replace(/Mm$/, ' (mm)').replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('-', ' ');
const displayField = (record: SupplierIntakeRecord, field: SupplierReviewField): { label: string; value: string } => {
  const draft = record.draft;
  const measurementKey = field.path.replace(/^engineering.measurements\./, '');
  const attributeKey = field.path.replace(/^engineering.attributes\./, '');
  const packageSlot = field.path.split('.')[1];
  const evidence = field.kind === 'variant' ? draft.identity.variant
    : field.kind === 'measurement' ? draft.engineering.measurements[measurementKey]
      : field.kind === 'attribute' ? draft.engineering.attributes[attributeKey]
        : field.kind === 'package' ? draft.packageContents.find(part => part.slot === packageSlot)?.inclusion : undefined;
  const label = field.kind === 'measurement' ? `Measurement: ${friendlyKey(measurementKey)}`
    : field.kind === 'attribute' ? `Attribute: ${friendlyKey(attributeKey)}`
      : field.kind === 'package' ? `Package: ${friendlyKey(packageSlot ?? '')}` : field.label;
  if (evidence) return { label, value: evidence.state === 'unknown' ? `Unknown: ${evidence.reason}` : `${typeof evidence.value === 'object' ? `${evidence.value.value} ${evidence.value.unit}` : String(evidence.value)} · ${evidence.state === 'assumed' ? `Assumed: ${evidence.reason}` : `Source: ${evidence.source.locator}`}` };
  if (field.kind === 'image-usage') {
    const image = draft.images[Number(field.path.split('.')[1])];
    if (image) return { label, value: image.usage.state === 'unknown' ? `Unknown: ${image.usage.reason}` : `Permission basis: ${image.usage.basis} · Evidence: ${image.usage.evidenceSourceId} · Attribution: ${image.usage.attribution || 'Not specified'} · Restrictions: ${image.usage.restrictions || 'Not specified'}` };
  }
  if (field.kind === 'source') {
    const source = draft.sources.find(item => field.path === `sources.${item.id}`);
    if (source) return { label, value: `Captured: ${source.capturedAt} · ${source.kind.replaceAll('-', ' ')}` };
  }
  if (field.kind === 'commercial') {
    const offer = supplierCommercialReviewDetails(record, field.path);
    if (offer) return { label, value: `Price: ${offer.unitPrice === null ? 'Unknown' : `${offer.currency} ${offer.unitPrice}`} · Shipping: ${offer.shippingPrice === null || offer.shippingPrice === undefined ? 'Unknown' : `${offer.shippingCurrency ?? offer.currency} ${offer.shippingPrice}`} · Stock: ${offer.stockStatus} · Captured: ${offer.lastCheckedIso ?? 'Unknown'}` };
    const capture = record.captures.find(item => field.path === `captures.${item.id}.commercial`);
    if (capture) return { label, value: `Captured: ${capture.capturedAt}. Check the exact variant, price and shipping in the retained source capture above.` };
  }
  return { label, value: '' };
};

/** Explicit human review of one retained capture; rendering never approves or publishes it. */
export function SupplierReviewPanel({ entry }: { entry: SupplierDraftQueueEntry }) {
  const workflow = useSupplierReviewStore(state => state);
  const headingId = useId();
  const latest = entry.versions.at(-1);
  const fields = useMemo(() => latest ? supplierReviewFields(latest.record) : [], [latest]);
  const [reviewer, setReviewer] = useState('');
  const [reason, setReason] = useState('');
  const [selection, setSelection] = useState<{ revisionId: string; paths: readonly string[] }>({ revisionId: latest?.id ?? '', paths: [] });
  const [editing, setEditing] = useState<{ revisionId: string; text: string }>({ revisionId: latest?.id ?? '', text: latest ? JSON.stringify(latest.record, null, 2) : '' });
  const [prepared, setPrepared] = useState<{ revisionId: string; record: SupplierIntakeRecord } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  if (!latest) return null;
  const paths = selection.revisionId === latest.id ? selection.paths : [];
  const correctionText = editing.revisionId === latest.id ? editing.text : JSON.stringify(latest.record, null, 2);
  const currentCorrection = prepared?.revisionId === latest.id ? prepared : null;
  const events = workflow.events.filter(event => event.kind === 'review' ? event.review.entryId === entry.id : event.entryId === entry.id);
  const recentReview = [...events].reverse().find(event => event.kind === 'review');
  const review = recentReview?.kind === 'review' ? recentReview.review : null;
  const approvedCurrent = review?.revisionId === latest.id && review.action === 'approve';
  const staleReview = review !== null && review.revisionId !== latest.id;
  const lastPublication = [...events].reverse().find(event => event.kind === 'publish' || event.kind === 'withdraw');
  const published = lastPublication?.kind === 'publish';
  const ready = workflow.initialized && !workflow.busy && !pending && Boolean(reviewer.trim() && reason.trim());
  const synthetic = latest.record.draft.syntheticFixture;
  const run = async (operation: () => Promise<boolean>, success: string) => {
    setPending(true); setError(''); setMessage('Saving review decision…');
    try { setMessage(await operation() ? success : 'The action was not saved. See the review error below.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this review decision.'); setMessage('The action was not saved.'); }
    finally { setPending(false); }
  };
  const prepareCorrection = () => {
    setPrepared(null); setError('');
    try {
      const corrected = parseSupplierIntake(correctionText);
      if (!supplierCorrectionIdentityCompatible(latest.record, corrected)) throw new Error('This correction changes the supplier, product or known exact variant. Add it as a new supplier draft through intake instead.');
      setPrepared({ revisionId: latest.id, record: corrected });
      setMessage('Correction prepared, not saved. Save corrected capture to retain a new capture and its review note.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Correction JSON is invalid.'); }
  };
  return <details className="min-w-0 rounded border border-slate-600 p-2 text-xs text-slate-200" onToggle={event => { if (event.currentTarget.open && !workflow.initialized && !workflow.busy) void workflow.initialize(); }}>
    <summary id={headingId} className="cursor-pointer font-semibold text-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400">Review &amp; local publication</summary>
    <div className="space-y-3 pt-3" aria-labelledby={headingId}>
      <p>Reviewing latest saved capture: <span className="font-medium">{latest.savedAt}</span>.</p>
      <p className="text-slate-400">Check only the fields you verified against their retained sources. Missing interfaces stay unknown. Local publication makes a reviewed part discoverable; it does not certify fit or change your watch.</p>
      {synthetic && <p className="text-amber-300">Synthetic example. Review decisions may be practised here, but this record cannot be published as a real supplier part.</p>}
      {!workflow.initialized && <p role="status">Review history has not finished loading.</p>}
      <button type="button" className={actionStyle} disabled={workflow.busy || pending} onClick={() => void run(() => workflow.initialize(true), 'Review history reloaded from local storage.')}>Load or reload review history</button>
      {staleReview && <p className="text-amber-300">The earlier review belongs to a different saved capture. Review this latest version before publishing.</p>}
      <p className="text-slate-300">{approvedCurrent ? 'Latest capture has a saved field review.' : review?.revisionId === latest.id && review.action === 'reject' ? 'Latest capture was rejected.' : 'Latest capture is awaiting review.'} {published ? 'A local publication is active.' : 'No active local publication.'}</p>
      {published && lastPublication.revisionId !== latest.id && <p className="text-amber-300">The active publication uses an earlier capture. This newer version is not published.</p>}
      <label className="block space-y-1"><span>Reviewer name</span><input className={inputStyle} value={reviewer} onChange={event => setReviewer(event.target.value)} autoComplete="name" /></label>
      <label className="block space-y-1"><span>Review reason or source-check note</span><textarea rows={3} className={inputStyle} value={reason} onChange={event => setReason(event.target.value)} /></label>
      <fieldset className="min-w-0 space-y-2"><legend className="pb-2 font-semibold">Fields checked against sources</legend>
        <p className="text-slate-400">Exact variant and at least one supported product measurement or attribute must be reviewed before approval. Source acknowledgements may also be required.</p>
        <div className="max-h-64 space-y-2 overflow-y-auto">{fields.map(field => {
          const display = displayField(latest.record, field);
          return <label key={field.path} className="flex items-start gap-2 rounded border border-slate-700 p-2"><input type="checkbox" disabled={!field.eligible || workflow.busy || pending} checked={paths.includes(field.path)} onChange={event => setSelection({ revisionId: latest.id, paths: event.target.checked ? [...paths, field.path] : paths.filter(path => path !== field.path) })} /><span><span className="block font-medium">{display.label}{field.kind === 'variant' ? ' (required)' : ''}</span>{display.value && <span className="block break-words">{display.value}</span>}<span className="block break-words text-slate-400">{field.reason}</span>{field.kind === 'image-usage' && <span className="block text-amber-300">Check documented permission evidence only. This checkbox does not grant image rights.</span>}</span></label>;
        })}</div>
      </fieldset>
      {!reviewer.trim() || !reason.trim() ? <p className="text-slate-400">Enter a reviewer name and reason to save a decision.</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={actionStyle} disabled={!ready || !paths.length} onClick={() => void run(() => workflow.review(entry.id, latest.id, 'approve', reviewer.trim(), reason.trim(), paths), 'Field review saved for this capture. Publication still requires a separate action.')}>Approve checked fields</button>
        <button type="button" className={actionStyle} disabled={!ready} onClick={() => void run(() => workflow.review(entry.id, latest.id, 'reject', reviewer.trim(), reason.trim(), []), 'Rejection saved with its reason. The original capture remains retained; any earlier publication remains active until withdrawn.')}>Reject capture</button>
      </div>
      <details className="border-t border-slate-700 pt-2"><summary className="cursor-pointer text-teal-300">Correct source transcription as a new capture</summary><div className="space-y-2 pt-2">
        <p className="text-slate-400">Edit the retained record below. Keep product identity and source attribution accurate. Saving retains a new capture, preserves the earlier evidence and requires a fresh review. Resolving an unknown variant creates a linked draft entry instead of replacing the ambiguous record.</p>
        <label className="block space-y-1"><span>Corrected supplier capture JSON</span><textarea rows={8} className={inputStyle} value={correctionText} onChange={event => { setEditing({ revisionId: latest.id, text: event.target.value }); setPrepared(null); setMessage('Correction changed. Prepare it before saving.'); }} /></label>
        <button type="button" className={actionStyle} disabled={workflow.busy || pending} onClick={prepareCorrection}>Prepare correction</button>
        {currentCorrection && <div className="space-y-2 rounded border border-teal-700 p-2"><p>Correction prepared · not saved. All imported field claims remain unreviewed.</p><button type="button" className={actionStyle} disabled={!ready} onClick={() => void run(() => workflow.correct(entry.id, latest.id, currentCorrection.record, reviewer.trim(), reason.trim()), 'Corrected capture saved. Review the new capture before publishing.')}>Save corrected capture</button></div>}
        {prepared && !currentCorrection && <p className="text-amber-300">A newer capture was saved. Prepare your correction again against the latest version.</p>}
      </div></details>
      <section aria-label="Local publication actions" className="space-y-2 border-t border-slate-700 pt-2"><p className="text-slate-400">Publication is local to this browser profile. Unknown dimensions remain unknown and supplier offers remain subject to verification.</p><div className="flex flex-wrap gap-2">
        <button type="button" className={actionStyle} disabled={!ready || !approvedCurrent || synthetic} onClick={() => void run(() => workflow.publish(entry.id, latest.id, reviewer.trim(), reason.trim()), 'Reviewed capture published to the local catalogue. Physical fit has not been certified.')}>Publish to local catalogue</button>
        <button type="button" className={actionStyle} disabled={!ready || !published} onClick={() => void run(() => workflow.withdraw(entry.id, reviewer.trim(), reason.trim()), 'Local publication withdrawn. Captures and review history remain retained.')}>Withdraw publication</button>
      </div></section>
      {published && <p className="text-amber-300">Rejecting a newer capture does not withdraw an earlier publication. Use Withdraw publication to suspend the published data.</p>}
      <p role="status" aria-live="polite" className="break-words text-slate-300">{message}</p>
      {(error || workflow.error) && <p role="alert" className="break-words text-amber-300">{error || workflow.error}</p>}
      <details className="border-t border-slate-700 pt-2"><summary className="cursor-pointer text-teal-300">Review &amp; publication history ({events.length})</summary><div className="max-h-64 space-y-3 overflow-y-auto break-words pt-2">
        {!events.length && <p>No review decisions or publications saved for this draft.</p>}
        {events.map(event => event.kind === 'review' ? <div key={event.id} className="border-l-2 border-slate-700 pl-2"><p>{event.review.action === 'approve' ? 'Field approval' : 'Rejection'} · {event.review.reviewer} · {event.review.reviewedAt}</p><p>{event.review.reason}</p><p>Capture: {event.review.revisionId}</p><p>Checked fields: {event.review.reviewedPaths.join(', ') || 'None'}</p></div> : <div key={event.id} className="border-l-2 border-slate-700 pl-2"><p>{event.kind === 'publish' ? 'Local publication' : 'Publication withdrawal'} · {event.actor} · {event.at}</p><p>{event.reason}</p>{event.kind === 'publish' && <p>Capture: {event.revisionId}</p>}</div>)}
      </div></details>
    </div>
  </details>;
}
