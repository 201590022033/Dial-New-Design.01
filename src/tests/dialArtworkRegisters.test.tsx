import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { DialArtwork, ProceduralComponent } from '@/visual3d/VisualWatchScene';
import { componentPlacement } from '@/visual3d/componentPlacement';
import { applyCatalogueVisualSelection, visualVariantCatalogueItems } from '@/domain/catalogue';
import { visualAssetRegistry } from '@/visual3d/visualAssetRegistry';

describe('chronograph dial artwork ownership', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it.each([42, 46])('does not add false register circles over the %imm dial', (diameter) => {
    const assembly = createStarterBuild('chronograph').assembly;
    assembly.globalDimensions.caseDiameterMm = diameter;
    const model = watchAssemblyToVisualModel(assembly);
    // An explicit substrate selection also uses the live artwork at 42mm.
    model.assets.dial = { assetId: 'visual-dial-default', category: 'dial', assetType: 'procedural' };
    const arc = vi.fn();
    const context = new Proxy({ arc }, { get: (target, key) => key === 'arc' ? target.arc : vi.fn() });
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => context }) });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      renderToStaticMarkup(<DialArtwork model={model} />);
      expect(arc).not.toHaveBeenCalled();
      expect(model.dial.subdials).toHaveLength(3);
      expect(model.dial.subdials.map(register => register.centerRadiusMm)).toEqual([7.5, 7.5, 7.5]);
    } finally { error.mockRestore(); }
  });

  it('places the 46mm pilot fallback hands above the dial and its artwork', () => {
    const assembly = createStarterBuild('pilot').assembly;
    assembly.globalDimensions.caseDiameterMm = 46;
    const model = watchAssemblyToVisualModel(assembly);
    const placement = componentPlacement(model, 'hands');
    const hands = ProceduralComponent({ category: 'hands', model }) as React.ReactElement<{ position: number[] }>;
    const worldZ = placement.anchor.positionMm[2] + hands.props.position[2]!;
    expect(placement.glb).toBe(false);
    expect(model.visible.hands).toBe(true);
    expect(placement.rotation).toEqual([0, 0, 0]);
    expect(worldZ - .075).toBeGreaterThan(model.previewEnvelope.dialZ + model.dial.thicknessMm / 2 + .34);
    expect(model.hands.hourLengthMm).toBeGreaterThan(0);
    expect(model.hands.minuteLengthMm).toBeGreaterThan(0);
  });

  it('keeps applied sword GLB hands above the raised 46mm fallback dial without resizing', () => {
    const sword = visualVariantCatalogueItems.find(item => item.id === 'cat-hands-sword-set')!;
    const assembly = applyCatalogueVisualSelection(createStarterBuild('pilot').assembly, 'inst-hour-hand', sword);
    const at42 = watchAssemblyToVisualModel(assembly);
    assembly.globalDimensions.caseDiameterMm = 46;
    const at46 = watchAssemblyToVisualModel(assembly);
    expect(at46.assets.dial.assetId).toBe('visual-dial-default');
    expect(at46.assets.hands.assetId).toBe('hands-sword-42');
    expect(at46.assets.hands.assetType).toBe('glb');
    expect(at46.assets.hands.scale).toEqual(at42.assets.hands.scale);
    expect(at46.hands).toEqual(at42.hands);
    expect(at46.assets.hands.offset![2] - at42.assets.hands.offset![2]).toBeCloseTo(at46.previewEnvelope.dialZ - at42.previewEnvelope.dialZ);
    expect(at46.assets.hands.offset![2]).toBeGreaterThan(at46.previewEnvelope.dialZ + at46.dial.thicknessMm / 2);
    expect(visualAssetRegistry['hands-sword-42']!.offset).toEqual([0, 0, 4.25]);
  });

  it('keeps hand placement in the authored dial frame for the NH05 supplier dial', () => {
    const assembly = createStarterBuild('ladies-dress').assembly;
    const sword = visualVariantCatalogueItems.find(item => item.id === 'cat-hands-sword-set')!;
    const selected = applyCatalogueVisualSelection(assembly, 'inst-hour-hand', sword);
    const model = watchAssemblyToVisualModel(selected);
    expect(model.assets.dial.assetType).toBe('glb');
    expect(model.assets.dial.offset![2]).toBe(3.7);
    expect(model.assets.hands.offset![2]).toBe(4.25);
    const original = watchAssemblyToVisualModel(assembly);
    expect(original.assets.hands.offset).toEqual(visualAssetRegistry[original.assets.hands.assetId]!.offset);
  });
});
