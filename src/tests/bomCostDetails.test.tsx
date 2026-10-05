import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { defaultCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import { supplierExpansionCandidateListings } from '@/domain/catalogue/supplierExpansionCandidates';
import { calculateBomCost } from '@/domain/configurator/bomCostCalculator';
import { BomCostLines } from '@/components/configurator/BomCostLines';
import { formatBomZar } from '@/domain/catalogue/pricing';
import { researchedSupplierListings } from '@/domain/catalogue/researchedSupplierListings';
import { visualVariantCatalogueItems } from '@/domain/catalogue/visualVariantCatalogue';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { crystalChoiceWarning } from '@/domain/configurator/bomChoices';

const fixture = () => {
  const assembly = createDefaultWatchAssembly();
  const kinds = ['midcase', 'dial-blank', 'crystal'];
  const parts = Object.values(assembly.parts).filter(p => kinds.includes(defaultCatalogueItems.find(i => i.id === p.catalogueItemId)?.kind ?? ''));
  assembly.parts = Object.fromEntries(parts.map(p => [p.instanceId, p]));
  assembly.partOrder = parts.map(p => p.instanceId);
  const listings = parts.map((p, i) => ({ ...supplierExpansionCandidateListings[0]!, id: `test-offer-${i}`, catalogueItemId: p.catalogueItemId,
    unitPrice: [500, 200, 100][i]!, currency: 'ZAR', shippingPrice: i === 0 ? 50 : null, shippingCurrency: 'ZAR' }));
  return { assembly, listings };
};

describe('individual BOM component prices', () => {
  it('rejects a known crystal diameter mismatch without declaring draft case dimensions a verified fit', () => {
    const assembly = createStarterBuild('ladies-dress', createDefaultWatchAssembly()).assembly;
    const items = [...defaultCatalogueItems, ...visualVariantCatalogueItems];
    expect(crystalChoiceWarning(assembly, items, 'inst-flat-sapphire')).toContain('Fit unverified');
    const verifiedItems = items.map(i => i.id === 'cat-case-nh05-ladies-dress-34' ? { ...i, status: 'verified' as const } : i);
    expect(crystalChoiceWarning(assembly, verifiedItems, 'inst-flat-sapphire')).toContain('Does not match');
  });
  it('counts only one crystal and excludes alternate prices and shipping from every total', () => {
    const assembly = createDefaultWatchAssembly();
    const parts = Object.values(assembly.parts).filter(p => p.instanceId === 'inst-crystal' || p.instanceId === 'inst-flat-sapphire');
    assembly.parts = Object.fromEntries(parts.map(p => [p.instanceId, p]));
    const offers = parts.map((p, index) => ({ ...supplierExpansionCandidateListings[0]!, id: `crystal-${index}`, catalogueItemId: p.catalogueItemId,
      unitPrice: index ? 500 : 100, currency: 'ZAR', shippingPrice: index ? 50 : 10, shippingCurrency: 'ZAR' }));
    const before = calculateBomCost(assembly, defaultCatalogueItems, offers, {});
    expect(before.partsTotal).toBe(100);
    expect(before.shippingEstimate).toBe(10);
    expect(before.lineItems.find(l => l.name === 'Flat Sapphire')?.included).toBe(false);
    assembly.designConfig = { ...assembly.designConfig, bomPartSelections: { crystal: 'inst-flat-sapphire' } };
    const restored = deserializeWatchAssembly(serializeWatchAssembly(assembly));
    const after = calculateBomCost(restored, defaultCatalogueItems, offers, {});
    expect(after.partsTotal).toBe(500);
    expect(after.shippingEstimate).toBe(50);
    expect(after.lineItems.filter(l => l.choiceGroup === 'crystal' && l.included)).toHaveLength(1);
    expect(after.partsTotal).toBe(after.lineItems.reduce((sum, line) => sum + (line.included ? line.priceZar ?? 0 : 0), 0));
  });
  it('prices NH05 movement once and exposes deliberate hand/dial alternatives without silently substituting them', () => {
    const assembly = createStarterBuild('ladies-dress', createDefaultWatchAssembly()).assembly;
    const items = [...defaultCatalogueItems, ...visualVariantCatalogueItems];
    const before = calculateBomCost(assembly, items, researchedSupplierListings, {});
    expect(before.lineItems.find(l => l.component === 'Movement')).toMatchObject({ nativePrice: 75, supplierName: 'Sofly' });
    expect(before.lineItems.filter(l => l.component.startsWith('Main hand set'))).toHaveLength(1);
    expect(before.lineItems.find(l => l.component === 'Dial')?.priceZar).toBeNull();
    const after = calculateBomCost(assembly, items, researchedSupplierListings, {
      'inst-dial-blank': 'budget-tandorio-nh05-dial-white-for-champagne',
      'inst-hour-hand': 'budget-tandorio-nh05-hands-rose-for-dress'
    });
    expect(after.lineItems.find(l => l.component === 'Dial')).toMatchObject({ nativePrice: 13.28, status: 'selected' });
    expect(after.lineItems.find(l => l.component.startsWith('Main hand set'))).toMatchObject({ nativePrice: 9.08, status: 'selected' });
    expect(after.partsTotal - before.partsTotal).toBeCloseTo((13.28 + 9.08) * 16.3007);
  });
  it('prices the rose NH05 case as a labelled alternative without borrowing its price for steel', () => {
    const { assembly } = fixture();
    const part = Object.values(assembly.parts)[0]!;
    part.catalogueItemId = 'cat-case-nh05-ladies-dress-34';
    assembly.parts = { [part.instanceId]: part };
    assembly.designConfig = { ...assembly.designConfig, visualReferenceConfig: { caseFinish: 'rose-gold' } };
    const cost = calculateBomCost(assembly, visualVariantCatalogueItems, researchedSupplierListings, {});
    const line = cost.lineItems.find(l => l.component === 'Case')!;
    expect(line).toMatchObject({ nativePrice: 75.52, supplierSku: '16-case / 50684934586653', status: 'estimate', shippingZar: null });
    expect(line.alternativePriceNote).toContain('not a verified match');
    expect(renderToStaticMarkup(<BomCostLines cost={cost} />)).toContain('Budget alternative only');
    assembly.designConfig.visualReferenceConfig!.caseFinish = 'steel';
    expect(calculateBomCost(assembly, visualVariantCatalogueItems, researchedSupplierListings, {}).lineItems[0]?.priceZar).toBeNull();
  });
  it('keeps case, dial and crystal separate and reconciles their prices to the parts subtotal', () => {
    const { assembly, listings } = fixture();
    const cost = calculateBomCost(assembly, defaultCatalogueItems, listings, {});
    expect(cost.lineItems.filter(l => l.priceZar !== null).map(l => l.component).sort()).toEqual(['Case', 'Crystal', 'Dial']);
    expect(cost.lineItems.reduce((sum, l) => sum + (l.priceZar ?? 0), 0)).toBe(cost.partsTotal);
    expect(cost.partsTotal).toBe(800);
    expect(cost.shippingEstimate).toBe(50);
    expect(cost.shippingUnknownCount).toBe(2);
    expect(cost.grandTotal).toBe(cost.partsTotal + cost.shippingEstimate + cost.dutiesAndTaxesEstimate + cost.customFabricationEstimate);
    expect(cost).not.toHaveProperty('watchmakerLabourEstimate');
    expect(cost.lineItems.find(l => l.component === 'Movement')).toMatchObject({ priceZar: null, name: 'NH35 movement' });
  });
  it('does not substitute a cheap fallback for a selected quote-only variant', () => {
    const { assembly, listings } = fixture();
    const selected = { ...listings[0]!, id: 'quote-only', unitPrice: null };
    const partId = assembly.partOrder[0]!;
    const cost = calculateBomCost(assembly, defaultCatalogueItems, [...listings, selected], { [partId]: selected.id });
    expect(cost.lineItems.find(l => l.id === partId)).toMatchObject({ priceZar: null, listingId: selected.id, status: 'unpriced' });
    expect(cost.partsTotal).toBe(300);
  });
  it('renders item prices, sourcing status, timestamps and unknown shipping explicitly', () => {
    const { assembly, listings } = fixture();
    const cost = calculateBomCost(assembly, defaultCatalogueItems, listings, {});
    const html = renderToStaticMarkup(<BomCostLines cost={cost} />);
    for (const label of ['Case', 'Dial', 'Crystal', 'Movement', formatBomZar(500), formatBomZar(200), formatBomZar(100), 'Price unknown', 'not selected', 'Checked:', 'Shipping:', 'Unknown — verify before buying', 'Rand conversion snapshot:']) expect(html).toContain(label);
  });
});
