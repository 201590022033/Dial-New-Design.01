import { getCatalogueItem, getCatalogueItemByKind } from './catalogueRegistry';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';

/**
 * CatalogueReferenceError
 * Explicit structured error thrown when an assembly part instance references an
 * unresolvable, unknown, or deleted catalogue item ID.
 * Silent fabrication of kinds, materials, or geometry is strictly prohibited.
 */
export class CatalogueReferenceError extends Error {
  readonly code = 'UNRESOLVED_CATALOGUE_REFERENCE';
  readonly instanceId: string;
  readonly catalogueItemId: string;

  constructor(instanceId: string, catalogueItemId: string, message?: string) {
    super(
      message ??
        `Catalogue reference error: Part instance "${instanceId}" references unknown or unresolvable catalogue item "${catalogueItemId}".`
    );
    this.name = 'CatalogueReferenceError';
    this.instanceId = instanceId;
    this.catalogueItemId = catalogueItemId;
  }
}

export interface CatalogueValidationReport {
  valid: boolean;
  errors: CatalogueReferenceError[];
  unresolvedInstanceIds: string[];
}

/**
 * Validates that all catalogueItemId references within a WatchAssembly resolve to
 * real registered catalogue items.
 */
export const validateAssemblyCatalogueReferences = (
  assembly: WatchAssembly
): CatalogueValidationReport => {
  const errors: CatalogueReferenceError[] = [];
  const unresolvedInstanceIds: string[] = [];

  for (const [instanceId, instance] of Object.entries(assembly.parts)) {
    if (!instance.catalogueItemId || instance.catalogueItemId.trim() === '') {
      errors.push(
        new CatalogueReferenceError(
          instanceId,
          '',
          `Part instance "${instanceId}" has no catalogueItemId specified.`
        )
      );
      unresolvedInstanceIds.push(instanceId);
      continue;
    }

    const item = getCatalogueItem(instance.catalogueItemId);
    if (!item) {
      errors.push(new CatalogueReferenceError(instanceId, instance.catalogueItemId));
      unresolvedInstanceIds.push(instanceId);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    unresolvedInstanceIds
  };
};

/**
 * Throws a CatalogueReferenceError if any catalogue item references are unresolvable.
 */
export const assertAssemblyCatalogueReferences = (assembly: WatchAssembly): void => {
  const report = validateAssemblyCatalogueReferences(assembly);
  const firstError = report.errors[0];
  if (firstError instanceof Error) {
    throw firstError;
  }
};

/**
 * Maps known legacy component identifiers (e.g. 'watch-component-hour-hand', 'dial-blank')
 * to canonical catalogue IDs. Returns null if unknown.
 * Does NOT invent synthetic catalogue items for unknown components.
 */
export const mapLegacyComponentToCatalogueId = (legacyIdentifier: string): string | null => {
  if (!legacyIdentifier || typeof legacyIdentifier !== 'string') {
    return null;
  }

  // Exact catalogue ID match
  if (getCatalogueItem(legacyIdentifier)) {
    return legacyIdentifier;
  }

  // Strip common legacy prefixes
  const normalized = legacyIdentifier
    .replace(/^watch-component-/, '')
    .replace(/^inst-/, '')
    .toLowerCase()
    .trim();

  // Try lookup by component kind
  const itemByKind = getCatalogueItemByKind(normalized);
  if (itemByKind) {
    return itemByKind.id;
  }

  // Known legacy aliases
  const legacyAliases: Record<string, string> = {
    'dial': 'cat-dial-blank',
    'dial-face': 'cat-dial-blank',
    'hour': 'cat-hour-hand',
    'minute': 'cat-minute-hand',
    'second': 'cat-second-hand',
    'bezel': 'cat-rotating-bezel',
    'outer-bezel': 'cat-rotating-bezel',
    'chapter': 'cat-chapter-ring',
    'ring': 'cat-chapter-ring',
    'case-body': 'cat-case-cushion',
    'crystal': 'cat-double-domed-sapphire'
  };

  const aliasMatch = legacyAliases[normalized];
  if (aliasMatch && getCatalogueItem(aliasMatch)) {
    return aliasMatch;
  }

  return null;
};
