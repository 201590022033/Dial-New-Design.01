import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
});
import { assertAppearance, clampTipExtentMm, resolveAppearance } from '@/domain/appearance/appearance';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { deserializeWatchAssembly, serializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

describe('M6 canonical semantic-region appearance', () => {
  beforeEach(() => {
    useWatchAssemblyStore.getState().setAssembly(createDefaultWatchAssembly());
    useWatchAssemblyStore.getState().clearAssemblyHistory();
    useConfiguratorUIStore.setState({ lockedPartIds: new Set() });
  });
  it('does not mutate or add settings to a legacy design when resolving defaults', () => {
    const assembly = createDefaultWatchAssembly(), before = JSON.stringify(assembly);
    assertAppearance(resolveAppearance(assembly));
    expect(JSON.stringify(assembly)).toBe(before);
    expect(deserializeWatchAssembly(serializeWatchAssembly(assembly)).designConfig?.appearance).toBeUndefined();
  });
  it('persists independent metal, print, lume and tip scopes through canonical JSON', () => {
    const store = useWatchAssemblyStore.getState();
    store.updateAppearance('markers', { metalColor: '#C08A76', printColor: '#112233', lumeMode: 'outline', lumeColor: '#AABBCC' });
    store.updateAppearance('mainHands', { metalColor: '#998877', tipExtentMm: 1.25, tipColor: '#E63946' });
    store.updateAppearance('registerHands', { metalColor: '#556677', tipExtentMm: .5, tipColor: '#FF0000', lumeMode: 'off' });
    const result = deserializeWatchAssembly(useWatchAssemblyStore.getState().exportJson());
    expect(result.designConfig?.appearance).toEqual(useWatchAssemblyStore.getState().assembly.designConfig?.appearance);
    expect(result.designConfig?.appearance?.markers).toMatchObject({ printColor: '#112233', lumeMode: 'outline' });
    expect(result.designConfig?.appearance?.mainHands.metalColor).toBe('#998877');
    expect(result.designConfig?.appearance?.registerHands.metalColor).toBe('#556677');
  });
  it('undoes and redoes semantic edits without changing physical parts', () => {
    const before = useWatchAssemblyStore.getState().assembly;
    useWatchAssemblyStore.getState().updateAppearance('mainHands', { lumeMode: 'outline', tipExtentMm: 2 });
    const edited = useWatchAssemblyStore.getState().assembly;
    expect(edited.parts).toEqual(before.parts);
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useWatchAssemblyStore.getState().assembly.designConfig?.appearance).toBeUndefined();
    useWatchAssemblyStore.getState().redoAssembly();
    expect(useWatchAssemblyStore.getState().assembly.designConfig?.appearance).toEqual(edited.designConfig?.appearance);
  });
  it.each(['markers', 'mainHands', 'registerHands'] as const)('honours canonical and tray physical locks for %s', scope => {
    const id = scope === 'markers' ? 'inst-dial-blank' : 'inst-hour-hand';
    useWatchAssemblyStore.getState().setPartLocked(id, true);
    useWatchAssemblyStore.getState().updateAppearance(scope, { tipExtentMm: 2 });
    expect(useWatchAssemblyStore.getState().assembly.designConfig?.appearance).toBeUndefined();
    useWatchAssemblyStore.getState().setPartLocked(id, false);
    useConfiguratorUIStore.setState({ lockedPartIds: new Set([id]) });
    useWatchAssemblyStore.getState().updateAppearance(scope, { tipExtentMm: 2 });
    expect(useWatchAssemblyStore.getState().assembly.designConfig?.appearance).toBeUndefined();
  });
  it('rejects malformed imported colours, modes, version, NaN and negative extents', () => {
    const base = resolveAppearance(createDefaultWatchAssembly());
    for (const patch of [{ metalColor: 'red' }, { lumeMode: 'fake' }, { tipExtentMm: -1 }, { tipExtentMm: Infinity }]) {
      expect(() => assertAppearance({ ...base, mainHands: { ...base.mainHands, ...patch } })).toThrow();
    }
    expect(() => assertAppearance({ ...base, version: 2 })).toThrow();
    const assembly = createDefaultWatchAssembly();
    assembly.designConfig = { ...assembly.designConfig, appearance: base };
    expect(() => deserializeWatchAssembly(JSON.stringify(assembly).replace('"tipExtentMm":0', '"tipExtentMm":-1'))).toThrow();
  });
  it('clamps each coloured tip without stretching a physical hand', () => {
    expect([5, 8, 8].map(length => clampTipExtentMm(100, length))).toEqual([5, 8, 8]);
    expect(clampTipExtentMm(-2, 8)).toBe(0);
    expect(clampTipExtentMm(NaN, 8)).toBe(0);
    expect(clampTipExtentMm(1.25, 8)).toBe(1.25);
  });
  it('preserves NH05 5/8/8 lengths and fittings while editing appearance', () => {
    const assembly = applyCatalogueVisualSelection(createStarterBuild('ladies-dress', createDefaultWatchAssembly()).assembly, 'inst-hour-hand', getCatalogueItem('cat-research-tandorio-nh05-hands-588')!);
    useWatchAssemblyStore.getState().setAssembly(assembly);
    useWatchAssemblyStore.getState().updateAppearance('mainHands', { tipExtentMm: 8, lumeMode: 'outline' });
    const after = useWatchAssemblyStore.getState().assembly;
    expect(after.parts).toEqual(assembly.parts);
    expect(watchAssemblyToVisualModel(after).hands).toMatchObject({ hourLengthMm: 5, minuteLengthMm: 8, secondLengthMm: 8 });
  });
  it('keeps older metal/marker controls connected without resetting independent registers or lume', () => {
    useWatchAssemblyStore.getState().updateAppearance('mainHands', { lumeMode: 'outline', tipExtentMm: 1 });
    useWatchAssemblyStore.getState().updateAppearance('registerHands', { metalColor: '#123456' });
    useWatchAssemblyStore.getState().updateVisualReferenceConfig({ handsColor: '#C08A76', markerColor: '#ABCDEF' });
    const result = useWatchAssemblyStore.getState().assembly.designConfig!.appearance!;
    expect(result.mainHands).toMatchObject({ metalColor: '#C08A76', lumeMode: 'outline', tipExtentMm: 1 });
    expect(result.markers.printColor).toBe('#ABCDEF');
    expect(result.registerHands.metalColor).toBe('#123456');
  });
});
