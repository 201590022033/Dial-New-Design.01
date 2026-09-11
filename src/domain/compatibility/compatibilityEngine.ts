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

  // 3. Physical & Mating interface rules
  checks.push(...checkMovementCaseCompatibility(assembly, geometry, candidateItem));
  checks.push(...checkMovementHandsCompatibility(assembly, candidateItem));
  checks.push(...checkCaseDialCompatibility(assembly, geometry, candidateItem));
  checks.push(...checkChapterRingCaseCompatibility(assembly, geometry, candidateItem));
  checks.push(...checkHandsClearanceCompatibility(assembly, geometry, candidateItem));
  checks.push(...checkCrystalCaseCompatibility(assembly, geometry, candidateItem));
  checks.push(...checkBezelCaseCompatibility(assembly, geometry, candidateItem));
  checks.push(...checkBezelInsertCompatibility(assembly, geometry, candidateItem));
  checks.push(...checkDateWindowMovementCompatibility(assembly, candidateItem));

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

  // Create an immutable provisional assembly with candidate component applied
  const provisionalAssembly = createProvisionalAssemblyWithCandidate(
    assembly,
    candidate,
    targetPartInstanceId
  );

  // Run all deterministic compatibility checks
  const checks = runCompatibilityRules(provisionalAssembly, candidate);

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
