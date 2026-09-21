import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { createStarterBuild, type StarterBuildType } from '@/domain/configurator/defaultBuilds';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { applyReference42Preview } from '@/domain/presets/reference3d';
import { assessRenderAlignment, createStoredZip } from '@/visual3d/renderQuality';
import { deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';

const originalAssembly = structuredClone(useWatchAssemblyStore.getState().assembly);

afterEach(() => {
  useWatchAssemblyStore.setState({ assembly: structuredClone(originalAssembly), dirty: false });
  useConfiguratorUIStore.setState({
    workMode: 'parts', trayTab: 'options', archetypePreviewAssembly: null,
    previewAssembly: null, previewingVersionId: null
  });
});

describe('archetype rendering and dashboard routing', () => {
  it('creates visually distinct starter assemblies for every exposed archetype', () => {
    const types: StarterBuildType[] = ['diver', 'pilot', 'dress', 'field', 'chronograph'];
    const builds = types.map((type) => createStarterBuild(type));
    expect(new Set(builds.map((build) => build.assembly.designConfig?.visualReferenceConfig?.archetypeId)).size).toBe(5);
    expect(new Set(builds.map((build) => build.assembly.parts['inst-dial-blank']?.color)).size).toBe(5);
    expect(builds.map((build) => build.assembly.designConfig?.markerConfig?.kind)).toEqual([
      'round', 'arabic-numeral', 'roman-numeral', 'arabic-numeral', 'baton'
    ]);
    expect(builds.at(-1)?.assembly).toMatchObject({ metadata: { movement: 'vk63' }, parts: { 'inst-pushers': { visible: true } } });
  });

  it('restyles the current high-detail assembly without discarding its visual asset bindings', () => {
    const source = applyReference42Preview(createDefaultWatchAssembly());
    const originalDialColor = source.parts['inst-dial-blank']?.color;
    const pilot = createStarterBuild('pilot', source).assembly;
    const model = watchAssemblyToVisualModel(pilot);
    expect(pilot.designConfig?.visualReferenceId).toBe(source.designConfig?.visualReferenceId);
    expect(pilot.parts['inst-dial-blank']?.visual).toEqual(source.parts['inst-dial-blank']?.visual);
    expect(model.archetypeAppearance).toMatchObject({ dialColor: '#111317', strapColor: '#4b2d1c' });
    expect(model.assets).toMatchObject({
      dial: { assetId: 'archetype-dial-pilot' },
      bezel: { assetId: 'archetype-bezel-pilot' },
      hands: { assetId: 'archetype-hands-pilot' },
      strap: { assetId: 'archetype-strap-leather' }
    });
    expect(source.parts['inst-dial-blank']?.color).toBe(originalDialColor);
    const chronographModel = watchAssemblyToVisualModel(createStarterBuild('chronograph', source).assembly);
    expect(chronographModel.assets.pushers.assetId).toBe('archetype-pushers-chronograph');
    expect(chronographModel.visible.pushers).toBe(true);
  });

  it('applies an inspector archetype choice to canonical visual state', () => {
    useWatchAssemblyStore.setState({ assembly: createDefaultWatchAssembly(), dirty: false });
    useWatchAssemblyStore.getState().updateVisualReferenceConfig({ archetypeId: 'archetype-field' });
    const assembly = useWatchAssemblyStore.getState().assembly;
    expect(assembly.designConfig?.visualReferenceConfig).toMatchObject({ archetypeId: 'archetype-field', bezelId: 'bezel-smooth' });
    expect(assembly.designConfig?.markerConfig?.kind).toBe('arabic-numeral');
    expect(assembly.parts['inst-dial-blank']?.color).toBe('#263329');
  });

  it('persists repeatable render settings in the canonical project', () => {
    useWatchAssemblyStore.setState({ assembly: createDefaultWatchAssembly(), dirty: false });
    useWatchAssemblyStore.getState().updateVisualReferenceConfig({
      archetypeId: 'archetype-dive',
      renderPreset: 'detail',
      renderRotation: [0.08, -0.12, 0],
      renderDistance: 8.2
    });
    const exported = deserializeWatchAssembly(useWatchAssemblyStore.getState().exportJson());
    expect(exported.designConfig?.visualReferenceConfig).toMatchObject({
      archetypeId: 'archetype-dive', renderPreset: 'detail', renderDistance: 8.2
    });
    expect(assessRenderAlignment(exported).find((check) => check.label === 'Saved camera')?.status).toBe('pass');
  });

  it('builds a valid one-click render package archive', async () => {
    const archive = createStoredZip([{ name: 'manifest.json', bytes: new TextEncoder().encode('{"ok":true}') }]);
    const bytes = new Uint8Array(await archive.arrayBuffer());
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect([...bytes.slice(-22, -18)]).toEqual([0x50, 0x4b, 0x05, 0x06]);
  });

  it('previews archetypes without committing and routes left modes to their next-panel tab', () => {
    const committed = createDefaultWatchAssembly();
    const preview = createStarterBuild('pilot').assembly;
    useWatchAssemblyStore.setState({ assembly: committed, dirty: false });
    useConfiguratorUIStore.getState().setArchetypePreview(preview);
    expect(useConfiguratorUIStore.getState().getActiveAssembly()).toBe(preview);

    const cases = [
      ['parts', 'options'], ['style', 'style'], ['research', 'suppliers'], ['manufacture', 'manufacture']
    ] as const;
    for (const [mode, tab] of cases) {
      useConfiguratorUIStore.getState().setWorkMode(mode);
      expect(useConfiguratorUIStore.getState().trayTab).toBe(tab);
    }
    expect(useWatchAssemblyStore.getState().assembly).toBe(committed);
  });
});
