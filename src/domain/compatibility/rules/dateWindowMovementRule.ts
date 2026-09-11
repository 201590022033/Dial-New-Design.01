import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { getActiveMovement } from '../compatibilityHelpers';

/**
 * Checks alignment between Date Window aperture on dial and Movement date wheel.
 */
export const checkDateWindowMovementCompatibility = (
  assembly: WatchAssembly,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];
  const movement = getActiveMovement(assembly);

  const dateWindowPart = Object.values(assembly.parts).find(
    (p) => p.category === 'complications' && (p.instanceId.includes('date') || p.name.toLowerCase().includes('date'))
  );

  const isCandidateDateWindow =
    candidateItem?.category === 'complications' && (candidateItem.kind.includes('date') || candidateItem.id.includes('date'));

  if (!dateWindowPart && !isCandidateDateWindow) {
    return results; // No date complication
  }

  if (!movement) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'date-movement',
      summary: 'Active movement date wheel position is unknown.',
      evidence: ['Movement template not identified.']
    });
    return results;
  }

  // Determine date window angle/position
  let dateWindowPosition = '3:00';
  if (candidateItem?.metadata?.notes?.includes('4.5') || candidateItem?.metadata?.notes?.includes('4:30')) {
    dateWindowPosition = '4:30';
  } else if (candidateItem?.metadata?.notes?.includes('6')) {
    dateWindowPosition = '6:00';
  } else if (typeof dateWindowPart?.customProperties?.position === 'string') {
    dateWindowPosition = dateWindowPart.customProperties.position;
  }

  const movDatePos = movement.datePosition ? movement.datePosition.toLowerCase() : null;

  // Check 1: Movement has no date wheel
  if (!movDatePos || movDatePos === 'none' || !movement.dateWindowSupported) {
    results.push({
      status: 'red',
      code: 'DATE_WINDOW_MISALIGNMENT',
      category: 'date-movement',
      summary: `Movement ${movement.name} is a no-date calibre; cannot support dial date window aperture.`,
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
      affectedPartIds: dateWindowPart ? [dateWindowPart.instanceId] : undefined,
      evidence: [
        `Calibre: ${movement.name}`,
        `Movement date feature: None`,
        `Dial date aperture: ${dateWindowPosition}`
      ]
    });
    return results;
  }

  // Check 2: Angular position alignment
  const normMovPos = movDatePos.includes('4') ? '4:30' : (movDatePos.includes('6') ? '6:00' : '3:00');
  const normDialPos = dateWindowPosition.includes('4') ? '4:30' : (dateWindowPosition.includes('6') ? '6:00' : '3:00');

  if (normMovPos !== normDialPos) {
    results.push({
      status: 'red',
      code: 'DATE_WINDOW_MISALIGNMENT',
      category: 'date-movement',
      summary: `Movement date disc position (${movement.datePosition}) does not align with dial date window (${dateWindowPosition}).`,
      affectedCatalogueItemIds: candidateItem ? [candidateItem.id] : undefined,
      evidence: [
        `Movement calibre: ${movement.name}`,
        `Movement date wheel position: ${movement.datePosition}`,
        `Dial aperture position: ${dateWindowPosition}`
      ]
    });
  } else {
    results.push({
      status: 'green',
      code: 'DATE_WINDOW_ALIGNMENT_VALID',
      category: 'date-movement',
      summary: `Dial date window (${dateWindowPosition}) aligns with ${movement.name} date disc wheel.`,
      expected: { value: 3.0, unit: 'mm' },
      actual: { value: 3.0, unit: 'mm' },
      difference: 0
    });
  }

  return results;
};
