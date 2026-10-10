import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { crownPresentations, crownCatalogueItems, presentationEvidence } from '@/domain/crown/catalogue';
import { createCrownGeometry } from '@/visual3d/crownGeometry';
import { hideEmbeddedCrownPreview, reviewedCrownPreviewCases } from '@/visual3d/crownAssetOwnership';
import { visualAssetRegistry } from '@/visual3d/visualAssetRegistry';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { applyReference42Preview } from '@/domain/presets/reference3d';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { componentPlacement } from '@/visual3d/componentPlacement';

type Glb = {
  scene: number; scenes: Array<{ nodes: number[] }>;
  nodes: Array<{ name: string; mesh?: number; children?: number[]; translation?: number[]; rotation?: number[]; scale?: number[]; matrix?: number[]; extras?: Record<string, unknown> }>;
  meshes: Array<{ primitives: Array<{ attributes: { POSITION: number } }> }>;
  accessors: Array<{ bufferView: number; byteOffset?: number; count: number; componentType: number }>;
  bufferViews: Array<{ byteOffset?: number; byteStride?: number }>;
};
const load = (path: string) => {
  const bytes = readFileSync(path), length = bytes.readUInt32LE(12);
  return { bytes, document: JSON.parse(bytes.subarray(20, 20 + length).toString('utf8')) as Glb, binStart: 28 + length };
};
const vertices = (path: string): Vector3[] => {
  const { bytes, document: d, binStart } = load(path); const points: Vector3[] = [];
  const visit = (id: number, parent: Matrix4) => {
    const node = d.nodes[id]!;
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3().fromArray(node.translation ?? [0, 0, 0]), new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]), new Vector3().fromArray(node.scale ?? [1, 1, 1]));
    const world = parent.clone().multiply(local);
    if (node.mesh !== undefined) for (const primitive of d.meshes[node.mesh]!.primitives) {
      const a = d.accessors[primitive.attributes.POSITION]!, v = d.bufferViews[a.bufferView]!;
      expect(a.componentType).toBe(5126);
      const start = binStart + (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
      for (let i = 0; i < a.count; i++) { const offset = start + i * (v.byteStride ?? 12); points.push(new Vector3(bytes.readFloatLE(offset), bytes.readFloatLE(offset + 4), bytes.readFloatLE(offset + 8)).applyMatrix4(world)); }
    }
    node.children?.forEach(child => visit(child, world));
  };
  d.scenes[d.scene ?? 0]!.nodes.forEach(id => visit(id, new Matrix4())); return points;
};

describe('C3 actual crown assets and fallback', () => {
  it.each(crownPresentations)('inspects $id binary bounds, ownership, hash and matching fallback', p => {
    const path = `public/assets/3d/crowns/crown-${p.id}.glb`;
    const { bytes, document } = load(path);
    expect(document.nodes.filter(n => n.mesh !== undefined).map(n => n.name)).toEqual(['DD_CROWN_HEAD']);
    const points = vertices(path);
    expect(Math.min(...points.map(v => v.x))).toBeCloseTo(0, 5);
    expect(Math.max(...points.map(v => v.x))).toBeCloseTo(p.length, 5);
    expect(Math.max(...points.map(v => Math.hypot(v.y, v.z))) * 2).toBeCloseTo(p.max, 5);
    const geometry = createCrownGeometry({ shape: p.shape, grip: p.grip, coreDiameterMm: p.core, maximumOuterDiameterMm: p.max, lengthMm: p.length });
    expect(geometry.boundingBox!.max.x).toBeCloseTo(p.length, 5);
    expect(geometry.boundingBox!.max.y * 2).toBeCloseTo(p.max, 5);
    // glTF Y-up -> Engineering: [x,-z,y]. Compare actual surface point sets.
    const round = (v: number) => v.toFixed(4);
    const fallback = geometry.getAttribute('position');
    const fallbackSet = new Set(Array.from({ length: fallback.count }, (_, i) => [round(fallback.getX(i)), round(fallback.getY(i)), round(fallback.getZ(i))].join(',')));
    for (const v of points) expect(fallbackSet.has([round(v.x), round(-v.z), round(v.y)].join(','))).toBe(true);
    geometry.dispose();
    const manifest = JSON.parse(readFileSync('docs/research/crown-c3-2026-10-10/asset-manifest.json', 'utf8')) as { assets: Array<{ asset: string; sha256: string }> };
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.assets.find(a => a.asset === path)!.sha256);
  });
  it.each([...reviewedCrownPreviewCases])('suppresses only the reviewed removable head in %s', id => {
    const { document, bytes } = load(`public/assets/3d/variants/cases/${id}.glb`);
    const inventoryRow = readFileSync('docs/CROWN-C0-ASSET-INVENTORY-2026-10-09.md', 'utf8').split('\n').find(line => line.startsWith(`| ${id} |`));
    expect(inventoryRow).toContain(createHash('sha256').update(bytes).digest('hex'));
    expect(document.nodes.filter(n => hideEmbeddedCrownPreview(id, n.name)).map(n => n.name)).toEqual(['DD_CASE_CROWN_PREVIEW']);
    for (const name of ['DD_CASE_MIDCASE', 'DD_CASE_FLOOR', 'DD_CASE_CROWN_TUBE', 'DD_CASE_CROWN_BOSS', 'DD_CASE_CROWN_GUARD', 'DD_CASE_LUG_1_1']) expect(hideEmbeddedCrownPreview(id, name)).toBe(false);
  });
  it('keeps structural guards in the NMK903 and all nodes in unreviewed files', () => {
    const { document } = load('public/assets/3d/variants/cases/case-namoki-nmk903-black-38.glb');
    expect(document.nodes.filter(n => n.name.startsWith('DD_CASE_CROWN_GUARD'))).toHaveLength(2);
    for (const node of document.nodes) expect(hideEmbeddedCrownPreview('case-namoki-nmk903-black-38', node.name)).toBe(false);
    expect(hideEmbeddedCrownPreview('unreviewed-case', 'DD_CASE_CROWN_PREVIEW')).toBe(false);
  });
  it('resolves every crown registry GLB to an actual file', () => {
    for (const asset of Object.values(visualAssetRegistry).filter(a => a.category === 'crown' && a.assetType === 'glb')) expect(existsSync(`public${asset.assetPath}`), asset.assetId).toBe(true);
  });
  it('keeps reference crown size and grip through hand, dial, strap and case-size swaps', () => {
    let assembly = applyReference42Preview(createDefaultWatchAssembly());
    const before = watchAssemblyToVisualModel(assembly).crown;
    for (const [target, id] of [['inst-hour-hand', 'cat-hands-sword-set'], ['inst-dial-blank', 'cat-dial-nh05-245-champagne-sunburst']] as const) {
      const candidate = getCatalogueItem(id);
      if (!candidate) throw new Error(`Missing fixture ${id}`);
      assembly = applyCatalogueVisualSelection(assembly, target, candidate);
      expect(watchAssemblyToVisualModel(assembly).assets.crown.assetId).toBe('reference-42-crown-preview');
      expect(watchAssemblyToVisualModel(assembly).crown).toEqual(before);
    }
    assembly.globalDimensions.caseDiameterMm = 47;
    assembly.designConfig!.visualReferenceConfig!.strapStyleId = 'leather';
    expect(watchAssemblyToVisualModel(assembly).crown).toEqual(before);
    expect(componentPlacement(watchAssemblyToVisualModel(assembly), 'crown').descriptorScale).toEqual([1, 1, 1]);
  });
  it('uses custom shaped fallback dimensions and independent finish without changing the case', () => {
    const assembly = createStarterBuild('ladies-dress').assembly;
    const crown = assembly.parts['inst-crown']!;
    const spec = structuredClone(crownCatalogueItems.find(i => i.id === crown.catalogueItemId)!.crownSpecification!);
    assembly.parts['inst-midcase']!.crownAxes = [{ schema: 'crown-axis/v1', axisId: 'crown-main', clockwiseFrom3hDeg: presentationEvidence(0), interfaceRadiusMm: presentationEvidence(17), stemHeightMm: presentationEvidence(0) }];
    crown.crownSpecification = spec;
    spec.maximumOuterDiameterMm = presentationEvidence(5.8);
    spec.finish = { mode: 'override', material: 'rose-gold', color: '#c08a76', texture: 'polished' };
    const model = watchAssemblyToVisualModel(assembly);
    expect(model.assets.crown.assetType).toBe('procedural');
    expect(model.crown.surface.maximumOuterDiameterMm).toBe(5.8);
    expect(model.finishes.crown.color).toBe('#c08a76');
    expect(model.finishes.case.color).not.toBe('#c08a76');
    crown.visible = false;
    expect(watchAssemblyToVisualModel(assembly).visible.crown).toBe(false);
    crown.visible = true;
    expect(watchAssemblyToVisualModel(assembly).visible.crown).toBe(true);
  });
});
