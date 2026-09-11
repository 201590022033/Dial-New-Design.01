import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

const withHand = (assembly: ReturnType<typeof createDefaultWatchAssembly>, patch: Record<string, unknown>) => {
  const next = structuredClone(assembly);
  const hand = next.parts['inst-hour-hand']!;
  hand.customProperties = { ...hand.customProperties, ...patch };
  return next;
};

describe('WatchAssembly visual adapter', () => {
  it('maps committed case dimensions', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.globalDimensions.caseDiameterMm = 42;
    expect(watchAssemblyToVisualModel(assembly).caseDiameterMm).toBe(42);
  });

  it('maps data-driven baton and Mercedes hand styles', () => {
    const assembly = createDefaultWatchAssembly();
    expect(watchAssemblyToVisualModel(assembly).hands.style).toBe('baton');
    expect(watchAssemblyToVisualModel(withHand(assembly, { visualHandStyle: 'mercedes' })).hands.style).toBe('mercedes');
  });

  it.each([
    ['brushed', 'brushed-steel'],
    ['polished', 'polished-steel'],
    ['black PVD', 'black-pvd']
  ])('maps %s finish', (texture, expected) => {
    const assembly = createDefaultWatchAssembly();
    assembly.parts['inst-hour-hand']!.texture = texture;
    expect(watchAssemblyToVisualModel(assembly).hands.material).toBe(expected);
  });

  it('maps preview assemblies without mutating the committed assembly', () => {
    const committed = createDefaultWatchAssembly();
    const original = structuredClone(committed);
    const preview = withHand(committed, { visualHandStyle: 'mercedes' });
    expect(watchAssemblyToVisualModel(preview).hands.style).toBe('mercedes');
    expect(committed).toEqual(original);
  });

  it('uses safe procedural fallbacks for missing or unknown visual assets', () => {
    const assembly = createDefaultWatchAssembly();
    delete assembly.parts['inst-hour-hand']!.customProperties;
    const model = watchAssemblyToVisualModel(assembly);
    expect(model.assets.hands.assetType).toBe('procedural');
    expect(model.assets.case.assetType).toBe('procedural');
  });

  it('does not mutate WatchAssembly while adapting', () => {
    const assembly = createDefaultWatchAssembly();
    const before = JSON.stringify(assembly);
    watchAssemblyToVisualModel(assembly);
    expect(JSON.stringify(assembly)).toBe(before);
  });
});
