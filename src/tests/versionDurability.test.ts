import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { createVersionRecord, loadSavedVersions, persistSavedVersions, pruneAutomaticCheckpoints, SAVED_VERSIONS_STORAGE_KEY } from '@/domain/configurator/versionManager';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';

const version = (name = 'Saved dial', automatic = false) => createVersionRecord(name, createDefaultWatchAssembly(),
  { 'inst-dial-blank': 'listing-blue-dial' }, 300, 1, 0, 'Needs review', automatic);
const memoryStorage = () => {
  const entries = new Map<string, string>();
  return { entries, getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
};

describe('durable saved versions without UI state', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('wires actual Save, Duplicate and Delete actions to durable storage, not transient UI', () => {
    const storage = memoryStorage();
    vi.stubGlobal('window', { localStorage: storage });
    useWatchAssemblyStore.getState().setAssembly(createDefaultWatchAssembly());
    useConfiguratorUIStore.setState({ savedVersions: [] });
    useConfiguratorUIStore.getState().saveVersion('Persistent original');
    const first = useConfiguratorUIStore.getState().savedVersions[0]!;
    expect(loadSavedVersions(storage).versions[0]?.id).toBe(first.id);
    useConfiguratorUIStore.getState().duplicateVersion(first.id);
    expect(loadSavedVersions(storage).versions).toHaveLength(2);
    useConfiguratorUIStore.getState().deleteVersion(first.id);
    expect(loadSavedVersions(storage).versions).toHaveLength(1);
    expect(loadSavedVersions(storage).versions[0]?.name).toBe('Persistent original (Copy)');
    const before = storage.entries.get(SAVED_VERSIONS_STORAGE_KEY);
    useConfiguratorUIStore.setState({ workMode: 'style', previewingVersionId: null });
    expect(storage.entries.get(SAVED_VERSIONS_STORAGE_KEY)).toBe(before);
    expect(useConfiguratorUIStore.getState().versionStorageWarning).toBeNull();
  });
  it('round-trips canonical design and sourcing snapshots after reopening', () => {
    const storage = memoryStorage();
    const saved = version();
    expect(persistSavedVersions([saved], storage)).toBeNull();
    expect(loadSavedVersions(storage)).toEqual({ versions: [saved], warning: null });
    const payload = storage.entries.get(SAVED_VERSIONS_STORAGE_KEY)!;
    expect(payload).not.toContain('previewingVersionId');
    expect(payload).not.toContain('lockedPartIds');
    expect(payload).not.toContain('activePartInstanceId');
  });
  it('persists deletion and retains only the newest eight unpinned automatic checkpoints', () => {
    const storage = memoryStorage();
    const newestFirst = Array.from({ length: 10 }, (_, index) => version(`Auto ${index}`, true));
    const manual = version('Manual');
    const retained = pruneAutomaticCheckpoints([manual, ...newestFirst]);
    expect(retained.map(record => record.name)).toEqual(['Manual', ...newestFirst.slice(0, 8).map(record => record.name)]);
    persistSavedVersions(retained, storage);
    persistSavedVersions([], storage);
    expect(loadSavedVersions(storage).versions).toEqual([]);
  });
  it('does not overwrite prior durable versions on quota failure or overflow', () => {
    const storage = memoryStorage();
    persistSavedVersions([version('Previous')], storage);
    const previous = storage.entries.get(SAVED_VERSIONS_STORAGE_KEY);
    expect(persistSavedVersions(Array.from({ length: 51 }, () => version()), storage)).toContain('50-version');
    expect(storage.entries.get(SAVED_VERSIONS_STORAGE_KEY)).toBe(previous);
    expect(persistSavedVersions([version()], { getItem: storage.getItem, setItem: () => { throw new Error('quota'); } })).toContain('storage is full');
    expect(storage.entries.get(SAVED_VERSIONS_STORAGE_KEY)).toBe(previous);
  });
  it('rejects damaged records/transient assembly injection while retaining valid snapshots', () => {
    const storage = memoryStorage();
    const valid = version();
    const damaged = { ...version(), totalCost: 'cheap', assembly: { ...valid.assembly, selectedBandId: 'band-dial-face' } };
    storage.setItem(SAVED_VERSIONS_STORAGE_KEY, JSON.stringify({ version: 1, versions: [valid, damaged] }));
    expect(loadSavedVersions(storage).versions).toEqual([valid]);
    expect(loadSavedVersions(storage).warning).toContain('damaged');
    storage.setItem(SAVED_VERSIONS_STORAGE_KEY, 'not json');
    expect(loadSavedVersions(storage).versions).toEqual([]);
    expect(loadSavedVersions(storage).warning).toContain('preserved');
    expect(storage.entries.get(SAVED_VERSIONS_STORAGE_KEY)).toBe('not json');
  });
  it('rejects nonfinite physical dimensions and supports SSR without storage', () => {
    const storage = memoryStorage();
    const invalid = version();
    invalid.assembly.parts['inst-dial-blank']!.dimensions.diameterMm = Number.NaN;
    expect(persistSavedVersions([invalid], storage)).toContain('validated');
    expect(storage.entries.size).toBe(0);
    expect(loadSavedVersions(null)).toEqual({ versions: [], warning: null });
    expect(persistSavedVersions([], null)).toBeNull();
  });
});
