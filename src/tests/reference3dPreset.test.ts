import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { deserializeWatchAssembly, serializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { applyReference42Preview, REFERENCE_42_ID, useProceduralReference42 } from '@/domain/presets/reference3d';
import { assessReference3dFit } from '@/domain/geometry/parametric';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';

describe('P5 reviewed reference configuration', () => {
  it('selects one fixture-backed case/crown/hand set without mutating the source assembly', () => {
    const original = createDefaultWatchAssembly();
    const snapshot = structuredClone(original);
    const selected = applyReference42Preview(original);
    expect(original).toEqual(snapshot);
    expect(selected.designConfig?.visualReferenceId).toBe(REFERENCE_42_ID);
    expect(selected.globalDimensions.caseDiameterMm).toBe(42);
    expect(selected.parts['inst-midcase']!.parametricGeometry?.schema).toBe('parametric-case/v1');
    expect(selected.parts['inst-crown']!.parametricGeometry?.schema).toBe('parametric-crown/v1');
    expect(selected.parts['inst-hour-hand']!.parametricGeometry?.schema).toBe('parametric-hand-set/v1');
    expect(selected.parts['inst-midcase']!.parametricGeometry).toMatchObject({ midcaseHeight: 10.2, lugWidth: 22, lugToLug: 46, pusherCount: 0 });
    expect(selected.parts['inst-crown']!.parametricGeometry).toMatchObject({ headDiameterMm: 7, headLengthMm: 4.9 });
    expect(selected.parts['inst-hour-hand']!.parametricGeometry).toMatchObject({ hour: { hub: { pinionHoleDiameter: 1.5 } }, minute: { hub: { pinionHoleDiameter: 0.9 } }, seconds: { hub: { pinionHoleDiameter: 0.2 } } });
    expect(selected.parts['inst-hour-hand']!.geometryProvenance?.status).toBe('provisional');
    expect(selected.designConfig?.fitEvidence?.strapInterface?.status).toBe('provisional');
    expect(selected.designConfig?.fitEvidence?.movementHandBores?.status).toBe('specified');
    expect(selected.designConfig?.assemblyAnchors?.['crown-interface']?.positionMm).toEqual([21.8, 0, 0]);
    const visuals = watchAssemblyToVisualModel(selected);
    for (const category of ['case', 'crown', 'hands'] as const) {
      expect(visuals.assets[category].assetType).toBe('glb');
      expect(visuals.visible[category]).toBe(true);
    }
    expect(visuals.visible.dial).toBe(false);
    expect(visuals.visible.crystal).toBe(false);
    expect(selected.parts['inst-dial-blank']?.visible).toBe(true);
  });

  it('survives assembly serialization and an old document without a midcase', () => {
    const old = createDefaultWatchAssembly();
    delete old.parts['inst-midcase'];
    old.partOrder = old.partOrder.filter((id) => id !== 'inst-midcase');
    const selected = applyReference42Preview(old);
    expect(selected.partOrder.filter((id) => id === 'inst-midcase')).toHaveLength(1);
    expect(deserializeWatchAssembly(serializeWatchAssembly(selected))).toEqual(selected);
    expect(applyReference42Preview(selected).partOrder.filter((id) => id === 'inst-midcase')).toHaveLength(1);
  });

  it('falls back when the case size changes, and clears only this preview binding', () => {
    const selected = applyReference42Preview(createDefaultWatchAssembly());
    const resized = structuredClone(selected);
    resized.globalDimensions.caseDiameterMm = 44;
    expect(watchAssemblyToVisualModel(resized).assets.case.assetType).toBe('procedural');
    expect(watchAssemblyToVisualModel(resized).assets.crown.assetType).toBe('procedural');
    expect(watchAssemblyToVisualModel(resized).assets.hands.assetType).toBe('procedural');
    const altered = structuredClone(selected);
    if (altered.parts['inst-crown']!.parametricGeometry?.schema === 'parametric-crown/v1') {
      altered.parts['inst-crown']!.parametricGeometry.headLengthMm = 4;
    }
    expect(watchAssemblyToVisualModel(altered).assets.crown.assetType).toBe('procedural');
    const cleared = useProceduralReference42(selected);
    expect(cleared.designConfig?.visualReferenceId).toBeUndefined();
    expect(cleared.parts['inst-crown']!.parametricGeometry).toEqual(selected.parts['inst-crown']!.parametricGeometry);
    expect(watchAssemblyToVisualModel(cleared).assets.crown.assetType).toBe('procedural');
    expect(selected.parts['inst-crown']!.visual?.assetId).toBe('reference-42-crown-preview');
  });

  it('reports published nominal fit alignment and unresolved interfaces without a fit claim', () => {
    const selected = applyReference42Preview(createDefaultWatchAssembly());
    const issues = assessReference3dFit(selected);
    expect(issues.some((issue) => issue.code === 'CROWN_LUG_OVERLAP')).toBe(false);
    expect(issues.filter((issue) => issue.code === 'HAND_BORE_MISMATCH' && issue.status === 'conflict')).toHaveLength(0);
    expect(issues.some((issue) => issue.code === 'PUSHER_COUNT_MISMATCH' && issue.status === 'conflict')).toBe(false);
    expect(issues.some((issue) => issue.code === 'CROWN_ENGAGEMENT_UNKNOWN' && issue.status === 'unknown')).toBe(true);
    expect(issues.some((issue) => issue.code === 'STACK_CLEARANCE_UNKNOWN' && issue.status === 'unknown')).toBe(true);
    expect(issues.some((issue) => issue.code === 'STEM_INTERFACE_UNKNOWN' && issue.status === 'unknown')).toBe(true);
    expect(assessReference3dFit(createDefaultWatchAssembly())).toEqual([]);
  });

  it('does not change another preset when asked to clear the reference', () => {
    const other = createDefaultWatchAssembly();
    other.designConfig!.visualReferenceId = 'custom-project';
    expect(useProceduralReference42(other)).toBe(other);
  });

  it('offers the reference through the active assembly store and marks edits dirty', () => {
    useWatchAssemblyStore.getState().resetAssembly();
    try {
      useWatchAssemblyStore.getState().selectReference42Preview();
      expect(useWatchAssemblyStore.getState().assembly.designConfig?.visualReferenceId).toBe(REFERENCE_42_ID);
      expect(useWatchAssemblyStore.getState().dirty).toBe(true);
      useWatchAssemblyStore.getState().clearReference42Preview();
      expect(useWatchAssemblyStore.getState().assembly.designConfig?.visualReferenceId).toBeUndefined();
    } finally {
      useWatchAssemblyStore.getState().resetAssembly();
    }
  });
});
