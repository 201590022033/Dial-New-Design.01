import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ResolvedAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { findCaseBodyPart } from '../compatibilityHelpers';

/**
 * Checks physical mating compatibility for Chapter Ring vs Case rehaut and Dial.
 */
export const checkChapterRingCaseCompatibility = (
  assembly: WatchAssembly,
  geometry: ResolvedAssemblyGeometry,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];

  const chapterPart = Object.values(assembly.parts).find(
    (p) => p.category === 'rings' && (p.instanceId.includes('chapter') || p.name.toLowerCase().includes('chapter'))
  );

  const candidateSpec = candidateItem?.engineeringSpecs?.chapterRing;
  const isCandidateChapterRing = candidateItem?.category === 'rings' && candidateItem.kind.includes('chapter');

  if (!chapterPart && !isCandidateChapterRing) {
    return results; // No chapter ring in assembly or candidate
  }

  const outerDiameterMm =
    candidateSpec?.outerDiameterMm ??
    (isCandidateChapterRing ? candidateItem.nominalDimensions.diameterMm : undefined) ??
    chapterPart?.dimensions.diameterMm;

  // Case rehaut rebate interface
  const casePart = findCaseBodyPart(assembly);
  const candidateCaseSpec = candidateItem?.engineeringSpecs?.case;
  const rehautInterface = geometry.interfaces.find((i) => i.kind === 'rehaut-rebate');

  const maxRehautDiameterMm =
    candidateCaseSpec?.rehautDiameterMm ??
    (casePart?.dimensions.diameterMm && casePart.dimensions.diameterMm > 30 ? 30.5 : undefined) ??
    (rehautInterface ? rehautInterface.radialSeatMm.outerRadiusMm * 2 + 2.0 : undefined);

  if (typeof outerDiameterMm !== 'number' || isNaN(outerDiameterMm) || outerDiameterMm <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'chapter-ring-case',
      summary: 'Chapter ring outer diameter is missing.',
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined
    });
    return results;
  }

  if (typeof maxRehautDiameterMm !== 'number' || isNaN(maxRehautDiameterMm) || maxRehautDiameterMm <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'chapter-ring-case',
      summary: 'Case rehaut cavity diameter is unknown; cannot verify chapter ring fit.'
    });
    return results;
  }

  const diff = outerDiameterMm - maxRehautDiameterMm;
  if (diff > 0.05) {
    results.push({
      status: 'red',
      code: 'CHAPTER_RING_SEAT_MISMATCH',
      category: 'chapter-ring-case',
      summary: `Chapter ring outer diameter (${outerDiameterMm.toFixed(1)} mm) exceeds case rehaut aperture (${maxRehautDiameterMm.toFixed(1)} mm) by ${diff.toFixed(2)} mm.`,
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
      expected: { value: maxRehautDiameterMm, unit: 'mm' },
      actual: { value: outerDiameterMm, unit: 'mm' },
      difference: diff,
      evidence: [
        `Case rehaut maximum diameter: ${maxRehautDiameterMm.toFixed(2)} mm`,
        `Chapter ring OD: ${outerDiameterMm.toFixed(2)} mm`
      ]
    });
  } else {
    results.push({
      status: 'green',
      code: 'CHAPTER_RING_FIT_VALID',
      category: 'chapter-ring-case',
      summary: `Chapter ring outer diameter (${outerDiameterMm.toFixed(1)} mm) fits within case rehaut (${maxRehautDiameterMm.toFixed(1)} mm).`,
      expected: { value: maxRehautDiameterMm, unit: 'mm' },
      actual: { value: outerDiameterMm, unit: 'mm' },
      difference: diff
    });
  }

  return results;
};
