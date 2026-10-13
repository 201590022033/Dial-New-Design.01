import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SupplierWorkspaceBackupPanel } from '@/components/configurator/SupplierWorkspaceBackupPanel';

const asyncAction = vi.fn(() => Promise.resolve(true));
const exportAction = vi.fn(() => Promise.resolve(null));
const cancel = vi.fn();
type Counts = { draftCount: number; evidenceCount: number; reviewCount: number; publicationCount: number };
let state = { initialized: true, busy: false, error: null as string | null, preparedRestore: null as Counts | null, message: '', initialize: asyncAction, exportBackup: exportAction, prepareRestore: asyncAction, restore: asyncAction, cancelRestore: cancel };
vi.mock('@/stores/supplierWorkspaceStore', () => ({ useSupplierWorkspaceStore: (selector: (value: typeof state) => unknown) => selector(state) }));

describe('DF7 combined supplier backup controls', () => {
  beforeEach(() => { state = { ...state, initialized: true, busy: false, error: null, preparedRestore: null, message: '' }; asyncAction.mockClear(); exportAction.mockClear(); cancel.mockClear(); });
  it('starts collapsed with explicit export and prepare controls and no automatic operations', () => {
    const html = renderToStaticMarkup(<SupplierWorkspaceBackupPanel />);
    expect(html).toContain('Supplier workspace backup &amp; restore');
    expect(html).not.toContain('<details open');
    expect(html).toContain('Export complete supplier backup');
    expect(html).toContain('Complete supplier workspace backup file');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Prepare restore<\/button>/);
    expect(html).not.toContain('>Restore prepared supplier workspace<');
    expect(html).toContain('Files are read locally only when you choose Prepare restore');
    expect(html).toContain('attached evidence, review history and local publications');
    expect(asyncAction).not.toHaveBeenCalled();
    expect(exportAction).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });
  it('requires a separate restore action after showing checked backup counts', () => {
    state = { ...state, preparedRestore: { draftCount: 2, evidenceCount: 7, reviewCount: 3, publicationCount: 1 } };
    const html = renderToStaticMarkup(<SupplierWorkspaceBackupPanel />);
    expect(html).toContain('Backup checked · awaiting your restore action');
    expect(html).toContain('<dt>Supplier draft entries</dt><dd>2</dd>');
    expect(html).toContain('<dt>Evidence files</dt><dd>7</dd>');
    expect(html).toContain('<dt>Review history entries</dt><dd>3</dd>');
    expect(html).toContain('<dt>Local publications</dt><dd>1</dd>');
    expect(html).toContain('Restore prepared supplier workspace');
    expect(html).toContain('Cancel prepared restore');
    expect(html).toContain('Unknown measurements remain unknown');
    expect(html).toContain('reviewer identities are not authenticated');
    expect(asyncAction).not.toHaveBeenCalled();
  });
  it('explains nonempty-workspace preservation and identical backup deduplication', () => {
    const html = renderToStaticMarkup(<SupplierWorkspaceBackupPanel />);
    expect(html).toContain('identical backup without adding duplicates');
    expect(html).toContain('Different existing local data is preserved and will block restore');
    expect(html).toContain('Your watch design and supplier selections are separate');
  });
  it('provides load/retry recovery and disables actions until local storage is ready', () => {
    state = { ...state, initialized: false, error: 'Local backup workspace could not be read.' };
    const html = renderToStaticMarkup(<SupplierWorkspaceBackupPanel />);
    expect(html).toContain('Load or retry local workspace');
    expect(html).toContain('Load the local workspace before exporting');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Export complete supplier backup<\/button>/);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Local backup workspace could not be read');
    expect(asyncAction).not.toHaveBeenCalled();
  });
  it('announces store outcomes and prevents repeated restore while an operation is pending', () => {
    state = { ...state, busy: true, message: 'Identical backup: no duplicate records were added.', preparedRestore: { draftCount: 2, evidenceCount: 7, reviewCount: 3, publicationCount: 1 } };
    const html = renderToStaticMarkup(<SupplierWorkspaceBackupPanel />);
    expect(html).toContain('role="status" aria-live="polite"');
    expect(html).toContain('Identical backup: no duplicate records were added');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Restore prepared supplier workspace<\/button>/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Cancel prepared restore<\/button>/);
  });
});
