import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { visualAssetRegistry } from '@/visual3d/visualAssetRegistry';

type Manifest = { schema: string; assets: Array<{ assetId: string; category: string; path: string; meshCount: number }> };

describe('component variant GLB library', () => {
  const root = resolve(process.cwd(), 'public/assets/3d/variants');
  const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8')) as Manifest;

  it('contains the complete generated workload with non-empty meshes', () => {
    expect(manifest.schema).toBe('dial-designer/component-variants/v1');
    expect(manifest.assets).toHaveLength(43);
    for (const asset of manifest.assets) {
      const path = resolve(process.cwd(), asset.path);
      expect(existsSync(path), asset.assetId).toBe(true);
      expect(statSync(path).size, asset.assetId).toBeGreaterThan(1_000);
      expect(asset.meshCount, asset.assetId).toBeGreaterThan(0);
    }
  });

  it('registers every generated asset to the same public path', () => {
    for (const asset of manifest.assets) {
      const descriptor = visualAssetRegistry[asset.assetId];
      expect(descriptor, asset.assetId).toBeDefined();
      expect(descriptor?.assetType).toBe('glb');
      expect(descriptor?.assetPath).toBe(`/${asset.path.replace(/^public\//, '')}`);
    }
  });
  it('authors the new drilled case and sector dial as meshes with embedded brushing', () => {
    const readGlb = (id: string) => {
      const bytes = readFileSync(resolve(process.cwd(), manifest.assets.find(a => a.assetId === id)!.path));
      return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString()) as {
        nodes: Array<{ name: string; extras?: Record<string, unknown> }>;
        materials: Array<{ pbrMetallicRoughness?: { metallicRoughnessTexture?: unknown } }>;
      };
    };
    const body = readGlb('case-namoki-nmk903-black-38');
    expect(body.nodes.filter(n => n.extras?.DD_DRILLED_LUG === true)).toHaveLength(4);
    expect(body.nodes.some(n => n.name.includes('CROWN_PREVIEW'))).toBe(false);
    const dial = readGlb('dial-namoki-108-silver-285');
    expect(dial.nodes.filter(n => n.name.startsWith('DD_DIAL_INDEX_TRACK_'))).toHaveLength(60);
    expect(dial.nodes.filter(n => n.name.startsWith('DD_DIAL_INDEX_FINE_'))).toHaveLength(300);
    expect(dial.materials.some(m => m.pbrMetallicRoughness?.metallicRoughnessTexture)).toBe(true);
  });
});
