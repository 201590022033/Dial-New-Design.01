import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { createVersionRecord, loadSavedVersions, persistSavedVersions, pruneAutomaticCheckpoints, SAVED_VERSIONS_STORAGE_KEY } from '@/domain/configurator/versionManager';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { withScaleSnapshot } from '@/domain/scales/scaleDocumentAdapter';
import { milestone7Fixture } from '@/qa/milestone7Fixtures';
import { fullMinuteRingContext } from '@/domain/scales/minuteRingContext';
import { resolveAppearance } from '@/domain/appearance/appearance';

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

  it('losslessly pools four full multi-band reference checkpoints without deleting old versions or appearance', () => {
    const storage = memoryStorage();
    const citizen = milestone7Fixture(42, 'citizen'), navitimer = milestone7Fixture(42, 'navitimer');
    let assembly = withScaleSnapshot(citizen.assembly, { selectedScaleKind: 'slide-rule', pluginConfig: citizen.config, context: fullMinuteRingContext });
    assembly = withScaleSnapshot(assembly, { selectedScaleKind: 'slide-rule', pluginConfig: navitimer.config, context: fullMinuteRingContext });
    // Reproduce separately retained reference settings on a second physical
    // target; these exact snapshots may be disabled, not thrown away on save.
    for (const config of [citizen.config, navitimer.config]) assembly = withScaleSnapshot(assembly, {
      selectedScaleKind: 'slide-rule', pluginConfig: { ...config, placementTargetBandId: 'band-inner-bezel', previewEnabled: false,
        outerRotationOffsetDeg: config.referenceDesign === 'citizen' ? 37 : 61 }, context: fullMinuteRingContext
    });
    const records = Array.from({ length: 4 }, (_, index) => {
      const copy = JSON.parse(JSON.stringify(assembly)) as typeof assembly;
      copy.parts['inst-hour-hand']!.color = ['#123456', '#abcdef', '#ff0000', '#654321'][index]!;
      copy.designConfig!.appearance = resolveAppearance(copy);
      copy.designConfig!.appearance.mainHands.lumeMode = index % 2 ? 'outline' : 'filled';
      copy.designConfig!.appearance.mainHands.tipColor = copy.parts['inst-hour-hand']!.color;
      copy.designConfig!.appearance.mainHands.tipExtentMm = index;
      return createVersionRecord(`Full reference checkpoint ${index}`, copy, {}, 300, 0, 0, 'Needs review');
    });
    const rawLength = JSON.stringify({ version: 1, versions: records }).length;
    // Actual production artwork fixtures, not repeated artificial padding.
    expect(rawLength).toBeGreaterThan(2_000_000);
    expect(persistSavedVersions(records, storage)).toBeNull();
    const payload = storage.entries.get(SAVED_VERSIONS_STORAGE_KEY)!;
    expect((JSON.parse(payload) as { version: unknown }).version).toBe(2);
    expect(payload.length).toBeLessThan(2_000_000);
    const loaded = loadSavedVersions(storage);
    expect(loaded.warning).toBeNull();
    expect(loaded.versions).toEqual(records);
    const layers = loaded.versions[0]!.assembly.designConfig!.slideRuleLayers!.layers;
    expect(layers.find(layer => layer.targetBandId === 'band-outer-bezel')?.activeDesign).toBe('navitimer');
    expect(layers.find(layer => layer.targetBandId === 'band-inner-bezel')?.activeDesign).toBeNull();
    expect(layers.find(layer => layer.targetBandId === 'band-inner-bezel')?.settings.citizen?.outerRotationDeg).toBe(37);
    expect(layers.find(layer => layer.targetBandId === 'band-inner-bezel')?.settings.navitimer?.outerRotationDeg).toBe(61);
    const first = loaded.versions[0]!.assembly.designConfig!.slideRuleLayers!.layers[0]!.settings.citizen!.artwork!;
    const second = loaded.versions[1]!.assembly.designConfig!.slideRuleLayers!.layers[0]!.settings.citizen!.artwork!;
    expect(first).not.toBe(second);
    first.ticks[0]!.angleDeg += 1;
    expect(second.ticks[0]!.angleDeg).toBe(records[1]!.assembly.designConfig!.slideRuleLayers!.layers[0]!.settings.citizen!.artwork!.ticks[0]!.angleDeg);
    expect(persistSavedVersions(records, { getItem: storage.getItem, setItem: () => { throw new Error('quota'); } })).toContain('storage is full');
    expect(storage.entries.get(SAVED_VERSIONS_STORAGE_KEY)).toBe(payload);
  });

  it('rejects malformed pooled references without rewriting previously durable data', () => {
    const storage = memoryStorage();
    const damaged = JSON.stringify({ version: 2, versions: [version('Keep me')], artworkPool: ['{}'], artworkReferences: [
      { versionIndex: 99, layerIndex: 0, design: 'citizen', poolIndex: 0 }
    ] });
    storage.setItem(SAVED_VERSIONS_STORAGE_KEY, damaged);
    expect(loadSavedVersions(storage).warning).toContain('preserved');
    expect(storage.entries.get(SAVED_VERSIONS_STORAGE_KEY)).toBe(damaged);
  });
});
