import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { renderToStaticMarkup } from 'react-dom/server';
vi.hoisted(() => { const data = new Map<string, string>(); vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v), removeItem: (k: string) => data.delete(k) }); });
import layouts from '@/domain/crown/offAxisLayouts.json';
import { offAxisCaseItems, offAxisPackageCrowns, offAxisStrapItem, offAxisSupplierListings } from '@/domain/catalogue/offAxisCatalogue';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { getCatalogueItem, listCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { deserializeWatchAssembly, serializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { checkOffAxisPlatform, offAxisPlatformSchema } from '@/domain/crown/offAxisPlatform';
import { crownAxisToEngineeringFrame } from '@/domain/crown/axis';
import { presentationEvidence, crownCatalogueItems } from '@/domain/crown/catalogue';
import { applyCrownEdit } from '@/domain/crown/edit';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { componentPlacement } from '@/visual3d/componentPlacement';
import { evaluateCandidate, runCompatibilityRules } from '@/domain/compatibility/compatibilityEngine';
import { calculateBomCost } from '@/domain/configurator/bomCostCalculator';
import { listingPriceZar, listingShippingZar } from '@/domain/catalogue/pricing';
import { assertSupplierSnapshots } from '@/domain/sourcing/snapshots';
import { OffAxisPlatformDetail } from '@/components/configurator/tray/OffAxisPlatformDetail';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { persistSavedVersions, loadSavedVersions } from '@/domain/configurator/versionManager';
import { applyReference42Preview } from '@/domain/presets/reference3d';

const caseId = 'inst-midcase', headId = 'inst-crown', strapId = 'inst-strap-integration';
const base = () => { const a = createStarterBuild('diver').assembly; a.parts['inst-dial-blank']!.dimensions.diameterMm = 28.5; return a; };
const ready = () => applyCatalogueVisualSelection(base(), strapId, offAxisStrapItem);
const platform = (index = 0) => applyCatalogueVisualSelection(ready(), caseId, offAxisCaseItems[index]!);
const stage = (id: string, item: typeof offAxisStrapItem) => {
  const a = useWatchAssemblyStore.getState().assembly;
  useConfiguratorUIStore.getState().setPreview(applyCatalogueVisualSelection(a, id, item), id, item);
};

type Glb = { scene: number; scenes: { nodes: number[] }[]; nodes: { name: string; mesh?: number; children?: number[]; matrix?: number[]; translation?: number[]; rotation?: number[]; scale?: number[]; extras?: Record<string, unknown> }[]; meshes: { primitives: { attributes: { POSITION: number } }[] }[]; accessors: { bufferView: number; byteOffset?: number; count: number; componentType: number }[]; bufferViews: { byteOffset?: number; byteStride?: number }[] };
const inspect = (assetId: string) => {
  const bytes = readFileSync(`public/assets/3d/variants/cases/${assetId}.glb`), length = bytes.readUInt32LE(12);
  const d = JSON.parse(bytes.subarray(20, 20 + length).toString('utf8')) as Glb;
  const groups = new Map<string, Vector3[]>();
  const visit = (id: number, parent: Matrix4) => {
    const n = d.nodes[id]!, local = n.matrix ? new Matrix4().fromArray(n.matrix) : new Matrix4().compose(new Vector3().fromArray(n.translation ?? [0, 0, 0]), new Quaternion().fromArray(n.rotation ?? [0, 0, 0, 1]), new Vector3().fromArray(n.scale ?? [1, 1, 1]));
    const world = parent.clone().multiply(local), points: Vector3[] = [];
    if (n.mesh !== undefined) for (const p of d.meshes[n.mesh]!.primitives) {
      const a = d.accessors[p.attributes.POSITION]!, v = d.bufferViews[a.bufferView]!;
      expect(a.componentType).toBe(5126);
      const start = 28 + length + (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
      for (let i = 0; i < a.count; i++) {
        const at = start + i * (v.byteStride ?? 12), point = new Vector3(bytes.readFloatLE(at), bytes.readFloatLE(at + 4), bytes.readFloatLE(at + 8)).applyMatrix4(world);
        points.push(new Vector3(point.x, -point.z, point.y));
      }
    }
    if (points.length) groups.set(n.name, points);
    n.children?.forEach(child => visit(child, world));
  };
  d.scenes[d.scene ?? 0]!.nodes.forEach(id => visit(id, new Matrix4()));
  return { d, groups };
};

describe('C7 bounded source and platform contract', () => {
  it.each(offAxisCaseItems)('$id keeps exact envelope, separate installation unknowns and one identity in both catalogues', item => {
    expect(listCatalogueItems().filter(i => i.id === item.id)).toEqual([item]);
    expect(useCatalogueStore.getState().items.filter(i => i.id === item.id)).toEqual([item]);
    expect(item.offAxisPlatform!.physicalFit).toBe('unqualified');
    expect(item.offAxisPlatform!.identityStatus).toBe('requires-confirmation');
    expect(Object.values(item.offAxisPlatform!.installation).every(v => v.status === 'unknown')).toBe(true);
    for (const key of ['midcaseDiameterMm', 'bezelOuterMm', 'bezelInnerMm', 'dialSeatMm', 'crystalSeatMm', 'casebackDiameterMm'] as const) expect(item.offAxisPlatform!.envelope[key].status).toBe('unknown');
    expect(item.crownAxes![0]!.clockwiseFrom3hDeg).toMatchObject({ status: 'known', value: 30, evidence: { kind: 'visual-approximation' } });
    expect(item.exportEnabled).toBe(false);
  });
  it('keeps 47 and 46.5 distinct and refuses manufactured certainty', () => {
    expect(offAxisCaseItems.map(i => i.nominalDimensions.diameterMm)).toEqual([47, 46.5]);
    const p = offAxisCaseItems[0]!.offAxisPlatform!;
    expect(offAxisPlatformSchema.safeParse({ ...p, physicalFit: 'verified' }).success).toBe(false);
    const a = platform(); a.parts[caseId]!.offAxisPlatform!.caseCatalogueId = 'wrong-case';
    expect(() => deserializeWatchAssembly(JSON.stringify(a))).toThrow(/exact case/);
    a.parts[caseId]!.offAxisPlatform = p; a.parts[caseId]!.crownAxes = [];
    expect(() => serializeWatchAssembly(a)).toThrow(/canonical datum/);
  });
  it.each([[3, 0], [3.8, 24], [4, 30], [4.1, 33], [4.2, 36]])('%sh transforms to %s degrees without rounding clock wording', (clock, degrees) => {
    expect((clock - 3) * 30).toBeCloseTo(degrees, 10);
    const frame = crownAxisToEngineeringFrame({ schema: 'crown-axis/v1', axisId: 'fixture', clockwiseFrom3hDeg: presentationEvidence(degrees), interfaceRadiusMm: presentationEvidence(23.8), stemHeightMm: presentationEvidence(1) })!;
    expect(Math.atan2(-frame.positionMm[1], frame.positionMm[0]) * 180 / Math.PI).toBeCloseTo(degrees, 10);
    expect(frame.positionMm[2]).toBe(1);
  });
  it.each(offAxisSupplierListings)('$sku has timestamped own FX, uncertain exact variant and unknown SA shipping', listing => {
    assertSupplierSnapshots([listing]);
    expect(listingPriceZar(listing)).toBeCloseTo(listing.unitPrice! * listing.priceSnapshot!.fx!.zarPerUnit, 8);
    expect(listingShippingZar(listing)).toBeNull();
    expect(listing.priceSnapshot!.variant).toContain('requires confirmation');
    expect(listing.verificationStatus).toBe('unverified');
    expect(listing.directOrderCapability).toBe(false);
  });
});

describe('C7 actual Blender asset coherence', () => {
  it.each(layouts)('$assetId binary shroud, tube and crown datum agree without embedded operating head', layout => {
    const { d, groups } = inspect(layout.assetId);
    expect(groups.size).toBe(8);
    expect([...groups.keys()].filter(n => /CROWN/.test(n))).toEqual(['DD_CASE_CROWN_TUBE_PRESENTATION', 'DD_CASE_TUNA_SHROUD_WITH_CROWN_CUTOUT']);
    for (const n of d.nodes.filter(n => n.mesh !== undefined)) expect(n.extras).toMatchObject({ DD_CANONICAL_AXIS_ID: 'crown-main', DD_CLOCKWISE_FROM_3H_DEG: 30, DD_PHYSICAL_FIT: 'unqualified' });
    const shroud = groups.get('DD_CASE_TUNA_SHROUD_WITH_CROWN_CUTOUT')!;
    expect(Math.max(...shroud.map(p => Math.hypot(p.x, p.y))) * 2).toBeCloseTo(layout.shroudMm, 4);
    expect(Math.max(...shroud.map(p => p.z)) - Math.min(...shroud.map(p => p.z))).toBeCloseTo(layout.heightMm, 4);
    const theta = -layout.clockwiseDeg * Math.PI / 180, axis = new Vector3(Math.cos(theta), Math.sin(theta), 0);
    const gap = (p: Vector3) => Math.abs(Math.atan2(Math.sin(Math.atan2(p.y, p.x) - theta), Math.cos(Math.atan2(p.y, p.x) - theta))) * 180 / Math.PI;
    expect(Math.min(...shroud.map(gap))).toBeCloseTo(layout.cutoutHalfAngleDeg, 4);
    // Even the largest exposed ordinary head fits this disclosed render cutout.
    expect((layout.shroudMm / 2 - 1.8) * Math.sin(layout.cutoutHalfAngleDeg * Math.PI / 180)).toBeGreaterThan(8.6 / 2);
    const tube = groups.get('DD_CASE_CROWN_TUBE_PRESENTATION')!;
    expect(Math.max(...tube.map(p => p.dot(axis)))).toBeCloseTo(layout.interfaceRadiusMm, 4);
    expect(Math.min(...tube.map(p => p.dot(axis)))).toBeCloseTo(layout.bodyMm / 2 - .8, 4);
    expect(Math.max(...tube.map(p => Math.abs(p.x * -axis.y + p.y * axis.x)))).toBeCloseTo(.9, 4);
    const a = platform(layouts.indexOf(layout)), model = watchAssemblyToVisualModel(a), anchor = model.anchors['crown-interface'];
    expect(anchor.positionMm[0]).toBeCloseTo(layout.interfaceRadiusMm * axis.x, 8);
    expect(anchor.positionMm[1]).toBeCloseTo(layout.interfaceRadiusMm * axis.y, 8);
    expect(anchor.rotationRad[2]).toBeCloseTo(theta, 8);
    expect(Object.values(a.parts).filter(p => getCatalogueItem(p.catalogueItemId)?.kind === 'crown')).toHaveLength(1);
    expect(model.assets.case.assetId).toBe(layout.assetId);
    expect(model.bezelEnvelope.outerRadiusMm).toBe(19);
    expect(renderToStaticMarkup(<OffAxisPlatformDetail model={model} />)).toContain('30.0°');
  });
  it.each([0, 1])('retains dial/calendar, hand stack and an explicit crown through platform %s', index => {
    let a = ready();
    a = applyCatalogueVisualSelection(a, headId, crownCatalogueItems.find(i => i.id.endsWith('onion'))!);
    a = applyCrownEdit(a, headId, { type: 'finish', finish: { mode: 'override', material: 'rose-gold', color: '#c08a76', texture: 'polished' } });
    a = applyCrownEdit(a, headId, { type: 'cap-concept', concept: { schema: 'crown-cap-concept/v1', state: 'open', clearanceMm: 1, wallMm: .6 } });
    const old = watchAssemblyToVisualModel(a), dial = structuredClone(a.parts['inst-dial-blank']);
    a = applyCatalogueVisualSelection(a, caseId, offAxisCaseItems[index]!);
    const model = watchAssemblyToVisualModel(a);
    expect(a.parts['inst-dial-blank']).toEqual(dial);
    expect(model.hands).toEqual(old.hands);
    expect(model.crown.surface).toEqual(old.crown.surface);
    expect(model.finishes.crown.color).toBe('#c08a76');
    expect(model.crown.capConcept).toBeUndefined();
    expect(deserializeWatchAssembly(serializeWatchAssembly(a))).toEqual(a);
    const placed = componentPlacement(model, 'crown');
    a.globalDimensions.caseDiameterMm = 52;
    expect(componentPlacement(watchAssemblyToVisualModel(a), 'crown')).toEqual(placed);
  });
});

describe('C7 shared Apply and sourcing transitions', () => {
  beforeEach(() => {
    useWatchAssemblyStore.getState().setAssembly(ready()); useWatchAssemblyStore.getState().clearAssemblyHistory();
    useConfiguratorUIStore.setState({ lockedPartIds: new Set(), lockedStyles: {}, previewAssembly: null, previewCandidateItem: null, previewPartInstanceId: null, savedVersions: [], previewError: null });
    useSourcingStore.getState().resetSourcingPlan();
  });
  it.each([0, 1])('applies %s from current state; source/axis defaults converge and undo/redo/import retain it', index => {
    const item = offAxisCaseItems[index]!, original = useWatchAssemblyStore.getState().assembly;
    useSourcingStore.getState().setSupplierSelection(caseId, 'stale-case');
    useSourcingStore.getState().setSupplierSelection(headId, 'stale-crown');
    stage(caseId, item);
    expect(useWatchAssemblyStore.getState().assembly).toEqual(original);
    expect(useSourcingStore.getState().sourcingPlan.selections[caseId]).toBe('stale-case');
    const current = structuredClone(original); current.metadata.notes = 'Changed after preview'; useWatchAssemblyStore.getState().setAssembly(current);
    expect(useConfiguratorUIStore.getState().applyPreview()).toBe(true);
    const committed = useWatchAssemblyStore.getState().assembly;
    expect(committed.metadata.notes).toBe(current.metadata.notes);
    expect(committed.parts[headId]!.catalogueItemId).toBe(offAxisPackageCrowns[index]!.id);
    expect(useSourcingStore.getState().sourcingPlan.selections[caseId]).toBeNull();
    expect(useSourcingStore.getState().sourcingPlan.selections[headId]).toBeNull();
    useWatchAssemblyStore.getState().undoAssembly(); expect(useWatchAssemblyStore.getState().assembly).toEqual(current);
    useWatchAssemblyStore.getState().redoAssembly(); expect(useWatchAssemblyStore.getState().assembly).toEqual(committed);
    useConfiguratorUIStore.getState().saveVersion('C7');
    const memory = new Map<string, string>(), storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v) };
    expect(persistSavedVersions(useConfiguratorUIStore.getState().savedVersions, storage)).toBeNull();
    expect(loadSavedVersions(storage).versions[0]!.assembly).toEqual(committed);
  });
  it('cancels without applying and refuses a crown or case locked after preview', () => {
    stage(caseId, offAxisCaseItems[0]!); useConfiguratorUIStore.getState().cancelPreview();
    expect(useWatchAssemblyStore.getState().assembly.parts[caseId]!.offAxisPlatform).toBeUndefined();
    for (const id of [caseId, headId]) {
      stage(caseId, offAxisCaseItems[0]!); useWatchAssemblyStore.getState().setPartLocked(id, true);
      expect(useConfiguratorUIStore.getState().applyPreview()).toBe(false);
      useWatchAssemblyStore.getState().setPartLocked(id, false);
    }
  });
  it('refuses stale strap state, unsupported movements and out-of-range dial without rotating the dial', () => {
    stage(caseId, offAxisCaseItems[0]!);
    const changed = base(); useWatchAssemblyStore.getState().setAssembly(changed);
    expect(useConfiguratorUIStore.getState().applyPreview()).toBe(false);
    expect(useConfiguratorUIStore.getState().previewError).toContain('22 mm');
    const unsupported = platform(); unsupported.metadata.movement = 'nh05';
    expect(checkOffAxisPlatform(unsupported).some(c => c.status === 'red')).toBe(true);
    const smallDial = platform(1); smallDial.parts['inst-dial-blank']!.dimensions.diameterMm = 24.5;
    expect(checkOffAxisPlatform(smallDial).some(c => c.summary.includes('dial range'))).toBe(true);
    for (const movement of ['nh34', 'nh35', 'nh36', 'nh38']) {
      const a = platform(1); a.metadata.movement = movement;
      expect(checkOffAxisPlatform(a).map(c => c.status)).toEqual(['unknown']);
    }
  });
  it.each([0, 1])('never qualifies unmeasured case %s interfaces using legacy NH35 or geometry fallbacks', index => {
    const checks = runCompatibilityRules(platform(index));
    for (const category of ['movement-case', 'case-dial', 'chapter-ring-case', 'crystal-case', 'bezel-case']) expect(checks.filter(c => c.category === category).map(c => c.status)).toEqual(['unknown']);
    const a = ready(); a.parts['inst-dial-blank']!.dimensions.diameterMm = 26.9;
    expect(evaluateCandidate({ assembly: a, targetPartInstanceId: caseId, candidateCatalogueItemId: offAxisCaseItems[1]!.id, candidateItem: offAxisCaseItems[1]! }).status).toBe('red');
  });
  it('clears previous reference fit evidence and seat anchors, and returns to an ordinary case without a retained off-axis datum', () => {
    const reference = applyReference42Preview(ready());
    const a = applyCatalogueVisualSelection(reference, caseId, offAxisCaseItems[0]!);
    expect(a.designConfig!.fitEvidence).toBeUndefined();
    expect(a.designConfig!.controlledOrderId).toBeUndefined();
    expect(a.designConfig!.visualReferenceId).toBeUndefined();
    expect(a.designConfig!.assemblyAnchors!['crown-interface']).toBeUndefined();
    expect(a.designConfig!.assemblyAnchors!['dial-seat']).toBeUndefined();
    const ordinary = applyCatalogueVisualSelection(a, caseId, getCatalogueItem('cat-midcase')!);
    expect(ordinary.parts[caseId]!.offAxisPlatform).toBeUndefined();
    expect(ordinary.parts[caseId]!.crownAxes).toBeUndefined();
    expect(watchAssemblyToVisualModel(ordinary).anchors['crown-interface'].rotationRad[2]).toBe(0);
    const restoredReference = applyReference42Preview(a);
    expect(restoredReference.parts[caseId]!.offAxisPlatform).toBeUndefined();
    expect(restoredReference.parts[caseId]!.catalogueItemId).toBe('cat-midcase');
    expect(watchAssemblyToVisualModel(restoredReference).anchors['crown-interface'].rotationRad[2]).toBe(0);
  });
  it('offers the 22 mm repair despite unchanged hand failures and keeps the full-build failures', () => {
    expect(useCatalogueStore.getState().items.some(i => i.id === offAxisStrapItem.id)).toBe(true);
    expect(evaluateCandidate({ assembly: base(), targetPartInstanceId: strapId, candidateCatalogueItemId: offAxisStrapItem.id, candidateItem: offAxisStrapItem }).status).not.toBe('red');
    const a = platform(), old = watchAssemblyToVisualModel(a).anchors;
    a.parts[headId]!.visual!.transform = { offsetMm: [999, 999, 999] };
    expect(watchAssemblyToVisualModel(a).anchors).toEqual(old);
  });
  it.each([0, 1])('accounts for case %s and supplied crown once, while retaining replacement costs and unknown shipping', index => {
    const a = platform(index), listing = offAxisSupplierListings[index]!;
    const cost = calculateBomCost(a, listCatalogueItems(), [listing], { [caseId]: listing.id });
    expect(cost.partsTotal).toBeCloseTo(listingPriceZar(listing)!, 8);
    expect(cost.shippingUnknownCount).toBe(1);
    expect(cost.lineItems.find(l => l.id === headId)!.priceZar).toBe(0);
    if (!index) expect(cost.lineItems.find(l => l.id === 'inst-rotating-bezel')!.priceZar).toBe(0);
    const replaced = applyCatalogueVisualSelection(a, headId, crownCatalogueItems.find(i => i.id.endsWith('onion'))!);
    const replacementCost = calculateBomCost(replaced, listCatalogueItems(), [listing], { [caseId]: listing.id });
    expect(replacementCost.lineItems.find(l => l.id === headId)!.priceZar).toBeNull();
    expect(replacementCost.lineItems.find(l => l.id === 'case-package-crown')!.priceZar).toBe(0);
    expect(replacementCost.partsTotal).toBe(cost.partsTotal);
  });
  it('counts the included bezel once and charges a deliberate separate bezel without discounting the bundle', () => {
    const a = platform(), listing = offAxisSupplierListings[0]!;
    const separate = { ...listing, id: 'separate-bezel-fixture', catalogueItemId: 'cat-rotating-bezel', sku: 'separate-bezel', currency: 'ZAR', unitPrice: 100, packageContents: undefined, priceSnapshot: undefined };
    const cost = calculateBomCost(a, listCatalogueItems(), [listing, separate], { [caseId]: listing.id });
    expect(cost.lineItems.find(l => l.id === 'inst-rotating-bezel')!.priceZar).toBe(0);
    expect(cost.partsTotal).toBeCloseTo(listingPriceZar(listing)!, 8);
    const replacement = applyCatalogueVisualSelection(a, 'inst-rotating-bezel', getCatalogueItem('cat-rotating-bezel')!);
    const replaced = calculateBomCost(replacement, listCatalogueItems(), [listing, separate], { [caseId]: listing.id, 'inst-rotating-bezel': separate.id });
    expect(replaced.partsTotal).toBeCloseTo(cost.partsTotal + 100, 8);
    expect(replaced.lineItems.find(l => l.id === 'case-package-bezel')!.priceZar).toBe(0);
    useWatchAssemblyStore.getState().setAssembly(ready()); stage(caseId, offAxisCaseItems[0]!);
    useConfiguratorUIStore.getState().togglePartLock('inst-rotating-bezel');
    expect(useConfiguratorUIStore.getState().applyPreview()).toBe(false);
  });
});
