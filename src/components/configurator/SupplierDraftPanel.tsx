import { SupplierWorkspaceBackupPanel } from './SupplierWorkspaceBackupPanel';
import { SupplierReviewPanel } from './SupplierReviewPanel';
import { useId, useState } from 'react';
import type { DesignPartSlot, EvidenceField } from '@/domain/design-first/evidence';
import { createManualSupplierIntake, parseSupplierIntake, suggestSupplierMeasurements, type SupplierIntakeRecord } from '@/domain/design-first/supplierIntake';
import { useSupplierDraftStore } from '@/stores/supplierDraftStore';

const inputStyle = 'w-full min-w-0 rounded border border-slate-600 bg-slate-950 p-2 text-xs text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400';
const actionStyle = 'rounded border border-teal-600 bg-teal-950 px-3 py-2 text-xs text-teal-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400';
const slots: readonly DesignPartSlot[] = ['case', 'crystal', 'caseback', 'crown', 'dial', 'hands', 'chapter-ring', 'inner-bezel', 'rotating-bezel', 'strap'];
const label = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('-', ' ').replace(/Mm$/, ' (mm)');
const localDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fieldValue = (value: unknown): string => {
  if (value !== null && typeof value === 'object') { const measurement = value as Record<string, unknown>; if (typeof measurement.value === 'number' && (measurement.unit === 'mm' || measurement.unit === 'deg')) return `${measurement.value} ${measurement.unit}`; return JSON.stringify(value); }
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : 'Unknown';
};
function DraftEvidence({ field }: { field: EvidenceField<unknown> }) {
  if (field.state === 'unknown') return <span>Unknown: {field.reason}</span>;
  if (field.state === 'assumed') return <span>{fieldValue(field.value)} · Assumed: {field.reason}</span>;
  return <span>{fieldValue(field.value)} · {field.review === 'reviewed' ? 'Reviewed source transcription' : 'Unreviewed source transcription'} · {field.source.locator} · {field.source.capturedAt}</span>;
}

function downloadLocalEvidence(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const asRecord = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
function RawCommercialCapture({ raw }: { raw: unknown }) {
  const data = asRecord(raw);
  if (!data || !(data.schema === 'dial-designer/aliexpress-capture/v1' || (typeof data.supplierId === 'string' && typeof data.productId === 'string'))) return null;
  const price = data.schema ? asRecord(data.itemPrice) : { amount: data.unitPrice, currency: data.currency };
  const shipping = data.schema ? asRecord(data.shipping) : { amount: data.shippingPrice, currency: data.shippingCurrency ?? data.currency };
  const format = (money: Record<string, unknown> | null) => money && typeof money.amount === 'number' && Number.isFinite(money.amount) && typeof money.currency === 'string' ? `${money.currency} ${money.amount}` : 'Unknown';
  return <div className="space-y-1 border-l-2 border-slate-700 pl-2"><p>Captured item price: {format(price)}</p><p>Captured shipping: {format(shipping)}</p><p>Capture date: {fieldValue(data.capturedAtIso ?? data.capturedAt)}</p><p>Commercial capture only; no catalogue offer is published.</p></div>;
}

function IntakeSummary({ record }: { record: SupplierIntakeRecord }) {
  const draft = record.draft;
  return <div className="space-y-2 break-words">
    {draft.syntheticFixture && <p className="font-semibold text-amber-300">Synthetic example — not supplier or fit evidence</p>}
    <p>Supplier: {draft.identity.supplierId} · Product: {draft.identity.productId}</p>
    <p>Exact variant: <DraftEvidence field={draft.identity.variant} /></p>
    <p>Component: {label(draft.engineering.slot)} · Catalogue link: {draft.engineering.catalogueItemId ?? 'Not linked'}</p>
    <p className="text-amber-300">Source capture. Fit has not been assessed. Review and publication status are shown separately.</p>
    <details><summary className="cursor-pointer text-teal-300">Measurements &amp; missing information</summary><div className="space-y-2 pt-2">
      {!Object.keys(draft.engineering.measurements).length && <p>Measurements unknown: no dimensions retained.</p>}
      {Object.entries(draft.engineering.measurements).map(([key, field]) => <p key={key}><strong>{label(key)}:</strong> <DraftEvidence field={field} /></p>)}
      {Object.entries(draft.engineering.attributes).map(([key, field]) => <p key={key}><strong>{label(key)}:</strong> <DraftEvidence field={field} /></p>)}
      {!draft.packageContents.length && <p>Package contents unknown.</p>}
      {draft.packageContents.map(part => <p key={part.slot}>Package {label(part.slot)}: <DraftEvidence field={part.inclusion} /></p>)}
    </div></details>
    <details><summary className="cursor-pointer text-teal-300">Price &amp; shipping captures</summary><div className="space-y-2 pt-2">
      {!record.offers.length && <><p>No linked offer. Commercial captures remain separate from engineering data.</p>{record.captures.map(capture => <RawCommercialCapture key={capture.id} raw={capture.raw} />)}</>}
      {record.offers.map(offer => <div key={offer.id} className="border-l-2 border-slate-700 pl-2"><p>{offer.supplierName} · Price: {offer.unitPrice === null ? 'Unknown' : `${offer.currency} ${offer.unitPrice}`}</p><p>Shipping: {offer.shippingPrice === null || offer.shippingPrice === undefined ? 'Unknown' : `${offer.shippingCurrency ?? offer.currency} ${offer.shippingPrice}`}</p><p>Stock: {offer.stockStatus.replaceAll('-', ' ')} · Offer remains unverified.</p></div>)}
    </div></details>
    <details><summary className="cursor-pointer text-teal-300">Retained sources &amp; image usage</summary><div className="space-y-2 pt-2">
      {draft.sources.map(source => <p key={source.id}>{source.kind.replaceAll('-', ' ')} · {source.locator} · {source.capturedAt}</p>)}
      {draft.images.map((image, index) => <p key={`${image.locator}-${index}`}>{image.locator} · Image usage: {image.usage.state === 'unknown' ? `Unknown — ${image.usage.reason}` : `Recorded permission claim — ${image.usage.basis}; requires review`}</p>)}
      {record.captures.map(capture => <details key={capture.id}><summary className="cursor-pointer">Source capture {capture.id}</summary>{capture.sourceText && <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words p-2 text-[10px]">{capture.sourceText}</pre>}{capture.raw !== undefined && <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words p-2 text-[10px]">{JSON.stringify(capture.raw, null, 2)}</pre>}</details>)}
      <p className="text-slate-400">Images and drawings stay as local evidence. Remote images are not fetched or displayed.</p>
    </div></details>
  </div>;
}

/** Local intake only: explicit preparation and durable saving, with no catalogue publication. */
export function SupplierDraftPanel({ catalogueItemId = null, slot = 'dial' }: { catalogueItemId?: string | null; slot?: DesignPartSlot }) {
  const queue = useSupplierDraftStore(state => state);
  const panelId = useId();
  const [form, setForm] = useState({ supplierId: '', productId: '', variant: '', unknownVariant: true, sourceUrl: '', capturedAt: localDateTime(), slot, catalogueItemId: '', sourceText: '', diameterMm: '', thicknessMm: '', lugWidthMm: '', unitPrice: '', currency: '', shippingPrice: '' });
  const [suggestions, setSuggestions] = useState<ReturnType<typeof suggestSupplierMeasurements>>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<readonly string[]>([]);
  const [prepared, setPrepared] = useState<SupplierIntakeRecord | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [files, setFiles] = useState<readonly File[]>([]);
  const [attachmentSource, setAttachmentSource] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const patch = (change: Partial<typeof form>) => { setForm(current => ({ ...current, ...change })); setPrepared(null); setFiles([]); setMessage('Draft fields changed. Prepare the draft before saving.'); setError(''); };
  const fail = (cause: unknown) => { setPrepared(null); setError(cause instanceof Error ? cause.message : 'Could not prepare this supplier draft.'); };
  const extract = () => {
    let found: ReturnType<typeof suggestSupplierMeasurements>;
    try { found = suggestSupplierMeasurements(form.sourceText); } catch (cause) { fail(cause); return; }
    setSuggestions(found); setSelectedSuggestions([]); setPrepared(null); setError('');
    setMessage(found.length ? `${found.length} measurement suggestions found. Select the ones supported by your source before preparing a draft.` : 'No explicit labelled measurements found. Enter measurements manually or import structured extraction JSON.');
  };
  const prepare = () => {
    try {
      if (!form.unknownVariant && !form.variant.trim()) throw new Error('Enter the exact variant or mark it unknown.');
      const measurements: Record<string, { value: number; unit: 'mm' | 'deg' } | null> = {};
      for (const [index, suggestion] of suggestions.entries()) if (selectedSuggestions.includes(String(index))) { if (measurements[suggestion.key]) throw new Error('Select only one value for each measurement; conflicting values need clarification.'); measurements[suggestion.key] = { value: suggestion.value, unit: suggestion.unit }; }
      for (const key of ['diameterMm', 'thicknessMm', 'lugWidthMm'] as const) if (form[key].trim()) measurements[key] = { value: Number(form[key]), unit: 'mm' };
      const record = createManualSupplierIntake({ supplierId: form.supplierId, productId: form.productId, variant: form.unknownVariant ? null : form.variant, sourceUrl: form.sourceUrl, capturedAt: new Date(form.capturedAt).toISOString(), slot: form.slot, catalogueItemId: form.catalogueItemId.trim() || null, sourceText: form.sourceText, measurements, ...(form.unitPrice.trim() ? { unitPrice: Number(form.unitPrice), currency: form.currency.trim().toUpperCase() } : {}), ...(form.shippingPrice.trim() ? { shippingPrice: Number(form.shippingPrice), currency: form.currency.trim().toUpperCase() } : {}) });
      setPrepared(record); setFiles([]); setAttachmentSource(record.draft.sources[0]?.id ?? ''); setError(''); setMessage('Draft prepared for inspection. It has not been saved.');
    } catch (cause) { fail(cause); }
  };
  const importJson = () => {
    try {
      const record = parseSupplierIntake(JSON.parse(jsonInput) as unknown, { slot: form.slot, catalogueItemId: form.catalogueItemId.trim() || undefined });
      setPrepared(record); setFiles([]); setAttachmentSource(record.draft.sources[0]?.id ?? ''); setError(''); setMessage('Imported capture prepared as an unverified draft. Inspect it, then Save draft.');
    } catch (cause) { fail(cause); }
  };
  const importCaptureFile = async (file: File | undefined) => {
    if (!file) return;
    try { if (file.size > 2000000) throw new Error('Capture JSON must be no larger than 2 MB.'); const text = await file.text(); setJsonInput(text); const record = parseSupplierIntake(text, { slot: form.slot, catalogueItemId: form.catalogueItemId.trim() || undefined }); setPrepared(record); setFiles([]); setAttachmentSource(record.draft.sources[0]?.id ?? ''); setError(''); setMessage('Capture file prepared. Inspect it, then Save draft.'); } catch (cause) { fail(cause); }
  };
  const save = async () => {
    if (!prepared) return;
    setSaving(true); setMessage('Saving draft and evidence on this device…'); setError('');
    try {
      const sourceId = attachmentSource || prepared.draft.sources[0]?.id;
      if (!sourceId) throw new Error('Attach evidence to a draft with a retained source first.');
      const assets = files.map(file => ({ sourceId, name: file.name, kind: file.type.startsWith('image/') ? 'image' as const : 'drawing' as const, blob: file, usage: { state: 'unknown' as const, reason: 'No image-use permission has been reviewed.' } }));
      const saved = await queue.save(prepared, assets);
      setMessage(saved ? 'Capture saved on this device. Review and publication status are shown below.' : 'Draft was not saved. See the storage error below.');
      if (saved) { setFiles([]); setPrepared(null); }
    } catch (cause) { fail(cause); setMessage('Draft was not saved.'); }
    finally { setSaving(false); }
  };
  const backup = async () => {
    try {
      const payload = await queue.exportBackup();
      if (!payload) return;
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `supplier-drafts-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Supplier draft backup exported, including saved evidence.');
    } catch (cause) { fail(cause); }
  };
  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    try { if (file.size > 150 * 1024 * 1024) throw new Error('Backup exceeds the supported 150 MB import limit.'); const imported = await queue.importBackup(JSON.parse(await file.text()) as unknown); setMessage(imported ? 'Draft backup imported on this device.' : 'Backup was not imported. See the error below.'); }
    catch (cause) { fail(cause); }
  };
  return <details className="min-w-0 rounded border border-slate-700 bg-slate-900/60 text-xs text-slate-200" onToggle={event => { if (event.currentTarget.open && !queue.initialized && !queue.busy) void queue.initialize(); }}>
    <summary className="cursor-pointer p-3 font-semibold text-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400">Supplier draft intake &amp; local review queue</summary>
    <div className="space-y-3 px-3 pb-3">
      <p className="text-slate-400">Capture a source and its exact option before reviewing product data. This queue saves drafts on this device; it does not change your watch, catalogue or selected supplier.</p>
      {!queue.initialized && <p role="status">Local draft storage has not finished loading.</p>}
      <details className="border-t border-slate-700 pt-3"><summary className="cursor-pointer font-semibold text-teal-300">Create a manual supplier draft</summary><fieldset className="min-w-0 space-y-3 pt-3"><legend className="font-semibold">Manual supplier capture</legend>
        <label className="block space-y-1"><span>Supplier name or ID</span><input className={inputStyle} value={form.supplierId} onChange={event => patch({ supplierId: event.target.value })} /></label>
        <label className="block space-y-1"><span>Product name or ID</span><input className={inputStyle} value={form.productId} onChange={event => patch({ productId: event.target.value })} /></label>
        <label className="flex items-start gap-2"><input type="checkbox" checked={form.unknownVariant} onChange={event => patch({ unknownVariant: event.target.checked })} /><span>Exact variant is unknown</span></label>
        <label className="block space-y-1"><span>Exact variant or option</span><input className={inputStyle} disabled={form.unknownVariant} value={form.variant} onChange={event => patch({ variant: event.target.value })} /></label>
        <label className="block space-y-1"><span>Source URL</span><input type="url" className={inputStyle} value={form.sourceUrl} onChange={event => patch({ sourceUrl: event.target.value })} /></label>
        <label className="block space-y-1"><span>Capture date and time (local)</span><input type="datetime-local" className={inputStyle} value={form.capturedAt} onChange={event => patch({ capturedAt: event.target.value })} /></label>
        <label className="block space-y-1"><span>Component type</span><select className={inputStyle} value={form.slot} onChange={event => patch({ slot: event.target.value as DesignPartSlot, catalogueItemId: '' })}>{slots.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        {catalogueItemId && form.slot === slot && <label className="flex items-start gap-2"><input type="checkbox" checked={form.catalogueItemId === catalogueItemId} onChange={event => patch({ catalogueItemId: event.target.checked ? catalogueItemId : '' })} /><span>Associate with the selected catalogue component (does not establish fit)</span></label>}
        <label className="block space-y-1"><span>Existing catalogue ID (optional)</span><input className={inputStyle} value={form.catalogueItemId} onChange={event => patch({ catalogueItemId: event.target.value })} /></label>
        <label className="block space-y-1"><span>Pasted supplier source text</span><textarea rows={4} className={inputStyle} value={form.sourceText} onChange={event => { patch({ sourceText: event.target.value }); setSuggestions([]); setSelectedSuggestions([]); }} /></label>
        <button type="button" className={actionStyle} onClick={extract} disabled={!form.sourceText.trim()}>Extract suggestions from pasted text</button>
        <p className="text-slate-400">Local text parsing only. Suggestions remain unreviewed; no AI service or remote page is called.</p>
        {suggestions.length > 0 && <fieldset className="min-w-0 space-y-2"><legend>Choose measurement suggestions</legend>{suggestions.map((suggestion, index) => <label key={`${suggestion.key}-${index}`} className="flex items-start gap-2"><input type="checkbox" checked={selectedSuggestions.includes(String(index))} onChange={event => { setSelectedSuggestions(current => event.target.checked ? [...current, String(index)] : current.filter(key => key !== String(index))); setPrepared(null); }} /><span>{label(suggestion.key)}: {suggestion.value} {suggestion.unit}<span className="block text-slate-400">{suggestion.sourceExcerpt}</span></span></label>)}</fieldset>}
        <details><summary className="cursor-pointer text-teal-300">Optional manual measurements &amp; commercial capture</summary><div className="space-y-3 pt-2">
          {(['diameterMm', 'thicknessMm', 'lugWidthMm'] as const).map(key => <label key={key} className="block space-y-1"><span>{label(key)}</span><input type="number" min="0.001" step="any" className={inputStyle} value={form[key]} onChange={event => patch({ [key]: event.target.value })} /></label>)}
          <p className="text-slate-400">Leave unavailable measurements blank. A missing size is unknown, not zero.</p>
          <label className="block space-y-1"><span>Unit price (optional)</span><input type="number" min="0" step="any" className={inputStyle} value={form.unitPrice} onChange={event => patch({ unitPrice: event.target.value })} /></label>
          <label className="block space-y-1"><span>Currency code (for example USD)</span><input className={inputStyle} maxLength={3} value={form.currency} onChange={event => patch({ currency: event.target.value })} /></label>
          <label className="block space-y-1"><span>Shipping price (optional, same currency)</span><input type="number" min="0" step="any" className={inputStyle} value={form.shippingPrice} onChange={event => patch({ shippingPrice: event.target.value })} /></label>
        </div></details>
        <button type="button" className={actionStyle} onClick={prepare}>Prepare manual draft</button>
      </fieldset></details>
      <details className="border-t border-slate-700 pt-3"><summary className="cursor-pointer font-semibold text-teal-300">Import capture or AI-extracted JSON</summary><div className="space-y-2 pt-2"><label className="block space-y-1"><span>Supplier draft, intake record or AliExpress capture JSON</span><textarea rows={5} className={inputStyle} value={jsonInput} onChange={event => { setJsonInput(event.target.value); setPrepared(null); }} /></label><p className="text-slate-400">Structured extraction is validated and retained as unreviewed data. A standalone draft with offer references also needs its matching offer snapshots in an intake record. AI confidence does not qualify fit. An AliExpress capture uses the component type and optional catalogue link above.</p><label className="block space-y-1"><span>Import supplier capture JSON file</span><input type="file" accept="application/json,.json" className={inputStyle} onChange={event => { void importCaptureFile(event.target.files?.[0]); event.target.value = ''; }} /></label><button type="button" className={actionStyle} disabled={!jsonInput.trim()} onClick={importJson}>Prepare imported draft</button></div></details>
      {prepared && <section aria-labelledby={`${panelId}-prepared`} className="space-y-3 rounded border border-teal-700 p-2"><h4 id={`${panelId}-prepared`} className="font-semibold">Prepared draft · not yet saved</h4><IntakeSummary record={prepared} /><label className="block space-y-1"><span>Source for attached evidence</span><select className={inputStyle} value={attachmentSource || prepared.draft.sources[0]?.id} onChange={event => setAttachmentSource(event.target.value)}>{prepared.draft.sources.map(source => <option key={source.id} value={source.id}>{source.locator} · {source.capturedAt}</option>)}</select></label><label className="block space-y-1"><span>Attach local drawings or photos (optional)</span><input type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf,.pdf" className={inputStyle} onChange={event => setFiles(Array.from(event.target.files ?? []))} /></label>{files.length > 0 && <p>{files.length} local evidence file(s) ready to save. Image usage remains unknown.</p>}<button type="button" className={actionStyle} disabled={saving || queue.busy || !queue.initialized} onClick={() => void save()}>{saving ? 'Saving draft…' : 'Save draft'}</button></section>}
      <p role="status" aria-live="polite" className="break-words text-slate-300">{message}{queue.lastOutcome === 'duplicate' ? ' An identical retained capture already exists; no duplicate version was added.' : ''}</p>
      {(error || queue.error) && <p role="alert" className="break-words text-amber-300">{error || queue.error}</p>}
      <button type="button" className={actionStyle} disabled={queue.busy} onClick={() => void queue.initialize(true)}>Reload saved queue</button>
      {queue.warning && <p className="break-words text-amber-300">{queue.warning}</p>}
      <section aria-labelledby={`${panelId}-queue`} className="space-y-2 border-t border-slate-700 pt-3"><h4 id={`${panelId}-queue`} className="font-semibold">Saved local drafts ({queue.records.length})</h4>{queue.initialized && !queue.records.length && <p>No supplier drafts saved yet.</p>}<div className="max-h-[28rem] space-y-2 overflow-y-auto">{queue.records.map(entry => {
        const latest = entry.versions.at(-1);
        if (!latest) return null;
        return <details key={entry.id} className="rounded border border-slate-700 p-2"><summary className="cursor-pointer font-medium">{latest.record.draft.identity.supplierId} · {latest.record.draft.identity.productId} · {entry.versions.length} version(s)</summary><div className="space-y-3 pt-2"><p>Saved: {latest.savedAt} · {latest.assetIds.length} attached evidence file(s)</p><IntakeSummary record={latest.record} /><SupplierReviewPanel entry={entry} /><details><summary className="cursor-pointer text-teal-300">Saved evidence files ({latest.assetIds.length})</summary>{latest.assetIds.map(id => { const asset = queue.assets.find(item => item.id === id); return asset ? <div key={id} className="space-y-1 pt-2"><p>{asset.name} · {asset.blob.size} bytes · Source: {asset.sourceId}</p><p>Reuse: {asset.usage.state === 'unknown' ? asset.usage.reason : 'Permission claim requires review'}</p><button type="button" className={actionStyle} onClick={() => downloadLocalEvidence(asset.blob, asset.name)}>Download evidence {asset.name}</button></div> : null; })}</details><details><summary className="cursor-pointer text-teal-300">Earlier retained versions</summary>{entry.versions.slice(0, -1).map(version => <details key={version.id} className="pt-2"><summary className="cursor-pointer">Saved {version.savedAt}</summary><IntakeSummary record={version.record} /></details>)}{entry.versions.length === 1 && <p>No earlier versions.</p>}</details></div></details>;
      })}</div></section>
      <SupplierWorkspaceBackupPanel />
      <details className="space-y-2 border-t border-slate-700 pt-3"><summary className="cursor-pointer text-teal-300">Legacy draft-only backup</summary><button type="button" className={actionStyle} disabled={queue.busy || !queue.initialized} onClick={() => void backup()}>Export draft backup</button><label className="block space-y-1"><span>Restore draft backup JSON</span><input type="file" accept="application/json,.json" className={inputStyle} disabled={queue.busy || !queue.initialized} onChange={event => void importBackup(event.target.files?.[0])} /></label><p className="text-slate-400">Draft backups preserve captures and attachments. Review decisions and local publications are stored separately; restoring drafts does not approve or publish them.</p></details>
    </div>
  </details>;
}
