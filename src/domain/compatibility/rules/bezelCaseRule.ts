import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ResolvedAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';

/**
 * Checks physical mating compatibility between Bezel carrier and Case shoulder.
 */
export const checkBezelCaseCompatibility = (
  assembly: WatchAssembly,
  geometry: ResolvedAssemblyGeometry,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];

  const bezelPart = Object.values(assembly.parts).find(
    (p) =>
      p.category === 'rings' &&
      !p.instanceId.includes('inner') &&
      !p.catalogueItemId.includes('inner') &&
      (p.instanceId.includes('bezel') || p.name.toLowerCase().includes('bezel'))
  );

  const isCandidateBezel = candidateItem?.category === 'rings' && candidateItem.kind.includes('bezel') && !candidateItem.kind.includes('insert');

  if (!bezelPart && !isCandidateBezel) {
    return results;
  }

  const candidateSpec = candidateItem?.engineeringSpecs?.bezel;
  const bezelInnerMm =
    candidateSpec?.innerDiameterMm ??
    (isCandidateBezel ? candidateItem.nominalDimensions.diameterMm - (candidateItem.nominalDimensions.widthMm * 2) : undefined) ??
    (bezelPart ? bezelPart.dimensions.diameterMm - (bezelPart.dimensions.widthMm * 2) : undefined);

  // Case bezel shoulder interface
  const shoulderInterface = geometry.interfaces.find((i) => i.kind === 'bezel-shoulder');
  const candidateCaseSpec = candidateItem?.engineeringSpecs?.case;

  const caseShoulderDiameterMm =
    candidateCaseSpec?.bezelCarrierInnerMm ??
    (shoulderInterface ? shoulderInterface.radialSeatMm.innerRadiusMm * 2 : undefined) ??
    (geometry.regions.bezel ? geometry.regions.bezel.innerRadiusMm * 2 : undefined);

  if (typeof bezelInnerMm !== 'number' || isNaN(bezelInnerMm) || bezelInnerMm <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'bezel-case',
      summary: 'Bezel carrier inner mounting diameter is missing.',
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined
    });
    return results;
  }

  if (typeof caseShoulderDiameterMm !== 'number' || isNaN(caseShoulderDiameterMm) || caseShoulderDiameterMm <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'bezel-case',
      summary: 'Case bezel shoulder diameter is unknown; cannot verify bezel snap-fit.'
    });
    return results;
  }

  const diff = Math.abs(bezelInnerMm - caseShoulderDiameterMm);
  if (diff > 0.1) {
    results.push({
      status: 'red',
      code: 'BEZEL_SHOULDER_MISMATCH',
      category: 'bezel-case',
      summary: `Bezel mounting bore (${bezelInnerMm.toFixed(1)} mm) does not match case shoulder (${caseShoulderDiameterMm.toFixed(1)} mm).`,
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
      expected: { value: caseShoulderDiameterMm, unit: 'mm' },
      actual: { value: bezelInnerMm, unit: 'mm' },
      difference: bezelInnerMm - caseShoulderDiameterMm,
      evidence: [
        `Case shoulder diameter: ${caseShoulderDiameterMm.toFixed(2)} mm`,
        `Bezel inner diameter: ${bezelInnerMm.toFixed(2)} mm`
      ]
    });
  } else {
    results.push({
      status: 'green',
      code: 'BEZEL_SHOULDER_FIT_VALID',
      category: 'bezel-case',
      summary: `Bezel inner bore (${bezelInnerMm.toFixed(1)} mm) securely snaps onto case shoulder (${caseShoulderDiameterMm.toFixed(1)} mm).`,
      expected: { value: caseShoulderDiameterMm, unit: 'mm' },
      actual: { value: bezelInnerMm, unit: 'mm' },
      difference: 0
    });
  }

  return results;
};
