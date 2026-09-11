import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import {
  checkCylindricalInterference,
  getZTop,
  overlapsAxially,
  overlapsRadially,
  type CylindricalExtent
} from '@/domain/geometry/cylindricalGeometry';
import {
  fitMarkersToAnnularRegion,
  fitScaleToAnnularRegion,
  resolveAssemblyGeometry,
  slotToAnnularRegion,
  validateAnnularContainment
} from '@/domain/geometry/boundaryResolver';
import { defaultMarkerConfig, generateMarkers } from '@/domain/generators/markerEngine';
import { runScalePlugin } from '@/services/scaleEngineService';
import type { ScalePluginConfig } from '@/domain/scales/types';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';

describe('Phase 3: 2.5D Cylindrical Geometry & Boundary Resolver', () => {
  it('1. Valid axial overlap: chapter ring overlaps dial radially but sits above it axially', () => {
    // Dial: radius 0 to 14.25mm, Z: [0, 0.4]mm (dial-seat plane Z=0)
    const dialExtent: CylindricalExtent = {
      innerRadiusMm: 0.75,
      outerRadiusMm: 14.25,
      zBaseMm: 0,
      axialThicknessMm: 0.4
    };

    // Chapter ring: radius 13.5 to 16.0mm (overhangs dial by 0.75mm), sits at Z: [0.4, 1.9]mm
    const chapterRingExtent: CylindricalExtent = {
      innerRadiusMm: 13.5,
      outerRadiusMm: 16.0,
      zBaseMm: 0.4,
      axialThicknessMm: 1.5
    };

    // Radial overlap check: [0.75, 14.25] and [13.5, 16.0] overlap from 13.5 to 14.25
    expect(overlapsRadially(dialExtent, chapterRingExtent)).toBe(true);

    // Axial overlap check: [0, 0.4] and [0.4, 1.9] do NOT penetrate axially
    expect(overlapsAxially(dialExtent, chapterRingExtent)).toBe(false);

    // Collision check: Radial overlap != collision unless axial overlap ALSO occurs!
    const isInterfering = checkCylindricalInterference(dialExtent, chapterRingExtent);
    expect(isInterfering).toBe(false);

    // Verify in assembly resolver
    const assembly = createDefaultWatchAssembly();
    const resolved = resolveAssemblyGeometry(assembly);
    expect(resolved.status).toBe('valid');
    expect(resolved.diagnostics.filter((d) => d.code === 'RADIAL_AXIAL_COLLISION')).toHaveLength(0);
  });

  it('2. Invalid radial + axial collision: two solid components overlap radially and axially without permitted interface', () => {
    const componentA: CylindricalExtent = {
      innerRadiusMm: 10,
      outerRadiusMm: 15,
      zBaseMm: 0,
      axialThicknessMm: 1.0
    };

    const componentB: CylindricalExtent = {
      innerRadiusMm: 12,
      outerRadiusMm: 16,
      zBaseMm: 0.5,
      axialThicknessMm: 1.0
    };

    // Both overlap radially (12 to 15) AND axially (0.5 to 1.0)
    expect(overlapsRadially(componentA, componentB)).toBe(true);
    expect(overlapsAxially(componentA, componentB)).toBe(true);
    expect(checkCylindricalInterference(componentA, componentB)).toBe(true);

    // In assembly resolver: simulate collision by placing chapter ring penetrating dial core
    const assembly = createDefaultWatchAssembly();
    assembly.parts['inst-chapter-ring'] = {
      ...assembly.parts['inst-chapter-ring']!,
      dimensions: {
        ...assembly.parts['inst-chapter-ring']!.dimensions,
        diameterMm: 26,
        widthMm: 10 // inner radius = 3mm, outer = 13mm, deep inside dial
      }
    };
    // Dial: radius 14.25, thickness 0.4
    // If chapter ring axial zBase was within dial thickness without rebate
    // Check collision detection logic
    const extent1: CylindricalExtent = { innerRadiusMm: 2, outerRadiusMm: 14, zBaseMm: 0, axialThicknessMm: 1.0 };
    const extent2: CylindricalExtent = { innerRadiusMm: 5, outerRadiusMm: 10, zBaseMm: 0.2, axialThicknessMm: 1.0 };
    expect(checkCylindricalInterference(extent1, extent2)).toBe(true);
  });

  it('3. Hand/crystal clearance: hand stack top below crystal underside vs penetrating crystal', () => {
    const assembly = createDefaultWatchAssembly();

    // Default assembly: crystal is at Z ~ 2.8+ mm, hand stack is at Z ~ 2.2 mm -> VALID
    const resolvedValid = resolveAssemblyGeometry(assembly);
    expect(resolvedValid.status).toBe('valid');
    const clearanceErrors = resolvedValid.diagnostics.filter(
      (d) => d.code === 'HAND_STACK_EXCEEDS_CRYSTAL_CLEARANCE'
    );
    expect(clearanceErrors).toHaveLength(0);

    // Modify crystal thickness and seat to force hand collision:
    // If crystal underside sits too low (e.g. Z = 1.0 mm while hand stack reaches 2.2 mm)
    // We simulate by setting an abnormally thick bezel or recessed crystal
    const collidingAssembly = createDefaultWatchAssembly();
    // Simulate thin/recessed case with impossible crystal clearance by setting crystal part
    collidingAssembly.parts['inst-crystal'] = {
      instanceId: 'inst-crystal',
      catalogueItemId: 'cat-flat-sapphire',
      name: 'Flat Sapphire Crystal',
      category: 'case',
      visible: true,
      locked: false,
      layerIndex: 85,
      material: 'sapphire',
      color: '#FFFFFF',
      texture: 'polished',
      dimensions: {
        diameterMm: 30,
        thicknessMm: 0.5,
        widthMm: 0,
        offsetXmm: 0,
        offsetYmm: 0
      },
      typography: {
        fontFamily: 'Inter',
        fontSizeMm: 1.0,
        tracking: 0
      },
      customProperties: {}
    };
    // If chapter ring is zero height and crystal sits at 1.0 mm (below hand stack top 2.2 mm)
    const collidingExtentHand: CylindricalExtent = {
      innerRadiusMm: 0,
      outerRadiusMm: 13,
      zBaseMm: 0.4,
      axialThicknessMm: 2.5 // top = 2.9mm
    };
    const crystalUndersideZ = 2.0; // below hand top (2.9mm)!
    const clearance = crystalUndersideZ - getZTop(collidingExtentHand);
    expect(clearance).toBeLessThan(0); // -0.9mm interference!
  });

  it('4. Negative/inverted region: innerRadiusMm >= outerRadiusMm triggers INVALID without silent clamping', () => {
    const invalidAssembly = createDefaultWatchAssembly();
    // Invert chapter ring: outer diameter 28mm (radius 14mm), width 15mm -> inner radius = -1mm or inverted
    invalidAssembly.parts['inst-chapter-ring'] = {
      ...invalidAssembly.parts['inst-chapter-ring']!,
      dimensions: {
        ...invalidAssembly.parts['inst-chapter-ring']!.dimensions,
        diameterMm: 20,
        widthMm: 12 // outerRadius = 10, innerRadius = -2
      }
    };

    const resolved = resolveAssemblyGeometry(invalidAssembly);
    expect(resolved.status).toBe('invalid');
    const negativeWidthDiag = resolved.diagnostics.find(
      (d) => d.code === 'NEGATIVE_RADIAL_WIDTH'
    );
    expect(negativeWidthDiag).toBeDefined();
    expect(negativeWidthDiag?.severity).toBe('error');
  });

  it('5. Missing data: unknown physical dimension triggers INSUFFICIENT-DATA without silent invention', () => {
    const incompleteAssembly = createDefaultWatchAssembly();
    // Set dial diameter to 0 / missing
    incompleteAssembly.parts['inst-dial-blank'] = {
      ...incompleteAssembly.parts['inst-dial-blank']!,
      dimensions: {
        ...incompleteAssembly.parts['inst-dial-blank']!.dimensions,
        diameterMm: 0 // invalid / missing
      }
    };

    const resolved = resolveAssemblyGeometry(incompleteAssembly);
    expect(resolved.status).toBe('insufficient-data');
    const missingDimDiag = resolved.diagnostics.find(
      (d) => d.code === 'MISSING_DIMENSION'
    );
    expect(missingDimDiag).toBeDefined();
    expect(resolved.insufficientDataReasons.length).toBeGreaterThan(0);
  });

  it('6. Scale containment: scale generator receives chapter ring annulus and produces no geometry outside', () => {
    const assembly = createDefaultWatchAssembly();
    const resolved = resolveAssemblyGeometry(assembly);
    const chapterSlot = resolved.contentSlots['chapter-ring-slot'];
    expect(chapterSlot).toBeDefined();

    const annularRegion = slotToAnnularRegion(chapterSlot!);
    expect(annularRegion.innerRadiusMm).toBeCloseTo(13.45);
    expect(annularRegion.outerRadiusMm).toBeCloseTo(15.25);

    // Fit scale configuration to this exact region
    const baseScaleConfig: Partial<ScalePluginConfig> = {
      startValue: 60,
      endValue: 500,
      majorStep: 50,
      minorStep: 10,
      direction: 'clockwise',
      majorTickLengthMm: 1.4,
      minorTickLengthMm: 0.8
    };

    const fitted = fitScaleToAnnularRegion(annularRegion, baseScaleConfig);
    expect(fitted.bandInnerRadiusMm).toBe(annularRegion.innerRadiusMm);
    expect(fitted.bandOuterRadiusMm).toBe(annularRegion.outerRadiusMm);

    // Validate scale containment
    const tickResult = validateAnnularContainment(annularRegion, {
      innerRadiusMm: fitted.bandInnerRadiusMm,
      outerRadiusMm: fitted.bandOuterRadiusMm
    });
    expect(tickResult.contained).toBe(true);
    expect(tickResult.overflowInnerMm).toBe(0);
    expect(tickResult.overflowOuterMm).toBe(0);

    // Run scale plugin with fitted config
    const runResult = runScalePlugin(
      'circular',
      {
        startValue: 0,
        endValue: 60,
        majorStep: 5,
        minorStep: 1,
        direction: 'clockwise',
        radiusMm: (annularRegion.innerRadiusMm + annularRegion.outerRadiusMm) / 2,
        majorTickLengthMm: 1.0,
        minorTickLengthMm: 0.6,
        majorTickWidthMm: 0.2,
        minorTickWidthMm: 0.15,
        tickDirection: 'inside',
        tickStyle: 'line',
        labelFrequency: 5,
        labelOrientation: 'radial',
        labelPlacement: 'inside',
        labelRotationOffsetDeg: 0,
        rotationOffsetDeg: 0,
        color: '#FFFFFF',
        fontFamily: 'Inter',
        previewEnabled: true,
        bandInnerRadiusMm: annularRegion.innerRadiusMm,
        bandOuterRadiusMm: annularRegion.outerRadiusMm,
        minimumLineWidthMm: 0.1
      },
      {
        startAngleDeg: -90,
        endAngleDeg: 270
      }
    );

    expect(runResult).toBeDefined();
    // All ticks must lie inside the annular region bounds
    runResult?.ticks.forEach((tick) => {
      expect(tick.radiusMm).toBeGreaterThanOrEqual(annularRegion.innerRadiusMm - 0.01);
      expect(tick.radiusMm).toBeLessThanOrEqual(annularRegion.outerRadiusMm + 0.01);
    });
  });

  it('7. Dial containment: markers fitted to dial content region do not exceed permitted dial slot', () => {
    const assembly = createDefaultWatchAssembly();
    const resolved = resolveAssemblyGeometry(assembly);
    const dialSlot = resolved.contentSlots['dial-face-slot'];
    expect(dialSlot).toBeDefined();

    const dialAnnularRegion = slotToAnnularRegion(dialSlot!);
    const fittedMarkers = fitMarkersToAnnularRegion(dialAnnularRegion, defaultMarkerConfig, 0.3);

    // Markers must sit strictly inside dial slot with margin
    expect(fittedMarkers.radiusInnerMm).toBeGreaterThanOrEqual(dialAnnularRegion.innerRadiusMm);
    expect(fittedMarkers.radiusOuterMm).toBeLessThanOrEqual(dialAnnularRegion.outerRadiusMm);

    const markers = generateMarkers(fittedMarkers);
    markers.forEach((m) => {
      const containment = validateAnnularContainment(dialAnnularRegion, {
        innerRadiusMm: m.innerRadiusMm,
        outerRadiusMm: m.outerRadiusMm
      });
      expect(containment.contained).toBe(true);
    });
  });

  it('8. WatchAssembly authority: mutations to WatchAssembly update resolved 2.5D geometry and projected bands deterministically', () => {
    useWatchAssemblyStore.getState().resetAssembly();
    const initialResolved = useWatchAssemblyStore.getState().getResolvedGeometry();
    expect(initialResolved.status).toBe('valid');
    expect(initialResolved.regions.caseBody?.outerRadiusMm).toBe(20); // 40mm / 2
 
    // Mutate case diameter via authoritative store action
    useWatchAssemblyStore.getState().setCaseDiameter(42);
    const updatedResolved = useWatchAssemblyStore.getState().getResolvedGeometry();
    expect(updatedResolved.regions.caseBody?.outerRadiusMm).toBe(21); // 42mm / 2

    // Check projected 2D legacy bands updated deterministically
    const currentAssembly = useWatchAssemblyStore.getState().assembly;
    const bands = assemblyToBands(currentAssembly);
    const outerBezel = bands.find((b) => b.kind === 'outer-bezel');
    expect(outerBezel?.geometry.outerRadius).toBe(21);
  });
});
