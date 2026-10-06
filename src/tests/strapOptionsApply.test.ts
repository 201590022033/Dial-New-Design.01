import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

describe('strap styles and direct option Apply', () => {
  it('updates small-case fallback materials, colors and style in both directions', () => {
    const assembly = createStarterBuild('ladies-dress', createDefaultWatchAssembly()).assembly;
    const colors = new Set<string>();
    for (const style of ['rubber', 'leather', 'canvas', 'racing', 'rubber'] as const) {
      assembly.designConfig!.visualReferenceConfig = { ...assembly.designConfig!.visualReferenceConfig, strapStyleId: style,
        componentAssetOverrides: { strap: 'archetype-strap-leather' } };
      const model = watchAssemblyToVisualModel(assembly);
      expect(model.archetypeAppearance.strapStyleId).toBe(style);
      expect(model.finishes.strap.color).toBe(model.archetypeAppearance.strapColor);
      expect(model.finishes.strap.metalness).toBeLessThan(.1);
      colors.add(model.finishes.strap.color);
    }
    expect(colors.size).toBe(4);
    assembly.globalDimensions.caseDiameterMm = 42;
    expect(watchAssemblyToVisualModel(assembly).assets.strap.assetId).toBe('archetype-strap-rubber');
  });
  it('wires double-click and Enter through the existing guarded Apply, not a stale hover', () => {
    const source = readFileSync('src/components/configurator/tray/OptionsTab.tsx', 'utf8');
    expect(source).toContain('onDoubleClick=');
    expect(source).toContain("event.key === 'Enter'");
    expect(source).toContain('applyCatalogueVisualSelection(current, activePartInstanceId, item)');
    expect(source).toContain('if (applyPreview())');
  });
});
