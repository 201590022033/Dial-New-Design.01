import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import type { AssemblyCompatibilityEvaluation } from '@/domain/compatibility/compatibilityTypes';
import type { BuildReadiness, CostBreakdown } from './configuratorTypes';

export const calculateBomCost = (
  assembly: WatchAssembly,
  _catalogueItems: ComponentCatalogueItem[],
  supplierListings: SupplierListing[],
  sourcingSelections: Record<string, string | null>
): CostBreakdown => {
  let partsTotal = 0;
  const customFabrication = 0;

  const parts = Object.values(assembly.parts);

  for (const part of parts) {
    const selectedListingId = sourcingSelections[part.instanceId];
    if (selectedListingId) {
      const listing = supplierListings.find((l) => l.id === selectedListingId);
      if (listing && typeof listing.unitPrice === 'number' && !isNaN(listing.unitPrice)) {
        partsTotal += listing.unitPrice;
        continue;
      }
    }

    // Fallback to first available listing with a verified price
    const fallbackListings = supplierListings.filter(
      (l) => l.catalogueItemId === part.catalogueItemId && typeof l.unitPrice === 'number'
    );
    const firstListing = fallbackListings[0];
    if (firstListing && typeof firstListing.unitPrice === 'number') {
      partsTotal += firstListing.unitPrice;
    }
  }

  const shippingEstimate = parts.length > 0 ? 120 : 0;
  const dutiesAndTaxesEstimate = Math.round(partsTotal * 0.14);
  const watchmakerLabourEstimate = parts.length > 5 ? 450 : 200;

  const grandTotal =
    partsTotal +
    shippingEstimate +
    dutiesAndTaxesEstimate +
    customFabrication +
    watchmakerLabourEstimate;

  return {
    partsTotal,
    shippingEstimate,
    dutiesAndTaxesEstimate,
    customFabricationEstimate: customFabrication,
    watchmakerLabourEstimate,
    grandTotal
  };
};

export const calculateBuildReadiness = (
  assembly: WatchAssembly,
  _catalogueItems: ComponentCatalogueItem[],
  sourcingSelections: Record<string, string | null>,
  compatibilityEvaluation: AssemblyCompatibilityEvaluation,
  supplierListings: SupplierListing[] = []
): BuildReadiness => {
  const parts = Object.values(assembly.parts);
  let sourcedCount = 0;
  const customCount = 0;

  for (const part of parts) {
    const listingId = sourcingSelections[part.instanceId];
    const listings = supplierListings.filter((l) => l.catalogueItemId === part.catalogueItemId);

    if (listingId) {
      sourcedCount++;
    } else if (listings.length > 0) {
      sourcedCount++;
    }
  }

  const unresolvedCount =
    compatibilityEvaluation.counts.red + compatibilityEvaluation.counts.unknown;

  let readinessLabel = 'Ready to build';
  if (unresolvedCount > 0) {
    readinessLabel = 'Needs compatibility review';
  } else if (customCount > 0) {
    readinessLabel = 'Ready with custom fabrication';
  } else if (sourcedCount < parts.length) {
    readinessLabel = 'Needs sourcing';
  }

  return {
    sourcedCount,
    customCount,
    unresolvedCount,
    readinessLabel,
    issues: compatibilityEvaluation.checks.filter((c) => c.status !== 'green')
  };
};
