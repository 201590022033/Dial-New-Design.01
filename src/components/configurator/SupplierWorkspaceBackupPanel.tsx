import { useEffect, useId, useRef, useState } from 'react';
import { MAX_SUPPLIER_WORKSPACE_BACKUP_BYTES } from '@/services/supplierWorkspaceBackup';
import { useSupplierWorkspaceStore } from '@/stores/supplierWorkspaceStore';

const inputStyle = 'w-full min-w-0 rounded border border-slate-600 bg-slate-950 p-2 text-xs text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400';
const actionStyle = 'rounded border border-teal-600 bg-teal-950 px-3 py-2 text-xs text-teal-100 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400';

/** Combined local backup workflow; choosing a file never restores or publishes data. */
export function SupplierWorkspaceBackupPanel() {
  const workspace = useSupplierWorkspaceStore(state => state);
  const panelId = useId();
  const [source, setSource] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  const prepareButton = useRef<HTMLButtonElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const prepared = workspace.preparedRestore;
  const working = workspace.busy || pending;
  useEffect(() => { if (prepared) confirmationHeading.current?.focus(); }, [prepared]);
  const fail = (cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not complete this supplier workspace operation.');
  const invalidate = () => { workspace.cancelRestore(); setError(''); setMessage('Backup selection changed. Prepare it before restoring.'); };
  const prepare = async () => {
    setPending(true); setError(''); setMessage('Reading and checking the selected local backup…');
    try {
      const size = source === 'file' ? file?.size : new Blob([text]).size;
      if (size === undefined || size === 0) throw new Error('Choose a nonempty backup file or paste its JSON before preparing restore.');
      if (size > MAX_SUPPLIER_WORKSPACE_BACKUP_BYTES) throw new Error(`Backup exceeds the ${MAX_SUPPLIER_WORKSPACE_BACKUP_BYTES / 1024 / 1024} MB local import limit.`);
      const input = source === 'file' ? await file!.text() : text;
      const data: unknown = JSON.parse(input);
      const success = await workspace.prepareRestore(data);
      setMessage(success ? 'Backup checked. Nothing has been restored yet; review the counts below.' : 'Backup was not prepared. Existing local data has been retained.');
    } catch (cause) { workspace.cancelRestore(); fail(cause); setMessage('Nothing has been restored.'); }
    finally { setPending(false); }
  };
  const restore = async () => {
    setPending(true); setError(''); setMessage('Restoring the prepared supplier workspace…');
    try { setMessage(await workspace.restore() ? 'Supplier workspace restore completed.' : 'Restore did not complete. See the recovery message below.'); status.current?.focus(); }
    catch (cause) { fail(cause); setMessage('Restore did not complete.'); }
    finally { setPending(false); }
  };
  const exportBackup = async () => {
    setPending(true); setError(''); setMessage('Preparing a combined local backup…');
    try {
      const backup = await workspace.exportBackup();
      if (backup === null) { setMessage('Backup was not exported. See the storage error below.'); return; }
      const payload = JSON.stringify(backup, null, 2);
      const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'supplier-workspace-backup.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Combined supplier workspace backup exported, including evidence files and review history.');
    } catch (cause) { fail(cause); setMessage('Backup was not exported.'); }
    finally { setPending(false); }
  };
  const load = async () => {
    setPending(true); setError(''); setMessage('Loading local supplier workspace…');
    try { setMessage(await workspace.initialize() ? 'Local supplier workspace loaded.' : 'Local workspace could not be loaded. Existing stored data has been retained.'); }
    catch (cause) { fail(cause); }
    finally { setPending(false); }
  };
  return <details className="min-w-0 rounded border border-slate-700 bg-slate-900/60 text-xs text-slate-200" onToggle={event => { if (event.currentTarget.open && !workspace.initialized && !working) void load(); }}>
    <summary className="cursor-pointer p-3 font-semibold text-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400">Supplier workspace backup &amp; restore</summary>
    <div className="space-y-3 px-3 pb-3">
      <p className="text-slate-400">One portable backup includes supplier drafts, retained captures, attached evidence, review history and local publications. Your watch design and supplier selections are separate.</p>
      <button type="button" className={actionStyle} disabled={working} onClick={() => void load()}>Load or retry local workspace</button>
      {!workspace.initialized && <p role="status">Load the local workspace before exporting or preparing a restore.</p>}
      <button type="button" className={actionStyle} disabled={working || !workspace.initialized} onClick={() => void exportBackup()}>Export complete supplier backup</button>
      <section aria-labelledby={`${panelId}-restore`} className="space-y-3 border-t border-slate-700 pt-3">
        <h4 id={`${panelId}-restore`} className="font-semibold">Prepare a local restore</h4>
        <p className="text-slate-400">Restore into an empty supplier workspace, or check an identical backup without adding duplicates. Different existing local data is preserved and will block restore.</p>
        <label className="block space-y-1"><span>Backup input</span><select className={inputStyle} disabled={working} value={source} onChange={event => { setSource(event.target.value as 'file' | 'text'); invalidate(); }}><option value="file">Local JSON file</option><option value="text">Pasted JSON text</option></select></label>
        {source === 'file' ? <label className="block space-y-1"><span>Complete supplier workspace backup file</span><input type="file" accept="application/json,.json" className={inputStyle} disabled={working} onChange={event => { setFile(event.target.files?.[0] ?? null); invalidate(); }} /></label>
          : <label className="block space-y-1"><span>Complete supplier workspace backup JSON</span><textarea rows={5} className={inputStyle} disabled={working} value={text} onChange={event => { setText(event.target.value); invalidate(); }} /></label>}
        {file && source === 'file' && <p className="break-words">Selected: {file.name} · {file.size} bytes. Not restored.</p>}
        <p className="text-slate-400">Maximum backup size: {MAX_SUPPLIER_WORKSPACE_BACKUP_BYTES / 1024 / 1024} MB. Files are read locally only when you choose Prepare restore.</p>
        <button ref={prepareButton} type="button" className={actionStyle} disabled={working || !workspace.initialized || (source === 'file' ? !file : !text.trim())} onClick={() => void prepare()}>Prepare restore</button>
      </section>
      {prepared && <section aria-labelledby={`${panelId}-confirmation`} className="space-y-3 rounded border border-amber-700 p-3">
        <h4 ref={confirmationHeading} tabIndex={-1} id={`${panelId}-confirmation`} className="font-semibold text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400">Backup checked · awaiting your restore action</h4>
        <dl className="grid grid-cols-[1fr_auto] gap-2"><dt>Supplier draft entries</dt><dd>{prepared.draftCount}</dd><dt>Evidence files</dt><dd>{prepared.evidenceCount}</dd><dt>Review history entries</dt><dd>{prepared.reviewCount}</dd><dt>Local publications</dt><dd>{prepared.publicationCount}</dd></dl>
        <p className="text-amber-200">Restoring reinstates the backup’s local publication state. Unknown measurements remain unknown; publication does not certify physical fit.</p>
        <p className="text-slate-400">Review names and notes are retained history. Imported reviewer identities are not authenticated.</p>
        <div className="flex flex-wrap gap-2"><button type="button" className={actionStyle} disabled={working || !workspace.initialized} onClick={() => void restore()}>Restore prepared supplier workspace</button><button type="button" className={actionStyle} disabled={working} onClick={() => { workspace.cancelRestore(); setMessage('Prepared restore cancelled. Nothing was restored.'); prepareButton.current?.focus(); }}>Cancel prepared restore</button></div>
      </section>}
      <p ref={status} tabIndex={-1} role="status" aria-live="polite" className="break-words text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400">{workspace.message}{message ? ` ${message}` : ''}</p>
      {(error || workspace.error) && <p role="alert" className="break-words text-amber-300">{error || workspace.error}</p>}
    </div>
  </details>;
}
