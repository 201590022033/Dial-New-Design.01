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

  it('wires marker geometry, movement subdials and date windows into the visual dial model', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.globalDimensions.caseDiameterMm = 42;
    assembly.metadata.movement = 'vk63';
    assembly.designConfig!.markerConfig = { ...assembly.designConfig!.markerConfig!, count: 24 };
    const model = watchAssemblyToVisualModel(assembly);
    expect(model.dial.markers).toHaveLength(24);
    expect(model.dial.subdials).toHaveLength(3);
    expect(model.dial.subdials.map((subdial) => [subdial.role, subdial.angleDeg])).toEqual([
      ['chronograph-minutes', 270], ['small-seconds', 180], ['24-hour', 90]
    ]);
    expect(model.dial.windows.some((window) => window.kind === 'date')).toBe(true);
  });

  it('switches the chronograph register-hand GLB without changing movement geometry', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.globalDimensions.caseDiameterMm = 42;
    assembly.metadata.movement = 'vk63';
    assembly.designConfig!.visualReferenceConfig = {
      archetypeId: 'archetype-chronograph',
      subdialHandStyle: 'syringe'
    };
    const model = watchAssemblyToVisualModel(assembly);
    expect(model.assets.hands.assetId).toBe('archetype-hands-chronograph-syringe');
    expect(model.dial.subdials.every((subdial) => subdial.handStyle === 'syringe')).toBe(true);
  });

  it('switches the complete 42 mm case GLB when a lug family is selected', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.globalDimensions.caseDiameterMm = 42;
    assembly.designConfig!.visualReferenceConfig = { lugStyleId: 'twisted' };
    expect(watchAssemblyToVisualModel(assembly).assets.case.assetId).toBe('lug-case-twisted');
  });

  it('maps configurable typography into the 3D dial artwork layer', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.designConfig!.typographyConfig = {
      ...assembly.designConfig!.typographyConfig!,
      content: 'CUSTOM 42',
      layout: 'arc',
      color: '#d8f2c7',
      fontSizeMm: 1.25,
      radiusMm: 9.5,
      angleStartDeg: -42,
      angleSpanDeg: 84
    };
    expect(watchAssemblyToVisualModel(assembly).dial.artwork).toMatchObject({
      content: 'CUSTOM 42', layout: 'arc', color: '#d8f2c7', fontSizeMm: 1.25,
      radiusMm: 9.5, angleStartDeg: -42, angleSpanDeg: 84
    });
  });

  it('binds the default dial GLB and exposes movement pushers for chronograph previews', () => {
    const assembly = createDefaultWatchAssembly();
    expect(watchAssemblyToVisualModel(assembly).assets.dial.assetId).toBe('dial-face-40mm-layout-v1');
    assembly.metadata.movement = 'vk63';
    const model = watchAssemblyToVisualModel(assembly);
    expect(model.pushers.count).toBe(2);
    expect(model.pushers.positionsDeg).toEqual([60, -60]);
    expect(model.visible.pushers).toBe(true);
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
