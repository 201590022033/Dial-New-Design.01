import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import type { AssemblyCompatibilityEvaluation } from '@/domain/compatibility/compatibilityTypes';
import type { BomCostLine, BuildReadiness, CostBreakdown } from './configuratorTypes';
import { listingPriceZar, listingShippingZar } from '@/domain/catalogue/pricing';
import { bomChoiceGroup, resolveBomChoices, crystalChoiceWarning } from './bomChoices';

export const calculateBomCost = (
  assembly: WatchAssembly,
  catalogueItems: ComponentCatalogueItem[],
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
  const lineItems: BomCostLine[] = [];
  const choices = resolveBomChoices(assembly, catalogueItems);
  const componentName = (kind: string, category: string) => {
    if (kind === 'case' || kind === 'midcase') return 'Case';
    if (kind === 'dial-blank') return 'Dial';
    if (kind === 'crystal' || kind.includes('sapphire')) return 'Crystal';
    if (kind === 'movement' || kind.startsWith('movement-pocket')) return 'Movement';
    if (kind.includes('bezel')) return 'Bezel';
    if (kind === 'chapter-ring') return 'Chapter ring';
    if (kind === 'caseback') return 'Caseback';
    if (kind.includes('strap') || kind.includes('bracelet')) return 'Strap / bracelet';
    return kind.replaceAll('-', ' ') || category;
  };
  const addLine = (part: typeof parts[number], listing: SupplierListing | undefined, selected: boolean, ids = [part.instanceId], set = false) => {
    const priceZar = listing ? listingPriceZar(listing) : null;
    const shippingZar = listing ? listingShippingZar(listing) : null;
    const item = catalogueItems.find(i => i.id === part.catalogueItemId);
    const choiceGroup = bomChoiceGroup(item?.kind ?? '');
    const included = choiceGroup ? choices[choiceGroup] === part.instanceId : ids.some(id => assembly.parts[id]?.visible);
    lineItems.push({ id: part.instanceId, partInstanceIds: ids, name: set ? item?.displayName ?? part.name : part.name,
      component: set ? 'Main hand set (hour, minute & seconds)' : componentName(item?.kind ?? '', part.category),
      priceZar, shippingZar, listingId: listing?.id, supplierName: listing?.supplierName,
      supplierSku: listing?.sku, productUrl: listing?.productUrl, alternativePriceNote: listing?.alternativePriceNote,
      nativePrice: listing?.unitPrice, currency: listing?.currency, lastCheckedIso: listing?.lastCheckedIso ?? undefined,
      included, choiceGroup, catalogueItemId: part.catalogueItemId, fitWarning: crystalChoiceWarning(assembly, catalogueItems, part.instanceId),
      status: priceZar === null ? 'unpriced' : selected ? 'selected' : 'estimate', visible: ids.some(id => assembly.parts[id]?.visible) });
    if (included && priceZar !== null) partsTotal += priceZar;
    if (included && listing) {
      if (shippingZar === null) shippingUnknownCount++;
      else shippingEstimate += shippingZar;
    }
  };

  for (const part of parts) {
    const setListings = supplierListings.filter(l => (l.catalogueItemId === part.catalogueItemId || l.replacementCatalogueItemId === part.catalogueItemId) && l.purchaseUnit === 'central-hand-set');
    if (centralHandIds.includes(part.instanceId) && (setListings.length || catalogueItems.find(i => i.id === part.catalogueItemId)?.kind === 'hand-set')) {
      if (countedHandSets.has(part.catalogueItemId)) continue;
      countedHandSets.add(part.catalogueItemId);
      // One commercial set supplies three engineering parts. An explicitly
      // selected unknown-price finish must not inherit another finish's price.
      const selection = centralHandIds.map(id => assembly.parts[id]?.catalogueItemId === part.catalogueItemId ? sourcingSelections[id] : null).find(Boolean);
      const listing = selection ? setListings.find(l => l.id === selection) : setListings.find(l => l.unitPrice !== null && !l.manualSelectionOnly);
      addLine(part, listing, Boolean(selection), centralHandIds.filter(id => assembly.parts[id]?.catalogueItemId === part.catalogueItemId), true);
      continue;
    }
    const selectedListingId = sourcingSelections[part.instanceId];
    if (selectedListingId) {
      const listing = supplierListings.find((l) => l.id === selectedListingId && (l.catalogueItemId === part.catalogueItemId || l.replacementCatalogueItemId === part.catalogueItemId));
      // An explicitly selected quote-only variant cannot borrow another price.
      addLine(part, listing, true);
      continue;
    }

    // Estimate from a matching priced listing, never imply verified fit or stock.
    const fallbackListings = supplierListings.filter(
      (l) => l.catalogueItemId === part.catalogueItemId && typeof l.unitPrice === 'number'
        && !l.manualSelectionOnly
        && (!l.caseFinish || l.caseFinish === (assembly.designConfig?.visualReferenceConfig?.caseFinish ?? 'steel'))
    );
    const firstListing = fallbackListings[0];
    addLine(part, firstListing, false);
  }
  if (!lineItems.some(line => line.component === 'Movement')) {
    const offers = supplierListings.filter(l => l.movementCalibre === assembly.metadata.movement);
    const selectedId = sourcingSelections['movement-calibre'];
    const listing = selectedId ? offers.find(l => l.id === selectedId) : offers.find(l => l.unitPrice !== null);
    const priceZar = listing ? listingPriceZar(listing) : null;
    const shippingZar = listing ? listingShippingZar(listing) : null;
    lineItems.push({ id: 'movement-calibre', partInstanceIds: [], name: `${assembly.metadata.movement.toUpperCase()} movement`, component: 'Movement',
      priceZar, shippingZar, status: priceZar === null ? 'unpriced' : selectedId ? 'selected' : 'estimate', visible: true, included: true,
      catalogueItemId: `movement-${assembly.metadata.movement}`, listingId: listing?.id, supplierName: listing?.supplierName, supplierSku: listing?.sku,
      nativePrice: listing?.unitPrice, currency: listing?.currency, lastCheckedIso: listing?.lastCheckedIso ?? undefined, productUrl: listing?.productUrl });
    partsTotal += priceZar ?? 0;
    if (listing) { if (shippingZar === null) shippingUnknownCount++; else shippingEstimate += shippingZar; }
  }

  // Import VAT reserve: SARS applies 15% to an added-tax value that includes a
  // 10% uplift for imports from outside the customs union. Product-specific
  // customs duty is deliberately excluded until the tariff heading is known.
  const dutiesAndTaxesEstimate = Math.round(partsTotal * 1.1 * 0.15);

  const grandTotal =
    partsTotal +
    shippingEstimate +
    dutiesAndTaxesEstimate +
    customFabrication;

  return {
    lineItems,
    partsTotal,
    shippingEstimate,
    shippingUnknownCount,
    dutiesAndTaxesEstimate,
    customFabricationEstimate: customFabrication,
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
