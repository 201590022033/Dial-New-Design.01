import { describe, expect, it } from 'vitest';
import { resolveVisualAsset, resolveVisualAssetByCategory, visualAssetRegistry } from '@/visual3d/visualAssetRegistry';

describe('visual asset registry', () => {
  it('resolves a GLB descriptor by stable asset id', () => {
    expect(resolveVisualAsset('case-round-40mm-v1', visualAssetRegistry['visual-case-default']!).assetType).toBe('glb');
  });

  it('falls back for missing or unknown assets', () => {
    const fallback = visualAssetRegistry['visual-case-default']!;
    expect(resolveVisualAsset(undefined, fallback)).toBe(fallback);
    expect(resolveVisualAsset('missing', fallback)).toBe(fallback);
  });

  it('rejects a descriptor mapped to the wrong category', () => {
    const fallback = visualAssetRegistry['visual-hands-baton']!;
    expect(resolveVisualAssetByCategory('case-round-40mm-v1', 'hands', fallback)).toBe(fallback);
  });
});
