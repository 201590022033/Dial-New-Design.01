import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ResolvedAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';

/**
 * Checks physical mating compatibility between Bezel Insert and Bezel Carrier recess.
 */
export const checkBezelInsertCompatibility = (
  _assembly: WatchAssembly,
  geometry: ResolvedAssemblyGeometry,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];

  const isCandidateInsert = candidateItem?.category === 'rings' && (candidateItem.kind.includes('insert') || candidateItem.id.includes('insert'));
  const candidateInsertSpec = candidateItem?.engineeringSpecs?.bezelInsert;

  if (!isCandidateInsert && !candidateInsertSpec) {
    return results;
  }

  const insertOD = candidateInsertSpec?.outerDiameterMm ?? candidateItem?.nominalDimensions.diameterMm;
  const insertID = candidateInsertSpec?.innerDiameterMm ?? (candidateItem ? candidateItem.nominalDimensions.diameterMm - (candidateItem.nominalDimensions.widthMm * 2) : undefined);

  // Bezel carrier insert groove from geometry contentSlots
  const insertSlot = geometry.contentSlots['bezel-insert-slot'];
  const bezelRegion = geometry.regions.bezel;

  const carrierOD = insertSlot ? insertSlot.outerRadiusMm * 2 : (bezelRegion ? bezelRegion.outerRadiusMm * 2 : 38.0);
  const carrierID = insertSlot ? insertSlot.innerRadiusMm * 2 : (bezelRegion ? bezelRegion.innerRadiusMm * 2 + 1.0 : 30.5);

  if (typeof insertOD !== 'number' || isNaN(insertOD) || insertOD <= 0 || typeof insertID !== 'number' || isNaN(insertID) || insertID <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'bezel-insert',
      summary: 'Bezel insert inner and/or outer dimensions are missing.',
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined
    });
    return results;
  }

  if (typeof carrierOD !== 'number' || typeof carrierID !== 'number') {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'bezel-insert',
      summary: 'Bezel carrier insert recess dimensions are missing from CAD geometry.'
    });
    return results;
  }

  const odDiff = Math.abs(insertOD - carrierOD);
  const idDiff = Math.abs(insertID - carrierID);

  if (odDiff > 0.1 || idDiff > 0.1) {
    results.push({
      status: 'red',
      code: 'BEZEL_INSERT_DIAMETER_MISMATCH',
      category: 'bezel-insert',
      summary: `Bezel insert dimensions (${insertID.toFixed(1)} / ${insertOD.toFixed(1)} mm) do not match carrier groove (${carrierID.toFixed(1)} / ${carrierOD.toFixed(1)} mm).`,
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
      expected: { value: carrierOD, unit: 'mm' },
      actual: { value: insertOD, unit: 'mm' },
      difference: odDiff,
      evidence: [
        `Carrier recess OD/ID: ${carrierOD.toFixed(2)} / ${carrierID.toFixed(2)} mm`,
        `Insert OD/ID: ${insertOD.toFixed(2)} / ${insertID.toFixed(2)} mm`
      ]
    });
  } else {
    results.push({
      status: 'green',
      code: 'BEZEL_INSERT_FIT_VALID',
      category: 'bezel-insert',
      summary: `Bezel insert (${insertID.toFixed(1)} / ${insertOD.toFixed(1)} mm) perfectly seats in bezel carrier.`,
      expected: { value: carrierOD, unit: 'mm' },
      actual: { value: insertOD, unit: 'mm' },
      difference: 0
    });
  }

  return results;
};
