import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { SavedDesignVersion } from './configuratorTypes';

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
  const keptAutomatic = automatic.slice(-MAX_AUTOMATIC_CHECKPOINTS);

  return [...manual, ...keptAutomatic];
};

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
