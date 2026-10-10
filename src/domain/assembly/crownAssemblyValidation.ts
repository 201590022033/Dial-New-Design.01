import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { assertCrownAxis, assertCrownChoice, assertCrownSpecification } from '@/domain/crown';
import type { WatchAssembly, WatchAssemblyPartInstance } from './assemblyTypes';

/** Only applies to opt-in crown contracts; legacy documents are never rewritten. */
export const assertAssemblyCrownContracts = (assembly: WatchAssembly): void => {
  const axes = new Set<string>();
  const heads = new Set<string>();
  const parts = Object.values(assembly.parts);
  const kind = (part: WatchAssemblyPartInstance) => getCatalogueItem(part.catalogueItemId)?.kind;
  const isCase = (part: WatchAssemblyPartInstance) => kind(part) ? ['case', 'midcase'].includes(kind(part)!) : part.visual?.category === 'case';
  const isCrown = (part: WatchAssemblyPartInstance) => kind(part) ? kind(part) === 'crown' : part.visual?.category === 'crown';
  for (const part of parts) {
    if (part.crownAxes !== undefined) {
      if (!isCase(part)) throw new Error('Crown axes must belong to a case part');
      if (part.visual && part.visual.category !== 'case') throw new Error('Case crown axes conflict with visual component category');
      if (!Array.isArray(part.crownAxes) || part.crownAxes.length === 0) throw new Error('Crown axes must be a non-empty array');
      for (const axis of part.crownAxes) {
        assertCrownAxis(axis);
        if (axes.has(axis.axisId)) throw new Error(`Duplicate crown axis: ${axis.axisId}`);
        axes.add(axis.axisId);
      }
    }
  }
  for (const part of parts) {
    if (part.crownSpecification !== undefined) {
      if (!isCrown(part)) throw new Error('Crown specification must belong to an operating crown part');
      if (part.visual && part.visual.category !== 'crown') throw new Error('Crown specification conflicts with visual component category');
      assertCrownSpecification(part.crownSpecification);
      const axisId = part.crownSpecification.axisId;
      if (!axes.has(axisId)) throw new Error(`Crown references missing case axis: ${axisId}`);
      if (part.visual?.crownAxisId !== undefined && part.visual.crownAxisId !== axisId) throw new Error('Crown visual binding conflicts with specification axis');
    } else if (part.visual?.crownAxisId !== undefined) {
      if (!isCrown(part) || !axes.has(part.visual.crownAxisId)) throw new Error('Crown visual binding references missing case axis');
    }
    if (axes.size > 0 && isCrown(part)) {
      // Count hidden and legacy heads too: hide/reveal must not create a second owner.
      const axisId = part.crownSpecification?.axisId ?? part.visual?.crownAxisId ?? (axes.size === 1 ? [...axes][0] : undefined);
      if (!axisId) throw new Error('Operating crown requires an explicit axis on a multiple-axis case');
      if (heads.has(axisId)) throw new Error(`Multiple operating crown heads on axis: ${axisId}`);
      heads.add(axisId);
    }
  }
  const choice = assembly.designConfig?.crownChoice;
  if (choice !== undefined) {
    assertCrownChoice(choice);
    if (choice.selected) {
      const selected = assembly.parts[choice.selected.crownInstanceId];
      if (!selected || !isCrown(selected)) throw new Error('Saved crown choice references missing or non-crown part');
    }
  }
};
