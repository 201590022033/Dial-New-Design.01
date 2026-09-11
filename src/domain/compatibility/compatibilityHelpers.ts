import type {
  AssemblyCompatibilityEvaluation,
  CompatibilityCheckResult,
  CompatibilityStatus,
  RemedyDefinition
} from './compatibilityTypes';
import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import { movementLibrary, type MovementTemplate } from '@/domain/movements/movementLibrary';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';

/**
 * Resolves the active movement template for an assembly.
 * Checks assembly.metadata.movement first, falls back to 'nh35' default.
 */
export const getActiveMovement = (assembly: WatchAssembly): MovementTemplate | undefined => {
  const movId = (assembly.metadata.movement ?? 'nh35').toLowerCase().trim();
  return movementLibrary.find((m) => m.id.toLowerCase() === movId || m.name.toLowerCase() === movId);
};

/**
 * Finds a part in the assembly matching a category or instance/catalogue ID.
 */
export const findAssemblyPart = (
  assembly: WatchAssembly,
  predicate: (part: WatchAssemblyPartInstance) => boolean
): WatchAssemblyPartInstance | undefined => {
  return Object.values(assembly.parts).find(predicate);
};

/**
 * Finds the main case body part (excluding crystal, crown, case-back).
 */
export const findCaseBodyPart = (assembly: WatchAssembly): WatchAssemblyPartInstance | undefined => {
  return (
    Object.values(assembly.parts).find(
      (p) =>
        p.instanceId.includes('case-body') ||
        p.catalogueItemId.includes('case-body') ||
        (p.category === 'case' &&
          !p.instanceId.includes('crystal') &&
          !p.instanceId.includes('back') &&
          !p.instanceId.includes('crown') &&
          !p.name.toLowerCase().includes('crystal') &&
          !p.name.toLowerCase().includes('back') &&
          !p.name.toLowerCase().includes('crown'))
    ) ?? Object.values(assembly.parts).find((p) => p.category === 'case')
  );
};

/**
 * Finds the primary dial blank or face part.
 */
export const findDialPart = (assembly: WatchAssembly): WatchAssemblyPartInstance | undefined => {
  return Object.values(assembly.parts).find(
    (p) =>
      p.instanceId.includes('dial-blank') ||
      p.instanceId.includes('dial-face') ||
      p.catalogueItemId.includes('dial-blank') ||
      p.category === 'dial'
  );
};

/**
 * Deterministically aggregates multiple check results into an overall status and structured evaluation.
 *
 * Strict horological hierarchy:
 * 1. Any RED -> aggregate RED (hard physical clash / mismatch)
 * 2. Otherwise any UNKNOWN -> aggregate UNKNOWN (absence of evidence is NOT evidence of fit)
 * 3. Otherwise any YELLOW -> aggregate YELLOW (conditionally compatible with remedy/adapter)
 * 4. Otherwise all GREEN -> aggregate GREEN (verified physical fit)
 */
export const aggregateCompatibility = (
  checks: CompatibilityCheckResult[],
  candidateInfo?: {
    catalogueItemId: string;
    targetPartInstanceId?: string;
    category: string;
  }
): AssemblyCompatibilityEvaluation => {
  const counts = {
    green: 0,
    yellow: 0,
    red: 0,
    unknown: 0
  };

  const remedies: RemedyDefinition[] = [];
  const remedySeen = new Set<string>();

  for (const check of checks) {
    counts[check.status]++;
    if (check.remedy && !remedySeen.has(check.remedy.type)) {
      remedySeen.add(check.remedy.type);
      remedies.push(check.remedy);
    }
  }

  let status: CompatibilityStatus = 'green';
  let summary = 'All physical and geometrical compatibility checks passed.';

  if (checks.length === 0) {
    status = 'unknown';
    summary = 'No compatibility checks were applicable or performed.';
  } else if (counts.red > 0) {
    status = 'red';
    const firstRed = checks.find((c) => c.status === 'red');
    summary = firstRed
      ? `Physically incompatible: ${firstRed.summary}`
      : `Physical incompatibility detected (${counts.red} failure${counts.red > 1 ? 's' : ''}).`;
  } else if (counts.unknown > 0) {
    status = 'unknown';
    const firstUnknown = checks.find((c) => c.status === 'unknown');
    summary = firstUnknown
      ? `Indeterminate compatibility: ${firstUnknown.summary}`
      : `Insufficient verified engineering data to confirm compatibility (${counts.unknown} unknown).`;
  } else if (counts.yellow > 0) {
    status = 'yellow';
    const firstYellow = checks.find((c) => c.status === 'yellow');
    summary = firstYellow
      ? `Conditionally compatible: ${firstYellow.summary}`
      : `Conditionally compatible (${counts.yellow} check${counts.yellow > 1 ? 's' : ''} require adapter/modification).`;
  }

  return {
    status,
    candidate: candidateInfo,
    summary,
    checks,
    counts,
    remedies
  };
};

/**
 * Creates a provisional assembly clone with candidate item applied for evaluation without mutating the original.
 */
export const createProvisionalAssemblyWithCandidate = (
  assembly: WatchAssembly,
  candidate: ComponentCatalogueItem,
  targetPartInstanceId?: string
): WatchAssembly => {
  const cloned = JSON.parse(JSON.stringify(assembly)) as WatchAssembly;

  // Determine target instance ID
  let targetId = targetPartInstanceId;
  if (!targetId) {
    // Find first part matching candidate category or kind
    const match = Object.values(cloned.parts).find(
      (p) => p.category === candidate.category || p.catalogueItemId === candidate.id
    );
    targetId = match ? match.instanceId : `inst-${candidate.kind}`;
  }

  // If candidate is a movement, update assembly metadata movement
  if (candidate.category === 'case' && candidate.kind.includes('movement')) {
    cloned.metadata.movement = candidate.id.replace(/^cat-/, '');
  }

  // Create or replace target part instance
  const existingPart = cloned.parts[targetId];
  cloned.parts[targetId] = {
    instanceId: targetId,
    catalogueItemId: candidate.id,
    name: candidate.displayName,
    category: candidate.category,
    visible: existingPart ? existingPart.visible : true,
    locked: existingPart ? existingPart.locked : false,
    layerIndex: existingPart ? existingPart.layerIndex : 50,
    material: candidate.defaultMaterial,
    color: existingPart ? existingPart.color : '#E2E8F0',
    texture: candidate.defaultTexture,
    dimensions: {
      diameterMm: candidate.nominalDimensions.diameterMm,
      widthMm: candidate.nominalDimensions.widthMm,
      thicknessMm: candidate.nominalDimensions.thicknessMm,
      offsetXmm: candidate.nominalDimensions.offsetXmm ?? (existingPart?.dimensions.offsetXmm ?? 0),
      offsetYmm: candidate.nominalDimensions.offsetYmm ?? (existingPart?.dimensions.offsetYmm ?? 0)
    },
    customProperties: {
      ...existingPart?.customProperties,
      engineeringSpecs: candidate.engineeringSpecs
    }
  };

  if (!cloned.partOrder.includes(targetId)) {
    cloned.partOrder.push(targetId);
  }

  return cloned;
};
