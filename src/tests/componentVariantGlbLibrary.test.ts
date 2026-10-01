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
    expect(manifest.assets).toHaveLength(36);
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
});
