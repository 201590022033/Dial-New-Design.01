import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  });
});
import { renderToStaticMarkup } from 'react-dom/server';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useGlobalSettingsStore } from '@/stores/globalSettingsStore';
import { syncAssemblyDownstream } from '@/stores/storeSync';
import { getCatalogueItemByKind } from '@/domain/catalogue/catalogueRegistry';
import { ActiveBuildBomView } from '@/components/configurator/ControlledBomPanel';
import { evaluateAssembly } from '@/domain/compatibility/compatibilityEngine';
import { AdvancedModePanel } from '@/components/configurator/AdvancedModePanel';

describe('menu audit repairs', () => {
  beforeEach(() => {
    useWatchAssemblyStore.getState().setAssembly(createDefaultWatchAssembly());
    useWatchAssemblyStore.getState().clearAssemblyHistory();
    useConfiguratorUIStore.getState().cancelPreview();
    useConfiguratorUIStore.setState({ lockedPartIds: new Set(), activePartInstanceId: 'inst-dial-blank' });
    // React SSR uses Zustand's initial snapshot, not its live browser snapshot.
    vi.spyOn(useWatchAssemblyStore, 'getInitialState').mockImplementation(() => useWatchAssemblyStore.getState());
    vi.spyOn(useConfiguratorUIStore, 'getInitialState').mockImplementation(() => useConfiguratorUIStore.getState());
  });
  afterEach(() => vi.restoreAllMocks());

  it('does not carry ladies physical parts or render overrides into NH35 starters', () => {
    const ladies = createStarterBuild('ladies-dress').assembly;
    ladies.designConfig!.visualReferenceConfig!.caseFinish = 'rose-gold';
    for (const type of ['diver', 'pilot', 'dress', 'field'] as const) {
      const next = createStarterBuild(type, ladies).assembly;
      expect(next.metadata.movement).toBe('nh35');
      expect(next.parts['inst-dial-blank']!.dimensions.diameterMm).toBe(28.5);
      expect(next.parts['inst-minute-hand']!.dimensions.diameterMm).toBe(13.5);
      expect(next.designConfig?.visualReferenceConfig?.caseFinish).toBeUndefined();
      expect(ladies.parts['inst-dial-blank']!.dimensions.diameterMm).toBe(24.5);
    }
  });

  it('uses canonical case dimensions rather than stale legacy geometry settings', () => {
    const assembly = createStarterBuild('ladies-dress').assembly;
    assembly.designConfig!.geometryParameters!.caseDiameterMm = 42;
    syncAssemblyDownstream(assembly);
    expect(useGlobalSettingsStore.getState().caseDiameterMm).toBe(34);
  });

  it('undoes and redoes live colours and diameter edits without losing the original', () => {
    const store = useWatchAssemblyStore.getState();
    const original = store.assembly;
    store.updateDialFaceConfig({ color: '#c08a76' });
    const rose = useWatchAssemblyStore.getState().assembly;
    store.undoAssembly();
    expect(useWatchAssemblyStore.getState().assembly).toEqual(original);
    store.redoAssembly();
    expect(useWatchAssemblyStore.getState().assembly).toEqual(rose);
    store.updatePart('inst-dial-blank', { dimensions: { ...rose.parts['inst-dial-blank']!.dimensions, diameterMm: 24.5 } });
    expect(useWatchAssemblyStore.getState().historyFuture).toHaveLength(0);
    store.undoAssembly();
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-dial-blank']!.dimensions.diameterMm).toBe(28.5);
  });

  it('shows the actual ladies BOM and never approves a separate NH35 kit', () => {
    useWatchAssemblyStore.getState().setAssembly(createStarterBuild('ladies-dress').assembly);
    const assembly = useWatchAssemblyStore.getState().assembly;
    const ui = useConfiguratorUIStore.getState();
    const html = renderToStaticMarkup(<ActiveBuildBomView assembly={assembly} selections={{}} readiness={ui.getBuildReadiness()} cost={ui.getCommittedCost()} compatibility={evaluateAssembly(assembly)} />);
    expect(html).toContain('NH05');
    expect(html).toContain('34');
    expect(html).toContain('24.5');
    expect(html).toContain('Not an order approval');
    expect(html).not.toContain('Orderable');
    expect(html).not.toContain('NMK901 / SKX007-SRPD / 42 mm');
  });

  it('disables unfinished inspection layers and labels the physical diameter editor', () => {
    const html = renderToStaticMarkup(<AdvancedModePanel />);
    expect((html.match(/disabled=""/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(html).toContain('diameter in millimetres');
    expect(html).not.toContain('Set to nearest valid');
  });

  it('allows a texture-only finish on a red build but rejects disguised geometry changes', () => {
    const current = createStarterBuild('ladies-dress').assembly;
    useWatchAssemblyStore.getState().setAssembly(current);
    const preview = structuredClone(current);
    preview.parts['inst-dial-blank']!.texture = 'sunburst';
    const candidate = { ...getCatalogueItemByKind('dial-blank')!, id: 'style-sunburst', kind: 'style-finish' };
    const ui = useConfiguratorUIStore.getState();
    ui.setPreview(preview, 'inst-dial-blank', candidate);
    expect(useConfiguratorUIStore.getState().previewError).toBeNull();
    expect(ui.applyPreview()).toBe(true);
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-dial-blank']!.texture).toBe('sunburst');
    const invalid = structuredClone(useWatchAssemblyStore.getState().assembly);
    invalid.parts['inst-dial-blank']!.dimensions.diameterMm = 60;
    ui.setPreview(invalid, 'inst-dial-blank', candidate);
    expect(ui.applyPreview()).toBe(false);
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-dial-blank']!.dimensions.diameterMm).toBe(24.5);
  });
});
