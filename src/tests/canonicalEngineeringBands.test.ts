import { describe, expect, it } from 'vitest';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useBandsStore } from '@/stores/bandsStore';
import { useDesignEngineStore } from '@/stores/designEngineStore';
import { defaultGeometryParameters } from '@/domain/geometry/geometryEngine';
import { resolveAssemblyGeometry } from '@/domain/geometry/boundaryResolver';

describe('canonical Engineering component projection', () => {
  for (const archetype of ['pilot', 'ladies-dress', 'diver'] as const) {
    it(`${archetype}: validation cannot replace purchased component geometry with legacy default widths`, () => {
      const assembly = createStarterBuild(archetype).assembly;
      useWatchAssemblyStore.getState().setAssembly(assembly);
      const canonical = assemblyToBands(assembly);
      const expected = canonical.map(band => ({ id: band.id, geometry: band.geometry }));
      useBandsStore.getState().setBandsSnapshot(canonical);
      // Deliberately stale legacy globals previously enlarged/rechained the dial.
      const stale = { ...defaultGeometryParameters, caseDiameterMm: assembly.globalDimensions.caseDiameterMm,
        dialDiameterMm: 38, chapterRingWidthMm: 1.6, innerBezelWidthMm: 1.2, outerBezelWidthMm: 1.5 };
      const physicalParts = JSON.stringify(assembly.parts);
      for (let i = 0; i < 3; i++) useBandsStore.getState().syncWithGeometryEngine(stale);
      const actual = useBandsStore.getState().bands;
      expect(actual.map(band => ({ id: band.id, geometry: band.geometry }))).toEqual(expected);
      expect(actual.find(band => band.kind === 'dial-face')!.outerDiameterMm)
        .toBe(resolveAssemblyGeometry(assembly).contentSlots['dial-face-slot']!.outerRadiusMm * 2);
      expect(actual.find(band => band.kind === 'dial-face')!.outerDiameterMm)
        .toBeLessThanOrEqual(assembly.parts['inst-dial-blank']!.dimensions.diameterMm);
      expect(JSON.stringify(useWatchAssemblyStore.getState().assembly.parts)).toBe(physicalParts);
    });
    it(`${archetype}: authored hour marker inset survives canonical assembly synchronization`, () => {
      const assembly = createStarterBuild(archetype).assembly;
      const marker = assembly.designConfig!.markerConfig!;
      const dialRadius = assembly.parts['inst-dial-blank']!.dimensions.diameterMm / 2;
      useDesignEngineStore.setState({ markerConfig: { ...marker } });
      const bands = assemblyToBands(assembly);
      const visibleDialRadius = bands.find(band => band.kind === 'dial-face')!.geometry.outerRadius;
      useDesignEngineStore.getState().syncFromAssembly(bands);
      const actual = useDesignEngineStore.getState().markerConfig;
      expect(actual.radiusOuterMm).toBe(Math.min(marker.radiusOuterMm, visibleDialRadius));
      expect(actual.radiusOuterMm - actual.radiusInnerMm).toBeCloseTo(marker.radiusOuterMm - marker.radiusInnerMm);
      if (marker.radiusOuterMm <= visibleDialRadius) expect(actual.radiusInnerMm).toBe(marker.radiusInnerMm);
      expect(actual.radiusOuterMm).toBeLessThanOrEqual(dialRadius);
      expect(actual.radiusInnerMm).toBeGreaterThanOrEqual(0);
      useDesignEngineStore.getState().syncFromAssembly(bands);
      expect(useDesignEngineStore.getState().markerConfig).toEqual(actual);
    });
  }
  it('projects physical component visibility, locks and colours rather than default band styling', () => {
    const assembly = createStarterBuild('pilot').assembly;
    assembly.parts['inst-chapter-ring'] = { ...assembly.parts['inst-chapter-ring']!, visible: false, locked: true, color: '#123456' };
    const band = assemblyToBands(assembly).find(band => band.kind === 'chapter-ring')!;
    expect(band).toMatchObject({ visible: false, locked: true, color: '#123456', style: { fill: '#123456' } });
  });
});
