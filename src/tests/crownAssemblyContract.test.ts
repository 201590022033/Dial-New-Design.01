import { describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
});
import { applyReference42Preview } from '@/domain/presets/reference3d';
import { hydrateRuntimeProject } from '@/services/runtimeProjectHydrationService';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { deserializeWatchAssembly, exportAssemblyToLegacyProject, serializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { assertAssemblyCrownContracts } from '@/domain/assembly/crownAssemblyValidation';
import { migrateLegacyCrown, unknownCrownEvidence, type CrownAxisDatumV1, type EvidenceValue } from '@/domain/crown';
import { resolveAssemblyAnchors } from '@/visual3d/assemblyAnchors';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { deserializeDialProject, serializeDialProject } from '@/services/projectFileService';

const known = <T>(value: T): EvidenceValue<T> => ({ status: 'known', value, evidence: { kind: 'visual-approximation', source: 'Integration fixture; no physical fit assertion' } });
const axis = (): CrownAxisDatumV1 => ({ schema: 'crown-axis/v1', axisId: 'crown-main', clockwiseFrom3hDeg: known(30), interfaceRadiusMm: known(22), stemHeightMm: known(1.2) });
const fixture = () => {
  const assembly = createDefaultWatchAssembly();
  const casePart = assembly.parts['inst-midcase']!;
  const crown = assembly.parts['inst-crown']!;
  casePart.crownAxes = [axis()];
  crown.crownSpecification = migrateLegacyCrown(crown).specification;
  return assembly;
};

describe('C1 assembly crown integration', () => {
  it('round trips unknown interfaces, both finish modes, IDs and inactive legacy placement', () => {
    const assembly = fixture();
    assembly.parts['inst-midcase']!.customProperties = { visualCrownAngleDeg: 170, supplierSku: 'unchanged' };
    assembly.designConfig = { assemblyAnchors: { 'crown-interface': { positionMm: [99, 98, 97], rotationRad: [0, 0, 2], provenance: { status: 'specified', source: 'Old authored anchor' } } }, crownChoice: { schema: 'crown-choice/v1', selected: { crownInstanceId: 'inst-crown', source: 'explicit-user' } } };
    for (const finish of [{ mode: 'inherit-case' }, { mode: 'override', material: 'steel', color: '#fff', texture: 'polished' }] as const) {
      assembly.parts['inst-crown']!.crownSpecification!.finish = finish;
      expect(deserializeWatchAssembly(serializeWatchAssembly(assembly))).toEqual(assembly);
      const project = { ...exportAssemblyToLegacyProject(assembly), assembly };
      expect(deserializeDialProject(serializeDialProject(project)).assembly).toEqual(assembly);
    }
  });

  it('uses clockwise Engineering coordinates over saved anchors, angle and tube endpoint', () => {
    const assembly = applyReference42Preview(fixture());
    const params = assembly.parts['inst-midcase']!.parametricGeometry;
    if (params?.schema !== 'parametric-case/v1') throw new Error('Missing reference case fixture');
    assembly.parts['inst-midcase']!.customProperties = { visualCrownAngleDeg: 150 };
    assembly.designConfig = { assemblyAnchors: { 'crown-interface': { positionMm: [99, 99, 99], rotationRad: [0, 0, 2], provenance: { status: 'specified', source: 'Legacy' } } } };
    const anchor = resolveAssemblyAnchors(assembly, params)['crown-interface'];
    expect(anchor.positionMm[0]).toBeCloseTo(22 * Math.cos(Math.PI / 6));
    expect(anchor.positionMm[1]).toBeCloseTo(-11);
    expect(anchor.positionMm[2]).toBe(1.2);
    expect(anchor.rotationRad[2]).toBeCloseTo(-Math.PI / 6);
    expect(assembly.designConfig.assemblyAnchors!['crown-interface']!.positionMm).toEqual([99, 99, 99]);
  });

  it('preserves the old tube-over-angle and saved-anchor-over-tube precedence', () => {
    const assembly = applyReference42Preview(createDefaultWatchAssembly());
    const params = assembly.parts['inst-midcase']!.parametricGeometry;
    if (params?.schema !== 'parametric-case/v1') throw new Error('Missing reference case fixture');
    assembly.parts['inst-midcase']!.customProperties = { visualCrownAngleDeg: -90 };
    const tube = resolveAssemblyAnchors(assembly, params)['crown-interface'];
    expect(tube.positionMm[1]).toBe(0);
    expect(tube.positionMm[0]).toBeGreaterThan(0);
    assembly.designConfig = { ...assembly.designConfig, assemblyAnchors: { 'crown-interface': { positionMm: [9, 8, 7], rotationRad: [0, 0, 1], provenance: { status: 'specified', source: 'Saved anchor' } } } };
    expect(resolveAssemblyAnchors(assembly, params)['crown-interface'].positionMm).toEqual([9, 8, 7]);
  });

  it('hydrates unknown canonical fields and rejects invalid embedded axes before store mutation', () => {
    const assembly = fixture();
    const project = { ...exportAssemblyToLegacyProject(assembly), assembly };
    hydrateRuntimeProject(deserializeDialProject(serializeDialProject(project)));
    expect(useWatchAssemblyStore.getState().assembly.parts).toEqual(assembly.parts);
    const before = useWatchAssemblyStore.getState().assembly;
    assembly.parts['inst-midcase']!.crownAxes![0]!.clockwiseFrom3hDeg = known(360);
    expect(() => serializeDialProject(project)).toThrow();
    expect(() => deserializeDialProject(JSON.stringify(project))).toThrow();
    expect(() => hydrateRuntimeProject(project)).toThrow();
    expect(useWatchAssemblyStore.getState().assembly).toBe(before);
  });

  it('does not fall back to legacy placement when the authored axis is unknown', () => {
    const assembly = fixture();
    assembly.parts['inst-midcase']!.crownAxes![0]!.clockwiseFrom3hDeg = unknownCrownEvidence('Exact supplier angle unestablished');
    assembly.parts['inst-midcase']!.customProperties = { visualCrownAngleDeg: 0 };
    expect(resolveAssemblyAnchors(assembly)['crown-interface'].positionMm).toEqual([0, 0, 0]);
    expect(watchAssemblyToVisualModel(assembly).crown.axisStatus).toBe('unknown');
    expect(watchAssemblyToVisualModel(assembly).visible.crown).toBe(false);
    expect(() => serializeWatchAssembly(assembly)).not.toThrow();
  });

  it('leaves old documents opt-out and preserves their saved anchor', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.designConfig = { assemblyAnchors: { 'crown-interface': { positionMm: [23, -2, 1], rotationRad: [0, 0, -0.1], provenance: { status: 'specified', source: 'Saved legacy' } } } };
    const loaded = deserializeWatchAssembly(serializeWatchAssembly(assembly));
    expect(loaded).toEqual(assembly);
    expect(loaded.parts['inst-crown']!.crownSpecification).toBeUndefined();
    expect(resolveAssemblyAnchors(loaded)['crown-interface']).toEqual(assembly.designConfig.assemblyAnchors!['crown-interface']);
  });

  it('rejects duplicate case axes and missing references through both serialization boundaries', () => {
    const assembly = fixture();
    assembly.parts['inst-midcase']!.crownAxes!.push(axis());
    expect(() => serializeWatchAssembly(assembly)).toThrow(/Duplicate crown axis/);
    expect(() => deserializeWatchAssembly(JSON.stringify(assembly))).toThrow(/Duplicate crown axis/);
    assembly.parts['inst-midcase']!.crownAxes!.pop();
    assembly.parts['inst-crown']!.crownSpecification!.axisId = 'foreign';
    expect(() => assertAssemblyCrownContracts(assembly)).toThrow(/missing case axis/);
  });

  it('rejects two operating heads even when the second is hidden', () => {
    const assembly = fixture();
    assembly.parts['second-crown'] = { ...structuredClone(assembly.parts['inst-crown']!), instanceId: 'second-crown', visible: false };
    expect(() => serializeWatchAssembly(assembly)).toThrow(/Multiple operating crown heads/);
  });

  it.each(['visual-bound', 'legacy-unqualified'])('rejects a hidden %s duplicate on an authored axis', (kind) => {
    const assembly = fixture();
    const second = { ...structuredClone(assembly.parts['inst-crown']!), instanceId: 'second-crown', visible: false };
    delete second.crownSpecification;
    if (kind === 'visual-bound') second.visual = { category: 'crown', crownAxisId: 'crown-main' };
    assembly.parts['second-crown'] = second;
    expect(() => serializeWatchAssembly(assembly)).toThrow(/Multiple operating crown heads/);
  });

  it('preserves a legacy visual transform in storage while disabling it for modern placement', () => {
    const assembly = fixture();
    assembly.parts['inst-crown']!.visual = { category: 'crown', transform: { offsetMm: [90, 80, 70], rotationRad: [0, 0, 2] } };
    const loaded = deserializeWatchAssembly(serializeWatchAssembly(assembly));
    expect(loaded.parts['inst-crown']!.visual).toEqual(assembly.parts['inst-crown']!.visual);
    expect(watchAssemblyToVisualModel(loaded).transforms.crown).toBeUndefined();
  });

  it('rejects axes on a crown, a specification on a case and a non-crown saved choice', () => {
    const assembly = fixture();
    assembly.parts['inst-crown']!.crownAxes = [axis()];
    expect(() => assertAssemblyCrownContracts(assembly)).toThrow(/axes must belong to a case/);
    delete assembly.parts['inst-crown']!.crownAxes;
    assembly.parts['inst-midcase']!.crownSpecification = assembly.parts['inst-crown']!.crownSpecification;
    expect(() => assertAssemblyCrownContracts(assembly)).toThrow(/specification must belong/);
    delete assembly.parts['inst-midcase']!.crownSpecification;
    assembly.designConfig = { crownChoice: { schema: 'crown-choice/v1', selected: { crownInstanceId: 'inst-midcase', source: 'explicit-user' } } };
    expect(() => assertAssemblyCrownContracts(assembly)).toThrow(/non-crown/);
  });

  it('rejects visual categories that contradict canonical ownership', () => {
    const assembly = fixture();
    assembly.parts['inst-midcase']!.visual = { category: 'crown' };
    expect(() => serializeWatchAssembly(assembly)).toThrow(/conflict with visual/);
    delete assembly.parts['inst-midcase']!.visual;
    assembly.parts['inst-crown']!.visual = { category: 'case' };
    expect(() => serializeWatchAssembly(assembly)).toThrow(/conflicts with visual/);
  });

  it('preserves multiple axes without partially rendering a single crown slot', () => {
    const assembly = fixture();
    assembly.parts['inst-midcase']!.crownAxes!.push({ ...axis(), axisId: 'crown-secondary', clockwiseFrom3hDeg: known(90) });
    const second = structuredClone(assembly.parts['inst-crown']!);
    second.instanceId = 'second-crown';
    second.crownSpecification!.axisId = 'crown-secondary';
    assembly.parts[second.instanceId] = second;
    const loaded = deserializeWatchAssembly(serializeWatchAssembly(assembly));
    expect(loaded).toEqual(assembly);
    expect(watchAssemblyToVisualModel(loaded).visible.crown).toBe(false);
    expect(watchAssemblyToVisualModel(loaded).crown.axisStatus).toBe('unknown');
    delete second.crownSpecification;
    expect(() => serializeWatchAssembly(assembly)).toThrow(/explicit axis/);
  });
});
