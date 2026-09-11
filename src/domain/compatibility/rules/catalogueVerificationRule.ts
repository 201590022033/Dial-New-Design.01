import type { CompatibilityCheckResult } from '../compatibilityTypes';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';

/**
 * Evaluates the provenance and verification status of a catalogue item.
 *
 * Items in 'draft' or 'ai-extracted' status contain unconfirmed engineering
 * dimensions and must yield 'unknown' rather than false-positive 'green'.
 */
export const checkCatalogueVerificationState = (
  candidateItem?: ComponentCatalogueItem
): CompatibilityCheckResult[] => {
  const results: CompatibilityCheckResult[] = [];

  if (!candidateItem) {
    return results;
  }

  const status = candidateItem.status;

  if (status === 'draft' || status === 'ai-extracted') {
    results.push({
      status: 'unknown',
      code: 'UNVERIFIED_CRITICAL_DIMENSION',
      category: 'verification-confidence',
      summary: `Component engineering data is ${status.toUpperCase()} and has not been independently verified; cannot certify physical fit.`,
      affectedCatalogueItemIds: [candidateItem.id],
      evidence: [
        `Catalogue Item: ${candidateItem.displayName} (${candidateItem.id})`,
        `Current verification status: "${status}"`,
        'Physical tolerance verification requires status "verified" or "published".'
      ]
    });
  } else if (status === 'reviewed') {
    results.push({
      status: 'green',
      code: 'PROVISIONAL_VERIFICATION',
      category: 'verification-confidence',
      summary: `Component has been reviewed with verified dimensions.`,
      affectedCatalogueItemIds: [candidateItem.id]
    });
  } else if (status === 'verified' || status === 'published') {
    results.push({
      status: 'green',
      code: 'CONFIRMED_VERIFICATION',
      category: 'verification-confidence',
      summary: `Component engineering data is officially verified (${status}).`,
      affectedCatalogueItemIds: [candidateItem.id]
    });
  }

  return results;
};
