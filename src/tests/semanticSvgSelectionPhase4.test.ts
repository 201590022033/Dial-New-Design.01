import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import {
  resolveCanvasHit,
  resolveSemanticElement,
  SELECTION_PRIORITY_ORDER
} from '@/renderer/services/canvasHitResolver';
import { useSelectionStore } from '@/stores/selectionStore';
import { useBandsStore } from '@/stores/bandsStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import type { CanvasHitResult } from '@/renderer/types';

describe('Phase 4: Semantic SVG Rendering & Deterministic Direct-Selection', () => {
  it('1. Priority hierarchy: hands > complications > indices > typography > dial > rings > case > crystal', () => {
    expect(SELECTION_PRIORITY_ORDER).toEqual([
      'hands',
      'complications',
      'indices',
      'typography',
      'dial',
      'rings',
      'case',
      'crystal'
    ]);
  });

  it('2. Geometric projection hit resolution: resolves hands at highest priority', () => {
    const assembly = createDefaultWatchAssembly();
    const viewport = {
      centerX: 250,
      centerY: 250,
      panX: 0,
      panY: 0,
      zoom: 1,
      fitScale: 1
    };

    // Hour hand tip is at angle ~305 deg (10:10 presentation)
    // 305 deg: x = cos(305°)*10mm*10px/mm = +5.73*10 = +57.3px, y = sin(305°)*100 = -81.9px
    const hourHandScreenX = 250 + 57;
    const hourHandScreenY = 250 - 82;

    const hit = resolveCanvasHit(null, hourHandScreenX, hourHandScreenY, assembly, viewport, {
      crystalSelectionMode: false
    });

    expect(hit).not.toBeNull();
    expect(hit?.category).toBe('hands');
    expect(hit?.partInstanceId).toBe('inst-hour-hand');
    expect(hit?.interactionRole).toBe('physical-part');
  });

  it('3. Geometric projection hit resolution: resolves date aperture complication at 3 o clock', () => {
    const assembly = createDefaultWatchAssembly();
    const viewport = {
      centerX: 250,
      centerY: 250,
      panX: 0,
      panY: 0,
      zoom: 1,
      fitScale: 1
    };

    // Date window is at x = centerX + 10.5mm * 10px/mm = 250 + 105 = 355px, y = 250
    const hit = resolveCanvasHit(null, 355, 250, assembly, viewport, {
      crystalSelectionMode: false
    });

    expect(hit).not.toBeNull();
    expect(hit?.category).toBe('complications');
    expect(hit?.partInstanceId).toBe('inst-date-window');
    expect(hit?.subElementId).toBe('date-window');
  });

  it('4. Crystal pass-through: clicking in the dial face area hits the dial, NOT the crystal by default', () => {
    const assembly = createDefaultWatchAssembly();
    const viewport = {
      centerX: 250,
      centerY: 250,
      panX: 0,
      panY: 0,
      zoom: 1,
      fitScale: 1
    };

    // Point in open dial surface (e.g. radius ~6mm, angle 180° -> x = 250 - 60 = 190, y = 250)
    // In default crystalSelectionMode = false, crystal must NOT intercept
    const hit = resolveCanvasHit(null, 190, 250, assembly, viewport, {
      crystalSelectionMode: false
    });

    expect(hit).not.toBeNull();
    expect(hit?.category).toBe('dial');
    expect(hit?.partInstanceId).toBe('inst-dial-blank');
    expect(hit?.category).not.toBe('crystal');
  });

  it('5. Crystal direct selection: when crystalSelectionMode = true, crystal can be selected', () => {
    const assembly = createDefaultWatchAssembly();
    const viewport = {
      centerX: 250,
      centerY: 250,
      panX: 0,
      panY: 0,
      zoom: 1,
      fitScale: 1
    };

    // Point in open dial surface, but with crystalSelectionMode = true
    const hit = resolveCanvasHit(null, 190, 250, assembly, viewport, {
      crystalSelectionMode: true
    });

    expect(hit).not.toBeNull();
    expect(hit?.category).toBe('crystal');
    expect(hit?.partInstanceId).toBe('inst-crystal');
  });

  it('6. DOM-based semantic attribute resolution: extracts metadata faithfully', () => {
    const attrs: Record<string, string> = {
      'data-part-instance-id': 'inst-applied-indices',
      'data-catalogue-item-id': 'cat-applied-indices',
      'data-part-category': 'indices',
      'data-interaction-role': 'content-group',
      'data-sub-element-id': 'hour-marker-set',
      'data-sub-element-kind': 'indices',
      'data-z-layer': '400',
      'data-band-id': 'band-dial-face',
      'data-label': 'Hour Markers'
    };

    const mockGroup = {
      getAttribute: (name: string) => attrs[name] ?? null,
      closest: () => mockGroup
    };

    const mockChild = {
      getAttribute: () => 'rendering-primitive',
      closest: () => mockGroup
    };

    const hit = resolveSemanticElement(mockChild as unknown as Element);
    expect(hit).not.toBeNull();
    expect(hit?.partInstanceId).toBe('inst-applied-indices');
    expect(hit?.catalogueItemId).toBe('cat-applied-indices');
    expect(hit?.category).toBe('indices');
    expect(hit?.interactionRole).toBe('content-group');
    expect(hit?.subElementId).toBe('hour-marker-set');
    expect(hit?.zLayer).toBe(400);
    expect(hit?.bandId).toBe('band-dial-face');
    expect(hit?.label).toBe('Hour Markers');
  });

  it('7. Non-destructive selection: selecting a hit never mutates component styles, materials, or geometry', () => {
    const bandsStore = useBandsStore.getState();
    const assemblyStore = useWatchAssemblyStore.getState();

    // Snapshot initial styles & geometry
    const initialBandsSnapshot = JSON.stringify(bandsStore.bands);
    const initialAssemblySnapshot = JSON.stringify(assemblyStore.assembly);

    // Perform semantic selection
    const hitResult: CanvasHitResult = {
      partInstanceId: 'inst-rotating-bezel',
      catalogueItemId: 'cat-rotating-bezel',
      category: 'rings',
      interactionRole: 'physical-part',
      subElementId: 'bezel-body',
      subElementKind: 'bezel',
      zLayer: 150,
      bandId: 'band-outer-bezel',
      label: 'Rotating Bezel'
    };

    useSelectionStore.getState().selectHit(hitResult);

    // Verify selection store has recorded the selection
    expect(useSelectionStore.getState().selectedHit).toEqual(hitResult);
    expect(useSelectionStore.getState().selectedBandId).toBe('band-outer-bezel');
    expect(useSelectionStore.getState().selectedComponentId).toBe('inst-rotating-bezel');

    // Verify bandsStore is UNCHANGED (fill, stroke, geometry unaltered)
    expect(JSON.stringify(useBandsStore.getState().bands)).toBe(initialBandsSnapshot);

    // Verify watchAssembly is UNCHANGED
    expect(JSON.stringify(useWatchAssemblyStore.getState().assembly)).toBe(initialAssemblySnapshot);

    // Clean up
    useSelectionStore.getState().clearSelection();
    expect(useSelectionStore.getState().selectedHit).toBeNull();
  });

  it('8. Concentric rings selection: resolves chapter ring, inner bezel, and outer bezel by radius', () => {
    const assembly = createDefaultWatchAssembly();
    const viewport = {
      centerX: 250,
      centerY: 250,
      panX: 0,
      panY: 0,
      zoom: 1,
      fitScale: 1
    };

    // Chapter ring is around radius 15.0mm (150px) at top (y = 250 - 150 = 100)
    const chapterHit = resolveCanvasHit(null, 250, 100, assembly, viewport);
    expect(chapterHit).not.toBeNull();
    expect(chapterHit?.partInstanceId).toBe('inst-chapter-ring');
    expect(chapterHit?.category).toBe('rings');

    // Outer bezel is around radius 19.2mm (192px) at top (y = 250 - 192 = 58)
    const bezelHit = resolveCanvasHit(null, 250, 58, assembly, viewport);
    expect(bezelHit).not.toBeNull();
    expect(bezelHit?.partInstanceId).toBe('inst-rotating-bezel');
    expect(bezelHit?.category).toBe('rings');

    // Case perimeter is at radius 20.5mm (205px) at top (y = 250 - 205 = 45)
    const caseHit = resolveCanvasHit(null, 250, 45, assembly, viewport);
    expect(caseHit).not.toBeNull();
    expect(caseHit?.partInstanceId).toBe('inst-caseback');
    expect(caseHit?.category).toBe('case');
  });
});
