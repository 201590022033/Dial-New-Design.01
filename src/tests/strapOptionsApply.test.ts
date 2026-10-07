import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { getArchetypeVisualProfile, RENDER_GALLERY_ARCHETYPES } from '@/domain/configurator/archetypeProfiles';
import { deserializeWatchAssembly, serializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

describe('strap styles and direct option Apply', () => {
  it.each(RENDER_GALLERY_ARCHETYPES)('preserves $label default strap colours after switching away, back and reloading', ({ id }) => {
    const profile = getArchetypeVisualProfile(id)!;
    const assembly = createDefaultWatchAssembly();
    assembly.designConfig!.visualReferenceConfig = { archetypeId: id, strapStyleId: profile.strapStyleId };
    const before = watchAssemblyToVisualModel(assembly);
    expect(before.archetypeAppearance.strapColor).toBe(profile.strapColor);
    expect(before.finishes.strap.color).toBe(profile.strapColor);
    assembly.designConfig!.visualReferenceConfig.strapStyleId = profile.strapStyleId === 'rubber' ? 'leather' : 'rubber';
    expect(watchAssemblyToVisualModel(assembly).finishes.strap.color).not.toBe(profile.strapColor);
    assembly.designConfig!.visualReferenceConfig.strapStyleId = profile.strapStyleId;
    const restored = watchAssemblyToVisualModel(deserializeWatchAssembly(serializeWatchAssembly(assembly)));
    expect(restored.archetypeAppearance.strapColor).toBe(profile.strapColor);
    expect(restored.finishes.strap.color).toBe(profile.strapColor);
    expect(restored.assets.strap.assetId).toBe(before.assets.strap.assetId);
  });
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
