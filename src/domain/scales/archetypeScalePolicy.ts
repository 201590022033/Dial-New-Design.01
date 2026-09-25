import type { ScaleProgram } from './scalePrograms';

export const scalePolicyForArchetype = (archetypeId?: string): { recommended: ScaleProgram | null; allowed: ScaleProgram[] } => {
  if (!archetypeId) return { recommended: null, allowed: ['diver', 'chrono', 'aviation', 'compass'] };
  if (archetypeId === 'archetype-dive') return { recommended: 'diver', allowed: ['diver'] };
  if (archetypeId === 'archetype-chronograph') return { recommended: 'chrono', allowed: ['chrono'] };
  if (archetypeId === 'archetype-pilot' || archetypeId === 'archetype-gmt-travel') return { recommended: 'aviation', allowed: ['aviation', 'compass'] };
  if (archetypeId === 'archetype-field' || archetypeId === 'archetype-casual') return { recommended: 'compass', allowed: ['compass', 'diver'] };
  return { recommended: null, allowed: [] };
};
