import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { getActiveMovement } from '../compatibilityHelpers';

export interface HandColletSpec {
  handType: 'hour' | 'minute' | 'second';
  colletDiameterMm: number;
}

/**
 * Extracts collet diameters for a hands candidate item or assembly hand instances.
 */
export const extractHandColletSpec = (
  itemOrPart: ComponentCatalogueItem | { catalogueItemId?: string; kind?: string; name?: string; dimensions?: { thicknessMm: number; widthMm: number; diameterMm: number } },
  kindHint?: string
): HandColletSpec | undefined => {
  const name = ('displayName' in itemOrPart ? itemOrPart.displayName : itemOrPart.name ?? '').toLowerCase();
  const kind = ('kind' in itemOrPart && itemOrPart.kind ? itemOrPart.kind : kindHint ?? '').toLowerCase();
  const id = (
    'id' in itemOrPart && itemOrPart.id
      ? itemOrPart.id
      : 'catalogueItemId' in itemOrPart && itemOrPart.catalogueItemId
        ? itemOrPart.catalogueItemId
        : ''
  ).toLowerCase();

  // If item has explicit engineering specs:
  if ('engineeringSpecs' in itemOrPart && itemOrPart.engineeringSpecs?.hands) {
    const handSpec = itemOrPart.engineeringSpecs.hands;
    let handType: 'hour' | 'minute' | 'second' = 'hour';
    if (kind.includes('minute') || name.includes('minute')) handType = 'minute';
    else if (kind.includes('second') || name.includes('second')) handType = 'second';

    return {
      handType,
      colletDiameterMm: handSpec.colletDiameterMm
    };
  }

  // Parse from notes/metadata or known catalog IDs
  let handType: 'hour' | 'minute' | 'second' = 'hour';

  if (kind.includes('minute') || name.includes('minute')) {
    handType = 'minute';
  } else if (kind.includes('second') || name.includes('second')) {
    handType = 'second';
  }

  // Check if item metadata notes specify exact collet
  if ('metadata' in itemOrPart && itemOrPart.metadata?.notes) {
    const match = itemOrPart.metadata.notes.match(/(\d+\.?\d*)\s*mm\s*collet/i);
    if (match && match[1]) {
      return {
        handType,
        colletDiameterMm: parseFloat(match[1])
      };
    }
  }

  if (id === 'cat-hour-hand') return { handType: 'hour', colletDiameterMm: 1.50 };
  if (id === 'cat-minute-hand') return { handType: 'minute', colletDiameterMm: 0.90 };
  if (id === 'cat-central-seconds') return { handType: 'second', colletDiameterMm: 0.20 };

  return undefined;
};

/**
 * Checks arbor / collet hole compatibility between movement pinions and hands.
 */
export const checkMovementHandsCompatibility = (
  assembly: WatchAssembly,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];
  const movement = getActiveMovement(assembly);

  if (!movement) {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'movement-hands',
      summary: `Active movement template "${assembly.metadata.movement}" arbor specifications are unknown.`,
      evidence: ['Movement template not found in horological calibre library.']
    });
    return results;
  }

  const arborSizes = movement.handSizesMm;
  if (!arborSizes || typeof arborSizes.hour !== 'number' || typeof arborSizes.minute !== 'number' || typeof arborSizes.second !== 'number') {
    results.push({
      status: 'unknown',
      code: 'MISSING_REQUIRED_DIMENSION',
      category: 'movement-hands',
      summary: `Calibre "${movement.name}" lacks verified arbor pinion dimensions.`,
      evidence: ['Hour/minute/second arbor dimensions undefined.']
    });
    return results;
  }

  // If candidate is a hand item, test this candidate
  if (candidateItem && candidateItem.category === 'hands') {
    const handSpec = extractHandColletSpec(candidateItem);
    if (!handSpec || typeof handSpec.colletDiameterMm !== 'number' || isNaN(handSpec.colletDiameterMm)) {
      results.push({
        status: 'unknown',
        code: 'MISSING_REQUIRED_DIMENSION',
        category: 'movement-hands',
        summary: `Collet inner diameter is unknown for hand "${candidateItem.displayName}".`,
        affectedCatalogueItemIds: [candidateItem.id],
        evidence: ['Hand collet diameter missing from engineering specifications.']
      });
      return results;
    }

    const expectedArbor = arborSizes[handSpec.handType];
    const actualCollet = handSpec.colletDiameterMm;
    const diff = Math.abs(actualCollet - expectedArbor);

    if (diff > 0.02) {
      results.push({
        status: 'red',
        code: 'HAND_COLLET_MISMATCH',
        category: 'movement-hands',
        summary: `${handSpec.handType.charAt(0).toUpperCase() + handSpec.handType.slice(1)}-hand collet is ${actualCollet.toFixed(2)} mm; selected movement requires ${expectedArbor.toFixed(2)} mm.`,
        affectedCatalogueItemIds: [candidateItem.id],
        expected: { value: expectedArbor, unit: 'mm' },
        actual: { value: actualCollet, unit: 'mm' },
        difference: actualCollet - expectedArbor,
        evidence: [
          `Calibre: ${movement.name}`,
          `Required ${handSpec.handType} arbor: ${expectedArbor.toFixed(2)} mm`,
          `Actual hand collet: ${actualCollet.toFixed(2)} mm`
        ]
      });
    } else {
      results.push({
        status: 'green',
        code: 'HAND_COLLET_FIT_VALID',
        category: 'movement-hands',
        summary: `${handSpec.handType.charAt(0).toUpperCase() + handSpec.handType.slice(1)}-hand collet (${actualCollet.toFixed(2)} mm) perfectly fits ${movement.name} arbor (${expectedArbor.toFixed(2)} mm).`,
        affectedCatalogueItemIds: [candidateItem.id],
        expected: { value: expectedArbor, unit: 'mm' },
        actual: { value: actualCollet, unit: 'mm' },
        difference: 0
      });
    }
    return results;
  }

  // Otherwise, evaluate all hands present in the assembly
  const handParts = Object.values(assembly.parts).filter((p) => p.category === 'hands');
  if (handParts.length === 0) {
    return results;
  }

  for (const handPart of handParts) {
    const handSpec = extractHandColletSpec(handPart, handPart.name);
    if (!handSpec) continue;

    const expectedArbor = arborSizes[handSpec.handType];
    const actualCollet = handSpec.colletDiameterMm;
    const diff = Math.abs(actualCollet - expectedArbor);

    if (diff > 0.02) {
      results.push({
        status: 'red',
        code: 'HAND_COLLET_MISMATCH',
        category: 'movement-hands',
        summary: `${handSpec.handType.charAt(0).toUpperCase() + handSpec.handType.slice(1)}-hand collet is ${actualCollet.toFixed(2)} mm; selected movement requires ${expectedArbor.toFixed(2)} mm.`,
        affectedPartIds: [handPart.instanceId],
        expected: { value: expectedArbor, unit: 'mm' },
        actual: { value: actualCollet, unit: 'mm' },
        difference: actualCollet - expectedArbor,
        evidence: [
          `Part: ${handPart.name}`,
          `Calibre: ${movement.name}`,
          `Required arbor: ${expectedArbor.toFixed(2)} mm`,
          `Actual collet: ${actualCollet.toFixed(2)} mm`
        ]
      });
    } else {
      results.push({
        status: 'green',
        code: 'HAND_COLLET_FIT_VALID',
        category: 'movement-hands',
        summary: `${handSpec.handType.charAt(0).toUpperCase() + handSpec.handType.slice(1)}-hand collet (${actualCollet.toFixed(2)} mm) matches ${movement.name} arbor.`,
        affectedPartIds: [handPart.instanceId],
        expected: { value: expectedArbor, unit: 'mm' },
        actual: { value: actualCollet, unit: 'mm' },
        difference: 0
      });
    }
  }

  return results;
};
