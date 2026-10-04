import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { applyArchetypeVisualProfile } from '@/domain/configurator/archetypeProfiles';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { createPreviewLugGeometry } from '@/visual3d/proceduralEnvelope';
import { visualAssetRegistry } from '@/visual3d/visualAssetRegistry';

const archetypes = ['ladies-dress-nh05', 'dress-formal', 'business', 'field', 'dive', 'pilot', 'gmt-travel', 'chronograph', 'digital-sport', 'casual'];
const glb = (path: string) => {
  const binary = readFileSync(resolve(process.cwd(), 'public' + path));
  return JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString()) as {
    nodes: Array<{ name: string; extras?: Record<string, number> }>;
    materials: Array<{ name: string; extensions?: Record<string, unknown> }>;
  };
};

describe('all-archetype lug and rose-gold regressions', () => {
  it.each(archetypes)('%s keeps every fallback root corner inside the case shoulder', (id) => {
    const base = id === 'ladies-dress-nh05' ? createStarterBuild('ladies-dress').assembly : createDefaultWatchAssembly();
    const model = watchAssemblyToVisualModel(applyArchetypeVisualProfile(base, `archetype-${id}`));
    const lugs = model.previewEnvelope.lugs;
    expect(Math.hypot(lugs.gap / 2 + lugs.rootWidth, lugs.rootY)).toBeLessThan(model.caseDiameterMm / 2 - 1);
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const geometry = createPreviewLugGeometry(lugs, side, end);
      expect(geometry.boundingBox!.max.z - geometry.boundingBox!.min.z).toBeGreaterThanOrEqual(lugs.thickness);
      geometry.dispose();
    }
  });

  it('uses the ladies 16 mm strap gap rather than a scaled 42 mm lug fixture', () => {
    const model = watchAssemblyToVisualModel(createStarterBuild('ladies-dress').assembly);
    expect(model.previewEnvelope.lugs.gap).toBe(16);
    expect(model.previewEnvelope.attachment.strapWidth).toBeLessThan(16);
    expect(model.assets.case.assetId).toBe('case-nh05-ladies-dress-34');
  });

  it('records connected root envelopes on all eight supplier case GLBs', () => {
    const cases = Object.values(visualAssetRegistry).filter(asset => asset.category === 'case' && asset.assetPath?.includes('/variants/cases/'));
    expect(cases).toHaveLength(8);
    for (const asset of cases) {
      const lugs = glb(asset.assetPath!).nodes.filter(node => node.name.startsWith('DD_CASE_LUG_'));
      expect(lugs).toHaveLength(4);
      for (const lug of lugs) expect(lug.extras?.DD_ROOT_OUTER_RADIUS_MM).toBeCloseTo(asset.referenceCaseDiameterMm! / 2 - .8);
    }
  });

  it.each([34, 42])('has actual faceted diamond and prong meshes in the %s mm bezel GLB', size => {
    const asset = visualAssetRegistry[`bezel-diamond-rose-gold-${size}`]!;
    const data = glb(asset.assetPath!);
    expect(data.nodes.filter(node => node.name.startsWith('DD_DIAMOND_')).length).toBeGreaterThan(40);
    expect(data.nodes.filter(node => node.name.startsWith('DD_BEZEL_PRONG_')).length).toBeGreaterThan(80);
    expect(data.materials.find(material => material.name === 'DD_DIAMOND')?.extensions).toHaveProperty('KHR_materials_transmission');
    expect(data.materials.some(material => material.name === 'DD_ROSE_GOLD')).toBe(true);
  });

  it('persists independent case/hand finishes without recolouring the dial or mutating dimensions', () => {
    const assembly = createStarterBuild('ladies-dress').assembly;
    const dimensions = JSON.stringify(assembly.globalDimensions);
    assembly.designConfig!.visualReferenceConfig = { ...assembly.designConfig!.visualReferenceConfig, caseFinish: 'rose-gold', handsFinish: 'rose-gold', componentAssetOverrides: { bezel: 'bezel-diamond-rose-gold-34' } };
    const model = watchAssemblyToVisualModel(JSON.parse(JSON.stringify(assembly)) as typeof assembly);
    expect(model.archetypeAppearance).toMatchObject({ caseColor: '#c08a76', handsColor: '#c08a76' });
    expect(model.finishes.case.id).toBe('rose-gold');
    expect(model.finishes.hands.id).toBe('rose-gold');
    expect(model.assets.bezel.assetId).toBe('bezel-diamond-rose-gold-34');
    expect(JSON.stringify(assembly.globalDimensions)).toBe(dimensions);
  });

  it('sizes the gemstone base for 40 mm watches without falling back to an unadorned bezel', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.globalDimensions.caseDiameterMm = 40;
    assembly.designConfig = { ...assembly.designConfig, visualReferenceConfig: { componentAssetOverrides: { bezel: 'bezel-diamond-rose-gold-42' } } };
    const model = watchAssemblyToVisualModel(assembly);
    expect(model.assets.bezel.assetId).toBe('bezel-diamond-rose-gold-42');
    expect(model.assets.bezel.scale).toEqual([40 / 42, 40 / 42, 1]);
    expect(model.archetypeAppearance.caseColor).toBeUndefined();
    expect(model.archetypeAppearance.handsColor).toBeUndefined();
  });
});
