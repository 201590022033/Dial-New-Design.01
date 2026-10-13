import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const memory = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) });
});
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { listCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import type { SupplierListing } from '@/domain/catalogue/types';
import { defaultDesignIntent } from '@/domain/design-first/designIntent';
import { useDesignMatchingStore, ownsDesignMatchingPreview } from '@/stores/designMatchingStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useSourcingStore } from '@/stores/sourcingStore';

const targetId = 'inst-dial-blank';
const candidateId = 'cat-dial-sunburst-blue-285';
const intent = { ...defaultDesignIntent(), preserveDimensions: false, preserveAppearance: false };
const startPreview = () => {
  expect(useDesignMatchingStore.getState().search(targetId, intent)).toBe(true);
  expect(useDesignMatchingStore.getState().preview(candidateId), useDesignMatchingStore.getState().error ?? '').toBe(true);
};
const sourceFixture = (id: string, catalogueItemId: string): SupplierListing => ({
  id, catalogueItemId, supplierName: 'Synthetic test offer', unitPrice: null, currency: 'USD', status: 'active', verificationStatus: 'unverified', stockStatus: 'unknown',
  provenance: { dataSource: `fixture://${id}`, sourceType: 'demo-fixture', isDemonstrationFixture: true }
});

describe('DF4 deliberate design matching workflow', () => {
  beforeEach(() => {
    useDesignMatchingStore.getState().clear();
    const assembly = createDefaultWatchAssembly();
    useCatalogueStore.setState({ items: structuredClone(listCatalogueItems()), supplierListings: [sourceFixture('fixture-blue-offer', candidateId), sourceFixture('fixture-other-offer', 'cat-minute-hand')] });
    useWatchAssemblyStore.getState().setAssembly(assembly);
    useWatchAssemblyStore.getState().clearAssemblyHistory();
    useConfiguratorUIStore.setState({ previewAssembly: null, previewCandidateItem: null, previewPartInstanceId: null, previewStatus: 'none', previewOrigin: null,
      previewError: null, archetypePreviewAssembly: null, previewingVersionId: null, lockedPartIds: new Set(), lockedStyles: {} });
    useSourcingStore.getState().loadSourcingPlan({ assemblyId: assembly.metadata.id, selections: { [targetId]: 'fixture-old-offer', 'inst-minute-hand': 'fixture-unrelated-offer' }, updatedAtIso: '2026-10-12T12:00:00+02:00' });
  });
  it('searches and previews transiently; Cancel restores canonical rendering without editing sourcing', () => {
    const before = JSON.stringify(useWatchAssemblyStore.getState().assembly);
    const sourcing = JSON.stringify(useSourcingStore.getState().sourcingPlan);
    startPreview();
    expect(ownsDesignMatchingPreview()).toBe(true);
    expect(useConfiguratorUIStore.getState().getActiveAssembly().parts[targetId]!.catalogueItemId).toBe(candidateId);
    expect(JSON.stringify(useWatchAssemblyStore.getState().assembly)).toBe(before);
    expect(JSON.stringify(useSourcingStore.getState().sourcingPlan)).toBe(sourcing);
    useDesignMatchingStore.getState().cancel();
    expect(useConfiguratorUIStore.getState().getActiveAssembly()).toBe(useWatchAssemblyStore.getState().assembly);
    expect(JSON.stringify(useWatchAssemblyStore.getState().assembly)).toBe(before);
    expect(JSON.stringify(useSourcingStore.getState().sourcingPlan)).toBe(sourcing);
  });
  it('commits the replacement and an explicitly chosen matching offer, retaining unrelated sourcing', () => {
    startPreview();
    expect(useDesignMatchingStore.getState().previewTicket!.result.group).toBe('needs-evidence');
    expect(useDesignMatchingStore.getState().selectSupplier('fixture-other-offer')).toBe(false);
    expect(useDesignMatchingStore.getState().selectSupplier('fixture-blue-offer')).toBe(true);
    expect(useDesignMatchingStore.getState().apply(), useDesignMatchingStore.getState().error ?? '').toBe(true);
    expect(useWatchAssemblyStore.getState().assembly.parts[targetId]!.catalogueItemId).toBe(candidateId);
    expect(useWatchAssemblyStore.getState().dirty).toBe(true);
    expect(useSourcingStore.getState().sourcingPlan.selections[targetId]).toBe('fixture-blue-offer');
    expect(useSourcingStore.getState().sourcingPlan.selections['inst-minute-hand']).toBe('fixture-unrelated-offer');
    expect(useDesignMatchingStore.getState().status).toBe('applied');
    expect(ownsDesignMatchingPreview()).toBe(false);
    expect(useConfiguratorUIStore.getState().getActiveAssembly()).toBe(useWatchAssemblyStore.getState().assembly);
  });
  it('clears the replaced component offer when no new offer was explicitly chosen', () => {
    startPreview();
    expect(useDesignMatchingStore.getState().apply()).toBe(true);
    expect(useSourcingStore.getState().sourcingPlan.selections[targetId]).toBeNull();
    expect(useSourcingStore.getState().sourcingPlan.selections['inst-minute-hand']).toBe('fixture-unrelated-offer');
  });
  it('rebuilds from current canonical state and preserves unrelated edits made during preview', () => {
    startPreview();
    useWatchAssemblyStore.getState().updatePart('inst-minute-hand', { color: '#123456' });
    expect(useDesignMatchingStore.getState().apply(), useDesignMatchingStore.getState().error ?? '').toBe(true);
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-minute-hand']!.color).toBe('#123456');
    expect(useWatchAssemblyStore.getState().assembly.parts[targetId]!.catalogueItemId).toBe(candidateId);
  });
  it('refuses a changed target proposal and leaves the current edit intact', () => {
    startPreview();
    const part = useWatchAssemblyStore.getState().assembly.parts[targetId]!;
    useWatchAssemblyStore.getState().updatePart(targetId, { dimensions: { ...part.dimensions, diameterMm: part.dimensions.diameterMm + 1 } });
    const current = JSON.stringify(useWatchAssemblyStore.getState().assembly);
    expect(useDesignMatchingStore.getState().apply()).toBe(false);
    expect(useDesignMatchingStore.getState().error).toContain('proposed changes');
    expect(JSON.stringify(useWatchAssemblyStore.getState().assembly)).toBe(current);
    expect(useConfiguratorUIStore.getState().previewAssembly).toBeNull();
  });
  it.each(['physical', 'style', 'canonical'] as const)('rechecks %s locks after preview', lock => {
    startPreview();
    if (lock === 'physical') useConfiguratorUIStore.setState({ lockedPartIds: new Set([targetId]) });
    if (lock === 'style') useConfiguratorUIStore.setState({ lockedStyles: { [targetId]: true } });
    if (lock === 'canonical') useWatchAssemblyStore.getState().setPartLocked(targetId, true);
    const current = JSON.stringify(useWatchAssemblyStore.getState().assembly);
    expect(useDesignMatchingStore.getState().apply()).toBe(false);
    expect(JSON.stringify(useWatchAssemblyStore.getState().assembly)).toBe(current);
    expect(useSourcingStore.getState().sourcingPlan.selections[targetId]).toBe('fixture-old-offer');
  });
  it('refuses candidate/evidence changes between preview and Apply', () => {
    startPreview();
    useCatalogueStore.setState({ items: useCatalogueStore.getState().items.map(item => item.id === candidateId ? { ...item, metadata: { ...item.metadata, revision: 'changed-evidence' } } : item) });
    expect(useDesignMatchingStore.getState().apply()).toBe(false);
    expect(useDesignMatchingStore.getState().error).toContain('candidate record has changed');
    expect(useWatchAssemblyStore.getState().assembly.parts[targetId]!.catalogueItemId).not.toBe(candidateId);
  });
  it('refuses an offer changed after explicit selection', () => {
    startPreview();
    expect(useDesignMatchingStore.getState().selectSupplier('fixture-blue-offer')).toBe(true);
    useCatalogueStore.getState().updateSupplierListing('fixture-blue-offer', { sku: 'changed-variant' });
    expect(useDesignMatchingStore.getState().apply()).toBe(false);
    expect(useDesignMatchingStore.getState().error).toContain('supplier offer changed');
  });
  it('refuses to overwrite another preview and Cancel only clears its own preview', () => {
    startPreview();
    const other = structuredClone(useWatchAssemblyStore.getState().assembly);
    useConfiguratorUIStore.setState({ previewAssembly: other, previewOrigin: 'options' });
    useDesignMatchingStore.getState().cancel();
    expect(useConfiguratorUIStore.getState().previewAssembly).toBe(other);
    expect(useDesignMatchingStore.getState().preview(candidateId)).toBe(false);
    expect(useConfiguratorUIStore.getState().previewAssembly).toBe(other);
  });
  it('requires a new search when current content changes before Preview', () => {
    expect(useDesignMatchingStore.getState().search(targetId, intent)).toBe(true);
    useWatchAssemblyStore.getState().updatePart('inst-minute-hand', { color: '#123456' });
    expect(useDesignMatchingStore.getState().preview(candidateId)).toBe(false);
    expect(useDesignMatchingStore.getState().error).toContain('fresh search brief');
    expect(useConfiguratorUIStore.getState().previewAssembly).toBeNull();
  });
  it('blocks discovery records from becoming previews or committed parts', () => {
    useCatalogueStore.setState({ items: useCatalogueStore.getState().items.map(item => item.id === candidateId ? { ...item, researchOnly: true } : item) });
    expect(useDesignMatchingStore.getState().search(targetId, intent)).toBe(true);
    expect(useDesignMatchingStore.getState().preview(candidateId)).toBe(false);
    expect(useDesignMatchingStore.getState().error).toContain('Discovery records');
    expect(useDesignMatchingStore.getState().apply()).toBe(false);
    expect(useWatchAssemblyStore.getState().assembly.parts[targetId]!.catalogueItemId).not.toBe(candidateId);
  });
  it('does not permit the legacy clone-commit Apply path for its owned preview', () => {
    startPreview();
    const before = JSON.stringify(useWatchAssemblyStore.getState().assembly);
    expect(useConfiguratorUIStore.getState().applyPreview()).toBe(false);
    expect(JSON.stringify(useWatchAssemblyStore.getState().assembly)).toBe(before);
    expect(useDesignMatchingStore.getState().apply()).toBe(true);
  });
  it('preserves new saved preferences and refuses the older proposal', () => {
    startPreview();
    useWatchAssemblyStore.getState().setDesignIntent({ ...defaultDesignIntent(), styleNotes: 'New saved direction' });
    expect(useDesignMatchingStore.getState().apply()).toBe(false);
    expect(useDesignMatchingStore.getState().error).toContain('Saved design preferences changed');
    expect(useWatchAssemblyStore.getState().assembly.designConfig?.designIntent?.styleNotes).toBe('New saved direction');
  });
});
