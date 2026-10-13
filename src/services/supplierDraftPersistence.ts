import { loadSupplierWorkspace, saveSupplierWorkspacePart } from './supplierWorkspacePersistence';
import type { SupplierDraft } from '@/domain/design-first/supplierDraft';
import { parseSupplierIntake, supplierIntakeIdentity, type SupplierIntakeRecord } from '@/domain/design-first/supplierIntake';

export const SUPPLIER_QUEUE_SCHEMA = 'dial-designer/supplier-intake-queue/v1' as const;
export const SUPPLIER_BACKUP_SCHEMA = 'dial-designer/supplier-intake-backup/v1' as const;
export const MAX_EVIDENCE_ASSET_BYTES = 10 * 1024 * 1024;
const MAX_REVISION_ASSET_BYTES = 40 * 1024 * 1024;
const MAX_QUEUE_ASSET_BYTES = 100 * 1024 * 1024;
export type SupplierEvidenceAssetKind = 'source-text' | 'source-json' | 'drawing' | 'image';
type ImageUsage = SupplierDraft['images'][number]['usage'];
export interface SupplierEvidenceAssetInput {
  readonly sourceId: string;
  readonly name: string;
  readonly kind: SupplierEvidenceAssetKind;
  readonly blob: Blob;
  readonly usage?: ImageUsage;
}
export interface SupplierEvidenceAsset extends SupplierEvidenceAssetInput {
  readonly id: string;
  readonly usage: ImageUsage;
}
export interface SupplierDraftRevision {
  readonly id: string;
  readonly record: SupplierIntakeRecord;
  readonly assetIds: readonly string[];
  readonly savedAt: string;
}
export interface SupplierDraftQueueEntry {
  readonly id: string;
  readonly identity: string;
  readonly versions: readonly SupplierDraftRevision[];
}
export interface SupplierDraftSnapshot {
  readonly schema: typeof SUPPLIER_QUEUE_SCHEMA;
  readonly generation: number;
  readonly records: readonly SupplierDraftQueueEntry[];
  readonly assets: readonly SupplierEvidenceAsset[];
}
export interface SupplierDraftBackup {
  readonly schema: typeof SUPPLIER_BACKUP_SCHEMA;
  readonly records: readonly SupplierDraftQueueEntry[];
  readonly assets: readonly {
    readonly id: string; readonly sourceId: string; readonly name: string; readonly kind: SupplierEvidenceAssetKind;
    readonly mimeType: string; readonly size: number; readonly usage: ImageUsage; readonly dataBase64: string;
  }[];
}
/** Save must atomically compare generation and persist records + all evidence assets. */
export interface SupplierDraftPersistence {
  load: () => Promise<unknown>;
  save: (snapshot: SupplierDraftSnapshot, expectedGeneration: number) => Promise<void>;
}

export const supplierIntakeCanonical = (value: unknown): string => JSON.stringify(value, (_key, entry: unknown) =>
  entry && typeof entry === 'object' && !Array.isArray(entry)
    ? Object.fromEntries(Object.entries(entry).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)) : entry) ?? 'undefined';
const digest = async (value: string | ArrayBuffer): Promise<string> => {
  if (!globalThis.crypto?.subtle) throw new Error('Secure evidence hashing is unavailable in this browser.');
  const buffer = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
};
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const allowedMime: Record<SupplierEvidenceAssetKind, readonly string[]> = {
  'source-text': ['text/plain'], 'source-json': ['application/json'], drawing: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'], image: ['image/png', 'image/jpeg', 'image/webp']
};
export async function prepareSupplierEvidenceAsset(input: SupplierEvidenceAssetInput): Promise<SupplierEvidenceAsset> {
  if (!input || !nonempty(input.sourceId) || !nonempty(input.name) || input.name.length > 200 || !allowedMime[input.kind]) throw new Error('Evidence file needs a source, name and supported kind.');
  if (!(input.blob instanceof Blob) || input.blob.size > MAX_EVIDENCE_ASSET_BYTES || input.blob.size === 0) throw new Error('Evidence files must be nonempty and no larger than 10 MB.');
  const mime = input.blob.type.split(';')[0]!.toLowerCase();
  if (!allowedMime[input.kind].includes(mime)) throw new Error('Use text/JSON source captures, PDF drawings, or PNG/JPEG/WebP images.');
  const usage: ImageUsage = input.usage ?? { state: 'unknown', reason: 'No documented reuse permission supplied.' };
  if (usage.state === 'unknown' ? !nonempty(usage.reason) : usage.state !== 'permitted' || !nonempty(usage.basis) || !nonempty(usage.evidenceSourceId) || typeof usage.attribution !== 'string' || typeof usage.restrictions !== 'string') throw new Error('Evidence asset usage metadata is invalid.');
  const content = await digest(await input.blob.arrayBuffer());
  const id = `asset-${await digest(supplierIntakeCanonical({ sourceId: input.sourceId, name: input.name, kind: input.kind, mime, usage, content }))}`;
  return { id, sourceId: input.sourceId, name: input.name, kind: input.kind, blob: input.blob, usage };
}
const assetSourcesValid = (record: SupplierIntakeRecord, assets: readonly SupplierEvidenceAsset[]): boolean => {
  const sources = new Set(record.draft.sources.map(source => source.id));
  return assets.every(asset => sources.has(asset.sourceId) && (asset.usage.state !== 'permitted' || sources.has(asset.usage.evidenceSourceId)));
};

export async function mergeSupplierIntake(snapshot: SupplierDraftSnapshot, input: unknown, suppliedAssets: readonly SupplierEvidenceAssetInput[] = []): Promise<{ snapshot: SupplierDraftSnapshot; entryId: string; duplicate: boolean }> {
  const record = parseSupplierIntake(input);
  const generated: SupplierEvidenceAssetInput[] = [];
  for (const capture of record.captures) {
    if (capture.sourceText) generated.push({ sourceId: capture.sourceId, name: `${capture.id.slice(0, 170)}.txt`, kind: 'source-text', blob: new Blob([capture.sourceText], { type: 'text/plain' }) });
    if (capture.raw !== undefined) generated.push({ sourceId: capture.sourceId, name: `${capture.id.slice(0, 170)}.json`, kind: 'source-json', blob: new Blob([supplierIntakeCanonical(capture.raw)], { type: 'application/json' }) });
  }
  const assets = await Promise.all([...generated, ...suppliedAssets].map(prepareSupplierEvidenceAsset));
  if (!assetSourcesValid(record, assets)) throw new Error('Every evidence file and permission must refer to a source in this capture.');
  const identity = supplierIntakeIdentity(record);
  const entryId = `intake-${await digest(identity)}`;
  const existing = snapshot.records.find(entry => entry.id === entryId);
  const sameCapture = [...(existing?.versions ?? [])].reverse().find(version => supplierIntakeCanonical(version.record) === supplierIntakeCanonical(record));
  const retainedAssets = sameCapture ? snapshot.assets.filter(asset => sameCapture.assetIds.includes(asset.id)) : [];
  const revisionAssets = [...new Map([...retainedAssets, ...assets].map(asset => [asset.id, asset])).values()].sort((left, right) => left.id.localeCompare(right.id));
  if (revisionAssets.reduce((bytes, asset) => bytes + asset.blob.size, 0) > MAX_REVISION_ASSET_BYTES) throw new Error('One intake capture may contain at most 40 MB of evidence.');
  const assetIds = revisionAssets.map(asset => asset.id);
  const revisionId = `capture-${await digest(supplierIntakeCanonical({ record, assetIds }))}`;
  if (existing?.versions.some(version => version.id === revisionId)) return { snapshot, entryId, duplicate: true };
  const revision: SupplierDraftRevision = { id: revisionId, record, assetIds, savedAt: new Date().toISOString() };
  const entry: SupplierDraftQueueEntry = { id: entryId, identity, versions: [...(existing?.versions ?? []), revision] };
  if (entry.versions.length > 100) throw new Error('This product has reached the 100-capture local limit. Export a backup before continuing.');
  const records = [...snapshot.records.filter(item => item.id !== entryId), entry].sort((left, right) => left.id.localeCompare(right.id));
  if (records.length > 200) throw new Error('The local intake queue supports at most 200 product identities.');
  const allAssets = [...new Map([...snapshot.assets, ...revisionAssets].map(asset => [asset.id, asset])).values()].sort((left, right) => left.id.localeCompare(right.id));
  if (allAssets.reduce((bytes, asset) => bytes + asset.blob.size, 0) > MAX_QUEUE_ASSET_BYTES) throw new Error('The local evidence queue has reached its 100 MB limit. Export a backup before continuing.');
  return { snapshot: { schema: SUPPLIER_QUEUE_SCHEMA, generation: snapshot.generation + 1, records, assets: allAssets }, entryId, duplicate: false };
}

/** Full boundary validation on restart; corrupt queues never become an empty writable queue. */
export async function validateSupplierDraftSnapshot(input: unknown): Promise<SupplierDraftSnapshot> {
  if (!object(input) || input.schema !== SUPPLIER_QUEUE_SCHEMA || !Number.isSafeInteger(input.generation) || (input.generation as number) < 0 || !Array.isArray(input.records) || input.records.length > 200 || !Array.isArray(input.assets)) throw new Error('Saved supplier queue is corrupt or uses an unsupported version. Existing data has been retained; recover it before saving here.');
  const assets: SupplierEvidenceAsset[] = [];
  for (const raw of input.assets) {
    if (!object(raw) || !nonempty(raw.id)) throw new Error('Saved evidence asset is corrupt.');
    const asset = await prepareSupplierEvidenceAsset(raw as unknown as SupplierEvidenceAssetInput);
    if (asset.id !== raw.id) throw new Error('Saved evidence asset content or metadata changed.');
    assets.push(asset);
  }
  if (new Set(assets.map(asset => asset.id)).size !== assets.length || assets.reduce((bytes, asset) => bytes + asset.blob.size, 0) > MAX_QUEUE_ASSET_BYTES) throw new Error('Saved evidence assets exceed limits or contain duplicate IDs.');
  const records: SupplierDraftQueueEntry[] = [];
  const usedAssets = new Set<string>();
  for (const raw of input.records) {
    if (!object(raw) || !nonempty(raw.id) || !nonempty(raw.identity) || !Array.isArray(raw.versions) || raw.versions.length === 0 || raw.versions.length > 100) throw new Error('Saved supplier entry is corrupt.');
    const versions: SupplierDraftRevision[] = [];
    for (const rawVersion of raw.versions) {
      if (!object(rawVersion) || !nonempty(rawVersion.id) || !nonempty(rawVersion.savedAt) || !Number.isFinite(Date.parse(rawVersion.savedAt)) || !Array.isArray(rawVersion.assetIds) || !rawVersion.assetIds.every(nonempty)) throw new Error('Saved supplier capture is corrupt.');
      const record = parseSupplierIntake(rawVersion.record);
      const identity = supplierIntakeIdentity(record);
      if (raw.identity !== identity || raw.id !== `intake-${await digest(identity)}`) throw new Error('Saved supplier identity differs from its capture.');
      const linkedAssets = rawVersion.assetIds.map(id => assets.find(asset => asset.id === id));
      if (linkedAssets.some(asset => !asset) || new Set(rawVersion.assetIds).size !== rawVersion.assetIds.length || !assetSourcesValid(record, linkedAssets as SupplierEvidenceAsset[])) throw new Error('Saved supplier capture has missing or unrelated evidence assets.');
      if (rawVersion.id !== `capture-${await digest(supplierIntakeCanonical({ record, assetIds: rawVersion.assetIds }))}`) throw new Error('Saved supplier capture content changed.');
      rawVersion.assetIds.forEach(id => usedAssets.add(id));
      versions.push({ id: rawVersion.id, savedAt: rawVersion.savedAt, record, assetIds: rawVersion.assetIds });
    }
    if (new Set(versions.map(version => version.id)).size !== versions.length) throw new Error('Saved supplier entry contains duplicate captures.');
    records.push({ id: raw.id, identity: raw.identity, versions });
  }
  if (new Set(records.map(record => record.id)).size !== records.length || usedAssets.size !== assets.length) throw new Error('Saved supplier queue contains duplicate entries or orphan evidence.');
  return { schema: SUPPLIER_QUEUE_SCHEMA, generation: input.generation as number, records, assets };
}

export const emptySupplierDraftSnapshot = (): SupplierDraftSnapshot => ({ schema: SUPPLIER_QUEUE_SCHEMA, generation: 0, records: [], assets: [] });
export async function createSupplierDraftBackup(snapshot: SupplierDraftSnapshot): Promise<SupplierDraftBackup> {
  const assets = await Promise.all(snapshot.assets.map(async asset => {
    const bytes = new Uint8Array(await asset.blob.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    return { id: asset.id, sourceId: asset.sourceId, name: asset.name, kind: asset.kind, mimeType: asset.blob.type, size: bytes.length, usage: asset.usage, dataBase64: btoa(binary) };
  }));
  return { schema: SUPPLIER_BACKUP_SCHEMA, records: structuredClone(snapshot.records), assets };
}
export async function parseSupplierDraftBackup(input: unknown): Promise<SupplierDraftSnapshot> {
  if (!object(input) || input.schema !== SUPPLIER_BACKUP_SCHEMA || !Array.isArray(input.records) || !Array.isArray(input.assets)) throw new Error('Unsupported supplier intake backup.');
  const assets = input.assets.map(raw => {
    if (!object(raw) || !nonempty(raw.dataBase64) || raw.dataBase64.length > Math.ceil(MAX_EVIDENCE_ASSET_BYTES / 3) * 4 || !nonempty(raw.mimeType) || typeof raw.size !== 'number') throw new Error('Backup evidence asset is invalid or too large.');
    const binary = atob(raw.dataBase64);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    if (bytes.length !== raw.size) throw new Error('Backup evidence asset size does not match its content.');
    return { id: raw.id, sourceId: raw.sourceId, name: raw.name, kind: raw.kind, usage: raw.usage, blob: new Blob([bytes], { type: raw.mimeType }) };
  });
  return validateSupplierDraftSnapshot({ schema: SUPPLIER_QUEUE_SCHEMA, generation: 0, records: input.records, assets });
}

/** Adapter shares the atomic workspace database; legacy data migrates without deletion. */
export function createIndexedDbSupplierDraftPersistence(): SupplierDraftPersistence {
  return { load: async () => (await loadSupplierWorkspace()).queue,
    save: (snapshot, expectedGeneration) => saveSupplierWorkspacePart('queue', snapshot, expectedGeneration) };
}
