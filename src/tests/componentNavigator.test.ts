import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { buildComponentNavigatorItems, navigatorDimensions, resolveNavigatorSelection } from '@/domain/configurator/componentNavigator';
import { selectNavigatorComponent } from '@/components/configurator/componentNavigatorActions';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useScaleStore } from '@/stores/scaleStore';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { withScaleSnapshot } from '@/domain/scales/scaleDocumentAdapter';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import '@/stores/storeSync';

describe('authoritative component navigator', () => {
  it('does not wire canvas inspection back into placement or duplicate target synchronisation', () => {
    const canvas = readFileSync(new URL('../components/layout/CentreCanvas.tsx', import.meta.url), 'utf8');
    const app = readFileSync(new URL('../app/App.tsx', import.meta.url), 'utf8');
    expect(canvas).not.toContain('syncScaleFromBand');
    expect(canvas).not.toContain('syncFromBand');
    expect(app).toContain('band.id === scalePluginConfig.placementTargetBandId');
    expect(app).not.toContain('syncScaleFromBand(selectedBand');
  });
  it('lists actual assembly instances once in authoritative order, not mock-up cards', () => {
    const assembly = createDefaultWatchAssembly();
    const items = buildComponentNavigatorItems(assembly);
    expect(new Set(items.map(item => item.id)).size).toBe(Object.keys(assembly.parts).length);
    expect(items[0]!.id).toBe(assembly.partOrder[0]);
    expect(items.every(item => assembly.parts[item.id]?.name === item.name)).toBe(true);
  });
  it('reports physical annular dimensions and resolves a band selection to its real part', () => {
    const items = buildComponentNavigatorItems(createDefaultWatchAssembly());
    const selected = resolveNavigatorSelection(items, { bandId: 'band-chapter-ring' })!;
    expect(selected.id).toBe('inst-chapter-ring');
    expect(selected.outerRadiusMm).toBeGreaterThan(selected.innerRadiusMm!);
    expect(navigatorDimensions(selected)).toContain('width');
    expect(resolveNavigatorSelection(items, { componentId: 'not-a-real-part' })).toBeNull();
  });
  it('unifies right context and central selection without closing Advanced or mutating locks', () => {
    const assembly = createDefaultWatchAssembly();
    useWatchAssemblyStore.getState().setAssembly(assembly);
    useConfiguratorUIStore.getState().setWorkMode('advanced');
    const item = buildComponentNavigatorItems(assembly).find(item => item.bandId === 'band-outer-bezel')!;
    const before = useWatchAssemblyStore.getState().exportJson();
    selectNavigatorComponent(item);
    expect(useConfiguratorUIStore.getState().activePartInstanceId).toBe(item.id);
    expect(useSelectionStore.getState().selectedComponentId).toBe(item.id);
    expect(useSelectionStore.getState().selectedBandId).toBe(item.bandId);
    expect(useConfiguratorUIStore.getState().workMode).toBe('advanced');
    expect(useWatchAssemblyStore.getState().exportJson()).toBe(before);
  });
  it('selecting a non-ring clears stale ring linkage and opens component options from Build', () => {
    const assembly = createDefaultWatchAssembly();
    useWatchAssemblyStore.getState().setAssembly(assembly);
    useSelectionStore.getState().selectBand('band-outer-bezel');
    useConfiguratorUIStore.getState().setWorkMode('build');
    const item = buildComponentNavigatorItems(assembly).find(item => !item.bandId)!;
    selectNavigatorComponent(item);
    expect(useSelectionStore.getState().selectedBandId).toBeNull();
    expect(useConfiguratorUIStore.getState().workMode).toBe('parts');
    expect(useConfiguratorUIStore.getState().activePartInstanceId).toBe(item.id);
  });
  it('unknown physical diameters remain explicitly unknown', () => {
    const assembly = createDefaultWatchAssembly();
    const id = Object.keys(assembly.parts).find(id => !id.includes('bezel') && id !== 'inst-dial-blank' && id !== 'inst-chapter-ring')!;
    assembly.parts[id]!.dimensions.diameterMm = 0;
    const item = buildComponentNavigatorItems(assembly).find(item => item.id === id)!;
    expect(item.outerRadiusMm).toBeNull();
    expect(navigatorDimensions(item)).toBe('Dimensions not recorded');
  });
  it('component inspection cannot relocate a saved branded scale or overwrite its artwork', () => {
    useScaleStore.setState({ activeArchetypeId: undefined, crossArchetypeUnlocked: false });
    const initial = withScaleSnapshot(createDefaultWatchAssembly(), {
      selectedScaleKind: 'slide-rule', context: { startAngleDeg: 0, endAngleDeg: 360 },
      pluginConfig: { ...getScalePlugin('slide-rule')!.defaultConfig, ...getScaleProgram('aviation', []).config,
        placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring', previewEnabled: true }
    });
    useWatchAssemblyStore.getState().setAssembly(initial);
    expect(useScaleStore.getState().selectReferenceDesign('navitimer')).toBe(true);
    useConfiguratorUIStore.getState().setWorkMode('style');
    const currentTarget = assemblyToBands(useWatchAssemblyStore.getState().assembly)
      .find(band => band.id === useScaleStore.getState().pluginConfig.placementTargetBandId)!;
    useScaleStore.getState().syncFromBand(currentTarget, useScaleStore.getState().pluginConfig.minimumLineWidthMm ?? .1);
    const beforeConfig = JSON.stringify(useScaleStore.getState().pluginConfig);
    const beforeLayers = JSON.stringify(useWatchAssemblyStore.getState().assembly.designConfig?.slideRuleLayers);
    const beforeArtwork = JSON.stringify(useScaleStore.getState().preview);
    const items = buildComponentNavigatorItems(useWatchAssemblyStore.getState().assembly);
    for (const id of ['inst-dial-blank', 'inst-chapter-ring', 'inst-inner-bezel', 'inst-hour-hand']) {
      const item = items.find(item => item.id === id)!;
      expect(item).toBeDefined();
      selectNavigatorComponent(item);
      // The dashboard synchronizes physical dimensions for the EXISTING placement,
      // not the unrelated component currently inspected by the user.
      const target = assemblyToBands(useWatchAssemblyStore.getState().assembly)
        .find(band => band.id === useScaleStore.getState().pluginConfig.placementTargetBandId)!;
      useScaleStore.getState().syncFromBand(target, useScaleStore.getState().pluginConfig.minimumLineWidthMm ?? .1);
      expect(JSON.stringify(useScaleStore.getState().pluginConfig)).toBe(beforeConfig);
      expect(JSON.stringify(useWatchAssemblyStore.getState().assembly.designConfig?.slideRuleLayers)).toBe(beforeLayers);
      expect(JSON.stringify(useScaleStore.getState().preview)).toBe(beforeArtwork);
    }
  });
});
