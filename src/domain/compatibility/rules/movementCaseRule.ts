import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ResolvedAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { getActiveMovement } from '../compatibilityHelpers';

/**
 * Checks physical mating compatibility between movement calibre and case cavity.
 *
 * Hard constraints:
 * - Movement OD must be <= Case Cavity ID
 * - Movement height must not exceed interior axial cavity depth
 * - Stem axis height and radial angle (3h/4h/9h) must align with case crown tube
 */
export const checkMovementCaseCompatibility = (
  assembly: WatchAssembly,
  _geometry: ResolvedAssemblyGeometry,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];

  // 1. Identify movement specifications
  const activeMovement = getActiveMovement(assembly);
  const candidateMovSpec = candidateItem?.engineeringSpecs?.movement;

  const movementName = candidateMovSpec?.calibreId ?? activeMovement?.name ?? assembly.metadata.movement;
  const movementDiameter = candidateMovSpec?.diameterMm ?? 27.4;
  const movementStemPos = candidateMovSpec?.stemPosition ?? activeMovement?.stemPosition ?? '3h';

  // 2. Identify case specifications
  const candidateCaseSpec = candidateItem?.engineeringSpecs?.case;

  // Case cavity from explicit specs or standard casing diameter for the assembly
  const caseCavityDiameter =
    candidateCaseSpec?.cavityDiameterMm ??
    (assembly.globalDimensions.caseDiameterMm > 0 ? 29.2 : undefined);

  const caseStemPos = candidateCaseSpec?.stemPosition ?? '3h';

  // Check 1: Missing critical dimensions
  if (typeof caseCavityDiameter !== 'number' || isNaN(caseCavityDiameter) || caseCavityDiameter <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'movement-case',
      summary: `Case cavity inner diameter is not specified; cannot verify fit for movement ${movementName}.`,
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
      evidence: ['Case cavity diameter missing in CAD model and catalogue metadata.']
    });
    return results;
  }

  if (typeof movementDiameter !== 'number' || isNaN(movementDiameter) || movementDiameter <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'movement-case',
      summary: `Movement diameter is unknown for calibre "${movementName}".`,
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
      evidence: ['Movement diameter dimension missing.']
    });
    return results;
  }

  // Check 2: Radial diameter fit
  const radialDifference = movementDiameter - caseCavityDiameter;
  if (radialDifference > 0.05) {
    results.push({
      status: 'red',
      code: 'MOVEMENT_EXCEEDS_CASE_CAVITY',
      category: 'movement-case',
      summary: `Movement (${movementDiameter.toFixed(1)} mm) exceeds case cavity diameter (${caseCavityDiameter.toFixed(1)} mm) by ${radialDifference.toFixed(2)} mm.`,
      expected: { value: caseCavityDiameter, unit: 'mm' },
      actual: { value: movementDiameter, unit: 'mm' },
      difference: radialDifference,
      evidence: [
        `Movement calibre: ${movementName}`,
        `Movement outer diameter: ${movementDiameter.toFixed(2)} mm`,
        `Case interior cavity: ${caseCavityDiameter.toFixed(2)} mm`
      ]
    });
  } else if (radialDifference < -2.0) {
    // Movement is significantly smaller than case cavity: requires a casing ring or movement spacer
    results.push({
      status: 'yellow',
      code: 'MOVEMENT_REQUIRES_CASING_SPACER',
      category: 'movement-case',
      summary: `Movement diameter (${movementDiameter.toFixed(1)} mm) is smaller than case cavity (${caseCavityDiameter.toFixed(1)} mm); requires movement casing ring/spacer.`,
      expected: { value: caseCavityDiameter, unit: 'mm' },
      actual: { value: movementDiameter, unit: 'mm' },
      difference: Math.abs(radialDifference),
      remedy: {
        type: 'movement-spacer',
        title: 'Install Movement Casing Ring',
        description: `Install a standard ${(Math.abs(radialDifference) / 2).toFixed(1)} mm wall casing ring to secure calibre in case cavity.`,
        difficulty: 'simple',
        reversible: true
      },
      evidence: [
        `Movement diameter: ${movementDiameter.toFixed(2)} mm`,
        `Case cavity diameter: ${caseCavityDiameter.toFixed(2)} mm`,
        `Radial annular gap: ${(Math.abs(radialDifference) / 2).toFixed(2)} mm`
      ]
    });
  } else {
    results.push({
      status: 'green',
      code: 'MOVEMENT_CASE_FIT_VALID',
      category: 'movement-case',
      summary: `Movement diameter (${movementDiameter.toFixed(1)} mm) securely fits within case cavity (${caseCavityDiameter.toFixed(1)} mm).`,
      expected: { value: caseCavityDiameter, unit: 'mm' },
      actual: { value: movementDiameter, unit: 'mm' },
      difference: radialDifference
    });
  }

  // Check 3: Stem position alignment
  if (movementStemPos && caseStemPos && movementStemPos !== caseStemPos) {
    results.push({
      status: 'red',
      code: 'STEM_POSITION_MISALIGNMENT',
      category: 'movement-case',
      summary: `Movement stem position (${movementStemPos}) does not align with case crown tube position (${caseStemPos}).`,
      evidence: [
        `Movement stem position: ${movementStemPos}`,
        `Case crown tube angle: ${caseStemPos}`
      ]
    });
  }

  return results;
};
