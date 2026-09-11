import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ResolvedAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { getActiveMovement, findCaseBodyPart, findDialPart } from '../compatibilityHelpers';

/**
 * Checks physical mating compatibility between Dial blank and Case dial-seat / rehaut aperture.
 */
export const checkCaseDialCompatibility = (
  assembly: WatchAssembly,
  geometry: ResolvedAssemblyGeometry,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];

  // 1. Resolve dial diameter and specs
  const dialPart = findDialPart(assembly);

  const candidateDialSpec = candidateItem?.engineeringSpecs?.dial;
  const dialDiameter =
    candidateDialSpec?.outerDiameterMm ??
    (candidateItem?.category === 'dial' ? candidateItem.nominalDimensions.diameterMm : undefined) ??
    dialPart?.dimensions.diameterMm;

  // 2. Resolve case dial seat diameter
  const dialSeatInterface = geometry.interfaces.find((i) => i.kind === 'dial-seat');
  const casePart = findCaseBodyPart(assembly);
  const candidateCaseSpec = candidateItem?.engineeringSpecs?.case;

  const dialSeatDiameter =
    candidateCaseSpec?.dialSeatDiameterMm ??
    (casePart?.dimensions.diameterMm && casePart.dimensions.diameterMm > 30 ? 29.5 : undefined) ??
    (dialSeatInterface ? dialSeatInterface.radialSeatMm.outerRadiusMm * 2 + 2.1 : undefined);

  // Check 1: Missing dimensions
  if (typeof dialSeatDiameter !== 'number' || isNaN(dialSeatDiameter) || dialSeatDiameter <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'case-dial',
      summary: 'Case dial seat diameter is not specified; cannot verify dial fit.',
      evidence: ['Dial seat mechanical interface missing in case geometry.']
    });
    return results;
  }

  if (typeof dialDiameter !== 'number' || isNaN(dialDiameter) || dialDiameter <= 0) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'case-dial',
      summary: 'Dial outer diameter is missing.',
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
      evidence: ['Dial outer diameter dimension undefined.']
    });
    return results;
  }

  // Check 2: Radial dial seat fit
  const seatClearance = dialSeatDiameter - dialDiameter;
  if (seatClearance < -0.05) {
    // Dial is larger than case dial seat
    const diff = Math.abs(seatClearance);
    results.push({
      status: 'red',
      code: 'DIAL_EXCEEDS_DIAL_SEAT',
      category: 'case-dial',
      summary: `This dial is ${diff.toFixed(2)} mm larger than the current case dial seat (${dialSeatDiameter.toFixed(1)} mm vs ${dialDiameter.toFixed(1)} mm).`,
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
      affectedPartIds: dialPart ? [dialPart.instanceId] : undefined,
      expected: { value: dialSeatDiameter, unit: 'mm' },
      actual: { value: dialDiameter, unit: 'mm' },
      difference: diff,
      evidence: [
        `Case dial seat diameter: ${dialSeatDiameter.toFixed(2)} mm`,
        `Dial blank outer diameter: ${dialDiameter.toFixed(2)} mm`
      ]
    });
  } else if (seatClearance > 2.0) {
    // Dial is significantly undersized: would fall through rehaut or leave gaping aperture
    results.push({
      status: 'red',
      code: 'DIAL_UNDERSIZED_FOR_REHAUT',
      category: 'case-dial',
      summary: `Dial (${dialDiameter.toFixed(1)} mm) is too small for case aperture (${dialSeatDiameter.toFixed(1)} mm); gap of ${(seatClearance / 2).toFixed(2)} mm exceeds chapter ring overlap.`,
      expected: { value: dialSeatDiameter, unit: 'mm' },
      actual: { value: dialDiameter, unit: 'mm' },
      difference: seatClearance
    });
  } else {
    results.push({
      status: 'green',
      code: 'DIAL_SEAT_FIT_VALID',
      category: 'case-dial',
      summary: `Dial diameter (${dialDiameter.toFixed(1)} mm) properly seats within case rehaut rebate (${dialSeatDiameter.toFixed(1)} mm).`,
      expected: { value: dialSeatDiameter, unit: 'mm' },
      actual: { value: dialDiameter, unit: 'mm' },
      difference: seatClearance
    });
  }

  // Check 3: Dial feet position vs Movement
  const movement = getActiveMovement(assembly);
  const candidateCalibres = candidateDialSpec?.compatibleCalibres;
  const hasRemovableFeet = candidateDialSpec?.hasRemovableFeet ?? candidateItem?.metadata?.tags?.includes('removable-feet');

  if (movement && candidateCalibres && candidateCalibres.length > 0) {
    const isCalibreSupported = candidateCalibres.some((c) => c.toLowerCase() === movement.id.toLowerCase() || c.toLowerCase() === movement.name.toLowerCase());
    if (!isCalibreSupported) {
      if (hasRemovableFeet) {
        results.push({
          status: 'yellow',
          code: 'DIAL_FEET_PATTERN_MISMATCH',
          category: 'case-dial',
          summary: `Dial feet pattern does not match ${movement.name}, but dial has removable feet.`,
          remedy: {
            type: 'dial-feet-removal',
            title: 'Remove Dial Feet and Apply Adhesive Pads',
            description: 'Clip off incompatible dial feet with flush cutters and affix dial using horological dial dots / adhesive strips.',
            difficulty: 'moderate',
            reversible: false
          },
          evidence: [
            `Movement: ${movement.name}`,
            `Supported dial calibres: ${candidateCalibres.join(', ')}`
          ]
        });
      } else {
        results.push({
          status: 'red',
          code: 'DIAL_FEET_PATTERN_MISMATCH',
          category: 'case-dial',
          summary: `Dial mounting feet do not align with ${movement.name} plate apertures.`,
          evidence: [
            `Movement: ${movement.name}`,
            `Supported dial calibres: ${candidateCalibres.join(', ')}`
          ]
        });
      }
    }
  }

  return results;
};
