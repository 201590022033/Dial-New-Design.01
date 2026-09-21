import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Matrix4, Euler, Vector3 } from 'three';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { validateParametricCrownV1, type ParametricCrownV1, type ParametricCaseV1 } from '@/domain/geometry/parametric';
import { visualCategoryForPart, watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { visualAssetRegistry, resolveVisualAssetByCategory, visualCategories } from '@/visual3d/visualAssetRegistry';
import { caseCrownInterfacePosition, MM_TO_SCENE } from '@/visual3d/assemblyAnchors';
import { componentPlacement } from '@/visual3d/componentPlacement';

const crown = JSON.parse(readFileSync('tools/blender/test_crown_v1.json', 'utf8')) as ParametricCrownV1;
const caseParams = JSON.parse(readFileSync('tools/blender/test_case_42.json', 'utf8')) as ParametricCaseV1;

describe('P4 versioned crown contract', () => {
  it('retains provisional and unknown manufacturing provenance', () => {
    const result = validateParametricCrownV1(crown);
    expect(result.status).toBe('unknown');
    expect(result.unknownDimensions).toEqual(['stemThreadPitchMm']);
    expect(validateParametricCrownV1({ ...crown, stemThreadPitchMm: 0.5 }).status).toBe('valid');
  });
  it.each([null, {}, { ...crown, schema: 'parametric-case/v1' }, { ...crown, provenance: { source: 2 } },
    { ...crown, headDiameterMm: NaN }, { ...crown, socketDepthMm: 9 }, { ...crown, socketDiameterMm: 7 },
    { ...crown, headLengthMm: 0 }, { ...crown, gripCount: 1.5 }, { ...crown, gripCount: 257 },
    { ...crown, attachment: { anchor: 'watch-axis', axialGapMm: 0 } },
    { ...crown, attachment: { anchor: 'crown-interface', axialGapMm: -1 } }
  ])('rejects malformed or impossible parameters (%#)', (value) => {
    expect(validateParametricCrownV1(value).status).toBe('invalid');
  });
  it('keeps unknown attachment dimensions unresolved in the contract', () => {
    const value = { ...crown, attachment: { anchor: 'crown-interface', axialGapMm: { status: 'unknown' } } };
    expect(validateParametricCrownV1(value).unknownDimensions).toContain('attachment.axialGapMm');
  });
});

describe('P4 independent assembly components', () => {
  it('does not misclassify the case-side or unrelated external components', () => {
    const a = createDefaultWatchAssembly();
    expect(visualCategoryForPart(a.parts['inst-crown']!)).toBe('crown');
    expect(visualCategoryForPart(a.parts['inst-crystal']!)).toBe('crystal');
    expect(visualCategoryForPart(a.parts['inst-midcase']!)).toBe('case');
    expect(visualCategoryForPart(a.parts['inst-caseback']!)).toBe('caseback');
    expect(visualCategoryForPart(a.parts['inst-chapter-ring']!)).toBe('chapter-ring');
    expect(visualCategoryForPart(a.parts['inst-strap-integration']!)).toBe('strap');
    expect(visualCategoryForPart(a.parts['inst-lugs']!)).toBeUndefined();
    expect(visualCategoryForPart(a.parts['inst-pushers']!)).toBe('pushers');
    a.parts['inst-crown']!.name = 'My renamed part';
    expect(visualCategoryForPart(a.parts['inst-crown']!)).toBe('crown');
  });
  it('separates crown visibility and replacement from case geometry and assets', () => {
    const a = createDefaultWatchAssembly();
    a.parts['inst-midcase']!.parametricGeometry = caseParams;
    a.parts['inst-crown']!.parametricGeometry = crown;
    const before = structuredClone(a);
    const first = watchAssemblyToVisualModel(a);
    a.parts['inst-crown']!.visible = false;
    const second = watchAssemblyToVisualModel(a);
    expect(second.visible.crown).toBe(false);
    expect(second.assets.case).toEqual(first.assets.case);
    expect(second.visible.case).toBe(true);
    expect(a.parts['inst-midcase']).toEqual(before.parts['inst-midcase']);
    delete a.parts['inst-crown'];
    expect(watchAssemblyToVisualModel(a).visible.crown).toBe(false);
  });
  it('persists typed bindings, parameters and anchors without changing legacy serialization', () => {
    const a = createDefaultWatchAssembly();
    a.parts['inst-crown']!.visual = { category: 'crown', assetId: 'my-crown', transform: { offsetMm: [1, 2, 3] } };
    a.parts['inst-crown']!.parametricGeometry = crown;
    a.designConfig!.assemblyAnchors = { 'crown-interface': { positionMm: [20, 0, -1], rotationRad: [0, 0, 0.4], provenance: { status: 'provisional', source: 'test placement' } } };
    expect(deserializeWatchAssembly(serializeWatchAssembly(a))).toEqual(a);
    delete a.parts['inst-midcase']; // Existing saved documents still render.
    expect(watchAssemblyToVisualModel(a).assets.case.assetType).toBe('procedural');
  });
  it.each(visualCategories)('resolves registered %s GLBs and rejects wrong categories', (category) => {
    const a = createDefaultWatchAssembly();
    const part = Object.values(a.parts).find((p) => visualCategoryForPart(p) === category)!;
    const id = 'p4-' + category;
    visualAssetRegistry[id] = { assetId: id, category, assetType: 'glb', assetPath: '/' + id + '.glb' };
    try {
      part.visual = { category, assetId: id };
      expect(watchAssemblyToVisualModel(a).assets[category]).toBe(visualAssetRegistry[id]);
      part.visual.assetId = category === 'case' ? 'hands-mercedes-v1' : 'case-round-40mm-v1';
      expect(watchAssemblyToVisualModel(a).assets[category].assetType).toBe('procedural');
      visualAssetRegistry[id].assetPath = ' ';
      part.visual.assetId = id;
      expect(watchAssemblyToVisualModel(a).assets[category].assetType).toBe('procedural');
    } finally { delete visualAssetRegistry[id]; }
  });
  it('supports legacy hand asset selection and safe malformed descriptor fallback', () => {
    const a = createDefaultWatchAssembly();
    a.parts['inst-hour-hand']!.customProperties = { visualAssetId: 'hands-mercedes-v1' };
    expect(watchAssemblyToVisualModel(a).assets.hands.assetType).toBe('glb');
    visualAssetRegistry['bad'] = { assetId: 'bad', category: 'crown', assetType: 'glb', assetPath: '/bad.glb', scale: [NaN, 1, 1] };
    try { expect(resolveVisualAssetByCategory('bad', 'crown', visualAssetRegistry['visual-crown-default']!).assetType).toBe('procedural'); }
    finally { delete visualAssetRegistry['bad']; }
  });
});

describe('P4 engineering frames and transforms', () => {
  it('derives the tube endpoint from the unchanged case generator formula', () => {
    expect(caseCrownInterfacePosition(caseParams)).toEqual([21.8, 0, 0]);
    expect(caseCrownInterfacePosition({ ...caseParams, crownTubeLength: { status: 'unknown' } })).toBeUndefined();
  });
  it('composes a rotated crown interface with local attachment gap and transform', () => {
    const a = createDefaultWatchAssembly();
    a.parts['inst-midcase']!.parametricGeometry = caseParams;
    a.parts['inst-crown']!.parametricGeometry = { ...crown, attachment: { anchor: 'crown-interface', axialGapMm: 2 } };
    a.parts['inst-crown']!.visual = { category: 'crown', transform: { offsetMm: [1, 0, 0] } };
    a.designConfig!.assemblyAnchors = { 'crown-interface': { positionMm: [0, 21.8, 0], rotationRad: [0, 0, Math.PI / 2], provenance: { status: 'specified', source: 'test' } } };
    const placement = componentPlacement(watchAssemblyToVisualModel(a), 'crown');
    const world = new Vector3(...placement.offset).applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(...placement.anchor.rotationRad))).add(new Vector3(...placement.anchor.positionMm));
    expect(world.x).toBeCloseTo(0);
    expect(world.y).toBeCloseTo(24.8);
    expect(world.multiplyScalar(MM_TO_SCENE).y).toBeCloseTo(2.48);
  });
  it('marks unresolved seats/stacks provisional and ignores nonfinite transforms', () => {
    const a = createDefaultWatchAssembly();
    a.parts['inst-crown']!.visual = { category: 'crown', transform: { offsetMm: [NaN, 0, 0] } };
    const model = watchAssemblyToVisualModel(a);
    expect(model.anchors['dial-seat'].provenance.status).toBe('provisional');
    expect(model.anchors['hand-stack'].provenance.status).toBe('provisional');
    expect(componentPlacement(model, 'crown').offset).toEqual([0, 0, 0]);
    expect(model.crown.provisional).toBe(true);
  });
  it('keeps authored component scale independent of case diameter', () => {
    const a = createDefaultWatchAssembly();
    a.globalDimensions.caseDiameterMm = 50;
    a.parts['inst-hour-hand']!.visual = { category: 'hands', assetId: 'hands-mercedes-v1' };
    const placement = componentPlacement(watchAssemblyToVisualModel(a), 'hands');
    expect(placement.descriptorScale).toEqual([1, 1, 1]);
    expect(placement.anchor.positionMm[2]).toBeGreaterThan(0);
  });
});
