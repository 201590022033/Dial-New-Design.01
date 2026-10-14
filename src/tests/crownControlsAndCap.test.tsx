import { MeshPhysicalMaterial, Texture } from 'three';
import { applyRealismAppearance, clonePresentationMaterial, REALISM_SCHEMA } from '@/visual3d/realismMaterials';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => { const data = new Map<string, string>(); vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v), removeItem: (k: string) => data.delete(k) }); });
import { renderToStaticMarkup } from 'react-dom/server';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { applyCrownEdit, crownEditCandidate, type CrownEdit, type CrownCapConcept } from '@/domain/crown/edit';
import { crownCatalogueItems, presentationEvidence } from '@/domain/crown/catalogue';
import { crownSpecificationForPart } from '@/domain/crown/selection';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { getCatalogueItem, listCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import { calculateBomCost } from '@/domain/configurator/bomCostCalculator';
import { supplierExpansionCandidateListings } from '@/domain/catalogue/supplierExpansionCandidates';
import type { SupplierListing } from '@/domain/catalogue/types';
import { listingPriceZar, listingShippingZar } from '@/domain/catalogue/pricing';
import { assertSupplierSnapshots } from '@/domain/sourcing/snapshots';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { serializeDialProject, deserializeDialProject } from '@/services/projectFileService';
import { hydrateRuntimeProject } from '@/services/runtimeProjectHydrationService';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { createCrownCapGeometry, crownCapEnvelope } from '@/visual3d/crownCapGeometry';
import { CrownEngineeringDetail } from '@/components/configurator/tray/CrownEngineeringDetail';
import { CrownControls } from '@/components/configurator/tray/CrownControls';
import { BomCostLines } from '@/components/configurator/BomCostLines';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { useProjectStore } from '@/stores/projectStore';
import { persistSavedVersions, loadSavedVersions } from '@/domain/configurator/versionManager';

const id = 'inst-crown';
const base = () => createStarterBuild('diver').assembly;
const cap = (state: 'open' | 'closed' = 'closed'): CrownCapConcept => ({ schema: 'crown-cap-concept/v1', state, clearanceMm: 1, wallMm: .6 });
const rose: CrownEdit = { type: 'finish', finish: { mode: 'override', material: 'rose-gold', color: '#c08a76', texture: 'polished' } };
const apply = (edit: CrownEdit) => {
  const current = useWatchAssemblyStore.getState().assembly, item = crownEditCandidate(current, id, edit);
  useConfiguratorUIStore.getState().setPreview(applyCatalogueVisualSelection(current, id, item), id, item);
  return useConfiguratorUIStore.getState().applyPreview();
};
const offer = (catalogueItemId: string, offerId: string, price: number | null): SupplierListing => ({ ...supplierExpansionCandidateListings[0]!, id: offerId, catalogueItemId, sku: offerId, unitPrice: price, currency: 'ZAR', shippingPrice: null, manualSelectionOnly: false, caseFinish: undefined, replacementCatalogueItemId: undefined });
const packageFixture = () => {
  const assembly = base();
  const caseOffer = offer(assembly.parts['inst-midcase']!.catalogueItemId, 'exact-case-fixture', 500);
  caseOffer.packageContents = [{ role: 'crown', catalogueItemId: assembly.parts[id]!.catalogueItemId, description: 'Original bundled crown', evidence: { status: 'known', value: 'included', evidence: { kind: 'supplier-statement', source: 'Synthetic fixture, not production evidence' } } },
    { role: 'tube', description: 'Case tube', evidence: presentationEvidence('not a qualified bundle statement') },
    { role: 'stem', description: 'Included stem', evidence: { status: 'known', value: 'included', evidence: { kind: 'drawing', source: 'Synthetic fixture' } } }];
  return { assembly, caseOffer };
};

describe('C4 connected crown transitions', () => {
  beforeEach(() => {
    useWatchAssemblyStore.getState().setAssembly(base()); useWatchAssemblyStore.getState().clearAssemblyHistory();
    useConfiguratorUIStore.setState({ lockedPartIds: new Set(), lockedStyles: {}, previewAssembly: null, previewCandidateItem: null, previewPartInstanceId: null, savedVersions: [], previewError: null });
    useSourcingStore.getState().resetSourcingPlan();
  });
  it('stages and cancels without changing committed appearance', () => {
    const assembly = useWatchAssemblyStore.getState().assembly, item = crownEditCandidate(assembly, id, rose);
    useConfiguratorUIStore.getState().setPreview(applyCatalogueVisualSelection(assembly, id, item), id, item);
    expect(crownSpecificationForPart(useConfiguratorUIStore.getState().previewAssembly!.parts[id])!.finish).toEqual(rose.type === 'finish' && rose.finish);
    expect(useWatchAssemblyStore.getState().assembly).toEqual(assembly);
    useConfiguratorUIStore.getState().cancelPreview(); expect(useWatchAssemblyStore.getState().assembly).toEqual(assembly);
  });
  it('replays finish against current state, preserves physical interfaces, and supports undo/redo', () => {
    const original = useWatchAssemblyStore.getState().assembly, item = crownEditCandidate(original, id, rose);
    useConfiguratorUIStore.getState().setPreview(applyCatalogueVisualSelection(original, id, item), id, item);
    const changed = structuredClone(original); changed.metadata.notes = 'Unrelated edit after preview'; useWatchAssemblyStore.getState().setAssembly(changed);
    expect(useConfiguratorUIStore.getState().applyPreview()).toBe(true);
    const committed = useWatchAssemblyStore.getState().assembly;
    expect(committed.metadata.notes).toBe(changed.metadata.notes);
    expect(crownSpecificationForPart(committed.parts[id])!.interfaces).toEqual(crownSpecificationForPart(original.parts[id])!.interfaces);
    useWatchAssemblyStore.getState().undoAssembly(); expect(useWatchAssemblyStore.getState().assembly).toEqual(changed);
    useWatchAssemblyStore.getState().redoAssembly(); expect(useWatchAssemblyStore.getState().assembly).toEqual(committed);
  });
  it('applies an explicit refined crown finish and Undo restores the authored finish detail', () => {
    const source = new MeshPhysicalMaterial({ roughness: .41, metalness: .91, anisotropy: .63, normalMap: new Texture(), roughnessMap: new Texture() });
    source.userData = { DD_REALISM_SCHEMA: REALISM_SCHEMA, DD_REALISM_ROLE: 'steel-polished' };
    const rendered = () => {
      const appearance = watchAssemblyToVisualModel(useWatchAssemblyStore.getState().assembly).archetypeAppearance;
      const material = clonePresentationMaterial(source) as MeshPhysicalMaterial;
      applyRealismAppearance(material, { metalColor: appearance.crownColor, metalFinish: appearance.crownFinishOverride });
      return material;
    };
    expect(rendered()).toMatchObject({ roughness: .41, metalness: .91 });
    expect(apply({ type: 'finish', finish: { mode: 'override', material: 'steel', color: '#e2e8f0', texture: 'polished' } })).toBe(true);
    expect(rendered()).toMatchObject({ roughness: .075, metalness: 1, anisotropy: .63, normalMap: source.normalMap, roughnessMap: source.roughnessMap });
    useWatchAssemblyStore.getState().undoAssembly();
    expect(rendered()).toMatchObject({ roughness: .41, metalness: .91, anisotropy: .63, normalMap: source.normalMap, roughnessMap: source.roughnessMap });
    expect(source).toMatchObject({ roughness: .41, metalness: .91 });
  });

  it.each(['physical', 'tray', 'style'])('refuses %s lock acquired after preview', lock => {
    const assembly = useWatchAssemblyStore.getState().assembly, item = crownEditCandidate(assembly, id, rose);
    useConfiguratorUIStore.getState().setPreview(applyCatalogueVisualSelection(assembly, id, item), id, item);
    if (lock === 'physical') useWatchAssemblyStore.getState().setPartLocked(id, true);
    else if (lock === 'tray') useConfiguratorUIStore.getState().togglePartLock(id);
    else useConfiguratorUIStore.getState().toggleStyleLock(id);
    expect(useConfiguratorUIStore.getState().applyPreview()).toBe(false);
  });
  it('independent finish survives shape and case finish changes; inherit follows case', () => {
    let assembly = applyCrownEdit(base(), id, rose);
    assembly = applyCatalogueVisualSelection(assembly, id, crownCatalogueItems.find(i => i.id.endsWith('onion'))!);
    assembly.designConfig!.visualReferenceConfig!.caseFinish = 'black-pvd';
    expect(watchAssemblyToVisualModel(assembly).finishes.crown.color).toBe('#c08a76');
    assembly = applyCrownEdit(assembly, id, { type: 'finish', finish: { mode: 'inherit-case' } });
    const model = watchAssemblyToVisualModel(assembly); expect(model.finishes.crown).toEqual(model.finishes.case);
    expect(renderToStaticMarkup(<CrownEngineeringDetail model={model} />)).toContain(model.finishes.crown.color);
  });
  it('closure concepts keep movement/tube evidence and never become manufacturing approval', () => {
    const original = base(), next = applyCrownEdit(original, id, { type: 'closure', closure: 'screw-down' });
    const spec = crownSpecificationForPart(next.parts[id])!;
    expect(spec.interfaces).toEqual(crownSpecificationForPart(original.parts[id])!.interfaces);
    expect(spec.closure).toMatchObject({ status: 'known', value: 'screw-down', evidence: { kind: 'visual-approximation' } });
    expect(next.parts[id]!.catalogueItemId).toBe(original.parts[id]!.catalogueItemId);
  });
  it('restores provisional default deliberately', () => {
    expect(apply(rose)).toBe(true);
    expect(apply({ type: 'restore-default' })).toBe(true);
    expect(crownSpecificationForPart(useWatchAssemblyStore.getState().assembly.parts[id])!.finish.mode).toBe('inherit-case');
    expect(useWatchAssemblyStore.getState().assembly.designConfig!.crownChoice!.selected).toBeUndefined();
  });
  it('renders separate shape, mechanism, finish, engineering and source controls', () => {
    const html = renderToStaticMarkup(<CrownControls id={id} />);
    for (const label of ['Crown shape', 'Crown closure and protection', 'Independent crown finish', 'Crown engineering detail', 'Crown source and fit']) expect(html).toContain(label);
  });
  it('versions preserve crown edits and exact commercial snapshots across durable restore', () => {
    const { caseOffer } = packageFixture(); useCatalogueStore.getState().addSupplierListing(caseOffer);
    useSourcingStore.getState().setSupplierSelection('inst-midcase', caseOffer.id); expect(apply(rose)).toBe(true);
    useConfiguratorUIStore.getState().saveVersion('Crown fixture');
    const record = useConfiguratorUIStore.getState().savedVersions[0]!;
    const memory = new Map<string, string>(), storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v) };
    expect(persistSavedVersions([record], storage)).toBeNull(); const loaded = loadSavedVersions(storage).versions;
    expect(loaded[0]!.supplierSnapshots).toEqual([caseOffer]);
    useConfiguratorUIStore.setState({ savedVersions: loaded }); apply({ type: 'finish', finish: { mode: 'inherit-case' } });
    useSourcingStore.getState().setSupplierSelection('stale-selection', 'stale-listing');
    useConfiguratorUIStore.getState().restoreVersion(record.id);
    expect(useSourcingStore.getState().sourcingPlan.selections).toEqual(record.sourcingPlan);
    expect(useWatchAssemblyStore.getState().assembly).toEqual(record.assembly);
  });
  it('project export/import restores price, bundle contents and source selection', () => {
    const { assembly, caseOffer } = packageFixture(); useWatchAssemblyStore.getState().setAssembly(assembly);
    useCatalogueStore.getState().addSupplierListing(caseOffer); useSourcingStore.getState().setSupplierSelection('inst-midcase', caseOffer.id);
    useProjectStore.setState({ assembly }); const saved = deserializeDialProject(serializeDialProject(useProjectStore.getState().buildProjectFile()));
    useCatalogueStore.getState().updateSupplierListing(caseOffer.id, { packageContents: [], unitPrice: 1 });
    useSourcingStore.getState().resetSourcingPlan(); hydrateRuntimeProject(saved);
    expect(useCatalogueStore.getState().supplierListings.find(l => l.id === caseOffer.id)).toEqual(caseOffer);
    expect(useSourcingStore.getState().sourcingPlan.selections['inst-midcase']).toBe(caseOffer.id);
  });
  it('rejects malformed commercial snapshots before changing the active assembly', () => {
    const original = useWatchAssemblyStore.getState().assembly;
    const project = useProjectStore.getState().buildProjectFile();
    project.supplierSnapshots = [{ ...offer('cat-crown', 'broken', 10), shippingDestination: {} } as unknown as SupplierListing];
    expect(() => hydrateRuntimeProject(project)).toThrow(/supplier/);
    expect(useWatchAssemblyStore.getState().assembly).toEqual(original);
    expect(() => deserializeDialProject(JSON.stringify(project))).toThrow(/supplier/);
  });
});

describe('C4 package accounting and price provenance', () => {
  it('counts exact included crown once, preserves case price, excludes inferred package content', () => {
    const { assembly, caseOffer } = packageFixture();
    const crownOffer = offer(assembly.parts[id]!.catalogueItemId, 'separate-crown', 100);
    const cost = calculateBomCost(assembly, listCatalogueItems(), [caseOffer, crownOffer], { 'inst-midcase': caseOffer.id });
    expect(cost.partsTotal).toBe(500); expect(cost.shippingUnknownCount).toBe(1);
    expect(cost.lineItems.find(l => l.id === id)!.packageNote).toContain('Included');
    expect(cost.lineItems.find(l => l.id === 'case-package-stem')!.priceZar).toBe(0);
    expect(cost.lineItems.some(l => l.id === 'case-package-tube')).toBe(false);
    expect(renderToStaticMarkup(<BomCostLines cost={cost} />)).toContain('Included with case');
    const replacement = calculateBomCost(assembly, listCatalogueItems(), [caseOffer, crownOffer], { 'inst-midcase': caseOffer.id, [id]: crownOffer.id });
    expect(replacement.partsTotal).toBe(600); expect(replacement.shippingUnknownCount).toBe(2);
    expect(replacement.lineItems.find(l => l.id === 'case-package-crown')!.priceZar).toBe(0);
  });
  it('unknown replacement cannot borrow bundled price or remove original bundle', () => {
    const { assembly, caseOffer } = packageFixture();
    const changed = applyCatalogueVisualSelection(assembly, id, crownCatalogueItems.find(i => i.id.endsWith('onion'))!);
    const cost = calculateBomCost(changed, listCatalogueItems(), [caseOffer], { 'inst-midcase': caseOffer.id });
    expect(cost.partsTotal).toBe(500); expect(cost.lineItems.find(l => l.id === id)!.priceZar).toBeNull();
    expect(cost.lineItems.some(l => l.id === 'case-package-crown')).toBe(true);
  });
  it('new quote uses only its recorded FX and SA shipping; missing FX is unknown', () => {
    const listing = offer('cat-crown', 'fx-fixture', 10); listing.currency = 'USD'; listing.shippingPrice = 2; listing.shippingCurrency = 'USD'; listing.shippingDestination = 'ZA';
    listing.priceSnapshot = { variant: 'SKU-A / exact silver', checkedAtIso: '2026-10-10T00:00:00Z', shippingToSa: 'unknown', taxAssumptions: 'Fixture only, taxes unknown' };
    expect(listingPriceZar(listing)).toBeNull(); expect(listingShippingZar(listing)).toBeNull();
    listing.priceSnapshot.fx = { currency: 'USD', zarPerUnit: 20, sourceUrl: 'https://example.com/fixture-fx', checkedAtIso: '2026-10-10T00:00:00Z' };
    expect(listingPriceZar(listing)).toBe(200); expect(listingShippingZar(listing)).toBeNull();
    listing.priceSnapshot.shippingToSa = 'quoted'; expect(listingShippingZar(listing)).toBe(40);
    listing.shippingDestination = 'US'; expect(listingShippingZar(listing)).toBeNull();
    assertSupplierSnapshots([listing]); listing.unitPrice = -1; expect(() => assertSupplierSnapshots([listing])).toThrow();
  });
});

describe('C5 generic protected cap boundary', () => {
  it.each(crownCatalogueItems)('clears the operating envelope for $id without adding an operating head', item => {
    const assembly = applyCrownEdit(applyCatalogueVisualSelection(base(), id, item), id, { type: 'cap-concept', concept: cap() });
    const model = watchAssemblyToVisualModel(assembly), e = crownCapEnvelope(model.crown.surface, cap());
    expect(e.innerRadius - model.crown.surface.maximumOuterDiameterMm / 2).toBe(1);
    expect(e.innerLength - model.crown.lengthMm).toBe(1); expect(e.orderable).toBe(false);
    const mesh = createCrownCapGeometry(model.crown.surface, cap());
    expect(mesh.cap.boundingBox!.min.x).toBeCloseTo(0); expect(mesh.holder.boundingBox!.max.x).toBeCloseTo(-.1);
    const open = createCrownCapGeometry(model.crown.surface, cap('open')); expect(open.cap.boundingBox!.min.x).toBeGreaterThan(model.crown.lengthMm);
    mesh.cap.dispose(); mesh.holder.dispose(); open.cap.dispose(); open.holder.dispose();
    expect(Object.values(assembly.parts).filter(p => getCatalogueItem(p.catalogueItemId)?.kind === 'crown')).toHaveLength(1);
    expect(deserializeWatchAssembly(serializeWatchAssembly(assembly))).toEqual(assembly);
    expect(model.visible.crown).toBe(true);
  });
  it('never relocates case axis, movement, dial/date or hands and clears holder on case change', () => {
    const original = base(), next = applyCrownEdit(original, id, { type: 'cap-concept', concept: cap('open') });
    expect(next.parts['inst-midcase']).toEqual(original.parts['inst-midcase']); expect(next.parts['inst-dial-blank']).toEqual(original.parts['inst-dial-blank']);
    expect(next.parts['inst-hour-hand']).toEqual(original.parts['inst-hour-hand']); expect(next.metadata.movement).toBe(original.metadata.movement);
    expect(createStarterBuild('ladies-dress', next).assembly.parts[id]!.crownCapConcept).toBeUndefined();
    const caseItem = listCatalogueItems().find(i => i.visual?.category === 'case' && i.id !== next.parts['inst-midcase']!.catalogueItemId && !i.researchOnly)!;
    expect(applyCatalogueVisualSelection(next, 'inst-midcase', caseItem).parts[id]!.crownCapConcept).toBeUndefined();
    const line = calculateBomCost(next, listCatalogueItems(), [], {}).lineItems.find(l => l.id === 'crown-cap-concept');
    expect(line).toMatchObject({ priceZar: null, partInstanceIds: [] }); expect(line!.fitWarning).toContain('no matched supplier');
    const html = renderToStaticMarkup(<BomCostLines cost={calculateBomCost(next, listCatalogueItems(), [], {})} interactive />);
    expect(html).not.toContain('Supplier price for Generic protected cap'); expect(html).not.toContain('Apply Generic protected cap');
  });
  it('rejects invalid clearance and wrong-owner persisted concept before hydration', () => {
    const assembly = base(); expect(() => applyCrownEdit(assembly, id, { type: 'cap-concept', concept: { ...cap(), clearanceMm: -.1 } })).toThrow();
    assembly.parts['inst-dial-blank']!.crownCapConcept = cap(); expect(() => serializeWatchAssembly(assembly)).toThrow(/Invalid crown cap/);
    expect(() => applyCrownEdit(base(), 'inst-dial-blank', rose)).toThrow(/operating crown/);
    expect(() => applyCrownEdit(base(), id, { type: 'relocate-left' } as unknown as CrownEdit)).toThrow(/Invalid crown edit/);
  });
  it.each([34, 38, 42])('keeps cap and crown dimensions independent of %s mm case diameter', diameter => {
    const original = applyCrownEdit(base(), id, { type: 'cap-concept', concept: cap() });
    const first = watchAssemblyToVisualModel(original);
    original.globalDimensions.caseDiameterMm = diameter;
    const next = watchAssemblyToVisualModel(original);
    expect(next.crown.surface).toEqual(first.crown.surface);
    expect(crownCapEnvelope(next.crown.surface, next.crown.capConcept!)).toEqual(crownCapEnvelope(first.crown.surface, first.crown.capConcept!));
  });
  it('keeps cap state and finish across unrelated hand edits and honors crown hide/reveal', () => {
    const assembly = applyCrownEdit(applyCrownEdit(base(), id, rose), id, { type: 'cap-concept', concept: cap('open') });
    const first = watchAssemblyToVisualModel(assembly);
    assembly.parts['inst-hour-hand']!.dimensions.diameterMm = 8;
    const next = watchAssemblyToVisualModel(assembly); expect(next.crown).toEqual(first.crown); expect(next.finishes.crown).toEqual(first.finishes.crown);
    assembly.parts[id]!.visible = false; expect(watchAssemblyToVisualModel(assembly).visible.crown).toBe(false);
    assembly.parts[id]!.visible = true; expect(watchAssemblyToVisualModel(assembly).visible.crown).toBe(true);
  });
});
