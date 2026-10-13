import { resolveAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const memory = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) });
});
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { listCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import type { SupplierListing } from '@/domain/catalogue/types';
import { createSyntheticIncompleteCaseConstraints, createSyntheticKnownCaseConstraints } from '@/domain/design-first/caseConstraintFixtures';
import { deriveCaseConstraints } from '@/domain/design-first/caseConstraintAdapter';
import { defaultDesignIntent } from '@/domain/design-first/designIntent';
import { createManualSupplierIntake } from '@/domain/design-first/supplierIntake';
import { createSupplierReviewEvent, publishSupplierReview } from '@/domain/design-first/supplierReview';
import { resolveAppearance } from '@/domain/appearance/appearance';
import { customAviationDefaults } from '@/domain/scales/customAviation';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { exportAssemblyToLegacyProject } from '@/domain/assembly/assemblySerialization';
import { serializeDialProject, deserializeDialProject } from '@/services/projectFileService';
import { calculateBomCost } from '@/domain/configurator/bomCostCalculator';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useDesignMatchingStore } from '@/stores/designMatchingStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { useScaleStore } from '@/stores/scaleStore';
import { useWatchComponentStore } from '@/stores/watchComponentStore';
import { useProjectStore } from '@/stores/projectStore';
import '@/stores/storeSync';

const targetId = 'inst-dial-blank';
const candidateId = 'cat-dial-sunburst-blue-285';
const intent = { ...defaultDesignIntent(), preserveDimensions: false, preserveAppearance: false };
const offer: SupplierListing = { id: 'release-fixture-offer', catalogueItemId: candidateId, supplierName: 'Release fixture',
  unitPrice: 125, currency: 'ZAR', shippingPrice: null, stockStatus: 'unknown', status: 'active', verificationStatus: 'unverified',
  lastCheckedIso: '2026-10-13T10:00:00+02:00', provenance: { dataSource: 'fixture://release-offer', sourceType: 'demo-fixture', isDemonstrationFixture: true } };

const snapshot = () => ({ assembly: useWatchAssemblyStore.getState(), ui: useConfiguratorUIStore.getState(),
  matching: useDesignMatchingStore.getState(), catalogue: useCatalogueStore.getState(), sourcing: useSourcingStore.getState(),
  scale: useScaleStore.getState(), components: useWatchComponentStore.getState(), project: useProjectStore.getState() });
let saved: ReturnType<typeof snapshot>;

function start(scenario: 'concept' | 'known-case' | 'incomplete-case' = 'concept') {
  const assembly = createStarterBuild('pilot').assembly;
  const appearance = resolveAppearance(assembly);
  assembly.designConfig = { ...assembly.designConfig, appearance: { ...appearance, mainHands: { ...appearance.mainHands, tipColor: '#E63846', tipExtentMm: 1.2 } },
    customAviationLayers: { version: 1, layers: [{ ...customAviationDefaults('decimal-hour'), enabled: true, rotationDeg: 17, dialInsetMm: 3 }] },
    designIntent: { ...intent, mode: scenario === 'concept' ? 'concept' : 'selected-case' } };
  const items = structuredClone(listCatalogueItems());
  if (scenario !== 'concept') {
    const index = items.findIndex(item => item.id === assembly.parts['inst-midcase']!.catalogueItemId);
    const constraints = scenario === 'known-case' ? createSyntheticKnownCaseConstraints(31) : createSyntheticIncompleteCaseConstraints();
    items[index] = { ...items[index]!, caseConstraints: { ...constraints, catalogueItemId: items[index]!.id } };
  }
  useCatalogueStore.setState({ items, supplierListings: [offer] });
  useWatchAssemblyStore.getState().setAssembly(assembly);
  const scale = useScaleStore.getState();
  useWatchAssemblyStore.getState().setScaleSnapshot({ selectedScaleKind: scale.selectedScaleKind, pluginConfig: scale.pluginConfig,
    context: scale.context, previewEnabled: scale.previewEnabled, crossArchetypeUnlocked: scale.crossArchetypeUnlocked });
  useWatchAssemblyStore.getState().clearAssemblyHistory();
  useSourcingStore.getState().loadSourcingPlan({ assemblyId: assembly.metadata.id,
    selections: { [targetId]: 'old-offer', 'inst-minute-hand': 'unrelated-source' }, updatedAtIso: '2026-10-13T09:00:00+02:00' });
  return assembly;
}

function assertViewsAgree() {
  const assembly = useWatchAssemblyStore.getState().assembly;
  const active = useConfiguratorUIStore.getState().getActiveAssembly();
  expect(active).toBe(assembly);
  const diameter = assembly.parts[targetId]!.dimensions.diameterMm;
  expect(resolveAssemblyGeometry(assembly).regions.dial!.outerRadiusMm * 2).toBeCloseTo(diameter);
  // The printed dial band is the visible chapter-ring aperture, not the hidden physical blank.
  expect(assemblyToBands(assembly).find(band => band.id === 'band-dial-face')!.geometry.outerRadius * 2).toBeLessThanOrEqual(diameter);
  expect(watchAssemblyToVisualModel(active).dial.outerDiameterMm).toBeCloseTo(diameter);
  const catalogue = useCatalogueStore.getState();
  const line = calculateBomCost(assembly, catalogue.items, catalogue.supplierListings, useSourcingStore.getState().sourcingPlan.selections).lineItems.find(line => line.id === targetId)!;
  expect(line.catalogueItemId).toBe(assembly.parts[targetId]!.catalogueItemId);
  return line;
}

describe('DF7 integrated design-first release journeys', () => {
  beforeEach(() => {
    saved = snapshot();
    useDesignMatchingStore.getState().clear();
    useConfiguratorUIStore.setState({ previewAssembly: null, previewCandidateItem: null, previewPartInstanceId: null, previewStatus: 'none', previewOrigin: null,
      previewError: null, archetypePreviewAssembly: null, previewingVersionId: null, lockedPartIds: new Set(), lockedStyles: {} });
  });
  afterEach(() => {
    useDesignMatchingStore.getState().clear();
    useCatalogueStore.setState(saved.catalogue);
    useWatchAssemblyStore.setState(saved.assembly);
    useScaleStore.setState(saved.scale);
    useWatchAssemblyStore.setState({ assembly: saved.assembly.assembly, dirty: saved.assembly.dirty,
      historyPast: saved.assembly.historyPast, historyFuture: saved.assembly.historyFuture });
    useWatchAssemblyStore.setState({ historyPast: saved.assembly.historyPast, historyFuture: saved.assembly.historyFuture });
    useSourcingStore.setState(saved.sourcing);
    useWatchComponentStore.setState(saved.components);
    useProjectStore.setState(saved.project);
    useConfiguratorUIStore.setState(saved.ui);
    useDesignMatchingStore.setState(saved.matching);
  });
  afterAll(() => vi.unstubAllGlobals());

  it.each(['concept', 'known-case', 'incomplete-case'] as const)('%s search, current-state Apply, sourcing Undo/Redo and .dial preserve authored pilot work', scenario => {
    start(scenario);
    const baseline = useWatchAssemblyStore.getState().assembly;
    const scaleBefore = structuredClone(baseline.scaleBinding);
    const appearanceBefore = structuredClone(baseline.designConfig?.appearance);
    const layersBefore = structuredClone(baseline.designConfig?.customAviationLayers);
    const activeIntent = baseline.designConfig!.designIntent!;
    expect(useDesignMatchingStore.getState().search(targetId, activeIntent)).toBe(true);
    expect(useDesignMatchingStore.getState().results.find(result => result.catalogueItemId === candidateId)?.group).toBe('needs-evidence');
    expect(useDesignMatchingStore.getState().preview(candidateId), useDesignMatchingStore.getState().error ?? '').toBe(true);
    expect(useConfiguratorUIStore.getState().getActiveAssembly().parts[targetId]!.catalogueItemId).toBe(candidateId);
    expect(useWatchAssemblyStore.getState().assembly).toBe(baseline);
    // An unrelated current edit must survive the rebuild performed by Apply.
    useWatchAssemblyStore.getState().updatePart('inst-minute-hand', { color: '#123456' });
    expect(useDesignMatchingStore.getState().selectSupplier(offer.id)).toBe(true);
    expect(useDesignMatchingStore.getState().apply(), useDesignMatchingStore.getState().error ?? '').toBe(true);
    const applied = useWatchAssemblyStore.getState().assembly;
    expect(applied.parts['inst-minute-hand']!.color).toBe('#123456');
    expect(applied.scaleBinding).toEqual(scaleBefore);
    expect(applied.designConfig?.appearance).toEqual(appearanceBefore);
    expect(applied.designConfig?.customAviationLayers).toEqual(layersBefore);
    expect(assertViewsAgree().listingId).toBe(offer.id);
    expect(useScaleStore.getState().pluginConfig.placementTargetBandId).toBe(applied.scaleBinding?.config.placementTargetBandId);
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useWatchAssemblyStore.getState().assembly.parts[targetId]!.catalogueItemId).toBe(baseline.parts[targetId]!.catalogueItemId);
    expect(useSourcingStore.getState().sourcingPlan.selections[targetId]).toBe('old-offer');
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-minute-hand']!.color).toBe('#123456');
    assertViewsAgree();
    useWatchAssemblyStore.getState().redoAssembly();
    expect(useSourcingStore.getState().sourcingPlan.selections[targetId]).toBe(offer.id);
    expect(useSourcingStore.getState().sourcingPlan.selections['inst-minute-hand']).toBe('unrelated-source');
    assertViewsAgree();
    const canonical = useWatchAssemblyStore.getState().assembly;
    const legacy = exportAssemblyToLegacyProject(canonical);
    useProjectStore.getState().setRuntimeSnapshot({ assembly: canonical, geometry: legacy.geometry, bands: legacy.bands,
      selectedScaleKind: legacy.scale.selectedScaleKind, scalePluginConfig: legacy.scale.pluginConfig, scaleContext: legacy.scale.context,
      markerConfig: legacy.design.markerConfig, typographyConfig: legacy.design.typographyConfig, textureConfig: legacy.design.textureConfig,
      viewport: legacy.viewport, selectedBandId: null, preferences: legacy.preferences, historyCounts: legacy.history });
    const loaded = deserializeDialProject(serializeDialProject(useProjectStore.getState().buildProjectFile()));
    expect(loaded.assembly?.scaleBinding).toEqual(scaleBefore);
    expect(loaded.assembly?.designConfig?.appearance).toEqual(appearanceBefore);
    expect(loaded.assembly?.designConfig?.customAviationLayers).toEqual(layersBefore);
    expect(loaded.assembly?.designConfig?.designIntent).toEqual(activeIntent);
    expect(loaded.sourcing?.selections[targetId]).toBe(offer.id);
    expect(loaded.supplierSnapshots?.[0]?.verificationStatus).toBe('unverified');
    useWatchAssemblyStore.getState().setAssembly(loaded.assembly!);
    useSourcingStore.getState().loadSourcingPlan(loaded.sourcing!);
    assertViewsAgree();
  });

  it('Undo clears an owned temporary HD preview instead of continuing to display stale geometry', () => {
    start();
    useWatchAssemblyStore.getState().updatePart('inst-minute-hand', { color: '#123456' });
    expect(useDesignMatchingStore.getState().search(targetId, intent)).toBe(true);
    expect(useDesignMatchingStore.getState().preview(candidateId)).toBe(true);
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useConfiguratorUIStore.getState().previewAssembly).toBeNull();
    expect(useDesignMatchingStore.getState().previewTicket).toBeNull();
    assertViewsAgree();
  });

  it('published research cases retain source-qualified exterior evidence but no inferred interfaces or Apply permission', () => {
    start();
    const intake = createManualSupplierIntake({ supplierId: 'Release test supplier', productId: 'case', variant: '40mmsteel', slot: 'case',
      sourceUrl: 'https://example.test/release-case', capturedAt: '2026-10-13T10:00:00+02:00',
      measurements: { caseDiameterMm: { value: 40, unit: 'mm' } } });
    const review = createSupplierReviewEvent({ entryId: 'release-entry', revisionId: 'release-revision', record: intake, action: 'approve',
      reviewer: 'Release test reviewer', reason: 'Reviewed exterior source transcription only.', reviewedAt: '2026-10-13T11:00:00+02:00',
      reviewedPaths: ['identity.variant', 'engineering.measurements.caseDiameterMm'] });
    const publication = publishSupplierReview(intake, review);
    useCatalogueStore.getState().addCatalogueItem(publication.component);
    expect(publication.component.researchOnly).toBe(true);
    expect(publication.component.caseConstraints?.outerDiameterMm).toMatchObject({ state: 'recorded', review: 'reviewed', value: 40 });
    expect(publication.component.caseConstraints?.interfaces.crystalSeatDiameterMm.state).toBe('unknown');
    expect(useDesignMatchingStore.getState().search('inst-midcase', intent)).toBe(true);
    expect(useDesignMatchingStore.getState().results.find(result => result.catalogueItemId === publication.component.id)?.group).toBe('needs-evidence');
    expect(useDesignMatchingStore.getState().preview(publication.component.id)).toBe(false);
    expect(useDesignMatchingStore.getState().error).toContain('Discovery');
    const assembly = useWatchAssemblyStore.getState().assembly;
    const projected = { ...assembly, parts: { ...assembly.parts, 'inst-midcase': { ...assembly.parts['inst-midcase']!, catalogueItemId: publication.component.id } } };
    const constraints = deriveCaseConstraints(projected, 'selected-case', useCatalogueStore.getState().items);
    expect(constraints.interfaces.crystalSeatDiameterMm.state).toBe('unknown');
    expect(constraints.outerDiameterMm).toMatchObject({ state: 'recorded', review: 'reviewed' });
  });

  it('a supported published single dial keeps engineering component projection in step with canonical Apply', () => {
    start();
    const intake = createManualSupplierIntake({ supplierId: 'Release test supplier', productId: 'dial', variant: '28.5mm', slot: 'dial',
      sourceUrl: 'https://example.test/release-dial', capturedAt: '2026-10-13T10:00:00+02:00',
      measurements: { outerDiameterMm: { value: 28.5, unit: 'mm' }, thicknessMm: { value: .4, unit: 'mm' } } });
    const review = createSupplierReviewEvent({ entryId: 'release-dial-entry', revisionId: 'release-dial-revision', record: intake,
      action: 'approve', reviewer: 'Release test reviewer', reason: 'Reviewed dial sizes only; installation still unqualified.', reviewedAt: '2026-10-13T11:00:00+02:00',
      reviewedPaths: ['identity.variant', 'engineering.measurements.outerDiameterMm', 'engineering.measurements.thicknessMm'] });
    const publication = publishSupplierReview(intake, review);
    useCatalogueStore.getState().addCatalogueItem(publication.component);
    expect(useDesignMatchingStore.getState().search(targetId, intent)).toBe(true);
    expect(useDesignMatchingStore.getState().preview(publication.component.id), useDesignMatchingStore.getState().error ?? '').toBe(true);
    expect(useDesignMatchingStore.getState().apply(), useDesignMatchingStore.getState().error ?? '').toBe(true);
    assertViewsAgree();
    const component = useWatchComponentStore.getState().components.find(component => component.id === 'watch-component-dial-blank')!;
    expect(component.dimensions.diameterMm).toBe(28.5);
    expect(component.definition.displayName).toBe(publication.component.displayName);
    // A saved design keeps its authored component reference after local publication is withdrawn.
    const restored = structuredClone(useWatchAssemblyStore.getState().assembly);
    useCatalogueStore.setState({ items: useCatalogueStore.getState().items.filter(item => item.id !== publication.component.id) });
    useWatchAssemblyStore.getState().setAssembly(restored);
    expect(useWatchComponentStore.getState().components.find(item => item.id === component.id)?.definition.displayName).toBe(publication.component.displayName);
  });
});
