import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import type { AssemblyCompatibilityEvaluation } from '@/domain/compatibility/compatibilityTypes';
import type { BuildReadiness, CostBreakdown } from './configuratorTypes';
import { listingPriceZar, listingShippingZar } from '@/domain/catalogue/pricing';

export const calculateBomCost = (
  assembly: WatchAssembly,
  _catalogueItems: ComponentCatalogueItem[],
  supplierListings: SupplierListing[],
  sourcingSelections: Record<string, string | null>
): CostBreakdown => {
  let partsTotal = 0;
  let shippingEstimate = 0;
  let shippingUnknownCount = 0;
  const customFabrication = 0;

  const parts = Object.values(assembly.parts);
  const countedHandSets = new Set<string>();
  const centralHandIds = ['inst-hour-hand', 'inst-minute-hand', 'inst-central-seconds'];

  for (const part of parts) {
    const setListings = supplierListings.filter(l => l.catalogueItemId === part.catalogueItemId && l.purchaseUnit === 'central-hand-set');
    if (centralHandIds.includes(part.instanceId) && setListings.length) {
      if (countedHandSets.has(part.catalogueItemId)) continue;
      countedHandSets.add(part.catalogueItemId);
      // One commercial set supplies three engineering parts. An explicitly
      // selected unknown-price finish must not inherit another finish's price.
      const selection = centralHandIds.map(id => assembly.parts[id]?.catalogueItemId === part.catalogueItemId ? sourcingSelections[id] : null).find(Boolean);
      const listing = selection ? setListings.find(l => l.id === selection) : setListings.find(l => l.unitPrice !== null);
      if (listing) {
        partsTotal += listingPriceZar(listing) ?? 0;
        const shipping = listingShippingZar(listing);
        if (shipping === null) shippingUnknownCount++;
        else shippingEstimate += shipping;
      }
      continue;
    }
    const selectedListingId = sourcingSelections[part.instanceId];
    if (selectedListingId) {
      const listing = supplierListings.find((l) => l.id === selectedListingId);
      const priceZar = listing ? listingPriceZar(listing) : null;
      if (listing && priceZar !== null) {
        partsTotal += priceZar;
        const shippingZar = listingShippingZar(listing);
        if (shippingZar === null) shippingUnknownCount++;
        else shippingEstimate += shippingZar;
        continue;
      }
    }

    // Fallback to first available listing with a verified price
    const fallbackListings = supplierListings.filter(
      (l) => l.catalogueItemId === part.catalogueItemId && typeof l.unitPrice === 'number'
    );
    const firstListing = fallbackListings[0];
    if (firstListing) {
      const priceZar = listingPriceZar(firstListing);
      if (priceZar !== null) partsTotal += priceZar;
      const shippingZar = listingShippingZar(firstListing);
      if (shippingZar === null) shippingUnknownCount++;
      else shippingEstimate += shippingZar;
    }
  }

  // Import VAT reserve: SARS applies 15% to an added-tax value that includes a
  // 10% uplift for imports from outside the customs union. Product-specific
  // customs duty is deliberately excluded until the tariff heading is known.
  const dutiesAndTaxesEstimate = Math.round(partsTotal * 1.1 * 0.15);
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
    shippingUnknownCount,
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
