import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { SavedDesignVersion } from './configuratorTypes';
import { deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';

const MAX_AUTOMATIC_CHECKPOINTS = 8;

export interface VersionDiff {
  changedParts: Array<{
    instanceId: string;
    oldCatalogueId?: string;
    newCatalogueId: string;
  }>;
  costDifference: number;
  supplierDifference: number;
  customPartDifference: number;
}

export const createVersionRecord = (
  name: string,
  assembly: WatchAssembly,
  sourcingPlan: Record<string, string | null>,
  totalCost: number,
  supplierCount: number,
  customPartCount: number,
  readinessLabel: string,
  isAutomatic = false,
  checkpointReason?: string
): SavedDesignVersion => {
  return {
    id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    timestampIso: new Date().toISOString(),
    assembly: JSON.parse(JSON.stringify(assembly)) as WatchAssembly,
    sourcingPlan: { ...sourcingPlan },
    isAutomaticCheckpoint: isAutomatic,
    checkpointReason,
    totalCost,
    supplierCount,
    customPartCount,
    readinessLabel
  };
};

export const pruneAutomaticCheckpoints = (
  versions: SavedDesignVersion[]
): SavedDesignVersion[] => {
  const manual = versions.filter((v) => !v.isAutomaticCheckpoint || v.isPinned);
  const automatic = versions.filter((v) => v.isAutomaticCheckpoint && !v.isPinned);

  // Keep most recent MAX_AUTOMATIC_CHECKPOINTS
  const keptAutomatic = automatic.slice(0, MAX_AUTOMATIC_CHECKPOINTS);

  return [...manual, ...keptAutomatic];
};

export const SAVED_VERSIONS_STORAGE_KEY = 'dial-designer/saved-versions-v1';
const MAX_SAVED_VERSIONS = 50;
const MAX_SAVED_CHARACTERS = 2_000_000;
type VersionStorage = Pick<Storage, 'getItem' | 'setItem'>;

const browserVersionStorage = (): VersionStorage | null => {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
};

function validatedVersion(input: unknown): SavedDesignVersion | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as SavedDesignVersion;
  if (typeof value.id !== 'string' || !value.id || value.id.length > 200 || typeof value.name !== 'string' || value.name.length > 300 ||
    typeof value.timestampIso !== 'string' || !Number.isFinite(Date.parse(value.timestampIso)) ||
    typeof value.readinessLabel !== 'string' || value.readinessLabel.length > 500 ||
    ![value.totalCost, value.supplierCount, value.customPartCount].every(v => Number.isFinite(v) && v >= 0) ||
    !Number.isInteger(value.supplierCount) || !Number.isInteger(value.customPartCount) ||
    !value.sourcingPlan || typeof value.sourcingPlan !== 'object' || Array.isArray(value.sourcingPlan)) return null;
  try {
    const assembly = deserializeWatchAssembly(JSON.stringify(value.assembly));
    if (!Object.values(assembly.globalDimensions).every(v => Number.isFinite(v)) || assembly.globalDimensions.caseDiameterMm <= 0 ||
      !assembly.selectedColorPalette || Object.values(assembly.parts).some(part => !part || typeof part.instanceId !== 'string' ||
        typeof part.catalogueItemId !== 'string' || typeof part.name !== 'string' || !part.dimensions ||
        Object.values(part.dimensions).some(dimension => !Number.isFinite(dimension)))) return null;
    if (assembly.partOrder.some(id => typeof id !== 'string' || !assembly.parts[id])) return null;
    if (Object.entries(value.sourcingPlan).some(([key, listing]) => key.length > 200 || (listing !== null && (typeof listing !== 'string' || listing.length > 300)))) return null;
    return { id: value.id, name: value.name, timestampIso: value.timestampIso, assembly,
      sourcingPlan: { ...value.sourcingPlan }, totalCost: value.totalCost, supplierCount: value.supplierCount,
      customPartCount: value.customPartCount, readinessLabel: value.readinessLabel,
      ...(typeof value.isAutomaticCheckpoint === 'boolean' ? { isAutomaticCheckpoint: value.isAutomaticCheckpoint } : {}),
      ...(typeof value.isPinned === 'boolean' ? { isPinned: value.isPinned } : {}),
      ...(typeof value.checkpointReason === 'string' ? { checkpointReason: value.checkpointReason.slice(0, 500) } : {}) };
  } catch { return null; }
}

/** Durable snapshots only; preview IDs, locks and UI selections never enter storage. */
export function loadSavedVersions(storage: VersionStorage | null = browserVersionStorage()): { versions: SavedDesignVersion[]; warning: string | null } {
  if (!storage) return { versions: [], warning: null };
  try {
    const json = storage.getItem(SAVED_VERSIONS_STORAGE_KEY);
    if (!json) return { versions: [], warning: null };
    if (json.length > MAX_SAVED_CHARACTERS) throw new Error('oversized data');
    const parsed = JSON.parse(json) as { version?: number; versions?: unknown[] };
    if (parsed.version !== 1 || !Array.isArray(parsed.versions) || parsed.versions.length > MAX_SAVED_VERSIONS) throw new Error('invalid schema');
    const versions = parsed.versions.map(validatedVersion).filter((version): version is SavedDesignVersion => version !== null);
    return { versions, warning: versions.length === parsed.versions.length ? null : 'Some damaged saved versions could not be loaded. Existing storage was preserved.' };
  } catch { return { versions: [], warning: 'Saved versions could not be loaded. Existing storage was preserved; export your current project as a backup.' }; }
}

export function persistSavedVersions(versions: SavedDesignVersion[], storage: VersionStorage | null = browserVersionStorage()): string | null {
  if (!storage) return typeof window === 'undefined' ? null : 'Browser storage is unavailable; these versions remain in this session only.';
  try {
    if (versions.length > MAX_SAVED_VERSIONS) return 'The 50-version browser limit was reached. Delete or export older versions before saving more; the previous durable snapshot is preserved.';
    const validated = versions.map(validatedVersion);
    if (validated.some(version => version === null)) return 'A version could not be validated; the previous durable snapshot is preserved.';
    const payload = JSON.stringify({ version: 1, versions: validated });
    if (payload.length > MAX_SAVED_CHARACTERS) return 'Saved versions exceed browser storage capacity. Export project backups or delete older versions; the previous durable snapshot is preserved.';
    storage.setItem(SAVED_VERSIONS_STORAGE_KEY, payload);
    return null;
  } catch { return 'Browser storage is full or unavailable; changes to versions remain in this session only. Export project backups.'; }
}

export const computeVersionDiff = (
  currentAssembly: WatchAssembly,
  currentCost: number,
  currentSuppliers: number,
  currentCustom: number,
  targetVersion: SavedDesignVersion
): VersionDiff => {
  const changedParts: VersionDiff['changedParts'] = [];

  const targetParts = targetVersion.assembly.parts;
  const currentParts = currentAssembly.parts;

  for (const [id, targetPart] of Object.entries(targetParts)) {
    const currentPart = currentParts[id];
    if (!currentPart || currentPart.catalogueItemId !== targetPart.catalogueItemId) {
      changedParts.push({
        instanceId: id,
        oldCatalogueId: currentPart?.catalogueItemId,
        newCatalogueId: targetPart.catalogueItemId
      });
    }
  }

  return {
    changedParts,
    costDifference: targetVersion.totalCost - currentCost,
    supplierDifference: targetVersion.supplierCount - currentSuppliers,
    customPartDifference: targetVersion.customPartCount - currentCustom
  };
};
