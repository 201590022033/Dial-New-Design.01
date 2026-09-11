import type {
  CommittedDecisionRecord,
  PracticalSensitivity,
  PracticalSensitivityKind
} from './configuratorTypes';
import type { SupplierListing } from '@/domain/catalogue/types';
import type { ReverseCandidateResult } from '@/domain/compatibility/compatibilityTypes';

/**
 * Calculates active practical sensitivities derived strictly from the current build's
 * committed decision history.
 *
 * Rules:
 * - Previews NEVER contribute to evidence.
 * - No rolling decay: evaluates accumulated decisions across the build.
 * - Suppressed sensitivities are respected and marked accordingly.
 */
export const calculatePracticalSensitivities = (
  decisions: CommittedDecisionRecord[],
  suppressedKinds: Set<PracticalSensitivityKind>
): PracticalSensitivity[] => {
  const sensitivities: PracticalSensitivity[] = [];

  if (decisions.length === 0) {
    return sensitivities;
  }

  // 1. Price Sensitivity: multiple decisions that reduced cost or selected lower-cost components
  const costReductions = decisions.filter((d) => d.costDelta < 0);
  if (costReductions.length >= 2 || (costReductions.length >= 1 && decisions.length <= 2)) {
    const totalSaved = Math.abs(costReductions.reduce((acc, d) => acc + d.costDelta, 0));
    sensitivities.push({
      kind: 'price-sensitive',
      label: 'Price sensitive',
      explanation: `${costReductions.length} committed component choice(s) reduced build cost by R${Math.round(totalSaved)}.`,
      suppressed: suppressedKinds.has('price-sensitive'),
      score: costReductions.length * 10
    });
  }

  // 2. Lead Time Sensitivity: choices favoring short lead times or standard verified stock
  const leadTimeDecisions = decisions.filter((d) => d.leadTimeDeltaDays < 0);
  if (leadTimeDecisions.length >= 2) {
    sensitivities.push({
      kind: 'lead-time-sensitive',
      label: 'Speed sensitive',
      explanation: `${leadTimeDecisions.length} committed parts prioritized faster dispatch.`,
      suppressed: suppressedKinds.has('lead-time-sensitive'),
      score: leadTimeDecisions.length * 8
    });
  }

  // 3. Supplier Count Sensitivity: choices favoring components with multiple alternate vendors
  const multiSupplierDecisions = decisions.filter((d) => d.supplierDelta > 0);
  if (multiSupplierDecisions.length >= 2) {
    sensitivities.push({
      kind: 'supplier-count-sensitive',
      label: 'Multi-supplier preferred',
      explanation: `Prioritizing components with independent redundant supply channels.`,
      suppressed: suppressedKinds.has('supplier-count-sensitive'),
      score: multiSupplierDecisions.length * 6
    });
  }

  // 4. Custom vs Sourced Sensitivity: choices avoiding custom manufacture
  const customAvoidance = decisions.filter((d) => !d.isCustomPart);
  if (customAvoidance.length >= 4) {
    sensitivities.push({
      kind: 'custom-manufacturing-sensitive',
      label: 'Standard components preferred',
      explanation: `Build emphasizes standardized off-the-shelf parts over bespoke fabrication.`,
      suppressed: suppressedKinds.has('custom-manufacturing-sensitive'),
      score: 15
    });
  }

  return sensitivities;
};

/**
 * Re-orders candidate options based on active practical sensitivities.
 * Deterministic compatibility ALWAYS takes precedence over practical sensitivities:
 * GREEN > YELLOW > UNKNOWN > RED
 * Within compatible brackets, options are quietly weighted by active sensitivities.
 */
export const rankCandidatesBySensitivity = (
  candidates: ReverseCandidateResult[],
  activeSensitivities: PracticalSensitivity[],
  supplierListings: SupplierListing[] = []
): ReverseCandidateResult[] => {
  const statusTier: Record<string, number> = {
    green: 4,
    yellow: 3,
    unknown: 2,
    red: 1
  };

  const isPriceSensitive = activeSensitivities.some(
    (s) => s.kind === 'price-sensitive' && !s.suppressed
  );
  const isSupplierCountSensitive = activeSensitivities.some(
    (s) => s.kind === 'supplier-count-sensitive' && !s.suppressed
  );

  return [...candidates].sort((a, b) => {
    // 1. Engineering compatibility tier (hard constraint)
    const tierA = statusTier[a.evaluation.status] ?? 0;
    const tierB = statusTier[b.evaluation.status] ?? 0;
    if (tierA !== tierB) {
      return tierB - tierA; // Higher tier first
    }

    // 2. Practical sensitivity weighting within the same compatibility tier
    if (isPriceSensitive) {
      const listingA = supplierListings.find(
        (l) => l.catalogueItemId === a.item.id && typeof l.unitPrice === 'number'
      );
      const priceA = listingA?.unitPrice ?? 9999;

      const listingB = supplierListings.find(
        (l) => l.catalogueItemId === b.item.id && typeof l.unitPrice === 'number'
      );
      const priceB = listingB?.unitPrice ?? 9999;

      if (priceA !== priceB) {
        return priceA - priceB; // Lower price first
      }
    }

    if (isSupplierCountSensitive) {
      const suppA = supplierListings.filter((l) => l.catalogueItemId === a.item.id).length;
      const suppB = supplierListings.filter((l) => l.catalogueItemId === b.item.id).length;
      if (suppA !== suppB) {
        return suppB - suppA; // Higher supplier count (easier sourcing) first
      }
    }

    return 0;
  });
};
