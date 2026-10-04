import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { partDiscoveryLinks, partDiscoveryQuery } from '@/domain/sourcing/partDiscovery';
import { useScaleStore } from '@/stores/scaleStore';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { parseAliExpressCapture } from '@/domain/sourcing/aliexpressCapture';

describe('independent styling and sourcing discovery', () => {
  it('retains a silver dial, rose case, silver diamond bezel and rose markers independently', () => {
    const assembly = createDefaultWatchAssembly();
    const dimensions = JSON.stringify(assembly.globalDimensions);
    assembly.designConfig = { ...assembly.designConfig, dialFaceConfig: { color: '#e2e8f0' }, visualReferenceConfig: {
      caseFinish: 'rose-gold', bezelFinish: 'steel', handsColor: '#111827', markerColor: '#c08a76',
      componentAssetOverrides: { bezel: 'bezel-diamond-rose-gold-42', hands: 'hands-mercedes-42' }
    } };
    const model = watchAssemblyToVisualModel(JSON.parse(JSON.stringify(assembly)) as typeof assembly);
    expect(model.dialColor).toBe('#e2e8f0');
    expect(model.archetypeAppearance).toMatchObject({ caseColor: '#c08a76', handsColor: '#111827', markerColor: '#c08a76', bezelMetalColor: model.finishes.bezel.color });
    expect(model.finishes.bezel.id).toBe('polished-steel');
    expect(model.assets.bezel.assetType).toBe('glb');
    expect(model.assets.hands.assetId).toBe('hands-mercedes-42');
    expect(JSON.stringify(assembly.globalDimensions)).toBe(dimensions);
  });

  it('uses NH05 and ladies case dimensions, not NH35 or a default 42 mm search', () => {
    const assembly = createStarterBuild('ladies-dress').assembly;
    const casePart = Object.values(assembly.parts).find(part => part.catalogueItemId === 'cat-case-nh05-ladies-dress-34')!;
    const query = partDiscoveryQuery(assembly, casePart);
    expect(query.toLowerCase()).toContain('nh05');
    expect(query).toContain('34mm');
    expect(query).not.toMatch(/42mm|nh35/i);
  });

  it('searches for the silver dial independently from rose-gold case metal', () => {
    const assembly = createStarterBuild('ladies-dress').assembly;
    assembly.designConfig = { ...assembly.designConfig, dialFaceConfig: { color: '#e2e8f0' }, visualReferenceConfig: { caseFinish: 'rose-gold' } };
    const dial = Object.values(assembly.parts).find(part => part.category === 'dial')!;
    expect(partDiscoveryQuery(assembly, dial)).toContain('silver');
    expect(partDiscoveryQuery(assembly, dial)).not.toContain('rose gold');
  });

  it('supplies live marker geometry when the ladies GLB is a sterile substrate', () => {
    const assembly = createStarterBuild('ladies-dress').assembly;
    assembly.designConfig!.visualReferenceConfig = { ...assembly.designConfig!.visualReferenceConfig, markerColor: '#c08a76' };
    const model = watchAssemblyToVisualModel(assembly);
    expect(model.assets.dial.assetType).toBe('procedural');
    expect(model.dial.markers.length).toBeGreaterThan(0);
    expect(model.dial.outerDiameterMm).toBe(24.5);
    expect(model.assets.case.assetId).toBe('case-nh05-ladies-dress-34');
  });

  it('encodes search input without allowing query or URL injection', () => {
    const query = 'NH05 24.5mm silver & rose # dial';
    const links = partDiscoveryLinks(query);
    for (const link of links) {
      expect(new URL(link.url).protocol).toBe('https:');
      expect(link.url).toContain(encodeURIComponent(query));
    }
    expect(new URL(links[1]!.url).searchParams.get('_nkw')).toBe(query);
  });

  it.each(['javascript:alert(1)', 'https://aliexpress.com.evil.test/item/123', 'https://user:pass@aliexpress.com/item/123', 'http://aliexpress.com/item/123'])('rejects unsafe imported capture URL %s', sourceUrl => {
    expect(() => parseAliExpressCapture({
      schema: 'dial-designer/aliexpress-capture/v1', source: 'aliexpress', sourceUrl,
      itemId: '123', title: 'Dial', sellerName: 'Seller', shipping: null,
      itemPrice: { amount: 90, currency: 'ZAR' }, capturedAtIso: '2026-10-03T10:00:00+02:00'
    })).toThrow();
  });

  it('retains scale colour across circular, compass and aviation programs', () => {
    const previous = useScaleStore.getState();
    try {
      useScaleStore.setState({ activeArchetypeId: undefined, crossArchetypeUnlocked: true });
      useScaleStore.getState().updatePluginConfig({ color: '#c08a76' });
      useScaleStore.getState().setSelectedScaleKind('circular');
      expect(useScaleStore.getState().pluginConfig.color).toBe('#c08a76');
      const bands = assemblyToBands(createDefaultWatchAssembly());
      useScaleStore.getState().applyScaleProgram('aviation', bands);
      expect(useScaleStore.getState().pluginConfig.color).toBe('#c08a76');
      expect(useScaleStore.getState().preview?.color).toBe('#c08a76');
      useScaleStore.getState().applyScaleProgram('compass', bands);
      expect(useScaleStore.getState().preview?.color).toBe('#c08a76');
    } finally { useScaleStore.setState(previous); }
  });
});
