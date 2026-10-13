import {
  createSupplierDraftBackup, parseSupplierDraftBackup, supplierIntakeCanonical, validateSupplierDraftSnapshot,
  type SupplierDraftBackup, type SupplierDraftSnapshot
} from './supplierDraftPersistence';
import type { SupplierReviewSnapshot } from './supplierReviewPersistence';
import { supplierActivePublications, validateSupplierReviewSnapshot } from '@/stores/supplierReviewStore';

export const SUPPLIER_WORKSPACE_BACKUP_SCHEMA = 'dial-designer/supplier-workspace/v1' as const;
export const MAX_SUPPLIER_WORKSPACE_BACKUP_BYTES = 170 * 1024 * 1024;
export interface SupplierWorkspaceBackup {
  readonly schema: typeof SUPPLIER_WORKSPACE_BACKUP_SCHEMA;
  readonly draftBackup: SupplierDraftBackup;
  readonly reviewSnapshot: SupplierReviewSnapshot;
}
export interface SupplierWorkspaceCounts {
  readonly draftCount: number;
  readonly captureCount: number;
  readonly evidenceCount: number;
  readonly evidenceBytes: number;
  readonly reviewCount: number;
  readonly publicationCount: number;
}
export interface ParsedSupplierWorkspaceBackup {
  readonly queue: SupplierDraftSnapshot;
  readonly review: SupplierReviewSnapshot;
  readonly counts: SupplierWorkspaceCounts;
}
export interface PreparedSupplierWorkspaceRestore extends ParsedSupplierWorkspaceBackup {
  readonly outcome: 'restore' | 'duplicate';
}

const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const withinBackupLimit = (input: unknown): void => {
  if (new TextEncoder().encode(supplierIntakeCanonical(input)).byteLength > MAX_SUPPLIER_WORKSPACE_BACKUP_BYTES) throw new Error('Supplier workspace backup exceeds the 170 MB limit.');
};
const counts = (queue: SupplierDraftSnapshot, review: SupplierReviewSnapshot): SupplierWorkspaceCounts => ({
  draftCount: queue.records.length,
  captureCount: queue.records.reduce((total, entry) => total + entry.versions.length, 0),
  evidenceCount: queue.assets.length,
  evidenceBytes: queue.assets.reduce((total, asset) => total + asset.blob.size, 0),
  reviewCount: review.events.length,
  publicationCount: supplierActivePublications(review.events).length
});

/** Portable evidence bytes and the ordered review journal travel together. No catalogue replay occurs. */
export async function createSupplierWorkspaceBackup(queueInput: SupplierDraftSnapshot, reviewInput: SupplierReviewSnapshot): Promise<SupplierWorkspaceBackup> {
  const queue = await validateSupplierDraftSnapshot(queueInput);
  const review = validateSupplierReviewSnapshot(reviewInput, queue.records);
  const backup: SupplierWorkspaceBackup = {
    schema: SUPPLIER_WORKSPACE_BACKUP_SCHEMA,
    draftBackup: await createSupplierDraftBackup(queue),
    reviewSnapshot: structuredClone(review)
  };
  withinBackupLimit(backup);
  return backup;
}

/** Every publication is recomputed from its exact retained capture and approval.
 * Older approved publications remain valid until explicit withdrawal/update, as in DF6.
 * Imported names are journal data, not authentication of the named reviewer.
 */
export async function parseSupplierWorkspaceBackup(input: unknown): Promise<ParsedSupplierWorkspaceBackup> {
  if (!object(input) || input.schema !== SUPPLIER_WORKSPACE_BACKUP_SCHEMA || Object.keys(input).some(key => !['schema', 'draftBackup', 'reviewSnapshot'].includes(key))) {
    throw new Error('Unsupported supplier workspace backup. Choose a combined workspace v1 backup.');
  }
  withinBackupLimit(input);
  const queue = await parseSupplierDraftBackup(input.draftBackup);
  const review = validateSupplierReviewSnapshot(input.reviewSnapshot, queue.records);
  return { queue, review, counts: counts(queue, review) };
}

/** Hash-validated asset IDs bind actual bytes and all metadata. Generation counters are local.
 * Entry/capture and event order are retained; no histories are sorted or rewritten to merge them.
 */
const workspaceContent = (queue: SupplierDraftSnapshot, review: SupplierReviewSnapshot): string => supplierIntakeCanonical({
  records: [...queue.records].sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
  assets: queue.assets.map(asset => ({ id: asset.id, sourceId: asset.sourceId, name: asset.name, kind: asset.kind,
    usage: asset.usage, mimeType: asset.blob.type, size: asset.blob.size })).sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
  events: review.events
});

/** Bounded first release: restore into an empty workspace, or recognize an exact duplicate.
 * Differing nonempty workspaces cannot overwrite or merge captures and decisions implicitly.
 * This is a pure preparation step; the caller must atomically persist both snapshots after approval.
 */
export async function prepareSupplierWorkspaceRestore({ currentQueue: queueInput, currentReview: reviewInput, backup }: {
  readonly currentQueue: SupplierDraftSnapshot;
  readonly currentReview: SupplierReviewSnapshot;
  readonly backup: unknown;
}): Promise<PreparedSupplierWorkspaceRestore> {
  const currentQueue = await validateSupplierDraftSnapshot(queueInput);
  const currentReview = validateSupplierReviewSnapshot(reviewInput, currentQueue.records);
  const incoming = await parseSupplierWorkspaceBackup(backup);
  if (workspaceContent(currentQueue, currentReview) === workspaceContent(incoming.queue, incoming.review)) {
    return { queue: currentQueue, review: currentReview, counts: counts(currentQueue, currentReview), outcome: 'duplicate' };
  }
  if (currentQueue.records.length || currentQueue.assets.length || currentReview.events.length) {
    throw new Error('This backup differs from your nonempty supplier workspace. Existing drafts and review history were retained. Restore into a clean workspace instead.');
  }
  if (!Number.isSafeInteger(currentQueue.generation + 1) || !Number.isSafeInteger(currentReview.generation + 1)) throw new Error('Local supplier workspace generation is invalid. Nothing was restored.');
  return {
    outcome: 'restore',
    queue: { ...incoming.queue, generation: currentQueue.generation + 1 },
    review: { ...incoming.review, generation: currentReview.generation + 1 },
    counts: incoming.counts
  };
}
