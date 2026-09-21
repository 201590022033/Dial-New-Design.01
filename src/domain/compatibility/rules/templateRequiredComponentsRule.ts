import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { getTemplateById } from '@/domain/generators/templateLibrary';

/**
 * Checks that the active template's required component kinds are visibly present
 * in the assembly (or supplied by the candidate item).
 */
export const checkTemplateRequiredComponents = (
  assembly: WatchAssembly,
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];
  const templateId = assembly.templateId;
  if (!templateId) return results;

  const template = getTemplateById(templateId as import('@/domain/generators/templateLibrary').TemplateId);
  if (!template) return results;

  const required = template.requiredComponentKinds;
  if (!required || required.length === 0) return results;

  const visibleParts = Object.values(assembly.parts).filter((p) => p.visible);
  const candidateKind = candidateItem?.kind;

  for (const kind of required) {
    const hasVisiblePart = visibleParts.some((p) => {
      const partKind = p.customProperties?.kind as string | undefined;
      return p.catalogueItemId === `cat-${kind}` || partKind === kind || p.name.toLowerCase().includes(kind.toLowerCase());
    });
    const candidateSatisfies = candidateKind === kind;

    if (hasVisiblePart || candidateSatisfies) {
      results.push({
        status: 'green',
        code: 'TEMPLATE_REQUIRED_COMPONENT_MISSING',
        category: 'template',
        summary: `Required component "${kind}" is present for the ${template.name} archetype.`,
        evidence: [`Template ${templateId} requires ${kind}`]
      });
    } else {
      results.push({
        status: 'red',
        code: 'TEMPLATE_REQUIRED_COMPONENT_MISSING',
        category: 'template',
        summary: `${template.name} archetype requires a "${kind}" component, but none is visible.`,
        evidence: [`Template ${templateId} lists ${kind} in requiredComponentKinds`],
        remedy: {
          type: 'custom-modification',
          title: `Add ${kind}`,
          description: `Add and make visible a ${kind} component to satisfy the ${template.name} archetype.`,
          difficulty: 'simple',
          reversible: true,
          referencePartKind: kind
        }
      });
    }
  }

  return results;
};
