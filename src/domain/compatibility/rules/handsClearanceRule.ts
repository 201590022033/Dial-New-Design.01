import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ResolvedAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';

/**
 * Checks physical clearances for Hands:
 * 1. Radial clearance: hand tip length vs usable dial radius
 * 2. Axial clearance: total hand stack height vs crystal underside clearance
 */
export const checkHandsClearanceCompatibility = (
  _assembly: WatchAssembly,
  geometry: ResolvedAssemblyGeometry,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];

  // Usable dial radial span
  const dialSlot = geometry.contentSlots['dial-face-slot'];
  const dialRegion = geometry.regions.dial;
  const usableDialRadiusMm = dialSlot?.outerRadiusMm ?? dialRegion?.outerRadiusMm ?? 14.25;

  // Crystal underside clearance
  const crystalRegion = geometry.regions.crystal;
  const handsSlot = geometry.contentSlots['hands-clearance-slot'];

  // Axial clearance available above dial top
  const dialTopZ = dialRegion ? dialRegion.zBaseMm + dialRegion.axialThicknessMm : 0.4;
  const crystalBottomZ = crystalRegion ? crystalRegion.zBaseMm : (handsSlot ? handsSlot.zTopMm : undefined);

  // 1. Radial Check: Hand Length vs Dial Radius
  const candidateHandsSpec = candidateItem?.engineeringSpecs?.hands;
  const handCandidateLength = candidateHandsSpec?.lengthMm ??
    (candidateItem?.category === 'hands' ? candidateItem.nominalDimensions.diameterMm : undefined);

  if (typeof handCandidateLength === 'number' && handCandidateLength > 0) {
    const radialDiff = handCandidateLength - usableDialRadiusMm;
    if (radialDiff > 0.05) {
      results.push({
        status: 'red',
        code: 'HAND_LENGTH_EXCEEDS_DIAL_RADIUS',
        category: 'hands-clearance',
        summary: `Hand length (${handCandidateLength.toFixed(1)} mm) exceeds usable dial radius (${usableDialRadiusMm.toFixed(1)} mm) by ${radialDiff.toFixed(2)} mm.`,
        affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
        expected: { value: usableDialRadiusMm, unit: 'mm' },
        actual: { value: handCandidateLength, unit: 'mm' },
        difference: radialDiff,
        evidence: [
          `Hand tip reach: ${handCandidateLength.toFixed(2)} mm`,
          `Dial aperture radius: ${usableDialRadiusMm.toFixed(2)} mm`
        ]
      });
    } else {
      results.push({
        status: 'green',
        code: 'HAND_LENGTH_VALID',
        category: 'hands-clearance',
        summary: `Hand length (${handCandidateLength.toFixed(1)} mm) is safely within dial radius (${usableDialRadiusMm.toFixed(1)} mm).`,
        expected: { value: usableDialRadiusMm, unit: 'mm' },
        actual: { value: handCandidateLength, unit: 'mm' },
        difference: radialDiff
      });
    }
  }

  // 2. Axial Check: Hand Stack Height vs Crystal Underside
  if (typeof crystalBottomZ !== 'number' || isNaN(crystalBottomZ)) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'hands-clearance',
      summary: 'Compatibility cannot be verified because crystal underside height is unknown.',
      evidence: ['Crystal geometry datum missing in CAD assembly.']
    });
    return results;
  }

  const availableAxialClearanceMm = crystalBottomZ - dialTopZ;
  // Standard 3-hand stack nominal height (hour + minute + second + air gap)
  const requiredHandStackHeightMm = candidateHandsSpec?.stackHeightMm ?? 1.25;

  const axialMargin = availableAxialClearanceMm - requiredHandStackHeightMm;

  if (axialMargin < -0.3) {
    // Severe interference
    const diff = Math.abs(axialMargin);
    results.push({
      status: 'red',
      code: 'HAND_STACK_EXCEEDS_CRYSTAL_CLEARANCE',
      category: 'hands-clearance',
      summary: `Hand stack exceeds available crystal clearance by ${diff.toFixed(2)} mm.`,
      expected: { value: availableAxialClearanceMm, unit: 'mm' },
      actual: { value: requiredHandStackHeightMm, unit: 'mm' },
      difference: diff,
      evidence: [
        `Crystal underside datum: Z = ${crystalBottomZ.toFixed(2)} mm`,
        `Dial surface datum: Z = ${dialTopZ.toFixed(2)} mm`,
        `Available clearance: ${availableAxialClearanceMm.toFixed(2)} mm`,
        `Required hand stack height: ${requiredHandStackHeightMm.toFixed(2)} mm`
      ]
    });
  } else if (axialMargin < 0.1) {
    // Tight clearance - can be remedied with domed crystal or thicker crystal gasket
    const diff = Math.abs(axialMargin);
    results.push({
      status: 'yellow',
      code: 'HAND_STACK_TIGHT_CLEARANCE',
      category: 'hands-clearance',
      summary: `Hand stack clearance is tight (${availableAxialClearanceMm.toFixed(2)} mm available vs ${requiredHandStackHeightMm.toFixed(2)} mm required); requires domed crystal or thicker gasket.`,
      expected: { value: requiredHandStackHeightMm + 0.2, unit: 'mm' },
      actual: { value: availableAxialClearanceMm, unit: 'mm' },
      difference: diff,
      remedy: {
        type: 'domed-crystal-upgrade',
        title: 'Install Domed Crystal or High Gasket',
        description: 'Upgrade from flat sapphire to single/double domed crystal or install a +0.35mm crystal gasket to create clearance.',
        difficulty: 'simple',
        reversible: true
      },
      evidence: [
        `Available clearance: ${availableAxialClearanceMm.toFixed(2)} mm`,
        `Required clearance: ${requiredHandStackHeightMm.toFixed(2)} mm`
      ]
    });
  } else {
    results.push({
      status: 'green',
      code: 'HAND_STACK_CLEARANCE_VALID',
      category: 'hands-clearance',
      summary: `Hand stack clearance is verified (${availableAxialClearanceMm.toFixed(2)} mm available, ${(axialMargin).toFixed(2)} mm margin).`,
      expected: { value: requiredHandStackHeightMm, unit: 'mm' },
      actual: { value: availableAxialClearanceMm, unit: 'mm' },
      difference: axialMargin
    });
  }

  return results;
};
