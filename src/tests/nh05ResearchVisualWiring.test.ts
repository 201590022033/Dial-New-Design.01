import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { calculateBomCost } from '@/domain/configurator/bomCostCalculator';
import { nh05SupplierCandidateItems, nh05SupplierCandidateListings } from '@/domain/catalogue/nh05SupplierCandidates';
import { listingPriceZar } from '@/domain/catalogue/pricing';

const item = (id: string) => getCatalogueItem(id)!;
const starter = () => createStarterBuild('ladies-dress', createDefaultWatchAssembly()).assembly;
const handId = 'cat-research-tandorio-nh05-hands-588';

describe('NH05 researched GLB selection wiring', () => {
  it('prices one complete hand set and does not replace an unknown rose-gold price with black', () => {
    const assembly = applyCatalogueVisualSelection(starter(), 'inst-hour-hand', item(handId));
    const black = nh05SupplierCandidateListings.find(l => l.sku?.startsWith('Black'))!;
    const rose = nh05SupplierCandidateListings.find(l => l.sku?.startsWith('RoseGold'))!;
    const cost = calculateBomCost(assembly, nh05SupplierCandidateItems, [black, rose], {});
    expect(cost.partsTotal).toBe(listingPriceZar(black));
    expect(cost.shippingUnknownCount).toBe(1);
    expect(calculateBomCost(assembly, nh05SupplierCandidateItems, [black, rose], { 'inst-minute-hand': rose.id }).partsTotal).toBe(0);
  });
  it('updates all central engineering hands and the HD asset using published lengths', () => {
    const before = starter();
    const selected = applyCatalogueVisualSelection(before, 'inst-minute-hand', item(handId));
    for (const [id, length] of [['inst-hour-hand', 5], ['inst-minute-hand', 8], ['inst-central-seconds', 8]] as const) {
      expect(selected.parts[id]?.dimensions.diameterMm).toBe(length);
      expect(selected.parts[id]?.catalogueItemId).toBe(handId);
      expect(selected.parts[id]?.customProperties?.engineeringSpecs).toBeUndefined();
    }
    const model = watchAssemblyToVisualModel(selected);
    expect(model.assets.hands.assetId).toBe('hands-nh05-luminous-588');
    expect(model.hands).toMatchObject({ hourLengthMm: 5, minuteLengthMm: 8, secondLengthMm: 8 });
    expect(before.parts['inst-minute-hand']?.catalogueItemId).not.toBe(handId);
  });
  it('can switch back and reapply repeatedly without retaining the wrong set', () => {
    let assembly = starter();
    for (let i = 0; i < 3; i++) {
      assembly = applyCatalogueVisualSelection(assembly, 'inst-hour-hand', item(handId));
      expect(watchAssemblyToVisualModel(assembly).assets.hands.assetId).toBe('hands-nh05-luminous-588');
      assembly = applyCatalogueVisualSelection(assembly, 'inst-hour-hand', item('cat-hands-nh05-dress-baton'));
      expect(watchAssemblyToVisualModel(assembly).assets.hands.assetId).toBe('hands-baton-nh05-34');
      expect(assembly.parts['inst-minute-hand']?.dimensions.diameterMm).toBeCloseTo(8.82);
    }
  });
  it('applies the white matte dial and keeps later colour edits live', () => {
    const selected = applyCatalogueVisualSelection(starter(), 'inst-dial-blank', item('cat-research-tandorio-nh05-dial-white-245'));
    const white = watchAssemblyToVisualModel(selected);
    expect(white.assets.dial.assetId).toBe('dial-nh05-white-matte-245');
    expect(white.dialColor).toBe('#f2f2ed');
    expect(white.dial.textureKind).toBe('matte');
    selected.designConfig!.dialFaceConfig!.color = '#c08a76';
    expect(watchAssemblyToVisualModel(selected).dialColor).toBe('#c08a76');
  });
  it('selects the separate case and shares the hands GLB across finishes', () => {
    let selected = applyCatalogueVisualSelection(starter(), 'inst-midcase', item('cat-research-tandorio-nh05-case-34'));
    selected = applyCatalogueVisualSelection(selected, 'inst-hour-hand', item(handId));
    selected.designConfig!.visualReferenceConfig!.handsFinish = 'rose-gold';
    const model = watchAssemblyToVisualModel(selected);
    expect(model.assets.case.assetId).toBe('case-tandorio-nh05-research-34');
    expect(selected.globalDimensions.totalThicknessMm).toBe(12);
    expect(model.assets.hands.assetId).toBe('hands-nh05-luminous-588');
    expect(model.archetypeAppearance.handsColor).toBe('#c08a76');
  });
  it('ships real Blender GLB meshes with exact published tip-length metadata', () => {
    const buffer = readFileSync(resolve('public/assets/3d/variants/hands/hands-nh05-luminous-588.glb'));
    expect(buffer.toString('utf8', 0, 4)).toBe('glTF');
    const document = JSON.parse(buffer.toString('utf8', 20, 20 + buffer.readUInt32LE(12))) as { nodes: Array<{ name: string; extras?: { DD_TIP_LENGTH_MM?: number; DD_PROVENANCE_STATUS?: string } }> };
    for (const [role, length] of [['HOUR', 5], ['MINUTE', 8], ['SECONDS', 8]] as const) {
      const node = document.nodes.find((candidate) => candidate.name === `DD_HAND_${role}`)!;
      expect(node.extras?.DD_TIP_LENGTH_MM).toBe(length);
      expect(node.extras?.DD_PROVENANCE_STATUS).toBe('provisional-presentation');
    }
  });
});
