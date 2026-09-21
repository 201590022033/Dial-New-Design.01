import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { getActiveMovement } from '../compatibilityHelpers';

/**
 * Checks that the case pusher configuration matches the active movement's pusher requirements.
 */
export const checkMovementPusherCompatibility = (
  assembly: WatchAssembly,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];
  const movement = getActiveMovement(assembly);

  // If a movement candidate is being evaluated, read its pusher spec.
  const candidateMovSpec = candidateItem?.engineeringSpecs?.movement;
  const movementPusherCount = candidateMovSpec?.pusherCount ?? movement?.pusherCount ?? 0;
  const movementPusherPositions = candidateMovSpec?.pusherPositionsDeg ?? movement?.pusherPositionsDeg ?? [];

  // Resolve case pusher count from the parametric case geometry or a visible pushers part.
  const casePart = assembly.parts['inst-midcase'];
  const caseParams = casePart?.parametricGeometry?.schema === 'parametric-case/v1' ? casePart.parametricGeometry : undefined;
  const casePusherCount = caseParams?.pusherCount ?? 0;

  const hasVisiblePushersPart = Object.values(assembly.parts).some(
    (p) => p.visible && (p.catalogueItemId === 'cat-pushers' || p.name.toLowerCase().includes('pusher'))
  );

  const effectiveCasePusherCount = Math.max(casePusherCount, hasVisiblePushersPart ? 1 : 0);

  if (movementPusherCount === 0 && effectiveCasePusherCount === 0) {
    results.push({
      status: 'green',
      code: 'PUSHER_CASE_FIT_VALID',
      category: 'movement-pusher',
      summary: 'Movement and case both specify no pushers.',
      evidence: ['pusherCount = 0 on movement and case']
    });
    return results;
  }

  if (movementPusherCount > 0 && effectiveCasePusherCount === 0) {
    results.push({
      status: 'red',
      code: 'PUSHER_COUNT_MISMATCH',
      category: 'movement-pusher',
      summary: `${movement?.name ?? 'Selected movement'} requires ${movementPusherCount} pusher(s), but the case has none.`,
      expected: { value: movementPusherCount, unit: 'count' },
      actual: { value: effectiveCasePusherCount, unit: 'count' },
      evidence: ['Movement pusherCount > 0; case pusherCount = 0']
    });
    return results;
  }

  if (movementPusherCount === 0 && effectiveCasePusherCount > 0) {
    results.push({
      status: 'yellow',
      code: 'PUSHER_COUNT_MISMATCH',
      category: 'movement-pusher',
      summary: 'Case has pushers but the selected movement requires none.',
      expected: { value: 0, unit: 'count' },
      actual: { value: effectiveCasePusherCount, unit: 'count' },
      evidence: ['Case pusherCount > 0; movement pusherCount = 0']
    });
    return results;
  }

  if (movementPusherCount !== effectiveCasePusherCount) {
    results.push({
      status: 'red',
      code: 'PUSHER_COUNT_MISMATCH',
      category: 'movement-pusher',
      summary: `Pusher count mismatch: movement requires ${movementPusherCount}, case provides ${effectiveCasePusherCount}.`,
      expected: { value: movementPusherCount, unit: 'count' },
      actual: { value: effectiveCasePusherCount, unit: 'count' },
      evidence: ['Movement pusherCount differs from case pusherCount']
    });
    return results;
  }

  // Counts match; report provisional/unknown until measured evidence is supplied.
  if (caseParams && movementPusherPositions.length > 0) {
    const layout = caseParams.pusherLayout;
    if (layout === 'none' && movementPusherCount > 0) {
      results.push({
        status: 'unknown',
        code: 'PUSHER_POSITION_UNKNOWN',
        category: 'movement-pusher',
        summary: 'Case pusher count matches movement but pusher layout is unspecified.',
        evidence: ['pusherLayout is none despite pusherCount > 0']
      });
    } else {
      results.push({
        status: 'green',
        code: 'PUSHER_CASE_FIT_VALID',
        category: 'movement-pusher',
        summary: `Pusher count matches (${movementPusherCount}); layout "${layout}" recorded.`,
        evidence: [`Movement positions: ${movementPusherPositions.join(', ')}°`, `Case layout: ${layout}`]
      });
    }
  } else {
    results.push({
      status: 'unknown',
      code: 'PUSHER_POSITION_UNKNOWN',
      category: 'movement-pusher',
      summary: 'Pusher positions or case pusher geometry are provisional; cannot verify fit.',
      evidence: ['Pusher geometry lacks measured provenance']
    });
  }

  return results;
};
