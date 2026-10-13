import type { SupplierDraftSnapshot } from './supplierDraftPersistence';
import type { SupplierReviewSnapshot } from './supplierReviewPersistence';
export interface SupplierWorkspaceRaw {
  readonly queue: unknown;
  readonly review: unknown;
}
type WorkspacePart = 'queue' | 'review';
const schemas = {
  queue: 'dial-designer/supplier-intake-queue/v1',
  review: 'dial-designer/supplier-review-journal/v1'
} as const;
let pending: Promise<IDBDatabase> | null = null;
const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));
const generation = (value: unknown, part: WorkspacePart): number | undefined =>
  value == null
    ? 0
    : object(value) && value.schema === schemas[part] && Number.isSafeInteger(value.generation)
      ? (value.generation as number)
      : undefined;
/** Read old stores without modifying them. Aborting first creation avoids leaving an empty legacy database. */
function readLegacy(name: string, store: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let absent = false;
    const request = indexedDB.open(name);
    request.onupgradeneeded = () => {
      absent = true;
      request.transaction?.abort();
    };
    request.onerror = () =>
      absent
        ? resolve(null)
        : reject(
            request.error ??
              new Error('Legacy supplier storage could not be read. Existing data was retained.')
          );
    request.onblocked = () =>
      reject(new Error('Close other supplier tabs, then reload to migrate local data.'));
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(store)) {
        db.close();
        resolve(null);
        return;
      }
      const tx = db.transaction(store, 'readonly'),
        get = tx.objectStore(store).get('current');
      tx.oncomplete = () => {
        db.close();
        resolve(get.result ?? null);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Legacy supplier data could not be read.'));
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error ?? new Error('Legacy supplier migration was interrupted.'));
      };
    };
  });
}
async function migrate(db: IDBDatabase): Promise<void> {
  const migrated = await new Promise<boolean>((resolve, reject) => {
    const tx = db.transaction('workspace', 'readonly');
    const request = tx.objectStore('workspace').get('migrated');
    tx.oncomplete = () => resolve(request.result === true);
    tx.onerror = () => reject(tx.error ?? new Error("Supplier workspace transaction failed."));
    tx.onabort = () => reject(tx.error ?? new Error("Supplier workspace transaction failed."));
  });
  if (migrated) return;
  const [queue, review] = await Promise.all([
    readLegacy('dial-designer-supplier-intake', 'queue'),
    readLegacy('dial-designer-supplier-reviews', 'journal')
  ]);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('workspace', 'readwrite'),
      store = tx.objectStore('workspace'),
      request = store.get('migrated');
    request.onsuccess = () => {
      if (request.result === true) return;
      if (queue !== null) store.put(queue, 'queue');
      if (review !== null) store.put(review, 'review');
      store.put(true, 'migrated');
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Supplier migration was not saved.'));
    tx.onabort = () => reject(tx.error ?? new Error('Supplier migration was interrupted.'));
  });
}
function open(): Promise<IDBDatabase> {
  if (pending) return pending;
  pending = new Promise<IDBDatabase>((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('Local supplier workspace storage is unavailable.'));
      return;
    }
    const request = indexedDB.open('dial-designer-supplier-workspace', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('workspace'))
        request.result.createObjectStore('workspace');
    };
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open supplier workspace.'));
    request.onblocked = () =>
      reject(new Error('Another tab is blocking supplier workspace storage.'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        pending = null;
      };
      void migrate(db).then(
        () => resolve(db),
        (cause) => {
          db.close();
          reject(cause instanceof Error ? cause : new Error("Supplier workspace migration failed."));
        }
      );
    };
  }).catch((cause) => {
    pending = null;
    throw cause;
  });
  return pending;
}
/** One snapshot read keeps the draft/evidence and decision journal mutually consistent. */
export async function loadSupplierWorkspace(): Promise<SupplierWorkspaceRaw> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workspace', 'readonly'),
      store = tx.objectStore('workspace');
    const queue = store.get('queue'),
      review = store.get('review');
    tx.oncomplete = () => resolve({ queue: queue.result ?? null, review: review.result ?? null });
    tx.onerror = () => reject(tx.error ?? new Error('Could not load supplier workspace.'));
    tx.onabort = () => reject(tx.error ?? new Error('Supplier workspace read was interrupted.'));
  });
}
export async function saveSupplierWorkspacePart(
  part: WorkspacePart,
  snapshot: SupplierDraftSnapshot | SupplierReviewSnapshot,
  expected: number
): Promise<void> {
  if (snapshot.schema !== schemas[part] || snapshot.generation !== expected + 1)
    throw new Error('Invalid supplier workspace generation.');
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('workspace', 'readwrite'),
      store = tx.objectStore('workspace');
    let conflict = false;
    const request = store.get(part);
    request.onsuccess = () => {
      if (generation(request.result, part) !== expected) {
        conflict = true;
        tx.abort();
        return;
      }
      store.put(snapshot, part);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Supplier workspace was not saved.'));
    tx.onabort = () =>
      reject(
        conflict
          ? new Error('Supplier workspace changed in another tab. Reload before saving.')
          : (tx.error ?? new Error('Supplier workspace was not saved. Storage may be full.'))
      );
  });
}
/** Both documents and all evidence blobs are committed in one transaction or neither is changed. */
export async function restoreSupplierWorkspaceAtomic(
  queue: SupplierDraftSnapshot,
  review: SupplierReviewSnapshot,
  expected: { queue: number; review: number }
): Promise<void> {
  if (queue.generation !== expected.queue + 1 || review.generation !== expected.review + 1)
    throw new Error('Invalid supplier restore generation.');
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('workspace', 'readwrite'),
      store = tx.objectStore('workspace');
    const queueRequest = store.get('queue'),
      reviewRequest = store.get('review');
    let seen = 0,
      conflict = false;
    const check = () => {
      if (++seen < 2) return;
      if (
        generation(queueRequest.result, 'queue') !== expected.queue ||
        generation(reviewRequest.result, 'review') !== expected.review
      ) {
        conflict = true;
        tx.abort();
        return;
      }
      store.put(queue, 'queue');
      store.put(review, 'review');
    };
    queueRequest.onsuccess = check;
    reviewRequest.onsuccess = check;
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Supplier workspace restore was not saved.'));
    tx.onabort = () =>
      reject(
        conflict
          ? new Error(
              'Supplier workspace changed after the restore was prepared. Prepare it again.'
            )
          : (tx.error ?? new Error('Restore failed. Existing supplier data was retained.'))
      );
  });
}
