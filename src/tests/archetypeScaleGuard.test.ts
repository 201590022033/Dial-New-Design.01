import { afterEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  });
});
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { generateMarkers } from '@/domain/generators/markerEngine';
import { useScaleStore } from '@/stores/scaleStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

const initialScale = useScaleStore.getState();
const initialUi = useConfiguratorUIStore.getState();

afterEach(() => {
  useScaleStore.setState(initialScale);
  useConfiguratorUIStore.setState(initialUi);
});

describe('archetype scale guard', () => {
  it('locks aviation on a chronograph until explicitly unlocked and relocks on archetype change', () => {
    const store = useScaleStore.getState();
    store.syncArchetypeScale('archetype-chronograph', []);
    expect(useScaleStore.getState().selectedScaleKind).toBe('tachymeter');
    expect(useScaleStore.getState().crossArchetypeUnlocked).toBe(false);
    expect(store.applyScaleProgram('aviation', [])).toBe(false);
    expect(useScaleStore.getState().selectedScaleKind).toBe('tachymeter');
    store.setSelectedScaleKind('slide-rule');
    expect(useScaleStore.getState().selectedScaleKind).toBe('tachymeter');

    store.setCrossArchetypeUnlocked(true, []);
    expect(store.applyScaleProgram('aviation', [])).toBe(true);
    expect(useScaleStore.getState().selectedScaleKind).toBe('slide-rule');
    expect(useScaleStore.getState().preview?.kind).toBe('slide-rule');

    store.syncArchetypeScale('archetype-dive', []);
    expect(useScaleStore.getState()).toMatchObject({
      selectedScaleKind: 'circular', activeArchetypeId: 'archetype-dive', crossArchetypeUnlocked: false
    });
    expect(store.applyScaleProgram('aviation', [])).toBe(false);
    store.setCrossArchetypeUnlocked(true, []);
    store.setCrossArchetypeUnlocked(false, []);
    expect(useScaleStore.getState()).toMatchObject({ selectedScaleKind: 'circular', crossArchetypeUnlocked: false });
  });

  it('shows compass labels outside the ticks and scales tick lengths', () => {
    const compass = getScaleProgram('compass', []);
    expect(compass.config.labelPlacement).toBe('outside');
    const store = useScaleStore.getState();
    store.syncArchetypeScale('archetype-pilot', []);
    expect(store.applyScaleProgram('compass', [])).toBe(true);
    const original = useScaleStore.getState().preview?.ticks[0]?.lengthMm ?? 0;
    store.updatePluginConfig({ scaleTickLengthFactor: 1.5 });
    expect(useScaleStore.getState().preview?.ticks[0]?.lengthMm).toBeCloseTo(original * 1.5);
  });

  it('clears a temporary archetype preview when returning to Build', () => {
    const preview = createDefaultWatchAssembly();
    useConfiguratorUIStore.getState().setWorkMode('style');
    useConfiguratorUIStore.getState().setArchetypePreview(preview);
    useConfiguratorUIStore.getState().setWorkMode('parts');
    expect(useConfiguratorUIStore.getState().archetypePreviewAssembly).toBeNull();
  });

  it('uses a procedural dial for custom Roman indices and keeps XII at 12 o’clock', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.designConfig!.visualReferenceConfig = { dialMarkerMode: 'roman' };
    assembly.designConfig!.markerConfig!.kind = 'roman-numeral';
    assembly.designConfig!.markerConfig!.startAngleDeg = 0;
    const model = watchAssemblyToVisualModel(assembly);
    expect(model.assets.dial.assetType).toBe('procedural');
    expect(model.dial.customMarkerOverride).toBe(true);
    expect(model.dial.markers[0]).toMatchObject({ angleDeg: 0, text: 'XII' });
    expect(generateMarkers(assembly.designConfig!.markerConfig!)[4]?.text).toBe('IIII');
  });
});
