import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReferenceSlideRulePanel } from '@/components/configurator/ReferenceSlideRulePanel';
import { AviationSlideRulePanel } from '@/components/configurator/AviationSlideRulePanel';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { createBand } from '@/domain/bands/bandRegistry';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { getScaleProgram } from '@/domain/scales/scalePrograms';
import { useBandsStore } from '@/stores/bandsStore';
import { useScaleStore } from '@/stores/scaleStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';

describe('scale inspector authoritative physical target dimensions', () => {
  beforeEach(() => {
    vi.stubGlobal('React', React);
    vi.spyOn(React, 'useSyncExternalStore').mockImplementation((_subscribe, getSnapshot) => getSnapshot());
    useWatchAssemblyStore.getState().setAssembly(createDefaultWatchAssembly());
    useScaleStore.setState({ selectedScaleKind: 'slide-rule', previewEnabled: true, activeArchetypeId: undefined,
      pluginConfig: { ...getScalePlugin('slide-rule')!.defaultConfig, ...getScaleProgram('aviation', []).config,
        referenceDesign: 'citizen', placementTargetBandId: 'band-outer-bezel', fixedPlacementTargetBandId: 'band-chapter-ring' } });
    // Legacy geometry can be recalculated from old master defaults independently.
    // A deliberately divergent snapshot must never supply physical-target labels.
    useBandsStore.setState({ bands: [createBand('band-outer-bezel', 'outer-bezel', { innerRadius: 48, outerRadius: 49 }),
      createBand('band-chapter-ring', 'chapter-ring', { innerRadius: 46, outerRadius: 47 }),
      createBand('legacy-only-ring', 'inner-bezel', { innerRadius: 44, outerRadius: 45 })] });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('lists only assembly-resolved target diameters, never legacy master projections', () => {
    const physical = assemblyToBands(useWatchAssemblyStore.getState().assembly);
    const markup = renderToStaticMarkup(createElement(ReferenceSlideRulePanel));
    for (const band of physical) expect(markup).toContain(`Ø${(band.geometry.outerRadius * 2).toFixed(2)} mm`);
    expect(markup).not.toContain('Ø98.00 mm');
    expect(markup).not.toContain('legacy-only-ring');
  });
  it('refreshes dropdown dimensions when the authoritative component changes', () => {
    const assembly = structuredClone(useWatchAssemblyStore.getState().assembly);
    assembly.parts['inst-rotating-bezel']!.dimensions.diameterMm = 36;
    useWatchAssemblyStore.getState().setAssembly(assembly);
    const physical = assemblyToBands(assembly).find((band) => band.id === 'band-outer-bezel')!;
    const markup = renderToStaticMarkup(createElement(ReferenceSlideRulePanel));
    expect(markup).toContain(`Ø${(physical.geometry.outerRadius * 2).toFixed(2)} mm`);
    expect(markup).not.toContain('Ø98.00 mm');
  });
  it('distinguishes Simplified print positions from current physical part diameters', () => {
    useScaleStore.setState({ pluginConfig: { ...useScaleStore.getState().pluginConfig, referenceDesign: 'simplified' } });
    const physical = assemblyToBands(useWatchAssemblyStore.getState().assembly);
    const outer = physical.find((band) => band.id === 'band-outer-bezel')!, inner = physical.find((band) => band.id === 'band-chapter-ring')!;
    const markup = renderToStaticMarkup(createElement(AviationSlideRulePanel));
    expect(markup).toContain(`Physical rotating target: Ø${(outer.geometry.outerRadius * 2).toFixed(2)} mm`);
    expect(markup).toContain(`Fixed target: Ø${(inner.geometry.outerRadius * 2).toFixed(2)} mm`);
    expect(markup).toContain('Outer print radius');
    expect(markup).not.toContain('Ø98.00 mm');
  });
});
