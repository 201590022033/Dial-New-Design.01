import { describe, expect, it } from 'vitest';
import { createManualSupplierIntake } from '@/domain/design-first/supplierIntake';
import { createSupplierReviewEvent, publishSupplierReview, supplierReviewFields } from '@/domain/design-first/supplierReview';
import { emptySupplierDraftSnapshot, mergeSupplierIntake } from '@/services/supplierDraftPersistence';
import { emptySupplierReviewSnapshot, type SupplierReviewSnapshot } from '@/services/supplierReviewPersistence';
import { createSupplierWorkspaceBackup, parseSupplierWorkspaceBackup, prepareSupplierWorkspaceRestore } from '@/services/supplierWorkspaceBackup';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { useCatalogueStore } from '@/stores/catalogueStore';

const capture = (sourceText = 'Original test capture', productId = 'Crystal-315') => createManualSupplierIntake({
  supplierId: 'Workspace backup test supplier', productId, variant: '31.5 mm flat', sourceUrl: 'https://example.com/workspace-crystal',
  capturedAt: '2026-10-13T10:00:00Z', slot: 'crystal', sourceText,
  measurements: { outerDiameterMm: { value: 31.5, unit: 'mm' }, thicknessMm: { value: 2, unit: 'mm' } },
  attributes: { material: 'sapphire', texture: 'polished' }, unitPrice: 12, currency: 'USD', shippingPrice: null
});
async function fixture() {
  const record = capture();
  const merged = await mergeSupplierIntake(emptySupplierDraftSnapshot(), record, [{ sourceId: record.draft.sources[0]!.id,
    name: 'sample-drawing.pdf', kind: 'drawing', blob: new Blob(['%PDF-test-evidence'], { type: 'application/pdf' }) }]);
  const queue = merged.snapshot, entry = queue.records[0]!, revision = entry.versions[0]!;
  const review = createSupplierReviewEvent({ entryId: entry.id, revisionId: revision.id, record, action: 'approve', reviewer: 'Test reviewer',
    reason: 'Checked test source transcription', reviewedAt: '2026-10-13T10:01:00Z', reviewedPaths: supplierReviewFields(record).filter(field => field.eligible).map(field => field.path) });
  const journal: SupplierReviewSnapshot = { ...emptySupplierReviewSnapshot(), generation: 2, events: [
    { id: review.id, kind: 'review', review },
    { id: 'test-publication-event', kind: 'publish', entryId: entry.id, revisionId: revision.id, reviewEventId: review.id,
      actor: 'Test reviewer', reason: 'Publish reviewed test capture locally', at: '2026-10-13T10:02:00Z', publication: publishSupplierReview(record, review) }
  ] };
  return { queue, journal, entry, revision };
}

describe('DF7 portable combined supplier workspace backup', () => {
  it('round-trips exact evidence bytes, sources, capture IDs and ordered review history', async () => {
    const { queue, journal } = await fixture();
    const backup = await createSupplierWorkspaceBackup(queue, journal);
    const parsed = await parseSupplierWorkspaceBackup(JSON.parse(JSON.stringify(backup)));
    expect(parsed.queue.records).toEqual(queue.records);
    expect(parsed.review.events).toEqual(journal.events);
    expect(parsed.counts).toMatchObject({ draftCount: 1, captureCount: 1, evidenceCount: queue.assets.length, reviewCount: 2, publicationCount: 1 });
    const drawing = parsed.queue.assets.find(asset => asset.name === 'sample-drawing.pdf')!;
    expect(await drawing.blob.text()).toBe('%PDF-test-evidence');
    expect(parsed.queue.assets.map(asset => asset.id)).toEqual(queue.assets.map(asset => asset.id));
  });
  it('prepares an empty-workspace restore without changing original revision or event IDs', async () => {
    const { queue, journal } = await fixture();
    const prepared = await prepareSupplierWorkspaceRestore({ currentQueue: { ...emptySupplierDraftSnapshot(), generation: 5 },
      currentReview: { ...emptySupplierReviewSnapshot(), generation: 7 }, backup: await createSupplierWorkspaceBackup(queue, journal) });
    expect(prepared.outcome).toBe('restore');
    expect(prepared.queue.generation).toBe(6);
    expect(prepared.review.generation).toBe(8);
    expect(prepared.queue.records).toEqual(queue.records);
    expect(prepared.review.events).toEqual(journal.events);
  });
  it('recognizes an exact duplicate across local generation counters and asset ordering', async () => {
    const { queue, journal } = await fixture();
    const prepared = await prepareSupplierWorkspaceRestore({ currentQueue: { ...queue, generation: 11, assets: [...queue.assets].reverse() },
      currentReview: { ...journal, generation: 15 }, backup: await createSupplierWorkspaceBackup(queue, journal) });
    expect(prepared.outcome).toBe('duplicate');
    expect(prepared.queue.generation).toBe(11);
    expect(prepared.review.generation).toBe(15);
    expect(prepared.review.events).toEqual(journal.events);
  });
  it('refuses a differing nonempty workspace rather than overwriting or merging its history', async () => {
    const { queue, journal } = await fixture();
    const currentQueue = (await mergeSupplierIntake(emptySupplierDraftSnapshot(), capture('Other capture', 'Other-product'))).snapshot;
    const before = structuredClone(currentQueue);
    await expect(prepareSupplierWorkspaceRestore({ currentQueue, currentReview: emptySupplierReviewSnapshot(), backup: await createSupplierWorkspaceBackup(queue, journal) })).rejects.toThrow('nonempty supplier workspace');
    expect(currentQueue).toEqual(before);
  });
  it('retains a valid older publication when a newer capture is still unreviewed', async () => {
    const { queue, journal } = await fixture();
    const latestQueue = (await mergeSupplierIntake(queue, capture('Newer unreviewed capture'))).snapshot;
    expect(latestQueue.records[0]!.versions).toHaveLength(2);
    const parsed = await parseSupplierWorkspaceBackup(await createSupplierWorkspaceBackup(latestQueue, journal));
    expect(parsed.counts).toMatchObject({ captureCount: 2, publicationCount: 1 });
    expect(parsed.review.events).toEqual(journal.events);
  });
  it('retains withdrawn publication history without resurrecting it', async () => {
    const { queue, journal, entry } = await fixture();
    const withdrawn: SupplierReviewSnapshot = { ...journal, generation: 3, events: [...journal.events,
      { id: 'test-withdrawal', kind: 'withdraw', entryId: entry.id, actor: 'Test reviewer', reason: 'Withdraw test publication', at: '2026-10-13T10:03:00Z' }] };
    const parsed = await parseSupplierWorkspaceBackup(await createSupplierWorkspaceBackup(queue, withdrawn));
    expect(parsed.counts.publicationCount).toBe(0);
    expect(parsed.review.events).toEqual(withdrawn.events);
  });
  it('rejects altered publication data instead of accepting arbitrary catalogue payloads', async () => {
    const { queue, journal } = await fixture();
    const backup = await createSupplierWorkspaceBackup(queue, journal);
    const publication = backup.reviewSnapshot.events.find(event => event.kind === 'publish')!;
    if (publication.kind !== 'publish') throw new Error('Expected publication fixture.');
    const changed = { ...backup, reviewSnapshot: { ...backup.reviewSnapshot, events: backup.reviewSnapshot.events.map(event => event.id === publication.id
      ? { ...publication, publication: { ...publication.publication, component: { ...publication.publication.component, nominalDimensions: { ...publication.publication.component.nominalDimensions, diameterMm: 99 } } } } : event) } };
    await expect(parseSupplierWorkspaceBackup(changed)).rejects.toThrow('outside its approved capture');
  });
  it('rejects missing capture references, reordered decisions and duplicate event IDs', async () => {
    const { queue, journal } = await fixture();
    const backup = await createSupplierWorkspaceBackup(queue, journal);
    await expect(parseSupplierWorkspaceBackup({ ...backup, draftBackup: { ...backup.draftBackup, records: [], assets: [] } })).rejects.toThrow('capture');
    await expect(parseSupplierWorkspaceBackup({ ...backup, reviewSnapshot: { ...journal, events: [...journal.events].reverse() } })).rejects.toThrow('matching current approval');
    await expect(parseSupplierWorkspaceBackup({ ...backup, reviewSnapshot: { ...journal, events: [...journal.events, journal.events[0]] } })).rejects.toThrow('Duplicate');
  });
  it('rejects missing or altered asset bytes before preparing restore', async () => {
    const { queue, journal } = await fixture();
    const backup = await createSupplierWorkspaceBackup(queue, journal);
    await expect(parseSupplierWorkspaceBackup({ ...backup, draftBackup: { ...backup.draftBackup, assets: [] } })).rejects.toThrow('evidence assets');
    const drawing = backup.draftBackup.assets.find(asset => asset.name === 'sample-drawing.pdf')!;
    const changed = { ...backup, draftBackup: { ...backup.draftBackup, assets: backup.draftBackup.assets.map(asset => asset.id === drawing.id
      ? { ...asset, dataBase64: btoa('x'.repeat(drawing.size)) } : asset) } };
    await expect(parseSupplierWorkspaceBackup(changed)).rejects.toThrow('content or metadata changed');
  });
  it('rejects unsupported schemas and unexpected publication envelopes', async () => {
    const { queue, journal } = await fixture();
    const backup = await createSupplierWorkspaceBackup(queue, journal);
    await expect(parseSupplierWorkspaceBackup({ ...backup, schema: 'dial-designer/supplier-workspace/v2' })).rejects.toThrow('Unsupported');
    await expect(parseSupplierWorkspaceBackup({ ...backup, publications: [] })).rejects.toThrow('Unsupported');
    await expect(parseSupplierWorkspaceBackup(backup.draftBackup)).rejects.toThrow('combined workspace');
  });
  it('never mutates canonical assembly, sourcing or catalogue while exporting/parsing/preparing', async () => {
    const before = JSON.stringify([useWatchAssemblyStore.getState().assembly, useSourcingStore.getState().sourcingPlan,
      useCatalogueStore.getState().items, useCatalogueStore.getState().supplierListings]);
    const { queue, journal } = await fixture();
    const queueBefore = structuredClone(queue), journalBefore = structuredClone(journal);
    const backup = await createSupplierWorkspaceBackup(queue, journal);
    await parseSupplierWorkspaceBackup(backup);
    await prepareSupplierWorkspaceRestore({ currentQueue: emptySupplierDraftSnapshot(), currentReview: emptySupplierReviewSnapshot(), backup });
    expect(queue).toEqual(queueBefore);
    expect(journal).toEqual(journalBefore);
    expect(JSON.stringify([useWatchAssemblyStore.getState().assembly, useSourcingStore.getState().sourcingPlan,
      useCatalogueStore.getState().items, useCatalogueStore.getState().supplierListings])).toBe(before);
  });
});
