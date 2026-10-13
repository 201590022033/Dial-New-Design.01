import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import { designBriefErrors, designMatchResultErrors, type DesignBriefV1, type DesignMatchResultV1 } from './designBrief';
import { captureDesignBrief, designAssemblyIdentity, designPartSlot } from './designBriefExtraction';
import { findSelectedCase } from './caseConstraintAdapter';
import { readDesignIntent, type DesignIntentV1 } from './designIntent';
import { evaluateDesignCandidate } from './fitMatching';
import { rankDesignMatches } from './visualRanking';

export interface SearchDesignPartsOptions {
  readonly assembly: WatchAssembly;
  readonly brief: DesignBriefV1;
  readonly items: readonly ComponentCatalogueItem[];
  readonly supplierListings: readonly SupplierListing[];
  readonly intent?: DesignIntentV1;
}

const uniqueIds = (records: readonly { readonly id: string }[], description: string): void => {
  const ids = new Set<string>();
  for (const record of records) {
    if (!record.id.trim() || ids.has(record.id)) throw new Error(`Ambiguous ${description}: empty or duplicate ID ${record.id}.`);
    ids.add(record.id);
  }
};

const canonicalBrief = (brief: DesignBriefV1): string => JSON.stringify(brief, (_key, value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0))
    : value);

/** Read-only local catalogue search. A matching result never mutates a design or sources an order. */
export function searchDesignParts({ assembly, brief, items, supplierListings, intent = readDesignIntent(assembly) }: SearchDesignPartsOptions): readonly DesignMatchResultV1[] {
  uniqueIds(items, 'catalogue records');
  uniqueIds(supplierListings, 'supplier listings');
  const errors = designBriefErrors(brief, assembly, designAssemblyIdentity(assembly, intent, items));
  if (errors.length) throw new Error(`Capture a fresh search brief: ${errors.join(' ')}`);
  if (brief.mode !== intent.mode) throw new Error('Search brief mode differs from the current design preferences. Capture again.');
  const target = items.find(item => item.id === brief.target.catalogueItemId);
  if (!target || designPartSlot(target) !== brief.target.slot) throw new Error('Search target has no matching supported catalogue slot. Capture again.');
  if (brief.mode === 'selected-case') {
    const selected = findSelectedCase(assembly, items);
    if (!selected || selected.part.instanceId !== brief.selectedCase?.partInstanceId || selected.item.id !== brief.selectedCase.catalogueItemId) {
      throw new Error('Selected case reference is missing or stale. Capture again.');
    }
  }
  const expectedBrief = captureDesignBrief(assembly, brief.target.partInstanceId, items, intent);
  if (canonicalBrief(brief) !== canonicalBrief(expectedBrief)) {
    throw new Error('Search brief preferences, dimensions or permissions differ from the current captured design. Capture a fresh search brief.');
  }
  const candidates = items.filter(item => designPartSlot(item) === brief.target.slot)
    .sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  const results = candidates.map(candidate => {
    const result = evaluateDesignCandidate({ assembly, brief, candidate, items, supplierListings });
    const resultErrors = designMatchResultErrors(result);
    if (result.catalogueItemId !== candidate.id || result.briefIdentityToken !== brief.assembly.identityToken) resultErrors.push('Candidate or brief result reference differs from the search.');
    for (const listingId of result.supplierListingIds) {
      if (!supplierListings.some(listing => listing.id === listingId && listing.catalogueItemId === candidate.id)) resultErrors.push('Result refers to an unrelated supplier offer.');
    }
    if (resultErrors.length) throw new Error(`Invalid local search result: ${resultErrors.join(' ')}`);
    return result;
  });
  return rankDesignMatches(brief, results, items);
}
