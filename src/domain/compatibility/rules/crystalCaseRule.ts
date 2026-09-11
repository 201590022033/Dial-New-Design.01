import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ResolvedAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';

/**
 * Checks physical mating compatibility between Crystal and Case crystal seat.
 */
export const checkCrystalCaseCompatibility = (
  assembly: WatchAssembly,
  geometry: ResolvedAssemblyGeometry,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];

  const crystalPart = Object.values(assembly.parts).find(
    (p) => p.category === 'case' && (p.instanceId.includes('crystal') || p.name.toLowerCase().includes('crystal'))
  );

  const isCandidateCrystal = candidateItem?.category === 'case' && (candidateItem.kind.includes('crystal') || candidateItem.kind.includes('sapphire'));

  if (!crystalPart && !isCandidateCrystal) {
    return results;
  }

  const candidateSpec = candidateItem?.engineeringSpecs?.crystal;
  const crystalDiameterMm =
    candidateSpec?.outerDiameterMm ??
    (isCandidateCrystal ? candidateItem.nominalDimensions.diameterMm : undefined) ??
    crystalPart?.dimensions.diameterMm;

  // Case crystal seat interface
  const crystalSeatInterface = geometry.interfaces.find((i) => i.kind === 'crystal-seat');
  const candidateCaseSpec = candidateItem?.engineeringSpecs?.case;

  const caseCrystalSeatDiameterMm =
    candidateCaseSpec?.crystalSeatDiameterMm ??
    (crystalSeatInterface ? crystalSeatInterface.radialSeatMm.outerRadiusMm * 2 : undefined) ??
    (geometry.regions.crystal ? geometry.regions.crystal.outerRadiusMm * 2 : undefined);

  if (typeof crystalDiameterMm !== 'number' || isNaN(crystalDiameterMm) || crystalDiameterMm <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'crystal-case',
      summary: 'Crystal outer diameter is missing.',
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined
    });
    return results;
  }

  if (typeof caseCrystalSeatDiameterMm !== 'number' || isNaN(caseCrystalSeatDiameterMm) || caseCrystalSeatDiameterMm <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'crystal-case',
      summary: 'Case crystal seat diameter is unknown; cannot verify crystal retention.'
    });
    return results;
  }

  const diff = Math.abs(crystalDiameterMm - caseCrystalSeatDiameterMm);
  if (diff > 0.05) {
    results.push({
      status: 'red',
      code: 'CRYSTAL_DIAMETER_MISMATCH',
      category: 'crystal-case',
      summary: `Crystal diameter (${crystalDiameterMm.toFixed(1)} mm) does not match case crystal seat (${caseCrystalSeatDiameterMm.toFixed(1)} mm).`,
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
      expected: { value: caseCrystalSeatDiameterMm, unit: 'mm' },
      actual: { value: crystalDiameterMm, unit: 'mm' },
      difference: crystalDiameterMm - caseCrystalSeatDiameterMm,
      evidence: [
        `Case crystal seat diameter: ${caseCrystalSeatDiameterMm.toFixed(2)} mm`,
        `Crystal diameter: ${crystalDiameterMm.toFixed(2)} mm`
      ]
    });
  } else {
    results.push({
      status: 'green',
      code: 'CRYSTAL_SEAT_FIT_VALID',
      category: 'crystal-case',
      summary: `Crystal diameter (${crystalDiameterMm.toFixed(1)} mm) matches case crystal seat (${caseCrystalSeatDiameterMm.toFixed(1)} mm).`,
      expected: { value: caseCrystalSeatDiameterMm, unit: 'mm' },
      actual: { value: crystalDiameterMm, unit: 'mm' },
      difference: 0
    });
  }

  return results;
};
