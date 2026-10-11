import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { getCatalogueItem, listCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import { resolveAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type {
  AssemblyCompatibilityEvaluation,
  CompatibilityCheckResult,
  EvaluateCandidateOptions,
  ReverseCandidateQueryOptions,
  ReverseCandidateResult
} from './compatibilityTypes';
import {
  aggregateCompatibility,
  createProvisionalAssemblyWithCandidate
} from './compatibilityHelpers';
import { checkMovementCaseCompatibility } from './rules/movementCaseRule';
import { checkMovementHandsCompatibility } from './rules/movementHandsRule';
import { checkCaseDialCompatibility } from './rules/caseDialRule';
import { checkChapterRingCaseCompatibility } from './rules/chapterRingCaseRule';
import { checkHandsClearanceCompatibility } from './rules/handsClearanceRule';
import { checkCrystalCaseCompatibility } from './rules/crystalCaseRule';
import { checkBezelCaseCompatibility } from './rules/bezelCaseRule';
import { checkBezelInsertCompatibility } from './rules/bezelInsertRule';
import { checkDateWindowMovementCompatibility } from './rules/dateWindowMovementRule';
import { checkCatalogueVerificationState } from './rules/catalogueVerificationRule';
import { checkTemplateRequiredComponents } from './rules/templateRequiredComponentsRule';
import { checkMovementPusherCompatibility } from './rules/movementPusherRule';
import { checkCrownCompatibility } from '@/domain/crown/compatibility';
import { checkOffAxisPlatform } from '@/domain/crown/offAxisPlatform';
import { crownSlotError } from '@/domain/crown/selection';

/**
 * Executes all physical compatibility rules against an assembly and optional candidate item.
 */
export const runCompatibilityRules = (
  assembly: WatchAssembly,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const checks: CompatibilityCheckResult[] = [];

  // 1. Resolve 2.5D cylindrical geometry for spatial interfaces & clearance
  const geometry = resolveAssemblyGeometry(assembly);

  // 2. Run verification state check on candidate item
  if (candidateItem) {
    checks.push(...checkCatalogueVerificationState(candidateItem));
  }
  // Applied provisional parts do not become verified merely by leaving Preview.
  for (const part of Object.values(assembly.parts).filter((part) => part.visible)) {
    const item = getCatalogueItem(part.catalogueItemId);
    if (item && item.id !== candidateItem?.id && (item.status === 'draft' || item.status === 'ai-extracted')) {
      checks.push(...checkCatalogueVerificationState(item));
    }
  }

  // 3. Physical & Mating interface rules
  const offAxisCase = Object.values(assembly.parts).find(part => part.offAxisPlatform);
  // Generic NH35 fallback seats and 3h installation assumptions cannot qualify
  // an off-axis supplier platform whose hidden interfaces are unmeasured.
  if (offAxisCase) {
    for (const category of ['movement-case', 'case-dial', 'chapter-ring-case', 'crystal-case', 'bezel-case']) checks.push({ status: 'unknown', code: 'MISSING_REQUIRED_DIMENSION', category, summary: `Exact off-axis ${category} interface is unqualified; generic case dimensions are presentation assumptions.`, affectedPartIds: [offAxisCase.instanceId] });
  } else {
    checks.push(...checkMovementCaseCompatibility(assembly, geometry, candidateItem));
    checks.push(...checkCaseDialCompatibility(assembly, geometry, candidateItem));
    checks.push(...checkChapterRingCaseCompatibility(assembly, geometry, candidateItem));
    checks.push(...checkCrystalCaseCompatibility(assembly, geometry, candidateItem));
    checks.push(...checkBezelCaseCompatibility(assembly, geometry, candidateItem));
  }
  checks.push(...checkMovementHandsCompatibility(assembly, candidateItem));
  checks.push(...checkHandsClearanceCompatibility(assembly, geometry, candidateItem));
  checks.push(...checkBezelInsertCompatibility(assembly, geometry, candidateItem));
  checks.push(...checkDateWindowMovementCompatibility(assembly, candidateItem));
  checks.push(...checkTemplateRequiredComponents(assembly, candidateItem));
  checks.push(...checkMovementPusherCompatibility(assembly, candidateItem));
  checks.push(...checkCrownCompatibility(assembly));
  checks.push(...checkOffAxisPlatform(assembly));

  // 4. Map any severe 2.5D cylindrical CAD collision diagnostics
  for (const diag of geometry.diagnostics) {
    if (diag.code === 'RADIAL_AXIAL_COLLISION') {
      checks.push({
        status: 'red',
        code: 'GEOMETRY_INTERFERENCE',
        category: 'spatial-collision',
        summary: diag.message,
        affectedPartIds: diag.affectedPartIds,
        evidence: [diag.message]
      });
    }
  }

  return checks;
};

/**
 * Evaluates the full compatibility of the current live WatchAssembly.
 */
export const evaluateAssembly = (assembly: WatchAssembly): AssemblyCompatibilityEvaluation => {
  const checks = runCompatibilityRules(assembly);
  return aggregateCompatibility(checks);
};

/**
 * Evaluates whether a candidate ComponentCatalogueItem physically fits within the assembly.
 *
 * Implements an immutable provisional evaluation path:
 * - Does NOT mutate the live WatchAssembly.
 * - Evaluates candidate within the context of the rest of the assembly.
 * - Returns deterministic green / yellow / red / unknown evaluation with diagnostics and remedies.
 */
export const evaluateCandidate = (
  options: EvaluateCandidateOptions
): AssemblyCompatibilityEvaluation => {
  const { assembly, targetPartInstanceId, candidateCatalogueItemId } = options;

  // Resolve candidate item definition
  const candidate = options.candidateItem ?? getCatalogueItem(candidateCatalogueItemId);

  if (!candidate) {
    return {
      status: 'unknown',
      summary: `Candidate catalogue item "${candidateCatalogueItemId}" not found in registry.`,
      checks: [
        {
          status: 'unknown',
          code: 'MISSING_REQUIRED_DIMENSION',
          category: 'catalogue',
          summary: `Catalogue item "${candidateCatalogueItemId}" could not be resolved.`,
          affectedCatalogueItemIds: [candidateCatalogueItemId]
        }
      ],
      counts: { green: 0, yellow: 0, red: 0, unknown: 1 },
      remedies: []
    };
  }

  const slotError = targetPartInstanceId ? crownSlotError(assembly, targetPartInstanceId, candidate) : undefined;
  if (slotError) return aggregateCompatibility([{ status: 'red', code: 'CROWN_SLOT_MISMATCH', category: 'crown-interface', summary: slotError }]);
  // Create an immutable provisional assembly with candidate component applied
  const provisionalAssembly = createProvisionalAssemblyWithCandidate(
    assembly,
    candidate,
    targetPartInstanceId
  );

  // Run all deterministic compatibility checks
  const allChecks = runCompatibilityRules(provisionalAssembly, candidate);
  // Bounded crown/platform/strap repairs may proceed past unchanged unrelated
  // failures. Full-build evaluation still reports those failures; new failures,
  // affected target contradictions and all off-axis/crown refusals remain hard.
  const boundedRepair = candidate.kind === 'crown' || candidate.offAxisPlatform || candidate.metadata.tags.includes('off-axis-accessory') || (['case', 'midcase'].includes(candidate.kind) && Object.values(assembly.parts).some(part => part.offAxisPlatform));
  const existingRed = boundedRepair ? runCompatibilityRules(assembly).filter(c => c.status === 'red') : [];
  const checks = boundedRepair ? allChecks.filter(c => c.status !== 'red' || c.category === 'crown-interface' || c.category === 'off-axis-platform' || (candidate.kind !== 'crown' && c.affectedPartIds?.includes(targetPartInstanceId ?? '')) || !existingRed.some(old => old.code === c.code && old.summary === c.summary && JSON.stringify(old.affectedPartIds) === JSON.stringify(c.affectedPartIds))) : allChecks;

  const candidateInfo = {
    catalogueItemId: candidate.id,
    targetPartInstanceId,
    category: candidate.category
  };

  const evaluation = aggregateCompatibility(checks, candidateInfo);

  // Add reverse dependency assistance if incompatible
  if (evaluation.status === 'red') {
    if (candidate.category === 'rings' && candidate.kind.includes('bezel')) {
      evaluation.reverseDependency = {
        matingCategory: 'case',
        requiredSpec: {
          bezelCarrierInnerMm: candidate.nominalDimensions.diameterMm - (candidate.nominalDimensions.widthMm * 2)
        },
        description: `Requires a case with matching ${candidate.nominalDimensions.diameterMm}mm bezel shoulder.`
      };
    } else if (candidate.category === 'dial') {
      evaluation.reverseDependency = {
        matingCategory: 'case',
        requiredSpec: {
          dialSeatDiameterMm: candidate.nominalDimensions.diameterMm
        },
        description: `Requires a case with a ${candidate.nominalDimensions.diameterMm}mm dial seat aperture.`
      };
    } else if (candidate.category === 'hands') {
      evaluation.reverseDependency = {
        matingCategory: 'case',
        requiredSpec: {
          movement: candidate.metadata.tags.find((t) => t.startsWith('nh') || t.startsWith('eta') || t.startsWith('vk')) ?? 'compatible movement'
        },
        description: `Requires a movement with matching pinion arbors.`
      };
    }
  }

  return evaluation;
};

/**
 * Reverse compatibility query:
 * Finds catalogue items and determines their physical compatibility with the assembly.
 *
 * Example: "Which catalogue hands are physically compatible with this watch?"
 * Does NOT rank by aesthetics or percentage scores.
 */
export const getCompatibleCandidates = (
  options: ReverseCandidateQueryOptions
): ReverseCandidateResult[] => {
  const { assembly, targetCategory, targetPartInstanceId, filterStatus } = options;
  const allItems = listCatalogueItems();

  const candidates = targetCategory
    ? allItems.filter((item) => item.category === targetCategory)
    : allItems;

  const results: ReverseCandidateResult[] = [];

  for (const item of candidates) {
    const evaluation = evaluateCandidate({
      assembly,
      targetPartInstanceId,
      candidateCatalogueItemId: item.id,
      candidateItem: item
    });

    if (!filterStatus || filterStatus.includes(evaluation.status)) {
      results.push({
        item,
        evaluation
      });
    }
  }

  return results;
};
